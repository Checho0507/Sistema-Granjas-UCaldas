import React, { useState, useEffect } from 'react';
import type { Recomendacion, Evidencia } from '../../types/recomendacionTypes';
import Modal from '../Common/Modal';
import recomendacionService from '../../services/recomendacionService';
import loteService from '../../services/loteService';
import granjaService from '../../services/granjaService';
import diagnosticoService from '../../services/diagnosticoService';
import { exportarRecomendacionPDF } from '../../utils/pdfExport';

interface Props {
    isOpen: boolean;
    recomendacion: Recomendacion | null;
    onClose: () => void;
}

type Pestana = 'info' | 'contexto' | 'evidencias';

const ESTADO_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
    pendiente:    { label: 'Pendiente',    bg: 'bg-amber-100',  text: 'text-amber-800',  icon: 'fas fa-clock' },
    aprobada:     { label: 'Aprobada',     bg: 'bg-emerald-100',text: 'text-emerald-800',icon: 'fas fa-check-circle' },
    rechazada:    { label: 'Rechazada',    bg: 'bg-red-100',    text: 'text-red-800',    icon: 'fas fa-times-circle' },
    en_ejecucion: { label: 'En ejecución', bg: 'bg-blue-100',   text: 'text-blue-800',   icon: 'fas fa-play-circle' },
    completada:   { label: 'Completada',   bg: 'bg-purple-100', text: 'text-purple-800', icon: 'fas fa-flag-checkered' },
};

const EVIDENCIA_ICONS: Record<string, string> = {
    imagen: 'fas fa-image text-blue-500',
    video: 'fas fa-video text-red-500',
    documento: 'fas fa-file-alt text-green-500',
    audio: 'fas fa-volume-up text-purple-500',
};

