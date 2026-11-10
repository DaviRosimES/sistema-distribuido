from sqlalchemy import String, false
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


# Modelo ORM: representa como a tarefa é guardada no banco.
# O que entra e sai da API continua sendo os schemas Pydantic em app/schemas.
class TarefaModel(Base):
    __tablename__ = "tarefas"

    id: Mapped[int] = mapped_column(primary_key=True)
    titulo: Mapped[str] = mapped_column(String(100))
    descricao: Mapped[str | None] = mapped_column(String(500))
    concluida: Mapped[bool] = mapped_column(default=False, server_default=false())
