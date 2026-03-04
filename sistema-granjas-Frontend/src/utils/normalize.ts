/**
 * Normaliza cualquier respuesta de API a un array.
 * Soporta: array directo, { items: [] }, { data: [] }
 */
export const normalizarArray = <T,>(respuesta: any): T[] => {
  if (Array.isArray(respuesta)) return respuesta;
  if (respuesta?.items && Array.isArray(respuesta.items)) return respuesta.items;
  if (respuesta?.data && Array.isArray(respuesta.data)) return respuesta.data;
  return [];
};