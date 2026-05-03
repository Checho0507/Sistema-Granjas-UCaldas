// src/components/Inventarios/MovimientosTab.tsx
import React, { useState, useEffect } from 'react';
import movimientoService from '../../services/movimientosService';

const MovimientosTab: React.FC = () => {
    const [movimientos, setMovimientos] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        cargarMovimientos();
    }, []);

    const cargarMovimientos = async () => {
        try {
            setCargando(true);
            setError(null);

            // Obtener ambos tipos de movimientos
            const data = await movimientoService.obtenerTodosLosMovimientos();

            // Combinar y formatear para la tabla
            const movimientosCombinados = [
                ...data.herramientas.map(mov => ({
                    ...mov,
                    tipo: 'herramienta',
                    nombre: mov.herramienta_nombre,
                    unidad: null
                })),
                ...data.insumos.map(mov => ({
                    ...mov,
                    tipo: 'insumo',
                    nombre: mov.insumo_nombre,
                    unidad: mov.unidad_medida
                }))
            ];

            // Ordenar por fecha más reciente
            movimientosCombinados.sort((a, b) =>
                new Date(b.fecha_movimiento).getTime() - new Date(a.fecha_movimiento).getTime()
            );

            setMovimientos(movimientosCombinados);
        } catch (error: any) {
            console.error('Error cargando movimientos:', error);
            setError(error.message || 'Error al cargar los movimientos');
        } finally {
            setCargando(false);
        }
    };

    const getTipoColor = (tipo: string) => {
        if (tipo === 'entrada') return 'bg-green-100 text-green-800';
        if (tipo === 'salida') return 'bg-red-100 text-red-800';
        return 'bg-gray-100 text-gray-800';
    };

    const getRecursoIcon = (tipo: string) => {
        return tipo === 'herramienta' ? 'fa-tools' : 'fa-flask';
    };

    if (cargando) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Cargando movimientos...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                    <i className="fas fa-exclamation-triangle text-red-500 mr-3"></i>
                    <div>
                        <p className="text-red-700 font-medium">Error al cargar movimientos</p>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipo
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Recurso
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cantidad
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Observaciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {movimientos.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    No hay movimientos registrados
                                </td>
                            </tr>
                        ) : (
                            movimientos.map((movimiento) => (
                                <tr key={`${movimiento.tipo}-${movimiento.id}`} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex flex-col space-y-1">
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTipoColor(movimiento.tipo_movimiento)}`}>
                                                <i className={`fas fa-${movimiento.tipo_movimiento === 'entrada' ? 'arrow-down' : 'arrow-up'} mr-1`}></i>
                                                {movimiento.tipo_movimiento}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                <i className={`fas ${getRecursoIcon(movimiento.tipo)} mr-1`}></i>
                                                {movimiento.tipo === 'herramienta' ? 'Herramienta' : 'Insumo'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-medium text-gray-900">
                                            {movimiento.nombre}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            ID: {movimiento.tipo === 'herramienta' ? movimiento.herramienta_id : movimiento.insumo_id}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className={`text-sm font-medium ${movimiento.tipo_movimiento === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                            {movimiento.tipo_movimiento === 'entrada' ? '+' : '-'}{movimiento.cantidad}
                                            {movimiento.unidad && ` ${movimiento.unidad}`}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {new Date(movimiento.fecha_movimiento).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(movimiento.fecha_movimiento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm text-gray-900">
                                            {movimiento.observaciones || 'Sin observaciones'}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                    Total: {movimientos.length} movimientos
                </div>
            </div>
        </div>
    );
};

export default MovimientosTab;