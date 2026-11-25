import { useEffect, useState } from "react";
import { aplicarTema, temaInicial } from "../tema";

export function BotaoTema() {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    aplicarTema(tema);
  }, [tema]);

  const escuro = tema === "escuro";
  return (
    <button
      type="button"
      onClick={() => setTema(escuro ? "claro" : "escuro")}
      aria-pressed={escuro}
      className="shrink-0 rounded border border-slate-300 dark:border-slate-600 px-3 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      {escuro ? "☀️ Modo claro" : "🌙 Modo escuro"}
    </button>
  );
}
