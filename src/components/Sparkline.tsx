"use client";

import { Level } from "@/lib/telemetry";

const STROKE: Record<Level, string> = {
  ok: "#3987e5",
  warn: "#c98500",
  crit: "#e66767",
};

// Compact trend line: the last N samples of one sensor. No axes — the number
// beside it carries the value; this only carries the shape.
export default function Sparkline({
  values,
  level,
  warnAt,
  critAt,
}: {
  values: number[];
  level: Level;
  warnAt: number;
  critAt: number;
}) {
  const W = 120;
  const H = 32;

  if (values.length < 2) {
    return <div style={{ width: W, height: H }} />;
  }

  // Scale to the data, but always keep the warn line in view so an excursion
  // reads as "crossing a limit" and not just "going up".
  const max = Math.max(...values, warnAt) * 1.05;
  const min = Math.min(...values, 0);
  const span = max - min || 1;

  const x = (i: number) => (i / (values.length - 1)) * W;
  const y = (v: number) => H - ((v - min) / span) * H;

  const path = values.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const last = values[values.length - 1];

  return (
    <svg width={W} height={H} className="overflow-visible" aria-hidden>
      {/* threshold guides — recessive hairlines */}
      <line x1="0" y1={y(warnAt)} x2={W} y2={y(warnAt)} stroke="#c98500" strokeWidth="1" strokeOpacity="0.3" />
      {critAt <= max && (
        <line x1="0" y1={y(critAt)} x2={W} y2={y(critAt)} stroke="#e66767" strokeWidth="1" strokeOpacity="0.3" />
      )}
      <path d={path} fill="none" stroke={STROKE[level]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* end marker with a surface ring so it stays legible over the line */}
      <circle cx={x(values.length - 1)} cy={y(last)} r="3.5" fill={STROKE[level]} stroke="var(--surface)" strokeWidth="2" />
    </svg>
  );
}
