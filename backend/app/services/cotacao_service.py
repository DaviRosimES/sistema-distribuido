import logging
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from app.clients.cotacao import FonteDeCotacao, FonteIndisponivelError
from app.core.moeda import Moeda

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Cotacao:
    moeda: Moeda
    preco_btc: Decimal
    fonte: str
    consultada_em: datetime


class CotacaoIndisponivelError(Exception):
    def __init__(self):
        super().__init__(
            "Não foi possível obter a cotação agora. Informe o preço do BTC manualmente."
        )


class CotacaoService:
    """Busca a cotação nas fontes em ordem, com fallback e cache.

    - Fallback: se a primeira fonte falhar (fora do ar, timeout, resposta estranha), tenta a
      próxima. Só dá erro se todas falharem.
    - Cache: a cotação fica guardada por alguns segundos, assim vários cliques seguidos não
      viram várias chamadas externas (e não estouram o limite das APIs gratuitas).
    """

    def __init__(
        self,
        fontes: list[FonteDeCotacao],
        cache_segundos: int = 60,
        agora: Callable[[], datetime] = lambda: datetime.now(UTC),
    ):
        self.fontes = fontes
        self.validade = timedelta(seconds=cache_segundos)
        self.agora = agora
        # Uma cotação guardada por moeda
        self._cache: dict[Moeda, Cotacao] = {}

    def obter(self, moeda: Moeda = Moeda.BRL) -> Cotacao:
        guardada = self._cache.get(moeda)
        if guardada is not None and self.agora() - guardada.consultada_em < self.validade:
            return guardada

        for fonte in self.fontes:
            try:
                preco = fonte.buscar(moeda)
            except FonteIndisponivelError as erro:
                logger.warning("Cotação em %s indisponível em %s: %s", moeda, fonte.nome, erro)
                continue
            self._cache[moeda] = Cotacao(moeda, preco, fonte.nome, self.agora())
            return self._cache[moeda]

        raise CotacaoIndisponivelError()
