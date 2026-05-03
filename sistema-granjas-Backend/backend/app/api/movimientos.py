from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from app.db.database import get_db
from app.core.dependencies import get_current_user, require_any_role

router = APIRouter(prefix="/movimientos", tags=["Movimientos de Inventario"])

# ========== TODOS LOS ENDPOINTS ESTÁN TEMPORALMENTE DESHABILITADOS ==========
# La funcionalidad de movimientos será migrada al nuevo sistema de inventario dinámico.
# Por favor, utiliza la nueva API de inventario dinámico (/api/inventario-dinamico).

@router.get("/herramientas", response_model=dict)
def listar_movimientos_herramientas(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    herramienta_id: Optional[int] = None,
    labor_id: Optional[int] = None,
    tipo_movimiento: Optional[str] = Query(None, regex="^(salida|entrada)$"),
    fecha_desde: Optional[datetime] = None,
    fecha_hasta: Optional[datetime] = None,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "talento_humano", "docente"]))
):
    """
    ⚠️ FUNCIONALIDAD DESCONTINUADA: La gestión de movimientos de herramientas será migrada al nuevo sistema de inventario dinámico.
    """
    raise HTTPException(501, "Funcionalidad en migración. Próximamente disponible en el nuevo módulo de inventario dinámico.")

@router.get("/insumos", response_model=dict)
def listar_movimientos_insumos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    insumo_id: Optional[int] = None,
    labor_id: Optional[int] = None,
    tipo_movimiento: Optional[str] = Query(None, regex="^(salida|entrada)$"),
    fecha_desde: Optional[datetime] = None,
    fecha_hasta: Optional[datetime] = None,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "talento_humano", "docente"]))
):
    """
    ⚠️ FUNCIONALIDAD DESCONTINUADA: La gestión de movimientos de insumos será migrada al nuevo sistema de inventario dinámico.
    """
    raise HTTPException(501, "Funcionalidad en migración. Próximamente disponible en el nuevo módulo de inventario dinámico.")

@router.get("/herramientas/{movimiento_id}")
def obtener_movimiento_herramienta(
    movimiento_id: int,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "talento_humano", "docente"]))
):
    """
    ⚠️ FUNCIONALIDAD DESCONTINUADA: La gestión de movimientos de herramientas será migrada al nuevo sistema de inventario dinámico.
    """
    raise HTTPException(501, "Funcionalidad en migración. Próximamente disponible en el nuevo módulo de inventario dinámico.")

@router.get("/insumos/{movimiento_id}")
def obtener_movimiento_insumo(
    movimiento_id: int,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "talento_humano", "docente"]))
):
    """
    ⚠️ FUNCIONALIDAD DESCONTINUADA: La gestión de movimientos de insumos será migrada al nuevo sistema de inventario dinámico.
    """
    raise HTTPException(501, "Funcionalidad en migración. Próximamente disponible en el nuevo módulo de inventario dinámico.")

@router.get("/labor/{labor_id}")
def obtener_movimientos_labor(
    labor_id: int,
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user)
):
    """
    ⚠️ FUNCIONALIDAD DESCONTINUADA: La gestión de movimientos por labor será migrada al nuevo sistema de inventario dinámico.
    """
    raise HTTPException(501, "Funcionalidad en migración. Próximamente disponible en el nuevo módulo de inventario dinámico.")

@router.get("/estadisticas/resumen")
def obtener_estadisticas_movimientos(
    dias: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    usuario = Depends(get_current_user),
    _ = Depends(require_any_role(["admin", "talento_humano"]))
):
    """
    ⚠️ FUNCIONALIDAD DESCONTINUADA: Las estadísticas de movimientos serán migradas al nuevo sistema de inventario dinámico.
    """
    raise HTTPException(501, "Funcionalidad en migración. Próximamente disponible en el nuevo módulo de inventario dinámico.")