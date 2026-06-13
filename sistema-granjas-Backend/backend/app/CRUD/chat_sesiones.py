from sqlalchemy.orm import Session
from app.db.models import ChatSesion, ChatMensaje


def listar_sesiones(db: Session, usuario_id: int, limit: int = 30):
    return (
        db.query(ChatSesion)
        .filter(ChatSesion.usuario_id == usuario_id)
        .order_by(ChatSesion.updated_at.desc())
        .limit(limit)
        .all()
    )


def crear_sesion(db: Session, usuario_id: int, titulo: str = "Nueva conversación") -> ChatSesion:
    sesion = ChatSesion(usuario_id=usuario_id, titulo=titulo)
    db.add(sesion)
    db.commit()
    db.refresh(sesion)
    return sesion


def obtener_sesion(db: Session, sesion_id: int, usuario_id: int):
    return (
        db.query(ChatSesion)
        .filter(ChatSesion.id == sesion_id, ChatSesion.usuario_id == usuario_id)
        .first()
    )


def actualizar_titulo_sesion(db: Session, sesion: ChatSesion, titulo: str) -> ChatSesion:
    sesion.titulo = titulo
    db.commit()
    db.refresh(sesion)
    return sesion


def eliminar_sesion(db: Session, sesion: ChatSesion):
    db.delete(sesion)
    db.commit()


def agregar_mensaje(db: Session, sesion_id: int, rol: str, contenido: str) -> ChatMensaje:
    mensaje = ChatMensaje(sesion_id=sesion_id, rol=rol, contenido=contenido)
    db.add(mensaje)
    db.commit()
    db.refresh(mensaje)
    return mensaje


def obtener_mensajes(db: Session, sesion_id: int, limit: int = 100):
    return (
        db.query(ChatMensaje)
        .filter(ChatMensaje.sesion_id == sesion_id)
        .order_by(ChatMensaje.created_at.asc())
        .limit(limit)
        .all()
    )


def touch_sesion(db: Session, sesion: ChatSesion):
    from datetime import datetime, timedelta
    sesion.updated_at = datetime.utcnow() - timedelta(hours=5)
    db.commit()
