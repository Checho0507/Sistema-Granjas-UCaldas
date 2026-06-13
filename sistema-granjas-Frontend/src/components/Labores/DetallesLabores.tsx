// src/components/Labores/DetallesLaborModal/DetallesLaborModal.tsx
import React from 'react';
import type { Labor } from '../../types/laboresTypes';
import Modal from '../Common/Modal';
import { useLaborDetails } from './components/shared/useLaborDetail';
import LaborHeader from './components/laborHeader';
import LaborStateProgress from './components/laborStateProgress';
import LaborContextInfo from './components/laborContextInfo';
import LaborResourcesSummary from './components/laborResourcesSummary';
import LaborToolsDetail from './components/laborToolDetail';
import LaborSuppliesDetail from './components/laborSuppliesDetail';
import LaborEvidences from './components/laborEvidences';

interface DetallesLaborModalProps {
    isOpen: boolean;
    labor: Labor | null;
    onClose: () => void;
}

const DetallesLaborModal: React.FC<DetallesLaborModalProps> = ({
    isOpen,
    labor,
    onClose
}) => {
    // Los hooks DEBEN llamarse al inicio, antes de cualquier condición
    const {
        laborDetallada,
        evidencias,
        herramientasAsignadas,
        insumosAsignados,
        contextData,
        loading,
        calcularTotalesHerramientas,
        calcularTotalesInsumos,
        getMovimientosPorHerramienta,
        getMovimientosPorInsumo
    } = useLaborDetails(labor, isOpen);

    // Ahora sí podemos hacer la condición de retorno temprano
    if (!isOpen || !labor) return null;

    const data = laborDetallada || labor;
    const totalesHerramientas = calcularTotalesHerramientas();
    const totalesInsumos = calcularTotalesInsumos();

    return (
        <Modal isOpen={isOpen} onClose={onClose} width="max-w-6xl" showCloseButton={false}>
            <div className="p-6 max-h-[90vh] overflow-y-auto">
                <LaborHeader
                    data={data}
                    trabajadorInfo={contextData.trabajadorInfo}
                    loteInfo={contextData.loteInfo}
                    onClose={onClose}
                />

                {loading ? (
                    <div className="text-center py-8">
                        <i className="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
                        <p className="mt-2 text-gray-600">Cargando detalles de la labor...</p>
                    </div>
                ) : (
                    <>
                        {/* PRIMERA SECCIÓN: INFORMACIÓN GENERAL */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Columna 1: Estado y progreso */}
                            <div className="lg:col-span-2 space-y-4">
                                <LaborStateProgress data={data} />

                                {data.comentario && (
                                    <div className="bg-white border rounded-lg p-5 shadow-sm">
                                        <h3 className="font-bold text-lg mb-4 text-gray-800">
                                            <i className="fas fa-comment-alt mr-2 text-green-500"></i>
                                            Comentario
                                        </h3>
                                        <div className="bg-gray-50 rounded p-4">
                                            <p className="whitespace-pre-line text-gray-700">{data.comentario}</p>
                                        </div>
                                    </div>
                                )}

                                <LaborContextInfo contextData={contextData} data={data} />
                            </div>

                            {/* Columna 2: Resumen de recursos */}
                            <div className="space-y-4">
                                <LaborResourcesSummary
                                    herramientasAsignadas={herramientasAsignadas}
                                    insumosAsignados={insumosAsignados}
                                    totalesHerramientas={totalesHerramientas}
                                    totalesInsumos={totalesInsumos}
                                />
                            </div>
                        </div>

                        {/* SEGUNDA SECCIÓN: DETALLES DE RECURSOS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <LaborToolsDetail
                                herramientasAsignadas={herramientasAsignadas}
                                getMovimientosPorHerramienta={getMovimientosPorHerramienta}
                            />
                            <LaborSuppliesDetail
                                insumosAsignados={insumosAsignados}
                                getMovimientosPorInsumo={getMovimientosPorInsumo}
                            />
                        </div>

                        {/* TERCERA SECCIÓN: EVIDENCIAS */}
                        <LaborEvidences evidencias={evidencias} />

                        {/* BOTONES */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
                            >
                                Cerrar
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default DetallesLaborModal;