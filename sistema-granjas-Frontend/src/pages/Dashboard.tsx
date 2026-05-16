// Dashboard.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/Common/DashboardHeader';
import Sidebar from '../components/Common/SideBar';
import { useAuth } from '../hooks/useAuth';
import granjaService from '../services/granjaService';
import programaService from '../services/programaService';
import loteService from '../services/loteService';
import cultivoService from '../services/cultivoService';
import { normalizarArray } from '../utils/normalize';

interface DashboardStats {
  granjas: number;
  programas: number;
  lotes: number;
  cultivos: number;
}

const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

const getRoleLabel = (rol: string | undefined): string => {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    asesor: 'Asesor',
    docente: 'Docente',
    talento_humano: 'Talento Humano',
    estudiante: 'Estudiante',
    trabajador: 'Trabajador',
  };
  return labels[rol || ''] || 'Usuario';
};

const getRoleColor = (rol: string | undefined): string => {
  const colors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    asesor: 'bg-blue-100 text-blue-700',
    docente: 'bg-green-100 text-green-700',
    talento_humano: 'bg-red-100 text-red-700',
    estudiante: 'bg-amber-100 text-amber-700',
    trabajador: 'bg-orange-100 text-orange-700',
  };
  return colors[rol || ''] || 'bg-gray-100 text-gray-700';
};

interface QuickAction {
  label: string;
  icon: string;
  path: string;
  color: string;
}

const getQuickActions = (rol: string | undefined): QuickAction[] => {
  const actions: Record<string, QuickAction[]> = {
    admin: [
      { label: 'Usuarios', icon: 'fa-users', path: '/gestion/usuarios', color: 'bg-purple-500' },
      { label: 'Estadísticas', icon: 'fa-chart-bar', path: '/gestion/estadisticas', color: 'bg-blue-500' },
      { label: 'Inventario', icon: 'fa-boxes', path: '/gestion/inventario', color: 'bg-amber-500' },
      { label: 'Recomendaciones', icon: 'fa-lightbulb', path: '/gestion/recomendaciones', color: 'bg-green-500' },
      { label: 'Labores', icon: 'fa-calendar-check', path: '/gestion/labores', color: 'bg-teal-500' },
      { label: 'Diagnósticos', icon: 'fa-stethoscope', path: '/gestion/diagnosticos', color: 'bg-red-500' },
    ],
    docente: [
      { label: 'Nuevo Diagnóstico', icon: 'fa-stethoscope', path: '/gestion/diagnosticos', color: 'bg-teal-500' },
      { label: 'Recomendaciones', icon: 'fa-lightbulb', path: '/gestion/recomendaciones', color: 'bg-purple-500' },
      { label: 'Labores', icon: 'fa-calendar-check', path: '/gestion/labores', color: 'bg-green-500' },
      { label: 'Inventario', icon: 'fa-boxes', path: '/gestion/inventario', color: 'bg-amber-500' },
    ],
    asesor: [
      { label: 'Diagnósticos', icon: 'fa-stethoscope', path: '/gestion/diagnosticos', color: 'bg-teal-500' },
      { label: 'Recomendaciones', icon: 'fa-lightbulb', path: '/gestion/recomendaciones', color: 'bg-purple-500' },
      { label: 'Labores', icon: 'fa-calendar-check', path: '/gestion/labores', color: 'bg-green-500' },
      { label: 'Lotes', icon: 'fa-tractor', path: '/gestion/lotes', color: 'bg-blue-500' },
    ],
    estudiante: [
      { label: 'Nuevo Diagnóstico', icon: 'fa-stethoscope', path: '/gestion/diagnosticos', color: 'bg-teal-500' },
      { label: 'Recomendaciones', icon: 'fa-lightbulb', path: '/gestion/recomendaciones', color: 'bg-purple-500' },
    ],
    trabajador: [
      { label: 'Mi Tablero', icon: 'fa-th-large', path: '/tablero', color: 'bg-orange-500' },
      { label: 'Mis Labores', icon: 'fa-calendar-check', path: '/gestion/labores', color: 'bg-green-500' },
    ],
    talento_humano: [
      { label: 'Asignar Labores', icon: 'fa-calendar-check', path: '/gestion/labores', color: 'bg-green-500' },
      { label: 'Gestionar Personal', icon: 'fa-users', path: '/gestion/usuarios', color: 'bg-purple-500' },
    ],
  };
  return actions[rol || ''] || [];
};

