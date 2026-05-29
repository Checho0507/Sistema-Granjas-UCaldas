from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.core.dependencies import require_any_role, get_current_user
from app.CRUD import inventario_dinamico as crud
from app.schemas.inventario_dinamico_schema import (
    ProgramaInventarioTipoCreate, ProgramaInventarioTipoUpdate, ProgramaInventarioTipoResponse,
    InventarioCampoCreate, InventarioCampoUpdate, InventarioCampoResponse,
    ItemInventarioProgramaCreate, ItemInventarioProgramaUpdate, ItemInventarioProgramaResponse,
    TipoConCamposResponse, TipoConItemsResponse
)
from app.db.models import Programa

router = APIRouter(prefix="/inventario-dinamico", tags=["Inventario Dinámico"])
role_required = Depends(require_any_role(["admin", "asesor", "docente", "talento_humano", "jefe_talento_humano"]))


def _verificar_acceso_programa(usuario, programa_id: int):
    """Verifica que el usuario tiene acceso al programa indicado.
    Admin tiene acceso a todo. Docentes, asesores y talento_humano
    solo pueden operar sobre sus programas asignados."""
    if usuario.rol.nombre == "admin":
        return
    programa_ids = {p.id for p in usuario.programas}
    if programa_id not in programa_ids:
        raise HTTPException(403, "No tiene acceso al inventario de este programa")


# ---------- Tipos de inventario ----------
@router.get("/programas/{programa_id}/tipos", response_model=List[ProgramaInventarioTipoResponse])
def listar_tipos(programa_id: int, db: Session = Depends(get_db), usuario=role_required):
    _verificar_acceso_programa(usuario, programa_id)
    tipos = crud.get_tipos_por_programa(db, programa_id)
    return tipos

@router.post("/tipos", response_model=ProgramaInventarioTipoResponse, status_code=201)
def crear_tipo(data: ProgramaInventarioTipoCreate, db: Session = Depends(get_db), usuario=role_required):
    programa = db.query(Programa).filter(Programa.id == data.programa_id).first()
    if not programa:
        raise HTTPException(404, "Programa no encontrado")
    _verificar_acceso_programa(usuario, data.programa_id)
    return crud.create_tipo(db, data)

