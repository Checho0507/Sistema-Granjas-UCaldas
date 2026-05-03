import { getAllPending, deletePending } from './indexedDB';

const API_URL = '/api/sync';

export const syncPendingData = async () => {
  try {
    const pendientes = await getAllPending();
    if (pendientes.length === 0) {
      console.log('✅ No hay datos pendientes para sincronizar.');
      return;
    }

    console.log(`🔄 Sincronizando ${pendientes.length} registros...`);

    for (const item of pendientes) {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      if (response.ok) {
        await deletePending(item.id);
        console.log(`✅ Registro sincronizado y eliminado localmente: ${item.id}`);
      } else {
        console.warn(`⚠️ Error al sincronizar el registro ${item.id}`);
      }
    }
  } catch (error) {
    console.error('❌ Error en la sincronización:', error);
  }
};
