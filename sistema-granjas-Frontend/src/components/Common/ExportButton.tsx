import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface ExportButtonProps {
  onExport: () => Promise<any>;
  label?: string;
  disabled?: boolean;
}

export default function ExportButton({ onExport, label = 'Exportar a Excel', disabled = false }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;
    setLoading(true);
    const toastId = toast.loading('Exportando...');
    try {
      await onExport();
      toast.success('Exportación completada', { id: toastId, duration: 3000 });
    } catch (error: any) {
      toast.error(error?.message || 'Error al exportar', { id: toastId, duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || disabled}
      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
    >
      <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-file-excel'}`}></i>
      <span>{loading ? 'Exportando...' : label}</span>
    </button>
  );
}
