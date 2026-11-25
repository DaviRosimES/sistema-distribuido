import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BotaoTema } from "../../src/components/BotaoTema";
import { CHAVE_TEMA } from "../../src/tema";

// O jsdom não tem matchMedia; aqui ele finge a preferência de tema do sistema
function sistemaPrefere(escuro) {
  vi.stubGlobal("matchMedia", (consulta) => ({
    matches: escuro && consulta === "(prefers-color-scheme: dark)",
  }));
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BotaoTema", () => {
  it("segue o tema do sistema quando não há escolha salva", () => {
    sistemaPrefere(true);
    render(<BotaoTema />);

    expect(document.documentElement).toHaveClass("dark");
    expect(screen.getByRole("button", { name: /Modo claro/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("alterna o tema e salva a escolha", async () => {
    sistemaPrefere(false);
    const user = userEvent.setup();
    render(<BotaoTema />);
    expect(document.documentElement).not.toHaveClass("dark");

    await user.click(screen.getByRole("button", { name: /Modo escuro/ }));

    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem(CHAVE_TEMA)).toBe("escuro");
  });

  it("a escolha salva vale mais que a preferência do sistema", () => {
    sistemaPrefere(true);
    localStorage.setItem(CHAVE_TEMA, "claro");
    render(<BotaoTema />);

    expect(document.documentElement).not.toHaveClass("dark");
  });
});
