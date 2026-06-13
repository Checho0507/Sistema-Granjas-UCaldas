import React, { useState, useEffect } from 'react';
import type { DiagnosticoDetalle } from '../../types/diagnosticoTypes';
import Modal from '../Common/Modal';
import diagnosticoService from '../../services/diagnosticoService';
import { exportarDiagnosticoPDF } from '../../utils/pdfExport';

interface DetallesDiagnosticoModalProps {
    isOpen: boolean;
    diagnostico: DiagnosticoDetalle | null;
    onClose: () => void;
}

type Pestana = 'general' | 'plantas' | 'fotos';

const CONDICION_ICONS: Record<string, string> = {
    soleado: 'fas fa-sun text-yellow-500',
    nublado: 'fas fa-cloud text-gray-400',
    lluvia: 'fas fa-cloud-rain text-blue-400',
};

const DetallesDiagnosticoModal: React.FC<DetallesDiagnosticoModalProps> = ({ isOpen, diagnostico, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<DiagnosticoDetalle | null>(null);
    const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);
    const [pestana, setPestana] = useState<Pestana>('general');
    const [loadingPDF, setLoadingPDF] = useState(false);

    useEffect(() => {
        if (isOpen && diagnostico) {
            setData(diagnostico);
            setPestana('general');
            setImagenSeleccionada(null);
            setLoading(true);
            diagnosticoService.obtenerDiagnosticoPorId(diagnostico.id)
                .then(setData)
                .catch(() => {})
                .finally(() => setLoading(false));
        }
    }, [isOpen, diagnostico]);

    if (!diagnostico) return null;
    const d = data || diagnostico;

    const fotosSubidas = d.formulario?.fotos_subidas as Record<string, string[]> | undefined;
    const tieneFotos = fotosSubidas && Object.keys(fotosSubidas).length > 0;
    const totalFotos = tieneFotos ? Object.values(fotosSubidas!).flat().length : 0;
    const tienePlantas = !!d.formulario?.plantas?.length;
    const tieneCaracterizacion = d.formulario?.caracterizacion && Object.keys(d.formulario.caracterizacion).length > 0;
    const tieneFormulariosPorPlanta = d.formulario?.formularios_por_planta && Object.keys(d.formulario.formularios_por_planta).length > 0;
    const tieneEvaluacion = tienePlantas || tieneCaracterizacion || tieneFormulariosPorPlanta;

    const fmtKey = (k: string) => k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const fmtDate = (s: string) => new Date(s).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    const parseVal = (v: any): string => {
        if (typeof v === 'string' && (v.startsWith('[') || v.startsWith('{'))) {
            try {
                const p = JSON.parse(v);
                if (Array.isArray(p)) return p.join(', ');
            } catch {}
        }
        return String(v ?? '—');
    };

    const estadoBadge = d.estado_revision === 'revisado'
        ? <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Revisado</span>
        : <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>Pendiente de revisión</span>;

    const tabs: { id: Pestana; label: string; icon: string; count?: number; show: boolean }[] = [
        { id: 'general', label: 'Información general', icon: 'fas fa-info-circle', show: true },
        { id: 'plantas', label: 'Evaluación', icon: 'fas fa-seedling', count: d.formulario?.plantas?.length, show: tieneEvaluacion },
        { id: 'fotos', label: 'Evidencias', icon: 'fas fa-camera', count: totalFotos, show: !!tieneFotos },
    ];

    return (
        <>
        <Modal isOpen={isOpen} onClose={onClose} width="max-w-6xl" showCloseButton={false}>
            <div className="flex flex-col max-h-[92vh]">

                {/* ── Header ── */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-5 rounded-t-lg flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <i className="fas fa-microscope text-white text-xl"></i>
                            </div>
                            <div>
                                <p className="text-green-200 text-xs font-medium uppercase tracking-wider mb-0.5">Diagnóstico</p>
                                <h2 className="text-white text-2xl font-bold leading-tight">
                                    #{d.id} — {d.tipo_diagnostico?.replace(/_/g, ' ') || 'Sin tipo'}
                                </h2>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/15 rounded-xl p-2 transition-colors">
                            <i className="fas fa-times text-lg"></i>
                        </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                        {estadoBadge}
                        {d.condiciones_dia && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white">
                                <i className={CONDICION_ICONS[d.condiciones_dia?.toLowerCase()] || 'fas fa-thermometer-half text-white'}></i>
                                {d.condiciones_dia}
                            </span>
                        )}
                        {d.fecha_creacion && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white">
                                <i className="fas fa-calendar-alt"></i>
                                {fmtDate(d.fecha_creacion)}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="bg-white border-b border-gray-200 px-6 flex gap-1 flex-shrink-0">
                    {tabs.filter(t => t.show).map(t => (
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
                            {t.count !== undefined && t.count > 0 && (
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
                            <div className="w-10 h-10 border-3 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500 text-sm">Cargando detalles...</p>
                        </div>
                    ) : (
                        <>
                        {/* ── General ── */}
                        {pestana === 'general' && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Usuario */}
                                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                                                <i className="fas fa-user text-green-600 text-sm"></i>
                                            </div>
                                            <h3 className="font-semibold text-gray-800">Autor</h3>
                                        </div>
                                        <p className="text-gray-800 font-medium">{d.usuario_nombre || 'N/A'}</p>
                                        {d.usuario_email && <p className="text-sm text-gray-500 mt-1">{d.usuario_email}</p>}
                                    </div>
                                    {/* Ubicación */}
                                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                                <i className="fas fa-map-marker-alt text-emerald-600 text-sm"></i>
                                            </div>
                                            <h3 className="font-semibold text-gray-800">Ubicación</h3>
                                        </div>
                                        <div className="space-y-1.5 text-sm">
                                            <div className="flex justify-between py-1 border-b border-gray-50">
                                                <span className="text-gray-500">Programa</span>
                                                <span className="font-medium text-gray-800">{d.programa_nombre || '—'}</span>
                                            </div>
                                            <div className="flex justify-between py-1 border-b border-gray-50">
                                                <span className="text-gray-500">Lote</span>
                                                <span className="font-medium text-gray-800">{d.lote_nombre || '—'}</span>
                                            </div>
                                            <div className="flex justify-between py-1">
                                                <span className="text-gray-500">Granja</span>
                                                <span className="font-medium text-gray-800">{d.granja_nombre || '—'}</span>
                                            </div>
                                        </div>
                                        {d.formulario?.total_plantas_lote && (
                                            <p className="text-xs text-emerald-600 mt-3 flex items-center gap-1">
                                                <i className="fas fa-chart-line"></i>
                                                Total plantas: {d.formulario.total_plantas_lote.toLocaleString()}
                                                {d.formulario.porcentaje_muestreo ? ` · Muestreo: ${d.formulario.porcentaje_muestreo}%` : ''}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Métricas */}
                                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                            <i className="fas fa-clipboard-list text-blue-600 text-sm"></i>
                                        </div>
                                        <h3 className="font-semibold text-gray-800">Resumen del monitoreo</h3>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {[
                                            { label: 'Plantas evaluadas', value: d.formulario?.plantas?.length || 0, color: 'text-green-600', bg: 'bg-green-50' },
                                            { label: 'Campos evaluados', value: tieneCaracterizacion ? Object.keys(d.formulario.caracterizacion).length : 0, color: 'text-blue-600', bg: 'bg-blue-50' },
                                            { label: 'Eval. individual', value: tieneFormulariosPorPlanta ? Object.keys(d.formulario.formularios_por_planta).length : 0, color: 'text-orange-600', bg: 'bg-orange-50' },
                                            { label: 'Fotos subidas', value: totalFotos, color: 'text-purple-600', bg: 'bg-purple-50' },
                                        ].map(m => (
                                            <div key={m.label} className={`rounded-xl ${m.bg} p-4 text-center`}>
                                                <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
                                                <div className="text-xs text-gray-500 mt-1">{m.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Recomendaciones vinculadas */}
                                {d.recomendaciones && d.recomendaciones.length > 0 && (
                                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                                                <i className="fas fa-lightbulb text-amber-600 text-sm"></i>
                                            </div>
                                            <h3 className="font-semibold text-gray-800">Recomendaciones vinculadas</h3>
                                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{d.recomendaciones.length}</span>
                                        </div>
                                        <div className="space-y-2">
                                            {d.recomendaciones.map((r: any, i: number) => (
                                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                                                    <i className="fas fa-chevron-right text-amber-500 text-xs mt-1"></i>
                                                    <div>
                                                        <p className="font-medium text-gray-800 text-sm">{r.titulo}</p>
                                                        {r.descripcion && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.descripcion}</p>}
                                                        <p className="text-xs text-gray-400 mt-1">{new Date(r.fecha_creacion).toLocaleDateString('es-CO')}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Evaluación ── */}
                        {pestana === 'plantas' && (
                            <div className="space-y-5">
                                {tienePlantas && (
                                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                                                <i className="fas fa-seedling text-green-600 text-sm"></i>
                                            </div>
                                            <h3 className="font-semibold text-gray-800">Plantas muestreadas <span className="text-gray-400 font-normal text-sm">({d.formulario.plantas.length})</span></h3>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                            {d.formulario.plantas.map((p: any, i: number) => (
                                                <div key={i} className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2 text-sm border border-green-100">
                                                    <i className="fas fa-map-pin text-green-500 text-xs"></i>
                                                    <span className="text-gray-700 truncate">{p.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {tieneCaracterizacion && (
                                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                                <i className="fas fa-chart-bar text-blue-600 text-sm"></i>
                                            </div>
                                            <h3 className="font-semibold text-gray-800">Caracterización general</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {Object.entries(d.formulario.caracterizacion).map(([k, v]) => {
                                                const val = parseVal(v);
                                                const isArr = val.includes(', ');
                                                return (
                                                    <div key={k} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{fmtKey(k)}</div>
                                                        {isArr ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {val.split(', ').map((item, idx) => (
                                                                    <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{item}</span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm font-medium text-gray-800">{val}</div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {tieneFormulariosPorPlanta && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                                                <i className="fas fa-list-ul text-purple-600 text-sm"></i>
                                            </div>
                                            <h3 className="font-semibold text-gray-800">Evaluación por planta</h3>
                                        </div>
                                        {Object.entries(d.formulario.formularios_por_planta).map(([plantaId, valores]) => {
                                            const planta = d.formulario?.plantas?.find((p: any) => p.id === parseInt(plantaId));
                                            return (
                                                <div key={plantaId} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                                    <div className="bg-purple-50 border-b border-purple-100 px-4 py-3 flex items-center gap-2">
                                                        <i className="fas fa-seedling text-purple-600 text-sm"></i>
                                                        <span className="font-semibold text-gray-800 text-sm">{planta?.label || `Planta ${plantaId}`}</span>
                                                        {planta?.codigo && <span className="text-xs text-gray-400">({planta.codigo})</span>}
                                                    </div>
                                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                        {Object.entries(valores as Record<string, string>).map(([campo, valor]) => (
                                                            <div key={campo} className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                                                <div className="text-xs text-gray-400">{fmtKey(campo)}</div>
                                                                <div className="text-sm text-gray-800 font-medium">{parseVal(valor)}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {!tieneEvaluacion && (
                                    <div className="text-center py-16 text-gray-400">
                                        <i className="fas fa-inbox text-5xl mb-3 block"></i>
                                        <p className="text-sm">No hay datos de evaluación disponibles</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Fotos ── */}
                        {pestana === 'fotos' && tieneFotos && (
                            <div className="space-y-5">
                                {Object.entries(fotosSubidas!).map(([campo, urls]) => (
                                    <div key={campo} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                                <i className="fas fa-folder-open text-indigo-600 text-sm"></i>
                                            </div>
                                            <h3 className="font-semibold text-gray-800">{fmtKey(campo)}</h3>
                                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{urls.length} foto{urls.length !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {urls.map((url, idx) => (
                                                <div key={idx} className="relative group cursor-pointer aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-md transition-all" onClick={() => setImagenSeleccionada(url)}>
                                                    <img src={url} alt={`${campo}-${idx + 1}`} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Error'; }} />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <i className="fas fa-search-plus text-white text-xl"></i>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
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
                            try { exportarDiagnosticoPDF(d); }
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

        {/* Lightbox */}
        {imagenSeleccionada && (
            <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setImagenSeleccionada(null)}>
                <button onClick={() => setImagenSeleccionada(null)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors">
                    <i className="fas fa-times text-lg"></i>
                </button>
                <img src={imagenSeleccionada} alt="Vista ampliada" className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain" onClick={e => e.stopPropagation()} />
            </div>
        )}
        </>
    );
};

export default DetallesDiagnosticoModal;
