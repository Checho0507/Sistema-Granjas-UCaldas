import React, { useEffect, useMemo, useState } from 'react';
import type { DiagnosticoCampo } from '../../services/diagnosticoDinamicoService';

interface Props {
  campos: DiagnosticoCampo[];
  valores: Record<string, any>;
  onChange: (nombre: string, valor: any) => void;
  prefix?: string;
  contexto?: string;
}

// Componente para un campo que pertenece a un contexto específico (ej: un cuadrante)
const CampoConContexto: React.FC<{
  campo: DiagnosticoCampo;
  valor: any;
  contextoPath: string[];
  onChange: (valor: any) => void;
  required: boolean;
}> = ({ campo, valor, contextoPath, onChange, required }) => {
  const baseClass = "w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  
  // Construir el breadcrumb solo con los valores
  const breadcrumb = contextoPath.length > 0 ? contextoPath.join(' → ') : '';
  
  const renderInput = () => {
    switch (campo.tipo_dato) {
      case 'textarea':
        return (
          <textarea
            value={valor || ''}
            onChange={e => onChange(e.target.value)}
            className={baseClass}
            rows={3}
            required={required}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={valor || ''}
            onChange={e => onChange(e.target.value)}
            className={baseClass}
            required={required}
            step="any"
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={valor || ''}
            onChange={e => onChange(e.target.value)}
            className={baseClass}
            required={required}
          />
        );
      case 'select':
        return (
          <select
            value={valor || ''}
            onChange={e => onChange(e.target.value)}
            className={baseClass}
            required={required}
          >
            <option value="">Seleccionar...</option>
            {(Array.isArray(campo.opciones) ? campo.opciones : []).map((op: string) => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        );
      case 'boolean':
        return (
          <select
            value={valor || ''}
            onChange={e => onChange(e.target.value)}
            className={baseClass}
            required={required}
          >
            <option value="">Seleccionar...</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={valor || ''}
            onChange={e => onChange(e.target.value)}
            className={baseClass}
            required={required}
          />
        );
    }
  };

  return (
    <div className="mb-4 pb-3 border-b border-gray-100 last:border-0">
      {breadcrumb && (
        <div className="text-xs text-gray-400 mb-1">
          {breadcrumb}
        </div>
      )}
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {campo.etiqueta}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
    </div>
  );
};

const FormularioDinamicoSection: React.FC<Props> = ({ 
  campos, 
  valores, 
  onChange,
  prefix = '',
  contexto = ''
}) => {
  // Estado para expandir campos multiselect en múltiples instancias
  const [multiselectExpansions, setMultiselectExpansions] = useState<Record<string, string[]>>({});

  // Construir el árbol de dependencias
  const campoPorId = useMemo(() => {
    const map = new Map<number, DiagnosticoCampo>();
    campos.forEach(campo => map.set(campo.id, campo));
    return map;
  }, [campos]);

  // Obtener el valor de un campo por nombre
  const getValorCampo = (nombreCampo: string): any => {
    return valores[nombreCampo];
  };

  // Obtener la ruta de contexto (solo valores) para un campo específico y un valor específico
  const getContextoPath = (campo: DiagnosticoCampo, valorEspecifico?: string): string[] => {
    const path: string[] = [];
    
    // Agregar contexto general (planta)
    if (contexto) {
      path.push(contexto);
    }
    
    // Construir la ruta desde la raíz hasta este campo
    const buildPath = (currentCampo: DiagnosticoCampo, visited: Set<number> = new Set()): void => {
      if (visited.has(currentCampo.id)) return;
      visited.add(currentCampo.id);
      
      if (currentCampo.campo_padre_id) {
        const padre = campoPorId.get(currentCampo.campo_padre_id);
        if (padre) {
          buildPath(padre, visited);
          const valorPadre = getValorCampo(padre.nombre_campo);
          if (valorPadre) {
            // Si el padre es multiselect y tenemos un valor específico, usamos ese
            if (Array.isArray(valorPadre) && valorEspecifico) {
              path.push(valorEspecifico);
            } else if (!Array.isArray(valorPadre)) {
              path.push(String(valorPadre));
            }
          }
        }
      }
    };
    
    buildPath(campo);
    return path;
  };

  // Helper: saber si un campo es visible
  const esCampoVisible = (campo: DiagnosticoCampo, visitados: Set<number> = new Set()): boolean => {
    if (visitados.has(campo.id)) return true;
    visitados.add(campo.id);
    
    if (!campo.campo_padre_id) return true;
    const padre = campoPorId.get(campo.campo_padre_id);
    if (!padre) return true;
    
    const valorPadre = getValorCampo(padre.nombre_campo);
    if (!valorPadre || !campo.opciones_padre) return false;
    
    if (!esCampoVisible(padre, visitados)) return false;
    
    if (Array.isArray(valorPadre)) {
      return campo.opciones_padre.some(op => valorPadre.includes(op));
    }
    return campo.opciones_padre.includes(valorPadre);
  };

  // Inicializar expansiones para campos multiselect
  useEffect(() => {
    const newExpansions: Record<string, string[]> = {};
    
    campos.forEach(campo => {
      if (campo.tipo_dato === 'multiselect') {
        const valorActual = getValorCampo(campo.nombre_campo);
        if (Array.isArray(valorActual) && valorActual.length > 0) {
          newExpansions[campo.nombre_campo] = valorActual;
        }
      }
    });
    
    setMultiselectExpansions(prev => ({
      ...prev,
      ...newExpansions
    }));
  }, [campos, valores]);

  // Manejar cambio en un campo
  const handleChange = (campo: DiagnosticoCampo, nuevoValor: any) => {
    onChange(campo.nombre_campo, nuevoValor);
    
    // Limpiar expansiones si el campo cambió
    if (campo.tipo_dato === 'multiselect') {
      if (Array.isArray(nuevoValor)) {
        setMultiselectExpansions(prev => ({
          ...prev,
          [campo.nombre_campo]: nuevoValor
        }));
      } else {
        const newExpansions = { ...multiselectExpansions };
        delete newExpansions[campo.nombre_campo];
        setMultiselectExpansions(newExpansions);
      }
    }
  };

  // Generar campos expandidos para multiselect
  const generateExpandedFields = (campo: DiagnosticoCampo, selectedValues: string[]) => {
    const hijos = campos.filter(c => c.campo_padre_id === campo.id);
    if (hijos.length === 0) return null;
    
    return selectedValues.map(valorSeleccionado => {
      // Filtrar hijos que son visibles con esta selección
      const hijosVisibles = hijos.filter(hijo => {
        if (!hijo.opciones_padre) return true;
        return hijo.opciones_padre.includes(valorSeleccionado);
      });
      
      if (hijosVisibles.length === 0) return null;
      
      const contextoPath = getContextoPath(campo, valorSeleccionado);
      
      return (
        <div key={`${campo.nombre_campo}_${valorSeleccionado}`} className="ml-4 pl-4 border-l-2 border-blue-200 mt-3 mb-3">
          <div className="text-xs text-blue-600 font-medium mb-2">
            {contextoPath.length > 0 ? contextoPath.join(' → ') : valorSeleccionado}
          </div>
          {hijosVisibles.map(hijo => (
            <CampoConContexto
              key={hijo.id}
              campo={hijo}
              valor={getValorCampo(hijo.nombre_campo)}
              contextoPath={[...contextoPath, valorSeleccionado]}
              onChange={(newVal) => handleChange(hijo, newVal)}
              required={hijo.requerido}
            />
          ))}
        </div>
      );
    });
  };

  // Renderizar un campo normal (no multiselect)
  const renderCampoNormal = (campo: DiagnosticoCampo) => {
    const valor = getValorCampo(campo.nombre_campo);
    const contextoPath = getContextoPath(campo);
    const hijos = campos.filter(c => c.campo_padre_id === campo.id);
    const hijosVisibles = hijos.filter(h => esCampoVisible(h));
    
    return (
      <div key={campo.id} className="mb-4">
        <CampoConContexto
          campo={campo}
          valor={valor}
          contextoPath={contextoPath}
          onChange={(newVal) => handleChange(campo, newVal)}
          required={campo.requerido}
        />
        
        {/* Renderizar hijos no multiselect */}
        {hijosVisibles.length > 0 && (
          <div className="ml-4 pl-4 border-l-2 border-gray-200 mt-3">
            {hijosVisibles.map(hijo => renderCampoNormal(hijo))}
          </div>
        )}
      </div>
    );
  };

  // Renderizar un campo multiselect con sus hijos expandidos
  const renderCampoMultiselect = (campo: DiagnosticoCampo) => {
    const valor = getValorCampo(campo.nombre_campo);
    const selectedValues = Array.isArray(valor) ? valor : [];
    const contextoPath = getContextoPath(campo);
    
    return (
      <div key={campo.id} className="mb-4">
        <div className="mb-2">
          {contextoPath.length > 0 && (
            <div className="text-xs text-gray-400 mb-1">
              {contextoPath.join(' → ')}
            </div>
          )}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {campo.etiqueta}
            {campo.requerido && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="space-y-2">
            {(Array.isArray(campo.opciones) ? campo.opciones : []).map((op: string) => (
              <label key={op} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(op)}
                  onChange={e => {
                    const nuevo = e.target.checked
                      ? [...selectedValues, op]
                      : selectedValues.filter(v => v !== op);
                    handleChange(campo, nuevo);
                  }}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">{op}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Expandir hijos por cada valor seleccionado */}
        {selectedValues.length > 0 && (
          <div className="ml-4 space-y-4">
            {generateExpandedFields(campo, selectedValues)}
          </div>
        )}
      </div>
    );
  };

  // Ordenar campos: primeros los que no tienen padre
  const camposRaiz = campos.filter(c => !c.campo_padre_id);
  const camposOrdenados = [...camposRaiz].sort((a, b) => a.orden - b.orden);

  if (!campos || campos.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-sm">
        <i className="fas fa-info-circle mr-2"></i>
        Este tipo de diagnóstico no tiene campos configurados. Contacta al administrador.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {camposOrdenados.map(campo => {
        if (campo.tipo_dato === 'multiselect') {
          return renderCampoMultiselect(campo);
        }
        return renderCampoNormal(campo);
      })}
    </div>
  );
};

export default FormularioDinamicoSection;