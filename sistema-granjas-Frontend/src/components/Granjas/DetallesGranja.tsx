import React from 'react';
import Modal from '../Common/Modal';

interface DetallesGranjaProps {
    isOpen: boolean;
    onClose: () => void;
    granja: any;
    usuariosGranja: any[];
    programasGranja: any[];
    onAsignarUsuarioOpen: () => void;
    onAsignarProgramaOpen: () => void;
    onRemoveUsuario: (id: number) => void;
    onRemovePrograma: (id: number) => void;
}

const ROL_COLORS: Record<string, string> = {
    docente: 'bg-blue-100 text-blue-700',
    asesor: 'bg-purple-100 text-purple-700',
    talento_humano: 'bg-amber-100 text-amber-700',
    jefe_talento_humano: 'bg-red-100 text-red-700',
    admin: 'bg-gray-100 text-gray-700',
};

export const DetallesGranja: React.FC<DetallesGranjaProps> = ({
    isOpen, onClose, granja,
    usuariosGranja, programasGranja,
    onAsignarUsuarioOpen, onAsignarProgramaOpen,
    onRemoveUsuario, onRemovePrograma,
}) => {
    if (!granja) return null;

    const fmtDate = (s: string) => new Date(s).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <Modal isOpen={isOpen} onClose={onClose} width="max-w-4xl" showCloseButton={false}>
            <div className="flex flex-col max-h-[92vh]">

                {/* ── Header ── */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-5 rounded-t-lg flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <i className="fas fa-warehouse text-white text-xl"></i>
                            </div>
                            <div>
                                <p className="text-green-200 text-xs font-medium uppercase tracking-wider mb-0.5">Granja</p>
                                <h2 className="text-white text-2xl font-bold leading-tight">{granja.nombre}</h2>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/15 rounded-xl p-2 transition-colors">
                            <i className="fas fa-times text-lg"></i>
                        </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${granja.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'} border border-white/20`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${granja.activo ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            {granja.activo ? 'Activa' : 'Inactiva'}
                        </span>
                        {granja.ubicacion && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white">
                                <i className="fas fa-map-marker-alt"></i>
                                {granja.ubicacion}
                            </span>
                        )}
                        {granja.fecha_creacion && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white">
                                <i className="fas fa-calendar-alt"></i>
                                {fmtDate(granja.fecha_creacion)}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-5">

                    {/* Info básica */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                                <i className="fas fa-info-circle text-green-600 text-sm"></i>
                            </div>
                            <h3 className="font-semibold text-gray-800">Información general</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { icon: 'fas fa-map-marker-alt', label: 'Ubicación', value: granja.ubicacion || '—', color: 'text-green-600', bg: 'bg-green-50' },
                                { icon: 'fas fa-toggle-on', label: 'Estado', value: granja.activo ? 'Activa' : 'Inactiva', color: granja.activo ? 'text-emerald-600' : 'text-red-600', bg: granja.activo ? 'bg-emerald-50' : 'bg-red-50' },
                                { icon: 'fas fa-calendar-alt', label: 'Fecha creación', value: granja.fecha_creacion ? fmtDate(granja.fecha_creacion) : '—', color: 'text-blue-600', bg: 'bg-blue-50' },
                            ].map(item => (
                                <div key={item.label} className={`${item.bg} rounded-xl p-4`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <i className={`${item.icon} ${item.color} text-xs`}></i>
                                        <span className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</span>
                                    </div>
                                    <p className={`font-semibold text-sm ${item.color}`}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                        {granja.descripcion && (
                            <p className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100">{granja.descripcion}</p>
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
                                <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">{usuariosGranja.length}</span>
                            </div>
                            <button onClick={onAsignarUsuarioOpen} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                                <i className="fas fa-plus text-xs"></i>
                                Asignar usuario
                            </button>
                        </div>
                        <div className="p-4">
                            {usuariosGranja.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <i className="fas fa-user-slash text-3xl mb-2 block"></i>
                                    <p className="text-sm">No hay usuarios asignados</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {usuariosGranja.map(u => (
                                        <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <i className="fas fa-user text-blue-600 text-sm"></i>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800 text-sm">{u.nombre}</p>
                                                    <p className="text-xs text-gray-500">{u.email}</p>
                                                    {u.rol_nombre && (
                                                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROL_COLORS[u.rol_nombre] || 'bg-gray-100 text-gray-600'}`}>
                                                            {u.rol_nombre.replace(/_/g, ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button onClick={() => onRemoveUsuario(u.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remover">
                                                <i className="fas fa-times text-sm"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Programas */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                                    <i className="fas fa-seedling text-purple-600 text-sm"></i>
                                </div>
                                <h3 className="font-semibold text-gray-800">Programas asignados</h3>
                                <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">{programasGranja.length}</span>
                            </div>
                            <button onClick={onAsignarProgramaOpen} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                                <i className="fas fa-plus text-xs"></i>
                                Asignar programa
                            </button>
                        </div>
                        <div className="p-4">
                            {programasGranja.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <i className="fas fa-folder-open text-3xl mb-2 block"></i>
                                    <p className="text-sm">No hay programas asignados</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {programasGranja.map(p => (
                                        <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <i className="fas fa-leaf text-purple-600 text-sm"></i>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800 text-sm">{p.nombre}</p>
                                                    {p.descripcion && <p className="text-xs text-gray-500 line-clamp-1">{p.descripcion}</p>}
                                                </div>
                                            </div>
                                            <button onClick={() => onRemovePrograma(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remover">
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
