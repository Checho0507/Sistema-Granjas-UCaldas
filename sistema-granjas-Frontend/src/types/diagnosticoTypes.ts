export interface Diagnostico {
  items: DiagnosticoItem[];
  total: number;
  paginas: number;
}

export interface DiagnosticoItem {
  id: number;
  tipo: string;
  descripcion: string;
  estado: string; // 'abierto' | 'cerrado' | 'en_revision'
  estado_revision: 'pendiente_revision' | 'revisado'; // NEW: review lifecycle
  fecha_creacion: string;
  fecha_revision?: string;
  observaciones?: string;

  // backend normalized fields
  programa_id?: number;
  tipo_monitoreo_id?: number;
  diagnostico_tipo_id?: number;
  tipo_diagnostico?: string;
  condiciones_dia?: string;
  formulario?: Record<string, any>;

  estudiante_id?: number;
  docente_id?: number;
  usuario_id?: number;
  lote_id: number;

  // enriched names
  programa_nombre?: string;
  tipo_monitoreo_nombre?: string;
  lote_nombre?: string;
  granja_nombre?: string;
  usuario_nombre?: string;

  // Relaciones expandidas (opcional para detalles)
  estudiante?: {
    id: number;
    nombre: string;
    email: string;
  };
  docente?: {
    id: number;
    nombre: string;
    email: string;
  };
  lote?: {
    id: number;
    nombre: string;
    cultivo?: {
      nombre: string;
    };
  };
  evidencias?: Evidencia[];
  recomendaciones?: any[];
}

export interface CrearDiagnosticoDTO {
  tipo: string;
  descripcion: string;
  lote_id: number;
  estudiante_id?: number;
  docente_id?: number;
  evidencias?: ArchivoEvidencia[];
}

export interface AsignarDocenteDTO {
  docente_id: number;
}

export interface ActualizarDiagnosticoDTO {
  observaciones?: string;
  estado?: string;
}

export interface Evidencia {
  id: number;
  tipo: string;
  descripcion: string;
  url_archivo: string;
  usuario_id: number;
  fecha_creacion: string;
}

export interface ArchivoEvidencia {
  file: File;
  descripcion: string;
  tipo: string;
}

export interface EstadisticasDiagnostico {
  total: number;
  abiertos: number;
  cerrados: number;
  en_revision: number;
  por_tipo: Record<string, number>;
  por_lote: Array<{
    lote_id: number;
    lote_nombre: string;
    cantidad: number;
  }>;
}

export interface DiagnosticoFiltros {
  estado?: string;
  tipo?: string;
  lote_id?: number;
  estudiante_id?: number;
  docente_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  estado_revision?: 'pendiente_revision' | 'revisado';
  tipo_diagnostico?: string;
  programa_id?: number;
  tipo_monitoreo_id?: number;
}

/* ============================================
   NUEVAS INTERFACES AÑADIDAS DEL SEGUNDO CÓDIGO
   ============================================ */

export interface DiagnosticoDetalle {
  id: number;
  tipo: string;
  descripcion: string;
  lote_id: number;
  estado: string;
  estado_revision: 'pendiente_revision' | 'revisado';
  observaciones?: string;
  estudiante_id?: number;
  docente_id?: number;
  usuario_id?: number;
  fecha_creacion: string;
  fecha_revision?: string;

  // Backend-normalized fields
  programa_id?: number;
  tipo_monitoreo_id?: number;
  diagnostico_tipo_id?: number;
  tipo_diagnostico?: string;
  condiciones_dia?: string;
  formulario?: Record<string, any>;
  plantas?: any[];

  // Campos expandidos desde el backend
  estudiante_nombre?: string;
  docente_nombre?: string;
  lote_nombre?: string;
  granja_nombre?: string;
  programa_nombre?: string;
  tipo_monitoreo_nombre?: string;
  usuario_nombre?: string;

  // Relaciones
  recomendaciones?: RecomendacionResumen[];
}

export interface RecomendacionResumen {
  id: number;
  titulo: string;
  tipo: string;
  estado: string;
  fecha_creacion: string;
}

export interface CrearEvidenciaDTO {
  tipo: string; // 'imagen', 'video', 'documento', 'audio', 'otro'
  descripcion: string;
  url_archivo: string;
  tipo_entidad: 'diagnostico' | 'labor' | 'recomendacion';
  entidad_id: number;
  usuario_id: number;
}

export interface PlantaGenerada {
    id: number;
    codigo: string;
    surco: number;
    numero: number;
    lote_id: number;
}