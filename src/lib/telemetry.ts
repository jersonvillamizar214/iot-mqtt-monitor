// Shared between the browser dashboard and the Node device simulator, so both
// speak exactly the same contract over MQTT.

export interface Reading {
  machineId: string;
  temperature: number; // °C
  pressure: number; // bar
  vibration: number; // mm/s
  power: number; // kW
  ts: number; // epoch ms
}

export type Level = "ok" | "warn" | "crit";

export interface Machine {
  id: string;
  name: string;
  line: string;
}

export const MACHINES: Machine[] = [
  { id: "press-01", name: "Prensa hidráulica", line: "Línea A" },
  { id: "furnace-02", name: "Horno de temple", line: "Línea A" },
  { id: "compressor-03", name: "Compresor", line: "Línea B" },
];

// Alarm thresholds per sensor: [warn, crit].
export const THRESHOLDS = {
  temperature: [75, 90],
  pressure: [8, 10],
  vibration: [4.5, 7],
  power: [45, 55],
} as const;

export type SensorKey = keyof typeof THRESHOLDS;

export const SENSORS: { key: SensorKey; label: string; unit: string }[] = [
  { key: "temperature", label: "Temperatura", unit: "°C" },
  { key: "pressure", label: "Presión", unit: "bar" },
  { key: "vibration", label: "Vibración", unit: "mm/s" },
  { key: "power", label: "Consumo", unit: "kW" },
];

export function levelFor(sensor: SensorKey, value: number): Level {
  const [warn, crit] = THRESHOLDS[sensor];
  if (value >= crit) return "crit";
  if (value >= warn) return "warn";
  return "ok";
}

// The worst level across all of a machine's sensors.
export function machineLevel(reading: Reading): Level {
  const levels = SENSORS.map((s) => levelFor(s.key, reading[s.key]));
  if (levels.includes("crit")) return "crit";
  if (levels.includes("warn")) return "warn";
  return "ok";
}

// A random walk around a baseline — each machine drifts, and occasionally
// spikes, so the alarm states actually trigger during a demo.
const BASELINES: Record<string, Omit<Reading, "machineId" | "ts">> = {
  "press-01": { temperature: 62, pressure: 6.2, vibration: 2.4, power: 30 },
  "furnace-02": { temperature: 71, pressure: 4.0, vibration: 1.6, power: 41 },
  "compressor-03": { temperature: 55, pressure: 7.1, vibration: 3.2, power: 26 },
};

const state = new Map<string, Omit<Reading, "machineId" | "ts">>();

export function nextReading(machineId: string): Reading {
  const base = BASELINES[machineId] ?? BASELINES["press-01"];
  const current = state.get(machineId) ?? { ...base };

  const drift = (value: number, baseline: number, amplitude: number) => {
    const spike = Math.random() < 0.04 ? amplitude * 4 : 0; // rare excursion
    const pull = (baseline - value) * 0.15; // mean reversion
    const noise = (Math.random() - 0.5) * amplitude;
    return Math.max(0, value + pull + noise + spike);
  };

  const next = {
    temperature: drift(current.temperature, base.temperature, 3),
    pressure: drift(current.pressure, base.pressure, 0.5),
    vibration: drift(current.vibration, base.vibration, 0.6),
    power: drift(current.power, base.power, 2.5),
  };
  state.set(machineId, next);

  return {
    machineId,
    temperature: +next.temperature.toFixed(1),
    pressure: +next.pressure.toFixed(2),
    vibration: +next.vibration.toFixed(2),
    power: +next.power.toFixed(1),
    ts: Date.now(),
  };
}
