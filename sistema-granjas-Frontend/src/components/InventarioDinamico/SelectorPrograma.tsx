// src/components/InventarioDinamico/SelectorPrograma.tsx
import React, { useEffect, useState } from 'react';
import programaService from '../../services/programaService';

interface SelectorProgramaProps {
  onProgramaChange: (programaId: number | null) => void;
  programaIdSeleccionado?: number;
}

const SelectorPrograma: React.FC<SelectorProgramaProps> = ({ onProgramaChange, programaIdSeleccionado }) => {
  const [programas, setProgramas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await programaService.obtenerProgramas();
        setProgramas(data);
      } catch (error) {
        console.error(error);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  if (cargando) return <div className="animate-pulse">Cargando programas...</div>;

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-1">Programa</label>
      <select
        className="w-full max-w-md border rounded-lg p-2"
        value={programaIdSeleccionado || ''}
        onChange={(e) => onProgramaChange(e.target.value ? parseInt(e.target.value) : null)}
      >
        <option value="">Seleccionar programa</option>
        {programas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectorPrograma;