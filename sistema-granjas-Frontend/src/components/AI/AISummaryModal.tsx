import React, { useState } from 'react';
import Modal from '../Common/Modal';
import { aiService } from '../../services/aiService';
import { toast } from 'react-toastify';

interface Props {
  isOpen: boolean;
  diagnosticoId: number | null;
  onClose: () => void;
}

const AISummaryModal: React.FC<Props> = ({ isOpen, diagnosticoId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [resumen, setResumen] = useState<string | null>(null);
  const [generado, setGenerado] = useState(false);

  const handleClose = () => {
    setResumen(null);
    setGenerado(false);
    onClose();
  };

  const generarResumen = async () => {
    if (!diagnosticoId) return;
    setLoading(true);
    try {
      const data = await aiService.generarResumenDiagnostico(diagnosticoId);
      setResumen(data.resumen);
      setGenerado(true);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'Error al generar el resumen con IA';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && diagnosticoId && !generado) {
      generarResumen();
    }
  }, [isOpen, diagnosticoId]);

  const formatResumen = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ') || line.startsWith('# ')) {
        return <h3 key={i} className="text-base font-bold text-green-800 mt-4 mb-1">{line.replace(/^#+\s/, '')}</h3>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold text-gray-800 mt-2">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={i} className="ml-4 text-gray-700 text-sm list-disc">
            {line.replace(/^[-*]\s/, '').replace(/\*\*(.*?)\*\*/g, '$1')}
          </li>
        );
      }
      if (line.trim() === '') return <div key={i} className="h-2" />;
      return (
        <p key={i} className="text-gray-700 text-sm leading-relaxed">
          {line.replace(/\*\*(.*?)\*\*/g, '$1')}
        </p>
      );
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} width="max-w-2xl">
      <div className="p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow">
              <i className="fas fa-robot text-white text-sm"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Resumen IA</h2>
              <p className="text-xs text-gray-500">Diagnóstico #{diagnosticoId} · Generado por Gemini AI</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center">
                  <i className="fas fa-robot text-green-600 text-xl"></i>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-gray-700 font-medium text-sm">Analizando diagnóstico...</p>
                <p className="text-gray-400 text-xs mt-1">Gemini AI está procesando los datos</p>
              </div>
            </div>
          )}

          {!loading && resumen && (
            <div className="space-y-1">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-3">
                <p className="text-xs text-green-700 flex items-center gap-1.5">
                  <i className="fas fa-sparkles"></i>
                  Resumen generado automáticamente con inteligencia artificial
                </p>
              </div>
              <div className="prose prose-sm max-w-none">
                {formatResumen(resumen)}
              </div>
            </div>
          )}

          {!loading && !resumen && (
            <div className="text-center py-10 text-gray-500">
              <i className="fas fa-exclamation-circle text-2xl mb-2"></i>
              <p className="text-sm">No se pudo generar el resumen</p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
          {resumen && !loading && (
            <button
              type="button"
              onClick={generarResumen}
              className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1.5 transition-colors"
            >
              <i className="fas fa-redo-alt"></i>
              Regenerar resumen
            </button>
          )}
          {(!resumen || loading) && <span />}
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AISummaryModal;
