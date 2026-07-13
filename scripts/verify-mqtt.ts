import mqtt from "mqtt";
import { MACHINES, nextReading, type Reading } from "../src/lib/telemetry";
import {
  BROKER_TCP,
  QOS,
  TELEMETRY_WILDCARD,
  telemetryTopic,
} from "../src/lib/mqtt-config";

// Round-trip test: publish one reading per machine and assert the broker
// delivers each one back through the wildcard subscription the dashboard uses.
// Run with `npm run verify` (needs internet — it talks to the public broker).

const TIMEOUT_MS = 15_000;

async function main() {
  const client = mqtt.connect(BROKER_TCP, {
    clientId: `verify-${Math.random().toString(16).slice(2, 10)}`,
  });

  const received = new Map<string, Reading>();

  const done = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new Error(
            `Timeout: solo llegaron ${received.size}/${MACHINES.length} lecturas`
          )
        ),
      TIMEOUT_MS
    );

    client.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });

    client.on("connect", () => {
      console.log(`Conectado a ${BROKER_TCP}`);

      client.subscribe(TELEMETRY_WILDCARD, { qos: QOS }, (err) => {
        if (err) return reject(err);
        console.log(`Suscrito a ${TELEMETRY_WILDCARD}\n`);

        for (const machine of MACHINES) {
          const reading = nextReading(machine.id);
          client.publish(telemetryTopic(machine.id), JSON.stringify(reading), {
            qos: QOS,
          });
          console.log(`  → publicado ${machine.id}`);
        }
      });
    });

    client.on("message", (topic, payload) => {
      let reading: Reading;
      try {
        reading = JSON.parse(payload.toString());
      } catch {
        return; // public broker — ignore foreign traffic
      }
      if (!reading?.machineId) return;
      if (!MACHINES.some((m) => m.id === reading.machineId)) return;

      if (!received.has(reading.machineId)) {
        received.set(reading.machineId, reading);
        console.log(
          `  ← recibido ${reading.machineId} (${reading.temperature}°C) en ${topic}`
        );
      }

      if (received.size === MACHINES.length) {
        clearTimeout(timer);
        resolve();
      }
    });
  });

  try {
    await done;
    console.log(
      `\n  ok  ${received.size}/${MACHINES.length} máquinas: publish → broker → subscribe`
    );

    // The payload must survive the round trip intact.
    for (const [id, reading] of received) {
      const fields = ["temperature", "pressure", "vibration", "power"] as const;
      for (const field of fields) {
        if (typeof reading[field] !== "number" || Number.isNaN(reading[field])) {
          throw new Error(`Lectura inválida de ${id}: ${field}=${reading[field]}`);
        }
      }
    }
    console.log("  ok  todas las lecturas tienen los 4 sensores válidos");
    console.log("\nMQTT verificado.");
  } finally {
    client.end(true);
  }
}

main().catch((e) => {
  console.error("\nFALLÓ:", e.message);
  process.exit(1);
});
