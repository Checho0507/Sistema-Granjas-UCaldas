import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '../Common/Modal';
import cultivoService from '../../services/cultivoService';
import CultivosMultiSelect from './CultivosMultiSelect';

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
    programaIdFijo?: number;
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

    // 🔥 Formatear fecha para input type="date"
    const formatDate = (date: any) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    };

    // 🔥 Cargar cultivos por granja
    useEffect(() => {
        const cargarCultivos = async () => {
            if (!datosFormulario.granja_id) {
                setCultivos([]);
                setDatosFormulario((prev: any) => ({
                    ...prev,
                    cultivos_ids: []
                }));
                return;
            }

            setCargandoCultivos(true);

            try {
                const data = await cultivoService.obtenerCultivosPorGranja(datosFormulario.granja_id);
                setCultivos(data);

                // Validar cultivos existentes en edición
                if (editando && datosFormulario.cultivos_ids?.length) {
                    const validos = datosFormulario.cultivos_ids.filter((id: number) =>
                        data.some((c: any) => c.id === id)
                    );

                    if (validos.length !== datosFormulario.cultivos_ids.length) {
                        setDatosFormulario((prev: any) => ({
                            ...prev,
                            cultivos_ids: validos
                        }));
                    }
                }

            } catch (error) {
                console.error(error);
                setCultivos([]);
                toast.error('Error cargando cultivos');
            } finally {
                setCargandoCultivos(false);
            }
        };

        if (isOpen) cargarCultivos();
    }, [datosFormulario.granja_id, isOpen, editando, setDatosFormulario]);

    // 🔥 Manejo correcto de cambios
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        let parsedValue: any = value;

        // Convertir a número si aplica
        if (['tipo_lote_id', 'granja_id', 'programa_id'].includes(name)) {
            parsedValue = value ? parseInt(value) : null;
        }

        setDatosFormulario((prev: any) => ({
            ...prev,
            [name]: parsedValue
        }));

        // 🔥 Reset cultivos si cambia granja
        if (name === 'granja_id') {
            setDatosFormulario((prev: any) => ({
                ...prev,
                cultivos_ids: []
            }));
        }
    };

    const handleCultivosChange = (ids: number[]) => {
        setDatosFormulario((prev: any) => ({
            ...prev,
            cultivos_ids: ids
        }));
    };

    const validarNombre = (nombre: string) => {
        if (!nombre) return false;

        const regex = /^[\p{L}0-9\s\-.,()]+$/u;
        return regex.test(nombre);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (enviando) return;

        if (!datosFormulario.nombre?.trim()) {
            toast.error('Nombre requerido');
            return;
        }

        if (!validarNombre(datosFormulario.nombre)) {
            toast.error('Nombre inválido');
            return;
        }

        if (!datosFormulario.cultivos_ids?.length) {
            toast.error('Selecciona al menos un cultivo');
            return;
        }

        setEnviando(true);

        try {
            await onSubmit(e);
            toast.success(editando ? 'Lote actualizado' : 'Lote creado');
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || 'Error al guardar');
        } finally {
            setEnviando(false);
        }
    };

    const estados = [
        { value: 'activo', label: 'Activo' },
        { value: 'inactivo', label: 'Inactivo' },
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'completado', label: 'Completado' }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editando ? 'Editar Lote' : 'Nuevo Lote'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Nombre */}
                <input
                    type="text"
                    name="nombre"
                    value={datosFormulario.nombre || ''}
                    onChange={handleChange}
                    placeholder="Nombre del lote"
                />

                {/* Tipo lote */}
                <select
                    name="tipo_lote_id"
                    value={datosFormulario.tipo_lote_id || ''}
                    onChange={handleChange}
                >
                    <option value="">Tipo</option>
                    {tiposLote.map(t => (
                        <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                </select>

                {/* Granja */}
                <select
                    name="granja_id"
                    value={datosFormulario.granja_id || ''}
                    onChange={handleChange}
                >
                    <option value="">Granja</option>
                    {granjas.map(g => (
                        <option key={g.id} value={g.id}>{g.nombre}</option>
                    ))}
                </select>

                {/* Programa */}
                <select
                    name="programa_id"
                    value={programaIdFijo || datosFormulario.programa_id || ''}
                    onChange={handleChange}
                    disabled={!!programaIdFijo}
                >
                    <option value="">Programa</option>
                    {programas.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                </select>

                {/* Cultivos */}
                <CultivosMultiSelect
                    cultivos={cultivos}
                    selectedIds={datosFormulario.cultivos_ids || []}
                    onChange={handleCultivosChange}
                    disabled={!datosFormulario.granja_id}
                    cargando={cargandoCultivos}
                />

                {/* Fecha */}
                <input
                    type="date"
                    name="fecha_inicio"
                    value={formatDate(datosFormulario.fecha_inicio)}
                    onChange={handleChange}
                />

                {/* Estado */}
                <select
                    name="estado"
                    value={datosFormulario.estado || 'activo'}
                    onChange={handleChange}
                >
                    {estados.map(e => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                </select>

                {/* Botón */}
                <button disabled={enviando}>
                    {enviando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear'}
                </button>

            </form>
        </Modal>
    );
};

export default LoteForm;