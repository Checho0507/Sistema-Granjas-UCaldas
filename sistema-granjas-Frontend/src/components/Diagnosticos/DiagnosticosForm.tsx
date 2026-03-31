import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface PlantaBase {
    codigo: string;
    label: string;
    surco: number;
    planta: number;
}

interface Programa {
    id: number;
    nombre: string;
}

interface Lote {
    id: number;
    nombre: string;
    granja_id?: number;
    granja_nombre?: string;
    programa_id: number;
    surcos?: number | null;
    plantas_por_surco?: number | null;
}

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
    porcentajeMuestreo?: number;
}

interface Tarea {
    planta: PlantaBase;
    tipoDiagnostico: string;
    completada: boolean;
    respuesta?: Record<string, any>;
}

interface Progreso {
    paso: number;
    programaId: number | null;
    tipoMonitoreoId: number | null;
    loteId: number | null;
    plantasSeleccionadas: PlantaBase[];
    tiposSeleccionados: string[];
    condicionesDia: string;
    tareas: Tarea[];
    indiceActual: number;
    respuestasParciales: Record<string, Record<string, any>>;
}

const TIPOS_DIAGNOSTICO = [
    { value: 'censo_poblacional', label: 'Censo Poblacional' },
    { value: 'monitoreo_fenologico', label: 'Monitoreo Fenológico' },
    { value: 'artropodos', label: 'Artrópodos' },
    { value: 'enfermedades', label: 'Enfermedades' },
    { value: 'arvenses', label: 'Arvenses' },
    { value: 'controladores_biologicos', label: 'Controladores Biológicos' },
    { value: 'polinizadores', label: 'Polinizadores' },
];

const STORAGE_KEY = 'diagnostico_incompleto';

// ── Componente de formulario para una tarea (usado solo en creación) ─────────

