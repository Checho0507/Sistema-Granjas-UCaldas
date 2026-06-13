import React, { useState, useRef, useEffect, useCallback } from 'react';
import { aiService } from '../../services/aiService';
import type { SesionChat, MensajeChat } from '../../services/aiService';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';

const ROLES_PERMITIDOS = ['docente', 'asesor', 'talento_humano', 'jefe_talento_humano', 'admin'];

const ROL_DESCRIPCION: Record<string, string> = {
  docente: 'tus programas asignados',
  asesor: 'tus programas asignados',
  talento_humano: 'tu granja',
  jefe_talento_humano: 'todas las granjas',
  admin: 'todo el sistema',
};

const SUGERENCIAS_POR_ROL: Record<string, string[]> = {
  docente: ['¿Cuántos diagnósticos pendientes tengo?', '¿Cuál es el estado de mis recomendaciones?', 'Resume los últimos diagnósticos de mis programas'],
  asesor: ['¿Cuántos diagnósticos pendientes tengo?', '¿Cuál es el estado de mis recomendaciones?', 'Resume los últimos diagnósticos'],
  talento_humano: ['¿Cuántas labores están pendientes?', '¿Cuál es el avance promedio de las labores?', 'Dame un resumen de la granja'],
  jefe_talento_humano: ['¿Cómo está el estado general de las tres granjas?', 'Compara el número de diagnósticos por granja', '¿Cuántas labores están en progreso en total?'],
  admin: ['¿Cuántos diagnósticos hay en total?', 'Dame estadísticas generales del sistema', '¿Cuántas recomendaciones están pendientes?'],
};

