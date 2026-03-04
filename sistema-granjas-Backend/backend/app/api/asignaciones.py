from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.db.models import GranjaPrograma  # Ajusta la importación según tu modelo
from app.core.dependencies import get_current_user  # Si necesitas autenticación
from pydantic import BaseModel

router = APIRouter(prefix="/asignaciones", tags=["Asignaciones"])

class RelacionProgramaGranja(BaseModel):
    programa_id: int
    granja_id: int

    class Config:
        from_attributes = True  # Para SQLAlchemy 2.0, usa 'from_attributes' en lugar de 'orm_mode'

@router.get("/programa-granja", response_model=List[RelacionProgramaGranja])
def obtener_relaciones(
    db: Session = Depends(get_db),
    # current_user = Depends(get_current_user)  # Opcional: protege el endpoint
):
    """
    Devuelve todas las relaciones programa-granja desde la tabla pivote.
    Útil para filtrar en el frontend sin necesidad de múltiples llamadas.
    """
    try:
        relaciones = db.query(GranjaPrograma).all()
        return relaciones
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener relaciones: {str(e)}")