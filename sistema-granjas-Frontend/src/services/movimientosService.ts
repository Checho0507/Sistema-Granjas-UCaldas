// src/services/movimientoService.ts

const API_BASE_URL = '/api';

// Función para obtener headers con token
const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export interface MovimientoHerramienta {
  id: number;
  herramienta_id: number;
  herramienta_nombre: string;
  labor_id: number;
  labor_descripcion: string;
  cantidad: number;
  tipo_movimiento: string;
  fecha_movimiento: string;
  observaciones: string;
}

export interface MovimientoInsumo {
  id: number;
  insumo_id: number;
  insumo_nombre: string;
  labor_id: number;
  labor_descripcion: string;
  cantidad: number;
  unidad_medida: string;
  tipo_movimiento: string;
  fecha_movimiento: string;
  observaciones: string;
}

export const movimientoService = {
  // OBTENER movimientos de herramientas
  async obtenerMovimientosHerramientas(): Promise<{items: MovimientoHerramienta[], paginas: number, total: number}> {
    const response = await fetch(`${API_BASE_URL}/movimientos/herramientas`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  // OBTENER movimientos de insumos
  async obtenerMovimientosInsumos(): Promise<{items: MovimientoInsumo[], paginas: number, total: number}> {
    const response = await fetch(`${API_BASE_URL}/movimientos/insumos`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },

  // OBTENER todos los movimientos (ambos tipos)
  async obtenerTodosLosMovimientos(): Promise<{
    herramientas: MovimientoHerramienta[],
    insumos: MovimientoInsumo[]
  }> {
    try {
      const [herramientasData, insumosData] = await Promise.all([
        this.obtenerMovimientosHerramientas(),
        this.obtenerMovimientosInsumos()
      ]);
      
      return {
        herramientas: herramientasData.items,
        insumos: insumosData.items
      };
    } catch (error) {
      console.error('Error obteniendo movimientos:', error);
      throw error;
    }
  }
};

export default movimientoService;