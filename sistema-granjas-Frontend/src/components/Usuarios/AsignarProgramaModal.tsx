// src/components/Usuarios/AsignarProgramaModal.tsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import programaService from '../../services/programaService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  usuario: any | null;
}

export function AsignarProgramaModal({ isOpen, onClose, usuario }: Props) {
  const [programas, setProgramas] = useState<any[]>([]);
  const [asignados, setAsignados] = useState<Set<number>>(new Set());
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen && usuario) {
      cargarProgramas();
    } else {
      setProgramas([]);
      setAsignados(new Set());
      setProcesando(new Set());
    }
  }, [isOpen, usuario]);

  const cargarProgramas = async () => {
    setCargando(true);
    try {
      const todos = await programaService.obtenerProgramas();
      const lista = Array.isArray(todos) ? todos : (todos as any).items ?? [];
      setProgramas(lista);

      // Consultar en paralelo cuáles tienen asignado a este usuario
      const checks = await Promise.all(
        lista.map(async (prog: any) => {
          try {
            const usuarios = await programaService.obtenerUsuariosPorPrograma(prog.id);
            const usuariosList = Array.isArray(usuarios) ? usuarios : [];
            return { id: prog.id, asignado: usuariosList.some((u: any) => u.id === usuario.id) };
          } catch {
            return { id: prog.id, asignado: false };
          }
        })
      );

      setAsignados(new Set(checks.filter(c => c.asignado).map(c => c.id)));
    } catch {
      toast.error('No se pudieron cargar los programas');
    } finally {
      setCargando(false);
    }
  };

  const toggleAsignacion = async (programaId: number, estaAsignado: boolean) => {
    setProcesando(prev => new Set(prev).add(programaId));
    try {
      if (estaAsignado) {
        await programaService.removerUsuario(programaId, usuario.id);
        setAsignados(prev => { const s = new Set(prev); s.delete(programaId); return s; });
        toast.success('Programa removido del usuario');
      } else {
        await programaService.asignarUsuario(programaId, usuario.id);
        setAsignados(prev => new Set(prev).add(programaId));
        toast.success('Programa asignado correctamente');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar la asignación');
    } finally {
      setProcesando(prev => { const s = new Set(prev); s.delete(programaId); return s; });
    }
  };

  if (!isOpen || !usuario) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[85vh]">

        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <i className="fas fa-clipboard-list text-green-600"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Programas asignados</h2>
              <p className="text-xs text-gray-500">{usuario.nombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
              <span className="text-sm">Cargando programas...</span>
            </div>
          ) : programas.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <i className="fas fa-clipboard text-4xl mb-3 block text-gray-200"></i>
              <p className="text-sm">No hay programas disponibles en el sistema</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {programas.map((prog) => {
                const estaAsignado = asignados.has(prog.id);
                const estaProcesando = procesando.has(prog.id);

                return (
                  <li
                    key={prog.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      estaAsignado
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {/* Info del programa */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center ${
                        estaAsignado ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <i className={`fas fa-seedling text-sm ${estaAsignado ? 'text-green-600' : 'text-gray-400'}`}></i>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{prog.nombre}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {prog.descripcion || prog.estado || `Programa #${prog.id}`}
                        </p>
                      </div>
                    </div>

                    {/* Botón toggle */}
                    <button
                      onClick={() => toggleAsignacion(prog.id, estaAsignado)}
                      disabled={estaProcesando}
                      className={`flex-shrink-0 ml-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                        estaAsignado
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {estaProcesando ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : estaAsignado ? (
                        <><i className="fas fa-minus"></i> Remover</>
                      ) : (
                        <><i className="fas fa-plus"></i> Asignar</>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Pie */}
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {asignados.size === 0
              ? 'Sin programas asignados'
              : `${asignados.size} programa${asignados.size !== 1 ? 's' : ''} asignado${asignados.size !== 1 ? 's' : ''}`}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
