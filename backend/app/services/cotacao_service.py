import logging
from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from app.clients.cotacao import FonteDeCotacao, FonteIndisponivelError

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Cotacao:
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
        self._ultima: Cotacao | None = None

    def obter(self) -> Cotacao:
        if self._ultima is not None and self.agora() - self._ultima.consultada_em < self.validade:
            return self._ultima

        for fonte in self.fontes:
            try:
                preco = fonte.buscar()
            except FonteIndisponivelError as erro:
                logger.warning("Cotação indisponível em %s: %s", fonte.nome, erro)
                continue
            self._ultima = Cotacao(preco, fonte.nome, self.agora())
            return self._ultima

        raise CotacaoIndisponivelError()
