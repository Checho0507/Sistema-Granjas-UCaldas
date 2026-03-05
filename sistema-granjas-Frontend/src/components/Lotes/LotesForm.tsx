import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../Common/Modal';
import cultivoService from '../../services/cultivoService';

interface LoteFormProps {
    isOpen: boolean;
    onClose: () => void;
    datosFormulario: any;
    setDatosFormulario: React.Dispatch<React.SetStateAction<any>>;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    editando: boolean;
    tiposLote: any[];
    granjas: any[];
    programas: any[];
    programaIdFijo?: number; // Para cuando el lote pertenece a un programa específico
}

const LoteForm: React.FC<LoteFormProps> = ({
    isOpen,
    onClose,
    datosFormulario,
    setDatosFormulario,
    onSubmit,
    editando,
    tiposLote,
    granjas,
    programas,
    programaIdFijo
}) => {
    const [cultivos, setCultivos] = useState<any[]>([]);
    const [cargandoCultivos, setCargandoCultivos] = useState(false);
    const [enviando, setEnviando] = useState(false);

    // Efecto para cargar cultivos cuando cambia la granja seleccionada
    useEffect(() => {
        const cargarCultivosDeGranja = async () => {
            if (datosFormulario.granja_id) {
                setCargandoCultivos(true);

                // Mostrar toast de carga si toma más de 300ms
                const loadingTimeout = setTimeout(() => {
                    toast.loading('Cargando cultivos de la granja...', {
                        id: 'cargando-cultivos-lote'
                    });
                }, 300);

                try {
                    const cultivosData = await cultivoService.obtenerCultivosPorGranja(datosFormulario.granja_id);
                    setCultivos(cultivosData);

                    clearTimeout(loadingTimeout);
                    toast.dismiss('cargando-cultivos-lote');

                    // Si estamos editando y el cultivo_id existe en la lista, mantenerlo
                    // Si no, resetear el cultivo_id
                    if (datosFormulario.cultivo_id) {
                        const cultivoExiste = cultivosData.some(c => c.id === datosFormulario.cultivo_id);
                        if (!cultivoExiste) {
                            setDatosFormulario(prev => ({
                                ...prev,
                                cultivo_id: null,
                                nombre_cultivo: ''
                            }));

                            toast('El cultivo anterior ya no está disponible para esta granja', {
                                duration: 3000,
                                icon: '⚠️',
                                position: 'top-right'
                            });
                        }
                    }
                } catch (error: any) {
                    console.error('Error cargando cultivos:', error);
                    setCultivos([]);

                    clearTimeout(loadingTimeout);
                    toast.dismiss('cargando-cultivos-lote');

                    toast.error('Error al cargar los cultivos de la granja', {
                        duration: 4000,
                        position: 'top-right'
                    });
                } finally {
                    setCargandoCultivos(false);
                }
            } else {
                setCultivos([]);
                // Resetear cultivo_id si no hay granja seleccionada
                setDatosFormulario(prev => ({
                    ...prev,
                    cultivo_id: null,
                    nombre_cultivo: ''
                }));
            }
        };

        if (isOpen) {
            cargarCultivosDeGranja();
        }
    }, [datosFormulario.granja_id, isOpen, setDatosFormulario]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        // Para campos numéricos
        let parsedValue: any = value;
        if (type === 'number') {
            parsedValue = value === '' ? 0 : parseInt(value);
        }

        setDatosFormulario(prev => ({
            ...prev,
            [name]: parsedValue
        }));

        // Si cambia la granja, resetear el cultivo_id
        if (name === 'granja_id') {
            setDatosFormulario(prev => ({
                ...prev,
                cultivo_id: null,
                nombre_cultivo: ''
            }));

            const granjaSeleccionada = granjas.find(g => g.id === parseInt(value));
            if (granjaSeleccionada) {
                toast.success(`Granja "${granjaSeleccionada.nombre}" seleccionada`, {
                    duration: 2000,
                    position: 'top-right',
                    id: `granja-${granjaSeleccionada.id}`
                });
            }
        }
    };

    // Manejar cambio de cultivo seleccionado
    const handleCultivoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cultivoId = parseInt(e.target.value);
        const cultivoSeleccionado = cultivos.find(c => c.id === cultivoId);

        setDatosFormulario(prev => ({
            ...prev,
            cultivo_id: cultivoId,
            nombre_cultivo: cultivoSeleccionado ? cultivoSeleccionado.nombre : ''
        }));

        if (cultivoSeleccionado) {
            toast.success(`Cultivo seleccionado: ${cultivoSeleccionado.nombre}`, {
                duration: 2000,
                position: 'top-right',
                id: `cultivo-${cultivoSeleccionado.id}`
            });
        }
    };

    // Opciones de estado
    const estados = [
        { value: 'activo', label: 'Activo' },
        { value: 'inactivo', label: 'Inactivo' },
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'completado', label: 'Completado' }
    ];

    // Validar nombre del lote
    const validarNombreLote = (nombre: string): { valido: boolean; mensaje?: string } => {
        if (!nombre.trim()) {
            return { valido: false, mensaje: 'El nombre del lote es requerido' };
        }

        const regexValido = /^[\p{L}0-9\s\-.,()]+$/u;
        if (!regexValido.test(nombre)) {
            return { valido: false, mensaje: 'El nombre contiene caracteres no permitidos. Solo letras, números, espacios y los caracteres: - . , ( )' };
        }

        if (/^[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/.test(nombre) || /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]$/.test(nombre)) {
            return { valido: false, mensaje: 'El nombre no puede empezar o terminar con caracteres especiales' };
        }

        return { valido: true };
    };

    // Manejar envío del formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (enviando) {
            toast.error('Ya hay una operación en curso', {
                duration: 2000,
                position: 'top-right',
                id: 'operacion-en-curso'
            });
            return;
        }

        // Validaciones
        if (!datosFormulario.cultivo_id) {
            toast.error('Por favor selecciona un cultivo', {
                duration: 4000,
                position: 'top-right',
                id: 'error-cultivo'
            });
            return;
        }

        const validacionNombre = validarNombreLote(datosFormulario.nombre);
        if (!validacionNombre.valido) {
            toast.error(validacionNombre.mensaje!, {
                duration: 5000,
                position: 'top-right',
                id: 'error-nombre'
            });
            return;
        }

        if (!datosFormulario.tipo_lote_id) {
            toast.error('Por favor selecciona un tipo de lote', {
                duration: 4000,
                position: 'top-right',
                id: 'error-tipo'
            });
            return;
        }

        if (!datosFormulario.granja_id) {
            toast.error('Por favor selecciona una granja', {
                duration: 4000,
                position: 'top-right',
                id: 'error-granja'
            });
            return;
        }

        if (!datosFormulario.programa_id && !programaIdFijo) {
            toast.error('Por favor selecciona un programa', {
                duration: 4000,
                position: 'top-right',
                id: 'error-programa'
            });
            return;
        }

        setEnviando(true);

        try {
            const loadingToastId = toast.loading(
                editando ? 'Actualizando lote...' : 'Creando lote...',
                { id: 'procesando-lote' }
            );

            await onSubmit(e);

            toast.dismiss(loadingToastId);
            
            toast.success(
                editando ? '¡Lote actualizado exitosamente!' : '¡Lote creado exitosamente!',
                {
                    duration: 3000,
                    position: 'top-right',
                    id: 'operacion-exitosa'
                }
            );

            setTimeout(() => {
                onClose();
            }, 500);

        } catch (error: any) {
            console.error('Error en handleSubmit del formulario:', error);
            
            toast.dismiss('procesando-lote');

            // Manejar errores específicos
            if (error.response?.data?.detail) {
                const errores = error.response.data.detail;
                if (Array.isArray(errores)) {
                    errores.forEach((err: any) => {
                        toast.error(`Error: ${err.msg || 'Error desconocido'}`, {
                            duration: 5000,
                            position: 'top-right',
                            id: `error-${Date.now()}`
                        });
                    });
                } else {
                    toast.error(`Error: ${errores}`, {
                        duration: 5000,
                        position: 'top-right',
                        id: 'error-general'
                    });
                }
            } else if (error.message) {
                toast.error(`Error: ${error.message}`, {
                    duration: 5000,
                    position: 'top-right',
                    id: 'error-mensaje'
                });
            }
        } finally {
            setEnviando(false);
        }
    };

    const handleCancel = () => {
        if (enviando) {
            toast.error('Por favor espera a que termine la operación actual', {
                duration: 2000,
                position: 'top-right',
                id: 'cancelar-bloqueado'
            });
            return;
        }

        // Verificar si hay cambios
        const hayCambios = datosFormulario.nombre || 
                          datosFormulario.granja_id || 
                          datosFormulario.tipo_lote_id ||
                          datosFormulario.cultivo_id;

        if (hayCambios) {
            const confirmar = window.confirm('¿Estás seguro de cancelar? Los cambios no guardados se perderán.');
            if (!confirmar) return;
        }

        toast('Formulario cancelado', {
            duration: 2000,
            icon: '👋',
            position: 'top-right'
        });
        
        onClose();
    };

    // Determinar si el campo programa debe estar deshabilitado
    const programaDeshabilitado = !!programaIdFijo || enviando;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleCancel}
            title={editando ? 'Editar Lote' : 'Nuevo Lote'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4 px-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nombre */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del Lote *
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                value={datosFormulario.nombre}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                required
                                placeholder="Ej: Lote Norte, Parcela 1"
                                disabled={enviando}
                                maxLength={100}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Solo letras, números, espacios y los caracteres: - . , ( )
                            </p>
                        </div>

                        {/* Tipo de Lote */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo de Lote *
                            </label>
                            <select
                                name="tipo_lote_id"
                                value={datosFormulario.tipo_lote_id || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                required
                                disabled={enviando}
                            >
                                <option value="">Seleccionar tipo</option>
                                {tiposLote.map(tipo => (
                                    <option key={tipo.id} value={tipo.id}>
                                        {tipo.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Estado */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estado *
                            </label>
                            <select
                                name="estado"
                                value={datosFormulario.estado}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                required
                                disabled={enviando}
                            >
                                {estados.map(estado => (
                                    <option key={estado.value} value={estado.value}>
                                        {estado.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Granja */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Granja *
                            </label>
                            <select
                                name="granja_id"
                                value={datosFormulario.granja_id || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                required
                                disabled={enviando}
                            >
                                <option value="">Seleccionar granja</option>
                                {granjas.map(granja => (
                                    <option key={granja.id} value={granja.id}>
                                        {granja.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Programa */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Programa *
                            </label>
                            <select
                                name="programa_id"
                                value={programaIdFijo || datosFormulario.programa_id || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                required
                                disabled={programaDeshabilitado}
                            >
                                <option value="">Seleccionar programa</option>
                                {programas.map(programa => (
                                    <option key={programa.id} value={programa.id}>
                                        {programa.nombre}
                                    </option>
                                ))}
                            </select>
                            {programaIdFijo && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Programa fijo para este lote
                                </p>
                            )}
                        </div>

                        {/* Cultivo */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cultivo *
                            </label>
                            <div className="flex items-center space-x-2">
                                <select
                                    name="cultivo_id"
                                    value={datosFormulario.cultivo_id || ''}
                                    onChange={handleCultivoChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    required
                                    disabled={cargandoCultivos || !datosFormulario.granja_id || enviando}
                                >
                                    <option value="">
                                        {!datosFormulario.granja_id
                                            ? 'Primero seleccione una granja'
                                            : cargandoCultivos
                                                ? 'Cargando cultivos...'
                                                : cultivos.length === 0
                                                    ? 'No hay cultivos en esta granja'
                                                    : 'Seleccionar cultivo'}
                                    </option>
                                    {cultivos.map(cultivo => (
                                        <option key={cultivo.id} value={cultivo.id}>
                                            {cultivo.nombre} ({cultivo.tipo})
                                        </option>
                                    ))}
                                </select>
                                {cargandoCultivos && (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                                )}
                            </div>
                            <input
                                type="hidden"
                                name="nombre_cultivo"
                                value={datosFormulario.nombre_cultivo || ''}
                            />
                            {datosFormulario.nombre_cultivo && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Cultivo seleccionado: <span className="font-medium">{datosFormulario.nombre_cultivo}</span>
                                </p>
                            )}
                        </div>

                        {/* Fecha Inicio */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha de Inicio *
                            </label>
                            <input
                                type="date"
                                name="fecha_inicio"
                                value={datosFormulario.fecha_inicio}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                required
                                disabled={enviando}
                            />
                        </div>
                    </div>

                    {/* Nota informativa - Sin cultivos */}
                    {datosFormulario.granja_id && cultivos.length === 0 && !cargandoCultivos && (
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <i className="fas fa-exclamation-triangle text-yellow-400"></i>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        Esta granja no tiene cultivos registrados. 
                                        <button
                                            type="button"
                                            onClick={() => {
                                                toast('Redirigiendo a gestión de cultivos...', {
                                                    duration: 2000,
                                                    icon: '🚀',
                                                    position: 'top-right'
                                                });
                                                window.open('/gestion-cultivos', '_blank');
                                            }}
                                            className="ml-1 text-yellow-700 underline hover:text-yellow-600 font-medium"
                                        >
                                            Crear un cultivo primero.
                                        </button>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Botones */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={enviando}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center min-w-[120px] justify-center"
                        disabled={
                            !datosFormulario.cultivo_id ||
                            !datosFormulario.nombre.trim() ||
                            !datosFormulario.tipo_lote_id ||
                            !datosFormulario.granja_id ||
                            (!datosFormulario.programa_id && !programaIdFijo) ||
                            enviando
                        }
                    >
                        {enviando ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                {editando ? 'Actualizando...' : 'Creando...'}
                            </>
                        ) : (
                            editando ? 'Actualizar Lote' : 'Crear Lote'
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default LoteForm;