@router.put("/tipos/{tipo_id}", response_model=ProgramaInventarioTipoResponse)
def actualizar_tipo(tipo_id: int, data: ProgramaInventarioTipoUpdate, db: Session = Depends(get_db), usuario=role_required):
    tipo = crud.get_tipo(db, tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo no encontrado")
    _verificar_acceso_programa(usuario, tipo.programa_id)
    return crud.update_tipo(db, tipo, data)

@router.delete("/tipos/{tipo_id}")
def eliminar_tipo(tipo_id: int, db: Session = Depends(get_db), usuario=role_required):
    tipo = crud.get_tipo(db, tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo no encontrado")
    _verificar_acceso_programa(usuario, tipo.programa_id)
    crud.delete_tipo(db, tipo)
    return {"message": "Tipo eliminado"}

# ---------- Campos ----------
@router.get("/tipos/{tipo_id}/campos", response_model=List[InventarioCampoResponse])
def listar_campos(tipo_id: int, db: Session = Depends(get_db), usuario=role_required):
    tipo = crud.get_tipo(db, tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo no encontrado")
    _verificar_acceso_programa(usuario, tipo.programa_id)
    campos = crud.get_campos_por_tipo(db, tipo_id)
    return campos

@router.post("/campos", response_model=InventarioCampoResponse, status_code=201)
def crear_campo(data: InventarioCampoCreate, db: Session = Depends(get_db), usuario=role_required):
    tipo = crud.get_tipo(db, data.tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo no encontrado")
    _verificar_acceso_programa(usuario, tipo.programa_id)
    return crud.create_campo(db, data)

@router.put("/campos/{campo_id}", response_model=InventarioCampoResponse)
def actualizar_campo(campo_id: int, data: InventarioCampoUpdate, db: Session = Depends(get_db), usuario=role_required):
    campo = crud.get_campo(db, campo_id)
    if not campo:
        raise HTTPException(404, "Campo no encontrado")
    tipo = crud.get_tipo(db, campo.tipo_id)
    if tipo:
        _verificar_acceso_programa(usuario, tipo.programa_id)
    return crud.update_campo(db, campo, data)

@router.delete("/campos/{campo_id}")
def eliminar_campo(campo_id: int, db: Session = Depends(get_db), usuario=role_required):
    campo = crud.get_campo(db, campo_id)
    if not campo:
        raise HTTPException(404, "Campo no encontrado")
    tipo = crud.get_tipo(db, campo.tipo_id)
    if tipo:
        _verificar_acceso_programa(usuario, tipo.programa_id)
    crud.delete_campo(db, campo)
    return {"message": "Campo eliminado"}

# ---------- Items (registros de inventario) ----------
def _validar_valores_segun_campos(db: Session, tipo_id: int, valores: dict):
    """Lanza HTTPException si los valores no cumplen definición de campos."""
    campos = crud.get_campos_por_tipo(db, tipo_id)
    nombre_campos = {c.nombre_campo: c for c in campos}
    for campo in campos:
        if campo.requerido and (campo.nombre_campo not in valores or valores[campo.nombre_campo] in (None, "")):
            raise HTTPException(400, f"El campo '{campo.nombre_campo}' es requerido")
    for campo_valor in valores:
        if campo_valor not in nombre_campos and campo_valor not in ['_', 'unidades']:
            raise HTTPException(400, f"El campo '{campo_valor}' no está definido para este tipo de inventario")
    for nombre, valor in valores.items():
        if nombre in nombre_campos:
            campo_def = nombre_campos[nombre]
            if campo_def.tipo_dato == "number" and not isinstance(valor, (int, float)):
                try:
                    float(valor)
                except:
                    raise HTTPException(400, f"El campo '{nombre}' debe ser numérico")
            elif campo_def.tipo_dato == "date":
                pass
            elif campo_def.tipo_dato == "select":
                if valor not in campo_def.opciones:
                    raise HTTPException(400, f"Valor '{valor}' no permitido para campo '{nombre}'")
            elif campo_def.tipo_dato == "boolean":
                if valor not in [True, False, "true", "false", 1, 0]:
                    raise HTTPException(400, f"El campo '{nombre}' debe ser booleano")

@router.get("/programas/{programa_id}/items-planos", response_model=List[ItemInventarioProgramaResponse])
def listar_todos_items_programa(programa_id: int, db: Session = Depends(get_db), usuario=role_required):
    """Devuelve todos los ítems de inventario de un programa, sin importar el tipo."""
    _verificar_acceso_programa(usuario, programa_id)
    tipos = crud.get_tipos_por_programa(db, programa_id)
    todos = []
    for tipo in tipos:
        items = crud.get_items_por_tipo(db, tipo.id, skip=0, limit=500)
        todos.extend(items)
    return todos

@router.get("/tipos/{tipo_id}/items", response_model=List[ItemInventarioProgramaResponse])
def listar_items(tipo_id: int, skip: int = 0, limit: int = 500, db: Session = Depends(get_db), usuario=role_required):
    tipo = crud.get_tipo(db, tipo_id)
    if tipo:
        _verificar_acceso_programa(usuario, tipo.programa_id)
    items = crud.get_items_por_tipo(db, tipo_id, skip=skip, limit=limit)
    return items

@router.get("/tipos/{tipo_id}/completo", response_model=TipoConItemsResponse)
def obtener_tipo_completo(tipo_id: int, db: Session = Depends(get_db), usuario=role_required):
    tipo = crud.get_tipo(db, tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo no encontrado")
    _verificar_acceso_programa(usuario, tipo.programa_id)
    campos = crud.get_campos_por_tipo(db, tipo_id)
    items = crud.get_items_por_tipo(db, tipo_id)
    return TipoConItemsResponse(**tipo.__dict__, campos=campos, items=items)

@router.post("/items", response_model=ItemInventarioProgramaResponse, status_code=201)
def crear_item(data: ItemInventarioProgramaCreate, db: Session = Depends(get_db), usuario=role_required):
    tipo = crud.get_tipo(db, data.tipo_id)
    if not tipo:
        raise HTTPException(404, "Tipo no encontrado")
    _verificar_acceso_programa(usuario, tipo.programa_id)
    _validar_valores_segun_campos(db, data.tipo_id, data.valores)
    return crud.create_item(db, data)

@router.put("/items/{item_id}", response_model=ItemInventarioProgramaResponse)
def actualizar_item(item_id: int, data: ItemInventarioProgramaUpdate, db: Session = Depends(get_db), usuario=role_required):
    item = crud.get_item(db, item_id)
    if not item:
        raise HTTPException(404, "Item no encontrado")
    tipo = crud.get_tipo(db, item.tipo_id)
    if tipo:
        _verificar_acceso_programa(usuario, tipo.programa_id)
    if data.valores is not None:
        _validar_valores_segun_campos(db, item.tipo_id, data.valores)
    return crud.update_item(db, item, data)

@router.delete("/items/{item_id}")
def eliminar_item(item_id: int, db: Session = Depends(get_db), usuario=role_required):
    item = crud.get_item(db, item_id)
    if not item:
        raise HTTPException(404, "Item no encontrado")
    tipo = crud.get_tipo(db, item.tipo_id)
    if tipo:
        _verificar_acceso_programa(usuario, tipo.programa_id)
    crud.delete_item(db, item)
    return {"message": "Item eliminado"}

# En app/routers/inventario_dinamico.py, después de los otros endpoints de items

@router.get("/items/{item_id}", response_model=ItemInventarioProgramaResponse)
def obtener_item(item_id: int, db: Session = Depends(get_db), usuario=role_required):
    """Obtiene un item de inventario por su ID."""
    item = crud.get_item(db, item_id)
    if not item:
        raise HTTPException(404, "Item no encontrado")
    tipo = crud.get_tipo(db, item.tipo_id)
    if tipo:
        _verificar_acceso_programa(usuario, tipo.programa_id)
    return item