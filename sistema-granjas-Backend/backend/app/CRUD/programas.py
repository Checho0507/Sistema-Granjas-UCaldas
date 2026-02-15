from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.db.models import Programa, Usuario, Granja
from app.schemas.programa_schema import ProgramaCreate, ProgramaUpdate

def get_programas(db: Session):
    return db.query(Programa).filter(Programa.activo == True).all()

def get_programa(db: Session, programa_id: int):
    return db.query(Programa).filter(Programa.id == programa_id).first()

def create_programa(db: Session, data: ProgramaCreate):
    programa = Programa(
        nombre=data.nombre,
        descripcion=data.descripcion,
        tipo=data.tipo,
        activo=True
    )
    db.add(programa)
    db.flush()

    if data.granjas_ids:
        granjas = db.query(Granja).filter(Granja.id.in_(data.granjas_ids)).all()
        if len(granjas) != len(data.granjas_ids):
            raise HTTPException(status_code=400, detail="Algunas granjas no existen")
        programa.granjas = granjas

    db.commit()
    db.refresh(programa)
    return programa

def update_programa(db: Session, programa: Programa, data: ProgramaUpdate):
    update_data = data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field != 'granjas_ids':
            setattr(programa, field, value)

    if 'granjas_ids' in update_data and data.granjas_ids is not None:
        granjas = db.query(Granja).filter(Granja.id.in_(data.granjas_ids)).all()
        if len(granjas) != len(data.granjas_ids):
            raise HTTPException(status_code=400, detail="Algunas granjas no existen")
        programa.granjas = granjas

    db.commit()
    db.refresh(programa)
    return programa

def delete_programa(db: Session, programa: Programa):
    programa.activo = False
    db.commit()
    return programa

# === ASIGNACIÓN DE USUARIOS ===
def asignar_usuario_programa(db: Session, programa_id: int, usuario_id: int):
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if usuario in programa.usuarios:
        raise HTTPException(status_code=400, detail="El usuario ya está asignado a este programa")
    programa.usuarios.append(usuario)
    db.commit()
    return programa

def desasignar_usuario_programa(db: Session, programa_id: int, usuario_id: int):
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if usuario not in programa.usuarios:
        raise HTTPException(status_code=400, detail="El usuario no está asignado a este programa")
    programa.usuarios.remove(usuario)
    db.commit()
    return {"message": "Usuario desasignado correctamente del programa"}

def listar_usuarios_programa(db: Session, programa_id: int):
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    return [
        {
            "id": u.id,
            "nombre": u.nombre,
            "email": u.email,
            "rol": u.rol.nombre if u.rol else None,
            "activo": u.activo
        }
        for u in programa.usuarios
    ]

# === ASIGNACIÓN DE GRANJAS (individual) ===
def asignar_granja_programa(db: Session, programa_id: int, granja_id: int):
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    granja = db.query(Granja).filter(Granja.id == granja_id).first()
    if not granja:
        raise HTTPException(status_code=404, detail="Granja no encontrada")
    if granja in programa.granjas:
        raise HTTPException(status_code=400, detail="La granja ya está asignada a este programa")
    programa.granjas.append(granja)
    db.commit()
    return programa

def desasignar_granja_programa(db: Session, programa_id: int, granja_id: int):
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    granja = db.query(Granja).filter(Granja.id == granja_id).first()
    if not granja:
        raise HTTPException(status_code=404, detail="Granja no encontrada")
    if granja not in programa.granjas:
        raise HTTPException(status_code=400, detail="La granja no está asignada a este programa")
    programa.granjas.remove(granja)
    db.commit()
    return {"message": "Granja desasignada correctamente del programa"}

def listar_granjas_programa(db: Session, programa_id: int):
    programa = get_programa(db, programa_id)
    if not programa:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    return [
        {
            "id": g.id,
            "nombre": g.nombre,
            "ubicacion": g.ubicacion,
            "activo": g.activo
        }
        for g in programa.granjas
    ]