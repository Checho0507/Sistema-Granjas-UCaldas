from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.core.dependencies import require_any_role, get_current_user
from app.db.models import Lote, Diagnostico, Recomendacion, Labor
from app.CRUD.lotes import (
    get_lotes, get_lote, create_lote, update_lote, delete_lote
)
from app.schemas.lote_schema import (
    LoteCreate, LoteUpdate, LoteResponse
)

router = APIRouter(prefix="/lotes", tags=["Lotes"])

role_required = Depends(require_any_role(["admin", "docente","asesor","talento_humano", "estudiante", "trabajador"]))

@router.get("/", response_model=List[LoteResponse])
def listar_lotes(db: Session = Depends(get_db), _=role_required):
    return get_lotes(db)

@router.get("/{lote_id}", response_model=LoteResponse)
def obtener_lote(lote_id: int, db: Session = Depends(get_db), _=role_required):
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(404, "Lote no encontrado")
    return lote

@router.get("/{lote_id}/diagnosticos-resumen")
def diagnosticos_resumen(
    lote_id: int,
    db: Session = Depends(get_db),
    _ = Depends(require_any_role(["admin", "docente", "asesor", "talento_humano", "estudiante", "trabajador"]))
):
    """Resumen de diagnósticos, recomendaciones y labores de un lote para el mapa visual"""
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(404, "Lote no encontrado")

    diags = db.query(Diagnostico).filter(Diagnostico.lote_id == lote_id).all()
    recs = db.query(Recomendacion).filter(Recomendacion.lote_id == lote_id).all()
    labores = db.query(Labor).filter(Labor.lote_id == lote_id).all()

    ultimo_diag = None
    if diags:
        ultimo_diag = sorted(diags, key=lambda d: d.fecha_creacion, reverse=True)[0]

    return {
        "lote_id": lote_id,
        "lote_nombre": lote.nombre,
        "granja_nombre": lote.granja.nombre if lote.granja else None,
        "programa_nombre": lote.programa.nombre if lote.programa else None,
        "programa_id": lote.programa_id,
        "cultivo": lote.nombre_cultivo,
        "estado_lote": lote.estado,
        "diagnosticos": {
            "total": len(diags),
            "abiertos": sum(1 for d in diags if d.estado == "abierto"),
            "en_revision": sum(1 for d in diags if d.estado == "en_revision"),
            "cerrados": sum(1 for d in diags if d.estado == "cerrado"),
            "ultimo_estado": ultimo_diag.estado if ultimo_diag else None,
            "ultimo_tipo": ultimo_diag.tipo if ultimo_diag else None,
            "ultima_fecha": ultimo_diag.fecha_creacion.isoformat() if ultimo_diag else None,
        },
        "recomendaciones": {
            "total": len(recs),
            "pendientes": sum(1 for r in recs if r.estado == "pendiente"),
            "aprobadas": sum(1 for r in recs if r.estado == "aprobada"),
            "completadas": sum(1 for r in recs if r.estado == "completada"),
        },
        "labores": {
            "total": len(labores),
            "pendientes": sum(1 for l in labores if l.estado == "pendiente"),
            "en_progreso": sum(1 for l in labores if l.estado == "en_progreso"),
            "completadas": sum(1 for l in labores if l.estado == "completada"),
        }
    }

@router.post("/", response_model=LoteResponse, status_code=201)
def crear_lote(data: LoteCreate, db: Session = Depends(get_db), _=role_required):
    return create_lote(db, data)

@router.put("/{lote_id}", response_model=LoteResponse)
def editar_lote(lote_id: int, data: LoteUpdate, db: Session = Depends(get_db), _=role_required):
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(404, "Lote no encontrado")
    return update_lote(db, lote, data)

@router.delete("/{lote_id}")
def eliminar_lote(lote_id: int, db: Session = Depends(get_db), _=role_required):
    lote = get_lote(db, lote_id)
    if not lote:
        raise HTTPException(404, "Lote no encontrado")
    delete_lote(db, lote)
    return {"message": "✅ Lote eliminado correctamente"}
