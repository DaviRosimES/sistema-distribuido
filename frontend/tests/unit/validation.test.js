import { describe, expect, it } from "vitest";
import {
  DESCRICAO_MAX_LENGTH,
  TITULO_MAX_LENGTH,
  validarTarefa,
} from "../../src/validation";

describe("validarTarefa", () => {
  it("aceita uma tarefa com título e descrição", () => {
    const { erros } = validarTarefa({
      titulo: "Estudar",
      descricao: "Prática 6",
    });

    expect(erros).toEqual({});
  });

  it("aceita descrição vazia, porque ela é opcional", () => {
    const { erros } = validarTarefa({ titulo: "Estudar", descricao: "" });

    expect(erros).toEqual({});
  });

  it.each(["", "   "])(
    "rejeita título vazio ou só com espaços (%j)",
    (titulo) => {
      const { erros } = validarTarefa({ titulo, descricao: "" });

      expect(erros.titulo).toBe("O título é obrigatório.");
    },
  );

  it("aceita título com exatamente o tamanho máximo", () => {
    const { erros } = validarTarefa({
      titulo: "a".repeat(TITULO_MAX_LENGTH),
      descricao: "",
    });

    expect(erros.titulo).toBeUndefined();
  });

  it("rejeita título maior que o máximo", () => {
    const { erros } = validarTarefa({
      titulo: "a".repeat(TITULO_MAX_LENGTH + 1),
      descricao: "",
    });

    expect(erros.titulo).toBe(
      `O título deve ter no máximo ${TITULO_MAX_LENGTH} caracteres.`,
    );
  });

  it("rejeita descrição maior que o máximo", () => {
    const { erros } = validarTarefa({
      titulo: "Estudar",
      descricao: "a".repeat(DESCRICAO_MAX_LENGTH + 1),
    });

    expect(erros.descricao).toBe(
      `A descrição deve ter no máximo ${DESCRICAO_MAX_LENGTH} caracteres.`,
    );
  });

  it("remove os espaços das pontas antes de devolver os valores", () => {
    const { valores } = validarTarefa({
      titulo: "  Estudar  ",
      descricao: "  Prática 6 ",
    });

    expect(valores).toEqual({ titulo: "Estudar", descricao: "Prática 6" });
  });

  it("conta o tamanho do título depois de remover os espaços", () => {
    const { erros } = validarTarefa({
      titulo: ` ${"a".repeat(TITULO_MAX_LENGTH)} `,
      descricao: "",
    });

    expect(erros.titulo).toBeUndefined();
  });
});
