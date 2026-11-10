# Importar os modelos aqui garante que eles fiquem registrados no Base.metadata
# (o Alembic depende disso pra gerar as migrations)
from app.models.tarefa import TarefaModel

__all__ = ["TarefaModel"]
