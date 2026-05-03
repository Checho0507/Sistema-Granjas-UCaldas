import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import recomendacionService from '../../services/recomendacionService';
import { useAuth } from '../../hooks/useAuth';

interface InsumoPrograma {
  id: number;
  nombre: string;
  descripcion?: string;
  cantidad_disponible: number;
  unidad_medida?: string;
  estado: string;
}

interface CrearRecomendacionModalProps {
  diagnostico: any;
  onClose: () => void;
  onCreada: (recomendacion: any) => void;
}

const TIPOS_RECOMENDACION = [
  'Aplicación al suelo',
  'Aplicación foliar',
  'podas',
  'Cosecha y saneamiento',
  'Manejo de arvenses',
  'Censo poblacional',
  'Hormiga arriera',
  'otro',
];

const CrearRecomendacionModal: React.FC<CrearRecomendacionModalProps> = ({
  diagnostico,
  onClose,
  onCreada,
}) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    titulo: `Recomendación para: ${diagnostico.tipo || 'Diagnóstico'}`,
    descripcion: '',
    tipo: '',
  });
  const [insumos, setInsumos] = useState<InsumoPrograma[]>([]);
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<{ insumo: InsumoPrograma; cantidad: number; nota: string }[]>([]);
  const [loadingInsumos, setLoadingInsumos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const programaId = diagnostico.lote?.programa_id || diagnostico.programa_id;

  useEffect(() => {
    if (programaId) {
      cargarInsumos();
    }
  }, [programaId]);

  const cargarInsumos = async () => {
    try {
      setLoadingInsumos(true);
      const data = await recomendacionService.obtenerInsumosPorPrograma(programaId);
      setInsumos(Array.isArray(data) ? data : []);
    } catch {
      setInsumos([]);
    } finally {
      setLoadingInsumos(false);
    }
  };

  const toggleInsumo = (insumo: InsumoPrograma) => {
    const idx = insumosSeleccionados.findIndex(i => i.insumo.id === insumo.id);
    if (idx >= 0) {
      setInsumosSeleccionados(prev => prev.filter((_, i) => i !== idx));
    } else {
      setInsumosSeleccionados(prev => [...prev, { insumo, cantidad: 1, nota: '' }]);
    }
  };

  const actualizarInsumo = (idx: number, field: 'cantidad' | 'nota', value: any) => {
    setInsumosSeleccionados(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async () => {
    if (!form.titulo.trim() || !form.descripcion.trim() || !form.tipo) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    if (!user) { toast.error('Usuario no autenticado'); return; }

    setGuardando(true);
    try {
      const descripcionCompleta = insumosSeleccionados.length > 0
        ? `${form.descripcion}\n\n📦 Insumos sugeridos:\n${insumosSeleccionados.map(i => `• ${i.insumo.nombre}: ${i.cantidad} ${i.insumo.unidad_medida || 'unidades'}${i.nota ? ` (${i.nota})` : ''}`).join('\n')}`
        : form.descripcion;

      const payload: any = {
        titulo: form.titulo,
        descripcion: descripcionCompleta,
        tipo: form.tipo,
        lote_id: diagnostico.lote_id,
        diagnostico_id: diagnostico.id,
        docente_id: user.id,
      };

      const nueva = await recomendacionService.crearRecomendacion(payload, user);
      toast.success('¡Recomendación creada exitosamente!');
      onCreada(nueva);
    } catch (err: any) {
      toast.error(err.message || 'Error al crear la recomendación');
    } finally {
      setGuardando(false);
    }
  };

  const estadoColor = (estado: string) => {
    switch (estado) {
      case 'abierto': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'en_revision': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cerrado': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Nueva Recomendación</h2>
          <p className="text-sm text-gray-500 mt-1">Vinculada a diagnóstico #{diagnostico.id}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
      </div>

      {/* Resumen del diagnóstico */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
          🔬 Diagnóstico base
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Tipo:</span>
            <span className="ml-1 font-medium text-gray-800">{diagnostico.tipo}</span>
          </div>
          <div>
            <span className="text-gray-500">Estado:</span>
            <span className={`ml-1 text-xs px-2 py-0.5 rounded-full border font-medium ${estadoColor(diagnostico.estado)}`}>
              {diagnostico.estado}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Lote:</span>
            <span className="ml-1 font-medium text-gray-800">{diagnostico.lote_nombre || `#${diagnostico.lote_id}`}</span>
          </div>
          {diagnostico.programa_nombre && (
            <div>
              <span className="text-gray-500">Programa:</span>
              <span className="ml-1 font-medium text-gray-800">{diagnostico.programa_nombre}</span>
            </div>
          )}
        </div>
        {diagnostico.descripcion && (
          <p className="mt-2 text-xs text-gray-600 bg-white/60 p-2 rounded border border-blue-100">
            "{diagnostico.descripcion}"
          </p>
        )}
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${step === 1 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">1</span>
          Detalles
        </button>
        <div className="flex-1 h-px bg-gray-200" />
        <button
          onClick={() => form.tipo && form.titulo && form.descripcion ? setStep(2) : toast.error('Completa el paso 1 primero')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${step === 2 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold">2</span>
          Insumos
        </button>
      </div>

      {/* Step 1: Detalles */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ej: Aplicación de fungicida preventivo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de recomendación *</label>
            <select
              value={form.tipo}
              onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Seleccionar tipo...</option>
              {TIPOS_RECOMENDACION.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción detallada *</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Describe detalladamente la intervención recomendada, procedimiento y objetivos..."
            />
          </div>

          <button
            onClick={() => {
              if (!form.titulo.trim() || !form.descripcion.trim() || !form.tipo) {
                toast.error('Completa todos los campos');
                return;
              }
              setStep(2);
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            Siguiente: Seleccionar Insumos →
          </button>
        </div>
      )}

      {/* Step 2: Insumos del programa */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">
              📦 Insumos del programa
            </h3>
            {!programaId && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                Sin programa asignado
              </span>
            )}
          </div>

          {!programaId ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-3xl mb-2">🏷️</p>
              <p className="text-sm">El lote de este diagnóstico no tiene programa asignado.</p>
              <p className="text-xs text-gray-400 mt-1">Puedes continuar sin seleccionar insumos.</p>
            </div>
          ) : loadingInsumos ? (
            <div className="text-center py-8">
              <div className="animate-spin text-2xl mb-2">⚙️</div>
              <p className="text-gray-500 text-sm">Cargando inventario del programa...</p>
            </div>
          ) : insumos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">No hay insumos disponibles en el inventario del programa.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {insumos.map(insumo => {
                const selIdx = insumosSeleccionados.findIndex(i => i.insumo.id === insumo.id);
                const seleccionado = selIdx >= 0;
                return (
                  <div
                    key={insumo.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      seleccionado
                        ? 'border-green-400 bg-green-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div
                      onClick={() => toggleInsumo(insumo)}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${seleccionado ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                          {seleccionado && <span className="text-white text-xs">✓</span>}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{insumo.nombre}</p>
                          <p className="text-xs text-gray-500">
                            Disponible: <span className="font-medium text-green-600">{insumo.cantidad_disponible} {insumo.unidad_medida || 'u.'}</span>
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                        insumo.estado === 'disponible' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {insumo.estado}
                      </span>
                    </div>
                    {seleccionado && (
                      <div className="mt-2 flex gap-2" onClick={e => e.stopPropagation()}>
                        <div className="flex-1">
                          <input
                            type="number"
                            min={0.1}
                            step={0.1}
                            value={insumosSeleccionados[selIdx].cantidad}
                            onChange={e => actualizarInsumo(selIdx, 'cantidad', parseFloat(e.target.value))}
                            className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-400"
                            placeholder="Cantidad"
                          />
                        </div>
                        <div className="flex-2">
                          <input
                            type="text"
                            value={insumosSeleccionados[selIdx].nota}
                            onChange={e => actualizarInsumo(selIdx, 'nota', e.target.value)}
                            className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-400"
                            placeholder="Nota (opcional)"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {insumosSeleccionados.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-green-700 mb-1">Insumos incluidos en la recomendación:</p>
              {insumosSeleccionados.map((sel, i) => (
                <p key={i} className="text-xs text-green-600">• {sel.insumo.nombre}: {sel.cantidad} {sel.insumo.unidad_medida}</p>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-gray-200">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ← Volver
            </button>
            <button
              onClick={handleSubmit}
              disabled={guardando}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
            >
              {guardando ? '⏳ Creando...' : '✅ Crear Recomendación'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrearRecomendacionModal;