const TareaForm: React.FC<{
    tarea: Tarea;
    respuestaActual: Record<string, any>;
    condicionesDia: string;
    onChangeCondiciones: (val: string) => void;
    onChangeRespuesta: (respuesta: Record<string, any>) => void;
}> = ({ tarea, respuestaActual, condicionesDia, onChangeCondiciones, onChangeRespuesta }) => {
    const { planta, tipoDiagnostico } = tarea;

    const handleCampoChange = (campo: string, valor: string) => {
        onChangeRespuesta({ ...respuestaActual, [campo]: valor });
    };

    const renderCampos = () => {
        switch (tipoDiagnostico) {
            case 'censo_poblacional':
                return (
                    <CensoSection
                        plantas={[planta]}
                        caracterizacion={respuestaActual}
                        onCampoChange={handleCampoChange}
                    />
                );
            case 'monitoreo_fenologico':
                return (
                    <FenologicoSection
                        plantas={[planta]}
                        caracterizacion={respuestaActual}
                        onCampoChange={handleCampoChange}
                        onFaseChange={handleCampoChange}
                    />
                );
            case 'artropodos':
                return (
                    <ArthropodSection
                        plantas={[planta]}
                        caracterizacion={respuestaActual}
                        onCampoChange={handleCampoChange}
                    />
                );
            case 'enfermedades':
                return (
                    <EnfermedadesSection
                        plantas={[planta]}
                        caracterizacion={respuestaActual}
                        onCampoChange={handleCampoChange}
                    />
                );
            case 'arvenses':
                return (
                    <ArvensesSection
                        plantas={[planta]}
                        caracterizacion={respuestaActual}
                        onCampoChange={handleCampoChange}
                    />
                );
            case 'controladores_biologicos':
                return (
                    <ControladoresSection
                        plantas={[planta]}
                        caracterizacion={respuestaActual}
                        onCampoChange={handleCampoChange}
                    />
                );
            case 'polinizadores':
                return (
                    <PolinizadoresSection
                        plantas={[planta]}
                        caracterizacion={respuestaActual}
                        onCampoChange={handleCampoChange}
                    />
                );
            default:
                return <p className="text-gray-500">Formulario no disponible</p>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Planta:</strong> {planta.label}</div>
                    <div><strong>Tipo:</strong> {TIPOS_DIAGNOSTICO.find(t => t.value === tipoDiagnostico)?.label}</div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condiciones del día *
                </label>
                <select
                    value={condicionesDia}
                    onChange={e => onChangeCondiciones(e.target.value)}
                    className="w-full border rounded-lg p-3"
                    required
                >
                    <option value="">Seleccionar condiciones</option>
                    {['Soleado', 'Nublado', 'Lluvia'].map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Datos del diagnóstico</h3>
                {renderCampos()}
            </div>
        </div>
    );
};

// ── Componente principal ──────────────────────────────────────────────────────

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
    porcentajeMuestreo = 10,
}) => {
    // ===================== MODO EDICIÓN (simple) ===============================
    if (esEdicion && diagnostico) {
        const [tipoDiagnostico, setTipoDiagnostico] = useState(diagnostico.tipo_diagnostico || '');
        const [condicionesDia, setCondicionesDia] = useState(diagnostico.condiciones_dia || '');
        const [caracterizacion, setCaracterizacion] = useState<Record<string, any>>(
            (diagnostico as any).formulario?.caracterizacion || {}
        );
        const [enviando, setEnviando] = useState(false);

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
            setEnviando(true);
            const payload: DiagnosticoPayload = {
                programa_id: diagnostico.programa_id,
                tipo_monitoreo_id: diagnostico.tipo_monitoreo_id,
                lote_id: diagnostico.lote_id,
                usuario_id: currentUser?.id,
                tipo_diagnostico: tipoDiagnostico,
                condiciones_dia: condicionesDia,
                formulario: {
                    plantas: (diagnostico as any).formulario?.plantas || [],
                    caracterizacion,
                },
            };
            try {
                await onSubmit(payload);
                toast.success('Diagnóstico actualizado');
                onCancel();
            } catch (err: any) {
                toast.error(`Error: ${err.message}`);
            } finally {
                setEnviando(false);
            }
        };

        return (
            <div className="p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 border-b pb-3">Editar Diagnóstico</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Diagnóstico *</label>
                        <select
                            value={tipoDiagnostico}
                            onChange={e => setTipoDiagnostico(e.target.value)}
                            className="w-full border rounded-lg p-3"
                            required
                        >
                            <option value="">Seleccionar tipo</option>
                            {TIPOS_DIAGNOSTICO.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Condiciones del día *</label>
                        <select
                            value={condicionesDia}
                            onChange={e => setCondicionesDia(e.target.value)}
                            className="w-full border rounded-lg p-3"
                            required
                        >
                            <option value="">Seleccionar condiciones</option>
                            {condiciones_dia.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Datos del diagnóstico</label>
                        {tipoDiagnostico === 'censo_poblacional' && (
                            <CensoSection
                                plantas={(diagnostico as any).formulario?.plantas || []}
                                caracterizacion={caracterizacion}
                                onCampoChange={(campo, val) => setCaracterizacion(prev => ({ ...prev, [campo]: val }))}
                            />
                        )}
                        {tipoDiagnostico === 'monitoreo_fenologico' && (
                            <FenologicoSection
                                plantas={(diagnostico as any).formulario?.plantas || []}
                                caracterizacion={caracterizacion}
                                onCampoChange={(campo, val) => setCaracterizacion(prev => ({ ...prev, [campo]: val }))}
                                onFaseChange={(campo, val) => setCaracterizacion(prev => ({ ...prev, [campo]: val }))}
                            />
                        )}
                        {/* Aquí puedes añadir los demás tipos si lo deseas */}
                    </div>
                    <div className="flex justify-end gap-3 pt-5 border-t">
                        <button type="button" onClick={onCancel} className="px-5 py-2.5 border rounded-lg hover:bg-gray-100">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={enviando}
                            className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                        >
                            {enviando ? 'Guardando...' : 'Actualizar'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // ===================== MODO CREACIÓN (asistente con localStorage) ============
    const [paso, setPaso] = useState(1);
    const [progreso, setProgreso] = useState<Progreso | null>(null);
    const [cargandoEstructura, setCargandoEstructura] = useState(false);
    const [monitoreos, setMonitoreos] = useState<Monitoreo[]>(externalMonitoreos || []);

    // Datos del paso 1
    const [programaId, setProgramaId] = useState<number | null>(null);
    const [tipoMonitoreoId, setTipoMonitoreoId] = useState<number | null>(null);
    const [loteId, setLoteId] = useState<number | null>(null);
    const [estructuraLote, setEstructuraLote] = useState<EstructuraLote | null>(null);
    const [plantasSeleccionadas, setPlantasSeleccionadas] = useState<PlantaBase[]>([]);
    const [plantasOriginales, setPlantasOriginales] = useState<PlantaBase[]>([]);
    const [tiposSeleccionados, setTiposSeleccionados] = useState<string[]>([]);
    const [condicionesDia, setCondicionesDia] = useState('');

    // Estado de la tarea actual
    const [tareaActual, setTareaActual] = useState<Tarea | null>(null);
    const [respuestaTemporal, setRespuestaTemporal] = useState<Record<string, any>>({});

    // Limpiar progreso (al cancelar)
    const limpiarProgreso = () => {
        localStorage.removeItem(STORAGE_KEY);
        setProgreso(null);
    };

    const resetearTodo = () => {
        setPaso(1);
        setProgramaId(null);
        setTipoMonitoreoId(null);
        setLoteId(null);
        setEstructuraLote(null);
        setPlantasSeleccionadas([]);
        setPlantasOriginales([]);
        setTiposSeleccionados([]);
        setCondicionesDia('');
        setTareaActual(null);
        setRespuestaTemporal({});
        limpiarProgreso();
    };

    // Cargar o inicializar progreso desde localStorage al abrir modal
    useEffect(() => {
        if (isOpen && !esEdicion) {
            const guardado = localStorage.getItem(STORAGE_KEY);
            if (guardado) {
                try {
                    const parsed: Progreso = JSON.parse(guardado);
                    if (parsed.tareas && parsed.tareas.length > 0) {
                        if (window.confirm('Hay un diagnóstico en progreso. ¿Deseas continuar donde lo dejaste?')) {
                            setProgreso(parsed);
                            setPaso(parsed.paso);
                            setProgramaId(parsed.programaId);
                            setTipoMonitoreoId(parsed.tipoMonitoreoId);
                            setLoteId(parsed.loteId);
                            setPlantasSeleccionadas(parsed.plantasSeleccionadas);
                            setTiposSeleccionados(parsed.tiposSeleccionados);
                            setCondicionesDia(parsed.condicionesDia);
                            if (parsed.paso === 3) {
                                const tarea = parsed.tareas[parsed.indiceActual];
                                setTareaActual(tarea);
                                setRespuestaTemporal(tarea.respuesta || {});
                            }
                            return;
                        }
                    }
                } catch (e) {
                    console.error('Error al cargar progreso', e);
                }
            }
            resetearTodo();
        }
    }, [isOpen, esEdicion]);

    // Guardar progreso en localStorage cada vez que cambia (automático)
    useEffect(() => {
        if (!progreso && (paso === 1 || paso === 2)) return;
        if (paso === 1) return;
        const nuevoProgreso: Progreso = {
            paso,
            programaId,
            tipoMonitoreoId,
            loteId,
            plantasSeleccionadas,
            tiposSeleccionados,
            condicionesDia,
            tareas: progreso?.tareas || [],
            indiceActual: progreso?.indiceActual || 0,
            respuestasParciales: progreso?.respuestasParciales || {},
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevoProgreso));
    }, [paso, programaId, tipoMonitoreoId, loteId, plantasSeleccionadas, tiposSeleccionados, condicionesDia, progreso]);

    // Cargar monitoreos
    useEffect(() => {
        if (!programaId) { setMonitoreos([]); return; }
        monitoreoService.obtenerMonitoreosPorPrograma(programaId)
            .then(setMonitoreos)
            .catch(() => toast.error('Error cargando tipos de monitoreo'));
    }, [programaId]);

    // Cargar estructura del lote y generar muestra aleatoria
    const cargarEstructura = useCallback(async () => {
        if (!loteId) return;
        setCargandoEstructura(true);
        try {
            const estructura = await loteService.obtenerEstructuraLote(loteId);
            setEstructuraLote(estructura);
            if (estructura.plantas?.length) {
                setPlantasOriginales(estructura.plantas);
                const cantidad = Math.max(1, Math.floor(estructura.plantas.length * (porcentajeMuestreo / 100)));
                const mezcladas = [...estructura.plantas];
                for (let i = mezcladas.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [mezcladas[i], mezcladas[j]] = [mezcladas[j], mezcladas[i]];
                }
                const seleccionadas = mezcladas.slice(0, cantidad).sort((a, b) => {
                    if (a.surco !== b.surco) return a.surco - b.surco;
                    return a.planta - b.planta;
                });
                setPlantasSeleccionadas(seleccionadas);
                toast.success(`${estructura.total_plantas} plantas totales, muestreadas ${seleccionadas.length}`);
            } else {
                toast.warning('El lote no tiene plantas configuradas');
            }
        } catch (error) {
            toast.error('Error al cargar estructura del lote');
        } finally {
            setCargandoEstructura(false);
        }
    }, [loteId, porcentajeMuestreo]);

    useEffect(() => {
        cargarEstructura();
    }, [cargarEstructura]);

    const generarTareas = () => {
        const tareas: Tarea[] = [];
        for (const planta of plantasSeleccionadas) {
            for (const tipo of tiposSeleccionados) {
                tareas.push({
                    planta,
                    tipoDiagnostico: tipo,
                    completada: false,
                    respuesta: {},
                });
            }
        }
        return tareas;
    };

    const handleSiguientePaso1 = () => {
        if (!programaId) { toast.warning('Selecciona programa'); return; }
        if (!tipoMonitoreoId) { toast.warning('Selecciona tipo de monitoreo'); return; }
        if (!loteId) { toast.warning('Selecciona lote'); return; }
        if (!estructuraLote?.total_plantas) { toast.warning('Lote sin plantas'); return; }
        setPaso(2);
    };

    const handleConfirmarTipos = () => {
        if (tiposSeleccionados.length === 0) {
            toast.warning('Selecciona al menos un tipo de diagnóstico');
            return;
        }
        const tareas = generarTareas();
        const nuevoProgreso: Progreso = {
            paso: 3,
            programaId,
            tipoMonitoreoId,
            loteId,
            plantasSeleccionadas,
            tiposSeleccionados,
            condicionesDia,
            tareas,
            indiceActual: 0,
            respuestasParciales: {},
        };
        setProgreso(nuevoProgreso);
        setTareaActual(tareas[0]);
        setRespuestaTemporal(tareas[0].respuesta || {});
        setPaso(3);
    };

    const guardarRespuestaActual = () => {
        if (!progreso || !tareaActual) return;
        const nuevoProgreso = { ...progreso };
        const idx = nuevoProgreso.indiceActual;
        nuevoProgreso.tareas[idx] = {
            ...nuevoProgreso.tareas[idx],
            respuesta: respuestaTemporal,
            completada: true,
        };
        nuevoProgreso.respuestasParciales = {
            ...nuevoProgreso.respuestasParciales,
            [`${tareaActual.planta.codigo}_${tareaActual.tipoDiagnostico}`]: respuestaTemporal,
        };
        setProgreso(nuevoProgreso);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevoProgreso));
    };

    // Validar que al menos un campo esté lleno antes de avanzar
    const validarRespuesta = (): boolean => {
        if (!respuestaTemporal || Object.keys(respuestaTemporal).length === 0) {
            toast.warning('Debes llenar al menos un campo del diagnóstico antes de continuar');
            return false;
        }
        return true;
    };

    const handleSiguienteTarea = () => {
        if (!progreso) return;
        if (!validarRespuesta()) return;
        guardarRespuestaActual();
        const siguienteIndice = progreso.indiceActual + 1;
        if (siguienteIndice < progreso.tareas.length) {
            const nuevaTarea = progreso.tareas[siguienteIndice];
            setTareaActual(nuevaTarea);
            setRespuestaTemporal(nuevaTarea.respuesta || {});
            setProgreso({ ...progreso, indiceActual: siguienteIndice });
        } else {
            if (window.confirm('Has completado todas las tareas. ¿Deseas enviar todos los diagnósticos ahora?')) {
                enviarTodos();
            } else {
                toast.info('Puedes enviar más tarde usando el botón "Enviar todas las respuestas"');
            }
        }
    };

    const handleAnteriorTarea = () => {
        if (!progreso) return;
        guardarRespuestaActual();
        const anteriorIndice = progreso.indiceActual - 1;
        if (anteriorIndice >= 0) {
            const nuevaTarea = progreso.tareas[anteriorIndice];
            setTareaActual(nuevaTarea);
            setRespuestaTemporal(nuevaTarea.respuesta || {});
            setProgreso({ ...progreso, indiceActual: anteriorIndice });
        }
    };

    // Guardar progreso y cerrar modal
    const handleGuardarProgresoYCerrar = () => {
        if (progreso && tareaActual) {
            guardarRespuestaActual();
        }
        onCancel();
    };

    const [enviando, setEnviando] = useState(false);

    const enviarTodos = async () => {
        if (!progreso) return;
        if (!condicionesDia) {
            toast.warning('Selecciona las condiciones del día');
            return;
        }
        const payloads: DiagnosticoPayload[] = [];
        for (const tarea of progreso.tareas) {
            if (!tarea.respuesta) continue;
            payloads.push({
                programa_id: programaId!,
                tipo_monitoreo_id: tipoMonitoreoId!,
                lote_id: loteId!,
                usuario_id: currentUser?.id,
                tipo_diagnostico: tarea.tipoDiagnostico,
                condiciones_dia: condicionesDia,
                formulario: {
                    plantas: [tarea.planta],
                    caracterizacion: tarea.respuesta,
                    porcentaje_muestreo: porcentajeMuestreo,
                    total_plantas_lote: estructuraLote?.total_plantas || 0,
                },
            });
        }
        if (payloads.length === 0) {
            toast.warning('No hay respuestas para enviar');
            return;
        }
        setEnviando(true);
        try {
            const results = await Promise.allSettled(payloads.map(p => onSubmit(p)));
            const errores = results.filter(r => r.status === 'rejected');
            if (errores.length === 0) {
                toast.success(`${payloads.length} diagnósticos enviados correctamente`);
                limpiarProgreso();
                onCancel();
            } else {
                toast.error(`${errores.length} de ${payloads.length} diagnósticos fallaron`);
            }
        } catch (error) {
            toast.error('Error al enviar diagnósticos');
        } finally {
            setEnviando(false);
        }
    };

    const lotesFiltrados = useMemo(() => {
        if (!programaId) return [];
        return lotes.filter(l => l.programa_id === programaId);
    }, [lotes, programaId]);

    // Renderizado del asistente (pasos 1-3)
    return (
        <div className="p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 border-b pb-3">Registro de Diagnósticos</h2>

            {/* Indicador de pasos */}
            <div className="flex mb-6">
                <div className={`flex-1 text-center py-2 rounded-l-lg text-sm font-medium ${paso === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    Paso 1: Programa, monitoreo y lote
                </div>
                <div className={`flex-1 text-center py-2 text-sm font-medium ${paso === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    Paso 2: Seleccionar tipos
                </div>
                <div className={`flex-1 text-center py-2 rounded-r-lg text-sm font-medium ${paso === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    Paso 3: Registrar datos
                </div>
            </div>

            {paso === 1 && (
                <div className="space-y-6">
                    {/* Programa */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Programa *</label>
                        <select
                            value={programaId?.toString() || ''}
                            onChange={(e) => {
                                const id = e.target.value ? parseInt(e.target.value) : null;
                                setProgramaId(id);
                                setTipoMonitoreoId(null);
                                setLoteId(null);
                                setEstructuraLote(null);
                                setPlantasSeleccionadas([]);
                            }}
                            className="w-full border rounded-lg p-3"
                        >
                            <option value="">Seleccionar programa</option>
                            {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                    </div>

                    {programaId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Monitoreo *</label>
                            <div className="grid grid-cols-2 gap-3">
                                {monitoreos.map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setTipoMonitoreoId(m.id)}
                                        className={`p-4 border-2 rounded-lg text-center transition ${tipoMonitoreoId === m.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}
                                    >
                                        <i className="fas fa-chart-line mr-2"></i>
                                        <span className="font-medium">{m.nombre}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {tipoMonitoreoId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Lote *</label>
                            <select
                                value={loteId?.toString() || ''}
                                onChange={(e) => setLoteId(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full border rounded-lg p-3"
                                disabled={cargandoEstructura}
                            >
                                <option value="">Seleccionar lote</option>
                                {lotesFiltrados.map(l => (
                                    <option key={l.id} value={l.id}>
                                        {l.nombre} {l.granja_nombre ? `(${l.granja_nombre})` : ''}
                                        {l.surcos && l.plantas_por_surco ? ` - ${l.surcos} surcos, ${l.plantas_por_surco} plantas/surco` : ' - Sin configurar'}
                                    </option>
                                ))}
                            </select>
                            {loteId && estructuraLote && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-700">
                                        <strong>Configuración:</strong> {estructuraLote.surcos} surcos × {estructuraLote.plantas_por_surco} plantas/surco
                                    </p>
                                    <p className="text-sm text-green-600">
                                        <strong>Total plantas:</strong> {estructuraLote.total_plantas.toLocaleString()}
                                    </p>
                                    <p className="text-sm text-blue-600">
                                        <strong>Plantas a muestrear:</strong> {plantasSeleccionadas.length} ({porcentajeMuestreo}%)
                                    </p>
                                    {plantasSeleccionadas.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const mezcladas = [...plantasOriginales];
                                                for (let i = mezcladas.length - 1; i > 0; i--) {
                                                    const j = Math.floor(Math.random() * (i + 1));
                                                    [mezcladas[i], mezcladas[j]] = [mezcladas[j], mezcladas[i]];
                                                }
                                                const nuevaCantidad = Math.max(1, Math.floor(mezcladas.length * (porcentajeMuestreo / 100)));
                                                const nuevas = mezcladas.slice(0, nuevaCantidad).sort((a, b) => {
                                                    if (a.surco !== b.surco) return a.surco - b.surco;
                                                    return a.planta - b.planta;
                                                });
                                                setPlantasSeleccionadas(nuevas);
                                                toast.info(`Nueva muestra: ${nuevas.length} plantas`);
                                            }}
                                            className="mt-2 text-sm text-blue-600 hover:underline"
                                        >
                                            Regenerar muestra aleatoria
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleSiguientePaso1}
                            disabled={!programaId || !tipoMonitoreoId || !loteId || !estructuraLote?.total_plantas}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            Siguiente <i className="fas fa-arrow-right ml-2"></i>
                        </button>
                    </div>
                </div>
            )}

            {paso === 2 && (
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipos de diagnóstico a realizar *</label>
                        <div className="grid grid-cols-2 gap-3">
                            {TIPOS_DIAGNOSTICO.map(tipo => (
                                <label key={tipo.value} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={tiposSeleccionados.includes(tipo.value)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setTiposSeleccionados(prev => [...prev, tipo.value]);
                                            } else {
                                                setTiposSeleccionados(prev => prev.filter(t => t !== tipo.value));
                                            }
                                        }}
                                        className="rounded border-gray-300 text-blue-600"
                                    />
                                    <span>{tipo.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Condiciones del día *</label>
                        <select
                            value={condicionesDia}
                            onChange={e => setCondicionesDia(e.target.value)}
                            className="w-full border rounded-lg p-3"
                            required
                        >
                            <option value="">Seleccionar condiciones</option>
                            {condiciones_dia.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="flex justify-between pt-4">
                        <button
                            type="button"
                            onClick={() => setPaso(1)}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                        >
                            <i className="fas fa-arrow-left mr-2"></i> Anterior
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmarTipos}
                            disabled={tiposSeleccionados.length === 0 || !condicionesDia}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                        >
                            Generar tareas <i className="fas fa-arrow-right ml-2"></i>
                        </button>
                    </div>
                </div>
            )}

            {paso === 3 && progreso && tareaActual && (
                <div className="space-y-6">
                    <div className="bg-blue-50 p-3 rounded-lg flex justify-between items-center">
                        <span>
                            <strong>Progreso:</strong> {progreso.indiceActual + 1} de {progreso.tareas.length} tareas
                        </span>
                    </div>

                    <TareaForm
                        key={`${tareaActual.planta.codigo}_${tareaActual.tipoDiagnostico}`}
                        tarea={tareaActual}
                        respuestaActual={respuestaTemporal}
                        condicionesDia={condicionesDia}
                        onChangeCondiciones={setCondicionesDia}
                        onChangeRespuesta={setRespuestaTemporal}
                    />

                    <div className="flex justify-between pt-4">
                        <button
                            type="button"
                            onClick={handleAnteriorTarea}
                            disabled={progreso.indiceActual === 0}
                            className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                        >
                            <i className="fas fa-arrow-left mr-2"></i> Anterior
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleGuardarProgresoYCerrar}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                            >
                                <i className="fas fa-save mr-2"></i> Guardar progreso
                            </button>
                            <button
                                type="button"
                                onClick={handleSiguienteTarea}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {progreso.indiceActual === progreso.tareas.length - 1 ? 'Finalizar' : 'Siguiente'}
                                <i className="fas fa-arrow-right ml-2"></i>
                            </button>
                        </div>
                    </div>

                    {progreso.indiceActual === progreso.tareas.length - 1 && (
                        <div className="flex justify-end mt-4">
                            <button
                                type="button"
                                onClick={enviarTodos}
                                disabled={enviando}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                            >
                                {enviando ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-paper-plane mr-2"></i>
                                        Enviar todos los diagnósticos
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DiagnosticoForm;