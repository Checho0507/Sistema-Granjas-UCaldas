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

// DTO para cada diagnóstico individual
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
    onSubmit: (data: DiagnosticoPayload) => Promise<void>; // se usará para un solo diagnóstico, pero ahora haremos múltiples
    onCancel: () => void;
    lotes: Lote[];
    programas: Programa[];
    monitoreos?: Monitoreo[];
    condiciones_dia: string[];
    currentUser: any;
    esEdicion?: boolean;
    porcentajeMuestreo?: number;
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

// Componente de formulario para cada planta (se renderiza por cada planta)
const PlantaDiagnosticoForm: React.FC<{
    planta: PlantaBase;
    tiposSeleccionados: string[];
    onTipoChange: (tipo: string, checked: boolean) => void;
    datosPorTipo: Record<string, any>;
    onDatosChange: (tipo: string, datos: any) => void;
}> = ({ planta, tiposSeleccionados, onTipoChange, datosPorTipo, onDatosChange }) => {
    // Para cada tipo, renderizar el componente específico
    const renderCamposPorTipo = (tipo: string) => {
        const datos = datosPorTipo[tipo] || {};
        const setDatos = (nuevos: any) => onDatosChange(tipo, nuevos);

        switch (tipo) {
            case 'censo_poblacional':
                return (
                    <CensoSection
                        plantas={[planta]}
                        caracterizacion={datos}
                        onCampoChange={(campo, valor) => setDatos({ ...datos, [campo]: valor })}
                    />
                );
            case 'monitoreo_fenologico':
                return (
                    <FenologicoSection
                        plantas={[planta]}
                        caracterizacion={datos}
                        onCampoChange={(campo, valor) => setDatos({ ...datos, [campo]: valor })}
                        onFaseChange={(campo, valor) => setDatos({ ...datos, [campo]: valor })}
                    />
                );
            case 'artropodos':
                return (
                    <ArthropodSection
                        plantas={[planta]}
                        caracterizacion={datos}
                        onCampoChange={(campo, valor) => setDatos({ ...datos, [campo]: valor })}
                    />
                );
            case 'enfermedades':
                return (
                    <EnfermedadesSection
                        plantas={[planta]}
                        caracterizacion={datos}
                        onCampoChange={(campo, valor) => setDatos({ ...datos, [campo]: valor })}
                    />
                );
            case 'arvenses':
                return (
                    <ArvensesSection
                        plantas={[planta]}
                        caracterizacion={datos}
                        onCampoChange={(campo, valor) => setDatos({ ...datos, [campo]: valor })}
                    />
                );
            case 'controladores_biologicos':
                return (
                    <ControladoresSection
                        plantas={[planta]}
                        caracterizacion={datos}
                        onCampoChange={(campo, valor) => setDatos({ ...datos, [campo]: valor })}
                    />
                );
            case 'polinizadores':
                return (
                    <PolinizadoresSection
                        plantas={[planta]}
                        caracterizacion={datos}
                        onCampoChange={(campo, valor) => setDatos({ ...datos, [campo]: valor })}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="border rounded-lg p-4 mb-4 bg-white shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                    {planta.label}
                </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {TIPOS_DIAGNOSTICO.map(tipo => (
                    <label key={tipo.value} className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={tiposSeleccionados.includes(tipo.value)}
                            onChange={(e) => onTipoChange(tipo.value, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{tipo.label}</span>
                    </label>
                ))}
            </div>
            {tiposSeleccionados.map(tipo => (
                <div key={tipo} className="mt-3 pl-4 border-l-2 border-blue-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">{TIPOS_DIAGNOSTICO.find(t => t.value === tipo)?.label}</div>
                    {renderCamposPorTipo(tipo)}
                </div>
            ))}
        </div>
    );
};

// ── Componente principal ──────────────────────────────────────────────────────

const DiagnosticoForm: React.FC<DiagnosticoFormProps> = ({
    isOpen,
    diagnostico,
    onSubmit, // se usará para cada diagnóstico individual
    onCancel,
    lotes = [],
    programas = [],
    monitoreos: externalMonitoreos,
    condiciones_dia = ['Soleado', 'Nublado', 'Lluvia'],
    currentUser,
    esEdicion = false,
    porcentajeMuestreo = 10,
}) => {
    const [paso, setPaso] = useState(1);

    // Paso 1
    const [programaId, setProgramaId] = useState<number | null>(null);
    const [tipoMonitoreoId, setTipoMonitoreoId] = useState<number | null>(null);
    const [loteId, setLoteId] = useState<number | null>(null);
    const [monitoreos, setMonitoreos] = useState<Monitoreo[]>(externalMonitoreos || []);
    const [estructuraLote, setEstructuraLote] = useState<EstructuraLote | null>(null);
    const [cargandoEstructura, setCargandoEstructura] = useState(false);
    const [plantasSeleccionadas, setPlantasSeleccionadas] = useState<PlantaBase[]>([]);
    const [plantasOriginales, setPlantasOriginales] = useState<PlantaBase[]>([]);

    // Paso 2: datos por planta y tipo
    const [condicionesDia, setCondicionesDia] = useState('');
    const [diagnosticosPorPlanta, setDiagnosticosPorPlanta] = useState<Record<string, { tipos: string[]; datos: Record<string, any> }>>({});
    const [enviando, setEnviando] = useState(false);

    // Reset al abrir en modo creación
    useEffect(() => {
        if (isOpen && !esEdicion) {
            setPaso(1);
            setProgramaId(null);
            setTipoMonitoreoId(null);
            setLoteId(null);
            setEstructuraLote(null);
            setPlantasOriginales([]);
            setPlantasSeleccionadas([]);
            setDiagnosticosPorPlanta({});
            setCondicionesDia('');
            setEnviando(false);
        }
    }, [isOpen, esEdicion]);

    // Función para seleccionar plantas al azar y ordenar
    const seleccionarPlantasAleatorias = useCallback((todas: PlantaBase[], porcentaje: number): PlantaBase[] => {
        if (!todas.length) return [];
        const cantidad = Math.max(1, Math.floor(todas.length * (porcentaje / 100)));
        const copia = [...todas];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia.slice(0, cantidad).sort((a, b) => {
            if (a.surco !== b.surco) return a.surco - b.surco;
            return a.planta - b.planta;
        });
    }, []);

    const regenerarSeleccionPlantas = useCallback(() => {
        if (plantasOriginales.length) {
            const nuevas = seleccionarPlantasAleatorias(plantasOriginales, porcentajeMuestreo);
            setPlantasSeleccionadas(nuevas);
            setDiagnosticosPorPlanta({});
            toast.info(`Seleccionadas ${nuevas.length} plantas (${porcentajeMuestreo}% de ${plantasOriginales.length})`);
        }
    }, [plantasOriginales, porcentajeMuestreo, seleccionarPlantasAleatorias]);

    // Cargar monitoreos
    useEffect(() => {
        if (!programaId) { setMonitoreos([]); return; }
        monitoreoService.obtenerMonitoreosPorPrograma(programaId)
            .then(setMonitoreos)
            .catch(() => toast.error('Error cargando tipos de monitoreo'));
    }, [programaId]);

    // Cargar estructura del lote
    useEffect(() => {
        const cargar = async () => {
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
                if (estructura.plantas?.length) {
                    setPlantasOriginales(estructura.plantas);
                    const seleccionadas = seleccionarPlantasAleatorias(estructura.plantas, porcentajeMuestreo);
                    setPlantasSeleccionadas(seleccionadas);
                    toast.success(`${estructura.total_plantas} plantas totales, muestreadas ${seleccionadas.length}`);
                } else {
                    toast.warning('Lote sin plantas configuradas');
                }
            } catch (error) {
                toast.error('Error cargando estructura del lote');
            } finally {
                setCargandoEstructura(false);
            }
        };
        cargar();
    }, [loteId, porcentajeMuestreo, seleccionarPlantasAleatorias]);

    // Manejar cambios en una planta
    const handlePlantaTipoChange = (plantaId: string, tipo: string, checked: boolean) => {
        setDiagnosticosPorPlanta(prev => {
            const actual = prev[plantaId] || { tipos: [], datos: {} };
            const nuevosTipos = checked
                ? [...actual.tipos, tipo]
                : actual.tipos.filter(t => t !== tipo);
            return {
                ...prev,
                [plantaId]: { ...actual, tipos: nuevosTipos }
            };
        });
    };

    const handlePlantaDatosChange = (plantaId: string, tipo: string, datos: any) => {
        setDiagnosticosPorPlanta(prev => {
            const actual = prev[plantaId] || { tipos: [], datos: {} };
            return {
                ...prev,
                [plantaId]: {
                    ...actual,
                    datos: { ...actual.datos, [tipo]: datos }
                }
            };
        });
    };

    // Envío múltiple
    const handleSubmitMultiple = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!condicionesDia) {
            toast.error('Selecciona las condiciones del día');
            return;
        }
        if (!programaId || !tipoMonitoreoId || !loteId) {
            toast.error('Faltan datos del paso 1');
            return;
        }

        const payloads: DiagnosticoPayload[] = [];
        for (const planta of plantasSeleccionadas) {
            const config = diagnosticosPorPlanta[planta.codigo];
            if (!config?.tipos.length) continue;
            for (const tipo of config.tipos) {
                const datos = config.datos[tipo] || {};
                payloads.push({
                    programa_id: programaId,
                    tipo_monitoreo_id: tipoMonitoreoId,
                    lote_id: loteId,
                    usuario_id: currentUser?.id,
                    tipo_diagnostico: tipo,
                    condiciones_dia: condicionesDia,
                    formulario: {
                        plantas: [planta],
                        caracterizacion: datos,
                        porcentaje_muestreo: porcentajeMuestreo,
                        total_plantas_lote: estructuraLote?.total_plantas || 0,
                    }
                });
            }
        }

        if (payloads.length === 0) {
            toast.warning('Selecciona al menos un tipo de diagnóstico para alguna planta');
            return;
        }

        setEnviando(true);
        try {
            // Enviar todos en paralelo
            const results = await Promise.allSettled(payloads.map(p => onSubmit(p)));
            const errores = results.filter(r => r.status === 'rejected');
            if (errores.length === 0) {
                toast.success(`${payloads.length} diagnósticos creados exitosamente`);
                // Limpiar solo los checkboxes y datos, pero mantener plantas y paso 1
                setDiagnosticosPorPlanta({});
                setCondicionesDia('');
            } else {
                toast.error(`${errores.length} de ${payloads.length} diagnósticos fallaron`);
            }
        } catch (error) {
            toast.error('Error al crear diagnósticos');
        } finally {
            setEnviando(false);
        }
    };

    // Validación para avanzar al paso 2
    const handleSiguiente = () => {
        if (!programaId) { toast.warning('Selecciona programa'); return; }
        if (!tipoMonitoreoId) { toast.warning('Selecciona tipo de monitoreo'); return; }
        if (!loteId) { toast.warning('Selecciona lote'); return; }
        if (!estructuraLote || estructuraLote.total_plantas === 0) {
            toast.error('El lote no tiene plantas configuradas');
            return;
        }
        if (plantasSeleccionadas.length === 0) {
            toast.error('No hay plantas seleccionadas');
            return;
        }
        setPaso(2);
    };

    const lotesFiltrados = useMemo(() => {
        if (!programaId) return [];
        return lotes.filter(l => l.programa_id === programaId);
    }, [lotes, programaId]);

    const programaSeleccionado = useMemo(() => programas.find(p => p.id === programaId), [programas, programaId]);
    const loteSeleccionado = useMemo(() => lotesFiltrados.find(l => l.id === loteId), [lotesFiltrados, loteId]);

    return (
        <div className="p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 border-b pb-3">
                {esEdicion ? 'Editar Diagnóstico' : 'Registro Múltiple de Diagnósticos'}
            </h2>

            {/* Pasos */}
            <div className="flex mb-6">
                <div className={`flex-1 text-center py-2 rounded-l-lg text-sm font-medium ${paso === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    Paso 1: Programa, monitoreo y lote
                </div>
                <div className={`flex-1 text-center py-2 rounded-r-lg text-sm font-medium ${paso === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    Paso 2: Seleccionar diagnósticos por planta
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
                                setDiagnosticosPorPlanta({});
                            }}
                            className="w-full border rounded-lg p-3"
                            disabled={esEdicion}
                        >
                            <option value="">Seleccionar programa</option>
                            {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                    </div>

                    {/* Tipo de monitoreo */}
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
                                        disabled={esEdicion}
                                    >
                                        <i className="fas fa-chart-line mr-2"></i>
                                        <span className="font-medium">{m.nombre}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Lote */}
                    {tipoMonitoreoId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Lote *</label>
                            <select
                                value={loteId?.toString() || ''}
                                onChange={(e) => setLoteId(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full border rounded-lg p-3"
                                disabled={cargandoEstructura || esEdicion}
                            >
                                <option value="">Seleccionar lote</option>
                                {lotesFiltrados.map(l => (
                                    <option key={l.id} value={l.id}>
                                        {l.nombre} {l.granja_nombre ? `(${l.granja_nombre})` : ''}
                                        {l.surcos && l.plantas_por_surco ? ` - ${l.surcos} surcos, ${l.plantas_por_surco} plantas/surco` : ' - Sin configurar'}
                                    </option>
                                ))}
                            </select>
                            {loteSeleccionado && estructuraLote && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                <strong>Configuración:</strong> {estructuraLote.surcos} surcos × {estructuraLote.plantas_por_surco} plantas/surco
                                            </p>
                                            <p className="text-sm text-green-600">
                                                <strong>Total plantas:</strong> {estructuraLote.total_plantas.toLocaleString()}
                                            </p>
                                            <p className="text-sm text-blue-600">
                                                <strong>Plantas a muestrear:</strong> {plantasSeleccionadas.length} ({porcentajeMuestreo}%)
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={regenerarSeleccionPlantas}
                                            className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg"
                                        >
                                            <i className="fas fa-random"></i> Regenerar muestra
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleSiguiente}
                            disabled={!programaId || !tipoMonitoreoId || !loteId || !estructuraLote?.total_plantas || plantasSeleccionadas.length === 0}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            Siguiente <i className="fas fa-arrow-right ml-2"></i>
                        </button>
                    </div>
                </div>
            )}

            {paso === 2 && (
                <form onSubmit={handleSubmitMultiple}>
                    <div className="space-y-6">
                        {/* Resumen */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Resumen</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                        <span><strong>Programa:</strong> {programaSeleccionado?.nombre || '—'}</span>
                                        <span><strong>Monitoreo:</strong> {monitoreos.find(m => m.id === tipoMonitoreoId)?.nombre || '—'}</span>
                                        <span><strong>Lote:</strong> {loteSeleccionado?.nombre || '—'}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        {estructuraLote?.surcos} surcos × {estructuraLote?.plantas_por_surco} plantas/surco = {estructuraLote?.total_plantas.toLocaleString()} plantas
                                        <span className="ml-2 text-blue-600">| Muestreadas: {plantasSeleccionadas.length}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPaso(1)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    <i className="fas fa-edit"></i> Cambiar
                                </button>
                            </div>
                        </div>

                        {/* Condiciones del día */}
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

                        {/* Lista de plantas con checkboxes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Plantas seleccionadas ({plantasSeleccionadas.length})
                            </label>
                            <div className="max-h-[60vh] overflow-y-auto space-y-4">
                                {plantasSeleccionadas.map(planta => (
                                    <PlantaDiagnosticoForm
                                        key={planta.codigo}
                                        planta={planta}
                                        tiposSeleccionados={diagnosticosPorPlanta[planta.codigo]?.tipos || []}
                                        onTipoChange={(tipo, checked) => handlePlantaTipoChange(planta.codigo, tipo, checked)}
                                        datosPorTipo={diagnosticosPorPlanta[planta.codigo]?.datos || {}}
                                        onDatosChange={(tipo, datos) => handlePlantaDatosChange(planta.codigo, tipo, datos)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex justify-end gap-3 pt-5 border-t">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-5 py-2.5 border rounded-lg hover:bg-gray-100"
                                disabled={enviando}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={!condicionesDia || Object.keys(diagnosticosPorPlanta).every(k => !diagnosticosPorPlanta[k]?.tipos.length) || enviando}
                                className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
                            >
                                {enviando ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-save"></i>
                                        Guardar todos los diagnósticos
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};

export default DiagnosticoForm;