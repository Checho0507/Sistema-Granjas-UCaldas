from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import date, datetime

# ========== TIPOS DE INVENTARIO ==========
class ProgramaInventarioTipoBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    descripcion: Optional[str] = None
    orden: int = Field(0, ge=0)
    activo: bool = True

class ProgramaInventarioTipoCreate(ProgramaInventarioTipoBase):
    programa_id: int = Field(..., gt=0)

class ProgramaInventarioTipoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    descripcion: Optional[str] = None
    orden: Optional[int] = Field(None, ge=0)
    activo: Optional[bool] = None

class ProgramaInventarioTipoResponse(ProgramaInventarioTipoBase):
    id: int
    programa_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ========== CAMPOS ==========
class InventarioCampoBase(BaseModel):
    nombre_campo: str = Field(..., min_length=1, max_length=100)
    tipo_dato: str = Field(..., pattern="^(text|number|date|select|boolean)$")
    requerido: bool = False
    opciones: Optional[List[str]] = None
    orden: int = 0
    ancho: str = "auto"

    @field_validator('tipo_dato')
    def tipo_dato_valido(cls, v):
        if v not in ['text', 'number', 'date', 'select', 'boolean']:
            raise ValueError('Tipo de dato no válido')
        return v

    @field_validator('opciones')
    def opciones_validas(cls, v, info):
        if info.data.get('tipo_dato') == 'select' and not v:
            raise ValueError('Para tipo "select" se requieren opciones')
        return v

class InventarioCampoCreate(InventarioCampoBase):
    tipo_id: int = Field(..., gt=0)

class InventarioCampoUpdate(BaseModel):
    nombre_campo: Optional[str] = Field(None, min_length=1, max_length=100)
    tipo_dato: Optional[str] = None
    requerido: Optional[bool] = None
    opciones: Optional[List[str]] = None
    orden: Optional[int] = Field(None, ge=0)
    ancho: Optional[str] = None

class InventarioCampoResponse(InventarioCampoBase):
    id: int
    tipo_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ========== ITEMS (REGISTROS) ==========
class ItemInventarioProgramaBase(BaseModel):
    tipo_id: int = Field(..., gt=0)
    fecha_inventario: date = Field(default_factory=date.today)
    cantidad_disponible: float = Field(0.0, ge=0)
    unidad_medida: Optional[str] = None
    valores: Dict[str, Any] = {}
    observaciones: Optional[str] = None

    @field_validator('unidad_medida')
    def unidad_no_contiene_caracteres_raros(cls, v):
        if v and not v.replace(' ', '').isalnum():
            raise ValueError('Unidad de medida solo puede contener letras y números')
        return v

class ItemInventarioProgramaCreate(ItemInventarioProgramaBase):
    pass

class ItemInventarioProgramaUpdate(BaseModel):
    fecha_inventario: Optional[date] = None
    cantidad_disponible: Optional[float] = Field(None, ge=0)
    unidad_medida: Optional[str] = None
    valores: Optional[Dict[str, Any]] = None
    observaciones: Optional[str] = None

class ItemInventarioProgramaResponse(ItemInventarioProgramaBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ===== Respuestas enriquecidas =====
class TipoConCamposResponse(ProgramaInventarioTipoResponse):
    campos: List[InventarioCampoResponse] = []

class TipoConItemsResponse(ProgramaInventarioTipoResponse):
    items: List[ItemInventarioProgramaResponse] = []
    campos: List[InventarioCampoResponse] = []