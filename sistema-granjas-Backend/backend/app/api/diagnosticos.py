import os
import json
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.db.database import get_db
from app.db.models import Diagnostico, Usuario, Lote, Programa, Monitoreo, Recomendacion
from app.schemas.diagnostico_schema import (
    DiagnosticoCreate, DiagnosticoUpdate,
    DiagnosticoResponse, DiagnosticoWithRecomendacionesResponse,
    DiagnosticoListResponse, EstadisticasDiagnosticosResponse,
)
from app.core.dependencies import get_current_user, require_any_role
from app.CRUD import diagnosticos as crud

router = APIRouter(prefix="/diagnosticos", tags=["diagnosticos"])

# Configuración de subida de archivos
UPLOAD_DIR = "uploads/"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def guardar_archivo(archivo: UploadFile, prefix: str) -> str:
    """Guarda un archivo en el disco y devuelve la ruta relativa."""
    ext = os.path.splitext(archivo.filename)[1]
    nombre_unico = f"{uuid.uuid4().hex}{ext}"
    ruta_relativa = os.path.join(UPLOAD_DIR, f"{prefix}_{nombre_unico}")
    ruta_absoluta = os.path.abspath(ruta_relativa)
    with open(ruta_absoluta, "wb") as buffer:
        shutil.copyfileobj(archivo.file, buffer)
    return ruta_relativa

def procesar_archivos(form_data: Dict[str, Any], archivos: List[UploadFile]) -> Dict[str, List[str]]:
    """
    Procesa los archivos subidos. Espera que el nombre del campo sea algo como:
        files[prefix][indice]
    Retorna un diccionario: { prefix: [ruta1, ruta2, ...] }
    """
    fotos_por_prefix: Dict[str, List[str]] = {}
    for archivo in archivos:
        # El nombre del campo viene como "files[artropodo_planta_1_cuadrante_1_rama_1_otro_fotos][0]"
        campo = archivo.name
        # Extraer el prefix: todo lo que está entre corchetes después de "files["
        import re
        match = re.search(r'files\[(.*?)\]', campo)
        if match:
            prefix = match.group(1)
            ruta = guardar_archivo(archivo, prefix.replace('[', '_').replace(']', '_'))
            fotos_por_prefix.setdefault(prefix, []).append(ruta)
    return fotos_por_prefix

# ── Helper ────────────────────────────────────────────────────────────────────
def get_or_404(db: Session, model, id: int, msg: str = "Recurso no encontrado"):
    obj = db.get(model, id)
    if not obj:
        raise HTTPException(404, msg)
    return obj

def _enriquecer(obj: Diagnostico) -> None:
    """Añade campos calculados al objeto Diagnostico antes de serializar."""
    obj.programa_nombre       = obj.programa.nombre if obj.programa else None
    obj.tipo_monitoreo_nombre = obj.tipo_monitoreo.nombre if obj.tipo_monitoreo else None
    obj.lote_nombre           = obj.lote.nombre if obj.lote else None
    obj.granja_nombre         = getattr(obj.lote.granja, "nombre", None) if obj.lote else None
    obj.usuario_nombre        = obj.usuario.nombre if obj.usuario else None


# ── LISTAR (sin cambios) ──────────────────────────────────────────────────────
@router.get("/", response_model=DiagnosticoListResponse)
def listar_diagnosticos(
    skip:             int = 0,
    limit:            int = 100,
    programa_id:      Optional[int] = None,
    tipo_monitoreo_id: Optional[int] = None,
    lote_id:          Optional[int] = None,
    usuario_id:       Optional[int] = None,
    tipo_diagnostico: Optional[str] = None,
    db:   Session = Depends(get_db),
    user: Usuario = Depends(require_any_role(["admin", "docente", "asesor", "estudiante"]))
):
    query = db.query(Diagnostico)

    if user.rol.nombre == "estudiante":
        query = query.filter(Diagnostico.usuario_id == user.id)

    if programa_id:
        query = query.filter(Diagnostico.programa_id == programa_id)
    if tipo_monitoreo_id:
        query = query.filter(Diagnostico.tipo_monitoreo_id == tipo_monitoreo_id)
    if lote_id:
        query = query.filter(Diagnostico.lote_id == lote_id)
    if usuario_id and user.rol.nombre in ["admin", "docente", "asesor"]:
        query = query.filter(Diagnostico.usuario_id == usuario_id)
    if tipo_diagnostico:
        query = query.filter(Diagnostico.tipo_diagnostico == tipo_diagnostico)

    total = query.count()
    items = query.order_by(Diagnostico.fecha_creacion.desc()).offset(skip).limit(limit).all()

    for d in items:
        _enriquecer(d)

    return DiagnosticoListResponse(
        items=items,
        total=total,
        paginas=(total + limit - 1) // limit
    )