interface MessageBubble {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

type Vista = 'chat' | 'historial';

const AIChatbot: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [vista, setVista] = useState<Vista>('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<MessageBubble[]>([]);
  const [loading, setLoading] = useState(false);
  const [sesionActualId, setSesionActualId] = useState<number | null>(null);
  const [sesiones, setSesiones] = useState<SesionChat[]>([]);
  const [loadingSesiones, setLoadingSesiones] = useState(false);
  const [renombrando, setRenombrando] = useState<number | null>(null);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const rol = user?.rol || '';
  const tieneAcceso = ROLES_PERMITIDOS.includes(rol);
  const sugerencias = SUGERENCIAS_POR_ROL[rol] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const cargarSesiones = useCallback(async () => {
    setLoadingSesiones(true);
    try {
      const data = await aiService.listarSesiones();
      setSesiones(data);
    } catch {
      toast.error('Error al cargar el historial');
    } finally {
      setLoadingSesiones(false);
    }
  }, []);

  useEffect(() => {
    if (open && vista === 'historial') {
      cargarSesiones();
    }
  }, [open, vista, cargarSesiones]);

  useEffect(() => {
    if (open && messages.length === 0 && !sesionActualId) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `¡Hola ${user?.nombre?.split(' ')[0] || ''}! Soy tu asistente de IA 🌱\n\nPuedo ayudarte con información sobre ${ROL_DESCRIPCION[rol] || 'el sistema'}: diagnósticos, recomendaciones, labores, inventarios y cálculos estadísticos.\n\n¿En qué te puedo ayudar?`,
        timestamp: new Date(),
      }]);
    }
  }, [open]);

  if (!tieneAcceso || !user) return null;

  const iniciarNuevaConversacion = () => {
    setSesionActualId(null);
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: `Nueva conversación iniciada. ¿En qué te puedo ayudar?`,
      timestamp: new Date(),
    }]);
    setVista('chat');
  };

  const cargarSesion = async (sesion: SesionChat) => {
    setVista('chat');
    setSesionActualId(sesion.id);
    setMessages([]);
    try {
      const msgs = await aiService.cargarMensajes(sesion.id);
      if (msgs.length === 0) {
        setMessages([{
          id: 'empty',
          role: 'assistant',
          content: 'Esta conversación está vacía.',
          timestamp: new Date(),
        }]);
      } else {
        setMessages(msgs.map(m => ({
          id: String(m.id),
          role: m.rol as 'user' | 'assistant',
          content: m.contenido,
          timestamp: new Date(m.created_at),
        })));
      }
    } catch {
      toast.error('Error al cargar la conversación');
    }
  };

  const eliminarSesion = async (e: React.MouseEvent, sesionId: number) => {
    e.stopPropagation();
    try {
      await aiService.eliminarSesion(sesionId);
      setSesiones(prev => prev.filter(s => s.id !== sesionId));
      if (sesionActualId === sesionId) {
        iniciarNuevaConversacion();
      }
    } catch {
      toast.error('Error al eliminar la conversación');
    }
  };

  const guardarRenombrado = async (sesionId: number) => {
    if (!nuevoTitulo.trim()) { setRenombrando(null); return; }
    try {
      await aiService.renombrarSesion(sesionId, nuevoTitulo.trim());
      setSesiones(prev => prev.map(s => s.id === sesionId ? { ...s, titulo: nuevoTitulo.trim() } : s));
    } catch {
      toast.error('Error al renombrar');
    } finally {
      setRenombrando(null);
    }
  };

  const enviarMensaje = async (texto?: string) => {
    const pregunta = texto || input.trim();
    if (!pregunta || loading) return;
    setInput('');
    setVista('chat');

    const userMsg: MessageBubble = {
      id: Date.now().toString(),
      role: 'user',
      content: pregunta,
      timestamp: new Date(),
    };
    const loadingMsg: MessageBubble = {
      id: 'loading',
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true,
    };

    setMessages(prev => [...prev.filter(m => m.id !== 'welcome' && m.id !== 'welcome-new' && m.id !== 'empty'), userMsg, loadingMsg]);
    setLoading(true);

    try {
      const response = await aiService.enviarMensajeChat(pregunta, sesionActualId ?? undefined);

      // Si era nueva sesión, actualizar el ID
      if (!sesionActualId) {
        setSesionActualId(response.sesion_id);
      }

      const assistantMsg: MessageBubble = {
        id: Date.now().toString() + '_a',
        role: 'assistant',
        content: response.respuesta,
        timestamp: new Date(),
      };
      setMessages(prev => prev.filter(m => m.id !== 'loading').concat(assistantMsg));
    } catch (error: any) {
      const errorMsg: MessageBubble = {
        id: Date.now().toString() + '_err',
        role: 'assistant',
        content: error?.response?.data?.detail || 'Ocurrió un error. Intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages(prev => prev.filter(m => m.id !== 'loading').concat(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje(); }
  };

  const formatContent = (text: string) =>
    text.split('\n').map((line, i) => {
      if (line.startsWith('## ') || line.startsWith('# '))
        return <p key={i} className="font-bold text-gray-800 mt-1">{line.replace(/^#+\s/, '')}</p>;
      if (line.startsWith('- ') || line.startsWith('* '))
        return <li key={i} className="ml-3 list-disc text-xs">{line.replace(/^[-*]\s/, '').replace(/\*\*(.*?)\*\*/g, '$1')}</li>;
      if (line.trim() === '') return <div key={i} className="h-1" />;
      return <span key={i} className="block text-xs leading-relaxed">{line.replace(/\*\*(.*?)\*\*/g, '$1')}</span>;
    });

  const formatFecha = (iso: string) => {
    const d = new Date(iso);
    const hoy = new Date();
    const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
    if (d.toDateString() === hoy.toDateString()) return `Hoy ${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    if (d.toDateString() === ayer.toDateString()) return `Ayer ${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  };

  const sesionActual = sesiones.find(s => s.id === sesionActualId);

  const sesionesFilradas = busqueda.trim()
    ? sesiones.filter(s => s.titulo.toLowerCase().includes(busqueda.trim().toLowerCase()))
    : sesiones;

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        title="Asistente IA"
      >
        {open
          ? <i className="fas fa-times text-xl"></i>
          : <i className="fas fa-robot text-xl group-hover:scale-110 transition-transform"></i>}
        {!open && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden"
          style={{ width: '380px', maxWidth: 'calc(100vw - 24px)', height: '540px' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-robot text-white text-sm"></i>
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm leading-tight">Asistente IA Granjas</p>
                <p className="text-green-200 text-xs truncate max-w-[180px]">
                  {sesionActual ? sesionActual.titulo : (ROL_DESCRIPCION[rol] ? `Acceso: ${ROL_DESCRIPCION[rol]}` : 'En línea')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={iniciarNuevaConversacion}
                className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Nueva conversación"
              >
                <i className="fas fa-plus text-xs"></i>
              </button>
              <button
                onClick={() => { setVista(v => v === 'historial' ? 'chat' : 'historial'); }}
                className={`p-1.5 rounded-lg transition-colors ${vista === 'historial' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                title="Historial"
              >
                <i className="fas fa-history text-xs"></i>
              </button>
            </div>
          </div>

          {/* Vista: Historial de sesiones */}
          {vista === 'historial' && (
            <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
              <div className="p-3 border-b bg-white flex-shrink-0 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Conversaciones guardadas</p>
                <div className="relative">
                  <i className="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
                  <input
                    type="text"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar conversación..."
                    className="w-full pl-7 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent placeholder-gray-400"
                  />
                  {busqueda && (
                    <button
                      onClick={() => setBusqueda('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
              {loadingSesiones ? (
                <div className="flex justify-center py-10">
                  <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : sesiones.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-comments text-gray-300 text-xl"></i>
                  </div>
                  <p className="text-gray-500 text-sm font-medium">Sin conversaciones aún</p>
                  <p className="text-gray-400 text-xs mt-1">Las conversaciones se guardan automáticamente</p>
                  <button
                    onClick={iniciarNuevaConversacion}
                    className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors"
                  >
                    <i className="fas fa-plus mr-1"></i>Nueva conversación
                  </button>
                </div>
              ) : sesionesFilradas.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-search text-gray-300 text-lg"></i>
                  </div>
                  <p className="text-gray-500 text-sm font-medium">Sin resultados</p>
                  <p className="text-gray-400 text-xs mt-1">No hay conversaciones que coincidan con <span className="font-medium text-gray-500">"{busqueda}"</span></p>
                  <button onClick={() => setBusqueda('')} className="mt-2 text-xs text-green-600 hover:underline">
                    Limpiar búsqueda
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {sesionesFilradas.map(sesion => (
                    <div
                      key={sesion.id}
                      onClick={() => cargarSesion(sesion)}
                      className={`flex items-start gap-2 px-3 py-2.5 cursor-pointer hover:bg-green-50 transition-colors group ${sesionActualId === sesion.id ? 'bg-green-50 border-l-2 border-green-500' : ''}`}
                    >
                      <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i className="fas fa-comment-dots text-green-600 text-xs"></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        {renombrando === sesion.id ? (
                          <input
                            autoFocus
                            value={nuevoTitulo}
                            onChange={e => setNuevoTitulo(e.target.value)}
                            onBlur={() => guardarRenombrado(sesion.id)}
                            onKeyDown={e => { if (e.key === 'Enter') guardarRenombrado(sesion.id); if (e.key === 'Escape') setRenombrando(null); }}
                            onClick={e => e.stopPropagation()}
                            className="w-full text-xs border border-green-400 rounded px-1.5 py-0.5 outline-none"
                          />
                        ) : (
                          <p className="text-xs font-medium text-gray-800 truncate leading-tight">{sesion.titulo}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {sesion.total_mensajes} mensaje{sesion.total_mensajes !== 1 ? 's' : ''} · {formatFecha(sesion.updated_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={e => { e.stopPropagation(); setRenombrando(sesion.id); setNuevoTitulo(sesion.titulo); }}
                          className="p-1 text-gray-400 hover:text-green-600 rounded transition-colors"
                          title="Renombrar"
                        >
                          <i className="fas fa-pencil-alt text-xs"></i>
                        </button>
                        <button
                          onClick={e => eliminarSesion(e, sesion.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                          title="Eliminar"
                        >
                          <i className="fas fa-trash text-xs"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          )}

          {/* Vista: Chat */}
          {vista === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                        <i className="fas fa-robot text-white text-xs"></i>
                      </div>
                    )}
                    <div className={`max-w-[82%] rounded-2xl px-3 py-2 ${msg.role === 'user'
                      ? 'bg-green-600 text-white rounded-tr-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'}`}>
                      {msg.loading ? (
                        <div className="flex items-center gap-1 py-1 px-1">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      ) : msg.role === 'user' ? (
                        <p className="text-xs leading-relaxed text-white whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="text-gray-800">{formatContent(msg.content)}</div>
                      )}
                    </div>
                  </div>
                ))}

                {messages.length <= 1 && sugerencias.length > 0 && !sesionActualId && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 text-center mb-2">Sugerencias rápidas:</p>
                    <div className="space-y-1.5">
                      {sugerencias.map((s, i) => (
                        <button key={i} onClick={() => enviarMensaje(s)}
                          className="w-full text-left text-xs bg-white border border-green-200 hover:border-green-400 hover:bg-green-50 text-gray-700 rounded-xl px-3 py-2 transition-colors">
                          <i className="fas fa-lightbulb text-green-500 mr-1.5"></i>{s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
                {sesionActualId && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-green-700 flex items-center gap-1">
                      <i className="fas fa-save text-green-500"></i>
                      Guardado en historial
                    </span>
                    <button onClick={iniciarNuevaConversacion}
                      className="text-xs text-gray-400 hover:text-green-600 transition-colors">
                      <i className="fas fa-plus mr-1"></i>Nueva
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe tu pregunta..."
                    rows={1}
                    disabled={loading}
                    className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent placeholder-gray-400 max-h-24 overflow-y-auto disabled:opacity-50"
                    style={{ minHeight: '36px' }}
                  />
                  <button
                    onClick={() => enviarMensaje()}
                    disabled={loading || !input.trim()}
                    className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                  >
                    <i className="fas fa-paper-plane text-xs"></i>
                  </button>
                </div>
                <p className="text-xs text-gray-300 text-center mt-1.5">Enter para enviar · Shift+Enter nueva línea</p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AIChatbot;
