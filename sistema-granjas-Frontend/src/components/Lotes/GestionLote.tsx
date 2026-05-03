import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { loteService } from "../../services/loteService";
import granjaService from "../../services/granjaService";
import programaService from "../../services/programaService";
import { StatsCard } from "../Common/StatsCard";
import LotesTable from "./LotesTable";
import LoteForm from "./LotesForm";
import TiposLoteModal from "./TiposLote";
import MapaLotes from "./MapaLotes";
import exportService from "../../services/exportService";

export default function GestionLotes() {
    const [vistaActiva, setVistaActiva] = useState<'tabla' | 'mapa'>('tabla');
    const [lotes, setLotes] = useState<any[]>([]);
    const [tiposLote, setTiposLote] = useState<any[]>([]);
    const [granjas, setGranjas] = useState<any[]>([]);
    const [programas, setProgramas] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modales
    const [modalCrear, setModalCrear] = useState(false);
    const [modalTiposLote, setModalTiposLote] = useState(false);

    // Selecciones
    const [loteSeleccionado, setLoteSeleccionado] = useState<any>(null);
    const [editando, setEditando] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');

    // Handler para exportar lotes
    const handleExportLotes = async () => {
        if (exporting) return;
        setExporting(true);
        setExportMessage('Exportando lotes...');

        try {
            const loadingToast = toast.loading('Exportando lotes...');
            const result = await exportService.exportarLotes();

            toast.dismiss(loadingToast);
            toast.success('Lotes exportados exitosamente', {
                duration: 3000,
                position: 'top-right'
            });

            setExportMessage(`¡Exportación completada! (${result.filename})`);
            setTimeout(() => setExportMessage(''), 5000);
        } catch (error: any) {
            console.error('❌ Error exportando lotes:', error);

            toast.error('Error al exportar lotes', {
                duration: 4000,
                position: 'top-right'
            });

            setExportMessage('Error al exportar.');
            setTimeout(() => setExportMessage(''), 5000);
        } finally {
            setExporting(false);
        }
    };

    // Formulario
    const [datosFormulario, setDatosFormulario] = useState({
        nombre: "",
        tipo_lote_id: 0,
        granja_id: 0,
        programa_id: 0,
        nombre_cultivo: "",
        tipo_gestion: "Convencional",
        fecha_inicio: new Date().toISOString().split('T')[0],
        duracion_dias: 30,
        estado: "activo",
        cultivo_id: null as number | null,
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);

            console.log('🔄 Cargando datos de lotes...');
            const loadingToast = toast.loading('Cargando datos de lotes...');

            const [datosLotes, datosTiposLote, datosGranjas, datosProgramas] = await Promise.all([
                loteService.obtenerLotes(),
                loteService.obtenerTiposLote(),
                granjaService.obtenerGranjas(),
                programaService.obtenerProgramas()
            ]);

            toast.dismiss(loadingToast);
            console.log('✅ Datos cargados exitosamente');

            setLotes(datosLotes);
            setTiposLote(datosTiposLote);
            setGranjas(datosGranjas);
            setProgramas(datosProgramas);

        } catch (error: any) {
            console.error('❌ Error cargando datos:', error);
            setError(error.message || 'Error al cargar los datos');
            toast.error('Error al cargar los datos de lotes', {
                duration: 4000,
                position: 'top-right'
            });
        } finally {
            setCargando(false);
        }
    };

    const manejarCrear = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setError(null);
            console.log('📤 Guardando lote...', datosFormulario);

            // El toast de carga será manejado por el formulario hijo
            if (editando && loteSeleccionado) {
                const result = await loteService.actualizarLote(loteSeleccionado.id, datosFormulario);
                console.log('✅ Lote actualizado');
            } else {
                const result = await loteService.crearLote(datosFormulario);
                console.log('✅ Lote creado');
            }

            // El éxito será mostrado por el formulario hijo
            await cargarDatos();
            setModalCrear(false);
            setEditando(false);
            resetFormulario();

        } catch (error: any) {
            console.error('❌ Error guardando lote:', error);
            setError(error.message || 'Error al guardar el lote');

            // IMPORTANTE: Lanzar el error para que lo capture el formulario
            throw error;
        }
    };

    const abrirEditar = (lote: any) => {
        setDatosFormulario({
            nombre: lote.nombre || "",
            tipo_lote_id: lote.tipo_lote_id || 0,
            granja_id: lote.granja_id || 0,
            programa_id: lote.programa_id || 0,
            nombre_cultivo: lote.nombre_cultivo || "",
            tipo_gestion: lote.tipo_gestion || "Convencional",
            fecha_inicio: lote.fecha_inicio ? new Date(lote.fecha_inicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            duracion_dias: lote.duracion_dias || 30,
            estado: lote.estado || "activo",
            cultivo_id: lote.cultivo_id || null,
        });
        setLoteSeleccionado(lote);
        setEditando(true);
        setModalCrear(true);
    };

    const manejarEliminar = async (id: number) => {
        const confirmar = window.confirm("¿Estás seguro de eliminar este lote?\nEsta acción no se puede deshacer.");
        if (!confirmar) return;

        try {
            setError(null);
            const loadingToast = toast.loading('Eliminando lote...');

            await loteService.eliminarLote(id);

            toast.dismiss(loadingToast);
            toast.success('Lote eliminado exitosamente', {
                duration: 3000,
                position: 'top-right'
            });

            console.log('✅ Lote eliminado');
            await cargarDatos();
        } catch (error: any) {
            console.error('❌ Error al eliminar lote:', error);
            setError(error.message || 'Error al eliminar el lote');

            toast.error(`Error al eliminar lote: ${error.message || 'Error desconocido'}`, {
                duration: 4000,
                position: 'top-right'
            });
        }
    };

    const resetFormulario = () => {
        setDatosFormulario({
            nombre: "",
            tipo_lote_id: 0,
            granja_id: 0,
            programa_id: 0,
            nombre_cultivo: "",
            tipo_gestion: "Convencional",
            fecha_inicio: new Date().toISOString().split('T')[0],
            duracion_dias: 30,
            estado: "activo",
            cultivo_id: null,
        });
    };

    if (cargando) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <span className="ml-4 text-gray-600">Cargando lotes...</span>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Gestión de Lotes</h1>

            {/* Botón de exportación */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3 m-2">
                    {exportMessage && (
                        <span className={`text-sm px-3 py-1 rounded ${exportMessage.includes('Error')
                            ? 'bg-red-100 text-red-600'
                            : 'bg-green-100 text-green-600'
                            }`}>
                            {exportMessage}
                        </span>
                    )}

                    <button
                        onClick={handleExportLotes}
                        disabled={exporting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 transition-colors"
                    >
                        <i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i>
                        <span>{exporting ? 'Exportando...' : 'Exportar a Excel'}</span>
                    </button>
                </div>
            </div>

            {/* Mostrar error global */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <div className="flex items-center">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        <strong>Error:</strong> {error}
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="float-right text-red-800 hover:text-red-900"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            )}

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    icon="fas fa-seedling"
                    color="bg-green-600"
                    value={lotes.length}
                    label="Lotes Totales"
                />
                <StatsCard
                    icon="fas fa-tractor"
                    color="bg-blue-600"
                    value={lotes.filter(l => l.estado === 'activo').length}
                    label="Lotes Activos"
                />
                <StatsCard
                    icon="fas fa-warehouse"
                    color="bg-purple-600"
                    value={granjas.length}
                    label="Granjas"
                />
                <StatsCard
                    icon="fas fa-list"
                    color="bg-yellow-600"
                    value={tiposLote.length}
                    label="Tipos de Lote"
                />
            </div>

            {/* Botones de acción */}
            <div className="mb-6 flex gap-4">
                <button
                    onClick={() => {
                        resetFormulario();
                        setEditando(false);
                        setModalCrear(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i>
                    Nuevo Lote
                </button>

                <button
                    onClick={() => setModalTiposLote(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <i className="fas fa-cog"></i>
                    Gestionar Tipos de Lote
                </button>
            </div>

            {/* Tabs Tabla / Mapa Visual */}
            <div className="mb-4 flex gap-2">
                <button
                    onClick={() => setVistaActiva('tabla')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${vistaActiva === 'tabla' ? 'bg-green-600 text-white shadow' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                    <i className="fas fa-table"></i>
                    Vista Tabla
                </button>
                <button
                    onClick={() => setVistaActiva('mapa')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${vistaActiva === 'mapa' ? 'bg-green-600 text-white shadow' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                    <i className="fas fa-th-large"></i>
                    Mapa Visual
                </button>
            </div>

            {/* Tabla de lotes */}
            {vistaActiva === 'tabla' ? (
                <LotesTable
                    lotes={lotes}
                    onEditar={abrirEditar}
                    onEliminar={manejarEliminar}
                />
            ) : (
                <MapaLotes
                    lotes={lotes}
                    onVerDetalle={(lote) => abrirEditar(lote)}
                />
            )}

            {/* Modal de formulario */}
            <LoteForm
                isOpen={modalCrear}
                onClose={() => {
                    setModalCrear(false);
                    setEditando(false);
                    resetFormulario();
                }}
                datosFormulario={datosFormulario}
                setDatosFormulario={setDatosFormulario}
                onSubmit={manejarCrear}
                editando={editando}
                tiposLote={tiposLote}
                granjas={granjas}
                programas={programas}
            />

            {/* Modal de tipos de lote */}
            <TiposLoteModal
                isOpen={modalTiposLote}
                onClose={() => setModalTiposLote(false)}
                tiposLote={tiposLote}
                onRefresh={cargarDatos}
            />
        </div>
    );
}