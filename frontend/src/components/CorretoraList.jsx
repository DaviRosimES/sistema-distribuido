import { CorretoraItem } from "./CorretoraItem";

export function CorretoraList({ corretoras, ...acoes }) {
  if (corretoras.length === 0) {
    return (
      <p className="text-slate-600 dark:text-slate-400">
        Nenhuma corretora cadastrada. Cadastre a primeira acima ou rode o{" "}
        <code>make docker-seed</code> pra carregar Binance, Bitso e Foxbit.
      </p>
    );
  }
  return (
    <ul aria-label="Corretoras cadastradas" className="space-y-3">
      {corretoras.map((corretora) => (
        <CorretoraItem key={corretora.id} corretora={corretora} {...acoes} />
      ))}
    </ul>
  );
}
