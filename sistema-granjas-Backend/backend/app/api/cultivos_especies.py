from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.db.models import CultivoEspecie, Lote  # 👈 Importar Lote
from app.db.database import get_db
from app.core.dependencies import require_any_role
from app.CRUD.cultivos_especies import (
    get_all, get_by_id, create, update, delete
)
from app.schemas.cultivo_especie_schema import (
    CultivoEspecieCreate, CultivoEspecieUpdate, CultivoEspecieResponse
)

router = APIRouter(prefix="/cultivos", tags=["Cultivos / Especies"])

role_required = Depends(require_any_role(["admin"]))

@router.get("/", response_model=List[CultivoEspecieResponse])
def listar(db: Session = Depends(get_db), _=role_required):
    return get_all(db)

@router.get("/{id}", response_model=CultivoEspecieResponse)
def obtener(id: int, db: Session = Depends(get_db), _=role_required):
    item = get_by_id(db, id)
    if not item:
        raise HTTPException(404, "No encontrado")
    return item

@router.post("/", response_model=CultivoEspecieResponse, status_code=201)
def crear(data: CultivoEspecieCreate, db: Session = Depends(get_db), _=role_required):
    return create(db, data)

@router.put("/{id}", response_model=CultivoEspecieResponse)
def editar(id: int, data: CultivoEspecieUpdate, db: Session = Depends(get_db), _=role_required):
    item = get_by_id(db, id)
    if not item:
        raise HTTPException(404, "No encontrado")
    return update(db, item, data)

@router.delete("/{id}")
def eliminar(id: int, db: Session = Depends(get_db), _=role_required):
    item = get_by_id(db, id)
    if not item:
        raise HTTPException(404, "No encontrado")
    delete(db, item)
    return {"message": "✅ Eliminado correctamente"}

@router.get("/granja/{granja_id}", response_model=List[CultivoEspecieResponse])
def obtener_cultivos_por_granja(granja_id: int, db: Session = Depends(get_db), _=role_required):
    """
    Obtener todos los cultivos de una granja específica
    """
    cultivos = db.query(CultivoEspecie).filter(
        CultivoEspecie.granja_id == granja_id,
        CultivoEspecie.estado == "activo"
    ).all()
    
    if not cultivos:
        return []  # Retorna lista vacía si no hay cultivos
    
    return cultivos

# 👇 NUEVO ENDPOINT: Estadísticas de lotes para un cultivo específico
@router.get("/{id}/lotes/estadisticas", response_model=dict)
def obtener_estadisticas_lotes_cultivo(
    id: int,
    db: Session = Depends(get_db),
    _=role_required
):
    """
    Obtener estadísticas de lotes para un cultivo específico:
    - total_lotes: número total de lotes que usan este cultivo
    - lotes_activos: lotes activos con este cultivo
    - lotes_inactivos: lotes inactivos con este cultivo
    - lotes_completados: lotes completados con este cultivo
    - distribucion_por_programa: cuántos lotes por programa
    """
    # Verificar que el cultivo existe
    cultivo = get_by_id(db, id)
    if not cultivo:
        raise HTTPException(404, "Cultivo no encontrado")
    
    # Consultar lotes
    lotes_query = db.query(Lote).filter(
        Lote.cultivo_id == id,
        Lote.estado != "eliminado"
    )
    
    total_lotes = lotes_query.count()
    lotes_activos = lotes_query.filter(Lote.estado == "activo").count()
    lotes_inactivos = lotes_query.filter(Lote.estado == "inactivo").count()
    lotes_completados = lotes_query.filter(Lote.estado == "completado").count()
    
    # Obtener distribución por programa
    por_programa = db.query(
        Lote.programa_id,
        func.count(Lote.id).label('cantidad')
    ).filter(
        Lote.cultivo_id == id,
        Lote.programa_id.isnot(None),
        Lote.estado != "eliminado"
    ).group_by(
        Lote.programa_id
    ).all()
    
    return {
        "cultivo_id": id,
        "cultivo_nombre": cultivo.nombre,
        "total_lotes": total_lotes,
        "lotes_activos": lotes_activos,
        "lotes_inactivos": lotes_inactivos,
        "lotes_completados": lotes_completados,
        "distribucion_por_programa": [
            {"programa_id": p[0], "cantidad": p[1]} for p in por_programa
        ]
    }