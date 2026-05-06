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
                        {diagnosticos.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-center py-8 text-gray-400">
                                    <i className="fas fa-microscope text-3xl mb-2 block"></i>
                                    No hay diagnósticos
                                </td>
                            </tr>
                        ) : (
                            diagnosticos.map((d) => {
                                const pendiente = !d.estado_revision || d.estado_revision === 'pendiente_revision';
                                return (
                                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                                        {/* Tipo */}
                                        <td className="px-4 py-3 text-sm">
                                            <div className="font-medium text-gray-900">{d.tipo_diagnostico?.replace(/_/g, ' ') || d.tipo?.replace(/_/g, ' ') || '—'}</div>
                                        </td>

                                        {/* Programa */}
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            {d.programa_nombre || 'N/A'}
                                        </td>

                                        {/* Monitoreo */}
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            {d.tipo_monitoreo_nombre || 'N/A'}
                                        </td>

                                        {/* Lote */}
                                        <td className="px-4 py-3 text-sm">
                                            <div className="font-medium">{d.lote_nombre || `Lote ${d.lote_id}`}</div>
                                            <div className="text-xs text-gray-500">{d.granja_nombre}</div>
                                        </td>

                                        {/* Usuario */}
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            {d.usuario_nombre || 'N/A'}
                                        </td>

                                        {/* Fecha */}
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            {new Date(d.fecha_creacion).toLocaleDateString('es-CO')}
                                        </td>

                                        {/* Revisión badge */}
                                        <td className="px-4 py-3">
                                            {getBadgeRevision(d.estado_revision)}
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex gap-2 flex-wrap items-center">
                                                <button onClick={() => onVerDetalles(d)} className="text-blue-600 hover:text-blue-800" title="Ver detalles">
                                                    👁
                                                </button>
                                                <button onClick={() => onEditar(d)} className="text-yellow-600 hover:text-yellow-800" title="Editar">
                                                    ✏️
                                                </button>
                                                <button onClick={() => onEliminar(d.id)} className="text-red-600 hover:text-red-800" title="Eliminar">
                                                    🗑
                                                </button>

                                                {/* Solo mostrar si está pendiente de revisión */}
                                                {onCrearRecomendacion && pendiente && (
                                                    <button
                                                        onClick={() => onCrearRecomendacion(d)}
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
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DiagnosticosTable;
