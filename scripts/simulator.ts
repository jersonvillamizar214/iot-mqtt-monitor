import mqtt from "mqtt";
import { MACHINES, nextReading } from "../src/lib/telemetry";
import { BROKER_TCP, QOS, telemetryTopic } from "../src/lib/mqtt-config";

// Stands in for the plant's PLCs / edge gateway: connects to the broker over
// plain TCP and publishes one telemetry message per machine every 2 seconds.
const INTERVAL_MS = 2000;

const client = mqtt.connect(BROKER_TCP, {
  clientId: `simulator-${Math.random().toString(16).slice(2, 10)}`,
  reconnectPeriod: 2000,
});

client.on("connect", () => {
  console.log(`Conectado a ${BROKER_TCP}`);
  console.log(`Publicando ${MACHINES.length} máquinas cada ${INTERVAL_MS}ms\n`);

  setInterval(() => {
    for (const machine of MACHINES) {
      const reading = nextReading(machine.id);
      client.publish(telemetryTopic(machine.id), JSON.stringify(reading), {
        qos: QOS,
      });
      console.log(
        `${machine.id.padEnd(14)} ${reading.temperature}°C  ${reading.pressure}bar  ` +
          `${reading.vibration}mm/s  ${reading.power}kW`
      );
    }
    console.log("");
  }, INTERVAL_MS);
});

client.on("error", (err) => console.error("MQTT error:", err.message));

process.on("SIGINT", () => {
  console.log("\nCerrando…");
  client.end(true, () => process.exit(0));
});
