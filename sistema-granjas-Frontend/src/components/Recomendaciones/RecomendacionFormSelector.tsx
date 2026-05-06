// src/components/Recomendaciones/RecomendacionFormSelector.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import type { Recomendacion } from '../../types/recomendacionTypes';
import { monitoreoService, type Monitoreo } from '../../services/monitoreoService';
import {
  diagnosticoDinamicoService,
  type DiagnosticoTipo,
  type CampoRecomendacion,
} from '../../services/diagnosticoDinamicoService';
import { loteService } from '../../services/loteService';

interface RecomendacionFormSelectorProps {
    recomendacion?: Recomendacion;
    onSubmit: (data: any) => void;
    onCancel: () => void;
    lotes: any[];
    docentes: any[];
    currentUser: any;
    esEdicion?: boolean;
    programas?: any[];
    programaInicial?: any;
    diagnosticoIdInicial?: number;
    loteIdInicial?: number;
}

const TIPOS_DATO_LABELS: Record<string, string> = {
    text: 'Texto', textarea: 'Texto largo', number: 'Número',
    date: 'Fecha', select: 'Selección', boolean: 'Sí / No',
};

const RecomendacionFormSelector: React.FC<RecomendacionFormSelectorProps> = ({
    recomendacion,
    onSubmit,
    onCancel,
    lotes,
    docentes,
    currentUser,
    esEdicion = false,
    programas = [],
    programaInicial,
    diagnosticoIdInicial,
    loteIdInicial,
}) => {
    // Step tracking
    const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1);

    // Selections
    const [programaId, setProgramaId] = useState<number | null>(null);
    const [monitoreoId, setMonitoreoId] = useState<number | null>(null);
    const [subtipoId, setSubtipoId] = useState<number | null>(null);

    // Data
    const [monitoreos, setMonitoreos] = useState<Monitoreo[]>([]);
    const [subtipos, setSubtipos] = useState<DiagnosticoTipo[]>([]);
    const [campos, setCampos] = useState<CampoRecomendacion[]>([]);
    const [loadingMonitoreos, setLoadingMonitoreos] = useState(false);
    const [loadingSubtipos, setLoadingSubtipos] = useState(false);
    const [loadingCampos, setLoadingCampos] = useState(false);

    // Form fields
    const [loteId, setLoteId] = useState<number | null>(null);
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [estado, setEstado] = useState('pendiente');
    const [formulario, setFormulario] = useState<Record<string, any>>({});
    const [submitting, setSubmitting] = useState(false);

    const programaSeleccionado = programas.find(p => p.id === programaId) || null;
    const monitoreoSeleccionado = monitoreos.find(m => m.id === monitoreoId) || null;
    const subtipoSeleccionado = subtipos.find(s => s.id === subtipoId) || null;
    const lotesFiltrados = lotes.filter(l => l.programa_id === programaId);
    const loteSeleccionado = lotes.find(l => l.id === loteId) || null;

    // Init program from context
    useEffect(() => {
        const prog = programaInicial || (loteIdInicial && lotes.length > 0
            ? programas.find(p => p.id === lotes.find(l => l.id === loteIdInicial)?.programa_id)
            : null)
            || (programas.length === 1 ? programas[0] : null);
        if (prog) setProgramaId(prog.id);
    }, [programaInicial, loteIdInicial, programas, lotes]);

    useEffect(() => {
        if (loteIdInicial) setLoteId(loteIdInicial);
    }, [loteIdInicial]);

    // Load monitoreos when program changes
    useEffect(() => {
        if (!programaId) { setMonitoreos([]); return; }
        setLoadingMonitoreos(true);
        monitoreoService.obtenerMonitoreosPorPrograma(programaId)
            .then(data => setMonitoreos(Array.isArray(data) ? data : []))
            .catch(() => toast.error('Error al cargar tipos de monitoreo'))
            .finally(() => setLoadingMonitoreos(false));
    }, [programaId]);

    // Load subtipos when monitoreo changes
    useEffect(() => {
        if (!monitoreoId) { setSubtipos([]); return; }
        setLoadingSubtipos(true);
        diagnosticoDinamicoService.listarSubtiposPorMonitoreo(monitoreoId)
            .then(data => setSubtipos(data.filter(s => s.activo)))
            .catch(() => toast.error('Error al cargar subtipos'))
            .finally(() => setLoadingSubtipos(false));
    }, [monitoreoId]);

    // Load campos when subtipo changes
    useEffect(() => {
        if (!subtipoId) { setCampos([]); return; }
        setLoadingCampos(true);
        diagnosticoDinamicoService.listarCamposRecomendacion(subtipoId)
            .then(data => {
                const sorted = [...data].sort((a, b) => a.orden - b.orden);
                setCampos(sorted);
                setFormulario({});
            })
            .catch(() => toast.error('Error al cargar campos'))
            .finally(() => setLoadingCampos(false));
    }, [subtipoId]);

    const handleFormularioChange = (nombre: string, valor: any) => {
        setFormulario(prev => ({ ...prev, [nombre]: valor }));
    };

    const canGoToStep2 = Boolean(programaId);
    const canGoToStep3 = Boolean(programaId && monitoreoId);
    const canGoToStep4 = Boolean(programaId && monitoreoId && subtipoId);

    const handleSubmit = async () => {
        if (!programaId || !monitoreoId || !subtipoId) { toast.warning('Completa todos los pasos'); return; }
        if (!loteId) { toast.warning('Selecciona un lote'); return; }
        if (!titulo.trim()) { toast.warning('El título es requerido'); return; }
        if (!descripcion.trim() || descripcion.trim().length < 10) { toast.warning('La descripción debe tener al menos 10 caracteres'); return; }

        // Validate required campos
        for (const campo of campos) {
            if (campo.requerido && !formulario[campo.nombre_campo]) {
                toast.warning(`El campo "${campo.etiqueta}" es requerido`);
                return;
            }
        }

        const docenteId = currentUser?.id || docentes[0]?.id;
        if (!docenteId) { toast.error('No se pudo determinar el autor'); return; }

        setSubmitting(true);
        try {
            await onSubmit({
                titulo: titulo.trim(),
                descripcion: descripcion.trim(),
                estado,
                lote_id: loteId,
                subtipo_id: subtipoId,
                formulario_recomendacion: Object.keys(formulario).length > 0 ? formulario : null,
                docente_id: docenteId,
                diagnostico_id: diagnosticoIdInicial || null,
                items_sugeridos: [],
            });
        } catch (e: any) {
            toast.error(e?.message || 'Error al crear la recomendación');
        } finally {
            setSubmitting(false);
        }
    };

    const renderCampoInput = (campo: CampoRecomendacion) => {
        const val = formulario[campo.nombre_campo] ?? '';
        const base = "w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400";
        switch (campo.tipo_dato) {
            case 'textarea':
                return <textarea value={val} onChange={e => handleFormularioChange(campo.nombre_campo, e.target.value)} className={base} rows={3} required={campo.requerido} />;
            case 'number':
                return <input type="number" value={val} onChange={e => handleFormularioChange(campo.nombre_campo, e.target.value)} className={base} required={campo.requerido} />;
            case 'date':
                return <input type="date" value={val} onChange={e => handleFormularioChange(campo.nombre_campo, e.target.value)} className={base} required={campo.requerido} />;
            case 'select':
                return (
                    <select value={val} onChange={e => handleFormularioChange(campo.nombre_campo, e.target.value)} className={base} required={campo.requerido}>
                        <option value="">Seleccionar...</option>
                        {(campo.opciones || []).map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                );
            case 'boolean':
                return (
                    <select value={val} onChange={e => handleFormularioChange(campo.nombre_campo, e.target.value)} className={base} required={campo.requerido}>
                        <option value="">Seleccionar...</option>
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                    </select>
                );
            default:
                return <input type="text" value={val} onChange={e => handleFormularioChange(campo.nombre_campo, e.target.value)} className={base} required={campo.requerido} />;
        }
    };

    return (
        <div className="p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-1">
                {esEdicion ? 'Editar Recomendación' : 'Nueva Recomendación'}
                {diagnosticoIdInicial && (
                    <span className="ml-2 text-sm font-normal text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                        Vinculada al Diagnóstico #{diagnosticoIdInicial}
                    </span>
                )}
            </h2>
            <p className="text-sm text-gray-500 mb-6">Selecciona el programa, tipo de monitoreo y subtipo para cargar el formulario dinámico.</p>

            {/* ── Paso 1: Programa ─────────────────────────────────────────── */}
            <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-orange-500 text-white rounded-full text-xs mr-1">1</span>
                    Programa *
                </label>
                <select value={programaId || ''} onChange={e => { setProgramaId(e.target.value ? parseInt(e.target.value) : null); setMonitoreoId(null); setSubtipoId(null); setPaso(1); }}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="">Seleccionar programa...</option>
                    {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
            </div>

            {/* ── Paso 2: Tipo de Monitoreo ─────────────────────────────────── */}
            {programaId && (
                <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-orange-500 text-white rounded-full text-xs mr-1">2</span>
                        Tipo de Monitoreo *
                    </label>
                    {loadingMonitoreos ? (
                        <div className="flex items-center text-gray-500 text-sm py-2"><div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full mr-2"></div>Cargando...</div>
                    ) : monitoreos.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                            <i className="fas fa-exclamation-triangle mr-1"></i>
                            Este programa no tiene tipos de monitoreo. Configúralos en el módulo de Diagnósticos.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {monitoreos.map(m => (
                                <button key={m.id} type="button" onClick={() => { setMonitoreoId(m.id); setSubtipoId(null); setPaso(2); }}
                                    className={`p-3 border-2 rounded-lg text-sm text-center transition ${monitoreoId === m.id ? 'border-orange-500 bg-orange-50 text-orange-700 font-medium' : 'border-gray-200 hover:border-orange-300'}`}>
                                    <i className="fas fa-leaf block text-lg mb-1"></i>
                                    {m.nombre}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Paso 3: Subtipo ───────────────────────────────────────────── */}
            {programaId && monitoreoId && (
                <div className="mb-5">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-orange-500 text-white rounded-full text-xs mr-1">3</span>
                        Subtipo de Monitoreo *
                    </label>
                    {loadingSubtipos ? (
                        <div className="flex items-center text-gray-500 text-sm py-2"><div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full mr-2"></div>Cargando...</div>
                    ) : subtipos.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                            <i className="fas fa-exclamation-triangle mr-1"></i>
                            No hay subtipos activos para <strong>{monitoreoSeleccionado?.nombre}</strong>. Configúralos en el módulo de Diagnósticos.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {subtipos.map(s => (
                                <button key={s.id} type="button" onClick={() => { setSubtipoId(s.id); setPaso(3); }}
                                    className={`p-3 border-2 rounded-lg text-sm text-center transition ${subtipoId === s.id ? 'border-orange-500 bg-orange-50 text-orange-700 font-medium' : 'border-gray-200 hover:border-orange-300'}`}>
                                    <i className="fas fa-clipboard-list block text-lg mb-1"></i>
                                    {s.nombre}
                                    {s.descripcion && <span className="text-xs text-gray-500 block">{s.descripcion}</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Paso 4: Formulario ────────────────────────────────────────── */}
            {programaId && monitoreoId && subtipoId && (
                <div className="space-y-5">
                    {/* Summary badge */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 text-sm text-orange-800 flex flex-wrap gap-3">
                        <span><strong>Programa:</strong> {programaSeleccionado?.nombre}</span>
                        <span>›</span>
                        <span><strong>Monitoreo:</strong> {monitoreoSeleccionado?.nombre}</span>
                        <span>›</span>
                        <span><strong>Subtipo:</strong> {subtipoSeleccionado?.nombre}</span>
                    </div>

                    <div className="h-px bg-gray-200 my-2"></div>

                    {/* Lote */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lote *</label>
                        <select value={loteId || ''} onChange={e => setLoteId(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400" required>
                            <option value="">Seleccionar lote...</option>
                            {lotesFiltrados.map(l => <option key={l.id} value={l.id}>{l.nombre}{l.granja_nombre ? ` (${l.granja_nombre})` : ''}</option>)}
                        </select>
                        {lotesFiltrados.length === 0 && <p className="text-xs text-yellow-600 mt-1">No hay lotes para este programa.</p>}
                    </div>

                    {/* Título */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                        <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
                            placeholder="Título de la recomendación..." required />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
                            rows={3} placeholder="Descripción detallada..." required />
                    </div>

                    {/* Estado */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select value={estado} onChange={e => setEstado(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400">
                            <option value="pendiente">Pendiente</option>
                            <option value="aprobada">Aprobada</option>
                            <option value="en_ejecucion">En ejecución</option>
                            <option value="completada">Completada</option>
                            <option value="cancelada">Cancelada</option>
                        </select>
                    </div>

                    {/* Dynamic campos */}
                    {loadingCampos ? (
                        <div className="flex items-center text-gray-500 text-sm py-2"><div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full mr-2"></div>Cargando campos del formulario...</div>
                    ) : campos.length > 0 ? (
                        <div className="border border-orange-200 rounded-xl p-4 bg-orange-50">
                            <h4 className="font-semibold text-orange-800 mb-4 text-sm">
                                <i className="fas fa-wpforms mr-1"></i>
                                Formulario: {subtipoSeleccionado?.nombre}
                            </h4>
                            <div className="space-y-4">
                                {campos.map(campo => (
                                    <div key={campo.id}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {campo.etiqueta}
                                            {campo.requerido && <span className="text-red-500 ml-1">*</span>}
                                            <span className="ml-2 text-xs text-gray-400">({TIPOS_DATO_LABELS[campo.tipo_dato]})</span>
                                        </label>
                                        {renderCampoInput(campo)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-500 text-center">
                            <i className="fas fa-info-circle mr-1"></i>
                            Este subtipo no tiene campos de recomendación configurados. Puedes agregarlos en el módulo de Diagnósticos → Tipos.
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="button" onClick={handleSubmit} disabled={submitting || !loteId || !titulo || !descripcion}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-lg font-medium disabled:bg-gray-400">
                            {submitting ? 'Guardando...' : (esEdicion ? 'Actualizar' : 'Crear Recomendación')}
                        </button>
                    </div>
                </div>
            )}

            {/* If no selection yet, show placeholder */}
            {!programaId && (
                <div className="text-center text-gray-400 py-8">
                    <i className="fas fa-info-circle text-4xl mb-2 block"></i>
                    <p>Selecciona un programa para comenzar</p>
                </div>
            )}
        </div>
    );
};

export default RecomendacionFormSelector;
