import React, { useState } from 'react';
import Modal from '../Common/Modal';

interface ProductoRecomendado {
  id: number;
  inventario_item_id?: number;
  inventario_item_nombre?: string;
  inventario_item_unidad?: string;
  cantidad_sugerida?: number;
  descripcion?: string;
}

interface CompletarLaborModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompletar: (datos: {
    comentario: string;
    inventario_item_id?: number;
    cantidad_usada?: number;
    dosis_aplicada?: number;
    unidad_dosis?: string;
  }) => void;
  tituloLabor: string;
  productosRecomendados?: ProductoRecomendado[];
}

const CompletarLaborModal: React.FC<CompletarLaborModalProps> = ({
  isOpen,
  onClose,
  onCompletar,
  tituloLabor,
  productosRecomendados = [],
}) => {
  const [comentario, setComentario] = useState('');
  const [dosisAplicada, setDosisAplicada] = useState('');
  const [unidadDosis, setUnidadDosis] = useState('');
  const [inventarioItemId, setInventarioItemId] = useState<number | undefined>(
    productosRecomendados.length === 1 && productosRecomendados[0].inventario_item_id
      ? productosRecomendados[0].inventario_item_id
      : undefined
  );
  const [submitting, setSubmitting] = useState(false);

  const tieneProductos = productosRecomendados.some(p => p.inventario_item_id);
  const productoSeleccionado = productosRecomendados.find(p => p.inventario_item_id === inventarioItemId);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await onCompletar({
        comentario,
        inventario_item_id: inventarioItemId,
        dosis_aplicada: dosisAplicada ? parseFloat(dosisAplicada) : undefined,
        unidad_dosis: unidadDosis || undefined,
      });
      resetAndClose();
    } catch (error) {
      console.error('Error completando labor:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setComentario('');
    setDosisAplicada('');
    setUnidadDosis('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} width="max-w-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <i className="fas fa-check-circle text-green-600"></i>
          Completar Labor
        </h2>

        <div className="space-y-5">
          <p className="text-gray-600">
            Estás por marcar como completada:
            <strong className="ml-1 text-gray-800">{tituloLabor}</strong>
          </p>

          {/* Productos a aplicar */}
          {tieneProductos && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                <i className="fas fa-flask"></i>
                Producto(s) a aplicar — Reporta la dosis utilizada
              </h4>

              {productosRecomendados.length > 1 && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Producto aplicado</label>
                  <select
                    value={inventarioItemId || ''}
                    onChange={e => setInventarioItemId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full border rounded-lg p-2.5 text-sm"
                  >
                    <option value="">Seleccionar producto...</option>
                    {productosRecomendados.filter(p => p.inventario_item_id).map(p => (
                      <option key={p.inventario_item_id} value={p.inventario_item_id}>
                        {p.inventario_item_nombre || `Ítem #${p.inventario_item_id}`}
                        {p.cantidad_sugerida ? ` (sugerido: ${p.cantidad_sugerida} ${p.inventario_item_unidad || ''})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {productoSeleccionado && (
                <div className="bg-white border border-amber-200 rounded p-3 mb-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Producto:</span>
                    <span className="font-medium">{productoSeleccionado.inventario_item_nombre}</span>
                  </div>
                  {productoSeleccionado.cantidad_sugerida && (
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-600">Dosis sugerida:</span>
                      <span className="font-medium text-amber-700">
                        {productoSeleccionado.cantidad_sugerida} {productoSeleccionado.inventario_item_unidad || ''}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dosis aplicada <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={dosisAplicada}
                    onChange={e => setDosisAplicada(e.target.value)}
                    className="w-full border rounded-lg p-2.5 text-sm"
                    placeholder="0.0"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                  <input
                    type="text"
                    value={unidadDosis}
                    onChange={e => setUnidadDosis(e.target.value)}
                    className="w-full border rounded-lg p-2.5 text-sm"
                    placeholder={productoSeleccionado?.inventario_item_unidad || 'kg, L, cc...'}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentario de finalización
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="w-full border rounded-lg p-3 text-sm"
              rows={3}
              placeholder="Describe el trabajo realizado, observaciones, resultados..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting || (tieneProductos && inventarioItemId !== undefined && !dosisAplicada)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><i className="fas fa-spinner fa-spin"></i> Completando...</>
              ) : (
                <><i className="fas fa-check-circle"></i> Marcar como Completada</>
              )}
            </button>
            <button onClick={resetAndClose} className="flex-1 bg-gray-200 hover:bg-gray-300 py-2.5 rounded-lg font-medium">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CompletarLaborModal;
