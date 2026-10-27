from pydantic import BaseModel, Field, field_validator


class TarefaBase(BaseModel):
    titulo: str = Field(min_length=1, max_length=100)
    descricao: str | None = Field(default=None, max_length=500)
    concluida: bool = False


class TarefaCreate(TarefaBase):
    pass


# O PUT substitui a tarefa inteira, então usa os mesmos campos do create
class TarefaUpdate(TarefaBase):
    pass


# O PATCH atualiza só o que vier no body, por isso tudo é opcional
class TarefaPatch(BaseModel):
    titulo: str | None = Field(default=None, min_length=1, max_length=100)
    descricao: str | None = Field(default=None, max_length=500)
    concluida: bool | None = None

    # Omitir o campo pode, mas mandar titulo ou concluida como null explicitamente não
    @field_validator("titulo", "concluida")
    @classmethod
    def nao_aceita_nulo(cls, valor):
        if valor is None:
            raise ValueError("não pode ser nulo")
        return valor


class Tarefa(TarefaBase):
    id: int
