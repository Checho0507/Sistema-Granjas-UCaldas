import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import cultivoService from "../../services/cultivoService";
import granjaService from "../../services/granjaService";
import { StatsCard } from "../Common/StatsCard";
import CultivosTable from "./CultivosTable";
import CultivoForm from "./CultivosForm";
import exportService from "../../services/exportService";

export default function GestionCultivos() {
    const [cultivos, setCultivos] = useState<any[]>([]);
    const [granjas, setGranjas] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        agricolas: 0,
        pecuarios: 0,
        activos: 0,
        completados: 0
    });

    // Modales
    const [modalCrear, setModalCrear] = useState(false);

    // Selecciones
    const [cultivoSeleccionado, setCultivoSeleccionado] = useState<any>(null);
    const [editando, setEditando] = useState(false);

    // Formulario
    const [datosFormulario, setDatosFormulario] = useState({
        nombre: "",
        tipo: "agricola",
        fecha_inicio: new Date().toISOString().split('T')[0],
        duracion_dias: 90,
        descripcion: "",
        estado: "activo",
        granja_id: 0,
    });

    // Estados específicos para exportación
    const [exporting, setExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');

    // Handler para exportar cultivos
    const handleExportCultivos = async () => {
        if (exporting) return;

        setExporting(true);
        setExportMessage('Exportando cultivos...');

        try {
            const loadingToast = toast.loading('Exportando cultivos...');
            const result = await exportService.exportarCultivos();

            toast.dismiss(loadingToast);
            toast.success('Exportación completada exitosamente', {
                duration: 3000,
                position: 'top-right'
            });

            setExportMessage(`¡Exportación completada! (${result.filename})`);
            setTimeout(() => setExportMessage(''), 5000);
        } catch (error: any) {
            console.error('❌ Error exportando cultivos:', error);

            toast.error('Error al exportar cultivos', {
                duration: 4000,
                position: 'top-right'
            });

            setExportMessage('Error al exportar.');
            setTimeout(() => setExportMessage(''), 5000);
        } finally {
            setExporting(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);

            console.log('🔄 Cargando datos de cultivos...');
            const loadingToast = toast.loading('Cargando datos...');

            const [datosCultivos, datosGranjas, datosEstadisticas] = await Promise.all([
                cultivoService.obtenerCultivos(),
                granjaService.obtenerGranjas(),
                cultivoService.obtenerEstadisticas()
            ]);

            toast.dismiss(loadingToast);
            console.log('✅ Datos cargados exitosamente');

            setCultivos(datosCultivos);
            setGranjas(datosGranjas);
            setEstadisticas(datosEstadisticas);

        } catch (error: any) {
            console.error('❌ Error cargando datos:', error);
            setError(error.message || 'Error al cargar los datos');
            toast.error('Error al cargar los datos de cultivos', {
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
            console.log('📤 Guardando cultivo...', datosFormulario);

            const loadingToast = toast.loading(
                editando ? 'Actualizando cultivo...' : 'Creando cultivo...'
            );

            if (editando && cultivoSeleccionado) {
                await cultivoService.actualizarCultivo(cultivoSeleccionado.id, datosFormulario);

                toast.dismiss(loadingToast);
                toast.success('Cultivo actualizado exitosamente', {
                    duration: 3000,
                    position: 'top-right'
                });

                console.log('✅ Cultivo actualizado');
            } else {
                await cultivoService.crearCultivo(datosFormulario);

                toast.dismiss(loadingToast);
                toast.success('Cultivo creado exitosamente', {
                    duration: 3000,
                    position: 'top-right'
                });

                console.log('✅ Cultivo creado');
            }

            await cargarDatos();
            setModalCrear(false);
            setEditando(false);
            resetFormulario();

        } catch (error: any) {
            console.error('❌ Error guardando cultivo:', error);
            setError(error.message || 'Error al guardar el cultivo');

            toast.error(`Error al guardar cultivo: ${error.message || 'Error desconocido'}`, {
                duration: 4000,
                position: 'top-right'
            });
        }
    };

    const abrirEditar = (cultivo: any) => {
        setDatosFormulario({
            nombre: cultivo.nombre || "",
            tipo: cultivo.tipo || "agricola",
            fecha_inicio: cultivo.fecha_inicio ? new Date(cultivo.fecha_inicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            duracion_dias: cultivo.duracion_dias || 90,
            descripcion: cultivo.descripcion || "",
            estado: cultivo.estado || "activo",
            granja_id: cultivo.granja_id || 0,
        });
        setCultivoSeleccionado(cultivo);
        setEditando(true);
        setModalCrear(true);
    };

    const manejarEliminar = async (id: number) => {
        const confirmar = window.confirm("¿Estás seguro de eliminar este cultivo/especie?\nEsta acción no se puede deshacer.");
        if (!confirmar) return;

        try {
            setError(null);
            const loadingToast = toast.loading('Eliminando cultivo...');

            await cultivoService.eliminarCultivo(id);

            toast.dismiss(loadingToast);
            toast.success('Cultivo eliminado exitosamente', {
                duration: 3000,
                position: 'top-right'
            });

            console.log('✅ Cultivo eliminado');
            await cargarDatos();

        } catch (error: any) {
            console.error('❌ Error al eliminar cultivo:', error);
            setError(error.message || 'Error al eliminar el cultivo');

            toast.error(`Error al eliminar cultivo: ${error.message || 'Error desconocido'}`, {
                duration: 4000,
                position: 'top-right'
            });
        }
    };

    const resetFormulario = () => {
        setDatosFormulario({
            nombre: "",
            tipo: "agricola",
            fecha_inicio: new Date().toISOString().split('T')[0],
            duracion_dias: 90,
            descripcion: "",
            estado: "activo",
            granja_id: 0,
        });
    };

    if (cargando) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <span className="ml-4 text-gray-600">Cargando cultivos...</span>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Gestión de Cultivos/Especies</h1>

            {/* Mensaje de exportación */}
            <div className="flex items-center space-x-3 m-2 mb-6">
                {exportMessage && (
                    <span className={`text-sm px-3 py-1 rounded ${exportMessage.includes('Error')
                        ? 'bg-red-100 text-red-600'
                        : 'bg-green-100 text-green-600'
                        }`}>
                        {exportMessage}
                    </span>
                )}

                <button
                    onClick={handleExportCultivos}
                    disabled={exporting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 transition-colors"
                >
                    <i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i>
                    <span>{exporting ? 'Exportando...' : 'Exportar a Excel'}</span>
                </button>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <StatsCard
                    icon="fas fa-leaf"
                    color="bg-green-600"
                    value={estadisticas.total}
                    label="Total Cultivos"
                />
                <StatsCard
                    icon="fas fa-seedling"
                    color="bg-emerald-600"
                    value={estadisticas.agricolas}
                    label="Agrícolas"
                />
                <StatsCard
                    icon="fas fa-paw"
                    color="bg-amber-600"
                    value={estadisticas.pecuarios}
                    label="Pecuario"
                />
                <StatsCard
                    icon="fas fa-check-circle"
                    color="bg-blue-600"
                    value={estadisticas.activos}
                    label="Activos"
                />
                <StatsCard
                    icon="fas fa-flag-checkered"
                    color="bg-purple-600"
                    value={estadisticas.completados}
                    label="Completados"
                />
            </div>

            {/* Botón Crear */}
            <div className="mb-6">
                <button
                    onClick={() => {
                        resetFormulario();
                        setEditando(false);
                        setModalCrear(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i>
                    Nuevo Cultivo/Especie
                </button>
            </div>

            {/* Tabla de cultivos */}
            <CultivosTable
                cultivos={cultivos}
                onEditar={abrirEditar}
                onEliminar={manejarEliminar}
            />

            {/* Modal de formulario */}
            <CultivoForm
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
                granjas={granjas}
            />
        </div>
    );
}