const DetallesRecomendacionModal: React.FC<Props> = ({ isOpen, recomendacion, onClose }) => {
    const [data, setData] = useState<Recomendacion | null>(null);
    const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
    const [loteInfo, setLoteInfo] = useState<any>(null);
    const [granjaInfo, setGranjaInfo] = useState<any>(null);
    const [diagnosticoInfo, setDiagnosticoInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [loadingEvidencias, setLoadingEvidencias] = useState(false);
    const [pestana, setPestana] = useState<Pestana>('info');
    const [loadingPDF, setLoadingPDF] = useState(false);

    useEffect(() => {
        if (!isOpen || !recomendacion) return;
        setData(recomendacion);
        setLoteInfo(null);
        setGranjaInfo(null);
        setDiagnosticoInfo(null);
        setPestana('info');

        setLoading(true);
        recomendacionService.obtenerRecomendacionPorId(recomendacion.id)
            .then(setData)
            .catch(() => {})
            .finally(() => setLoading(false));

        setLoadingEvidencias(true);
        recomendacionService.obtenerEvidencias(recomendacion.id)
            .then(d => setEvidencias(Array.isArray(d) ? d : (d?.items || [])))
            .catch(() => setEvidencias([]))
            .finally(() => setLoadingEvidencias(false));

        if (recomendacion.lote_id) {
            loteService.obtenerLote(recomendacion.lote_id)
                .then(lote => {
                    setLoteInfo(lote);
                    if (lote?.granja_id) {
                        granjaService.obtenerGranjaPorId(lote.granja_id)
                            .then(setGranjaInfo)
                            .catch(() => {});
                    }
                })
                .catch(() => {});
        }
        if (recomendacion.diagnostico_id) {
            diagnosticoService.obtenerDiagnosticoPorId(recomendacion.diagnostico_id)
                .then(setDiagnosticoInfo)
                .catch(() => {});
        }
    }, [isOpen, recomendacion]);

    if (!isOpen || !recomendacion) return null;
    const d = data || recomendacion;

    const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    const estadoConf = ESTADO_CONFIG[d.estado] || { label: d.estado, bg: 'bg-gray-100', text: 'text-gray-800', icon: 'fas fa-circle' };

    const estadoBadge = (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${estadoConf.bg} ${estadoConf.text} border border-white/30`}>
            <i className={estadoConf.icon}></i>
            {estadoConf.label}
        </span>
    );

    const tabs: { id: Pestana; label: string; icon: string; count?: number }[] = [
        { id: 'info',       label: 'Información',  icon: 'fas fa-info-circle' },
        { id: 'contexto',   label: 'Contexto',     icon: 'fas fa-link' },
        { id: 'evidencias', label: 'Evidencias',   icon: 'fas fa-paperclip', count: evidencias.length },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} width="max-w-4xl" showCloseButton={false}>
            <div className="flex flex-col max-h-[92vh]">

                {/* ── Header ── */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-5 rounded-t-lg flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <i className="fas fa-clipboard-check text-white text-xl"></i>
                            </div>
                            <div>
                                <p className="text-green-200 text-xs font-medium uppercase tracking-wider mb-0.5">Recomendación</p>
                                <h2 className="text-white text-xl font-bold leading-tight max-w-md truncate">
                                    #{d.id} — {d.titulo || 'Sin título'}
                                </h2>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/15 rounded-xl p-2 transition-colors">
                            <i className="fas fa-times text-lg"></i>
                        </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                        {estadoBadge}
                        {d.tipo && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white">
                                <i className="fas fa-tag"></i>
                                {d.tipo}
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white">
                            <i className="fas fa-calendar-alt"></i>
                            {fmtDate(d.fecha_creacion)}
                        </span>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="bg-white border-b border-gray-200 px-6 flex gap-1 flex-shrink-0">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setPestana(t.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                pestana === t.id
                                    ? 'text-green-700 border-green-600'
                                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <i className={t.icon}></i>
                            {t.label}
                            {t.count !== undefined && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${pestana === t.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 text-sm">Cargando detalles...</p>
                        </div>
                    ) : (
                        <>
                        {/* ── Información ── */}
                        {pestana === 'info' && (
                            <div className="space-y-5">
                                {/* Descripción */}
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                                            <i className="fas fa-align-left text-green-600 text-sm"></i>
                                        </div>
                                        <h3 className="font-semibold text-gray-800">Descripción</h3>
                                    </div>
                                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line bg-gray-50 rounded-lg p-4 border border-gray-100">
                                        {d.descripcion || <span className="text-gray-400 italic">Sin descripción</span>}
                                    </p>
                                </div>

                                {/* Datos generales */}
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                            <i className="fas fa-info-circle text-blue-600 text-sm"></i>
                                        </div>
                                        <h3 className="font-semibold text-gray-800">Datos generales</h3>
                                    </div>
                                    <div className="space-y-0 divide-y divide-gray-50">
                                        {[
                                            { label: 'Tipo', value: d.tipo || '—' },
                                            { label: 'Docente', value: d.docente_nombre || 'Sin asignar' },
                                            { label: 'Fecha creación', value: fmtDate(d.fecha_creacion) },
                                            ...(d.fecha_aprobacion ? [{ label: 'Fecha aprobación', value: fmtDate(d.fecha_aprobacion) }] : []),
                                        ].map(row => (
                                            <div key={row.label} className="flex justify-between items-center py-2.5 text-sm">
                                                <span className="text-gray-500">{row.label}</span>
                                                <span className="font-medium text-gray-800">{row.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Estado y seguimiento */}
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                                            <i className="fas fa-chart-line text-purple-600 text-sm"></i>
                                        </div>
                                        <h3 className="font-semibold text-gray-800">Estado y seguimiento</h3>
                                    </div>
                                    <div className="flex items-center justify-between py-2 text-sm">
                                        <span className="text-gray-500">Estado actual</span>
                                        {estadoBadge}
                                    </div>
                                    {d.labores_count !== undefined && (
                                        <div className="flex items-center justify-between py-2 border-t border-gray-50 text-sm">
                                            <span className="text-gray-500">Labores asociadas</span>
                                            <span className="font-semibold text-gray-800 bg-gray-100 px-2.5 py-0.5 rounded-full">{d.labores_count}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Contexto ── */}
                        {pestana === 'contexto' && (
                            <div className="space-y-5">
                                {/* Lote */}
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                            <i className="fas fa-th-large text-emerald-600 text-sm"></i>
                                        </div>
                                        <h3 className="font-semibold text-gray-800">Lote</h3>
                                    </div>
                                    {loteInfo ? (
                                        <div className="space-y-0 divide-y divide-gray-50">
                                            {[
                                                { label: 'Nombre', value: loteInfo.nombre },
                                                ...(loteInfo.cultivo_nombre ? [{ label: 'Cultivo', value: loteInfo.cultivo_nombre }] : []),
                                                ...(loteInfo.tipo_gestion ? [{ label: 'Tipo gestión', value: loteInfo.tipo_gestion }] : []),
                                            ].map(r => (
                                                <div key={r.label} className="flex justify-between py-2.5 text-sm">
                                                    <span className="text-gray-500">{r.label}</span>
                                                    <span className="font-medium text-gray-800">{r.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">{d.lote_nombre || (d.lote_id ? `Lote #${d.lote_id}` : 'Sin lote asignado')}</p>
                                    )}
                                </div>

                                {/* Granja */}
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                                            <i className="fas fa-tractor text-green-600 text-sm"></i>
                                        </div>
                                        <h3 className="font-semibold text-gray-800">Granja</h3>
                                    </div>
                                    {granjaInfo ? (
                                        <div className="space-y-0 divide-y divide-gray-50">
                                            {[
                                                { label: 'Nombre', value: granjaInfo.nombre },
                                                ...(granjaInfo.ubicacion ? [{ label: 'Ubicación', value: granjaInfo.ubicacion }] : []),
                                            ].map(r => (
                                                <div key={r.label} className="flex justify-between py-2.5 text-sm">
                                                    <span className="text-gray-500">{r.label}</span>
                                                    <span className="font-medium text-gray-800">{r.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">{d.granja_nombre || 'Sin granja asociada'}</p>
                                    )}
                                </div>

                                {/* Diagnóstico */}
                                {(d.diagnostico_id || diagnosticoInfo) && (
                                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                                <i className="fas fa-microscope text-indigo-600 text-sm"></i>
                                            </div>
                                            <h3 className="font-semibold text-gray-800">Diagnóstico asociado</h3>
                                        </div>
                                        {diagnosticoInfo ? (
                                            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-gray-800 text-sm">#{diagnosticoInfo.id}</span>
                                                    <span className="text-gray-600 text-sm">{diagnosticoInfo.tipo?.replace(/_/g, ' ')}</span>
                                                    {diagnosticoInfo.estado && (
                                                        <span className="ml-auto text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{diagnosticoInfo.estado}</span>
                                                    )}
                                                </div>
                                                {diagnosticoInfo.descripcion && (
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{diagnosticoInfo.descripcion}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">Diagnóstico #{d.diagnostico_id}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Evidencias ── */}
                        {pestana === 'evidencias' && (
                            <div>
                                {loadingEvidencias ? (
                                    <div className="flex flex-col items-center justify-center py-16">
                                        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                        <p className="text-gray-500 text-sm">Cargando evidencias...</p>
                                    </div>
                                ) : evidencias.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                                            <i className="fas fa-folder-open text-3xl text-gray-300"></i>
                                        </div>
                                        <p className="font-medium text-gray-500">Sin evidencias</p>
                                        <p className="text-sm mt-1">No hay archivos adjuntos en esta recomendación</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {evidencias.map(ev => (
                                            <div key={ev.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                                                <div className="p-4 border-b border-gray-50">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <i className={EVIDENCIA_ICONS[ev.tipo] || 'fas fa-file text-gray-400'}></i>
                                                        <span className="font-medium text-sm capitalize text-gray-800">{ev.tipo}</span>
                                                    </div>
                                                    {ev.descripcion && <p className="text-xs text-gray-500 truncate">{ev.descripcion}</p>}
                                                </div>
                                                <div className="p-4 space-y-2">
                                                    <a href={ev.url_archivo} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1.5 hover:underline">
                                                        <i className="fas fa-external-link-alt text-xs"></i>
                                                        Ver archivo
                                                    </a>
                                                    <p className="text-xs text-gray-400">Por: {ev.usuario_nombre || 'Usuario'}</p>
                                                    <p className="text-xs text-gray-400">{new Date(ev.fecha_creacion).toLocaleDateString('es-CO')}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        </>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center flex-shrink-0">
                    <button
                        onClick={async () => {
                            setLoadingPDF(true);
                            try { exportarRecomendacionPDF(d, loteInfo, granjaInfo, diagnosticoInfo, evidencias); }
                            finally { setLoadingPDF(false); }
                        }}
                        disabled={loadingPDF || !d}
                        className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        {loadingPDF
                            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Generando...</>
                            : <><i className="fas fa-file-pdf"></i>Exportar PDF</>
                        }
                    </button>
                    <button onClick={onClose} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DetallesRecomendacionModal;
