from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models import GranjaPrograma  # asumiendo que tienes la tabla pivote como modelo
from app.schemas.asignacion import RelacionProgramaGranja
from typing import List

router = APIRouter(prefix="/asignaciones", tags=["Asignaciones"])

@router.get("/programa-granja", response_model=List[RelacionProgramaGranja])
def obtener_relaciones_programa_granja(db: Session = Depends(get_db)):
    """
    Devuelve todas las relaciones entre programas y granjas desde la tabla pivote.
    """
    # Si tienes un modelo SQLAlchemy para la tabla pivote
    relaciones = db.query(GranjaPrograma).all()
    return relaciones

# También puedes agregar filtros por granja o programa
@router.get("/granja/{granja_id}/programas", response_model=List[int])
def obtener_programas_por_granja(granja_id: int, db: Session = Depends(get_db)):
    """
    Devuelve los IDs de programas asociados a una granja específica.
    """
    relaciones = db.query(GranjaPrograma).filter(GranjaPrograma.granja_id == granja_id).all()
    return [r.programa_id for r in relaciones]

@router.get("/programa/{programa_id}/granjas", response_model=List[int])
def obtener_granjas_por_programa(programa_id: int, db: Session = Depends(get_db)):
    """
    Devuelve los IDs de granjas asociadas a un programa específico.
    """
    relaciones = db.query(GranjaPrograma).filter(GranjaPrograma.programa_id == programa_id).all()
    return [r.granja_id for r in relaciones]