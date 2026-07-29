export type Lang = "en" | "es";

export interface Dict {
  badge: string;
  h1a: string;
  mqtt: string;
  lead: string;
  howTitle: string;
  archTitle: string;
  arch: string;
  footer1: string;
  footerCode: string;
  footer2: string;
  connected: string;
  connecting: string;
  offline: string;
  messages: string;
  simulate: string;
  waiting: string;
  alarms: string;
  noAlarms: string;
  at: string;
  concepts: { term: string; desc: string }[];
  status: Record<"ok" | "warn" | "crit", string>;
  sensors: Record<string, string>;
  machines: Record<string, { name: string; line: string }>;
  locale: string;
}

const ARCH_EN = `  PLC / sensors            MQTT broker              Browser
  (scripts/simulator)      (public HiveMQ)          (this panel)

  ┌──────────────┐  TCP    ┌──────────────┐  WSS   ┌──────────────┐
  │  publish     │────────▶│              │◀───────│  subscribe   │
  │  .../press-01│         │   northwind/ │        │  .../+/      │
  │  /telemetry  │         │   plant-1/#  │        │  telemetry   │
  └──────────────┘         └──────────────┘        └──────────────┘

  A browser can't open a raw TCP socket: that's why it connects over
  secure WebSocket (wss) to the same broker the equipment publishes to.`;

const ARCH_ES = `  PLC / sensores           Broker MQTT              Navegador
  (scripts/simulator)      (HiveMQ público)         (este panel)

  ┌──────────────┐  TCP    ┌──────────────┐  WSS   ┌──────────────┐
  │  publish     │────────▶│              │◀───────│  subscribe   │
  │  .../press-01│         │   northwind/ │        │  .../+/      │
  │  /telemetry  │         │   plant-1/#  │        │  telemetry   │
  └──────────────┘         └──────────────┘        └──────────────┘

  El navegador no puede abrir un socket TCP: por eso se conecta por
  WebSocket seguro (wss) al mismo broker al que publican los equipos.`;

export const T: Record<Lang, Dict> = {
  en: {
    badge: "Portfolio project · Industrial IoT",
    h1a: "Real-time industrial monitoring with ",
    mqtt: "MQTT",
    lead: "Plant telemetry streamed over MQTT on WebSockets, with alarm thresholds and live trends. The browser subscribes directly to the broker — no backend in between.",
    howTitle: "How MQTT works",
    archTitle: "Architecture",
    arch: ARCH_EN,
    footer1: "Data comes from the built-in device simulator or from ",
    footerCode: "npm run simulator",
    footer2: ", which publishes like a plant gateway would. Public HiveMQ broker, free.",
    connected: "Connected to broker",
    connecting: "Connecting…",
    offline: "Disconnected",
    messages: "messages",
    simulate: "Simulate devices",
    waiting: "Waiting for telemetry…",
    alarms: "Alarms",
    noAlarms: "No alarms. All sensors within range.",
    at: "at",
    concepts: [
      { term: "Broker", desc: "The central server. Devices don't talk to each other: they publish to the broker and it fans out to whoever subscribed." },
      { term: "Publish / Subscribe", desc: "A publisher doesn't know who's listening. Adding a new panel doesn't require reconfiguring a single machine." },
      { term: "Topic & wildcards", desc: "Hierarchical paths organize the data. With the + wildcard, one subscription covers every machine." },
      { term: "QoS", desc: "QoS 0 (at most once) is right for frequent telemetry: if a sample is lost, the next one arrives in 2s." },
    ],
    status: { ok: "Normal", warn: "Warning", crit: "Critical" },
    sensors: { temperature: "Temperature", pressure: "Pressure", vibration: "Vibration", power: "Power" },
    machines: {
      "press-01": { name: "Hydraulic press", line: "Line A" },
      "furnace-02": { name: "Tempering furnace", line: "Line A" },
      "compressor-03": { name: "Compressor", line: "Line B" },
    },
    locale: "en-US",
  },
  es: {
    badge: "Proyecto de portafolio · IoT industrial",
    h1a: "Monitoreo industrial en tiempo real con ",
    mqtt: "MQTT",
    lead: "Telemetría de planta transmitida por MQTT sobre WebSockets, con umbrales de alarma y tendencias en vivo. El navegador se suscribe directamente al broker — sin servidor intermedio.",
    howTitle: "Cómo funciona MQTT",
    archTitle: "Arquitectura",
    arch: ARCH_ES,
    footer1: "Los datos provienen del simulador de dispositivos (incluido) o de ",
    footerCode: "npm run simulator",
    footer2: ", que publica como lo haría un gateway de planta. Broker público de HiveMQ, sin costo.",
    connected: "Conectado al broker",
    connecting: "Conectando…",
    offline: "Desconectado",
    messages: "mensajes",
    simulate: "Simular dispositivos",
    waiting: "Esperando telemetría…",
    alarms: "Alarmas",
    noAlarms: "Sin alarmas. Todos los sensores dentro de rango.",
    at: "en",
    concepts: [
      { term: "Broker", desc: "El servidor central. Los dispositivos no se hablan entre sí: publican en el broker y él reparte a quien esté suscrito." },
      { term: "Publish / Subscribe", desc: "Quien publica no sabe quién escucha. Añadir un nuevo panel no obliga a reconfigurar ni una sola máquina." },
      { term: "Topic y comodines", desc: "Las rutas jerárquicas ordenan los datos. Con el comodín + una sola suscripción cubre todas las máquinas." },
      { term: "QoS", desc: "QoS 0 (a lo sumo una vez) es lo correcto para telemetría frecuente: si se pierde una muestra, la siguiente llega en 2 s." },
    ],
    status: { ok: "Normal", warn: "Alerta", crit: "Crítico" },
    sensors: { temperature: "Temperatura", pressure: "Presión", vibration: "Vibración", power: "Consumo" },
    machines: {
      "press-01": { name: "Prensa hidráulica", line: "Línea A" },
      "furnace-02": { name: "Horno de temple", line: "Línea A" },
      "compressor-03": { name: "Compresor", line: "Línea B" },
    },
    locale: "es-CO",
  },
};
