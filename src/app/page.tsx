"use client";

import MqttDashboard from "@/components/MqttDashboard";
import { Controls, useUi } from "@/components/ui";
import { T } from "@/lib/i18n";

export default function Home() {
  const { lang } = useUi();
  const t = T[lang];

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <span className="flex items-center gap-2.5 font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-xs font-bold text-accent-ink">
              IoT
            </span>
            MQTT Monitor
          </span>
          <Controls />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div>
          <span className="inline-block rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            {t.badge}
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            {t.h1a}
            <span className="text-accent">{t.mqtt}</span>
          </h1>
          <p className="mt-3 max-w-2xl text-muted">{t.lead}</p>
        </div>

        <section className="mt-10">
          <MqttDashboard />
        </section>

        <section className="mt-14">
          <h2 className="text-lg font-semibold">{t.howTitle}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.concepts.map((c) => (
              <div key={c.term} className="rounded-2xl border border-line bg-surface p-5">
                <h3 className="font-mono text-sm text-accent">{c.term}</h3>
                <p className="mt-2 text-sm text-muted">{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
            <h3 className="font-semibold">{t.archTitle}</h3>
            <pre className="mt-4 overflow-x-auto text-xs leading-relaxed text-muted">
              {t.arch}
            </pre>
          </div>
        </section>

        <footer className="mt-14 border-t border-line pt-8 text-sm text-dim">
          {t.footer1}
          <code className="font-mono text-muted">{t.footerCode}</code>
          {t.footer2}
        </footer>
      </main>
    </>
  );
}
