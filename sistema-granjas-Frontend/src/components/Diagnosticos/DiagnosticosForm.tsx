import React, { useState, useEffect, useMemo } from 'react';
import type { DiagnosticoItem } from '../../types/diagnosticoTypes';
import { monitoreoService, type Monitoreo } from '../../services/monitoreoService';
import { loteService, type EstructuraLote } from '../../services/loteService';
import { CensoSection } from './CensoSection';
import { FenologicoSection } from './FenologicoSection';
import { ArthropodSection } from './ArthropodSection';
import { EnfermedadesSection } from './EnfermedadesSection';
import { ArvensesSection } from './ArvensesSection';
import { ControladoresSection } from './ControladoresSection';
import { PolinizadoresSection } from './PolinizadoresSection';
import { toast } from 'react-toastify';

// ── Tipos locales ─────────────────────────────────────────────────────────────

interface PlantaBase {
    codigo: string;
    label: string;
    surco: number;
    planta: number;
}

interface Programa {
    id: number;
    nombre: string;
    tipo?: string;
    descripcion?: string;
    activo?: boolean;
}

interface Lote {
    id: number;
    nombre: string;
    granja_id?: number;
    granja_nombre?: string;
    programa_id: number;
    estado?: string;
    surcos?: number | null;
    plantas_por_surco?: number | null;
}

// DTO que se envía al backend
interface DiagnosticoPayload {
    programa_id: number;
    tipo_monitoreo_id: number;
    lote_id: number;
    usuario_id: number;
    tipo_diagnostico: string;
    condiciones_dia: string;
    formulario: Record<string, any>;
}

interface DiagnosticoFormProps {
    isOpen: boolean;
    diagnostico?: DiagnosticoItem;
    onSubmit: (data: DiagnosticoPayload) => Promise<void>;
    onCancel: () => void;
    lotes: Lote[];
    programas: Programa[];
    monitoreos?: Monitoreo[];
    condiciones_dia: string[];
    currentUser: any;
    esEdicion?: boolean;
    porcentajeMuestreo?: number; // Porcentaje de plantas a muestrear (default: 10)
}

// ── Tipos de diagnóstico disponibles ─────────────────────────────────────────

const TIPOS_DIAGNOSTICO = [
    { value: 'censo_poblacional', label: 'Censo Poblacional' },
    { value: 'monitoreo_fenologico', label: 'Monitoreo Fenológico' },
    { value: 'artropodos', label: 'Artrópodos' },
    { value: 'enfermedades', label: 'Enfermedades' },
    { value: 'arvenses', label: 'Arvenses' },
    { value: 'controladores_biologicos', label: 'Controladores Biológicos' },
    { value: 'polinizadores', label: 'Polinizadores' },
];

// ── Componente ────────────────────────────────────────────────────────────────

