"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

type Theme = "light" | "dark";

interface UiState {
  theme: Theme;
  lang: Lang;
  setTheme: (t: Theme) => void;
  setLang: (l: Lang) => void;
}

// Defaults: English + light. A visitor's choice is persisted in localStorage and
// applied to <html> before paint by an inline script in the layout.
const Ctx = createContext<UiState>({
  theme: "light",
  lang: "en",
  setTheme: () => {},
  setLang: () => {},
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [lang, setLangState] = useState<Lang>("en");

  // Sync React state, after mount, to whatever the inline script already applied
  // from localStorage. The initial render matches the server ("light"/"en"), so
  // this update is hydration-safe; the lint rule for setState-in-effect is the
  // expected exception for reading a persisted client preference.
  useEffect(() => {
    const t = localStorage.getItem("theme") as Theme | null;
    const l = localStorage.getItem("lang") as Lang | null;
    /* eslint-disable react-hooks/set-state-in-effect */
    if (t) setThemeState(t);
    if (l) setLangState(l);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
    document.documentElement.setAttribute("data-theme", t);
  };
  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
    document.documentElement.setAttribute("lang", l);
  };

  return (
    <Ctx.Provider value={{ theme, lang, setTheme, setLang }}>{children}</Ctx.Provider>
  );
}

export const useUi = () => useContext(Ctx);

// The two toggles, reused wherever a header needs them.
export function Controls() {
  const { theme, lang, setTheme, setLang } = useUi();

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex overflow-hidden rounded-lg border border-line font-mono text-xs">
        {(["en", "es"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-2.5 py-1.5 font-bold transition ${
              lang === l ? "bg-accent text-accent-ink" : "text-muted hover:text-fg"
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition hover:text-fg"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        )}
      </button>
    </div>
  );
}
