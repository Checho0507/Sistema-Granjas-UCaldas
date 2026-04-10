from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime

# ===== PLANTA =====
class PlantaBase(BaseModel):
    lote_id: int = Field(..., gt=0)
    surco: int = Field(..., ge=1)
    numero: int = Field(..., ge=1)
    codigo: Optional[str] = None  # Se genera automáticamente si no se envía

    @field_validator('surco', 'numero')
    def validar_positivos(cls, v):
        if v <= 0:
            raise ValueError('Debe ser mayor a 0')
        return v

class PlantaCreate(PlantaBase):
    pass

class PlantaUpdate(BaseModel):
    surco: Optional[int] = Field(None, ge=1)
    numero: Optional[int] = Field(None, ge=1)
    estado: Optional[str] = None

class PlantaResponse(PlantaBase):
    id: int
    codigo: str
    estado: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Para usar en diagnóstico
class PlantaSimpleResponse(BaseModel):
    id: int
    codigo: str
    surco: int
    numero: int
    lote_id: int

    class Config:
        from_attributes = True

# Para la creación masiva
class GenerarPlantasResponse(BaseModel):
    mensaje: str
    creadas: int
    total_esperadas: int
    plantas: List[PlantaResponse]