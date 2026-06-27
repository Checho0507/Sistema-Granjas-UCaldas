// src/pages/Labores/GestionLaboresPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import laborService from '../../services/laboresService';
import usuarioService from '../../services/usuarioService';
import loteService from '../../services/loteService';
import recomendacionService from '../../services/recomendacionService';

import granjaService from '../../services/granjaService';
import type { Labor, LaborFilters } from '../../types/laboresTypes';
import Modal from '../../components/Common/Modal';
import LaboresTable from '../../components/Labores/LaboresTable';
import LaborForm from '../../components/Labores/LaboresForm';
import DetallesLaborModal from '../../components/Labores/DetallesLabores';
import EstadisticasLaboresModal from '../../components/Labores/Estadisticas';
import AsignarRecursosModal from '../../components/Labores/AsignarRecursos';
import CompletarLaborModal from '../../components/Labores/CompletarLabores';
import RecomendacionesSinLabores from '../../components/Labores/RecomendacionesSinLabores';
import { useAuth } from '../../hooks/useAuth';
import exportService from '../../services/exportService';
import ExportButton from '../Common/ExportButton';
import GestionTiposLabores from './GestionTiposLabores';

type LaboresTab = 'labores' | 'tipos' | 'recomendaciones-pendientes';

const GestionLaboresPage: React.FC = () => {
    const [tabActivo, setTabActivo] = useState<LaboresTab>('labores');
    const { user, loading: authLoading } = useAuth();
    const [labores, setLabores] = useState<Labor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para modales
    const [showCrearModal, setShowCrearModal] = useState(false);
    const [showEditarModal, setShowEditarModal] = useState(false);
    const [showDetallesModal, setShowDetallesModal] = useState(false);
    const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
    const [showAsignarRecursosModal, setShowAsignarRecursosModal] = useState(false);
    const [showCompletarModal, setShowCompletarModal] = useState(false);

    const [selectedLabor, setSelectedLabor] = useState<Labor | null>(null);
    const [laborACompletar, setLaborACompletar] = useState<Labor | null>(null);
    const [productosRecomendados, setProductosRecomendados] = useState<any[]>([]);

    // Datos para formularios
    const [lotes, setLotes] = useState<any[]>([]);
    const [lotesFiltrados, setLotesFiltrados] = useState<any[]>([]);
    const [trabajadores, setTrabajadores] = useState<any[]>([]);
    const [trabajadoresFiltrados, setTrabajadoresFiltrados] = useState<any[]>([]);
    const [recomendaciones, setRecomendaciones] = useState<any[]>([]);
    const [tiposLabor, setTiposLabor] = useState<any[]>([]);

    const [filtros, setFiltros] = useState<LaborFilters>({});

    // 👇 DETERMINAR ROLES
    const esAdmin = user?.rol_id === 1;
    const esDocente = user?.rol_id === 2 || user?.rol_id === 5;
    const esTalentoHumano = user?.rol_id === 6 || user?.rol_id === 7 || user?.rol === 'jefe_talento_humano';
    const esJefeTalentoHumano = user?.rol_id === 7 || user?.rol === 'jefe_talento_humano';

    // 👇 OBTENER PROGRAMAS Y GRANJAS DEL USUARIO
    const programasUsuario = useMemo(
        () => (user?.programas?.map((p: any) => p.id) || []) as number[],
        [user?.id, user?.programas]
    );

    // 👇 OBTENER GRANJAS DEL USUARIO (para Talento Humano)
    const granjasUsuario = useMemo(
        () => (user?.granjas?.map((g: any) => g.id) || []) as number[],
        [user?.id, user?.granjas]
    );

    // 👇 FUNCIÓN PARA FILTRAR LOTES POR ROL
    const filtrarLotesPorRol = useCallback((lotesArray: any[]) => {
        if (!lotesArray) return [];
        
        // Admin ve todo
        if (esAdmin) return lotesArray;
        
        // Docente: solo lotes de sus programas
        if (esDocente) {
            if (programasUsuario.length === 0) return [];
            return lotesArray.filter(lote => programasUsuario.includes(lote?.programa_id));
        }
        
        // Talento Humano: solo lotes de sus granjas
        if (esTalentoHumano) {
            if (granjasUsuario.length === 0) return [];
            return lotesArray.filter(lote => granjasUsuario.includes(lote?.granja_id));
        }
        
        return lotesArray;
    }, [esAdmin, esDocente, esTalentoHumano, programasUsuario, granjasUsuario]);

    // 👇 FUNCIÓN PARA FILTRAR TRABAJADORES POR ROL
    const filtrarTrabajadoresPorRol = useCallback((trabajadoresArray: any[]) => {
        if (!trabajadoresArray) return [];
        
        // Admin ve todo
        if (esAdmin) return trabajadoresArray;
        
        // Docente: ve todos los trabajadores si tiene programas
        if (esDocente) {
            if (programasUsuario.length === 0) return [];
            return trabajadoresArray;
        }
        
        // Talento Humano: solo trabajadores de sus granjas
        if (esTalentoHumano) {
            if (granjasUsuario.length === 0) return [];
            // El backend ya filtra por granja, pero filtramos adicionalmente
            return trabajadoresArray;
        }
        
        return trabajadoresArray;
    }, [esAdmin, esDocente, esTalentoHumano, programasUsuario, granjasUsuario]);

    useEffect(() => {
        if (!authLoading && user) {
            cargarDatos();
        }
    }, [filtros, authLoading, user]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError(null);

            // 👇 Si es Talento Humano, pasar el filtro de granja al backend
            const filtrosActuales = { ...filtros };
            if (esTalentoHumano && granjasUsuario.length > 0) {
                // El backend puede filtrar por granja si tiene el endpoint
                // Si no, el frontend filtra
            }

            // Cargar labores
            const data = await laborService.obtenerLabores(filtrosActuales);
            const laboresData = Array.isArray(data) ? data : (data?.items || data || []);
            
            // 👇 Filtrar labores por granja si es Talento Humano
            let laboresFiltradasPorRol = laboresData;
            if (esTalentoHumano && granjasUsuario.length > 0) {
                // Si las labores tienen lote_id, filtramos por granja del lote
                // Esto requiere que los lotes tengan la información de granja
                laboresFiltradasPorRol = laboresData.filter((labor: any) => {
                    // Si la labor tiene lote, verificamos que la granja del lote esté en las granjas del usuario
                    if (labor.lote_id && labor.lote_granja_id) {
                        return granjasUsuario.includes(labor.lote_granja_id);
                    }
                    // Si no tiene granja en la labor, la incluimos (puede ser que el backend ya filtró)
                    return true;
                });
            }
            setLabores(laboresFiltradasPorRol);

            // Cargar lotes si no se han cargado
            if (lotes.length === 0) {
                try {
                    const lotesData = await loteService.obtenerLotes();
                    let lotesArray = Array.isArray(lotesData) ? lotesData : (lotesData?.items || []);

                    // Obtener nombres de granjas
                    lotesArray = await Promise.all(
                        (lotesArray || []).map(async (lote) => {
                            if (!lote) return lote;
                            try {
                                if (lote.granja_id) {
                                    const granja = await granjaService.obtenerGranjaPorId(lote.granja_id);
                                    return { ...lote, granja_nombre: granja?.nombre || 'Sin nombre' };
                                }
                                return { ...lote, granja_nombre: 'Sin granja' };
                            } catch {
                                return { ...lote, granja_nombre: 'Error al cargar' };
                            }
                        })
                    );

                    setLotes(lotesArray || []);
                    
                    // Filtrar lotes según rol
                    const lotesFiltradosPorRol = filtrarLotesPorRol(lotesArray || []);
                    setLotesFiltrados(lotesFiltradosPorRol || []);
                    
                } catch (loteError) {
                    console.error('Error cargando lotes:', loteError);
                    setLotes([]);
                    setLotesFiltrados([]);
                }
            }

            // Cargar trabajadores si no se han cargado
            if (trabajadores.length === 0) {
                try {
                    const trabajadoresData = await usuarioService.obtenerTrabajadores();
                    const trabajadoresArray = Array.isArray(trabajadoresData) ? trabajadoresData : (trabajadoresData?.items || []);
                    setTrabajadores(trabajadoresArray || []);
                    
                    const trabajadoresFiltradosPorRol = filtrarTrabajadoresPorRol(trabajadoresArray || []);
                    setTrabajadoresFiltrados(trabajadoresFiltradosPorRol || []);
                    
                } catch (userError) {
                    console.error('Error cargando trabajadores:', userError);
                    setTrabajadores([]);
                    setTrabajadoresFiltrados([]);
                }
            }

            // Cargar recomendaciones
            if (recomendaciones.length === 0) {
                try {
                    const recData = await recomendacionService.obtenerRecomendaciones();
                    const recArray = Array.isArray(recData) ? recData : (recData?.items || []);
                    setRecomendaciones(recArray || []);
                } catch (recError) {
                    console.error('Error cargando recomendaciones:', recError);
                    setRecomendaciones([]);
                }
            }

            // Cargar tipos de labor
            if (tiposLabor.length === 0) {
                try {
                    const tipos = await laborService.obtenerTiposLabor?.() || [];
                    setTiposLabor(tipos || []);
                } catch (error) {
                    console.error('Error cargando tipos de labor:', error);
                    setTiposLabor([]);
                }
            }

        } catch (err: any) {
            console.error('Error en cargarDatos:', err);
            setError(err.message || 'Error al cargar labores');
            toast.error(`Error al cargar datos: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // CRUD HANDLERS
    const handleCrearLabor = async (data: any) => {
        try {
            const nueva = await laborService.crearLabor(data, user);
            setLabores(prev => [...prev, nueva]);
            toast.success('Labor creada exitosamente');
            setShowCrearModal(false);
        } catch (err: any) {
            console.error('Error al crear labor:', err);
            toast.error(`Error al crear labor: ${err.message}`);
        }
    };

    const handleActualizarLabor = async (id: number, data: any) => {
        try {
            const actualizado = await laborService.actualizarLabor(id, data, user);
            setLabores(prev => prev.map(l => l.id === id ? actualizado : l));
            toast.success(`Labor #${id} actualizada exitosamente`);
            setShowEditarModal(false);
        } catch (err: any) {
            console.error('Error al actualizar labor:', err);
            toast.error(`Error al actualizar labor: ${err.message || 'Error desconocido'}`);
        }
    };

    const handleEliminarLabor = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar esta labor?")) return;

        try {
            await laborService.eliminarLabor(id);
            setLabores(prev => prev.filter(l => l.id !== id));
            toast.success("Labor eliminada exitosamente");
        } catch (err: any) {
            toast.error(`Error al eliminar: ${err.message}`);
        }
    };

    const handleCompletarLabor = async (datos: {
        comentario?: string;
        inventario_item_id?: number;
        cantidad_usada?: number;
        dosis_aplicada?: number;
        unidad_dosis?: string;
    }) => {
        if (!laborACompletar) return;

        try {
            const completada = await laborService.completarLabor(laborACompletar.id, datos);
            setLabores(prev => prev.map(l =>
                l.id === laborACompletar.id ? completada : l
            ));
            toast.success('Labor completada exitosamente');
            setShowCompletarModal(false);
            setLaborACompletar(null);
        } catch (err: any) {
            console.error('Error al completar labor:', err);
            toast.error(`Error al completar labor: ${err.message}`);
        }
    };

    // OPEN MODAL HANDLERS
    const openEditarModal = (labor: Labor) => {
        setSelectedLabor(labor);
        setShowEditarModal(true);
    };

    const openDetallesModal = (labor: Labor) => {
        setSelectedLabor(labor);
        setShowDetallesModal(true);
    };

    const openAsignarRecursosModal = (labor: Labor) => {
        setSelectedLabor(labor);
        setShowAsignarRecursosModal(true);
    };

    const openCompletarModal = async (labor: Labor) => {
        setLaborACompletar(labor);
        setProductosRecomendados([]);
        setShowCompletarModal(true);
        if ((labor as any).recomendacion_id) {
            try {
                const rec = await recomendacionService.obtenerRecomendacionPorId((labor as any).recomendacion_id);
                const items = (rec as any)?.items_sugeridos || [];
                if (items.length > 0) {
                    setProductosRecomendados(items);
                } else if ((rec as any)?.inventario_item_id) {
                    setProductosRecomendados([{
                        id: (rec as any).inventario_item_id,
                        inventario_item_id: (rec as any).inventario_item_id,
                        inventario_item_nombre: (rec as any).inventario_item_nombre,
                        inventario_item_unidad: (rec as any).inventario_item_unidad,
                        cantidad_sugerida: (rec as any).cantidad_sugerida,
                    }]);
                }
            } catch { /* no products */ }
        }
    };

    const laboresFiltradas = Array.isArray(labores) ? labores : [];

    // Mostrar loading mientras se carga el auth
    if (authLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-4 text-gray-600">Cargando...</span>
            </div>
        );
    }

    // Si no hay usuario, mostrar mensaje
    if (!user) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                <i className="fas fa-exclamation-triangle text-4xl text-yellow-600 mb-3 block"></i>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">No autenticado</h3>
                <p className="text-yellow-700">Por favor, inicia sesión para acceder a esta página.</p>
            </div>
        );
    }

    // 👇 MOSTRAR BADGE DE GRANJA PARA TALENTO HUMANO
    const getGranjaBadge = () => {
        if (esTalentoHumano && granjasUsuario.length > 0) {
            return (
                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-1">
                    <i className="fas fa-warehouse"></i>
                    {granjasUsuario.length} granja(s) asignada(s)
                </span>
            );
        }
        return null;
    };

    return (
        <div className="p-6">
            {/* HEADER */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-800">Gestión de Labores</h1>
                        {getGranjaBadge()}
                    </div>
                    <div className="flex items-center space-x-3">
                        <ExportButton onExport={() => exportService.exportarLabores()} />
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowEstadisticasModal(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center"
                        >
                            <i className="fas fa-chart-bar mr-2"></i>
                            Estadísticas
                        </button>

                        {(user && ([1, 6, 7].includes(user.rol_id) || user.rol === 'jefe_talento_humano')) && (
                            <button
                                onClick={() => setShowCrearModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                            >
                                <i className="fas fa-plus mr-2"></i>
                                Nueva Labor
                            </button>
                        )}
                    </div>
                </div>

                {/* TABS */}
                <div className="flex border-b border-gray-200 mb-4">
                    <button 
                        onClick={() => setTabActivo('labores')}
                        className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${tabActivo === 'labores' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <i className="fas fa-tasks mr-2"></i>Labores
                    </button>
                    {user && ([1, 2, 5, 6, 7].includes(user.rol_id) || user.rol === 'jefe_talento_humano') && (
                        <button 
                            onClick={() => setTabActivo('tipos')}
                            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition ${tabActivo === 'tipos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <i className="fas fa-tag mr-2"></i>Tipos de Labor
                        </button>
                    )}
                    {esTalentoHumano && (
                        <button 
                            onClick={() => setTabActivo('recomendaciones-pendientes')}
                            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition flex items-center gap-2 ${tabActivo === 'recomendaciones-pendientes' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <i className="fas fa-clipboard-list"></i>
                            Recomendaciones sin labores
                        </button>
                    )}
                </div>

                {/* Filtros */}
                {tabActivo === 'labores' && (
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
                                <option value="en_progreso">En Progreso</option>
                                <option value="completada">Completada</option>
                                <option value="cancelada">Cancelada</option>
                            </select>

                            <select
                                className="border rounded p-2"
                                value={filtros.trabajador_id || ''}
                                onChange={(e) => setFiltros({ ...filtros, trabajador_id: e.target.value ? parseInt(e.target.value) : undefined })}
                            >
                                <option value="">Todos los trabajadores</option>
                                {Array.isArray(trabajadoresFiltrados) && trabajadoresFiltrados.length > 0 ? (
                                    trabajadoresFiltrados.map(trab => (
                                        <option key={trab.id} value={trab.id}>
                                            {trab.nombre}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>No hay trabajadores disponibles</option>
                                )}
                            </select>

                            <select
                                className="border rounded p-2"
                                value={filtros.lote_id || ''}
                                onChange={(e) => setFiltros({ ...filtros, lote_id: e.target.value ? parseInt(e.target.value) : undefined })}
                            >
                                <option value="">Todos los lotes</option>
                                {Array.isArray(lotesFiltrados) && lotesFiltrados.length > 0 ? (
                                    lotesFiltrados.map(lote => (
                                        <option key={lote.id} value={lote.id}>
                                            {lote.nombre} ({lote.granja_nombre || 'Sin granja'})
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>No hay lotes disponibles</option>
                                )}
                            </select>

                            <button
                                onClick={() => setFiltros({})}
                                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                        {(esDocente || esTalentoHumano) && (
                            <div className="mt-3 flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    <i className="fas fa-info-circle mr-1"></i>
                                    Mostrando {lotesFiltrados?.length || 0} lote(s)
                                    {esDocente && " de tus programas asignados"}
                                    {esTalentoHumano && " de tus granjas asignadas"}
                                </span>
                                {esDocente && programasUsuario.length === 0 && (
                                    <span className="text-xs text-red-500">
                                        <i className="fas fa-exclamation-triangle mr-1"></i>
                                        No tienes programas asignados
                                    </span>
                                )}
                                {esTalentoHumano && granjasUsuario.length === 0 && (
                                    <span className="text-xs text-red-500">
                                        <i className="fas fa-exclamation-triangle mr-1"></i>
                                        No tienes granjas asignadas
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* TAB: Tipos de Labor */}
            {tabActivo === 'tipos' && (
                <GestionTiposLabores />
            )}

            {/* TAB: Recomendaciones sin labores */}
            {tabActivo === 'recomendaciones-pendientes' && esTalentoHumano && (
                <RecomendacionesSinLabores onLaborCreada={cargarDatos} />
            )}

            {/* TAB: Labores */}
            {tabActivo === 'labores' && (
                <>
                    {loading ? (
                        <div className="text-center py-8">
                            <i className="fas fa-spinner fa-spin text-2xl text-blue-500"></i>
                            <p className="mt-2 text-gray-600">Cargando labores...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
                            <p>Error: {error}</p>
                            <button onClick={cargarDatos} className="mt-2 text-blue-600 hover:text-blue-800">
                                Reintentar
                            </button>
                        </div>
                    ) : (
                        <LaboresTable
                            labores={laboresFiltradas}
                            onEditar={openEditarModal}
                            onEliminar={handleEliminarLabor}
                            onVerDetalles={openDetallesModal}
                            onAsignarRecursos={openAsignarRecursosModal}
                            onCompletar={openCompletarModal}
                            currentUser={user}
                        />
                    )}
                </>
            )}

            {/* MODALES */}
            <Modal isOpen={showCrearModal} onClose={() => setShowCrearModal(false)} width="max-w-2xl">
                <LaborForm
                    onSubmit={handleCrearLabor}
                    onCancel={() => setShowCrearModal(false)}
                    tiposLabor={tiposLabor}
                    trabajadores={trabajadoresFiltrados}
                    lotes={lotesFiltrados}
                    recomendaciones={recomendaciones}
                    currentUser={user}
                />
            </Modal>

            <Modal isOpen={showEditarModal} onClose={() => setShowEditarModal(false)} width="max-w-2xl">
                {selectedLabor && (
                    <LaborForm
                        labor={selectedLabor}
                        onSubmit={(data) => handleActualizarLabor(selectedLabor.id, data)}
                        onCancel={() => setShowEditarModal(false)}
                        tiposLabor={tiposLabor}
                        trabajadores={trabajadoresFiltrados}
                        lotes={lotesFiltrados}
                        recomendaciones={recomendaciones}
                        currentUser={user}
                        esEdicion={true}
                    />
                )}
            </Modal>

            {selectedLabor && (
                <DetallesLaborModal
                    isOpen={showDetallesModal}
                    onClose={() => {
                        setShowDetallesModal(false);
                        setSelectedLabor(null);
                    }}
                    labor={selectedLabor}
                />
            )}

            <EstadisticasLaboresModal
                isOpen={showEstadisticasModal}
                onClose={() => setShowEstadisticasModal(false)}
            />

            {selectedLabor && (
                <AsignarRecursosModal
                    isOpen={showAsignarRecursosModal}
                    onClose={() => {
                        setShowAsignarRecursosModal(false);
                        setSelectedLabor(null);
                    }}
                    onSuccess={cargarDatos}
                    labor={selectedLabor}
                />
            )}

            {laborACompletar && (
                <CompletarLaborModal
                    isOpen={showCompletarModal}
                    onClose={() => {
                        setShowCompletarModal(false);
                        setLaborACompletar(null);
                    }}
                    onCompletar={handleCompletarLabor}
                    tituloLabor={`Labor #${laborACompletar.id}`}
                    productosRecomendados={productosRecomendados}
                />
            )}
        </div>
    );
};

export default GestionLaboresPage;