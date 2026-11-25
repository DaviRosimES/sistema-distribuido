"""Fontes públicas da cotação do BTC em reais.

Nenhuma delas precisa de chave de API, então o projeto roda pra qualquer pessoa sem segredo
nenhum. Cada fonte sabe só fazer a chamada HTTP e ler o JSON da resposta; qual usar, a ordem
e o cache ficam no CotacaoService.
"""

from decimal import Decimal, InvalidOperation
from typing import Protocol

import httpx


class FonteIndisponivelError(Exception):
    pass


class FonteDeCotacao(Protocol):
    nome: str

    def buscar(self) -> Decimal: ...


def _get_json(cliente: httpx.Client, url: str, params: dict[str, str]):
    try:
        response = cliente.get(url, params=params)
        response.raise_for_status()
        return response.json()
    except (httpx.HTTPError, ValueError) as erro:
        # HTTPError cobre timeout, conexão recusada e status 4xx/5xx; ValueError, JSON inválido
        raise FonteIndisponivelError(f"{url}: {erro}") from erro


def _preco(valor) -> Decimal:
    try:
        preco = Decimal(str(valor))
    except (InvalidOperation, TypeError) as erro:
        raise FonteIndisponivelError(f"preço inválido: {valor!r}") from erro
    if not preco.is_finite() or preco <= 0:
        raise FonteIndisponivelError(f"preço inválido: {valor!r}")
    return preco.quantize(Decimal("0.01"))


class Binance:
    # Último preço negociado no par BTC/BRL do livro de ofertas da Binance
    nome = "Binance"
    url = "https://api.binance.com/api/v3/ticker/price"

    def __init__(self, cliente: httpx.Client):
        self.cliente = cliente

    def buscar(self) -> Decimal:
        dados = _get_json(self.cliente, self.url, {"symbol": "BTCBRL"})
        try:
            return _preco(dados["price"])
        except (KeyError, TypeError) as erro:
            raise FonteIndisponivelError(f"resposta inesperada: {dados!r}") from erro


class CoinGecko:
    # Preço médio agregado de várias corretoras
    nome = "CoinGecko"
    url = "https://api.coingecko.com/api/v3/simple/price"

    def __init__(self, cliente: httpx.Client):
        self.cliente = cliente

    def buscar(self) -> Decimal:
        dados = _get_json(self.cliente, self.url, {"ids": "bitcoin", "vs_currencies": "brl"})
        try:
            return _preco(dados["bitcoin"]["brl"])
        except (KeyError, TypeError) as erro:
            raise FonteIndisponivelError(f"resposta inesperada: {dados!r}") from erro
