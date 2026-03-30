import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { DiagnosticoItem, CrearDiagnosticoDTO } from '../../types/diagnosticoTypes';
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

// DTO que se envía al backend con la nueva estructura
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
    diagnostico?: DiagnosticoItem;
    onSubmit: (data: DiagnosticoPayload) => void;
    onCancel: () => void;
    lotes: Lote[];
    programas: Programa[];
    monitoreos?: Monitoreo[];
    condiciones_dia: string[];
    currentUser: any;
    esEdicion?: boolean;
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
    diagnostico,
    onSubmit,
    onCancel,
    lotes = [],
    programas = [],
    monitoreos: externalMonitoreos,
    condiciones_dia = ['Soleado', 'Nublado', 'Lluvia'],
    currentUser,
    esEdicion = false,
}) => {
    // ── Wizard ────────────────────────────────────────────────────────────────
    const [paso, setPaso] = useState(1);

    // ── Paso 1 ────────────────────────────────────────────────────────────────
    const [programaId, setProgramaId] = useState<number | null>(null);
    const [tipoMonitoreoId, setTipoMonitoreoId] = useState<number | null>(null);
    const [loteId, setLoteId] = useState<number | null>(null);
    const [monitoreos, setMonitoreos] = useState<Monitoreo[]>(externalMonitoreos || []);
    const [estructuraLote, setEstructuraLote] = useState<EstructuraLote | null>(null);
    const [cargandoEstructura, setCargandoEstructura] = useState(false);

    // ── Paso 2 ────────────────────────────────────────────────────────────────
    const [tipoDiagnostico, setTipoDiagnostico] = useState('');
    const [condicionesDia, setCondicionesDia] = useState('');
    const [plantas, setPlantas] = useState<PlantaBase[]>([]);
    const [caracterizacion, setCaracterizacion] = useState<Record<string, string>>({});
    const [plantasMuestreadas, setPlantasMuestreadas] = useState<Set<string>>(new Set());

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
                setPlantas([]);
                setPlantasMuestreadas(new Set());
                return;
            }

            setCargandoEstructura(true);
            try {
                const estructura = await loteService.obtenerEstructuraLote(loteId);
                setEstructuraLote(estructura);

                // Generar plantas basadas en la estructura real del lote
                if (estructura.plantas && estructura.plantas.length > 0) {
                    setPlantas(estructura.plantas);
                    
                    // Inicializar caracterización para cada planta si no existe
                    const nuevaCaracterizacion = { ...caracterizacion };
                    estructura.plantas.forEach(planta => {
                        if (!nuevaCaracterizacion[planta.codigo]) {
                            nuevaCaracterizacion[planta.codigo] = '';
                        }
                    });
                    setCaracterizacion(nuevaCaracterizacion);
                    
                    toast.success(
                        `Lote cargado: ${estructura.total_plantas.toLocaleString('es-ES')} plantas disponibles${!estructura.muestra_completa ? ' (mostrando muestra representativa)' : ''}`,
                        {
                            duration: 4000,
                            position: 'top-right'
                        }
                    );
                } else {
                    toast.warning('Este lote no tiene surcos o plantas configurados', {
                        duration: 4000,
                        position: 'top-right'
                    });
                    setPlantas([]);
                }
            } catch (error) {
                console.error('Error cargando estructura del lote:', error);
                toast.error('Error al cargar la estructura del lote', {
                    duration: 4000,
                    position: 'top-right'
                });
                setPlantas([]);
            } finally {
                setCargandoEstructura(false);
            }
        };

        cargarEstructuraLote();
    }, [loteId]);

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
            setPlantas(d.formulario.plantas);
        }
        if (d.formulario?.caracterizacion) {
            setCaracterizacion(d.formulario.caracterizacion);
        }
        if (d.formulario?.plantas_muestreadas) {
            setPlantasMuestreadas(new Set(d.formulario.plantas_muestreadas));
        }
    }, [esEdicion, diagnostico]);

    // ── Auto-selección de lote único ──────────────────────────────────────────
    useEffect(() => {
        if (!esEdicion && lotesFiltrados.length === 1 && !loteId) {
            const l = lotesFiltrados[0];
            setLoteId(l.id);
            toast.info(`Lote seleccionado automáticamente: ${l.nombre}`);
        }
    }, [lotesFiltrados, esEdicion, loteId]);

    const handleProgramaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value ? parseInt(e.target.value) : null;
        setProgramaId(id);
        setTipoMonitoreoId(null);
        setLoteId(null);
        setEstructuraLote(null);
        setPlantas([]);
        setCaracterizacion({});
        setPlantasMuestreadas(new Set());
    };

    const handleLoteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value ? parseInt(e.target.value) : null;
        setLoteId(id);
        // Resetear caracterización al cambiar de lote
        setCaracterizacion({});
        setPlantasMuestreadas(new Set());
    };

    const handleCaracterizacionChange = (campo: string, valor: string) => {
        setCaracterizacion(prev => ({ ...prev, [campo]: valor }));
    };

    // Función para registrar plantas muestreadas (útil para algunos diagnósticos)
    const handlePlantaMuestreada = (codigo: string, muestreada: boolean) => {
        setPlantasMuestreadas(prev => {
            const nuevo = new Set(prev);
            if (muestreada) {
                nuevo.add(codigo);
            } else {
                nuevo.delete(codigo);
            }
            return nuevo;
        });
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

        // Verificar que el lote tenga estructura válida
        if (!estructuraLote || estructuraLote.total_plantas === 0) {
            toast.error('Este lote no tiene surcos o plantas configurados. Por favor, configura el lote primero.', {
                duration: 5000,
                position: 'top-right'
            });
            return;
        }

        setPaso(2);
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!tipoDiagnostico) {
            toast.error('Selecciona un tipo de diagnóstico');
            return;
        }
        if (!condicionesDia) {
            toast.error('Selecciona las condiciones del día');
            return;
        }
        if (!loteId) {
            toast.error('Selecciona un lote');
            return;
        }
        if (!tipoMonitoreoId) {
            toast.error('Selecciona un tipo de monitoreo');
            return;
        }
        if (!programaId) {
            toast.error('Selecciona un programa');
            return;
        }
        if (plantas.length === 0) {
            toast.error('No hay plantas disponibles para este lote');
            return;
        }

        // El campo `formulario` agrupa plantas + toda la caracterización
        const formulario: Record<string, any> = {
            plantas,
            caracterizacion,
        };

        // Si hay plantas muestreadas, agregarlas al formulario
        if (plantasMuestreadas.size > 0) {
            formulario.plantas_muestreadas = Array.from(plantasMuestreadas);
        }

        const payload: DiagnosticoPayload = {
            programa_id: programaId!,
            tipo_monitoreo_id: tipoMonitoreoId!,
            lote_id: loteId!,
            usuario_id: currentUser?.id,
            tipo_diagnostico: tipoDiagnostico,
            condiciones_dia: condicionesDia,
            formulario,
        };

        console.log('📤 Enviando diagnóstico:', {
            ...payload,
            total_plantas: plantas.length,
            plantas_muestreadas: plantasMuestreadas.size
        });
        
        onSubmit(payload);
        toast.success(esEdicion ? 'Diagnóstico actualizado' : 'Diagnóstico creado');
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
                                                <div className="space-y-1">
                                                    <p className="text-sm text-gray-700">
                                                        <strong>Configuración:</strong>{' '}
                                                        {estructuraLote.surcos} surcos × {estructuraLote.plantas_por_surco} plantas/surco
                                                    </p>
                                                    <p className="text-sm text-green-600">
                                                        <i className="fas fa-seedling mr-1"></i>
                                                        <strong>Total de plantas:</strong>{' '}
                                                        {estructuraLote.total_plantas.toLocaleString('es-ES')}
                                                    </p>
                                                    {!estructuraLote.muestra_completa && (
                                                        <p className="text-xs text-amber-600">
                                                            <i className="fas fa-info-circle mr-1"></i>
                                                            Se muestran {estructuraLote.total_plantas_muestreadas.toLocaleString('es-ES')} plantas 
                                                            (muestra representativa de {estructuraLote.total_plantas.toLocaleString('es-ES')} totales)
                                                        </p>
                                                    )}
                                                    {estructuraLote.cultivos.length > 0 && (
                                                        <p className="text-xs text-gray-500 mt-2">
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
                                estructuraLote.total_plantas === 0
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
                                            {!estructuraLote.muestra_completa && 
                                                ` (mostrando ${estructuraLote.total_plantas_muestreadas.toLocaleString('es-ES')} plantas)`}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPaso(1)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                >
                                    <i className="fas fa-edit"></i> Cambiar
                                </button>
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
                        {tipoDiagnostico && plantas.length > 0 && (
                            <div className="mt-2">
                                {tipoDiagnostico === 'censo_poblacional' && (
                                    <CensoSection
                                        plantas={plantas}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange}
                                    />
                                )}
                                {tipoDiagnostico === 'monitoreo_fenologico' && (
                                    <FenologicoSection
                                        plantas={plantas}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange}
                                        onFaseChange={handleCaracterizacionChange}
                                    />
                                )}
                                {tipoDiagnostico === 'artropodos' && (
                                    <ArthropodSection
                                        plantas={plantas}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange}
                                    />
                                )}
                                {tipoDiagnostico === 'enfermedades' && (
                                    <EnfermedadesSection
                                        plantas={plantas}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange}
                                    />
                                )}
                                {tipoDiagnostico === 'arvenses' && (
                                    <ArvensesSection
                                        plantas={plantas}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange}
                                    />
                                )}
                                {tipoDiagnostico === 'controladores_biologicos' && (
                                    <ControladoresSection
                                        plantas={plantas}
                                        caracterizacion={caracterizacion}
                                        onCampoChange={handleCaracterizacionChange}
                                    />
                                )}
                                {tipoDiagnostico === 'polinizadores' && (
                                    <PolinizadoresSection
                                        plantas={plantas}
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
                        {tipoDiagnostico && plantas.length === 0 && (
                            <div className="bg-red-50 border-l-4 border-red-400 p-4">
                                <p className="text-sm text-red-700">
                                    <i className="fas fa-exclamation-triangle mr-2"></i>
                                    No hay plantas disponibles para este lote. Verifica que el lote tenga surcos y plantas por surco configurados.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 mt-8 pt-5 border-t">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-5 py-2.5 border rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
                        >
                            <i className="fas fa-times"></i> Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!tipoDiagnostico || !condicionesDia || plantas.length === 0}
                            className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                            <i className="fas fa-save"></i>
                            {esEdicion ? 'Actualizar' : 'Crear'} Diagnóstico
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default DiagnosticoForm;