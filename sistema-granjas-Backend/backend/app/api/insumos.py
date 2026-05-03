from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.dependencies import require_any_role, get_current_user
from app.db.models import Insumo
from app.schemas.insumo_schema import (
    InsumoCreate, InsumoUpdate, InsumoResponse
)
from app.CRUD import insumos as crud

router = APIRouter(prefix="/insumos", tags=["Insumos"])

# ✅ Admin, Asesor y Talento Humano
role_required = Depends(require_any_role(["admin", "asesor", "talento_humano"]))

@router.get("/", response_model=list[InsumoResponse])
def listar(db: Session = Depends(get_db), _=role_required):
    return crud.get_all(db)

@router.get("/programa/{programa_id}", response_model=list[InsumoResponse])
def listar_por_programa(
    programa_id: int,
    db: Session = Depends(get_db),
    _ = Depends(require_any_role(["admin", "asesor", "talento_humano", "docente", "estudiante", "trabajador"]))
):
    """Listar insumos disponibles para un programa específico"""
    return db.query(Insumo).filter(
        Insumo.programa_id == programa_id,
        Insumo.estado.in_(["disponible", "bajo_stock"])
    ).all()

@router.post("/", response_model=InsumoResponse, status_code=201)
def crear(data: InsumoCreate, db: Session = Depends(get_db), _=role_required):
    return crud.create(db, data)

@router.put("/{id}", response_model=InsumoResponse)
def actualizar(id: int, data: InsumoUpdate, db: Session = Depends(get_db), _=role_required):
    updated = crud.update(db, id, data)
    if not updated:
        raise HTTPException(404, "Insumo no encontrado")
    return updated

@router.delete("/{id}")
def eliminar(id: int, db: Session = Depends(get_db), _=role_required):
    deleted = crud.delete(db, id)
    if not deleted:
        raise HTTPException(404, "Insumo no encontrado")
    return {"message": "✅ Insumo eliminado correctamente"}
