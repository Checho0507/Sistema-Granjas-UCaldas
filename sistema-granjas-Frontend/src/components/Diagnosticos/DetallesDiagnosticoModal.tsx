import React, { useState, useEffect } from 'react';
import type { DiagnosticoDetalle } from '../../types/diagnosticoTypes';
import Modal from '../Common/Modal';
import diagnosticoService from '../../services/diagnosticoService';

interface DetallesDiagnosticoModalProps {
    isOpen: boolean;
    diagnostico: DiagnosticoDetalle | null;
    onClose: () => void;
}

const DetallesDiagnosticoModal: React.FC<DetallesDiagnosticoModalProps> = ({
    isOpen,
    diagnostico,
    onClose
}) => {
    const [loadingDetalles, setLoadingDetalles] = useState(false);
    const [diagnosticoDetallado, setDiagnosticoDetallado] = useState<DiagnosticoDetalle | null>(null);

    useEffect(() => {
        if (isOpen && diagnostico) {
            setDiagnosticoDetallado(null);
            cargarDetallesCompletos(diagnostico.id);
        }
    }, [isOpen, diagnostico]);

    const cargarDetallesCompletos = async (id: number) => {
        try {
            setLoadingDetalles(true);
            const detalles = await diagnosticoService.obtenerDiagnosticoPorId(id);
            setDiagnosticoDetallado(detalles);
        } catch (err) {
            console.error('Error cargando detalles:', err);
        } finally {
            setLoadingDetalles(false);
        }
    };

    if (!diagnostico) return null;

    const data = diagnosticoDetallado || diagnostico;
    const fotosSubidas = data.formulario?.fotos_subidas as Record<string, string[]> | undefined;

    // Función para formatear el nombre del campo (opcional, mejora visual)
    const formatFieldName = (key: string): string => {
        return key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} width="max-w-4xl">
            <div className="p-6 max-h-[90vh] overflow-y-auto">
                {/* HEADER */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            Diagnóstico #{data.id}
                        </h2>
                        <p className="text-gray-600 mt-1">
                            {data.tipo_diagnostico?.replace(/_/g, ' ')}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        ✖
                    </button>
                </div>

                {loadingDetalles ? (
                    <div className="text-center py-8">Cargando detalles...</div>
                ) : (
                    <>
                        {/* INFO GENERAL */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-4">
                                <div className="border rounded p-4">
                                    <h3 className="font-bold mb-2">Información</h3>
                                    <p><b>Tipo:</b> {data.tipo_diagnostico}</p>
                                    <p><b>Condiciones:</b> {data.condiciones_dia}</p>
                                    <p><b>Fecha:</b> {new Date(data.fecha_creacion).toLocaleString()}</p>
                                </div>
                                <div className="border rounded p-4">
                                    <h3 className="font-bold mb-2">Usuario</h3>
                                    <p>{data.usuario_nombre || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="border rounded p-4">
                                    <h3 className="font-bold mb-2">Ubicación</h3>
                                    <p><b>Programa:</b> {data.programa_nombre}</p>
                                    <p><b>Lote:</b> {data.lote_nombre}</p>
                                    <p><b>Granja:</b> {data.granja_nombre}</p>
                                </div>
                            </div>
                        </div>

                        {/* FORMULARIO */}
                        {data.formulario && (
                            <div className="mb-6">
                                <h3 className="font-bold mb-3">Formulario</h3>

                                {/* Plantas */}
                                {data.formulario.plantas && (
                                    <div className="mb-4">
                                        <h4 className="font-semibold">Plantas muestreadas</h4>
                                        <ul className="text-sm list-disc pl-5">
                                            {data.formulario.plantas.map((p: any, i: number) => (
                                                <li key={i}>{p.label}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Caracterización */}
                                {data.formulario.caracterizacion && (
                                    <div className="mb-4">
                                        <h4 className="font-semibold">Caracterización</h4>
                                        <div className="text-sm bg-gray-50 p-3 rounded max-h-60 overflow-y-auto">
                                            {Object.entries(data.formulario.caracterizacion).map(([k, v]) => (
                                                <div key={k} className="mb-1">
                                                    <b>{k}:</b> {v as string}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ✨ NUEVA SECCIÓN: Fotos subidas */}
                                {fotosSubidas && Object.keys(fotosSubidas).length > 0 && (
                                    <div className="mt-6">
                                        <h4 className="font-semibold mb-3">📸 Fotos subidas</h4>
                                        <div className="space-y-6">
                                            {Object.entries(fotosSubidas).map(([campo, urls]) => (
                                                <div key={campo}>
                                                    <p className="text-sm text-gray-600 mb-2 font-medium">
                                                        {formatFieldName(campo)}
                                                    </p>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                        {urls.map((url, idx) => (
                                                            <a
                                                                key={`${campo}-${idx}`}
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block border rounded-lg overflow-hidden hover:shadow-md transition"
                                                            >
                                                                <img
                                                                    src={url}
                                                                    alt={`${campo} - ${idx + 1}`}
                                                                    className="w-full h-32 object-cover"
                                                                    loading="lazy"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Error+al+cargar';
                                                                    }}
                                                                />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
};

export default DetallesDiagnosticoModal;