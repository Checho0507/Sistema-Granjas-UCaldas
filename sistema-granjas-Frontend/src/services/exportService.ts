// src/services/exportService.ts

const API_BASE_URL = '/api';

// Función para obtener headers con token
const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔑 DEBUG exportService - Headers con token:', headers);
  } else {
    console.warn('⚠️ DEBUG exportService: No hay token en localStorage');
  }
  
  return headers;
};

// Función para manejar la descarga de archivos Excel
const handleExcelDownload = async (response: Response, filename: string) => {
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ DEBUG Error response export:', errorText);
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  
  // Obtener el blob del archivo
  const blob = await response.blob();
  
  // Crear URL del blob
  const url = window.URL.createObjectURL(blob);
  
  // Crear elemento <a> para descarga
  const link = document.createElement('a');
  link.href = url;
  
  // Generar nombre del archivo con fecha
  const today = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `${filename}_${today}.xlsx`);
  
  // Simular click para descargar
  document.body.appendChild(link);
  link.click();
  
  // Limpiar
  link.remove();
  window.URL.revokeObjectURL(url);
  
  return { success: true, filename: `${filename}_${today}.xlsx` };
};

export const exportService = {
  // ========== EXPORTACIONES ESPECÍFICAS ==========
  
  // EXPORTAR backup completo
  async exportarBackupCompleto(): Promise<{ success: boolean; filename: string }> {
    try {
      const url = `${API_BASE_URL}/export/backup/excel`;
      console.log('🔗 DEBUG URL exportarBackupCompleto:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders()
      });
      
      return handleExcelDownload(response, 'backup_completo');
    } catch (error) {
      console.error('❌ DEBUG Error completo exportando backup:', error);
      throw error;
    }
  },

  // EXPORTAR granjas
  async exportarGranjas(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/granjas/excel`;
    console.log('🔗 DEBUG URL exportarGranjas:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleExcelDownload(response, 'granjas');
  },

  // EXPORTAR lotes
  async exportarLotes(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/lotes/excel`;
    console.log('🔗 DEBUG URL exportarLotes:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleExcelDownload(response, 'lotes');
  },

  // EXPORTAR diagnósticos
  async exportarDiagnosticos(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/diagnosticos/excel`;
    console.log('🔗 DEBUG URL exportarDiagnosticos:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleExcelDownload(response, 'diagnosticos');
  },

  // EXPORTAR recomendaciones
  async exportarRecomendaciones(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/recomendaciones/excel`;
    console.log('🔗 DEBUG URL exportarRecomendaciones:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleExcelDownload(response, 'recomendaciones');
  },

  // EXPORTAR labores
  async exportarLabores(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/labores/excel`;
    console.log('🔗 DEBUG URL exportarLabores:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleExcelDownload(response, 'labores');
  },

  // EXPORTAR inventario
  async exportarInventario(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/inventario/excel`;
    console.log('🔗 DEBUG URL exportarInventario:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleExcelDownload(response, 'inventario');
  },

  // EXPORTAR usuarios
  async exportarUsuarios(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/usuarios/excel`;
    console.log('🔗 DEBUG URL exportarUsuarios:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleExcelDownload(response, 'usuarios');
  },

  // EXPORTAR programas
  async exportarProgramas(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/programas/excel`;
    console.log('🔗 DEBUG URL exportarProgramas:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleExcelDownload(response, 'programas');
  },

  // EXPORTAR cultivos
  async exportarCultivos(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/cultivos/excel`;
    console.log('🔗 DEBUG URL exportarCultivos:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleExcelDownload(response, 'cultivos');
  },

  // EXPORTAR movimientos
  async exportarMovimientos(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/movimientos/excel`;
    console.log('🔗 DEBUG URL exportarMovimientos:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleExcelDownload(response, 'movimientos');
  },

  // EXPORTAR resumen
  async exportarResumen(): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/resumen/excel`;
    console.log('🔗 DEBUG URL exportarResumen:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleExcelDownload(response, 'resumen_general');
  },

  // ========== EXPORTACIONES GENÉRICAS ==========
  
  // Función genérica para exportar cualquier recurso
  async exportarRecurso(recurso: string): Promise<{ success: boolean; filename: string }> {
    const url = `${API_BASE_URL}/export/${recurso.toLowerCase()}/excel`;
    console.log('🔗 DEBUG URL exportarRecurso:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return handleExcelDownload(response, recurso.toLowerCase());
  }
};

// ========== ALIAS PARA MANTENER COMPATIBILIDAD ==========

// Alias para las funciones principales
export const exportBackup = exportService.exportarBackupCompleto;
export const exportGranjas = exportService.exportarGranjas;
export const exportLotes = exportService.exportarLotes;
export const exportDiagnosticos = exportService.exportarDiagnosticos;
export const exportRecomendaciones = exportService.exportarRecomendaciones;
export const exportLabores = exportService.exportarLabores;
export const exportInventario = exportService.exportarInventario;
export const exportUsuarios = exportService.exportarUsuarios;
export const exportProgramas = exportService.exportarProgramas;
export const exportCultivos = exportService.exportarCultivos;
export const exportMovimientos = exportService.exportarMovimientos;
export const exportResumen = exportService.exportarResumen;

// Alias genérico
export const exportResource = exportService.exportarRecurso;

export default exportService;