from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime

# Estados permitidos
ESTADOS_PLANTA = ["productivo", "para_eliminar", "punto_vacio"]

# ===== PLANTA =====
class PlantaBase(BaseModel):
    lote_id: int = Field(..., gt=0)
    surco: int = Field(..., ge=1)
    numero: int = Field(..., ge=1)
    codigo: Optional[str] = None
    estado: Optional[str] = "productivo"   # 👈 valor por defecto

    @field_validator('surco', 'numero')
    def validar_positivos(cls, v):
        if v <= 0:
            raise ValueError('Debe ser mayor a 0')
        return v

    @field_validator('estado')
    def validar_estado(cls, v):
        if v is not None and v not in ESTADOS_PLANTA:
            raise ValueError(f'Estado debe ser uno de: {", ".join(ESTADOS_PLANTA)}')
        return v

class PlantaCreate(PlantaBase):
    pass

class PlantaUpdate(BaseModel):
    surco: Optional[int] = Field(None, ge=1)
    numero: Optional[int] = Field(None, ge=1)
    estado: Optional[str] = None

    @field_validator('estado')
    def validar_estado(cls, v):
        if v is not None and v not in ESTADOS_PLANTA:
            raise ValueError(f'Estado debe ser uno de: {", ".join(ESTADOS_PLANTA)}')
        return v

class PlantaResponse(PlantaBase):
    id: int
    codigo: str
    estado: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PlantaSimpleResponse(BaseModel):
    id: int
    codigo: str
    surco: int
    numero: int
    lote_id: int

    class Config:
        from_attributes = True

class GenerarPlantasResponse(BaseModel):
    mensaje: str
    creadas: int
    total_esperadas: int
    plantas: List[PlantaResponse]