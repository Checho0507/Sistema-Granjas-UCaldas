import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

// --- SERVICES DE GRANJA (CRUD y asignaciones específicas de granja)
import granjaService from "../../services/granjaService";
import usuarioService from "../../services/usuarioService";
import programaService from "../../services/programaService";

import { StatsCard } from "../Common/StatsCard";
import { GranjaForm } from "./GranjasForm";
import { DetallesGranja } from "./DetallesGranja";
import { AsignarUsuarioModal } from "../Usuarios/AsignarUsuario";
import { AsignarProgramaModal } from "../Programas/AsignarPrograma";
import GranjasTable from "./GranjasTable";
import exportService from "../../services/exportService";

export default function GestionGranjas() {
    const [granjas, setGranjas] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [programas, setProgramas] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modales
    const [modalCrear, setModalCrear] = useState(false);
    const [modalDetalles, setModalDetalles] = useState(false);
    const [modalAsignarUsuario, setModalAsignarUsuario] = useState(false);
    const [modalAsignarPrograma, setModalAsignarPrograma] = useState(false);

    // Selecciones
    const [granjaSeleccionada, setGranjaSeleccionada] = useState<any>(null);
    const [usuariosGranja, setUsuariosGranja] = useState<any[]>([]);
    const [programasGranja, setProgramasGranja] = useState<any[]>([]);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<number>(0);
    const [programaSeleccionado, setProgramaSeleccionado] = useState<number>(0);
    const [exporting, setExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');

    // Formulario
    const [editando, setEditando] = useState(false);
    const [datosFormulario, setDatosFormulario] = useState({
        nombre: "",
        ubicacion: "",
        activo: true,
    });

    const handleExportGranjas = async () => {
        if (exporting) return;

        setExporting(true);
        setExportMessage('Exportando granjas...');

        try {
            const loadingToast = toast.loading('Exportando granjas...');
            const result = await exportService.exportarGranjas();

            toast.dismiss(loadingToast);
            toast.success('¡Exportación completada!', {
                duration: 3000,
                position: 'top-right'
            });

            setExportMessage(`¡Exportación completada! (${result.filename})`);

            setTimeout(() => {
                setExportMessage('');
            }, 5000);
        } catch (error: any) {
            console.error('❌ Error exportando granjas:', error);

            toast.error('Error al exportar granjas', {
                duration: 4000,
                position: 'top-right'
            });

            setExportMessage('Error al exportar.');

            setTimeout(() => {
                setExportMessage('');
            }, 5000);
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

            console.log('🔄 Cargando datos iniciales...');
            const [datosGranjas, datosUsuarios, datosProgramas] = await Promise.all([
                granjaService.obtenerGranjas(),
                usuarioService.obtenerUsuarios(),
                programaService.obtenerProgramas()
            ]);

            console.log('✅ Datos cargados exitosamente');
            setGranjas(datosGranjas);
            setUsuarios(datosUsuarios);
            setProgramas(datosProgramas);

        } catch (error: any) {
            console.error('❌ Error cargando datos:', error);
            setError(error.message || 'Error al cargar los datos');
            toast.error('Error al cargar los datos', {
                duration: 4000,
                position: 'top-right'
            });
        } finally {
            setCargando(false);
        }
    };

    const manejarCrear = async (e: any) => {
        e.preventDefault();

        try {
            setError(null);
            console.log('📤 Guardando granja...');

            const loadingToast = toast.loading(
                editando ? 'Actualizando granja...' : 'Creando granja...'
            );

            if (editando) {
                await granjaService.actualizarGranja(granjaSeleccionada.id, datosFormulario);
                console.log('✅ Granja actualizada');

                toast.dismiss(loadingToast);
                toast.success('Granja actualizada exitosamente', {
                    duration: 3000,
                    position: 'top-right'
                });
            } else {
                await granjaService.crearGranja(datosFormulario);
                console.log('✅ Granja creada');

                toast.dismiss(loadingToast);
                toast.success('Granja creada exitosamente', {
                    duration: 3000,
                    position: 'top-right'
                });
            }

            await cargarDatos();
            setModalCrear(false);
            setEditando(false);
            setDatosFormulario({ nombre: "", ubicacion: "", activo: true });
        } catch (error: any) {
            console.error('❌ Error guardando granja:', error);
            setError(error.message || 'Error al guardar la granja');
            toast.error(`Error al guardar la granja: ${error.message || 'Error desconocido'}`, {
                duration: 4000,
                position: 'top-right'
            });
        }
    };

    const abrirEditar = (granja: any) => {
        setDatosFormulario({
            nombre: granja.nombre,
            ubicacion: granja.ubicacion,
            activo: granja.activo
        });
        setGranjaSeleccionada(granja);
        setEditando(true);
        setModalCrear(true);
    };

    const abrirDetalles = async (granja: any) => {
        try {
            setError(null);
            setGranjaSeleccionada(granja);

            console.log('🔍 Cargando detalles de granja...');
            const loadingToast = toast.loading('Cargando detalles...');

            const [usuarios, programas] = await Promise.all([
                granjaService.obtenerUsuariosPorGranja(granja.id),
                granjaService.obtenerProgramasPorGranja(granja.id)
            ]);

            toast.dismiss(loadingToast);
            setUsuariosGranja(usuarios);
            setProgramasGranja(programas);
            setModalDetalles(true);
        } catch (error: any) {
            console.error('❌ Error al cargar detalles:', error);
            setError(error.message || 'Error al cargar los detalles');
            toast.error('Error al cargar los detalles de la granja', {
                duration: 4000,
                position: 'top-right'
            });
        }
    };

    const manejarEliminar = async (id: number) => {
        // Usar toast para confirmación más elegante
        const confirmar = window.confirm("¿Estás seguro de eliminar esta granja?");
        if (!confirmar) return;

        try {
            setError(null);
            const loadingToast = toast.loading('Eliminando granja...');

            await granjaService.eliminarGranja(id);

            toast.dismiss(loadingToast);
            toast.success('Granja eliminada exitosamente', {
                duration: 3000,
                position: 'top-right'
            });

            console.log('✅ Granja eliminada');
            await cargarDatos();
        } catch (error: any) {
            console.error('❌ Error al eliminar granja:', error);
            setError(error.message || 'Error al eliminar la granja');
            toast.error(`Error al eliminar la granja: ${error.message || 'Error desconocido'}`, {
                duration: 4000,
                position: 'top-right'
            });
        }
    };

    const asignarUsuario = async () => {
        if (!usuarioSeleccionado) {
            toast.error('Por favor selecciona un usuario', {
                duration: 3000,
                position: 'top-right'
            });
            return;
        }

        try {
            setError(null);
            const loadingToast = toast.loading('Asignando usuario...');

            await granjaService.asignarUsuario(granjaSeleccionada.id, usuarioSeleccionado);

            toast.dismiss(loadingToast);
            toast.success('Usuario asignado exitosamente', {
                duration: 3000,
                position: 'top-right'
            });

            console.log('✅ Usuario asignado');

            // Actualizar lista de usuarios de la granja
            const usuariosActualizados = await granjaService.obtenerUsuariosPorGranja(granjaSeleccionada.id);
            setUsuariosGranja(usuariosActualizados);

            setUsuarioSeleccionado(0);
            setModalAsignarUsuario(false);
        } catch (error: any) {
            console.error('❌ Error al asignar usuario:', error);
            setError(error.message || 'Error al asignar usuario');
            toast.error(`Error al asignar usuario: ${error.message || 'Error desconocido'}`, {
                duration: 4000,
                position: 'top-right'
            });
        }
    };

    const asignarPrograma = async () => {
        if (!programaSeleccionado) {
            toast.error('Por favor selecciona un programa', {
                duration: 3000,
                position: 'top-right'
            });
            return;
        }

        try {
            setError(null);
            const loadingToast = toast.loading('Asignando programa...');

            await granjaService.asignarPrograma(granjaSeleccionada.id, programaSeleccionado);

            toast.dismiss(loadingToast);
            toast.success('Programa asignado exitosamente', {
                duration: 3000,
                position: 'top-right'
            });

            console.log('✅ Programa asignado');

            // Actualizar lista de programas de la granja
            const programasActualizados = await granjaService.obtenerProgramasPorGranja(granjaSeleccionada.id);
            setProgramasGranja(programasActualizados);

            setProgramaSeleccionado(0);
            setModalAsignarPrograma(false);
        } catch (error: any) {
            console.error('❌ Error al asignar programa:', error);
            setError(error.message || 'Error al asignar programa');
            toast.error(`Error al asignar programa: ${error.message || 'Error desconocido'}`, {
                duration: 4000,
                position: 'top-right'
            });
        }
    };

    const removerUsuario = async (usuarioId: number) => {
        const confirmar = window.confirm("¿Estás seguro de remover este usuario de la granja?");
        if (!confirmar) return;

        try {
            setError(null);
            const loadingToast = toast.loading('Removiendo usuario...');

            await granjaService.removerUsuario(granjaSeleccionada.id, usuarioId);

            toast.dismiss(loadingToast);
            toast.success('Usuario removido exitosamente', {
                duration: 3000,
                position: 'top-right'
            });

            console.log('✅ Usuario removido');

            const usuariosActualizados = await granjaService.obtenerUsuariosPorGranja(granjaSeleccionada.id);
            setUsuariosGranja(usuariosActualizados);
        } catch (error: any) {
            console.error('❌ Error al remover usuario:', error);
            setError(error.message || 'Error al remover usuario');
            toast.error(`Error al remover usuario: ${error.message || 'Error desconocido'}`, {
                duration: 4000,
                position: 'top-right'
            });
        }
    };

    const removerPrograma = async (programaId: number) => {
        const confirmar = window.confirm("¿Estás seguro de remover este programa de la granja?");
        if (!confirmar) return;

        try {
            setError(null);
            const loadingToast = toast.loading('Removiendo programa...');

            await granjaService.removerPrograma(granjaSeleccionada.id, programaId);

            toast.dismiss(loadingToast);
            toast.success('Programa removido exitosamente', {
                duration: 3000,
                position: 'top-right'
            });

            console.log('✅ Programa removido');

            const programasActualizados = await granjaService.obtenerProgramasPorGranja(granjaSeleccionada.id);
            setProgramasGranja(programasActualizados);
        } catch (error: any) {
            console.error('❌ Error al remover programa:', error);
            setError(error.message || 'Error al remover programa');
            toast.error(`Error al remover programa: ${error.message || 'Error desconocido'}`, {
                duration: 4000,
                position: 'top-right'
            });
        }
    };

    if (cargando) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <span className="ml-4 text-gray-600">Cargando datos...</span>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Gestión de Granjas</h1>

            {/* Mensaje de exportación */}
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
                    onClick={handleExportGranjas}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatsCard
                    icon="fas fa-warehouse"
                    color="bg-green-600"
                    value={granjas.length}
                    label="Granjas Registradas"
                />
                <StatsCard
                    icon="fas fa-users"
                    color="bg-blue-600"
                    value={usuarios.length}
                    label="Usuarios Totales"
                />
                <StatsCard
                    icon="fas fa-clipboard-list"
                    color="bg-purple-600"
                    value={programas.length}
                    label="Programas Totales"
                />
            </div>

            {/* Botón Crear */}
            <div className="mb-6">
                <button
                    onClick={() => {
                        setDatosFormulario({ nombre: "", ubicacion: "", activo: true });
                        setEditando(false);
                        setModalCrear(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                    <i className="fas fa-plus"></i>
                    Nueva Granja
                </button>
            </div>

            {/* Tabla */}
            <GranjasTable
                granjas={granjas}
                onEditar={abrirEditar}
                onEliminar={manejarEliminar}
                onVerDetalles={abrirDetalles}
            />

            {/* FORM */}
            <GranjaForm
                isOpen={modalCrear}
                onClose={() => {
                    setModalCrear(false);
                    setEditando(false);
                    setDatosFormulario({ nombre: "", ubicacion: "", activo: true });
                }}
                datosFormulario={datosFormulario}
                setDatosFormulario={setDatosFormulario}
                onSubmit={manejarCrear}
                editando={editando}
            />

            {/* DETALLES */}
            <DetallesGranja
                isOpen={modalDetalles}
                onClose={() => setModalDetalles(false)}
                granja={granjaSeleccionada}
                usuariosGranja={usuariosGranja}
                programasGranja={programasGranja}
                onAsignarUsuarioOpen={() => setModalAsignarUsuario(true)}
                onAsignarProgramaOpen={() => setModalAsignarPrograma(true)}
                onRemoveUsuario={removerUsuario}
                onRemovePrograma={removerPrograma}
            />

            {/* MODAL USUARIO */}
            <AsignarUsuarioModal
                isOpen={modalAsignarUsuario}
                onClose={() => {
                    setModalAsignarUsuario(false);
                    setUsuarioSeleccionado(0);
                }}
                usuarios={usuarios}
                usuariosAsignados={usuariosGranja}
                usuarioSeleccionado={usuarioSeleccionado}
                setUsuarioSeleccionado={setUsuarioSeleccionado}
                onAsignar={asignarUsuario}
            />

            {/* MODAL PROGRAMA */}
            <AsignarProgramaModal
                isOpen={modalAsignarPrograma}
                onClose={() => {
                    setModalAsignarPrograma(false);
                    setProgramaSeleccionado(0);
                }}
                programas={programas}
                programasGranja={programasGranja}
                programaSeleccionado={programaSeleccionado}
                setProgramaSeleccionado={setProgramaSeleccionado}
                onAsignar={asignarPrograma}
            />
        </div>
    );
}