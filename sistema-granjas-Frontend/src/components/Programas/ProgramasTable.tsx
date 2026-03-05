import React from "react";
import { useNavigate } from "react-router-dom";
import type { Programa, Granja } from "../../types/granjaTypes";

interface ProgramasTableProps {
    programas: Programa[];
    onEditar: (programa: Programa) => void;
    onEliminar: (id: number) => void;
    onVerDetalles: (programa: Programa) => void;
    obtenerLabelTipo: (tipo: string) => string;
    obtenerIconoTipo: (tipo: string) => string;
    granjaId?: string; // 👈 NUEVO: Para navegación jerárquica
}

const ProgramasTable: React.FC<ProgramasTableProps> = ({
    programas,
    onEditar,
    onEliminar,
    onVerDetalles,
    obtenerLabelTipo,
    obtenerIconoTipo,
    granjaId, // 👈 NUEVO
}) => {
    const navigate = useNavigate();

    // Función para ver lotes del programa - AHORA USA LA RUTA JERÁRQUICA
    const verLotesPrograma = (e: React.MouseEvent, programaId: number) => {
        e.stopPropagation();
        
        if (granjaId) {
            // Ruta jerárquica completa: granja → programa → lotes
            navigate(`/granjas/${granjaId}/programas/${programaId}/lotes`);
        } else {
            // Fallback: si no hay granjaId, usar la ruta anterior
            navigate(`/programas/${programaId}/lotes`);
        }
    };

    // Función para obtener el color según el tipo
    const getTipoColor = (tipo: string) => {
        switch (tipo) {
            case 'agricola': return 'text-green-600 bg-green-50 border-green-200';
            case 'pecuario': return 'text-amber-600 bg-amber-50 border-amber-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    // Función para obtener el color del icono
    const getIconColor = (tipo: string) => {
        switch (tipo) {
            case 'agricola': return 'text-green-600';
            case 'pecuario': return 'text-amber-600';
            default: return 'text-gray-600';
        }
    };

    // Función para mostrar las granjas
    const renderGranjas = (granjas?: Granja[]) => {
        if (!granjas || granjas.length === 0) {
            return (
                <span className="text-gray-400 text-sm italic">
                    Sin granjas asignadas
                </span>
            );
        }

        const granjasVisibles = granjas.slice(0, 2);
        const restantes = granjas.length - 2;

        return (
            <div className="flex flex-wrap gap-1">
                {granjasVisibles.map((granja) => (
                    <span
                        key={granja.id}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                    >
                        <i className="fas fa-warehouse mr-1 text-xs"></i>
                        {granja.nombre}
                    </span>
                ))}
                {restantes > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                        +{restantes} más
                    </span>
                )}
            </div>
        );
    };

    if (programas.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <i className="fas fa-clipboard-list text-5xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 text-lg">No hay programas registrados</p>
                <p className="text-sm text-gray-400 mt-2">
                    Comienza creando un nuevo programa
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Programa
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipo
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Granjas Asignadas
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {programas.map((programa) => (
                            <tr 
                                key={programa.id} 
                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => onVerDetalles(programa)}
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    #{programa.id}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${getTipoColor(programa.tipo)} flex items-center justify-center mr-3`}>
                                            <i className={`${obtenerIconoTipo(programa.tipo)} ${getIconColor(programa.tipo)}`}></i>
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {programa.nombre}
                                            </div>
                                            <div className="text-sm text-gray-500 line-clamp-1">
                                                {programa.descripcion || "Sin descripción"}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTipoColor(programa.tipo)}`}>
                                        <i className={`${obtenerIconoTipo(programa.tipo)} mr-1 ${getIconColor(programa.tipo)}`}></i>
                                        {obtenerLabelTipo(programa.tipo)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {renderGranjas(programa.granjas)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        programa.activo 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        <i className={`fas fa-circle mr-1 text-xs ${
                                            programa.activo ? 'text-green-500' : 'text-red-500'
                                        }`}></i>
                                        {programa.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                                        {/* Botón: Ver Lotes - CON TOOLTIP MEJORADO */}
                                        <button
                                            onClick={(e) => verLotesPrograma(e, programa.id)}
                                            className="text-purple-600 hover:text-purple-900 p-2 hover:bg-purple-50 rounded transition-colors group relative"
                                            title="Ver lotes del programa"
                                        >
                                            <i className="fas fa-seedling"></i>
                                            {/* Tooltip mejorado */}
                                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                Ver lotes
                                            </span>
                                        </button>
                                        
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditar(programa);
                                            }}
                                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors group relative"
                                            title="Editar programa"
                                        >
                                            <i className="fas fa-edit"></i>
                                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                Editar
                                            </span>
                                        </button>
                                        
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEliminar(programa.id);
                                            }}
                                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors group relative"
                                            title="Eliminar programa"
                                        >
                                            <i className="fas fa-trash"></i>
                                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                Eliminar
                                            </span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer con estadísticas */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm text-gray-500">
                    <div>
                        Mostrando <span className="font-medium">{programas.length}</span> programas
                    </div>
                    <div className="flex space-x-4">
                        <span className="flex items-center">
                            <i className="fas fa-seedling text-green-600 mr-1"></i>
                            <span className="font-medium text-green-700">
                                {programas.filter(p => p.tipo === 'agricola').length}
                            </span>
                        </span>
                        <span className="flex items-center">
                            <i className="fas fa-paw text-amber-600 mr-1"></i>
                            <span className="font-medium text-amber-700">
                                {programas.filter(p => p.tipo === 'pecuario').length}
                            </span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgramasTable;