"use client";

import { useEffect, useRef, useState } from "react";
import mqtt, { type MqttClient } from "mqtt";
import Sparkline from "./Sparkline";
import {
  BROKER_WS,
  QOS,
  TELEMETRY_WILDCARD,
  TOPIC_PREFIX,
  telemetryTopic,
} from "@/lib/mqtt-config";
import {
  MACHINES,
  SENSORS,
  THRESHOLDS,
  type Level,
  type Reading,
  levelFor,
  machineLevel,
  nextReading,
} from "@/lib/telemetry";

const HISTORY = 30; // samples kept per machine

type Status = "connecting" | "online" | "offline";

interface Alarm {
  id: string;
  machineId: string;
  sensor: string;
  value: number;
  level: Level;
  ts: number;
}

const LEVEL_TEXT: Record<Level, string> = {
  ok: "text-slate-300",
  warn: "text-amber-300",
  crit: "text-rose-300",
};
const LEVEL_DOT: Record<Level, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  crit: "bg-rose-500",
};
const LEVEL_LABEL: Record<Level, string> = {
  ok: "Normal",
  warn: "Alerta",
  crit: "Crítico",
};

export default function MqttDashboard() {
  const [status, setStatus] = useState<Status>("connecting");
  const [history, setHistory] = useState<Record<string, Reading[]>>({});
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [simulating, setSimulating] = useState(true);
  const [messageCount, setMessageCount] = useState(0);

  const clientRef = useRef<MqttClient | null>(null);

  // ── Subscribe ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const client = mqtt.connect(BROKER_WS, {
      clientId: `dashboard-${Math.random().toString(16).slice(2, 10)}`,
      reconnectPeriod: 3000,
      connectTimeout: 8000,
    });
    clientRef.current = client;

    client.on("connect", () => {
      setStatus("online");
      // `+` wildcard: one subscription covers every machine.
      client.subscribe(TELEMETRY_WILDCARD, { qos: QOS });
    });
    client.on("reconnect", () => setStatus("connecting"));
    client.on("close", () => setStatus("offline"));
    client.on("error", () => setStatus("offline"));

    client.on("message", (_topic, payload) => {
      let reading: Reading;
      try {
        reading = JSON.parse(payload.toString());
      } catch {
        return; // the broker is public — ignore anything that isn't ours
      }
      if (!reading?.machineId) return;

      setMessageCount((n) => n + 1);
      setHistory((current) => {
        const previous = current[reading.machineId] ?? [];
        return {
          ...current,
          [reading.machineId]: [...previous, reading].slice(-HISTORY),
        };
      });

      // Raise an alarm whenever a sensor is outside its normal band.
      for (const sensor of SENSORS) {
        const level = levelFor(sensor.key, reading[sensor.key]);
        if (level === "ok") continue;
        setAlarms((current) =>
          [
            {
              id: `${reading.machineId}-${sensor.key}-${reading.ts}`,
              machineId: reading.machineId,
              sensor: sensor.label,
              value: reading[sensor.key],
              level,
              ts: reading.ts,
            },
            ...current,
          ].slice(0, 8)
        );
      }
    });

    return () => {
      client.end(true);
      clientRef.current = null;
    };
  }, []);

  // ── Publish (in-browser device simulator) ──────────────────────────────────
  // Lets the deployed demo produce data without anyone running the Node script.
  useEffect(() => {
    if (!simulating || status !== "online") return;

    const timer = setInterval(() => {
      const client = clientRef.current;
      if (!client?.connected) return;
      for (const machine of MACHINES) {
        client.publish(
          telemetryTopic(machine.id),
          JSON.stringify(nextReading(machine.id)),
          { qos: QOS }
        );
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [simulating, status]);

  return (
    <div className="space-y-6">
      {/* Connection bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            {status === "online" && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                status === "online"
                  ? "bg-emerald-500"
                  : status === "connecting"
                    ? "bg-amber-500"
                    : "bg-rose-500"
              }`}
            />
          </span>
          <div>
            <p className="text-sm font-medium">
              {status === "online"
                ? "Conectado al broker"
                : status === "connecting"
                  ? "Conectando…"
                  : "Desconectado"}
            </p>
            <p className="font-mono text-xs text-slate-500">
              {BROKER_WS} · {messageCount} mensajes
            </p>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={simulating}
            onChange={(e) => setSimulating(e.target.checked)}
            className="h-4 w-4 accent-sky-500"
          />
          <span className="text-slate-300">Simular dispositivos</span>
        </label>
      </div>

      {/* Machines */}
      <div className="grid gap-4 lg:grid-cols-3">
        {MACHINES.map((machine) => {
          const readings = history[machine.id] ?? [];
          const latest = readings[readings.length - 1];
          const level: Level = latest ? machineLevel(latest) : "ok";

          return (
            <section
              key={machine.id}
              className="rounded-2xl border border-white/10 bg-slate-900 p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold">{machine.name}</h2>
                  <p className="font-mono text-xs text-slate-500">
                    {machine.line} · {machine.id}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className={`h-2 w-2 rounded-full ${LEVEL_DOT[level]}`} />
                  <span className={LEVEL_TEXT[level]}>{LEVEL_LABEL[level]}</span>
                </span>
              </div>

              {!latest ? (
                <p className="mt-6 text-sm text-slate-500">Esperando telemetría…</p>
              ) : (
                <div className="mt-5 space-y-4">
                  {SENSORS.map((sensor) => {
                    const value = latest[sensor.key];
                    const sensorLevel = levelFor(sensor.key, value);
                    const [warnAt, critAt] = THRESHOLDS[sensor.key];
                    return (
                      <div key={sensor.key} className="flex items-center gap-3">
                        <div className="w-24 shrink-0">
                          <p className="text-xs text-slate-500">{sensor.label}</p>
                          <p
                            className={`text-lg font-semibold tabular-nums ${LEVEL_TEXT[sensorLevel]}`}
                          >
                            {value}
                            <span className="ml-0.5 text-xs font-normal text-slate-500">
                              {sensor.unit}
                            </span>
                          </p>
                        </div>
                        <Sparkline
                          values={readings.map((r) => r[sensor.key])}
                          level={sensorLevel}
                          warnAt={warnAt}
                          critAt={critAt}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Alarms */}
      <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Alarmas</h2>
          <span className="font-mono text-xs text-slate-500">{TOPIC_PREFIX}/+/telemetry</span>
        </div>

        {alarms.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Sin alarmas. Todos los sensores dentro de rango.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {alarms.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${LEVEL_DOT[a.level]}`} />
                  <span className="text-slate-300">
                    {MACHINES.find((m) => m.id === a.machineId)?.name ?? a.machineId}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className={LEVEL_TEXT[a.level]}>
                    {a.sensor} en {a.value}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs text-slate-600">
                  {new Date(a.ts).toLocaleTimeString("es-CO")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
