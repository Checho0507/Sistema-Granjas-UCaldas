// src/components/Lotes/CultivosMultiSelect.tsx
import React, { useState } from 'react';

interface Cultivo {
    id: number;
    nombre: string;
    tipo: string;
}

interface CultivosMultiSelectProps {
    cultivos: Cultivo[];
    selectedIds: number[];
    onChange: (selectedIds: number[]) => void;
    disabled?: boolean;
    cargando?: boolean;
    maxSelections?: number;
}

const CultivosMultiSelect: React.FC<CultivosMultiSelectProps> = ({
    cultivos,
    selectedIds,
    onChange,
    disabled = false,
    cargando = false,
    maxSelections
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const filteredCultivos = cultivos.filter(cultivo =>
        cultivo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cultivo.tipo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleCultivo = (cultivoId: number) => {
        if (selectedIds.includes(cultivoId)) {
            onChange(selectedIds.filter(id => id !== cultivoId));
        } else {
            if (maxSelections && selectedIds.length >= maxSelections) {
                return; // Límite alcanzado
            }
            onChange([...selectedIds, cultivoId]);
        }
    };

    const removeCultivo = (cultivoId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selectedIds.filter(id => id !== cultivoId));
    };

    const getCultivoNombre = (id: number) => {
        return cultivos.find(c => c.id === id)?.nombre || 'Desconocido';
    };

    const getCultivoTipo = (id: number) => {
        return cultivos.find(c => c.id === id)?.tipo || '';
    };

    if (cargando) {
        return (
            <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mr-2"></div>
                <span className="text-sm text-gray-600">Cargando cultivos...</span>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Cultivos seleccionados - chips */}
            {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {selectedIds.map(id => (
                        <span
                            key={id}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                getCultivoTipo(id) === 'agricola'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-amber-100 text-amber-800'
                            }`}
                        >
                            <i className={`fas ${
                                getCultivoTipo(id) === 'agricola' ? 'fa-seedling' : 'fa-paw'
                            } mr-2 text-xs`}></i>
                            {getCultivoNombre(id)}
                            <button
                                type="button"
                                onClick={(e) => removeCultivo(id, e)}
                                className="ml-2 text-gray-500 hover:text-red-600 focus:outline-none"
                                disabled={disabled}
                            >
                                <i className="fas fa-times text-xs"></i>
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Selector dropdown */}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={disabled || cultivos.length === 0}
                    className="w-full px-4 py-2 text-left border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed flex justify-between items-center"
                >
                    <span className="text-gray-700">
                        {cultivos.length === 0
                            ? 'No hay cultivos disponibles'
                            : 'Seleccionar cultivos...'}
                    </span>
                    <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-gray-400`}></i>
                </button>

                {isOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="sticky top-0 bg-white p-2 border-b">
                            <input
                                type="text"
                                placeholder="Buscar cultivo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        
                        {filteredCultivos.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                No se encontraron cultivos
                            </div>
                        ) : (
                            filteredCultivos.map(cultivo => (
                                <label
                                    key={cultivo.id}
                                    className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(cultivo.id)}
                                        onChange={() => toggleCultivo(cultivo.id)}
                                        className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                        disabled={
                                            disabled ||
                                            (maxSelections &&
                                                selectedIds.length >= maxSelections &&
                                                !selectedIds.includes(cultivo.id))
                                        }
                                    />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-gray-700">
                                            {cultivo.nombre}
                                        </span>
                                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                            cultivo.tipo === 'agricola'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {cultivo.tipo}
                                        </span>
                                    </div>
                                </label>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Contador y límite */}
            <div className="flex justify-between text-xs text-gray-500">
                <span>
                    {selectedIds.length} cultivo(s) seleccionado(s)
                </span>
                {maxSelections && (
                    <span>
                        Máximo: {maxSelections}
                    </span>
                )}
            </div>
        </div>
    );
};

export default CultivosMultiSelect;