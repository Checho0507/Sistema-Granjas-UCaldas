import React, { useEffect, useState, useMemo } from 'react';
import programaService from '../../services/programaService';
import cultivoService from '../../services/cultivoService';
import granjaService from '../../services/granjaService';

interface LotesTableProps {
    lotes: any[];
    onEditar: (lote: any) => void;
    onEliminar: (id: number) => void;
}

const LotesTable: React.FC<LotesTableProps> = ({ lotes, onEditar, onEliminar }) => {

    const [programasMap, setProgramasMap] = useState<Record<number, string>>({});
    const [granjasMap, setGranjasMap] = useState<Record<number, string>>({});
    const [cultivosMap, setCultivosMap] = useState<Record<number, any>>({});
    const [cultivosPorLote, setCultivosPorLote] = useState<Record<number, any[]>>({});
    const [cargando, setCargando] = useState(false);

    // 🔥 Ordenar solo cuando cambian los lotes
    const lotesOrdenados = useMemo(() => {
        return [...lotes].sort((a, b) => a.id - b.id);
    }, [lotes]);

    useEffect(() => {
        if (!lotes.length) return;

        let mounted = true;

        const cargar = async () => {
            setCargando(true);

            try {
                const programasIds = [...new Set(lotes.map(l => l.programa_id).filter(Boolean))];
                const granjasIds = [...new Set(lotes.map(l => l.granja_id).filter(Boolean))];

                const cultivosIds = [
                    ...new Set(
                        lotes.flatMap(l => l.cultivos_ids || [])
                    )
                ];

                // 🚀 PARA PRODUCCIÓN: idealmente backend debe tener endpoint masivo
                const [programasResp, granjasResp, cultivosResp] = await Promise.all([
                    Promise.all(programasIds.map(id => programaService.obtenerProgramaPorId(id))),
                    Promise.all(granjasIds.map(id => granjaService.obtenerGranjaPorId(id))),
                    Promise.all(cultivosIds.map(id => cultivoService.obtenerCultivoPorId(id)))
                ]);

                if (!mounted) return;

                const progMap: Record<number, string> = {};
                programasResp.forEach((p, i) => {
                    progMap[programasIds[i]] = p?.nombre || 'No encontrado';
                });

                const granMap: Record<number, string> = {};
                granjasResp.forEach((g, i) => {
                    granMap[granjasIds[i]] = g?.nombre || 'No encontrada';
                });

                const cultMap: Record<number, any> = {};
                cultivosResp.forEach((c, i) => {
                    if (c) {
                        cultMap[cultivosIds[i]] = c;
                    }
                });

                const cultivosLote: Record<number, any[]> = {};

                lotes.forEach(l => {
                    cultivosLote[l.id] = (l.cultivos_ids || [])
                        .map((id: number) => cultMap[id])
                        .filter(Boolean);
                });

                setProgramasMap(progMap);
                setGranjasMap(granMap);
                setCultivosMap(cultMap);
                setCultivosPorLote(cultivosLote);

            } catch (error) {
                console.error(error);
            } finally {
                if (mounted) setCargando(false);
            }
        };

        cargar();

        return () => {
            mounted = false;
        };
    }, [lotes]);

    // 🎨 helpers
    const getEstadoColor = (estado: string) => {
        switch (estado?.toLowerCase()) {
            case 'activo': return 'bg-green-100 text-green-800';
            case 'inactivo': return 'bg-gray-100 text-gray-800';
            case 'pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'completado': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatearFecha = (fecha?: string) => {
        if (!fecha) return '-';
        return new Date(fecha).toLocaleDateString();
    };

    const getTipoColor = (tipo: string) => {
        return tipo === 'agricola'
            ? 'bg-green-100 text-green-800'
            : 'bg-amber-100 text-amber-800';
    };

    // 🔥 render optimizado
    const renderCultivos = (loteId: number) => {
        const lista = cultivosPorLote[loteId] || [];

        if (!lista.length) {
            return <span className="text-gray-400 italic">—</span>;
        }

        const visibles = lista.slice(0, 3); // 🔥 SOLO 3

        return (
            <div className="flex flex-wrap gap-1">
                {visibles.map(c => (
                    <span key={c.id} className={`px-2 py-0.5 text-xs rounded ${getTipoColor(c.tipo)}`}>
                        {c.nombre}
                    </span>
                ))}

                {lista.length > 3 && (
                    <span className="text-xs text-gray-500">
                        +{lista.length - 3} más
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
                <h3 className="font-semibold">
                    Lotes ({lotes.length})
                    {cargando && <span className="ml-2 text-blue-500">Cargando...</span>}
                </h3>
            </div>

            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50 text-left">
                        <th>Nombre</th>
                        <th>Granja</th>
                        <th>Cultivos</th>
                        <th>Programa</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th></th>
                    </tr>
                </thead>

                <tbody>
                    {lotesOrdenados.map(l => (
                        <tr key={l.id} className="border-t hover:bg-gray-50">
                            <td>{l.nombre}</td>
                            <td>{granjasMap[l.granja_id] || '-'}</td>
                            <td>{renderCultivos(l.id)}</td>
                            <td>{programasMap[l.programa_id] || '-'}</td>

                            <td>
                                <span className={`px-2 py-1 rounded text-xs ${getEstadoColor(l.estado)}`}>
                                    {l.estado}
                                </span>
                            </td>

                            <td>{formatearFecha(l.fecha_inicio)}</td>

                            <td>
                                <button onClick={() => onEditar(l)}>✏️</button>
                                <button onClick={() => onEliminar(l.id)}>🗑️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {!lotes.length && (
                <div className="p-6 text-center text-gray-500">
                    No hay lotes
                </div>
            )}
        </div>
    );
};

export default LotesTable;