from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.db.database import get_db
from app.core.dependencies import get_current_user, require_any_role
from app.services.ai_service import generar_resumen_diagnostico, responder_chat
from app.CRUD.chat_sesiones import (
    listar_sesiones, crear_sesion, obtener_sesion, eliminar_sesion,
    agregar_mensaje, obtener_mensajes, actualizar_titulo_sesion, touch_sesion
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["Asistente IA"])

ROLES_IA = ["docente", "asesor", "talento_humano", "jefe_talento_humano", "admin"]


# ── Schemas ──────────────────────────────────────────────────────────────────

class ChatMessageSchema(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    pregunta: str
    sesion_id: Optional[int] = None


class ChatResponse(BaseModel):
    respuesta: str
    sesion_id: int


class ResumenResponse(BaseModel):
    resumen: str
    diagnostico_id: int


class SesionResponse(BaseModel):
    id: int
    titulo: str
    created_at: str
    updated_at: str
    total_mensajes: int

    class Config:
        from_attributes = True


class MensajeResponse(BaseModel):
    id: int
    rol: str
    contenido: str
    created_at: str

    class Config:
        from_attributes = True


class CrearSesionRequest(BaseModel):
    titulo: Optional[str] = "Nueva conversación"


class ActualizarTituloRequest(BaseModel):
    titulo: str


# ── Resumen IA ────────────────────────────────────────────────────────────────

@router.post("/resumen-diagnostico/{diagnostico_id}", response_model=ResumenResponse)
def resumen_diagnostico(
    diagnostico_id: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
    _=Depends(require_any_role(ROLES_IA))
):
    try:
        resumen = generar_resumen_diagnostico(db, diagnostico_id, usuario)
        return ResumenResponse(resumen=resumen, diagnostico_id=diagnostico_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error generando resumen IA: {e}")
        raise HTTPException(status_code=500, detail="Error al generar el resumen con IA. Verifica que la clave GEMINI_API_KEY esté configurada.")


# ── Sesiones ──────────────────────────────────────────────────────────────────

@router.get("/sesiones", response_model=List[SesionResponse])
def listar(
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
    _=Depends(require_any_role(ROLES_IA))
):
    sesiones = listar_sesiones(db, usuario.id)
    return [
        SesionResponse(
            id=s.id,
            titulo=s.titulo,
            created_at=s.created_at.isoformat() if s.created_at else "",
            updated_at=s.updated_at.isoformat() if s.updated_at else "",
            total_mensajes=len(s.mensajes),
        )
        for s in sesiones
    ]


@router.post("/sesiones", response_model=SesionResponse)
def crear(
    data: CrearSesionRequest,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
    _=Depends(require_any_role(ROLES_IA))
):
    s = crear_sesion(db, usuario.id, data.titulo)
    return SesionResponse(
        id=s.id,
        titulo=s.titulo,
        created_at=s.created_at.isoformat() if s.created_at else "",
        updated_at=s.updated_at.isoformat() if s.updated_at else "",
        total_mensajes=0,
    )


@router.delete("/sesiones/{sesion_id}")
def eliminar(
    sesion_id: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
    _=Depends(require_any_role(ROLES_IA))
):
    sesion = obtener_sesion(db, sesion_id, usuario.id)
    if not sesion:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    eliminar_sesion(db, sesion)
    return {"ok": True}


@router.patch("/sesiones/{sesion_id}/titulo")
def renombrar(
    sesion_id: int,
    data: ActualizarTituloRequest,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
    _=Depends(require_any_role(ROLES_IA))
):
    sesion = obtener_sesion(db, sesion_id, usuario.id)
    if not sesion:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    actualizar_titulo_sesion(db, sesion, data.titulo)
    return {"ok": True}


@router.get("/sesiones/{sesion_id}/mensajes", response_model=List[MensajeResponse])
def mensajes(
    sesion_id: int,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
    _=Depends(require_any_role(ROLES_IA))
):
    sesion = obtener_sesion(db, sesion_id, usuario.id)
    if not sesion:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    msgs = obtener_mensajes(db, sesion_id)
    return [
        MensajeResponse(
            id=m.id,
            rol=m.rol,
            contenido=m.contenido,
            created_at=m.created_at.isoformat() if m.created_at else "",
        )
        for m in msgs
    ]


# ── Chat ──────────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user),
    _=Depends(require_any_role(ROLES_IA))
):
    try:
        # Obtener o crear sesión
        if request.sesion_id:
            sesion = obtener_sesion(db, request.sesion_id, usuario.id)
            if not sesion:
                raise HTTPException(status_code=404, detail="Sesión no encontrada")
        else:
            sesion = crear_sesion(db, usuario.id, "Nueva conversación")

        # Cargar historial de la sesión para contexto
        msgs_bd = obtener_mensajes(db, sesion.id, limit=20)
        historial = [{"role": m.rol, "content": m.contenido} for m in msgs_bd]

        # Guardar mensaje del usuario
        agregar_mensaje(db, sesion.id, "user", request.pregunta)

        # Generar respuesta con IA
        respuesta = responder_chat(db, usuario, request.pregunta, historial)

        # Guardar respuesta del asistente
        agregar_mensaje(db, sesion.id, "assistant", respuesta)

        # Auto-titular la sesión con el primer mensaje si es nueva
        if len(msgs_bd) == 0 and sesion.titulo == "Nueva conversación":
            titulo_auto = request.pregunta[:80] + ("…" if len(request.pregunta) > 80 else "")
            actualizar_titulo_sesion(db, sesion, titulo_auto)

        # Actualizar timestamp de la sesión
        touch_sesion(db, sesion)

        return ChatResponse(respuesta=respuesta, sesion_id=sesion.id)

    except HTTPException:
        raise
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error en chat IA: {e}")
        raise HTTPException(status_code=500, detail="Error al procesar tu mensaje. Verifica que la clave GEMINI_API_KEY esté configurada.")
