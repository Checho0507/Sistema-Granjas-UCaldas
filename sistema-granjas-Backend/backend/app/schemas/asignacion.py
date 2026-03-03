from pydantic import BaseModel

class RelacionProgramaGranja(BaseModel):
    programa_id: int
    granja_id: int

    class Config:
        from_attributes = True