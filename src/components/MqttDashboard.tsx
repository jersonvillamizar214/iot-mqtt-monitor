"use client";

import { useEffect, useRef, useState } from "react";
import mqtt, { type MqttClient } from "mqtt";
import Sparkline from "./Sparkline";
import { useUi } from "./ui";
import { T } from "@/lib/i18n";
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
  type SensorKey,
  levelFor,
  machineLevel,
  nextReading,
} from "@/lib/telemetry";

const HISTORY = 30; // samples kept per machine

type Status = "connecting" | "online" | "offline";

interface Alarm {
  id: string;
  machineId: string;
  sensor: SensorKey;
  value: number;
  level: Level;
  ts: number;
}

// Status colors — kept legible on both light and dark surfaces.
const LEVEL_TEXT: Record<Level, string> = {
  ok: "text-muted",
  warn: "text-amber-500",
  crit: "text-rose-500",
};
const LEVEL_DOT: Record<Level, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  crit: "bg-rose-500",
};

export default function MqttDashboard() {
  const { lang } = useUi();
  const t = T[lang];

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
        return;
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

      for (const sensor of SENSORS) {
        const level = levelFor(sensor.key, reading[sensor.key]);
        if (level === "ok") continue;
        setAlarms((current) =>
          [
            {
              id: `${reading.machineId}-${sensor.key}-${reading.ts}`,
              machineId: reading.machineId,
              sensor: sensor.key,
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
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-5 py-4">
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
                ? t.connected
                : status === "connecting"
                  ? t.connecting
                  : t.offline}
            </p>
            <p className="font-mono text-xs text-dim">
              {BROKER_WS} · {messageCount} {t.messages}
            </p>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={simulating}
            onChange={(e) => setSimulating(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          <span className="text-muted">{t.simulate}</span>
        </label>
      </div>

      {/* Machines */}
      <div className="grid gap-4 lg:grid-cols-3">
        {MACHINES.map((machine) => {
          const readings = history[machine.id] ?? [];
          const latest = readings[readings.length - 1];
          const level: Level = latest ? machineLevel(latest) : "ok";
          const m = t.machines[machine.id] ?? { name: machine.name, line: machine.line };

          return (
            <section key={machine.id} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold">{m.name}</h2>
                  <p className="font-mono text-xs text-dim">
                    {m.line} · {machine.id}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-xs">
                  <span className={`h-2 w-2 rounded-full ${LEVEL_DOT[level]}`} />
                  <span className={LEVEL_TEXT[level]}>{t.status[level]}</span>
                </span>
              </div>

              {!latest ? (
                <p className="mt-6 text-sm text-dim">{t.waiting}</p>
              ) : (
                <div className="mt-5 space-y-4">
                  {SENSORS.map((sensor) => {
                    const value = latest[sensor.key];
                    const sensorLevel = levelFor(sensor.key, value);
                    const [warnAt, critAt] = THRESHOLDS[sensor.key];
                    return (
                      <div key={sensor.key} className="flex items-center gap-3">
                        <div className="w-24 shrink-0">
                          <p className="text-xs text-dim">{t.sensors[sensor.key]}</p>
                          <p className={`text-lg font-semibold tabular-nums ${LEVEL_TEXT[sensorLevel]}`}>
                            {value}
                            <span className="ml-0.5 text-xs font-normal text-dim">
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
      <section className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">{t.alarms}</h2>
          <span className="font-mono text-xs text-dim">{TOPIC_PREFIX}/+/telemetry</span>
        </div>

        {alarms.length === 0 ? (
          <p className="mt-4 text-sm text-dim">{t.noAlarms}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {alarms.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${LEVEL_DOT[a.level]}`} />
                  <span className="text-muted">
                    {t.machines[a.machineId]?.name ?? a.machineId}
                  </span>
                  <span className="text-dim">·</span>
                  <span className={LEVEL_TEXT[a.level]}>
                    {t.sensors[a.sensor]} {t.at} {a.value}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs text-dim">
                  {new Date(a.ts).toLocaleTimeString(t.locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
