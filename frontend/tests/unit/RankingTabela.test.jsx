import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RankingTabela } from "../../src/components/RankingTabela";
import { itemRanking, simulacao } from "../helpers/simulacao";

function linhas() {
  // A primeira linha é o cabeçalho
  return screen.getAllByRole("row").slice(1);
}

describe("RankingTabela", () => {
  it("mostra as corretoras na ordem da API e destaca a mais barata", () => {
    render(
      <RankingTabela
        simulacao={simulacao({
          ranking: [
            itemRanking({
              corretora_id: 2,
              corretora_nome: "Barata",
              custo_total: 30,
            }),
            itemRanking(),
          ],
        })}
      />,
    );

    const [primeira, segunda] = linhas();
    expect(primeira).toHaveTextContent("1º");
    expect(within(primeira).getByText("Mais barata")).toBeInTheDocument();
    expect(primeira).toHaveTextContent("R$ 30,00");
    expect(segunda).toHaveTextContent("2º");
    expect(segunda).toHaveTextContent("177.000 sats");
    expect(segunda).toHaveTextContent("11,5%");
  });

  it("mostra o motivo das inviáveis sem posição", () => {
    render(
      <RankingTabela
        simulacao={simulacao({
          ranking: [
            itemRanking({
              viavel: false,
              motivo: "Não faz saque pela Lightning",
            }),
          ],
        })}
      />,
    );

    const [linha] = linhas();
    expect(linha).toHaveTextContent("—");
    expect(linha).toHaveTextContent("Não faz saque pela Lightning");
    expect(within(linha).queryByText("Mais barata")).toBeNull();
  });

  it("mostra a economia ao juntar saques e o valor mínimo pro alvo", () => {
    render(
      <RankingTabela
        simulacao={simulacao({
          compras_por_saque: 4,
          custo_alvo_pct: 2,
          ranking: [itemRanking({ economia: 300, valor_minimo: 5000 })],
        })}
      />,
    );

    expect(screen.getByText("Mínimo p/ 2%")).toBeInTheDocument();
    expect(
      screen.getByText(/Economia de R\$\s300,00 juntando 4 compras/),
    ).toBeInTheDocument();
    expect(linhas()[0]).toHaveTextContent("R$ 5.000,00");
  });

  it("avisa quando o alvo é impossível na corretora", () => {
    render(<RankingTabela simulacao={simulacao()} />);

    expect(linhas()[0]).toHaveTextContent("Impossível");
  });

  it("diz 'Qualquer valor' quando não há taxa fixa a diluir", () => {
    render(
      <RankingTabela
        simulacao={simulacao({
          ranking: [itemRanking({ valor_minimo: 0 })],
        })}
      />,
    );

    expect(linhas()[0]).toHaveTextContent("Qualquer valor");
  });
});
