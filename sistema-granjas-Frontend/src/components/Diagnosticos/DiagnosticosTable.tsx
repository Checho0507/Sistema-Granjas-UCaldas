import React from 'react';
import type { DiagnosticoItem } from '../../types/diagnosticoTypes';

interface DiagnosticosTableProps {
    diagnosticos: DiagnosticoItem[];
    onEditar: (diagnostico: DiagnosticoItem) => void;
    onEliminar: (id: number) => void;
    onAsignarDocente?: (diagnostico: DiagnosticoItem) => void;
    onAgregarEvidencia: (diagnostico: DiagnosticoItem) => void;
    onVerDetalles: (diagnostico: DiagnosticoItem) => void;
    onCerrar?: (diagnostico: DiagnosticoItem) => void;
    onCrearRecomendacion?: (diagnostico: DiagnosticoItem) => void;
    currentUser: any;
}

const DiagnosticosTable: React.FC<DiagnosticosTableProps> = ({
    diagnosticos,
    onEditar,
    onEliminar,
    onAsignarDocente,
    onAgregarEvidencia,
    onVerDetalles,
    onCerrar,
    onCrearRecomendacion,
    currentUser
}) => {
    // Determinar si el usuario actual es docente (rol_id 2 o 5)
    const esDocente = currentUser?.rol_id === 2 || currentUser?.rol_id === 5;
    // Determinar si es admin
    const esAdmin = currentUser?.rol_id === 1;

    // Filtrar diagnósticos: docente solo ve los de su programa
    // NOTA: Esta lógica DEBERÍA hacerse en el backend, pero la agregamos aquí como respaldo
    const diagnosticosFiltrados = diagnosticos.filter(d => {
        if (esAdmin) return true; // Admin ve todo
        if (esDocente) {
            // Docente solo ve diagnósticos de su programa
            // El programa_id se obtiene del diagnóstico (d.programa_id)
            // Y se compara con el programa del docente (currentUser.programa_id)
            const programaDocente = currentUser?.programa_id;
            if (!programaDocente) return false;
            return d.programa_id === programaDocente;
        }
        return true; // Otros roles ven lo que reciben
    });

    const getBadgeRevision = (estado?: string) => {
        if (!estado || estado === 'pendiente_revision') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
                    Pendiente
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                Revisado
            </span>
        );
    };

    // Verificar si puede crear recomendación (solo para diagnósticos pendientes)
    const puedeCrearRecomendacion = (diagnostico: DiagnosticoItem) => {
        if (!onCrearRecomendacion) return false;
        const pendiente = !diagnostico.estado_revision || diagnostico.estado_revision === 'pendiente_revision';
        // Solo docentes y admin pueden crear recomendaciones
        const puede = (esAdmin || esDocente);
        return puede && pendiente;
    };

    if (diagnosticosFiltrados.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="text-center py-8 text-gray-400">
                    <i className="fas fa-microscope text-3xl mb-2 block"></i>
                    <p>No hay diagnósticos disponibles</p>
                    {esDocente && (
                        <p className="text-xs text-gray-400 mt-1">
                            Los diagnósticos de estudiantes aparecerán aquí para su revisión
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo / Subtipo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programa</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monitoreo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lote</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revisión</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                        {diagnosticosFiltrados.map((d) => {
                            const pendiente = !d.estado_revision || d.estado_revision === 'pendiente_revision';
                            return (
                                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-sm">
                                        <div className="font-medium text-gray-900">
                                            {d.tipo_diagnostico?.replace(/_/g, ' ') || d.tipo?.replace(/_/g, ' ') || '—'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {d.programa_nombre || 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {d.tipo_monitoreo_nombre || 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="font-medium">{d.lote_nombre || `Lote ${d.lote_id}`}</div>
                                        <div className="text-xs text-gray-500">{d.granja_nombre}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {d.usuario_nombre || 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {new Date(d.fecha_creacion).toLocaleDateString('es-CO')}
                                    </td>
                                    <td className="px-4 py-3">
                                        {getBadgeRevision(d.estado_revision)}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex gap-2 flex-wrap items-center">
                                            <button onClick={() => onVerDetalles(d)} className="text-blue-600 hover:text-blue-800" title="Ver detalles">
                                                👁
                                            </button>
                                            {(esAdmin || (esDocente && d.usuario_id !== currentUser?.id)) && (
                                                <button onClick={() => onEditar(d)} className="text-yellow-600 hover:text-yellow-800" title="Editar">
                                                    ✏️
                                                </button>
                                            )}
                                            {esAdmin && (
                                                <button onClick={() => onEliminar(d.id)} className="text-red-600 hover:text-red-800" title="Eliminar">
                                                    🗑
                                                </button>
                                            )}
                                            {puedeCrearRecomendacion(d) && (
                                                <button
                                                    onClick={() => onCrearRecomendacion && onCrearRecomendacion(d)}
                                                    className="text-xs font-semibold border border-orange-300 rounded px-2 py-0.5 bg-orange-50 hover:bg-orange-100 text-orange-700 hover:text-orange-900 transition-colors"
                                                    title="Crear recomendación para este diagnóstico"
                                                >
                                                    + Rec.
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {esDocente && (
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                    <i className="fas fa-info-circle mr-1"></i>
                    Mostrando diagnósticos del programa asociado a su cuenta
                </div>
            )}
        </div>
    );
};

export default DiagnosticosTable;