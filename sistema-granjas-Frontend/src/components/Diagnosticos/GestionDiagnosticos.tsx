import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import diagnosticoService from '../../services/diagnosticoService';
import usuarioService from '../../services/usuarioService';
import loteService from '../../services/loteService';
import type { DiagnosticoItem, DiagnosticoFiltros } from '../../types/diagnosticoTypes';
import Modal from '../Common/Modal';
import DiagnosticosTable from './DiagnosticosTable';
import DiagnosticoForm from './DiagnosticosForm';
import AsignarDocenteModal from './AsignarDocenteModal';
import AgregarEvidenciaModal from './AgregarEvidenciaModal';
import DetallesDiagnosticoModal from './DetallesDiagnosticoModal';
import CrearRecomendacionModal from './CrearRecomendacionModal';
import { useAuth } from '../../hooks/useAuth';
import cultivoService from '../../services/cultivoService';
import granjaService from '../../services/granjaService';
import exportService from '../../services/exportService';
import recomendacionService from '../../services/recomendacionService';

const GestionDiagnosticos: React.FC = () => {
    const { user } = useAuth();
    const [diagnosticos, setDiagnosticos] = useState<DiagnosticoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para modales
    const [showCrearModal, setShowCrearModal] = useState(false);
    const [showEditarModal, setShowEditarModal] = useState(false);
    const [showAsignarDocenteModal, setShowAsignarDocenteModal] = useState(false);
    const [showEvidenciaModal, setShowEvidenciaModal] = useState(false);
    const [showDetallesModal, setShowDetallesModal] = useState(false);
    const [showCerrarModal, setShowCerrarModal] = useState(false);
    const [showCrearRecomendacionModal, setShowCrearRecomendacionModal] = useState(false);
    const [diagnosticoParaRecomendacion, setDiagnosticoParaRecomendacion] = useState<DiagnosticoItem | null>(null);
    const [verificandoRecomendacion, setVerificandoRecomendacion] = useState<number | null>(null);

    const [selectedDiagnostico, setSelectedDiagnostico] = useState<DiagnosticoItem | null>(null);

    const [lotes, setLotes] = useState<any[]>([]);
    const [docentes, setDocentes] = useState<any[]>([]);
    const [estudiantes, setEstudiantes] = useState<any[]>([]);
    const [tiposDiagnostico, setTiposDiagnostico] = useState<string[]>([]);

    const [filtros, setFiltros] = useState<DiagnosticoFiltros>({});
    const [estadisticas, setEstadisticas] = useState<any>(null);
    // Estados específicos para exportación
    const [exporting, setExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');

    // Handler para exportar diagnósticos
    const handleExportDiagnosticos = async () => {
        if (exporting) return;
        setExporting(true);
        setExportMessage('Exportando diagnósticos...');

        try {
            const result = await exportService.exportarDiagnosticos();
            setExportMessage(`¡Exportación completada! (${result.filename})`);
            setTimeout(() => setExportMessage(''), 5000);
        } catch (error) {
            console.error('❌ Error exportando diagnósticos:', error);
            setExportMessage('Error al exportar.');
            setTimeout(() => setExportMessage(''), 5000);
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        cargarDatos();
        cargarEstadisticas();
    }, [filtros]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Cargando datos de diagnósticos...');

            // Cargar diagnosticos
            const data = await diagnosticoService.obtenerDiagnosticos(filtros);
            console.log('✅ Response de diagnosticos:', data);

            // Ajustar según la respuesta del backend
            // Si el backend retorna { items: [], total: X } usa data.items
            // Si retorna directamente el array, usa data
            const diagnosticosData = Array.isArray(data) ? data : (data?.items || data || []);
            console.log('✅ Diagnosticos procesados:', diagnosticosData);

            setDiagnosticos(diagnosticosData);

            if (lotes.length === 0) {
                try {
                    const lotesData = await loteService.obtenerLotes();
                    let lotesArray = Array.isArray(lotesData) ? lotesData : (lotesData?.items || []);

                    // Obtener nombres de granjas para cada lote
                    lotesArray = await Promise.all(
                        lotesArray.map(async (lote) => {
                            try {
                                if (lote.granja_id) {
                                    const granja = await granjaService.obtenerGranjaPorId(lote.granja_id);
                                    return {
                                        ...lote,
                                        granja_nombre: granja.nombre || 'Sin nombre'
                                    };
                                }
                                return {
                                    ...lote,
                                    granja_nombre: 'Sin granja'
                                };
                            } catch (error) {
                                console.error(`Error obteniendo granja ${lote.granja_id}:`, error);
                                return {
                                    ...lote,
                                    granja_nombre: 'Error al cargar'
                                };
                            }
                        })
                    );
                    console.log('Lotes cargados con nombres de granja:', lotesArray);
                    setLotes(lotesArray);
                } catch (loteError) {
                    console.error('Error cargando lotes:', loteError);
                    setLotes([]);
                }
            }

            // Cargar docentes y estudiantes
            if (docentes.length === 0 || estudiantes.length === 0) {
                try {
                    const usuarios = await usuarioService.obtenerUsuarios();
                    console.log('✅ Usuarios cargados:', usuarios);

                    const usuariosArray = Array.isArray(usuarios) ? usuarios : (usuarios?.items || []);
                    console.log('✅ Usuarios procesados:', usuariosArray);
                    setDocentes(usuariosArray.filter((u: any) => u.rol_id === 2 || u.rol_id === 5));
                    setEstudiantes(usuariosArray.filter((u: any) => u.rol_id === 4));
                } catch (userError) {
                    console.error('❌ Error cargando usuarios:', userError);
                    setDocentes([]);
                    setEstudiantes([]);
                }
            }

            // Cargar tipos de diagnóstico
            if (tiposDiagnostico.length === 0) {
                try {
                    const tipos = await diagnosticoService.obtenerTiposDiagnostico();
                    console.log('✅ Tipos de diagnóstico cargados:', tipos);
                    setTiposDiagnostico(Array.isArray(tipos) ? tipos : []);
                } catch (tipoError) {
                    console.error('❌ Error cargando tipos:', tipoError);
                    setTiposDiagnostico([]);
                }
            }

        } catch (err: any) {
            console.error('❌ Error en cargarDatos:', err);
            setError(err.message || 'Error al cargar diagnósticos');
            toast.error(`Error al cargar datos: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const cargarEstadisticas = async () => {
        try {
            const stats = await diagnosticoService.obtenerEstadisticas();
            console.log('📊 Estadísticas cargadas:', stats);
            setEstadisticas(stats);
        } catch (err) {
            console.error('❌ Error cargando estadísticas:', err);
        }
    };

    // CRUD HANDLERS ----------------------------------------------------

    const handleCrearDiagnostico = async (data: any) => {
        try {
            console.log('📝 Creando diagnóstico con datos:', data);

            // Si el usuario actual es estudiante, agregar su ID
            if (user?.rol_id === 4) {
                data.estudiante_id = user.id;
            }

            // Si el usuario es docente/admin y no especifica docente, asignarse a sí mismo
            if ((user?.rol_id === 1 || user?.rol_id === 2 || user?.rol_id === 5) && !data.docente_id) {
                data.docente_id = user.id;
            }

            const nuevo = await diagnosticoService.crearDiagnostico(data, user);
            console.log('✅ Diagnóstico creado:', nuevo);

            setDiagnosticos(prev => [...prev, nuevo]);
            toast.success('Diagnóstico creado exitosamente');
            setShowCrearModal(false);
            cargarEstadisticas();
        } catch (err: any) {
            console.error('❌ Error al crear diagnóstico:', err);
            toast.error(`Error al crear diagnóstico: ${err.message}`);
        }
    };

    const handleActualizarDiagnostico = async (id: number, data: any) => {
        try {
            console.log('📝 Actualizando diagnóstico #', id, 'con datos:', data);

            // Preparar los datos para actualización
            const datosActualizacion = {
                tipo: data.tipo,
                descripcion: data.descripcion,
                observaciones: data.observaciones || null,
                evidencias: data.evidencias || [],
                estado: data.estado || 'abierto', // Asegurar que siempre tenga estado
                lote_id: data.lote_id,
                estudiante_id: data.estudiante_id,
                docente_id: data.docente_id || null // Si no hay docente, enviar null
            };

            // Filtrar solo los campos que han cambiado si lo necesitas
            const datosParaEnviar: any = {};

            // Solo incluir campos que no estén vacíos o hayan cambiado
            Object.keys(datosActualizacion).forEach(key => {
                const valor = datosActualizacion[key as keyof typeof datosActualizacion];
                if (valor !== undefined && valor !== null) {
                    datosParaEnviar[key] = valor;
                }
            });

            console.log('📤 Enviando datos de actualización:', datosParaEnviar);

            const actualizado = await diagnosticoService.actualizarDiagnostico(id, datosParaEnviar, user);

            console.log('✅ Diagnóstico actualizado:', actualizado);

            // Actualizar en la lista
            setDiagnosticos(prev => prev.map(d => d.id === id ? actualizado : d));

            toast.success(`Diagnóstico #${id} actualizado exitosamente`);
            setShowEditarModal(false);

        } catch (err: any) {
            console.error('❌ Error al actualizar diagnóstico:', err);
            toast.error(`Error al actualizar diagnóstico: ${err.message || 'Error desconocido'}`);
        }
    };

    const handleEliminarDiagnostico = async (id: number) => {
        if (!window.confirm("¿Estás seguro de eliminar este diagnóstico?")) return;

        try {
            console.log(`🗑️ Intentando eliminar diagnóstico #${id}`);

            await diagnosticoService.eliminarDiagnostico(id);

            console.log(`✅ Diagnóstico #${id} eliminado exitosamente`);

            // Actualizar estado local
            setDiagnosticos(prev => prev.filter(d => d.id !== id));

            // Mostrar toast de éxito
            toast.success("Diagnóstico eliminado exitosamente");

            // Recargar estadísticas
            cargarEstadisticas();

        } catch (err: any) {
            console.error('❌ Error al eliminar diagnóstico:', err);

            // Extraer mensaje de error de diferentes formas
            let errorMessage = 'Error al eliminar el diagnóstico';

            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            } else if (typeof err === 'string') {
                errorMessage = err;
            } else if (err.data?.message) {
                errorMessage = err.data.message;
            }
            console.log('Mensaje de error a mostrar:', errorMessage);

            // Mostrar toast de error
            toast.error(errorMessage);

            // También puedes mostrar un alert temporal si el toast no funciona
            // alert(`Error: ${errorMessage}`);
        }
    };

    const handleAsignarDocente = async (diagnosticoId: number, docenteId: number) => {
        try {
            const actualizado = await diagnosticoService.asignarDocente(diagnosticoId, docenteId);
            setDiagnosticos(prev => prev.map(d => d.id === diagnosticoId ? actualizado : d));
            toast.success('Docente asignado exitosamente');
            setShowAsignarDocenteModal(false);
        } catch (err: any) {
            toast.error(`Error al asignar docente: ${err.message}`);
        }
    };

    const handleCerrarDiagnostico = async (id: number) => {
        try {
            // Preguntar observaciones si es necesario
            const observaciones = prompt("Ingrese observaciones para el cierre (opcional):");

            const cerrado = await diagnosticoService.cerrarDiagnostico(id, observaciones || '');
            setDiagnosticos(prev => prev.map(d => d.id === id ? cerrado : d));
            toast.success('Diagnóstico cerrado exitosamente');
            setShowCerrarModal(false);
            cargarEstadisticas();
        } catch (err: any) {
            toast.error(`Error al cerrar diagnóstico: ${err.message}`);
        }
    };

    const handleAgregarEvidencia = async (file: File, descripcion: string, tipo: string) => {
        if (!selectedDiagnostico) {
            toast.error('No hay diagnóstico seleccionado');
            return;
        }

        try {
            await diagnosticoService.agregarEvidencia(selectedDiagnostico.id, file, descripcion, tipo, user);
            toast.success('Evidencia agregada exitosamente');
            setShowEvidenciaModal(false);

            // Recargar el diagnóstico para actualizar evidencias
            const actualizado = await diagnosticoService.obtenerDiagnosticoPorId(selectedDiagnostico.id);
            setDiagnosticos(prev => prev.map(d => d.id === selectedDiagnostico.id ? actualizado : d));

        } catch (err: any) {
            console.error('❌ Error al agregar evidencia:', err);
            toast.error(`Error al agregar evidencia: ${err.message}`);
        }
    };

    // OPEN MODAL HANDLERS ----------------------------------------------

    const openEditarModal = (diagnostico: DiagnosticoItem) => {
        setSelectedDiagnostico(diagnostico);
        setShowEditarModal(true);
    };

    const openAsignarDocenteModal = (diagnostico: DiagnosticoItem) => {
        setSelectedDiagnostico(diagnostico);
        setShowAsignarDocenteModal(true);
    };

    const openEvidenciaModal = (diagnostico: DiagnosticoItem) => {
        setSelectedDiagnostico(diagnostico);
        setShowEvidenciaModal(true);
    };

    const openDetallesModal = (diagnostico: DiagnosticoItem) => {
        setSelectedDiagnostico(diagnostico);
        setShowDetallesModal(true);
    };

    const openCerrarModal = (diagnostico: DiagnosticoItem) => {
        setSelectedDiagnostico(diagnostico);
        setShowCerrarModal(true);
    };

    const openCrearRecomendacionModal = async (diagnostico: DiagnosticoItem) => {
        setVerificandoRecomendacion(diagnostico.id);
        try {
            const resultado = await recomendacionService.verificarRecomendacionDiagnostico(diagnostico.id);
            if (resultado.tiene_recomendacion) {
                toast.error(`Este diagnóstico ya tiene una recomendación: "${resultado.recomendacion_titulo}" (${resultado.recomendacion_estado})`);
                return;
            }
            setDiagnosticoParaRecomendacion(diagnostico);
            setShowCrearRecomendacionModal(true);
        } catch {
            setDiagnosticoParaRecomendacion(diagnostico);
            setShowCrearRecomendacionModal(true);
        } finally {
            setVerificandoRecomendacion(null);
        }
    };

    // FILTRO POR ROL ---------------------------------------------------

    const diagnosticosFiltrados = Array.isArray(diagnosticos) ? diagnosticos.filter(d => {
        if (!user) return false;

        // Admin ve todo
        if (user.rol_id === 1) return true;

        // Docente/Asesor ve los que le asignaron o creó
        if (user.rol_id === 2 || user.rol_id === 5) {
            return d.docente_id === user.id || d.estudiante_id === user.id;
        }

        // Estudiante ve solo los que creó
        if (user.rol_id === 4) {
            return d.estudiante_id === user.id;
        }

        return false;
    }) : [];

    console.log('👤 Usuario:', user);
    console.log('📋 Diagnosticos totales:', diagnosticos.length);
    console.log('🔍 Diagnosticos filtrados:', diagnosticosFiltrados);

    // RENDER -----------------------------------------------------------

    return (
        <div className="p-6">

            {/* HEADER CON FILTROS */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Gestión de Diagnósticos</h1>
                    <div className="flex justify-between items-center mb-6">

                        <div className="flex items-center space-x-3 m-2">
                            {exportMessage && (
                                <span className={`text-sm px-3 py-1 rounded ${exportMessage.includes('Error')
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-green-100 text-green-600'
                                    }`}>
                                    {exportMessage}
                                </span>
                            )}

                            {(user && user.rol_id === 1) && (<button
                                onClick={handleExportDiagnosticos}
                                disabled={exporting}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 transition-colors"
                            >
                                <i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i>
                                <span>{exporting ? 'Exportando...' : 'Exportar a Excel'}</span>
                            </button>)}
                        </div>
                    </div>

                    <button
                        onClick={() => setShowCrearModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
                    >
                        <i className="fas fa-plus mr-2"></i>
                        Nuevo Diagnóstico
                    </button>
                </div>

                {/* Filtros */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h3 className="font-semibold mb-3">Filtros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <select
                            className="border rounded p-2"
                            value={filtros.estado || ''}
                            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value || undefined })}
                        >
                            <option value="">Todos los estados</option>
                            <option value="abierto">Abierto</option>
                            <option value="en_revision">En Revisión</option>
                            <option value="cerrado">Cerrado</option>
                        </select>

                        <select
                            className="border rounded p-2"
                            value={filtros.tipo || ''}
                            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value || undefined })}
                        >
                            <option value="">Todos los tipos</option>
                            {tiposDiagnostico.map(tipo => (
                                <option key={tipo} value={tipo}>{tipo}</option>
                            ))}
                        </select>

                        <select
                            className="border rounded p-2"
                            value={filtros.lote_id || ''}
                            onChange={(e) => setFiltros({ ...filtros, lote_id: e.target.value ? parseInt(e.target.value) : undefined })}
                        >
                            <option value="">Todos los lotes</option>
                            {Array.isArray(lotes) && lotes.map(lote => (
                                <option key={lote.id} value={lote.id}>
                                    {lote.nombre} ({lote.granja_nombre || 'Sin granja'})
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={() => setFiltros({})}
                            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* TABLA */}
            {loading ? (
                <div className="text-center py-8">
                    <i className="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
                    <p className="mt-2 text-gray-600">Cargando diagnósticos...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                    <p>Error: {error}</p>
                    <button
                        onClick={cargarDatos}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                    >
                        Reintentar
                    </button>
                </div>
            ) : (
                <DiagnosticosTable
                    diagnosticos={diagnosticosFiltrados}
                    onEditar={openEditarModal}
                    onEliminar={handleEliminarDiagnostico}
                    onAsignarDocente={openAsignarDocenteModal}
                    onAgregarEvidencia={openEvidenciaModal}
                    onVerDetalles={openDetallesModal}
                    onCerrar={openCerrarModal}
                    onCrearRecomendacion={openCrearRecomendacionModal}
                    verificandoRecomendacion={verificandoRecomendacion}
                    currentUser={user}
                />
            )}


            {/* MODAL CREAR */}
            <Modal isOpen={showCrearModal} onClose={() => setShowCrearModal(false)} width="max-w-2xl">
                <DiagnosticoForm
                    onSubmit={handleCrearDiagnostico}
                    onCancel={() => setShowCrearModal(false)}
                    lotes={lotes}
                    docentes={docentes} // Solo estudiantes ven docentes para asignar
                    estudiantes={estudiantes} // 👈 PASAR ESTUDIANTES
                    tipos={tiposDiagnostico}
                    estados={['abierto', 'en_revision', 'cerrado']}
                    currentUser={user}
                />
            </Modal>

            {/* MODAL EDITAR */}
            <Modal isOpen={showEditarModal} onClose={() => setShowEditarModal(false)} width="max-w-2xl">
                {selectedDiagnostico && (
                    <DiagnosticoForm
                        diagnostico={selectedDiagnostico}
                        onSubmit={(data) => handleActualizarDiagnostico(selectedDiagnostico.id, data)}
                        onCancel={() => setShowEditarModal(false)}
                        lotes={lotes}
                        docentes={docentes}
                        estudiantes={estudiantes} // 👈 PASAR ESTUDIANTES
                        tipos={tiposDiagnostico}
                        currentUser={user}
                        esEdicion={true}
                    />
                )}
            </Modal>

            {/* MODAL ASIGNAR DOCENTE */}
            {showAsignarDocenteModal && selectedDiagnostico && (
                <AsignarDocenteModal
                    isOpen={showAsignarDocenteModal}
                    onClose={() => setShowAsignarDocenteModal(false)}
                    diagnostico={selectedDiagnostico}
                    docentes={docentes}
                    onSubmit={(docenteId) => handleAsignarDocente(selectedDiagnostico.id, docenteId)}
                />
            )}

            {/* MODAL EVIDENCIA */}
            {showEvidenciaModal && selectedDiagnostico && (
                <AgregarEvidenciaModal
                    isOpen={showEvidenciaModal}
                    onClose={() => setShowEvidenciaModal(false)}
                    diagnostico={selectedDiagnostico}
                    onSubmit={handleAgregarEvidencia}
                />
            )}

            {/* MODAL DETALLES */}
            {showDetallesModal && selectedDiagnostico && (
                <DetallesDiagnosticoModal
                    isOpen={showDetallesModal}
                    onClose={() => setShowDetallesModal(false)}
                    diagnostico={selectedDiagnostico}
                />
            )}

            {/* MODAL CERRAR */}
            <Modal isOpen={showCerrarModal} onClose={() => setShowCerrarModal(false)}>
                {selectedDiagnostico && (
                    <div className="p-6">
                        <h2 className="text-xl font-bold mb-4">Cerrar Diagnóstico</h2>
                        <p className="mb-6">¿Estás seguro de cerrar el diagnóstico "{selectedDiagnostico.tipo}"?</p>

                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 border rounded hover:bg-gray-50"
                                onClick={() => setShowCerrarModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                                onClick={() => handleCerrarDiagnostico(selectedDiagnostico.id)}
                            >
                                Cerrar Diagnóstico
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* MODAL CREAR RECOMENDACIÓN DESDE DIAGNÓSTICO */}
            <Modal isOpen={showCrearRecomendacionModal} onClose={() => { setShowCrearRecomendacionModal(false); setDiagnosticoParaRecomendacion(null); }} width="max-w-2xl">
                {diagnosticoParaRecomendacion && (
                    <CrearRecomendacionModal
                        diagnostico={diagnosticoParaRecomendacion}
                        onClose={() => { setShowCrearRecomendacionModal(false); setDiagnosticoParaRecomendacion(null); }}
                        onCreada={(nueva) => {
                            setShowCrearRecomendacionModal(false);
                            setDiagnosticoParaRecomendacion(null);
                            toast.success(`Recomendación "${nueva.titulo}" creada y vinculada al diagnóstico`);
                        }}
                    />
                )}
            </Modal>

        </div>
    );
};

export default GestionDiagnosticos;