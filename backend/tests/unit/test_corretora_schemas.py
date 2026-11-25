from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.schemas.corretora import Corretora, CorretoraCreate, CorretoraPatch


def dados_validos(**alteracoes):
    dados = {
        "nome": "Corretora A",
        "taxa_negociacao_pct": "0.5",
        "spread_pct": "1",
        "taxa_saque_onchain_sats": 20_000,
    }
    return {**dados, **alteracoes}


def test_corretora_create_usa_valores_padrao():
    corretora = CorretoraCreate(**dados_validos())

    assert corretora.saque_minimo_sats == 0
    assert corretora.suporta_lightning is False
    assert corretora.taxa_saque_lightning_sats is None
    assert corretora.ativa is True


def test_percentual_vira_decimal_sem_perder_precisao():
    corretora = CorretoraCreate(**dados_validos(taxa_negociacao_pct="0.125"))

    assert corretora.taxa_negociacao_pct == Decimal("0.125")


def test_nome_perde_os_espacos_das_pontas():
    assert CorretoraCreate(**dados_validos(nome="  Corretora A  ")).nome == "Corretora A"


@pytest.mark.parametrize("nome", ["", "   ", "a" * 61])
def test_rejeita_nome_invalido(nome):
    with pytest.raises(ValidationError):
        CorretoraCreate(**dados_validos(nome=nome))


@pytest.mark.parametrize("campo", ["taxa_negociacao_pct", "spread_pct"])
@pytest.mark.parametrize("valor", ["-0.1", "10.001", "0.1234"])
def test_rejeita_percentual_fora_da_faixa_ou_com_casas_demais(campo, valor):
    with pytest.raises(ValidationError):
        CorretoraCreate(**dados_validos(**{campo: valor}))


@pytest.mark.parametrize(
    "campo, valor",
    [
        ("taxa_saque_onchain_sats", -1),
        ("taxa_saque_onchain_sats", 10_000_001),
        ("taxa_saque_lightning_sats", -1),
        ("saque_minimo_sats", -1),
    ],
)
def test_rejeita_sats_fora_da_faixa(campo, valor):
    with pytest.raises(ValidationError):
        CorretoraCreate(**dados_validos(**{campo: valor}))


@pytest.mark.parametrize("campo", ["nome", "taxa_negociacao_pct", "taxa_saque_onchain_sats"])
def test_corretora_create_exige_campos_obrigatorios(campo):
    dados = dados_validos()
    del dados[campo]

    with pytest.raises(ValidationError):
        CorretoraCreate(**dados)


def test_corretora_patch_aceita_body_vazio():
    assert CorretoraPatch().model_dump(exclude_unset=True) == {}


@pytest.mark.parametrize("campo", ["nome", "spread_pct", "ativa", "suporta_lightning"])
def test_corretora_patch_nao_aceita_nulo_em_campo_obrigatorio(campo):
    with pytest.raises(ValidationError):
        CorretoraPatch(**{campo: None})


def test_corretora_patch_aceita_nulo_pra_limpar_taxa_lightning():
    patch = CorretoraPatch(taxa_saque_lightning_sats=None)

    assert patch.model_dump(exclude_unset=True) == {"taxa_saque_lightning_sats": None}


def test_resposta_serializa_percentual_como_numero():
    corretora = Corretora(id=1, **dados_validos(taxa_negociacao_pct="0.125"))

    assert corretora.model_dump(mode="json")["taxa_negociacao_pct"] == 0.125
