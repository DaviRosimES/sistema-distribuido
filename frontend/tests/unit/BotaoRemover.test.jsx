import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BotaoRemover } from "../../src/components/BotaoRemover";

describe("BotaoRemover", () => {
  it("o primeiro clique só pede confirmação", async () => {
    const onConfirmar = vi.fn();
    const user = userEvent.setup();
    render(<BotaoRemover onConfirmar={onConfirmar} />);

    await user.click(screen.getByRole("button", { name: "Remover" }));

    expect(onConfirmar).not.toHaveBeenCalled();
    expect(screen.getByText("Remover de vez?")).toBeInTheDocument();
  });

  it("remove ao confirmar", async () => {
    const onConfirmar = vi.fn().mockResolvedValue();
    const user = userEvent.setup();
    render(<BotaoRemover onConfirmar={onConfirmar} />);

    await user.click(screen.getByRole("button", { name: "Remover" }));
    await user.click(screen.getByRole("button", { name: "Confirmar remoção" }));

    expect(onConfirmar).toHaveBeenCalledOnce();
  });

  it("cancelar volta pro botão sem remover", async () => {
    const onConfirmar = vi.fn();
    const user = userEvent.setup();
    render(<BotaoRemover onConfirmar={onConfirmar} />);

    await user.click(screen.getByRole("button", { name: "Remover" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onConfirmar).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Remover" })).toBeInTheDocument();
  });
});
