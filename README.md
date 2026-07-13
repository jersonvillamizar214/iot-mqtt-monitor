# IoT Monitor — MQTT en tiempo real

[![CI](https://github.com/jersonvillamizar214/iot-mqtt-monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/jersonvillamizar214/iot-mqtt-monitor/actions/workflows/ci.yml)

Real-time industrial monitoring over **MQTT**: plant telemetry streams from the machines to a broker, and the browser subscribes to it directly — no backend in between. Live trends, alarm thresholds, and a device simulator so the demo always has data.

> Part of my developer portfolio. Runs on HiveMQ's free public broker — no cost, no account.

## What it demonstrates

- **MQTT pub/sub**: devices publish, dashboards subscribe; neither knows the other exists.
- **MQTT over WebSockets**: a browser cannot open the raw TCP socket that `mqtt://` needs, so it connects over `wss://` to the same broker the machines publish to.
- **Topic hierarchy and wildcards**: one subscription to `northwind/plant-1/+/telemetry` covers every machine.
- **QoS trade-off**: telemetry uses **QoS 0** (at most once) — a dropped sample is replaced by the next one 2 seconds later, and it avoids the acknowledgement round-trips of QoS 1/2.
- **Threshold alarms**: each sensor has warn/critical bands; excursions surface instantly in the alarm feed.

## Architecture

```
  PLC / sensores           Broker MQTT              Navegador
  (scripts/simulator)      (HiveMQ público)         (este panel)

  ┌──────────────┐  TCP    ┌──────────────┐  WSS   ┌──────────────┐
  │  publish     │────────▶│              │◀───────│  subscribe   │
  │  .../press-01│         │   northwind/ │        │  .../+/      │
  │  /telemetry  │         │   plant-1/#  │        │  telemetry   │
  └──────────────┘         └──────────────┘        └──────────────┘
```

Machines: hydraulic press, tempering furnace and compressor. Sensors: temperature, pressure, vibration and power draw.

## Data sources

Two ways to feed the dashboard — both publish the exact same contract (`src/lib/telemetry.ts`):

| Source | Command | Transport |
| --- | --- | --- |
| Node device simulator (acts like a plant gateway / PLC) | `npm run simulator` | TCP |
| In-browser simulator (checkbox in the UI, on by default) | — | WebSocket |

The in-browser simulator exists so the deployed demo shows live data without anyone running a script.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000

npm run simulator    # optional: publish from Node, like real hardware would
npm run verify       # round-trip test: publish → broker → subscribe
```

### Verified round trip

```
Conectado a mqtt://broker.hivemq.com:1883
Suscrito a northwind/plant-1/+/telemetry

  → publicado press-01
  ← recibido press-01 (62.3°C) en northwind/plant-1/press-01/telemetry
  ...
  ok  3/3 máquinas: publish → broker → subscribe
  ok  todas las lecturas tienen los 4 sensores válidos
```

`npm run verify` talks to the real public broker, so it is kept out of CI — an external service should not be able to turn the build red. CI runs lint, type-check, build and the Docker image.

## Configuration

| Variable | Default |
| --- | --- |
| `NEXT_PUBLIC_MQTT_BROKER_WS` | `wss://broker.hivemq.com:8884/mqtt` |
| `MQTT_BROKER_TCP` | `mqtt://broker.hivemq.com:1883` |
| `NEXT_PUBLIC_MQTT_TOPIC_PREFIX` | `northwind/plant-1` |

The broker is **public and shared**: anyone can publish to any topic. The dashboard ignores payloads that don't match its schema, and the topic prefix can be changed for a quieter channel. A production deployment would use an authenticated broker (HiveMQ Cloud, EMQX, Mosquitto) with TLS and per-device credentials.

## Tech Stack

Next.js 16 · TypeScript · MQTT.js · Tailwind CSS v4 · inline SVG charts · Docker · GitHub Actions

## License

MIT
