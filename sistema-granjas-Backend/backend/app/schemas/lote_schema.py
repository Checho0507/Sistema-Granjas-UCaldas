from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, List
from datetime import datetime
import re

# ===== SCHEMAS PARA LA TABLA INTERMEDIA LOTE-CULTIVO =====

class LoteCultivoBase(BaseModel):
    lote_id: int
    cultivo_id: int


class LoteCultivoCreate(LoteCultivoBase):
    pass


class LoteCultivoUpdate(BaseModel):
    lote_id: Optional[int] = None
    cultivo_id: Optional[int] = None

    @model_validator(mode='after')
    def validar_al_menos_un_campo(self):
        if self.lote_id is None and self.cultivo_id is None:
            raise ValueError('Debe proporcionar al menos un campo para actualizar')
        return self


class LoteCultivoResponse(LoteCultivoBase):
    class Config:
        from_attributes = True


# ===== SCHEMAS PARA LOTE =====

class LoteBase(BaseModel):
    nombre: str
    tipo_lote_id: int
    granja_id: int
    programa_id: int
    fecha_inicio: Optional[datetime] = None
    estado: Optional[str] = "activo"

    # 👇 NUEVOS CAMPOS
    surcos: int
    plantas_por_surco: int

    @field_validator('nombre')
    def validar_nombre(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('El nombre del lote no puede estar vacío')

        if len(v.strip()) < 3:
            raise ValueError('El nombre del lote debe tener al menos 3 caracteres')

        if len(v) > 100:
            raise ValueError('El nombre del lote no puede tener más de 100 caracteres')

        if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-.,()]+$', v):
            raise ValueError('El nombre del lote contiene caracteres no permitidos')

        return v.strip()

    @field_validator('tipo_lote_id', 'granja_id', 'programa_id')
    def validar_ids(cls, v):
        if v < 1:
            raise ValueError('Debe ser un número positivo')
        return v

    @field_validator('surcos')
    def validar_surcos(cls, v):
        if v < 0:
            raise ValueError('Los surcos no pueden ser negativos')
        return v

    @field_validator('plantas_por_surco')
    def validar_plantas(cls, v):
        if v < 0:
            raise ValueError('Las plantas por surco no pueden ser negativas')
        return v

    @field_validator('estado')
    def validar_estado(cls, v):
        if v is not None:
            estados_permitidos = ['activo', 'inactivo', 'pendiente', 'completado']
            v = v.lower()
            if v not in estados_permitidos:
                raise ValueError(f'Estado no válido. Estados permitidos: {", ".join(estados_permitidos)}')
        return v

    @model_validator(mode='after')
    def validar_fechas(self):
        if self.fecha_inicio:
            from datetime import datetime as dt
            if self.fecha_inicio > dt.now().replace(year=dt.now().year + 5):
                raise ValueError('La fecha no puede ser muy futura')
        return self

class LoteCreate(LoteBase):
    cultivos_ids: List[int]

    @field_validator('cultivos_ids')
    def validar_cultivos_ids(cls, v):
        if not v:
            raise ValueError('Debe seleccionar al menos un cultivo')

        for cultivo_id in v:
            if cultivo_id < 1:
                raise ValueError('IDs inválidos')

        return v


class LoteUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo_lote_id: Optional[int] = None
    granja_id: Optional[int] = None
    programa_id: Optional[int] = None
    fecha_inicio: Optional[datetime] = None
    estado: Optional[str] = None
    cultivos_ids: Optional[List[int]] = None

    # 👇 NUEVOS CAMPOS
    surcos: Optional[int] = None
    plantas_por_surco: Optional[int] = None

    @field_validator('nombre')
    def validar_nombre(cls, v):
        if v is not None and len(v.strip()) < 3:
            raise ValueError('Nombre muy corto')
        return v

    @field_validator('tipo_lote_id', 'granja_id', 'programa_id')
    def validar_ids(cls, v):
        if v is not None and v < 1:
            raise ValueError('Debe ser positivo')
        return v

    @field_validator('surcos')
    def validar_surcos(cls, v):
        if v is not None and v < 0:
            raise ValueError('Surcos no pueden ser negativos')
        return v

    @field_validator('plantas_por_surco')
    def validar_plantas(cls, v):
        if v is not None and v < 0:
            raise ValueError('Plantas no pueden ser negativas')
        return v

    @field_validator('estado')
    def validar_estado(cls, v):
        if v is not None:
            estados = ['activo', 'inactivo', 'pendiente', 'completado']
            v = v.lower()
            if v not in estados:
                raise ValueError('Estado inválido')
        return v

    @model_validator(mode='after')
    def validar_update(self):
        if not any([
            self.nombre, self.tipo_lote_id, self.granja_id,
            self.programa_id, self.fecha_inicio,
            self.estado, self.cultivos_ids,
            self.surcos, self.plantas_por_surco
        ]):
            raise ValueError('Debe enviar al menos un campo')
        return self


class LoteResponse(LoteBase):
    id: int
    fecha_creacion: Optional[datetime] = None
    cultivos_ids: List[int] = []

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# ===== RELACIONES =====

class CultivoEspecieSimpleResponse(BaseModel):
    id: int
    nombre: str
    tipo: str

    class Config:
        from_attributes = True


class TipoLoteSimpleResponse(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True


class GranjaSimpleResponse(BaseModel):
    id: int
    nombre: str
    ubicacion: str

    class Config:
        from_attributes = True


class ProgramaSimpleResponse(BaseModel):
    id: int
    nombre: str
    tipo: str

    class Config:
        from_attributes = True


class LoteWithRelations(LoteResponse):
    tipo_lote: Optional[TipoLoteSimpleResponse] = None
    granja: Optional[GranjaSimpleResponse] = None
    programa: Optional[ProgramaSimpleResponse] = None
    cultivos_detalle: List[CultivoEspecieSimpleResponse] = []