import React from 'react';
import BadgeEstado from './shared/badgeEstado';

interface LaborHeaderProps {
    data: any;
    trabajadorInfo: any;
    loteInfo: any;
    onClose: () => void;
}

const LaborHeader: React.FC<LaborHeaderProps> = ({ data, trabajadorInfo, loteInfo, onClose }) => {
    const nombre = trabajadorInfo?.nombre || data.trabajador_nombre || `ID: ${data.trabajador_id}`;
    const lote = loteInfo?.nombre || data.lote_nombre || `Lote ${data.lote_id}`;

    return (
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-5 rounded-t-lg flex-shrink-0 -m-6 mb-6">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <i className="fas fa-hard-hat text-white text-xl"></i>
                    </div>
                    <div>
                        <p className="text-green-200 text-xs font-medium uppercase tracking-wider mb-0.5">Labor</p>
                        <h2 className="text-white text-xl font-bold leading-tight">
                            #{data.id} — {data.tipo_labor_nombre || data.tipo_labor || 'Sin tipo'}
                        </h2>
                    </div>
                </div>
                <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/15 rounded-xl p-2 transition-colors">
                    <i className="fas fa-times text-lg"></i>
                </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4">
                <BadgeEstado estado={data.estado} />
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white">
                    <i className="fas fa-user"></i>
                    {nombre}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/15 text-white">
                    <i className="fas fa-th-large"></i>
                    {lote}
                </span>
            </div>
        </div>
    );
};

export default LaborHeader;
