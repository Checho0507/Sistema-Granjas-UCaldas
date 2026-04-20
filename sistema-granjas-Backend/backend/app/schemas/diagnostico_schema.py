from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date

CONDICIONES_DIA_PERMITIDAS = ["Soleado", "Nublado", "Lluvia"]

TIPOS_DIAGNOSTICO_PERMITIDOS = [
    "censo_poblacional",
    "monitoreo_fenologico",
    "artropodos",
    "enfermedades",
    "arvenses",
    "controladores_biologicos",
    "polinizadores",
]


# =============================================================================
# SCHEMA AUXILIAR PARA PLANTA (respuesta simplificada)
# =============================================================================
class PlantaSimpleResponse(BaseModel):
    id: int
    codigo: str
    surco: int
    numero: int
    lote_id: int

    class Config:
        from_attributes = True


# =============================================================================
# CREATE
# =============================================================================
class DiagnosticoCreate(BaseModel):
    programa_id:       int            = Field(..., gt=0)
    tipo_monitoreo_id: int            = Field(..., gt=0)
    lote_id:           int            = Field(..., gt=0)
    usuario_id:        int            = Field(..., gt=0)
    tipo_diagnostico:  str            = Field(..., description="Tipo de diagnóstico")
    condiciones_dia:   str            = Field(..., description="Condiciones climáticas del día")
    formulario:        Optional[Dict[str, Any]] = Field(None, description="Datos del formulario en JSON")
    plantas_ids:       Optional[List[int]] = Field(None, description="IDs de las plantas evaluadas en este diagnóstico")

    @validator("tipo_diagnostico")
    def validar_tipo(cls, v):
        if v not in TIPOS_DIAGNOSTICO_PERMITIDOS:
            raise ValueError(f"tipo_diagnostico debe ser uno de: {', '.join(TIPOS_DIAGNOSTICO_PERMITIDOS)}")
        return v

    @validator("condiciones_dia")
    def validar_condiciones(cls, v):
        if v not in CONDICIONES_DIA_PERMITIDAS:
            raise ValueError(f"condiciones_dia debe ser uno de: {', '.join(CONDICIONES_DIA_PERMITIDAS)}")
        return v

    @validator("plantas_ids")
    def validar_plantas_ids(cls, v):
        if v is not None:
            if len(v) == 0:
                raise ValueError("La lista de plantas_ids no puede estar vacía")
            # Se puede agregar validación de que los IDs sean positivos
            for pid in v:
                if pid <= 0:
                    raise ValueError("Todos los IDs de plantas deben ser positivos")
        return v


# =============================================================================
# UPDATE
# =============================================================================
class DiagnosticoUpdate(BaseModel):
    tipo_diagnostico: Optional[str]            = None
    condiciones_dia:  Optional[str]            = None
    formulario:       Optional[Dict[str, Any]] = None
    plantas_ids:      Optional[List[int]]      = None   # Permite reemplazar la lista de plantas asociadas

    @validator("tipo_diagnostico")
    def validar_tipo(cls, v):
        if v is not None and v not in TIPOS_DIAGNOSTICO_PERMITIDOS:
            raise ValueError(f"tipo_diagnostico debe ser uno de: {', '.join(TIPOS_DIAGNOSTICO_PERMITIDOS)}")
        return v

    @validator("condiciones_dia")
    def validar_condiciones(cls, v):
        if v is not None and v not in CONDICIONES_DIA_PERMITIDAS:
            raise ValueError(f"condiciones_dia debe ser uno de: {', '.join(CONDICIONES_DIA_PERMITIDAS)}")
        return v

    @validator("plantas_ids")
    def validar_plantas_ids(cls, v):
        if v is not None and len(v) == 0:
            raise ValueError("La lista de plantas_ids no puede estar vacía")
        return v


# =============================================================================
# RESPONSE (básico)
# =============================================================================
class DiagnosticoResponse(BaseModel):
    id:               int
    programa_id:      int
    tipo_monitoreo_id: int
    lote_id:          int
    usuario_id:       int
    tipo_diagnostico: str
    condiciones_dia:  str
    formulario:       Optional[Dict[str, Any]] = None
    fecha_creacion:   datetime

    # Campos enriquecidos (calculados en el router)
    programa_nombre:       Optional[str] = None
    tipo_monitoreo_nombre: Optional[str] = None
    lote_nombre:           Optional[str] = None
    granja_nombre:         Optional[str] = None
    usuario_nombre:        Optional[str] = None

    # Relación muchos a muchos con plantas
    plantas: List[PlantaSimpleResponse] = []

    class Config:
        from_attributes = True


# =============================================================================
# RESPONSE CON RECOMENDACIONES
# =============================================================================
class RecomendacionBasicResponse(BaseModel):
    id:             int
    titulo:         str
    tipo:           Optional[str] = None
    estado:         str
    fecha_creacion: datetime

    class Config:
        from_attributes = True


class DiagnosticoWithRecomendacionesResponse(DiagnosticoResponse):
    recomendaciones: List[RecomendacionBasicResponse] = []

    class Config:
        from_attributes = True


# =============================================================================
# LISTA PAGINADA
# =============================================================================
class DiagnosticoListResponse(BaseModel):
    items:   List[DiagnosticoResponse]
    total:   int
    paginas: int

    class Config:
        from_attributes = True


# =============================================================================
# ESTADÍSTICAS
# =============================================================================
class EstadisticasDiagnosticosResponse(BaseModel):
    total:    int
    por_tipo: Dict[str, int] = {}
    por_lote: Dict[str, int] = {}

    class Config:
        from_attributes = True

# Añadir al final del archivo
class GenerarPlantasRequest(BaseModel):
    lote_id: int
    tipo_diagnostico: str
    cantidad: int = Field(10, ge=1, le=100)

class PlantaGenerada(BaseModel):
    id: int
    codigo: str
    surco: int
    numero: int
    lote_id: int

    class Config:
        from_attributes = True

class GenerarPlantasResponse(BaseModel):
    plantas: List[PlantaGenerada]
    total_plantas_lote: int
    productivas: int
    elegibles: int
    advertencias: List[str] = []