import pytest
from pydantic import ValidationError

from app.schemas.tarefa import TarefaCreate, TarefaPatch


def test_tarefa_create_usa_valores_padrao():
    tarefa = TarefaCreate(titulo="Estudar FastAPI")

    assert tarefa.descricao is None
    assert tarefa.concluida is False


@pytest.mark.parametrize("titulo", ["", "a" * 101])
def test_tarefa_create_rejeita_titulo_invalido(titulo):
    with pytest.raises(ValidationError):
        TarefaCreate(titulo=titulo)


def test_tarefa_create_exige_titulo():
    with pytest.raises(ValidationError):
        TarefaCreate()


def test_tarefa_patch_aceita_body_vazio():
    patch = TarefaPatch()

    assert patch.model_dump(exclude_unset=True) == {}


@pytest.mark.parametrize("campo", ["titulo", "concluida"])
def test_tarefa_patch_rejeita_nulo_explicito(campo):
    with pytest.raises(ValidationError):
        TarefaPatch(**{campo: None})


def test_tarefa_patch_permite_limpar_descricao():
    patch = TarefaPatch(descricao=None)

    assert patch.model_dump(exclude_unset=True) == {"descricao": None}
