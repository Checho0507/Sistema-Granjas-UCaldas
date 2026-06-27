from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List
import re
from app.db.database import get_db
from app.core.security import verify_token
from app.schemas.auth_schema import (
    LoginRequest, 
    RegisterRequest, 
    LogoutRequest, 
    TokenResponse, 
    UserVerification,
    SuccessMessage
)
from app.schemas.rol_schema import RolParaRegistro
from app.CRUD.roles import get_roles_para_registro
from app.services.auth_service import AuthService

import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])

# Expresión regular para validar el dominio @ucaldas.edu.co
UCLADAS_EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@ucaldas\.edu\.co$', re.IGNORECASE)

# *********************************
# RUTAS DE AUTENTICACIÓN
# *********************************

@router.post("/login", response_model=TokenResponse)
def login_tradicional(data: LoginRequest, db: Session = Depends(get_db)):
    """
    Inicia sesión tradicionalmente y devuelve un Token JWT.
    """
    try:
        logger.info(f"Intentando login tradicional para: {data.email}")
        response = AuthService.login_user(db, data)
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.post("/register", response_model=TokenResponse)
def register_tradicional(data: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario con email y contraseña.
    Solo se permiten correos del dominio @ucaldas.edu.co
    """
    try:
        logger.info(f"Intentando registro tradicional para: {data.email}")
        
        # 👇 VALIDAR DOMINIO DEL CORREO
        if not UCLADAS_EMAIL_REGEX.match(data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Solo se permiten correos institucionales @ucaldas.edu.co"
            )
        
        # Llama al servicio para manejar toda la lógica
        response = AuthService.register_user(db, data)
        return response 
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en registro: {str(e)}")
        db.rollback() 
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor durante el registro."
        )

@router.post("/logout", response_model=SuccessMessage)
def logout(data: LogoutRequest = Depends(LogoutRequest)):
    """
    Logout - principal función para el frontend para notificar el cierre.
    """
    if data and data.token:
        try:
            payload = verify_token(data.token)
            if payload:
                logger.info(f"Logout solicitado para usuario: {payload.get('sub')}")
        except Exception:
            pass
    
    logger.info("Logout exitoso")
    return SuccessMessage(
        message="Logout exitoso",
        detail="Token eliminado del cliente. Sesión cerrada correctamente."
    )

@router.get("/roles-disponibles")
def get_roles_disponibles(db: Session = Depends(get_db)):
    """Obtiene los roles disponibles para el registro de nuevos usuarios."""
    try:
        roles = get_roles_para_registro(db)
        return {"roles": [{"id": r.id, "nombre": r.nombre, "descripcion": r.descripcion or ""} for r in roles]}
    except Exception as e:
        logger.error(f"Error obteniendo roles disponibles: {e}")
        return {"roles": []}


@router.get("/verify", response_model=UserVerification)
def verify_token_endpoint(token: str, db: Session = Depends(get_db)):
    """
    Endpoint para verificar si un token es válido y devolver la información del usuario.
    """
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )
    
    from app.db.models import Usuario
    user_id = payload.get("id")
    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado"
        )
    
    programas = []
    for programa in usuario.programas:
        programas.append({
            "id": programa.id,
            "nombre": programa.nombre,
            "tipo": programa.tipo,
            "activo": programa.activo
        })
    
    return UserVerification(
        valid=True,
        user={
            "id": usuario.id,
            "email": usuario.email,
            "rol": usuario.rol.nombre if usuario.rol else None,
            "rol_id": usuario.rol_id,
            "nombre": usuario.nombre,
            "programas": programas
        }
    )