const DiagnosticoForm: React.FC<DiagnosticoFormProps> = ({
    isOpen,
    diagnostico,
    onSubmit,
    onCancel,
    lotes = [],
    programas = [],
    monitoreos: externalMonitoreos,
    condiciones_dia = ['Soleado', 'Nublado', 'Lluvia'],
    currentUser,
    esEdicion = false,
    porcentajeMuestreo = 10, // 10% por defecto
}) => {
    // ── Wizard ────────────────────────────────────────────────────────────────
    const [paso, setPaso] = useState(1);

    // ── Paso 1 (persistente) ──────────────────────────────────────────────────
    const [programaId, setProgramaId] = useState<number | null>(null);
    const [tipoMonitoreoId, setTipoMonitoreoId] = useState<number | null>(null);
    const [loteId, setLoteId] = useState<number | null>(null);
    const [monitoreos, setMonitoreos] = useState<Monitoreo[]>(externalMonitoreos || []);
    const [estructuraLote, setEstructuraLote] = useState<EstructuraLote | null>(null);
    const [cargandoEstructura, setCargandoEstructura] = useState(false);
    
    // ── Plantas seleccionadas para muestreo (persistentes mientras no cambie el lote) ──
    const [plantasSeleccionadas, setPlantasSeleccionadas] = useState<PlantaBase[]>([]);
    const [plantasOriginales, setPlantasOriginales] = useState<PlantaBase[]>([]);

    // ── Paso 2 (se limpia después de cada diagnóstico) ────────────────────────
    const [tipoDiagnostico, setTipoDiagnostico] = useState('');
    const [condicionesDia, setCondicionesDia] = useState('');
    const [caracterizacion, setCaracterizacion] = useState<Record<string, string>>({});
    const [enviando, setEnviando] = useState(false);

    // ── Función para seleccionar plantas al azar (porcentaje) ──────────────────
    const seleccionarPlantasAleatorias = useCallback((todasLasPlantas: PlantaBase[], porcentaje: number): PlantaBase[] => {
        if (!todasLasPlantas.length) return [];
        
        // Calcular cuántas plantas seleccionar (mínimo 1 si hay plantas)
        const cantidad = Math.max(1, Math.floor(todasLasPlantas.length * (porcentaje / 100)));
        
        // Crear una copia del array para no modificar el original
        const plantasCopia = [...todasLasPlantas];
        
        // Algoritmo de Fisher-Yates para mezclar
        for (let i = plantasCopia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [plantasCopia[i], plantasCopia[j]] = [plantasCopia[j], plantasCopia[i]];
        }
        
        // Tomar las primeras 'cantidad' plantas
        return plantasCopia.slice(0, cantidad);
    }, []);

    // ── Función para regenerar la selección de plantas (mismo porcentaje) ──────
    const regenerarSeleccionPlantas = useCallback(() => {
        if (plantasOriginales.length > 0) {
            const nuevasSeleccionadas = seleccionarPlantasAleatorias(plantasOriginales, porcentajeMuestreo);
            setPlantasSeleccionadas(nuevasSeleccionadas);
            
            // Limpiar caracterización anterior
            setCaracterizacion({});
            
            toast.info(
                `Se han seleccionado ${nuevasSeleccionadas.length} plantas al azar (${porcentajeMuestreo}% de ${plantasOriginales.length} totales)`,
                { duration: 3000, position: 'top-right' }
            );
        }
    }, [plantasOriginales, porcentajeMuestreo, seleccionarPlantasAleatorias]);

    // ── Cargar monitoreos al cambiar programa ─────────────────────────────────
    useEffect(() => {
        if (!programaId) {
            setMonitoreos([]);
            return;
        }
        monitoreoService
            .obtenerMonitoreosPorPrograma(programaId)
            .then(setMonitoreos)
            .catch(() => {
                setMonitoreos([]);
                toast.error('Error al cargar tipos de monitoreo');
            });
    }, [programaId]);

    // ── Cargar estructura del lote cuando cambia el lote ──────────────────────
    useEffect(() => {
        const cargarEstructuraLote = async () => {
            if (!loteId) {
                setEstructuraLote(null);
                setPlantasOriginales([]);
                setPlantasSeleccionadas([]);
                return;
            }

            setCargandoEstructura(true);
            try {
                const estructura = await loteService.obtenerEstructuraLote(loteId);
                setEstructuraLote(estructura);

                if (estructura.plantas && estructura.plantas.length > 0) {
                    setPlantasOriginales(estructura.plantas);
                    
                    // Seleccionar plantas al azar según el porcentaje
                    const seleccionadas = seleccionarPlantasAleatorias(estructura.plantas, porcentajeMuestreo);
                    setPlantasSeleccionadas(seleccionadas);
                    
                    toast.success(
                        `Lote cargado: ${estructura.total_plantas.toLocaleString('es-ES')} plantas totales. ` +
                        `Se han seleccionado ${seleccionadas.length} plantas para muestreo (${porcentajeMuestreo}%)`,
                        { duration: 4000, position: 'top-right' }
                    );
                } else {
                    toast.warning('Este lote no tiene surcos o plantas configurados', {
                        duration: 4000,
                        position: 'top-right'
                    });
                    setPlantasOriginales([]);
                    setPlantasSeleccionadas([]);
                }
            } catch (error) {
                console.error('Error cargando estructura del lote:', error);
                toast.error('Error al cargar la estructura del lote', {
                    duration: 4000,
                    position: 'top-right'
                });
                setPlantasOriginales([]);
                setPlantasSeleccionadas([]);
            } finally {
                setCargandoEstructura(false);
            }
        };

        cargarEstructuraLote();
    }, [loteId, porcentajeMuestreo, seleccionarPlantasAleatorias]);

    // ── Resetear paso 2 (limpiar formulario de diagnóstico) ───────────────────
    const resetearPaso2 = () => {
        setTipoDiagnostico('');
        setCondicionesDia('');
        setCaracterizacion({});
        setEnviando(false);
    };

    // ── Derivados ─────────────────────────────────────────────────────────────
    const lotesFiltrados = useMemo(
        () => (programaId ? lotes.filter(l => l.programa_id === programaId) : []),
        [lotes, programaId]
    );

    const programaSeleccionado = useMemo(() => programas.find(p => p.id === programaId) || null, [programas, programaId]);
    const loteSeleccionado = useMemo(() => lotesFiltrados.find(l => l.id === loteId) || null, [lotesFiltrados, loteId]);
    const monitoreoSeleccionado = useMemo(() => monitoreos.find(m => m.id === tipoMonitoreoId) || null, [monitoreos, tipoMonitoreoId]);

    // ── Cargar datos en modo edición ──────────────────────────────────────────
    useEffect(() => {
        if (!esEdicion || !diagnostico) return;
        setPaso(2);

        const d = diagnostico as any;
        if (d.programa_id) setProgramaId(d.programa_id);
        if (d.tipo_monitoreo_id) setTipoMonitoreoId(d.tipo_monitoreo_id);
        if (d.lote_id) setLoteId(d.lote_id);
        if (d.tipo_diagnostico) setTipoDiagnostico(d.tipo_diagnostico);
        if (d.condiciones_dia) setCondicionesDia(d.condiciones_dia);
        if (d.formulario?.plantas) {
            setPlantasSeleccionadas(d.formulario.plantas);
        }
        if (d.formulario?.caracterizacion) {
            setCaracterizacion(d.formulario.caracterizacion);
        }
    }, [esEdicion, diagnostico]);

    // ── Auto-selección de lote único ──────────────────────────────────────────
    useEffect(() => {
        if (!esEdicion && lotesFiltrados.length === 1 && !loteId && isOpen) {
            const l = lotesFiltrados[0];
            setLoteId(l.id);
            toast.info(`Lote seleccionado automáticamente: ${l.nombre}`);
        }
    }, [lotesFiltrados, esEdicion, loteId, isOpen]);

    const handleProgramaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value ? parseInt(e.target.value) : null;
        setProgramaId(id);
        setTipoMonitoreoId(null);
        setLoteId(null);
        setEstructuraLote(null);
        setPlantasOriginales([]);
        setPlantasSeleccionadas([]);
        resetearPaso2();
    };

    const handleLoteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value ? parseInt(e.target.value) : null;
        setLoteId(id);
        resetearPaso2();
    };

    const handleCaracterizacionChange = (campo: string, valor: string) => {
        setCaracterizacion(prev => ({ ...prev, [campo]: valor }));
    };

    // ── Validación y avance ───────────────────────────────────────────────────
    const handleSiguiente = () => {
        if (!programaId) {
            toast.warning('Selecciona un programa');
            return;
        }
        if (!tipoMonitoreoId) {
            toast.warning('Selecciona un tipo de monitoreo');
            return;
        }
        if (!loteId) {
            toast.warning('Selecciona un lote');
            return;
        }
        if (!lotesFiltrados.find(l => l.id === loteId)) {
            toast.error('El lote no pertenece al programa elegido');
            return;
        }

        if (!estructuraLote || estructuraLote.total_plantas === 0) {
            toast.error('Este lote no tiene surcos o plantas configurados. Por favor, configura el lote primero.', {
                duration: 5000,
                position: 'top-right'
            });
            return;
        }

        if (plantasSeleccionadas.length === 0) {
            toast.error('No hay plantas seleccionadas para el muestreo', {
                duration: 4000,
                position: 'top-right'
            });
            return;
        }

        setPaso(2);
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!tipoDiagnostico) {
            toast.error('Selecciona un tipo de diagnóstico');
            return;
        }
        if (!condicionesDia) {
            toast.error('Selecciona las condiciones del día');
            return;
        }
        if (plantasSeleccionadas.length === 0) {
            toast.error('No hay plantas seleccionadas para el muestreo');
            return;
        }

        setEnviando(true);

        const formulario: Record<string, any> = {
            plantas: plantasSeleccionadas,
            caracterizacion,
            porcentaje_muestreo: porcentajeMuestreo,
            total_plantas_lote: estructuraLote?.total_plantas || 0,
            plantas_totales_lote: plantasOriginales.length,
        };

        const payload: DiagnosticoPayload = {
            programa_id: programaId!,
            tipo_monitoreo_id: tipoMonitoreoId!,
            lote_id: loteId!,
            usuario_id: currentUser?.id,
            tipo_diagnostico: tipoDiagnostico,
            condiciones_dia: condicionesDia,
            formulario,
        };

        try {
            await onSubmit(payload);
            
            toast.success(
                `¡Diagnóstico de ${TIPOS_DIAGNOSTICO.find(t => t.value === tipoDiagnostico)?.label} creado exitosamente!`,
                { duration: 3000, position: 'top-right' }
            );
            
            // ✅ Limpiar solo el paso 2, mantener paso 1 y las plantas seleccionadas
            resetearPaso2();
            
            // Opcional: Regenerar la selección de plantas para el próximo diagnóstico
            // (descomentar si quieres que cambien las plantas cada vez)
            // regenerarSeleccionPlantas();
            
        } catch (error: any) {
            console.error('Error al crear diagnóstico:', error);
            toast.error(error.message || 'Error al crear el diagnóstico', {
                duration: 5000,
                position: 'top-right'
            });
        } finally {
            setEnviando(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 border-b pb-3">
                {esEdicion ? 'Editar Diagnóstico' : 'Nuevo Diagnóstico'}
            </h2>

            {/* Indicador de pasos */}
            <div className="flex mb-6">
                <div className={`flex-1 text-center py-2 rounded-l-lg text-sm font-medium ${paso === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    Paso 1: Programa, monitoreo y lote
                </div>
                <div className={`flex-1 text-center py-2 rounded-r-lg text-sm font-medium ${paso === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    Paso 2: Formulario de diagnóstico
                </div>
            </div>

            {/* ── PASO 1 ────────────────────────────────────────────────────── */}
            {paso === 1 && (
                <div className="space-y-6">
                    {/* Programa */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Programa *
                        </label>
                        <select
                            value={programaId?.toString() || ''}
                            onChange={handleProgramaChange}
                            className="w-full border rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500"
                            disabled={esEdicion}
                        >
                            <option value="">Seleccionar programa</option>
                            {programas.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre}
                                </option>
                            ))}
                        </select>
                        {programaSeleccionado && (
                            <p className="text-sm text-green-600 mt-1">
                                ✓ {programaSeleccionado.nombre}
                            </p>
                        )}
                    </div>

                    {/* Tipo de monitoreo */}
                    {programaId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Monitoreo *
                            </label>
                            {monitoreos.length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {monitoreos.map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setTipoMonitoreoId(m.id)}
                                            className={`p-4 border-2 rounded-lg text-center transition ${
                                                tipoMonitoreoId === m.id
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                            }`}
                                            disabled={esEdicion}
                                        >
                                            <i className="fas fa-chart-line mr-2"></i>
                                            <span className="font-medium">{m.nombre}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                                    <p className="text-sm text-yellow-700">
                                        <i className="fas fa-info-circle mr-2"></i>
                                        Este programa no tiene tipos de monitoreo configurados.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Lote */}
                    {tipoMonitoreoId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Lote *
                            </label>
                            {lotesFiltrados.length > 0 ? (
                                <>
                                    <select
                                        value={loteId?.toString() || ''}
                                        onChange={handleLoteChange}
                                        className="w-full border rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500"
                                        disabled={cargandoEstructura || esEdicion}
                                    >
                                        <option value="">Seleccionar lote</option>
                                        {lotesFiltrados.map(l => (
                                            <option key={l.id} value={l.id}>
                                                {l.nombre}
                                                {l.granja_nombre ? ` (${l.granja_nombre})` : ''}
                                                {l.surcos && l.plantas_por_surco 
                                                    ? ` - ${l.surcos} surcos, ${l.plantas_por_surco} plantas/surco` 
                                                    : ' - Sin configurar'}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Mostrar información de la estructura del lote */}
                                    {loteSeleccionado && (
                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                            {cargandoEstructura ? (
                                                <div className="flex items-center text-gray-600">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                                    <span className="text-sm">Cargando estructura del lote...</span>
                                                </div>
                                            ) : estructuraLote ? (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="text-sm text-gray-700">
                                                                <strong>Configuración:</strong>{' '}
                                                                {estructuraLote.surcos} surcos × {estructuraLote.plantas_por_surco} plantas/surco
                                                            </p>
                                                            <p className="text-sm text-green-600">
                                                                <i className="fas fa-seedling mr-1"></i>
                                                                <strong>Total de plantas:</strong>{' '}
                                                                {estructuraLote.total_plantas.toLocaleString('es-ES')}
                                                            </p>
                                                            <p className="text-sm text-blue-600">
                                                                <i className="fas fa-chart-simple mr-1"></i>
                                                                <strong>Plantas a muestrear:</strong>{' '}
                                                                {plantasSeleccionadas.length} plantas ({porcentajeMuestreo}%)
                                                            </p>
                                                        </div>
                                                        {plantasOriginales.length > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={regenerarSeleccionPlantas}
                                                                className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg transition flex items-center gap-1"
                                                            >
                                                                <i className="fas fa-random"></i>
                                                                Regenerar muestra
                                                            </button>
                                                        )}
                                                    </div>
                                                    {!estructuraLote.muestra_completa && (
                                                        <p className="text-xs text-amber-600">
                                                            <i className="fas fa-info-circle mr-1"></i>
                                                            El lote tiene muchas plantas, se está utilizando una muestra representativa
                                                        </p>
                                                    )}
                                                    {estructuraLote.cultivos.length > 0 && (
                                                        <p className="text-xs text-gray-500">
                                                            <strong>Cultivos:</strong>{' '}
                                                            {estructuraLote.cultivos.map(c => c.nombre).join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : loteId && (
                                                <p className="text-sm text-red-600">
                                                    <i className="fas fa-exclamation-triangle mr-1"></i>
                                                    Este lote no tiene surcos o plantas configurados
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                                    <p className="text-sm text-yellow-700">
                                        No hay lotes disponibles para el programa seleccionado.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={handleSiguiente}
                            disabled={
                                !programaId ||
                                !tipoMonitoreoId ||
                                !loteId ||
                                !estructuraLote ||
                                estructuraLote.total_plantas === 0 ||
                                plantasSeleccionadas.length === 0
                            }
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                            <span>Siguiente</span>
                            <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            )}

            {/* ── PASO 2 ────────────────────────────────────────────────────── */}
            {paso === 2 && (
                <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        {/* Resumen de selección */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Resumen</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <span className="text-sm text-gray-600">
                                            <strong>Programa:</strong> {programaSeleccionado?.nombre || '—'}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            <strong>Monitoreo:</strong> {monitoreoSeleccionado?.nombre || tipoMonitoreoId || '—'}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            <strong>Lote:</strong> {loteSeleccionado?.nombre || '—'}
                                        </span>
                                    </div>
                                    {estructuraLote && (
                                        <div className="mt-2 text-xs text-gray-500">
                                            {estructuraLote.surcos} surcos × {estructuraLote.plantas_por_surco} plantas/surco ={' '}
                                            {estructuraLote.total_plantas.toLocaleString('es-ES')} plantas totales
                                            <span className="ml-2 text-blue-600">
                                                | Muestreando: {plantasSeleccionadas.length} plantas ({porcentajeMuestreo}%)
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={regenerarSeleccionPlantas}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 px-2 py-1 bg-blue-50 rounded"
                                        title="Regenerar selección aleatoria de plantas"
                                    >
                                        <i className="fas fa-random"></i> Nueva muestra
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaso(1)}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                    >
                                        <i className="fas fa-edit"></i> Cambiar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tipo de diagnóstico */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Diagnóstico *
                            </label>
                            <select
                                value={tipoDiagnostico}
                                onChange={e => setTipoDiagnostico(e.target.value)}
                                className="w-full border rounded-lg p-3"
                                required
                                disabled={enviando}
                            >
                                <option value="">Seleccionar tipo</option>
                                {TIPOS_DIAGNOSTICO.map(t => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Condiciones del día */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Condiciones del día *
                            </label>
                            <select
                                value={condicionesDia}
                                onChange={e => setCondicionesDia(e.target.value)}
                                className="w-full border rounded-lg p-3"
                                required
                                disabled={enviando}
                            >
                                <option value="">Seleccionar condiciones</option>
                                {condiciones_dia.map(c => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sección específica por tipo */}
                        {tipoDiagnostico && plantasSeleccionadas.length > 0 && (
                            <div className="mt-2">
                                <div className="mb-3 text-sm text-gray-600">
                                    <i className="fas fa-info-circle mr-1"></i>
                                    Evaluando {plantasSeleccionadas.length} plantas seleccionadas al azar
                                </div>
                                {tipoDiagnostico === 'censo_poblacional' && (
                                    <CensoSection
                                        plantas={plantasSeleccionadas}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange}
                                    />
                                )}
                                {tipoDiagnostico === 'monitoreo_fenologico' && (
                                    <FenologicoSection
                                        plantas={plantasSeleccionadas}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange}
                                        onFaseChange={handleCaracterizacionChange}
                                    />
                                )}
                                {tipoDiagnostico === 'artropodos' && (
                                    <ArthropodSection
                                        plantas={plantasSeleccionadas}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange}
                                    />
                                )}
                                {tipoDiagnostico === 'enfermedades' && (
                                    <EnfermedadesSection
                                        plantas={plantasSeleccionadas}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange}
                                    />
                                )}
                                {tipoDiagnostico === 'arvenses' && (
                                    <ArvensesSection
                                        plantas={plantasSeleccionadas}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange}
                                    />
                                )}
                                {tipoDiagnostico === 'controladores_biologicos' && (
                                    <ControladoresSection
                                        plantas={plantasSeleccionadas}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange}
                                    />
                                )}
                                {tipoDiagnostico === 'polinizadores' && (
                                    <PolinizadoresSection
                                        plantas={plantasSeleccionadas}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange}
                                    />
                                )}
                            </div>
                        )}

                        {/* Advertencias */}
                        {(!tipoDiagnostico || !condicionesDia) && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                <p className="text-sm text-yellow-700">
                                    <i className="fas fa-info-circle mr-2"></i>
                                    {!tipoDiagnostico
                                        ? 'Selecciona un tipo de diagnóstico.'
                                        : 'Selecciona las condiciones del día.'}
                                </p>
                            </div>
                        )}
                        {tipoDiagnostico && plantasSeleccionadas.length === 0 && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4">
                                <p className="text-sm text-red-700">
                                    <i className="fas fa-exclamation-triangle mr-2"></i>
                                    No hay plantas seleccionadas para el muestreo. Regresa al paso 1 y regenera la muestra.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 mt-8 pt-5 border-t">
                        <button
                            type="button"
                            onClick={() => {
                                if (enviando) return;
                                const confirmar = window.confirm('¿Estás seguro de cancelar? Los datos no guardados se perderán.');
                                if (confirmar) onCancel();
                            }}
                            className="px-5 py-2.5 border rounded-lg hover:bg-gray-100 transition flex items-center gap-2 disabled:opacity-50"
                            disabled={enviando}
                        >
                            <i className="fas fa-times"></i> Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!tipoDiagnostico || !condicionesDia || plantasSeleccionadas.length === 0 || enviando}
                            className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                            {enviando ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i>
                                    Guardar Diagnóstico
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default DiagnosticoForm;