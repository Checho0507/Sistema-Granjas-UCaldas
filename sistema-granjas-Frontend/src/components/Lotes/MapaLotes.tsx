import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface LoteResumen {
  lote_id: number;
  lote_nombre: string;
  granja_nombre?: string;
  programa_nombre?: string;
  programa_id?: number;
  cultivo?: string;
  estado_lote?: string;
  diagnosticos: {
    total: number; abiertos: number; en_revision: number; cerrados: number;
    ultimo_estado?: string; ultimo_tipo?: string; ultima_fecha?: string;
  };
  recomendaciones: { total: number; pendientes: number; aprobadas: number; completadas: number };
  labores: { total: number; pendientes: number; en_progreso: number; completadas: number };
}

type Vista = 'general' | 'diagnosticos' | 'recomendaciones' | 'labores';

const VISTAS: { key: Vista; label: string; icon: string }[] = [
  { key: 'general', label: 'General', icon: '🗺️' },
  { key: 'diagnosticos', label: 'Diagnósticos', icon: '🔬' },
  { key: 'recomendaciones', label: 'Recomendaciones', icon: '📋' },
  { key: 'labores', label: 'Labores', icon: '⚒️' },
];

const getColorSaludDiagnostico = (diag: LoteResumen['diagnosticos']) => {
  if (diag.total === 0) return { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600', label: 'Sin datos' };
  if (diag.abiertos > 0) return { bg: 'bg-red-50', border: 'border-red-300', badge: 'bg-red-100 text-red-700', label: 'Atención' };
  if (diag.en_revision > 0) return { bg: 'bg-amber-50', border: 'border-amber-300', badge: 'bg-amber-100 text-amber-700', label: 'En revisión' };
  return { bg: 'bg-green-50', border: 'border-green-300', badge: 'bg-green-100 text-green-700', label: 'Saludable' };
};

const getColorLabores = (labores: LoteResumen['labores']) => {
  if (labores.total === 0) return { bg: 'bg-gray-50', border: 'border-gray-200', label: 'Sin labores' };
  const pct = labores.completadas / labores.total;
  if (pct >= 1) return { bg: 'bg-green-50', border: 'border-green-300', label: 'Completo' };
  if (pct >= 0.5) return { bg: 'bg-blue-50', border: 'border-blue-300', label: 'En progreso' };
  return { bg: 'bg-amber-50', border: 'border-amber-300', label: 'Iniciado' };
};

interface LoteCardProps {
  resumen: LoteResumen;
  vista: Vista;
  onClick: () => void;
}

const LoteCard: React.FC<LoteCardProps> = ({ resumen, vista, onClick }) => {
  const diagConfig = getColorSaludDiagnostico(resumen.diagnosticos);
  const laborConfig = getColorLabores(resumen.labores);
  const borderColor = vista === 'diagnosticos' ? diagConfig.border : vista === 'labores' ? laborConfig.border : 'border-gray-200';
  const bgColor = vista === 'diagnosticos' ? diagConfig.bg : vista === 'labores' ? laborConfig.bg : 'bg-white';

  const estadoLoteColor = (estado?: string) => {
    switch (estado) {
      case 'activo': return 'bg-green-100 text-green-700';
      case 'inactivo': return 'bg-gray-100 text-gray-600';
      case 'completado': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`${bgColor} border-2 ${borderColor} rounded-xl p-4 cursor-pointer hover:shadow-md transition-all group`}
    >
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-800 text-sm leading-tight group-hover:text-green-700 transition-colors">
            {resumen.lote_nombre}
          </h3>
          {resumen.granja_nombre && (
            <p className="text-xs text-gray-500 mt-0.5">🏡 {resumen.granja_nombre}</p>
          )}
          {resumen.programa_nombre && (
            <p className="text-xs text-purple-600 mt-0.5">📚 {resumen.programa_nombre}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
          {resumen.estado_lote && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoLoteColor(resumen.estado_lote)}`}>
              {resumen.estado_lote}
            </span>
          )}
          {vista === 'diagnosticos' && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diagConfig.badge}`}>
              {diagConfig.label}
            </span>
          )}
        </div>
      </div>

      {resumen.cultivo && (
        <p className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-md mb-3 font-medium">
          🌱 {resumen.cultivo}
        </p>
      )}

      {/* Contenido según vista */}
      {vista === 'general' && (
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center bg-red-50 rounded-lg p-2">
            <p className="text-lg font-bold text-red-600">{resumen.diagnosticos.total}</p>
            <p className="text-xs text-red-500">Diagnóst.</p>
          </div>
          <div className="text-center bg-blue-50 rounded-lg p-2">
            <p className="text-lg font-bold text-blue-600">{resumen.recomendaciones.total}</p>
            <p className="text-xs text-blue-500">Recomen.</p>
          </div>
          <div className="text-center bg-green-50 rounded-lg p-2">
            <p className="text-lg font-bold text-green-600">{resumen.labores.total}</p>
            <p className="text-xs text-green-500">Labores</p>
          </div>
        </div>
      )}

      {vista === 'diagnosticos' && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Abiertos</span>
            <span className={`font-bold ${resumen.diagnosticos.abiertos > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {resumen.diagnosticos.abiertos}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">En revisión</span>
            <span className={`font-bold ${resumen.diagnosticos.en_revision > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
              {resumen.diagnosticos.en_revision}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Cerrados</span>
            <span className="font-bold text-green-600">{resumen.diagnosticos.cerrados}</span>
          </div>
          {resumen.diagnosticos.ultimo_tipo && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400">Último: <span className="text-gray-600 font-medium">{resumen.diagnosticos.ultimo_tipo}</span></p>
              {resumen.diagnosticos.ultima_fecha && (
                <p className="text-xs text-gray-400">{new Date(resumen.diagnosticos.ultima_fecha).toLocaleDateString('es-ES')}</p>
              )}
            </div>
          )}
        </div>
      )}

      {vista === 'recomendaciones' && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Pendientes</span>
            <span className={`font-bold ${resumen.recomendaciones.pendientes > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
              {resumen.recomendaciones.pendientes}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Aprobadas</span>
            <span className="font-bold text-blue-600">{resumen.recomendaciones.aprobadas}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Completadas</span>
            <span className="font-bold text-green-600">{resumen.recomendaciones.completadas}</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all"
              style={{ width: resumen.recomendaciones.total > 0 ? `${(resumen.recomendaciones.completadas / resumen.recomendaciones.total) * 100}%` : '0%' }}
            />
          </div>
        </div>
      )}

      {vista === 'labores' && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Pendientes</span>
            <span className={`font-bold ${resumen.labores.pendientes > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
              {resumen.labores.pendientes}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">En progreso</span>
            <span className={`font-bold ${resumen.labores.en_progreso > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
              {resumen.labores.en_progreso}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Completadas</span>
            <span className="font-bold text-green-600">{resumen.labores.completadas}</span>
          </div>
          {resumen.labores.total > 0 && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${(resumen.labores.completadas / resumen.labores.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface MapaLotesProps {
  lotes: any[];
  onVerDetalle: (lote: any) => void;
}

const MapaLotes: React.FC<MapaLotesProps> = ({ lotes, onVerDetalle }) => {
  const [vista, setVista] = useState<Vista>('general');
  const [resumenes, setResumenes] = useState<LoteResumen[]>([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (lotes.length > 0) cargarResumenes();
  }, [lotes]);

  const cargarResumenes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const resultados = await Promise.allSettled(
        lotes.map(lote =>
          fetch(`/api/lotes/${lote.id}/diagnosticos-resumen`, { headers })
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        )
      );

      const validos: LoteResumen[] = resultados
        .map((r, i) => {
          if (r.status === 'fulfilled' && r.value) return r.value as LoteResumen;
          return {
            lote_id: lotes[i].id,
            lote_nombre: lotes[i].nombre,
            granja_nombre: lotes[i].granja_nombre,
            programa_nombre: lotes[i].programa_nombre,
            cultivo: lotes[i].nombre_cultivo,
            estado_lote: lotes[i].estado,
            diagnosticos: { total: 0, abiertos: 0, en_revision: 0, cerrados: 0 },
            recomendaciones: { total: 0, pendientes: 0, aprobadas: 0, completadas: 0 },
            labores: { total: 0, pendientes: 0, en_progreso: 0, completadas: 0 },
          } as LoteResumen;
        });

      setResumenes(validos);
    } catch {
      toast.error('Error cargando resumen de lotes');
    } finally {
      setLoading(false);
    }
  };

  const lotesFiltrados = resumenes.filter(r =>
    !busqueda || r.lote_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (r.granja_nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (r.programa_nombre || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const totales = resumenes.reduce((acc, r) => ({
    diagnosticosAbiertos: acc.diagnosticosAbiertos + r.diagnosticos.abiertos,
    recomendacionesPendientes: acc.recomendacionesPendientes + r.recomendaciones.pendientes,
    laboresEnProgreso: acc.laboresEnProgreso + r.labores.en_progreso,
  }), { diagnosticosAbiertos: 0, recomendacionesPendientes: 0, laboresEnProgreso: 0 });

  const loteParaDetalle = (resumen: LoteResumen) =>
    lotes.find(l => l.id === resumen.lote_id) || { id: resumen.lote_id, nombre: resumen.lote_nombre };

  return (
    <div>
      {/* Alertas de estado global */}
      {(totales.diagnosticosAbiertos > 0 || totales.recomendacionesPendientes > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {totales.diagnosticosAbiertos > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
              <span className="text-2xl">🔴</span>
              <div>
                <p className="text-red-700 font-bold text-lg leading-none">{totales.diagnosticosAbiertos}</p>
                <p className="text-red-500 text-xs">Diagnósticos abiertos</p>
              </div>
            </div>
          )}
          {totales.recomendacionesPendientes > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
              <span className="text-2xl">🟡</span>
              <div>
                <p className="text-amber-700 font-bold text-lg leading-none">{totales.recomendacionesPendientes}</p>
                <p className="text-amber-500 text-xs">Recomendaciones pendientes</p>
              </div>
            </div>
          )}
          {totales.laboresEnProgreso > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
              <span className="text-2xl">🔵</span>
              <div>
                <p className="text-blue-700 font-bold text-lg leading-none">{totales.laboresEnProgreso}</p>
                <p className="text-blue-500 text-xs">Labores en progreso</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Barra de herramientas */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Búsqueda */}
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar lote, granja o programa..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        {/* Tabs de vista */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1 flex-shrink-0">
          {VISTAS.map(v => (
            <button
              key={v.key}
              onClick={() => setVista(v.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                vista === v.key ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{v.icon}</span>
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={cargarResumenes}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex-shrink-0"
        >
          {loading ? '⏳' : '🔄'} Actualizar
        </button>
      </div>

      {/* Leyenda según vista */}
      {vista === 'diagnosticos' && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { color: 'bg-red-100 border-red-300 text-red-700', label: '🔴 Con diagnósticos abiertos' },
            { color: 'bg-amber-100 border-amber-300 text-amber-700', label: '🟡 En revisión' },
            { color: 'bg-green-100 border-green-300 text-green-700', label: '🟢 Saludable' },
            { color: 'bg-gray-100 border-gray-300 text-gray-600', label: '⚪ Sin datos' },
          ].map(item => (
            <span key={item.label} className={`text-xs px-2 py-1 rounded-full border ${item.color}`}>{item.label}</span>
          ))}
        </div>
      )}

      {/* Grid de lotes */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(j => <div key={j} className="h-12 bg-gray-200 rounded-lg" />)}
              </div>
            </div>
          ))}
        </div>
      ) : lotesFiltrados.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">{busqueda ? '🔍' : '🗺️'}</p>
          <p className="font-medium">{busqueda ? 'No se encontraron lotes' : 'No hay lotes disponibles'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {lotesFiltrados.map(resumen => (
            <LoteCard
              key={resumen.lote_id}
              resumen={resumen}
              vista={vista}
              onClick={() => onVerDetalle(loteParaDetalle(resumen))}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-4">
        {lotesFiltrados.length} lotes • Vista: {VISTAS.find(v => v.key === vista)?.label}
      </p>
    </div>
  );
};

export default MapaLotes;
