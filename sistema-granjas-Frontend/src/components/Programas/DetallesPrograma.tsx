import React from 'react';
import Modal from '../Common/Modal';

interface DetallesProgramaProps {
    isOpen: boolean;
    onClose: () => void;
    programa: any;
    usuariosPrograma: any[];
    granjasPrograma: any[];
    onAsignarUsuarioOpen: () => void;
    onAsignarGranjaOpen: () => void;
    onRemoveUsuario: (usuarioId: number) => void;
    onRemoveGranja: (granjaId: number) => void;
    obtenerLabelTipo?: (tipo: string) => string;
    obtenerIconoTipo?: (tipo: string) => string;
}

const TIPO_CONFIG: Record<string, { bg: string; text: string; icon: string; headerAccent: string }> = {
    agricola: { bg: 'bg-green-50', text: 'text-green-700', icon: 'fas fa-seedling', headerAccent: 'bg-green-100 text-green-800' },
    pecuario: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'fas fa-horse', headerAccent: 'bg-amber-100 text-amber-800' },
    prueba:   { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'fas fa-flask', headerAccent: 'bg-purple-100 text-purple-800' },
};

export const DetallesPrograma: React.FC<DetallesProgramaProps> = ({
    isOpen, onClose, programa,
    usuariosPrograma, granjasPrograma,
    onAsignarUsuarioOpen, onAsignarGranjaOpen,
    onRemoveUsuario, onRemoveGranja,
    obtenerLabelTipo = t => t,
    obtenerIconoTipo = () => 'fas fa-question',
}) => {
    if (!programa) return null;

    const tipoConf = TIPO_CONFIG[programa.tipo] || { bg: 'bg-gray-50', text: 'text-gray-700', icon: 'fas fa-folder', headerAccent: 'bg-gray-100 text-gray-800' };
    const fmtDate = (s: string) => s ? new Date(s).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

    return (
        <Modal isOpen={isOpen} onClose={onClose} width="max-w-4xl" showCloseButton={false}>
            <div className="flex flex-col max-h-[92vh]">

                {/* ── Header ── */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-5 rounded-t-lg flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <i className={`${obtenerIconoTipo(programa.tipo)} text-white text-xl`}></i>
                            </div>
                            <div>
                                <p className="text-green-200 text-xs font-medium uppercase tracking-wider mb-0.5">Programa</p>
                                <h2 className="text-white text-2xl font-bold leading-tight">{programa.nombre}</h2>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/15 rounded-xl p-2 transition-colors">
                            <i className="fas fa-times text-lg"></i>
                        </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${programa.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'} border border-white/20`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${programa.activo ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            {programa.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        {programa.tipo && (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${tipoConf.headerAccent} border border-white/20`}>
                                <i className={obtenerIconoTipo(programa.tipo)}></i>
                                {obtenerLabelTipo(programa.tipo)}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-5">

                    {/* Info general */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                                <i className="fas fa-info-circle text-green-600 text-sm"></i>
                            </div>
                            <h3 className="font-semibold text-gray-800">Información general</h3>
                        </div>
                        <div className="space-y-0 divide-y divide-gray-50">
                            <div className="flex justify-between items-center py-2.5 text-sm">
                                <span className="text-gray-500">Nombre</span>
                                <span className="font-semibold text-gray-800">{programa.nombre}</span>
                            </div>
                            <div className="flex justify-between items-center py-2.5 text-sm">
                                <span className="text-gray-500">Tipo</span>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tipoConf.bg} ${tipoConf.text}`}>
                                    <i className={obtenerIconoTipo(programa.tipo)}></i>
                                    {obtenerLabelTipo(programa.tipo)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2.5 text-sm">
                                <span className="text-gray-500">Estado</span>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${programa.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${programa.activo ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                    {programa.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                            {programa.fecha_creacion && (
                                <div className="flex justify-between items-center py-2.5 text-sm">
                                    <span className="text-gray-500">Fecha creación</span>
                                    <span className="font-medium text-gray-800">{fmtDate(programa.fecha_creacion)}</span>
                                </div>
                            )}
                        </div>
                        {programa.descripcion && (
                            <div className="mt-4">
                                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Descripción</p>
                                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    {programa.descripcion}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Usuarios */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-users text-blue-600 text-sm"></i>
                                </div>
                                <h3 className="font-semibold text-gray-800">Usuarios asignados</h3>
                                <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">{usuariosPrograma.length}</span>
                            </div>
                            <button onClick={onAsignarUsuarioOpen} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                                <i className="fas fa-plus text-xs"></i>
                                Asignar usuario
                            </button>
                        </div>
                        <div className="p-4">
                            {usuariosPrograma.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <i className="fas fa-user-slash text-3xl mb-2 block text-gray-300"></i>
                                    <p className="text-sm font-medium text-gray-500">No hay usuarios asignados</p>
                                    <p className="text-xs mt-1">Asigna usuarios para gestionar este programa</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {usuariosPrograma.map(u => (
                                        <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-blue-50/50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <i className="fas fa-user text-blue-600 text-sm"></i>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800 text-sm">{u.nombre}</p>
                                                    <p className="text-xs text-gray-500">{u.email}</p>
                                                    {u.rol && <span className="text-xs text-gray-400">{u.rol}</span>}
                                                </div>
                                            </div>
                                            <button onClick={() => onRemoveUsuario(u.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Remover">
                                                <i className="fas fa-times text-sm"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Granjas */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-warehouse text-emerald-600 text-sm"></i>
                                </div>
                                <h3 className="font-semibold text-gray-800">Granjas asignadas</h3>
                                <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">{granjasPrograma.length}</span>
                            </div>
                            <button onClick={onAsignarGranjaOpen} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                                <i className="fas fa-plus text-xs"></i>
                                Asignar granja
                            </button>
                        </div>
                        <div className="p-4">
                            {granjasPrograma.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <i className="fas fa-warehouse text-3xl mb-2 block text-gray-300"></i>
                                    <p className="text-sm font-medium text-gray-500">No hay granjas asignadas</p>
                                    <p className="text-xs mt-1">Asigna granjas para este programa</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {granjasPrograma.map(g => (
                                        <div key={g.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-emerald-50/50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <i className="fas fa-warehouse text-emerald-600 text-sm"></i>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800 text-sm">{g.nombre}</p>
                                                    {g.ubicacion && <p className="text-xs text-gray-500">{g.ubicacion}</p>}
                                                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${g.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {g.activo ? 'Activa' : 'Inactiva'}
                                                    </span>
                                                </div>
                                            </div>
                                            <button onClick={() => onRemoveGranja(g.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Remover">
                                                <i className="fas fa-times text-sm"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="bg-white border-t border-gray-100 px-6 py-4 flex justify-end flex-shrink-0">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
        </Modal>
    );
};
