import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import laborService from '../services/laboresService';
import { addPending } from '../services/indexedDB';
import type { Labor } from '../types/laboresTypes';

const estadoConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: '⏳' },
  en_progreso: { label: 'En Progreso', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: '🔄' },
  completada: { label: 'Completada', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: '✅' },
  cancelada: { label: 'Cancelada', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: '❌' },
};

interface LaborCardProps {
  labor: Labor;
  onActualizar: (id: number, avance: number, comentario: string) => Promise<void>;
  onCompletar: (id: number) => Promise<void>;
  expandido: boolean;
  onToggle: () => void;
}

const LaborCard: React.FC<LaborCardProps> = ({ labor, onActualizar, onCompletar, expandido, onToggle }) => {
  const [avance, setAvance] = useState(labor.avance_porcentaje || 0);
  const [comentario, setComentario] = useState(labor.comentario || '');
  const [guardando, setGuardando] = useState(false);
  const cfg = estadoConfig[labor.estado] || estadoConfig.pendiente;

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await onActualizar(labor.id, avance, comentario);
    } finally {
      setGuardando(false);
    }
  };

  const handleCompletar = async () => {
    setGuardando(true);
    try {
      await onCompletar(labor.id);
    } finally {
      setGuardando(false);
    }
  };

  const avanceColor = avance >= 100 ? 'bg-green-500' : avance >= 50 ? 'bg-blue-500' : avance > 0 ? 'bg-amber-500' : 'bg-gray-300';

  return (
    <div className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} shadow-sm mb-3 overflow-hidden transition-all`}>
      <button
        className="w-full text-left p-4 flex items-start justify-between gap-3"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
              {cfg.icon} {cfg.label}
            </span>
            <span className="text-xs text-gray-500">#{labor.id}</span>
          </div>
          <p className="font-semibold text-gray-800 text-sm leading-tight truncate">
            {labor.tipo_labor_nombre || labor.recomendacion_titulo || 'Labor asignada'}
          </p>
          {labor.lote_nombre && (
            <p className="text-xs text-gray-500 mt-0.5">📍 {labor.lote_nombre}</p>
          )}
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Avance</span>
              <span className="font-bold">{labor.avance_porcentaje || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${avanceColor}`}
                style={{ width: `${labor.avance_porcentaje || 0}%` }}
              />
            </div>
          </div>
        </div>
        <span className="text-gray-400 text-lg mt-1">{expandido ? '▲' : '▼'}</span>
      </button>

      {expandido && (
        <div className="px-4 pb-4 border-t border-gray-200 bg-white/60">
          {labor.recomendacion_titulo && (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-600 font-medium">📋 Recomendación</p>
              <p className="text-sm text-blue-800">{labor.recomendacion_titulo}</p>
            </div>
          )}

          {labor.comentario && !expandido && (
            <p className="mt-2 text-sm text-gray-600 italic">"{labor.comentario}"</p>
          )}

          {labor.fecha_asignacion && (
            <p className="mt-2 text-xs text-gray-500">
              📅 Asignada: {new Date(labor.fecha_asignacion).toLocaleDateString('es-ES')}
            </p>
          )}

          {labor.estado !== 'completada' && labor.estado !== 'cancelada' && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Actualizar avance: <span className="text-blue-600 font-bold">{avance}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={avance}
                  onChange={e => setAvance(Number(e.target.value))}
                  className="w-full accent-green-600"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Comentario / Nota</label>
                <textarea
                  value={comentario}
                  onChange={e => setComentario(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="¿Cómo va el trabajo? Agrega una nota..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleGuardar}
                  disabled={guardando}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {guardando ? '⏳ Guardando...' : '💾 Guardar avance'}
                </button>
                {avance >= 100 && (
                  <button
                    onClick={handleCompletar}
                    disabled={guardando}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    ✅ Marcar completa
                  </button>
                )}
              </div>
            </div>
          )}

          {labor.estado === 'completada' && labor.fecha_finalizacion && (
            <div className="mt-3 p-2 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-green-700">
                ✅ Completada el {new Date(labor.fecha_finalizacion).toLocaleDateString('es-ES')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MisTareas: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [labores, setLabores] = useState<Labor[]>([]);
  const [loading, setLoading] = useState(true);
  const [vistaActiva, setVistaActiva] = useState<'todas' | 'pendiente' | 'en_progreso' | 'completada'>('todas');
  const [expandido, setExpandido] = useState<number | null>(null);
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  const cargarLabores = useCallback(async () => {
    try {
      setLoading(true);
      const data = await laborService.obtenerLabores({});
      const items = Array.isArray(data) ? data : (data?.items || []);
      setLabores(items);
    } catch (err: any) {
      toast.error('Error cargando tareas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarLabores(); }, [cargarLabores]);

  const handleActualizar = async (id: number, avancePorcentaje: number, comentario: string) => {
    try {
      if (offline) {
        await addPending({ type: 'registrar_avance', url: `/api/labores/${id}/registrar-avance`, method: 'POST', data: { avance_porcentaje: avancePorcentaje, comentario } });
        toast.success('Guardado localmente — se sincronizará cuando haya internet');
        setLabores(prev => prev.map(l => l.id === id ? { ...l, avance_porcentaje: avancePorcentaje, comentario, estado: avancePorcentaje >= 100 ? 'completada' : avancePorcentaje > 0 ? 'en_progreso' : l.estado } : l));
        return;
      }
      const actualizada = await laborService.registrarAvance(id, avancePorcentaje, comentario);
      setLabores(prev => prev.map(l => l.id === id ? { ...l, ...actualizada } : l));
      toast.success('Avance actualizado');
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar');
    }
  };

  const handleCompletar = async (id: number) => {
    try {
      if (offline) {
        await addPending({ type: 'completar_labor', url: `/api/labores/${id}/completar`, method: 'POST', data: {} });
        toast.success('Guardado localmente — se sincronizará cuando haya internet');
        setLabores(prev => prev.map(l => l.id === id ? { ...l, estado: 'completada', avance_porcentaje: 100 } : l));
        return;
      }
      await laborService.completarLabor(id);
      setLabores(prev => prev.map(l => l.id === id ? { ...l, estado: 'completada', avance_porcentaje: 100 } : l));
      toast.success('¡Labor completada!');
    } catch (err: any) {
      toast.error(err.message || 'Error al completar');
    }
  };

  const laboresFiltradas = labores.filter(l => vistaActiva === 'todas' || l.estado === vistaActiva);

  const conteos = {
    todas: labores.length,
    pendiente: labores.filter(l => l.estado === 'pendiente').length,
    en_progreso: labores.filter(l => l.estado === 'en_progreso').length,
    completada: labores.filter(l => l.estado === 'completada').length,
  };

  const tabs = [
    { key: 'todas', label: 'Todas', color: 'text-gray-700', activeBg: 'bg-gray-700 text-white' },
    { key: 'pendiente', label: '⏳ Pendientes', color: 'text-amber-700', activeBg: 'bg-amber-500 text-white' },
    { key: 'en_progreso', label: '🔄 En Progreso', color: 'text-blue-700', activeBg: 'bg-blue-600 text-white' },
    { key: 'completada', label: '✅ Completas', color: 'text-green-700', activeBg: 'bg-green-600 text-white' },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header fijo */}
      <header className="sticky top-0 z-30 bg-green-700 text-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-green-200 hover:text-white transition-colors p-1"
            >
              ← Volver
            </button>
            <div>
              <h1 className="text-lg font-bold leading-tight">Mis Tareas</h1>
              {user && <p className="text-green-200 text-xs">{user.nombre}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {offline && (
              <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                📴 Sin internet
              </span>
            )}
            <button
              onClick={cargarLabores}
              className="text-green-200 hover:text-white text-sm p-2"
              title="Refrescar"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Resumen rápido */}
        <div className="flex gap-3 px-4 pb-3 overflow-x-auto">
          <div className="bg-white/20 rounded-lg px-3 py-1.5 text-center flex-shrink-0">
            <p className="text-lg font-bold">{conteos.todas}</p>
            <p className="text-xs text-green-100">Total</p>
          </div>
          <div className="bg-amber-500/40 rounded-lg px-3 py-1.5 text-center flex-shrink-0">
            <p className="text-lg font-bold">{conteos.pendiente}</p>
            <p className="text-xs text-green-100">Pendientes</p>
          </div>
          <div className="bg-blue-500/40 rounded-lg px-3 py-1.5 text-center flex-shrink-0">
            <p className="text-lg font-bold">{conteos.en_progreso}</p>
            <p className="text-xs text-green-100">En Progreso</p>
          </div>
          <div className="bg-green-500/40 rounded-lg px-3 py-1.5 text-center flex-shrink-0">
            <p className="text-lg font-bold">{conteos.completada}</p>
            <p className="text-xs text-green-100">Completas</p>
          </div>
        </div>
      </header>

      {/* Tabs de filtro */}
      <div className="bg-white border-b border-gray-200 px-3 py-2 flex gap-2 overflow-x-auto sticky top-[120px] z-20 shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setVistaActiva(tab.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              vistaActiva === tab.key ? tab.activeBg : `bg-gray-100 ${tab.color}`
            }`}
          >
            {tab.label} ({conteos[tab.key]})
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="px-4 py-4 max-w-lg mx-auto">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin text-4xl mb-3">⚙️</div>
            <p className="text-gray-500">Cargando tus tareas...</p>
          </div>
        ) : laboresFiltradas.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">
              {vistaActiva === 'completada' ? '🎉' : vistaActiva === 'pendiente' ? '😌' : '📋'}
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {vistaActiva === 'completada' ? '¡Sin completar aún!' :
               vistaActiva === 'pendiente' ? '¡Sin pendientes!' :
               'Sin tareas por aquí'}
            </h3>
            <p className="text-gray-500 text-sm">
              {vistaActiva === 'todas' ? 'No tienes tareas asignadas aún' : 
               `No hay tareas con estado "${tabs.find(t => t.key === vistaActiva)?.label}"`}
            </p>
          </div>
        ) : (
          <div>
            {laboresFiltradas.map(labor => (
              <LaborCard
                key={labor.id}
                labor={labor}
                onActualizar={handleActualizar}
                onCompletar={handleCompletar}
                expandido={expandido === labor.id}
                onToggle={() => setExpandido(expandido === labor.id ? null : labor.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Aviso offline */}
      {offline && (
        <div className="fixed bottom-4 left-4 right-4 bg-amber-500 text-white rounded-xl shadow-lg p-3 flex items-center gap-3 mx-auto max-w-sm">
          <span className="text-2xl">📴</span>
          <div>
            <p className="font-semibold text-sm">Modo sin conexión</p>
            <p className="text-xs text-amber-100">Los cambios se guardarán y sincronizarán automáticamente cuando vuelva el internet.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisTareas;
