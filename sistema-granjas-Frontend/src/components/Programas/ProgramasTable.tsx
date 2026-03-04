import React from 'react';
import type { Programa } from '../../types/granjaTypes';

interface ProgramasTableProps {
    programas: Programa[];
    onEditar: (programa: Programa) => void;
    onEliminar: (id: number) => void;
    onVerDetalles: (programa: Programa) => void;
    obtenerLabelTipo?: (tipo: string) => string;
    obtenerIconoTipo?: (tipo: string) => string;
}

const ProgramasTable: React.FC<ProgramasTableProps> = ({
    programas,
    onEditar,
    onEliminar,
    onVerDetalles,
    obtenerLabelTipo = (tipo) => tipo,
    obtenerIconoTipo = () => "fas fa-question"
}) => {
    const getTipoBadgeColor = (tipo: string) => {
        switch (tipo) {
            case 'agricola': return 'bg-green-100 text-green-800 border border-green-200';
            case 'pecuario': return 'bg-amber-100 text-amber-800 border border-amber-200';
            default: return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    const getIconColor = (tipo: string) => {
        switch (tipo) {
            case 'agricola': return 'text-green-600';
            case 'pecuario': return 'text-amber-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {programas.map((programa) => (
                            <tr key={programa.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{programa.nombre}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {programa.tipo && (
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTipoBadgeColor(programa.tipo)}`}>
                                            <i className={`${obtenerIconoTipo(programa.tipo)} mr-2 ${getIconColor(programa.tipo)}`}></i>
                                            {obtenerLabelTipo(programa.tipo)}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                    {programa.descripcion || <span className="text-gray-400 italic">Sin descripción</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${programa.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {programa.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-3">
                                        <button onClick={() => onVerDetalles(programa)} className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded" title="Ver Detalles">
                                            <i className="fas fa-eye"></i>
                                        </button>
                                        <button onClick={() => onEditar(programa)} className="text-green-600 hover:text-green-900 p-1.5 hover:bg-green-50 rounded" title="Editar">
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button onClick={() => onEliminar(programa.id)} className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded" title="Eliminar">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {programas.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <i className="fas fa-clipboard-list text-5xl mb-4 text-gray-300"></i>
                        <p className="font-medium text-lg mb-2">No hay programas registrados</p>
                        <p className="text-sm text-gray-400">Crea tu primer programa para comenzar</p>
                    </div>
                )}
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">Mostrando <span className="font-medium">{programas.length}</span> programas</div>
                    <div className="flex space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                            <i className="fas fa-seedling text-green-600 mr-1"></i>
                            <span className="font-medium text-green-700">{programas.filter(p => p.tipo === 'agricola').length}</span>
                        </span>
                        <span className="flex items-center">
                            <i className="fas fa-paw text-amber-600 mr-1"></i>
                            <span className="font-medium text-amber-700">{programas.filter(p => p.tipo === 'pecuario').length}</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgramasTable;