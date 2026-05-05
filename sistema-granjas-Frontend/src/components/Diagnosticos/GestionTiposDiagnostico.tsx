import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { diagnosticoDinamicoService, type DiagnosticoTipo, type DiagnosticoCampo } from '../../services/diagnosticoDinamicoService';

interface Props {
  programaId: number;
  programaNombre?: string;
}

const TIPOS_DATO_LABELS: Record<string, string> = {
  text: 'Texto corto',
  textarea: 'Texto largo',
  number: 'Número',
  date: 'Fecha',
  select: 'Lista de opciones',
  boolean: 'Sí / No',
};

const GestionTiposDiagnostico: React.FC<Props> = ({ programaId, programaNombre }) => {
  const [tipos, setTipos] = useState<DiagnosticoTipo[]>([]);
  const [loading, setLoading] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<DiagnosticoTipo | null>(null);
  const [campos, setCampos] = useState<DiagnosticoCampo[]>([]);
  const [loadingCampos, setLoadingCampos] = useState(false);

  // Formulario tipo
  const [modalTipo, setModalTipo] = useState(false);
  const [editTipo, setEditTipo] = useState<DiagnosticoTipo | null>(null);
  const [formTipo, setFormTipo] = useState({ nombre: '', descripcion: '', orden: 0, activo: true });

  // Formulario campo
  const [modalCampo, setModalCampo] = useState(false);
  const [editCampo, setEditCampo] = useState<DiagnosticoCampo | null>(null);
  const [formCampo, setFormCampo] = useState({
    nombre_campo: '', etiqueta: '', tipo_dato: 'text', requerido: false,
    opciones_texto: '', orden: 0,
  });

  useEffect(() => {
    if (programaId) cargarTipos();
  }, [programaId]);

  const cargarTipos = async () => {
    setLoading(true);
    try {
      const data = await diagnosticoDinamicoService.listarTiposPorPrograma(programaId);
      setTipos(data);
    } catch { toast.error('Error al cargar tipos de diagnóstico'); }
    finally { setLoading(false); }
  };

  const cargarCampos = async (tipoId: number) => {
    setLoadingCampos(true);
    try {
      const data = await diagnosticoDinamicoService.listarCampos(tipoId);
      setCampos(data);
    } catch { toast.error('Error al cargar campos'); }
    finally { setLoadingCampos(false); }
  };

  const seleccionarTipo = (tipo: DiagnosticoTipo) => {
    setTipoSeleccionado(tipo);
    cargarCampos(tipo.id);
  };

  const abrirModalTipo = (tipo?: DiagnosticoTipo) => {
    if (tipo) {
      setEditTipo(tipo);
      setFormTipo({ nombre: tipo.nombre, descripcion: tipo.descripcion || '', orden: tipo.orden, activo: tipo.activo });
    } else {
      setEditTipo(null);
      setFormTipo({ nombre: '', descripcion: '', orden: 0, activo: true });
    }
    setModalTipo(true);
  };

  const guardarTipo = async () => {
    if (!formTipo.nombre.trim()) { toast.warning('El nombre es requerido'); return; }
    try {
      if (editTipo) {
        await diagnosticoDinamicoService.actualizarTipo(editTipo.id, formTipo);
        toast.success('Tipo actualizado');
      } else {
        await diagnosticoDinamicoService.crearTipo({ ...formTipo, programa_id: programaId });
        toast.success('Tipo creado');
      }
      setModalTipo(false);
      cargarTipos();
    } catch (e: any) { toast.error(e?.response?.data?.detail || 'Error al guardar'); }
  };

  const eliminarTipo = async (tipo: DiagnosticoTipo) => {
    if (!confirm(`¿Eliminar el tipo "${tipo.nombre}"? Se eliminarán todos sus campos.`)) return;
    try {
      await diagnosticoDinamicoService.eliminarTipo(tipo.id);
      toast.success('Tipo eliminado');
      if (tipoSeleccionado?.id === tipo.id) { setTipoSeleccionado(null); setCampos([]); }
      cargarTipos();
    } catch (e: any) { toast.error(e?.response?.data?.detail || 'Error al eliminar'); }
  };

  const abrirModalCampo = (campo?: DiagnosticoCampo) => {
    if (campo) {
      setEditCampo(campo);
      setFormCampo({
        nombre_campo: campo.nombre_campo, etiqueta: campo.etiqueta,
        tipo_dato: campo.tipo_dato, requerido: campo.requerido,
        opciones_texto: (campo.opciones || []).join(', '), orden: campo.orden,
      });
    } else {
      setEditCampo(null);
      setFormCampo({ nombre_campo: '', etiqueta: '', tipo_dato: 'text', requerido: false, opciones_texto: '', orden: 0 });
    }
    setModalCampo(true);
  };

  const guardarCampo = async () => {
    if (!tipoSeleccionado) return;
    if (!formCampo.etiqueta.trim()) { toast.warning('La etiqueta es requerida'); return; }
    const opciones = formCampo.tipo_dato === 'select'
      ? formCampo.opciones_texto.split(',').map(s => s.trim()).filter(Boolean)
      : undefined;
    if (formCampo.tipo_dato === 'select' && (!opciones || opciones.length === 0)) {
      toast.warning('Agrega al menos una opción para el campo de lista'); return;
    }
    const nombre = formCampo.nombre_campo.trim() || formCampo.etiqueta.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    try {
      if (editCampo) {
        await diagnosticoDinamicoService.actualizarCampo(editCampo.id, { ...formCampo, nombre_campo: nombre, opciones });
        toast.success('Campo actualizado');
      } else {
        await diagnosticoDinamicoService.crearCampo({ ...formCampo, nombre_campo: nombre, opciones, tipo_id: tipoSeleccionado.id });
        toast.success('Campo creado');
      }
      setModalCampo(false);
      cargarCampos(tipoSeleccionado.id);
    } catch (e: any) { toast.error(e?.response?.data?.detail || 'Error al guardar campo'); }
  };

  const eliminarCampo = async (campo: DiagnosticoCampo) => {
    if (!confirm(`¿Eliminar el campo "${campo.etiqueta}"?`)) return;
    try {
      await diagnosticoDinamicoService.eliminarCampo(campo.id);
      toast.success('Campo eliminado');
      if (tipoSeleccionado) cargarCampos(tipoSeleccionado.id);
    } catch (e: any) { toast.error(e?.response?.data?.detail || 'Error al eliminar campo'); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Panel izquierdo: Tipos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">
            Tipos de Diagnóstico {programaNombre && <span className="text-gray-500 font-normal">— {programaNombre}</span>}
          </h3>
          <button onClick={() => abrirModalTipo()} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1">
            <i className="fas fa-plus"></i> Nuevo Tipo
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div></div>
        ) : tipos.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
            <i className="fas fa-microscope text-3xl mb-3 block text-gray-300"></i>
            No hay tipos de diagnóstico aún.<br/>
            <button onClick={() => abrirModalTipo()} className="mt-3 text-blue-600 hover:underline text-sm">Crear el primero</button>
          </div>
        ) : (
          <div className="space-y-2">
            {tipos.map(tipo => (
              <div key={tipo.id}
                onClick={() => seleccionarTipo(tipo)}
                className={`border rounded-lg p-4 cursor-pointer transition ${tipoSeleccionado?.id === tipo.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{tipo.nombre}</p>
                    {tipo.descripcion && <p className="text-xs text-gray-500 mt-0.5">{tipo.descripcion}</p>}
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${tipo.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {tipo.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={() => abrirModalTipo(tipo)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded" title="Editar">
                      <i className="fas fa-edit text-sm"></i>
                    </button>
                    <button onClick={() => eliminarTipo(tipo)} className="text-red-500 hover:text-red-700 p-1.5 rounded" title="Eliminar">
                      <i className="fas fa-trash text-sm"></i>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-blue-500 mt-1">
                  <i className="fas fa-arrow-right mr-1"></i>Click para ver campos
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Panel derecho: Campos */}
      <div>
        {tipoSeleccionado ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">
                Campos: <span className="text-blue-600">{tipoSeleccionado.nombre}</span>
              </h3>
              <button onClick={() => abrirModalCampo()} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1">
                <i className="fas fa-plus"></i> Nuevo Campo
              </button>
            </div>
            {loadingCampos ? (
              <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div></div>
            ) : campos.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                <i className="fas fa-th-list text-3xl mb-3 block text-gray-300"></i>
                No hay campos definidos.<br/>
                <button onClick={() => abrirModalCampo()} className="mt-3 text-blue-600 hover:underline text-sm">Agregar primer campo</button>
              </div>
            ) : (
              <div className="space-y-2">
                {campos.map(campo => (
                  <div key={campo.id} className="border border-gray-200 rounded-lg p-3 bg-white flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-800">{campo.etiqueta}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{TIPOS_DATO_LABELS[campo.tipo_dato] || campo.tipo_dato}</span>
                        {campo.requerido && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Requerido</span>}
                        {campo.tipo_dato === 'select' && campo.opciones && (
                          <span className="text-xs text-gray-500">{campo.opciones.length} opciones</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => abrirModalCampo(campo)} className="text-blue-600 hover:text-blue-800 p-1.5 rounded">
                        <i className="fas fa-edit text-sm"></i>
                      </button>
                      <button onClick={() => eliminarCampo(campo)} className="text-red-500 hover:text-red-700 p-1.5 rounded">
                        <i className="fas fa-trash text-sm"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[200px] bg-gray-50 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm">
            <div className="text-center">
              <i className="fas fa-hand-pointer text-3xl mb-3 block text-gray-300"></i>
              Selecciona un tipo de diagnóstico<br/>para ver y editar sus campos
            </div>
          </div>
        )}
      </div>

      {/* Modal Tipo */}
      {modalTipo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-4">{editTipo ? 'Editar Tipo' : 'Nuevo Tipo de Diagnóstico'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input value={formTipo.nombre} onChange={e => setFormTipo(p => ({ ...p, nombre: e.target.value }))}
                  className="w-full border rounded-lg p-2.5" placeholder="Ej: Artropodos, Enfermedades foliares..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea value={formTipo.descripcion} onChange={e => setFormTipo(p => ({ ...p, descripcion: e.target.value }))}
                  className="w-full border rounded-lg p-2.5" rows={2} placeholder="Descripción opcional..." />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Orden</label>
                  <input type="number" value={formTipo.orden} onChange={e => setFormTipo(p => ({ ...p, orden: parseInt(e.target.value) || 0 }))}
                    className="w-full border rounded-lg p-2.5" min={0} />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <input type="checkbox" id="activo_tipo" checked={formTipo.activo} onChange={e => setFormTipo(p => ({ ...p, activo: e.target.checked }))}
                    className="w-4 h-4" />
                  <label htmlFor="activo_tipo" className="text-sm">Activo</label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={guardarTipo} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium">
                {editTipo ? 'Guardar cambios' : 'Crear tipo'}
              </button>
              <button onClick={() => setModalTipo(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg font-medium">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Campo */}
      {modalCampo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">{editCampo ? 'Editar Campo' : 'Nuevo Campo'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Etiqueta (lo que ve el usuario) *</label>
                <input value={formCampo.etiqueta} onChange={e => setFormCampo(p => ({ ...p, etiqueta: e.target.value }))}
                  className="w-full border rounded-lg p-2.5" placeholder="Ej: Número de ácaros, Color de hoja..." />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de dato *</label>
                <select value={formCampo.tipo_dato} onChange={e => setFormCampo(p => ({ ...p, tipo_dato: e.target.value as any }))}
                  className="w-full border rounded-lg p-2.5">
                  {Object.entries(TIPOS_DATO_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              {formCampo.tipo_dato === 'select' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Opciones (separadas por coma) *</label>
                  <input value={formCampo.opciones_texto} onChange={e => setFormCampo(p => ({ ...p, opciones_texto: e.target.value }))}
                    className="w-full border rounded-lg p-2.5" placeholder="Ej: Alto, Medio, Bajo" />
                  <p className="text-xs text-gray-400 mt-1">Escribe las opciones separadas por comas</p>
                </div>
              )}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Orden</label>
                  <input type="number" value={formCampo.orden} onChange={e => setFormCampo(p => ({ ...p, orden: parseInt(e.target.value) || 0 }))}
                    className="w-full border rounded-lg p-2.5" min={0} />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <input type="checkbox" id="requerido_campo" checked={formCampo.requerido} onChange={e => setFormCampo(p => ({ ...p, requerido: e.target.checked }))}
                    className="w-4 h-4" />
                  <label htmlFor="requerido_campo" className="text-sm">Requerido</label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={guardarCampo} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium">
                {editCampo ? 'Guardar cambios' : 'Crear campo'}
              </button>
              <button onClick={() => setModalCampo(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg font-medium">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionTiposDiagnostico;
