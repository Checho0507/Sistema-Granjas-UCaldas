from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import func

from app.db.database import get_db
from app.core.dependencies import require_any_role
from app.CRUD.lotes import (
    get_lotes, get_lote, create_lote, update_lote, delete_lote,
    get_lotes_por_programa, get_lotes_por_granja, get_lotes_activos,
    buscar_lotes_por_nombre, get_estadisticas_lotes,
    get_lotes_por_cultivo  # 👈 Nueva importación
)
from app.schemas.lote_schema import (
    LoteCreate, LoteUpdate, LoteResponse
)
from app.db.models import Lote

router = APIRouter(prefix="/lotes", tags=["Lotes"])

# Roles permitidos
role_required = Depends(require_any_role(["admin", "docente", "asesor", "talento_humano", "estudiante", "trabajador"]))

@router.get("/", response_model=List[LoteResponse])
def listar_lotes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    programa_id: Optional[int] = Query(None, description="Filtrar por programa ID"),
    granja_id: Optional[int] = Query(None, description="Filtrar por granja ID"),
    cultivo_id: Optional[int] = Query(None, description="Filtrar por cultivo ID"),  # 👈 NUEVO
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    db: Session = Depends(get_db),
    _=role_required
):
    """
    Listar todos los lotes con filtros opcionales:
    - programa_id: Filtrar por programa específico
    - granja_id: Filtrar por granja específica
    - cultivo_id: Filtrar por cultivo específico
    - estado: Filtrar por estado (activo, inactivo)
    """
    return get_lotes(
        db, 
        skip=skip, 
        limit=limit, 
        programa_id=programa_id, 
        granja_id=granja_id,
        cultivo_id=cultivo_id,  # 👈 NUEVO
        estado=estado
    )

@router.get("/{lote_id}", response_model=LoteResponse)
def obtener_lote(
    lote_id: int, 
    db: Session = Depends(get_db), 
    _=role_required
):
    """Obtener un lote por su ID"""
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    return lote

@router.post("/", response_model=LoteResponse, status_code=201)
def crear_lote(
    data: LoteCreate, 
    db: Session = Depends(get_db), 
    _=role_required
):
    """Crear un nuevo lote"""
    return create_lote(db, data)

@router.put("/{lote_id}", response_model=LoteResponse)
def editar_lote(
    lote_id: int, 
    data: LoteUpdate, 
    db: Session = Depends(get_db), 
    _=role_required
):
    """Actualizar un lote existente"""
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    return update_lote(db, lote, data)

@router.delete("/{lote_id}")
def eliminar_lote(
    lote_id: int, 
    db: Session = Depends(get_db), 
    _=role_required
):
    """Eliminar (marcar como eliminado) un lote"""
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    delete_lote(db, lote)
    return {"message": "✅ Lote eliminado correctamente"}

# === ENDPOINTS ESPECÍFICOS ===

@router.get("/por-programa/{programa_id}", response_model=List[LoteResponse])
def listar_lotes_por_programa(
    programa_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    _=role_required
):
    """Listar todos los lotes de un programa específico"""
    return get_lotes_por_programa(db, programa_id, skip=skip, limit=limit)

@router.get("/por-granja/{granja_id}", response_model=List[LoteResponse])
def listar_lotes_por_granja(
    granja_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    _=role_required
):
    """Listar todos los lotes de una granja específica"""
    return get_lotes_por_granja(db, granja_id, skip=skip, limit=limit)

# 👇 NUEVO ENDPOINT: Lotes por cultivo específico
@router.get("/por-cultivo/{cultivo_id}", response_model=List[LoteResponse])
def listar_lotes_por_cultivo(
    cultivo_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    _=role_required
):
    """Listar todos los lotes de un cultivo específico"""
    return get_lotes_por_cultivo(db, cultivo_id, skip=skip, limit=limit)

# 👇 NUEVO ENDPOINT: Conteo de lotes por cultivo
@router.get("/conteo/por-cultivo", response_model=List[dict])
def contar_lotes_por_cultivo(
    db: Session = Depends(get_db),
    _=role_required
):
    """
    Retorna el conteo de lotes agrupados por cultivo_id
    Útil para mostrar en la tabla de cultivos cuántos lotes usan cada cultivo
    """
    resultado = db.query(
        Lote.cultivo_id,
        func.count(Lote.id).label('total')
    ).filter(
        Lote.cultivo_id.isnot(None),
        Lote.estado != "eliminado"
    ).group_by(
        Lote.cultivo_id
    ).all()
    
    return [
        {"cultivo_id": r[0], "total": r[1]} for r in resultado
    ]

@router.get("/estado/activos", response_model=List[LoteResponse])
def listar_lotes_activos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    _=role_required
):
    """Listar solo lotes activos"""
    return get_lotes_activos(db, skip=skip, limit=limit)

@router.get("/buscar/{nombre}", response_model=List[LoteResponse])
def buscar_lotes(
    nombre: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    _=role_required
):
    """Buscar lotes por nombre (búsqueda parcial)"""
    return buscar_lotes_por_nombre(db, nombre, skip=skip, limit=limit)

@router.get("/estadisticas/resumen")
def obtener_estadisticas(
    db: Session = Depends(get_db),
    _=role_required
):
    """Obtener estadísticas de lotes"""
    return get_estadisticas_lotes(db)