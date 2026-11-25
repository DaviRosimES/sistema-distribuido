// Classes do Tailwind reaproveitadas pelos componentes, pra todos os botões, campos e
// painéis terem o mesmo desenho (e mudar o visual ser mexer num lugar só)

export const painel =
  "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900";

export const botao =
  "inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 py-1 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";

export const botaoPrimario =
  "inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";

export const botaoPerigo =
  "inline-flex items-center gap-1.5 rounded-md border border-transparent px-2.5 py-1 text-sm text-red-700 transition-colors hover:border-red-200 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:border-red-900 dark:hover:bg-red-950/40";

export const rotulo =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export const textoAjuda = "text-xs text-zinc-500 dark:text-zinc-400";

export const entrada =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 aria-[invalid=true]:border-red-600 dark:border-zinc-700 dark:bg-zinc-950 dark:placeholder:text-zinc-600 dark:focus:border-zinc-400 dark:focus:ring-zinc-800";

// Números com todos os dígitos na mesma largura, pra não "dançarem" no meio do texto
export const numero = "tabular-nums";

// Fonte mono só nas colunas de dados e no número em destaque: lê como planilha
export const numeroMono = "font-mono tabular-nums";
