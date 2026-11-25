import { painel } from "../ui";
import { CorretoraItem } from "./CorretoraItem";

export function CorretoraList({ corretoras, ...acoes }) {
  if (corretoras.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Nenhuma corretora cadastrada. Cadastre a primeira acima ou rode o{" "}
        <code className="font-mono text-xs">make docker-seed</code> pra carregar
        Binance, Bitso e Foxbit.
      </p>
    );
  }
  // Um painel só, com uma linha por corretora: lista densa sem um cartão pra cada item
  return (
    <ul
      aria-label="Corretoras cadastradas"
      className={`${painel} divide-y divide-zinc-200 dark:divide-zinc-800`}
    >
      {corretoras.map((corretora) => (
        <CorretoraItem key={corretora.id} corretora={corretora} {...acoes} />
      ))}
    </ul>
  );
}