interface ModuleInfo {
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
  bgLight: string;
  ruta: string;
  stat: number;
  statLabel: string;
  roles: string[];
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ granjas: 0, programas: 0, lotes: 0, cultivos: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarEstadisticas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [granjasResp, programasResp, lotesResp, cultivosResp] = await Promise.allSettled([
        granjaService.obtenerGranjas(),
        programaService.obtenerProgramas(),
        loteService.obtenerLotes(),
        cultivoService.obtenerCultivos(),
      ]);
      const get = (r: PromiseSettledResult<any>) => r.status === 'fulfilled' ? normalizarArray(r.value) : [];
      setStats({
        granjas: get(granjasResp).length,
        programas: get(programasResp).length,
        lotes: get(lotesResp).length,
        cultivos: get(cultivosResp).length,
      });
    } catch {
      setError('No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarEstadisticas(); }, [cargarEstadisticas]);

  const rol = user?.rol;
  const quickActions = useMemo(() => getQuickActions(rol), [rol]);

  const allModules: ModuleInfo[] = useMemo(() => [
    {
      titulo: 'Granjas', descripcion: 'Administra granjas y sus ubicaciones',
      icono: 'fa-warehouse', color: 'text-blue-600', bgLight: 'bg-blue-50',
      ruta: '/gestion/granjas', stat: stats.granjas, statLabel: 'registradas',
      roles: ['admin', 'asesor', 'docente'],
    },
    {
      titulo: 'Programas', descripcion: 'Programas agrícolas y pecuarios',
      icono: 'fa-clipboard-list', color: 'text-green-600', bgLight: 'bg-green-50',
      ruta: '/gestion/programas', stat: stats.programas, statLabel: 'activos',
      roles: ['admin', 'asesor', 'docente'],
    },
    {
      titulo: 'Lotes', descripcion: 'Controla lotes de producción',
      icono: 'fa-tractor', color: 'text-purple-600', bgLight: 'bg-purple-50',
      ruta: '/gestion/lotes', stat: stats.lotes, statLabel: 'registrados',
      roles: ['admin', 'asesor', 'docente', 'estudiante'],
    },
    {
      titulo: 'Cultivos', descripcion: 'Cultivos, especies y variedades',
      icono: 'fa-leaf', color: 'text-amber-600', bgLight: 'bg-amber-50',
      ruta: '/gestion/cultivos', stat: stats.cultivos, statLabel: 'registrados',
      roles: ['admin', 'asesor', 'docente'],
    },
    {
      titulo: 'Inventario', descripcion: 'Herramientas e insumos',
      icono: 'fa-boxes', color: 'text-orange-600', bgLight: 'bg-orange-50',
      ruta: '/gestion/inventario', stat: 0, statLabel: '',
      roles: ['admin', 'asesor', 'docente'],
    },
    {
      titulo: 'Diagnósticos', descripcion: 'Evaluaciones y diagnósticos agrícolas',
      icono: 'fa-stethoscope', color: 'text-teal-600', bgLight: 'bg-teal-50',
      ruta: '/gestion/diagnosticos', stat: 0, statLabel: '',
      roles: ['admin', 'asesor', 'docente', 'estudiante'],
    },
    {
      titulo: 'Recomendaciones', descripcion: 'Recomendaciones técnicas',
      icono: 'fa-lightbulb', color: 'text-yellow-600', bgLight: 'bg-yellow-50',
      ruta: '/gestion/recomendaciones', stat: 0, statLabel: '',
      roles: ['admin', 'asesor', 'docente', 'estudiante'],
    },
    {
      titulo: 'Labores', descripcion: 'Planificación y seguimiento de labores',
      icono: 'fa-calendar-check', color: 'text-indigo-600', bgLight: 'bg-indigo-50',
      ruta: '/gestion/labores', stat: 0, statLabel: '',
      roles: ['admin', 'asesor', 'docente', 'talento_humano', 'trabajador'],
    },
    {
      titulo: 'Estadísticas', descripcion: 'Reportes y visualizaciones',
      icono: 'fa-chart-bar', color: 'text-rose-600', bgLight: 'bg-rose-50',
      ruta: '/gestion/estadisticas', stat: 0, statLabel: '',
      roles: ['admin'],
    },
    {
      titulo: 'Usuarios', descripcion: 'Gestión de usuarios y roles',
      icono: 'fa-users', color: 'text-slate-600', bgLight: 'bg-slate-50',
      ruta: '/gestion/usuarios', stat: 0, statLabel: '',
      roles: ['admin', 'talento_humano'],
    },
  ], [stats]);

  const visibleModules = useMemo(
    () => allModules.filter(m => !rol || m.roles.includes(rol)),
    [allModules, rol]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />

      <div className="flex">
        {/* Sidebar — solo en desktop */}
        <div className="hidden lg:block flex-shrink-0">
          <Sidebar />
        </div>

        {/* Contenido principal */}
        <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-full">
          <div className="max-w-5xl mx-auto">

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 flex items-center gap-3 text-sm">
                <i className="fas fa-exclamation-circle flex-shrink-0"></i>
                <span>{error}</span>
                <button onClick={cargarEstadisticas} className="ml-auto text-xs bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg font-medium transition-colors">
                  Reintentar
                </button>
              </div>
            )}

            {/* Banner de bienvenida */}
            <section className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-5 sm:p-7 mb-6 text-white shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-green-200 text-sm mb-0.5">{getGreeting()},</p>
                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{user?.nombre || 'Usuario'}</h1>
                  <span className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(rol)}`}>
                    <i className="fas fa-circle text-[6px] mr-1.5"></i>
                    {getRoleLabel(rol)}
                  </span>
                </div>
                {/* Stats rápidas */}
                <div className="grid grid-cols-4 gap-2 sm:gap-3">
                  {[
                    { n: stats.granjas, l: 'Granjas' },
                    { n: stats.programas, l: 'Programas' },
                    { n: stats.lotes, l: 'Lotes' },
                    { n: stats.cultivos, l: 'Cultivos' },
                  ].map(({ n, l }) => (
                    <div key={l} className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 text-center min-w-[52px]">
                      <div className="text-xl font-bold">{n}</div>
                      <div className="text-green-100 text-[10px] sm:text-xs">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Acciones rápidas — por rol */}
            {quickActions.length > 0 && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <i className="fas fa-bolt text-amber-500"></i>
                  Acciones rápidas
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {quickActions.map((action) => (
                    <button
                      key={action.path}
                      onClick={() => navigate(action.path)}
                      className="flex items-center gap-3 bg-white border border-gray-200 hover:border-green-300 hover:shadow-md rounded-xl p-3.5 text-left transition-all duration-200 group"
                    >
                      <div className={`w-9 h-9 rounded-lg ${action.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <i className={`fas ${action.icon} text-white text-sm`}></i>
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 leading-tight">{action.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Módulos visibles para este rol */}
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <i className="fas fa-th-large text-gray-400"></i>
                Módulos del sistema
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleModules.map((mod) => (
                  <button
                    key={mod.ruta}
                    onClick={() => navigate(mod.ruta)}
                    className="bg-white border border-gray-200 hover:border-green-300 hover:shadow-md rounded-xl p-5 text-left transition-all duration-200 group flex items-start gap-4"
                  >
                    <div className={`w-11 h-11 rounded-xl ${mod.bgLight} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                      <i className={`fas ${mod.icono} ${mod.color} text-lg`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-semibold text-gray-800 group-hover:text-green-700 transition-colors">{mod.titulo}</h3>
                        {mod.stat > 0 && (
                          <span className="text-xs text-gray-400 font-normal">{mod.stat} {mod.statLabel}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{mod.descripcion}</p>
                    </div>
                    <i className="fas fa-chevron-right text-gray-300 group-hover:text-green-500 text-xs mt-1 transition-colors flex-shrink-0"></i>
                  </button>
                ))}
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
};

export default React.memo(Dashboard);
