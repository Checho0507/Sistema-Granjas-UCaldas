import React, { useEffect } from 'react';
import type { DiagnosticoCampo } from '../../services/diagnosticoDinamicoService';

interface Props {
  campos: DiagnosticoCampo[];
  valores: Record<string, any>;
  onChange: (nombre: string, valor: any) => void;
}

const FormularioDinamicoSection: React.FC<Props> = ({ campos, valores, onChange }) => {
  if (!campos || campos.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-sm">
        <i className="fas fa-info-circle mr-2"></i>
        Este tipo de diagnóstico no tiene campos configurados. Contacta al administrador.
      </div>
    );
  }

  // Helper: saber si un campo es visible según el valor actual de su padre
  const esCampoVisible = (campo: DiagnosticoCampo): boolean => {
    if (!campo.campo_padre_id) return true;
    const padre = campos.find(c => c.id === campo.campo_padre_id);
    if (!padre) return true;
    const valorPadre = valores[padre.nombre_campo];
    if (!valorPadre || !campo.opciones_padre) return false;
    
    // Soporta multiselect (array) y select (string)
    if (Array.isArray(valorPadre)) {
      return campo.opciones_padre.some(op => valorPadre.includes(op));
    }
    return campo.opciones_padre.includes(valorPadre);
  };

  // Helper: obtener el valor de un campo en formato legible
  const getValorLegible = (campo: DiagnosticoCampo): string => {
    const valor = valores[campo.nombre_campo];
    if (!valor) return 'No seleccionado';
    if (Array.isArray(valor)) {
      return valor.length > 0 ? valor.join(', ') : 'No seleccionado';
    }
    return String(valor);
  };

  // Helper: obtener el breadcrumb de dependencias para un campo
  const getBreadcrumb = (campo: DiagnosticoCampo): Array<{etiqueta: string; valor: string}> | null => {
    if (!campo.campo_padre_id) return null;
    
    const breadcrumb: Array<{etiqueta: string; valor: string}> = [];
    let currentCampo = campo;
    let visited = new Set<number>();
    
    while (currentCampo.campo_padre_id && !visited.has(currentCampo.id)) {
      visited.add(currentCampo.id);
      const padre = campos.find(c => c.id === currentCampo.campo_padre_id);
      if (!padre) break;
      
      const valorPadre = valores[padre.nombre_campo];
      const valorLegible = Array.isArray(valorPadre) 
        ? valorPadre.join(', ') 
        : (valorPadre || 'No seleccionado');
      
      breadcrumb.unshift({
        etiqueta: padre.etiqueta,
        valor: valorLegible
      });
      
      currentCampo = padre;
    }
    
    return breadcrumb.length > 0 ? breadcrumb : null;
  };

  // Helper: obtener todos los IDs de campos que dependen de un campo (directa o indirectamente)
  const obtenerDependientes = (campoId: number): number[] => {
    const hijos = campos.filter(c => c.campo_padre_id === campoId);
    let todos: number[] = [];
    hijos.forEach(hijo => {
      todos.push(hijo.id);
      todos = [...todos, ...obtenerDependientes(hijo.id)];
    });
    return todos;
  };

  // Limpiar valores de campos que se vuelven invisibles
  useEffect(() => {
    campos.forEach(campo => {
      if (!esCampoVisible(campo)) {
        // Si el campo no es visible y tiene un valor, lo limpiamos
        if (valores[campo.nombre_campo] !== undefined && valores[campo.nombre_campo] !== '') {
          onChange(campo.nombre_campo, '');
        }
        
        // Limpiar también todos sus dependientes en cascada
        const dependientes = obtenerDependientes(campo.id);
        dependientes.forEach(depId => {
          const depCampo = campos.find(c => c.id === depId);
          if (depCampo && valores[depCampo.nombre_campo] !== undefined && valores[depCampo.nombre_campo] !== '') {
            onChange(depCampo.nombre_campo, '');
          }
        });
      }
    });
  }, [campos, valores, onChange]);

  // Manejar cambio en campo padre (select/multiselect) limpiando hijos que ya no aplican
  const handleSelectChange = (campo: DiagnosticoCampo, nuevoValor: any) => {
    // Primero actualizar el valor del campo actual
    onChange(campo.nombre_campo, nuevoValor);
    
    // Obtener todos los dependientes directos
    const hijosDirectos = campos.filter(c => c.campo_padre_id === campo.id);
    
    hijosDirectos.forEach(hijo => {
      if (hijo.opciones_padre) {
        // Verificar si el nuevo valor del padre aún incluye a este hijo
        const valorArray = Array.isArray(nuevoValor) ? nuevoValor : [nuevoValor];
        const hijoVisible = hijo.opciones_padre.some(op => valorArray.includes(op));
        
        if (!hijoVisible) {
          // Si el hijo ya no es visible, limpiar su valor y todos sus dependientes
          onChange(hijo.nombre_campo, '');
          limpiarDependientes(hijo.id);
        }
      }
    });
  };

  // Función recursiva para limpiar dependientes en cascada
  const limpiarDependientes = (campoId: number) => {
    const dependientes = campos.filter(c => c.campo_padre_id === campoId);
    dependientes.forEach(dep => {
      if (valores[dep.nombre_campo] !== undefined && valores[dep.nombre_campo] !== '') {
        onChange(dep.nombre_campo, '');
      }
      limpiarDependientes(dep.id);
    });
  };

  // Filtrar campos visibles
  const camposVisibles = campos.filter(esCampoVisible);

  const renderCampo = (campo: DiagnosticoCampo) => {
    const valor = valores[campo.nombre_campo] ?? '';
    const baseClass = "w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

    switch (campo.tipo_dato) {
      case 'textarea':
        return (
          <textarea
            value={valor}
            onChange={e => onChange(campo.nombre_campo, e.target.value)}
            className={baseClass}
            rows={3}
            placeholder={campo.etiqueta}
            required={campo.requerido}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={valor}
            onChange={e => onChange(campo.nombre_campo, e.target.value)}
            className={baseClass}
            placeholder="0"
            required={campo.requerido}
            step="any"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={valor}
            onChange={e => onChange(campo.nombre_campo, e.target.value)}
            className={baseClass}
            required={campo.requerido}
          />
        );

      case 'select':
        return (
          <select
            value={Array.isArray(valor) ? '' : valor}
            onChange={e => handleSelectChange(campo, e.target.value)}
            className={baseClass}
            required={campo.requerido}
          >
            <option value="">Seleccionar...</option>
            {(campo.opciones || []).map(op => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        );

      case 'multiselect': {
        const seleccionados: string[] = Array.isArray(valor) ? valor : [];
        return (
          <div className="space-y-1.5">
            {(campo.opciones || []).map(op => (
              <label key={op} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seleccionados.includes(op)}
                  onChange={e => {
                    const nuevo = e.target.checked
                      ? [...seleccionados, op]
                      : seleccionados.filter(v => v !== op);
                    handleSelectChange(campo, nuevo);
                  }}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">{op}</span>
              </label>
            ))}
          </div>
        );
      }

      case 'boolean':
        return (
          <select
            value={valor}
            onChange={e => onChange(campo.nombre_campo, e.target.value)}
            className={baseClass}
            required={campo.requerido}
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
            value={valor}
            onChange={e => onChange(campo.nombre_campo, e.target.value)}
            className={baseClass}
            placeholder={campo.etiqueta}
            required={campo.requerido}
          />
        );
    }
  };

  // Obtener el nivel de anidación de un campo (para el padding izquierdo)
  const getNivelAnidacion = (campo: DiagnosticoCampo): number => {
    let nivel = 0;
    let currentCampo = campo;
    let visited = new Set<number>();
    
    while (currentCampo.campo_padre_id && !visited.has(currentCampo.id)) {
      visited.add(currentCampo.id);
      nivel++;
      const padre = campos.find(c => c.id === currentCampo.campo_padre_id);
      if (!padre) break;
      currentCampo = padre;
    }
    
    return nivel;
  };

  return (
    <div className="space-y-4">
      {camposVisibles.map(campo => {
        const breadcrumb = getBreadcrumb(campo);
        const nivel = getNivelAnidacion(campo);
        const colors = ['border-yellow-300', 'border-orange-300', 'border-pink-300', 'border-purple-300'];
        const borderColor = nivel > 0 ? colors[Math.min(nivel - 1, colors.length - 1)] : '';
        
        return (
          <div 
            key={campo.id} 
            className={nivel > 0 ? `pl-4 border-l-2 ${borderColor}` : ''}
          >
            {/* Breadcrumb de dependencias */}
            {breadcrumb && breadcrumb.length > 0 && (
              <div className="mb-2 flex flex-wrap items-center gap-1 text-xs">
                {breadcrumb.map((item, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && (
                      <i className="fas fa-chevron-right text-gray-300 text-[10px]"></i>
                    )}
                    <span className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">
                      <span className="text-gray-500 font-medium">{item.etiqueta}:</span>
                      <span className="text-gray-700 font-semibold">{item.valor}</span>
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}
            
            {/* Etiqueta del campo */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {campo.etiqueta}
              {campo.requerido && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {/* Render del campo */}
            {renderCampo(campo)}
            
            {/* Indicador de que este campo tiene hijos */}
            {campos.some(c => c.campo_padre_id === campo.id && esCampoVisible(c)) && (
              <div className="mt-1 text-[10px] text-gray-400 italic flex items-center gap-1">
                <i className="fas fa-level-down-alt"></i>
                Tiene campos dependientes
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FormularioDinamicoSection;