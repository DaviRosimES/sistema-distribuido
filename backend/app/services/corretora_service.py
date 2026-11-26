from typing import Any

from app.models.corretora import CorretoraModel
from app.repositories.corretora_repository import CorretoraRepository
from app.schemas.corretora import CorretoraCreate, CorretoraPatch, CorretoraUpdate


class CorretoraNaoEncontradaError(Exception):
    def __init__(self, corretora_id: int):
        super().__init__(f"Corretora {corretora_id} não encontrada")
        self.corretora_id = corretora_id


class CorretoraDuplicadaError(Exception):
    def __init__(self, nome: str):
        super().__init__("Já existe uma corretora com esse nome")
        self.nome = nome


class CorretoraInvalidaError(Exception):
    pass


class CorretoraService:
    def __init__(self, repository: CorretoraRepository):
        self.repository = repository

    def listar(self, ativa: bool | None = None) -> list[CorretoraModel]:
        return self.repository.listar(ativa)

    def buscar(self, corretora_id: int) -> CorretoraModel:
        corretora = self.repository.buscar(corretora_id)
        if corretora is None:
            raise CorretoraNaoEncontradaError(corretora_id)
        return corretora

    def criar(self, dados: CorretoraCreate) -> CorretoraModel:
        return self._aplicar(CorretoraModel(), dados.model_dump())

    def substituir(self, corretora_id: int, dados: CorretoraUpdate) -> CorretoraModel:
        return self._aplicar(self.buscar(corretora_id), dados.model_dump())

    def atualizar_parcial(self, corretora_id: int, dados: CorretoraPatch) -> CorretoraModel:
        # exclude_unset garante que só os campos enviados no body sejam alterados
        return self._aplicar(self.buscar(corretora_id), dados.model_dump(exclude_unset=True))

    def remover(self, corretora_id: int) -> None:
        self.repository.remover(self.buscar(corretora_id))

    def _aplicar(self, corretora: CorretoraModel, alteracoes: dict[str, Any]) -> CorretoraModel:
        if "nome" in alteracoes:
            self._garantir_nome_livre(alteracoes["nome"], corretora.id)

        # As regras olham o estado final (o que já existe + o que mudou), porque num PATCH
        # pode chegar só "suporta_lightning: true" e a taxa já estar salva antes
        final = {**self._campos(corretora), **alteracoes}
        if final.get("suporta_lightning"):
            if final.get("taxa_saque_lightning_sats") is None:
                raise CorretoraInvalidaError(
                    "Informe a taxa de saque Lightning da corretora que suporta Lightning"
                )
        else:
            # Sem Lightning a taxa não faz sentido; zerar evita usar um valor esquecido no cálculo
            alteracoes["taxa_saque_lightning_sats"] = None

        for campo, valor in alteracoes.items():
            setattr(corretora, campo, valor)
        return self.repository.salvar(corretora)

    @staticmethod
    def _campos(corretora: CorretoraModel) -> dict[str, Any]:
        return {
            "suporta_lightning": corretora.suporta_lightning,
            "taxa_saque_lightning_sats": corretora.taxa_saque_lightning_sats,
        }

    def _garantir_nome_livre(self, nome: str, corretora_id: int | None = None) -> None:
        # A própria corretora pode manter o nome dela; o erro é só quando outra já usa
        existente = self.repository.buscar_por_nome(nome)
        if existente is not None and existente.id != corretora_id:
            raise CorretoraDuplicadaError(nome)