# ── CREAR (con archivos) ──────────────────────────────────────────────────────
@router.post("/", response_model=DiagnosticoResponse, status_code=201)
async def crear_diagnostico(
    request: Request,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_any_role(["admin", "docente", "asesor", "estudiante"]))
):
    # Obtener datos del formulario multipart
    form_data = await request.form()
    
    # Extraer campos normales
    programa_id = int(form_data.get("programa_id"))
    tipo_monitoreo_id = int(form_data.get("tipo_monitoreo_id"))
    lote_id = int(form_data.get("lote_id"))
    usuario_id = int(form_data.get("usuario_id"))
    tipo_diagnostico = form_data.get("tipo_diagnostico")
    condiciones_dia = form_data.get("condiciones_dia")
    formulario_json = form_data.get("formulario")
    
    # Parsear formulario (JSON string)
    try:
        formulario = json.loads(formulario_json) if formulario_json else {}
    except json.JSONDecodeError:
        raise HTTPException(400, "El campo 'formulario' debe ser un JSON válido")
    
    # Obtener archivos subidos
    archivos = []
    for key, value in form_data.items():
        if key.startswith("files[") and hasattr(value, "filename"):
            archivos.append(value)  # value es UploadFile
    
    # Procesar archivos y obtener rutas
    fotos_por_prefix = procesar_archivos(form_data, archivos)
    
    # Agregar las rutas de fotos al formulario (dentro de caracterizacion)
    # La estructura esperada: formulario.caracterizacion ya contiene los nombres.
    # Agregamos una clave especial "fotos_subidas" con el mapa de rutas.
    if fotos_por_prefix:
        formulario["fotos_subidas"] = fotos_por_prefix
    
    # Validar permisos (estudiante solo para sí mismo)
    if user.rol.nombre == "estudiante" and usuario_id != user.id:
        raise HTTPException(403, "Solo puede crear diagnósticos para su propio usuario")
    
    # Validar FK
    get_or_404(db, Programa, programa_id, "Programa no encontrado")
    get_or_404(db, Monitoreo, tipo_monitoreo_id, "Tipo de monitoreo no encontrado")
    get_or_404(db, Lote, lote_id, "Lote no encontrado")
    get_or_404(db, Usuario, usuario_id, "Usuario no encontrado")
    
    # Crear el objeto DiagnosticoCreate (Pydantic) y luego el modelo
    data = DiagnosticoCreate(
        programa_id=programa_id,
        tipo_monitoreo_id=tipo_monitoreo_id,
        lote_id=lote_id,
        usuario_id=usuario_id,
        tipo_diagnostico=tipo_diagnostico,
        condiciones_dia=condiciones_dia,
        formulario=formulario
    )
    
    obj = crud.create_diagnostico(db, data)
    _enriquecer(obj)
    return obj


