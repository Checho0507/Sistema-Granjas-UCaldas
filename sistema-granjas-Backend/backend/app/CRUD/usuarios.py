from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.models import Usuario
from app.schemas.usuario_schema import UsuarioCreate, UsuarioUpdate
from app.core.security import get_password_hash

def get_usuario_by_id(db: Session, usuario_id: int, incluir_inactivos: bool = True):
    query = db.query(Usuario).filter(Usuario.id == usuario_id)
    if not incluir_inactivos:
        query = query.filter(Usuario.activo == True)
    return query.first()

def get_usuario_by_email(db: Session, email: str):
    # Para autenticación, siempre buscar incluso si está inactivo
    return db.query(Usuario).filter(Usuario.email == email).first()

def get_usuarios(db: Session, skip: int = 0, limit: int = 100, incluir_inactivos: bool = True):
    query = db.query(Usuario)
    if not incluir_inactivos:
        query = query.filter(Usuario.activo == True)
    return query.offset(skip).limit(limit).all()

def create_usuario(db: Session, usuario: UsuarioCreate, password: str = None, auth_provider: str = "traditional"):
    db_usuario = Usuario(
        nombre=usuario.nombre,
        email=usuario.email,
        rol_id=usuario.rol_id,
        activo=True,
        auth_provider=auth_provider
    )
    
    if password:
        db_usuario.password_hash = get_password_hash(password)
    
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

def update_usuario(db: Session, usuario_id: int, usuario_update: UsuarioUpdate):
    # Usar get_usuario_by_id con incluir_inactivos=True para poder actualizar inactivos
    db_usuario = get_usuario_by_id(db, usuario_id, incluir_inactivos=True)
    if db_usuario:
        update_data = usuario_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_usuario, field, value)
        db.commit()
        db.refresh(db_usuario)
    return db_usuario

def delete_usuario(db: Session, usuario_id: int):
    # Usar get_usuario_by_id con incluir_inactivos=True para poder eliminar inactivos
    db_usuario = get_usuario_by_id(db, usuario_id, incluir_inactivos=True)
    if db_usuario:
        db_usuario.activo = False
        db.commit()
        return True
    return False

def cambiar_rol_usuario(db: Session, usuario_id: int, nuevo_rol_id: int):
    # Usar get_usuario_by_id con incluir_inactivos=True para poder cambiar rol de inactivos
    db_usuario = get_usuario_by_id(db, usuario_id, incluir_inactivos=True)
    if db_usuario:
        db_usuario.rol_id = nuevo_rol_id
        db.commit()
        db.refresh(db_usuario)
        return db_usuario
    return None

def search_usuarios(db: Session, query: str, incluir_inactivos: bool = True):
    db_query = db.query(Usuario).filter(
        or_(
            Usuario.nombre.ilike(f"%{query}%"),
            Usuario.email.ilike(f"%{query}%")
        )
    )
    if not incluir_inactivos:
        db_query = db_query.filter(Usuario.activo == True)
    return db_query.all()

def get_trabajadores(db: Session, programa_ids: list = None, incluir_inactivos: bool = True):
    from app.db.models import Rol, usuario_programa
    query = db.query(Usuario).join(Rol, Usuario.rol_id == Rol.id).filter(
        Rol.nombre == "trabajador"
    )
    if not incluir_inactivos:
        query = query.filter(Usuario.activo == True)
    if programa_ids is not None and len(programa_ids) > 0:
        query = query.join(usuario_programa, Usuario.id == usuario_programa.c.usuario_id)\
                     .filter(usuario_programa.c.programa_id.in_(programa_ids))
    return query.all()

def update_password(db: Session, usuario_id: int, new_password: str):
    # Usar get_usuario_by_id con incluir_inactivos=True para poder actualizar contraseña de inactivos
    db_usuario = get_usuario_by_id(db, usuario_id, incluir_inactivos=True)
    if db_usuario:
        db_usuario.password_hash = get_password_hash(new_password)
        db.commit()
        return True
    return False