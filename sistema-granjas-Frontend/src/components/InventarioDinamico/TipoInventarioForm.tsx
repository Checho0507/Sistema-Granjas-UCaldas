// src/components/InventarioDinamico/TipoInventarioForm.tsx
import React, { useState, useEffect } from 'react';
import Modal from '../Common/Modal';
import type { TipoInventario } from '../../types/inventarioDinamicoTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { nombre: string; descripcion?: string; orden?: number; activo?: boolean }) => Promise<void>;
  tipo?: TipoInventario;
}

const TipoInventarioForm: React.FC<Props> = ({ isOpen, onClose, onSave, tipo }) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [orden, setOrden] = useState(0);
  const [activo, setActivo] = useState(true);
  const [loading, setLoading] = useState(false);

  // Sincronizar estados cuando cambia el tipo o se abre el modal
  useEffect(() => {
    if (tipo) {
      setNombre(tipo.nombre || '');
      setDescripcion(tipo.descripcion || '');
      setOrden(tipo.orden || 0);
      setActivo(tipo.activo ?? true);
    } else {
      setNombre('');
      setDescripcion('');
      setOrden(0);
      setActivo(true);
    }
  }, [tipo, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      return; // No enviar si no hay nombre
    }
    
    setLoading(true);
    try {
      await onSave({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        orden,
        activo,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="max-w-md">
      <div className="p-4">
        <h3 className="text-lg font-bold mb-4">{tipo ? 'Editar tipo' : 'Nuevo tipo de inventario'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Ej: Agroquímicos, Herramientas, Fertilizantes..."
              required
              autoFocus
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="w-full border rounded p-2"
              placeholder="Describe el propósito de este tipo de inventario"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
            <input
              type="number"
              value={orden}
              onChange={(e) => setOrden(parseInt(e.target.value) || 0)}
              className="w-full border rounded p-2"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Los tipos se ordenan de menor a mayor
            </p>
          </div>
          <div className="mb-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="activo"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="activo" className="text-sm cursor-pointer">
              Activo
            </label>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !nombre.trim()} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default TipoInventarioForm;