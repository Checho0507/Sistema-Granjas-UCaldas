// src/components/InventarioDinamico/ItemsInventarioList.tsx
import React from 'react';
import type { ItemInventario, Campo } from '../../types/inventarioDinamicoTypes';

interface Props {
  items: ItemInventario[];
  campos: Campo[];
  onEdit: (item: ItemInventario) => void;
  onDelete: (id: number) => void;
  onCreate: () => void;
}

const ItemsInventarioList: React.FC<Props> = ({ items, campos, onEdit, onDelete, onCreate }) => {
  // Columnas: campos dinámicos + columnas fijas
  const camposOrdenados = [...campos].sort((a, b) => a.orden - b.orden);
  
  const columnas = [
    { label: 'ID', key: 'id' },
    ...camposOrdenados.map(c => ({ label: c.nombre_campo, key: c.nombre_campo })),
    { label: 'Cantidad', key: 'cantidad_disponible' },
    { label: 'Unidad', key: 'unidad_medida' },
    { label: 'Fecha', key: 'fecha_inventario' },
  ];

  const formatValue = (item: ItemInventario, key: string) => {
    // ID
    if (key === 'id') {
      return (
        <span className="text-xs font-mono text-gray-500">#{item.id}</span>
      );
    }
    
    // Fecha de inventario
    if (key === 'fecha_inventario') {
      if (!item.fecha_inventario) return <span className="text-gray-400">—</span>;
      try {
        const fecha = new Date(item.fecha_inventario);
        return (
          <span className="text-xs">
            {fecha.toLocaleDateString('es-CO', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })}
          </span>
        );
      } catch {
        return <span className="text-gray-400">—</span>;
      }
    }
    
    // Cantidad disponible
    if (key === 'cantidad_disponible') {
      const cantidad = item.cantidad_disponible;
      if (cantidad === undefined || cantidad === null) {
        return <span className="text-gray-400">—</span>;
      }
      const colorClass = cantidad <= 0 
        ? 'text-red-600 font-semibold' 
        : cantidad < 10 
          ? 'text-yellow-600 font-semibold' 
          : 'text-green-600 font-semibold';
      return (
        <span className={`text-sm ${colorClass}`}>
          {cantidad.toLocaleString('es-CO')}
        </span>
      );
    }
    
    // Unidad de medida
    if (key === 'unidad_medida') {
      return item.unidad_medida ? (
        <span className="text-xs text-gray-600">{item.unidad_medida}</span>
      ) : (
        <span className="text-gray-400">—</span>
      );
    }
    
    // Valores dinámicos desde item.valores
    const val = item.valores?.[key];
    
    if (val === undefined || val === null || val === '') {
      return <span className="text-gray-400">—</span>;
    }
    
    if (typeof val === 'boolean') {
      return val ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
          Sí
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
          No
        </span>
      );
    }
    
    if (typeof val === 'number') {
      return <span className="text-sm">{val.toLocaleString('es-CO')}</span>;
    }
    
    // Texto: truncar si es muy largo
    const strVal = String(val);
    return (
      <span className="text-sm" title={strVal.length > 30 ? strVal : undefined}>
        {strVal.length > 30 ? `${strVal.substring(0, 30)}...` : strVal}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow mt-6">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Registros de inventario</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {items.length} registro{items.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button 
          onClick={onCreate} 
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors"
        >
          <i className="fas fa-plus text-xs"></i> Nuevo registro
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columnas.map(col => (
                <th 
                  key={col.key} 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={columnas.length + 1} className="text-center py-12 text-gray-400">
                  <i className="fas fa-box-open text-3xl block mb-2"></i>
                  <p className="text-sm">No hay registros de inventario</p>
                  <button 
                    onClick={onCreate}
                    className="text-blue-600 hover:text-blue-800 text-sm mt-2 underline"
                  >
                    Crear el primer registro
                  </button>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  {columnas.map(col => (
                    <td key={col.key} className="px-4 py-3 whitespace-nowrap text-sm">
                      {formatValue(item, col.key)}
                    </td>
                  ))}
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button 
                        onClick={() => onEdit(item)} 
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Editar registro"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        onClick={() => onDelete(item.id)} 
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Eliminar registro"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {items.length > 0 && (
        <div className="px-6 py-3 border-t bg-gray-50 text-xs text-gray-500">
          Mostrando {items.length} registro{items.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default ItemsInventarioList;