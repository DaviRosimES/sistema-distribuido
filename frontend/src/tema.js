// Tema claro/escuro. A escolha fica no localStorage do navegador; sem escolha salva, segue
// o tema do sistema operacional. O index.html aplica o tema antes do React carregar, pra
// página não abrir branca e depois escurecer.

export const CHAVE_TEMA = "tema";

export function temaInicial() {
  try {
    const salvo = localStorage.getItem(CHAVE_TEMA);
    if (salvo === "claro" || salvo === "escuro") return salvo;
  } catch {
    // localStorage bloqueado (aba anônima, por exemplo): só não lembra a escolha
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "escuro"
    : "claro";
}

export function aplicarTema(tema) {
  document.documentElement.classList.toggle("dark", tema === "escuro");
  try {
    localStorage.setItem(CHAVE_TEMA, tema);
  } catch {
    // sem localStorage o tema vale só até recarregar
  }
}