# ── OBTENER UNO (sin cambios) ─────────────────────────────────────────────────
@router.get("/{id}", response_model=DiagnosticoWithRecomendacionesResponse)
def obtener_diagnostico(
    id: int,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    obj = get_or_404(db, Diagnostico, id)
    if user.rol.nombre == "estudiante" and obj.usuario_id != user.id:
        raise HTTPException(403, "No puede ver este diagnóstico")
    _enriquecer(obj)
    obj.recomendaciones = db.query(Recomendacion).filter_by(diagnostico_id=id).all()
    return obj


# ── ACTUALIZAR (con soporte para archivos) ────────────────────────────────────
@router.put("/{id}", response_model=DiagnosticoResponse)
async def actualizar_diagnostico(
    id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user)
):
    obj = get_or_404(db, Diagnostico, id)
    if user.rol.nombre == "estudiante" and obj.usuario_id != user.id:
        raise HTTPException(403, "No tiene permisos para editar este diagnóstico")
    
    form_data = await request.form()
    
    # Construir datos de actualización (solo los campos presentes)
    update_data = {}
    if "tipo_diagnostico" in form_data:
        update_data["tipo_diagnostico"] = form_data.get("tipo_diagnostico")
    if "condiciones_dia" in form_data:
        update_data["condiciones_dia"] = form_data.get("condiciones_dia")
    if "formulario" in form_data:
        try:
            formulario_nuevo = json.loads(form_data.get("formulario"))
            # Mantener fotos existentes si no se envían nuevas? Por simplicidad, reemplazamos.
            update_data["formulario"] = formulario_nuevo
        except:
            raise HTTPException(400, "El campo 'formulario' debe ser JSON válido")
    
    # Manejo de archivos nuevos (se eliminarán los anteriores si se envían nuevos)
    # Para simplificar, si se envían archivos, reemplazamos completamente las fotos de ese prefix.
    # Opcional: implementar lógica de eliminación de archivos viejos.
    archivos = [value for key, value in form_data.items() if key.startswith("files[") and hasattr(value, "filename")]
    if archivos:
        fotos_por_prefix = procesar_archivos(form_data, archivos)
        # Obtener formulario actualizado (puede ser el existente o el nuevo)
        formulario_actual = update_data.get("formulario", obj.formulario or {})
        formulario_actual["fotos_subidas"] = fotos_por_prefix
        update_data["formulario"] = formulario_actual
    
    # Aplicar actualización
    if update_data:
        data_update = DiagnosticoUpdate(**update_data)
        obj = crud.update_diagnostico(db, obj, data_update)
    
    _enriquecer(obj)
    return obj


# ── ELIMINAR (con eliminación de archivos físicos) ────────────────────────────
@router.delete("/{id}", status_code=200)
def eliminar_diagnostico(
    id: int,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_any_role(["admin", "docente", "asesor"]))
):
    obj = get_or_404(db, Diagnostico, id)
    if obj.recomendaciones:
        raise HTTPException(400, "No se puede eliminar un diagnóstico con recomendaciones asociadas")
    
    # Eliminar archivos físicos asociados
    if obj.formulario and "fotos_subidas" in obj.formulario:
        fotos_por_prefix = obj.formulario["fotos_subidas"]
        for prefix, rutas in fotos_por_prefix.items():
            for ruta in rutas:
                ruta_abs = os.path.abspath(ruta)
                if os.path.exists(ruta_abs):
                    os.remove(ruta_abs)
    
    crud.delete_diagnostico(db, obj)
    return {"message": "Diagnóstico eliminado correctamente"}


# ── ESTADÍSTICAS (sin cambios) ────────────────────────────────────────────────
@router.get("/estadisticas/resumen", response_model=EstadisticasDiagnosticosResponse)
def obtener_estadisticas(
    programa_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: Usuario = Depends(require_any_role(["admin", "docente", "asesor", "estudiante"]))
):
    query = db.query(Diagnostico)
    if user.rol.nombre == "estudiante":
        query = query.filter(Diagnostico.usuario_id == user.id)
    if programa_id:
        query = query.filter(Diagnostico.programa_id == programa_id)
    total = query.count()
    por_tipo: dict = {}
    for row in db.query(Diagnostico.tipo_diagnostico).distinct():
        t = row[0]
        if t:
            por_tipo[t] = query.filter(Diagnostico.tipo_diagnostico == t).count()
    por_lote: dict = {}
    for d in query.all():
        nombre_lote = d.lote.nombre if d.lote else f"lote_{d.lote_id}"
        por_lote[nombre_lote] = por_lote.get(nombre_lote, 0) + 1
    return EstadisticasDiagnosticosResponse(
        total=total,
        por_tipo=por_tipo,
        por_lote=por_lote,
    )