import MqttDashboard from "@/components/MqttDashboard";

const CONCEPTS = [
  {
    term: "Broker",
    desc: "El servidor central. Los dispositivos no se hablan entre sí: publican en el broker y él reparte a quien esté suscrito.",
  },
  {
    term: "Publish / Subscribe",
    desc: "Quien publica no sabe quién escucha. Añadir un nuevo panel no obliga a reconfigurar ni una sola máquina.",
  },
  {
    term: "Topic y comodines",
    desc: "Las rutas jerárquicas ordenan los datos. Con el comodín + una sola suscripción cubre todas las máquinas.",
  },
  {
    term: "QoS",
    desc: "QoS 0 (a lo sumo una vez) es lo correcto para telemetría frecuente: si se pierde una muestra, la siguiente llega en 2 s.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header>
        <span className="inline-block rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300">
          Proyecto de portafolio · IoT industrial
        </span>
        <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
          Monitoreo industrial en tiempo real con{" "}
          <span className="text-sky-400">MQTT</span>
        </h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Telemetría de planta transmitida por MQTT sobre WebSockets, con umbrales de
          alarma y tendencias en vivo. El navegador se suscribe directamente al broker —
          sin servidor intermedio.
        </p>
      </header>

      <section className="mt-10">
        <MqttDashboard />
      </section>

      <section className="mt-14">
        <h2 className="text-lg font-semibold">Cómo funciona MQTT</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONCEPTS.map((c) => (
            <div
              key={c.term}
              className="rounded-2xl border border-white/10 bg-slate-900/50 p-5"
            >
              <h3 className="font-mono text-sm text-sky-400">{c.term}</h3>
              <p className="mt-2 text-sm text-slate-400">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <h3 className="font-semibold">Arquitectura</h3>
          <pre className="mt-4 overflow-x-auto text-xs leading-relaxed text-slate-400">
{`  PLC / sensores           Broker MQTT              Navegador
  (scripts/simulator)      (HiveMQ público)         (este panel)

  ┌──────────────┐  TCP    ┌──────────────┐  WSS   ┌──────────────┐
  │  publish     │────────▶│              │◀───────│  subscribe   │
  │  .../press-01│         │   northwind/ │        │  .../+/      │
  │  /telemetry  │         │   plant-1/#  │        │  telemetry   │
  └──────────────┘         └──────────────┘        └──────────────┘

  El navegador no puede abrir un socket TCP: por eso se conecta por
  WebSocket seguro (wss) al mismo broker al que publican los equipos.`}
          </pre>
        </div>
      </section>

      <footer className="mt-14 border-t border-white/10 pt-8 text-sm text-slate-500">
        Los datos provienen del simulador de dispositivos (incluido) o de{" "}
        <code className="font-mono text-slate-400">npm run simulator</code>, que publica
        como lo haría un gateway de planta. Broker público de HiveMQ, sin costo.
      </footer>
    </main>
  );
}
