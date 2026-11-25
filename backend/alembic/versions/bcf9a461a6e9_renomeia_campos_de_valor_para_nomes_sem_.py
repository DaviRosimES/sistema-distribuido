"""renomeia campos de valor para nomes sem moeda

Revision ID: bcf9a461a6e9
Revises: 02c8aa577761
Create Date: 2026-11-25 11:17:58.825316

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "bcf9a461a6e9"
down_revision: str | Sequence[str] | None = "02c8aa577761"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# Os campos tinham "_brl" no nome, mas agora a simulação pode ser em reais ou em dólares.
# Renomeio as colunas (sem perder dados) e também as chaves do ranking salvo no JSON.
COLUNAS = {"valor_brl": "valor", "preco_btc_brl": "preco_btc"}
CHAVES_DO_RANKING = {
    "taxa_negociacao_brl": "taxa_negociacao",
    "spread_brl": "spread",
    "taxa_saque_brl": "taxa_saque",
    "custo_total_brl": "custo_total",
    "economia_brl": "economia",
    "valor_minimo_brl": "valor_minimo",
}

simulacoes = sa.table("simulacoes", sa.column("id", sa.Integer), sa.column("ranking", sa.JSON))


def _renomear_chaves_do_ranking(trocas: dict[str, str]) -> None:
    conexao = op.get_bind()
    for simulacao_id, ranking in conexao.execute(sa.select(simulacoes.c.id, simulacoes.c.ranking)):
        novo = [
            {trocas.get(chave, chave): valor for chave, valor in item.items()} for item in ranking
        ]
        conexao.execute(
            simulacoes.update().where(simulacoes.c.id == simulacao_id).values(ranking=novo)
        )


def upgrade() -> None:
    """Upgrade schema."""
    for antigo, novo in COLUNAS.items():
        op.alter_column("simulacoes", antigo, new_column_name=novo)
    _renomear_chaves_do_ranking(CHAVES_DO_RANKING)


def downgrade() -> None:
    """Downgrade schema."""
    _renomear_chaves_do_ranking({novo: antigo for antigo, novo in CHAVES_DO_RANKING.items()})
    for antigo, novo in COLUNAS.items():
        op.alter_column("simulacoes", novo, new_column_name=antigo)
