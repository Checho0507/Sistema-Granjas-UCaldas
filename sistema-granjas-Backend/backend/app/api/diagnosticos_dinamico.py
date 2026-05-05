from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.core.dependencies import require_any_role
from app.CRUD import diagnosticos_dinamico as crud
from app.schemas.diagnostico_dinamico_schema import (
    DiagnosticoTipoCreate, DiagnosticoTipoUpdate, DiagnosticoTipoResponse,
    DiagnosticoCampoCreate, DiagnosticoCampoUpdate, DiagnosticoCampoResponse,
    DiagnosticoTipoConCamposResponse
)
from app.db.models import Programa

router = APIRouter(prefix="/diagnosticos-dinamico", tags=["Diagnósticos Dinámico"])
role_admin = Depends(require_any_role(["admin", "docente", "asesor"]))
role_read = Depends(require_any_role(["admin", "docente", "asesor", "estudiante", "trabajador", "talento_humano"]))


# ---------- Tipos de diagnóstico ----------

@router.get("/programas/{programa_id}/tipos", response_model=List[DiagnosticoTipoResponse])
def listar_tipos(programa_id: int, db: Session = Depends(get_db), _=role_read):
    return crud.get_tipos_por_programa(db, programa_id)


@router.get("/tipos/{tipo_id}", response_model=DiagnosticoTipoConCamposResponse)
def obtener_tipo(tipo_id: int, db: Session = Depends(get_db), _=role_read):
    tipo = crud.get_tipo(db, tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo no encontrado")
    campos = crud.get_campos_por_tipo(db, tipo_id)
    return DiagnosticoTipoConCamposResponse(
        **{k: v for k, v in tipo.__dict__.items() if not k.startswith("_")},
        campos=campos
    )


@router.post("/tipos", response_model=DiagnosticoTipoResponse, status_code=201)
def crear_tipo(data: DiagnosticoTipoCreate, db: Session = Depends(get_db), _=role_admin):
    programa = db.query(Programa).filter(Programa.id == data.programa_id).first()
    if not programa:
        raise HTTPException(404, "Programa no encontrado")
    return crud.create_tipo(db, data)


@router.put("/tipos/{tipo_id}", response_model=DiagnosticoTipoResponse)
def actualizar_tipo(tipo_id: int, data: DiagnosticoTipoUpdate, db: Session = Depends(get_db), _=role_admin):
    tipo = crud.get_tipo(db, tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo no encontrado")
    return crud.update_tipo(db, tipo, data)


@router.delete("/tipos/{tipo_id}")
def eliminar_tipo(tipo_id: int, db: Session = Depends(get_db), _=role_admin):
    tipo = crud.get_tipo(db, tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo no encontrado")
    if tipo.diagnosticos:
        raise HTTPException(400, "No se puede eliminar un tipo con diagnósticos asociados")
    crud.delete_tipo(db, tipo)
    return {"message": "Tipo eliminado"}


# ---------- Campos ----------

@router.get("/tipos/{tipo_id}/campos", response_model=List[DiagnosticoCampoResponse])
def listar_campos(tipo_id: int, db: Session = Depends(get_db), _=role_read):
    return crud.get_campos_por_tipo(db, tipo_id)


@router.post("/campos", response_model=DiagnosticoCampoResponse, status_code=201)
def crear_campo(data: DiagnosticoCampoCreate, db: Session = Depends(get_db), _=role_admin):
    tipo = crud.get_tipo(db, data.tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo no encontrado")
    return crud.create_campo(db, data)


@router.put("/campos/{campo_id}", response_model=DiagnosticoCampoResponse)
def actualizar_campo(campo_id: int, data: DiagnosticoCampoUpdate, db: Session = Depends(get_db), _=role_admin):
    campo = crud.get_campo(db, campo_id)
    if not campo:
        raise HTTPException(404, "Campo no encontrado")
    return crud.update_campo(db, campo, data)


@router.delete("/campos/{campo_id}")
def eliminar_campo(campo_id: int, db: Session = Depends(get_db), _=role_admin):
    campo = crud.get_campo(db, campo_id)
    if not campo:
        raise HTTPException(404, "Campo no encontrado")
    crud.delete_campo(db, campo)
    return {"message": "Campo eliminado"}
