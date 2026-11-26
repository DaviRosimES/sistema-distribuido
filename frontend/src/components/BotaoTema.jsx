import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { aplicarTema, temaInicial } from "../tema";

export function BotaoTema() {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    aplicarTema(tema);
  }, [tema]);

  const escuro = tema === "escuro";
  const rotulo = escuro ? "Modo claro" : "Modo escuro";
  const Icone = escuro ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={() => setTema(escuro ? "claro" : "escuro")}
      aria-pressed={escuro}
      aria-label={rotulo}
      title={rotulo}
      className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
    >
      <Icone aria-hidden="true" className="size-4" />
    </button>
  );
}
