// src/components/Recomendaciones/GestionRecomendaciones.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import recomendacionService from '../../services/recomendacionService';
import usuarioService from '../../services/usuarioService';
import loteService from '../../services/loteService';
import type { Recomendacion, RecomendacionFilters } from '../../types/recomendacionTypes';
import Modal from '../Common/Modal';
import RecomendacionesTable from './RecomendacionesTable';
import RecomendacionForm from './RecomendacionesForm';
import DetallesRecomendacionModal from './DetallesRecomendaciones';
import EstadisticasModal from './Estadisticas';
import AprobarRecomendacionModal from './AprobarRecomendacion';
import { useAuth } from '../../hooks/useAuth';
import granjaService from '../../services/granjaService';
import exportService from '../../services/exportService';

const GestionRecomendaciones: React.FC = () => {
    const { user } = useAuth();
    const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para modales
    const [showCrearModal, setShowCrearModal] = useState(false);
    const [showEditarModal, setShowEditarModal] = useState(false);
    const [showDetallesModal, setShowDetallesModal] = useState(false);
    const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
    const [showAprobarModal, setShowAprobarModal] = useState(false);

    const [selectedRecomendacion, setSelectedRecomendacion] = useState<Recomendacion | null>(null);
    const [recomendacionAAprobarId, setRecomendacionAAprobarId] = useState<number | null>(null);
    const [recomendacionAAprobarTitulo, setRecomendacionAAprobarTitulo] = useState<string>('');
    const [lotes, setLotes] = useState<any[]>([]);
    const [docentes, setDocentes] = useState<any[]>([]);
    const [filtros, setFiltros] = useState<RecomendacionFilters>({});
    // Estados específicos para exportación
    const [exporting, setExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');
    const rolesPermitidos = [1, 2, 5, 6]; // IDs de roles permitidos para crear recomendaciones

    // Handler para exportar recomendaciones
    const handleExportRecomendaciones = async () => {
        if (exporting) return;
        setExporting(true);
        setExportMessage('Exportando recomendaciones...');

        try {
            const result = await exportService.exportarRecomendaciones();
            setExportMessage(`¡Exportación completada! (${result.filename})`);
            setTimeout(() => setExportMessage(''), 5000);
        } catch (error) {
            console.error('❌ Error exportando recomendaciones:', error);
            setExportMessage('Error al exportar.');
            setTimeout(() => setExportMessage(''), 5000);
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [filtros]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError(null);

            // Cargar recomendaciones
            const data = await recomendacionService.obtenerRecomendaciones(filtros);
            const recomendacionesData = Array.isArray(data) ? data : (data?.items || data || []);
            setRecomendaciones(recomendacionesData);

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

            // Cargar docentes
            if (docentes.length === 0) {
                try {
                    const usuarios = await usuarioService.obtenerUsuarios();
                    const usuariosArray = Array.isArray(usuarios) ? usuarios : (usuarios?.items || []);
                    const docentesData = usuariosArray.filter((u: any) => u.rol_id === 2 || u.rol_id === 5);
                    setDocentes(docentesData);
                } catch (userError) {
                    console.error('Error cargando docentes:', userError);
                    setDocentes([]);
                }
            }

        } catch (err: any) {
            console.error('Error en cargarDatos:', err);
            setError(err.message || 'Error al cargar recomendaciones');
            toast.error(`Error al cargar datos: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // CRUD HANDLERS ----------------------------------------------------
    const handleCrearRecomendacion = async (data: any) => {
        try {
            const nueva = await recomendacionService.crearRecomendacion(data, user);
            setRecomendaciones(prev => [...prev, nueva]);
            toast.success('Recomendación creada exitosamente');
            setShowCrearModal(false);
        } catch (err: any) {
            console.error('Error al crear recomendación:', err);
            toast.error(`Error al crear recomendación: ${err.message}`);
        }
    };

    const handleActualizarRecomendacion = async (id: number, data: any) => {
        try {
            const actualizado = await recomendacionService.actualizarRecomendacion(id, data, user);
            setRecomendaciones(prev => prev.map(r => r.id === id ? actualizado : r));
            toast.success(`Recomendación #${id} actualizada exitosamente`);
            setShowEditarModal(false);
        } catch (err: any) {
            console.error('Error al actualizar recomendación:', err);
            toast.error(`Error al actualizar recomendación: ${err.message || 'Error desconocido'}`);
        }
    };

    const handleEliminarRecomendacion = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar esta recomendación?")) return;

        try {
            await recomendacionService.eliminarRecomendacion(id);
            setRecomendaciones(prev => prev.filter(r => r.id !== id));
            toast.success("Recomendación eliminada exitosamente");
        } catch (err: any) {
            toast.error(`Error al eliminar: ${err.message}`);
        }
    };

    const handleAprobarRecomendacion = async (observaciones: string = '') => {
        console.log('🔄 handleAprobarRecomendacion llamado');
        console.log('📊 recomendacionAAprobarId:', recomendacionAAprobarId);

        if (!recomendacionAAprobarId) {
            console.error('❌ recomendacionAAprobarId es null/undefined');
            return;
        }

        try {
            console.log(`📤 Aprobando recomendación ID: ${recomendacionAAprobarId}`);
            const aprobada = await recomendacionService.aprobarRecomendacion(
                recomendacionAAprobarId,
                observaciones
            );
            setRecomendaciones(prev => prev.map(r =>
                r.id === recomendacionAAprobarId ? aprobada : r
            ));
            toast.success('Recomendación aprobada exitosamente');
            setShowAprobarModal(false);
            setRecomendacionAAprobarId(null);
            setRecomendacionAAprobarTitulo('');
        } catch (err: any) {
            console.error('Error al aprobar recomendación:', err);
            toast.error(`Error al aprobar recomendación: ${err.message}`);
        }
    };

    // OPEN MODAL HANDLERS ----------------------------------------------
    const openEditarModal = (recomendacion: Recomendacion) => {
        setSelectedRecomendacion(recomendacion);
        setShowEditarModal(true);
    };

    const openDetallesModal = (recomendacion: Recomendacion) => {
        setSelectedRecomendacion(recomendacion);
        setShowDetallesModal(true);
    };

    const openAprobarModal = (recomendacion: Recomendacion) => {
        setRecomendacionAAprobarId(recomendacion.id);
        setRecomendacionAAprobarTitulo(recomendacion.titulo || `Recomendación #${recomendacion.id}`);
        setShowAprobarModal(true);
    };

    // FILTRO POR ROL ---------------------------------------------------
    const recomendacionesFiltradas = Array.isArray(recomendaciones) ? recomendaciones.filter(r => {
        if (!user) return false;
        if (user.rol_id === 1) return true; // Admin ve todo
        if (user.rol_id === 2 || user.rol_id === 5) return r.docente_id === user.id; // Docente ve las que creó
        return true; // Estudiantes ven todas por ahora
    }) : [];
    console.log("Rol", user, rolesPermitidos.find(r => r === user?.rol_id));
    // RENDER -----------------------------------------------------------
    return (
        <div className="p-6">

            {/* HEADER CON FILTROS (igual que diagnósticos) */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-800">Gestión de Recomendaciones</h1>
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
                            onClick={handleExportRecomendaciones}
                            disabled={exporting}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 transition-colors"
                        >
                            <i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i>
                            <span>{exporting ? 'Exportando...' : 'Exportar a Excel'}</span>
                        </button>)}
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowEstadisticasModal(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
                        >
                            <i className="fas fa-chart-bar mr-2"></i>
                            Estadísticas
                        </button>

                        {(user && rolesPermitidos.includes(user.rol_id)) && (
                            <button
                                onClick={() => setShowCrearModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                            >
                                <i className="fas fa-plus mr-2"></i>
                                Nueva Recomendación
                            </button>)}
                    </div>
                </div>

                {/* Filtros (igual que en diagnósticos) */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h3 className="font-semibold mb-3">Filtros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <select
                            className="border rounded p-2"
                            value={filtros.estado || ''}
                            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value || undefined })}
                        >
                            <option value="">Todos los estados</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="aprobada">Aprobada</option>
                            <option value="rechazada">Rechazada</option>
                            <option value="en_ejecucion">En Ejecución</option>
                            <option value="completada">Completada</option>
                            <option value="cancelada">Cancelada</option>
                        </select>

                        <select
                            className="border rounded p-2"
                            value={filtros.tipo || ''}
                            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value || undefined })}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="riego">Riego</option>
                            <option value="fertilizacion">Fertilización</option>
                            <option value="poda">Poda</option>
                            <option value="cosecha">Cosecha</option>
                            <option value="proteccion">Protección</option>
                            <option value="otro">Otro</option>
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
                    <p className="mt-2 text-gray-600">Cargando recomendaciones...</p>
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
                <RecomendacionesTable
                    recomendaciones={recomendacionesFiltradas}
                    onEditar={openEditarModal}
                    onEliminar={handleEliminarRecomendacion}
                    onAprobar={openAprobarModal}
                    onVerDetalles={openDetallesModal}
                    currentUser={user}
                />
            )}

            {/* MODALES */}

            {/* MODAL CREAR */}
            <Modal isOpen={showCrearModal} onClose={() => setShowCrearModal(false)} width="max-w-2xl">
                <RecomendacionForm
                    onSubmit={handleCrearRecomendacion}
                    onCancel={() => setShowCrearModal(false)}
                    lotes={lotes}
                    docentes={docentes}
                    currentUser={user}
                />
            </Modal>

            {/* MODAL EDITAR */}
            <Modal isOpen={showEditarModal} onClose={() => setShowEditarModal(false)} width="max-w-2xl">
                {selectedRecomendacion && (
                    <RecomendacionForm
                        recomendacion={selectedRecomendacion}
                        onSubmit={(data) => handleActualizarRecomendacion(selectedRecomendacion.id, data)}
                        onCancel={() => setShowEditarModal(false)}
                        lotes={lotes}
                        docentes={docentes}
                        currentUser={user}
                        esEdicion={true}
                    />
                )}
            </Modal>

            {/* MODAL DETALLES */}
            {selectedRecomendacion && (
                <DetallesRecomendacionModal
                    isOpen={showDetallesModal}
                    onClose={() => {
                        setShowDetallesModal(false);
                        setSelectedRecomendacion(null);
                    }}
                    recomendacion={selectedRecomendacion}
                />
            )}

            {/* MODAL ESTADÍSTICAS */}
            <EstadisticasModal
                isOpen={showEstadisticasModal}
                onClose={() => setShowEstadisticasModal(false)}
            />

            {/* MODAL APROBAR */}
            {recomendacionAAprobarId && (
                <AprobarRecomendacionModal
                    isOpen={showAprobarModal}
                    onClose={() => {
                        setShowAprobarModal(false);
                        setRecomendacionAAprobarId(null);
                        setRecomendacionAAprobarTitulo('');
                    }}
                    onAprobar={handleAprobarRecomendacion}
                    tituloRecomendacion={recomendacionAAprobarTitulo}
                />
            )}

        </div>
    );
};

export default GestionRecomendaciones;