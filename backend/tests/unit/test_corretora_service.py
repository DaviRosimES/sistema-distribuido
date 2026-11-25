from decimal import Decimal

import pytest

from app.schemas.corretora import CorretoraCreate, CorretoraPatch, CorretoraUpdate
from app.services.corretora_service import (
    CorretoraDuplicadaError,
    CorretoraInvalidaError,
    CorretoraNaoEncontradaError,
)


def nova(**alteracoes) -> CorretoraCreate:
    dados = {
        "nome": "Corretora A",
        "taxa_negociacao_pct": "0.5",
        "spread_pct": "1",
        "taxa_saque_onchain_sats": 20_000,
    }
    return CorretoraCreate(**{**dados, **alteracoes})


def test_criar_grava_e_devolve_com_id(corretora_service, corretora_repository):
    corretora = corretora_service.criar(nova())

    assert corretora.id == 1
    assert corretora.taxa_negociacao_pct == Decimal("0.5")
    assert corretora_repository.buscar(1) is corretora


def test_listar_ordena_por_nome_e_filtra_por_ativa(corretora_service):
    corretora_service.criar(nova(nome="Zeta"))
    corretora_service.criar(nova(nome="Alfa", ativa=False))

    assert [c.nome for c in corretora_service.listar()] == ["Alfa", "Zeta"]
    assert [c.nome for c in corretora_service.listar(ativa=True)] == ["Zeta"]


def test_buscar_inexistente_levanta_erro(corretora_service):
    with pytest.raises(CorretoraNaoEncontradaError):
        corretora_service.buscar(99)


def test_criar_com_nome_repetido_sem_diferenciar_maiusculas_levanta_erro(corretora_service):
    corretora_service.criar(nova(nome="Corretora A"))

    with pytest.raises(CorretoraDuplicadaError):
        corretora_service.criar(nova(nome="CORRETORA a"))


def test_atualizar_pode_manter_o_proprio_nome(corretora_service):
    corretora = corretora_service.criar(nova())

    atualizada = corretora_service.atualizar_parcial(
        corretora.id, CorretoraPatch(nome="Corretora A", spread_pct="0.8")
    )

    assert atualizada.spread_pct == Decimal("0.8")


def test_renomear_para_nome_de_outra_levanta_erro(corretora_service):
    corretora_service.criar(nova(nome="Corretora A"))
    outra = corretora_service.criar(nova(nome="Corretora B"))

    with pytest.raises(CorretoraDuplicadaError):
        corretora_service.atualizar_parcial(outra.id, CorretoraPatch(nome="corretora a"))


def test_lightning_sem_taxa_levanta_erro(corretora_service):
    with pytest.raises(CorretoraInvalidaError):
        corretora_service.criar(nova(suporta_lightning=True))


def test_sem_lightning_descarta_a_taxa_lightning(corretora_service):
    corretora = corretora_service.criar(nova(taxa_saque_lightning_sats=100))

    assert corretora.taxa_saque_lightning_sats is None


def test_patch_sem_mexer_em_lightning_mantem_a_taxa_salva(corretora_service):
    corretora = corretora_service.criar(nova(suporta_lightning=True, taxa_saque_lightning_sats=50))

    atualizada = corretora_service.atualizar_parcial(corretora.id, CorretoraPatch(spread_pct="2"))

    assert atualizada.suporta_lightning is True
    assert atualizada.taxa_saque_lightning_sats == 50


def test_patch_ligando_lightning_sem_taxa_levanta_erro(corretora_service):
    corretora = corretora_service.criar(nova())

    with pytest.raises(CorretoraInvalidaError):
        corretora_service.atualizar_parcial(corretora.id, CorretoraPatch(suporta_lightning=True))


def test_patch_limpando_taxa_de_quem_tem_lightning_levanta_erro(corretora_service):
    corretora = corretora_service.criar(nova(suporta_lightning=True, taxa_saque_lightning_sats=50))

    with pytest.raises(CorretoraInvalidaError):
        corretora_service.atualizar_parcial(
            corretora.id, CorretoraPatch(taxa_saque_lightning_sats=None)
        )


def test_substituir_troca_todos_os_campos(corretora_service):
    corretora = corretora_service.criar(nova(observacoes="antiga"))

    atualizada = corretora_service.substituir(
        corretora.id, CorretoraUpdate(**nova(nome="Nova", spread_pct="0.2").model_dump())
    )

    assert atualizada.nome == "Nova"
    assert atualizada.observacoes is None


def test_remover_apaga_a_corretora(corretora_service, corretora_repository):
    corretora = corretora_service.criar(nova())

    corretora_service.remover(corretora.id)

    assert corretora_repository.buscar(corretora.id) is None


def test_remover_inexistente_levanta_erro(corretora_service):
    with pytest.raises(CorretoraNaoEncontradaError):
        corretora_service.remover(99)
