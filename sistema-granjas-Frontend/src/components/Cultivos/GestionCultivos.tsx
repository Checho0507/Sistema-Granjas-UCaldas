import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import cultivoService from "../../services/cultivoService";
import granjaService from "../../services/granjaService";
import loteService from "../../services/loteService"; // 👈 IMPORTAR
import { StatsCard } from "../Common/StatsCard";
import CultivosTable from "./CultivosTable";
import CultivoForm from "./CultivosForm";
import type { CultivoFormData, CultivoEspecie } from "../../types/cultivoTypes";

export default function GestionCultivos() {
    const [searchParams] = useSearchParams();
    const programaId = searchParams.get("programaId");

    const [cultivos, setCultivos] = useState<CultivoEspecie[]>([]);
    const [granjas, setGranjas] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [erroresValidacion, setErroresValidacion] = useState<Record<string, string>>({});

    // 👇 ESTADÍSTICAS CALCULADAS SOBRE LOS CULTIVOS FILTRADOS
    const estadisticas = useMemo(() => ({
        total: cultivos.length,
        agricolas: cultivos.filter((c) => c.tipo === "agricola").length,
        pecuarios: cultivos.filter((c) => c.tipo === "pecuario").length,
        activos: cultivos.filter((c) => c.estado === "activo").length,
    }), [cultivos]);

    const [modalCrear, setModalCrear] = useState(false);
    const [cultivoSeleccionado, setCultivoSeleccionado] = useState<CultivoEspecie | null>(null);
    const [editando, setEditando] = useState(false);

    const [datosFormulario, setDatosFormulario] = useState<CultivoFormData>({
        nombre: "",
        tipo: "agricola",
        descripcion: "",
        estado: "activo",
        granja_id: 0,
    });

    useEffect(() => {
        cargarDatos();
    }, [programaId]);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError(null);

            console.log("🔄 Cargando cultivos...", programaId ? `para programa ${programaId}` : "todos");

            let datosCultivos: CultivoEspecie[] = [];

            if (programaId) {
                // 👇 OBTENER CULTIVOS A TRAVÉS DE LOS LOTES DEL PROGRAMA
                // 1. Obtener todos los lotes del programa
                const lotes = await loteService.obtenerLotesPorPrograma(Number(programaId));
                console.log(`📋 Lotes del programa ${programaId}:`, lotes);
                
                // 2. Extraer IDs únicos de cultivos de esos lotes
                const cultivoIds = new Set<number>();
                lotes.forEach((lote: any) => {
                    if (lote.cultivos_ids && Array.isArray(lote.cultivos_ids)) {
                        lote.cultivos_ids.forEach((id: number) => cultivoIds.add(id));
                    }
                });
                
                console.log(`🔍 IDs de cultivos encontrados:`, Array.from(cultivoIds));
                
                // 3. Obtener los cultivos por sus IDs
                const cultivosPromises = Array.from(cultivoIds).map(id => 
                    cultivoService.obtenerCultivoPorId(id).catch(() => null)
                );
                
                const cultivosResultados = await Promise.all(cultivosPromises);
                datosCultivos = cultivosResultados.filter(Boolean) as CultivoEspecie[];
                
                console.log(`✅ ${datosCultivos.length} cultivos cargados para el programa`);
            } else {
                // Vista general: todos los cultivos
                datosCultivos = await cultivoService.obtenerCultivos();
            }

            const datosGranjas = await granjaService.obtenerGranjas();

            setCultivos(datosCultivos);
            setGranjas(datosGranjas);

        } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : "Error al cargar los datos";
            setError(mensaje);
            toast.error(mensaje);
        } finally {
            setCargando(false);
        }
    };

    const manejarCrear = async (e: React.FormEvent) => {
        e.preventDefault();

        setErroresValidacion({});
        setError(null);

        const loadingToast = toast.loading(editando ? "Actualizando..." : "Creando...");

        try {
            if (editando && cultivoSeleccionado) {
                await cultivoService.actualizarCultivo(cultivoSeleccionado.id, datosFormulario);
                toast.success("Actualizado exitosamente");
            } else {
                await cultivoService.crearCultivo(datosFormulario);
                toast.success("Creado exitosamente");
            }

            await cargarDatos();

            setModalCrear(false);
            setEditando(false);
            resetFormulario();
        } catch (err: any) {
            if (err.erroresValidacion) {
                setErroresValidacion(err.erroresValidacion);

                const primerError = Object.values(err.erroresValidacion)[0] as string;
                if (primerError) toast.error(primerError);
            } else {
                const mensaje = err?.message || "Error inesperado";
                setError(mensaje);
                toast.error(mensaje);
            }
        } finally {
            toast.dismiss(loadingToast);
        }
    };

    const abrirEditar = (cultivo: CultivoEspecie) => {
        setDatosFormulario({
            nombre: cultivo.nombre || "",
            tipo: cultivo.tipo || "agricola",
            descripcion: cultivo.descripcion || "",
            estado: cultivo.estado || "activo",
            granja_id: cultivo.granja_id || 0,
        });

        setCultivoSeleccionado(cultivo);
        setEditando(true);
        setModalCrear(true);
        setErroresValidacion({});
    };

    const manejarEliminar = async (id: number) => {
        if (!window.confirm("¿Eliminar este cultivo?")) return;

        try {
            await cultivoService.eliminarCultivo(id);
            toast.success("Eliminado exitosamente");
            await cargarDatos();
        } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : "Error al eliminar";
            toast.error(mensaje);
        }
    };

    const resetFormulario = () => {
        setDatosFormulario({
            nombre: "",
            tipo: "agricola",
            descripcion: "",
            estado: "activo",
            granja_id: 0,
        });

        setErroresValidacion({});
    };

    if (cargando) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <span className="ml-4 text-gray-600">
                    {programaId ? "Cargando cultivos del programa..." : "Cargando cultivos..."}
                </span>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    {programaId ? "Cultivos del Programa" : "Gestión de Cultivos"}
                </h1>
                
                {programaId && (
                    <button
                        onClick={() => window.history.back()}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
                    >
                        <i className="fas fa-arrow-left"></i>
                        Volver a programas
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <StatsCard icon="fas fa-leaf" color="bg-green-600" value={estadisticas.total} label="Total Cultivos" />
                <StatsCard icon="fas fa-seedling" color="bg-emerald-600" value={estadisticas.agricolas} label="Agrícolas" />
                <StatsCard icon="fas fa-paw" color="bg-amber-600" value={estadisticas.pecuarios} label="Pecuarios" />
                <StatsCard icon="fas fa-check-circle" color="bg-blue-600" value={estadisticas.activos} label="Activos" />
            </div>

            {/* Botón Crear - Deshabilitado si hay filtro de programa */}
            <div className="mb-6">
                <button
                    onClick={() => {
                        resetFormulario();
                        setEditando(false);
                        setModalCrear(true);
                    }}
                    disabled={!!programaId}
                    className={`text-white px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                        programaId 
                            ? "bg-gray-400 cursor-not-allowed" 
                            : "bg-green-600 hover:bg-green-700"
                    }`}
                    title={programaId ? "No puedes crear cultivos desde la vista de programa" : "Nuevo cultivo"}
                >
                    <i className="fas fa-plus"></i>
                    Nuevo Cultivo/Especie
                </button>
                {programaId && (
                    <p className="text-sm text-gray-500 mt-2">
                        ⚠️ Los cultivos se crean desde la vista general, no desde un programa específico.
                    </p>
                )}
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
                erroresValidacion={erroresValidacion}
            />
        </div>
    );
}