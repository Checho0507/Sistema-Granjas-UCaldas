import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/Common/DashboardHeader';
import Sidebar from '../components/Common/SideBar';
import granjaService from '../services/granjaService';
import programaService from '../services/programaService';
import loteService from '../services/loteService';
import { normalizarArray } from '../utils/normalize';
import type { Granja, Programa, Lote } from '../types/granjaTypes';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [nombreUsuario, setNombreUsuario] = useState('Usuario');
  const [ultimasGranjas, setUltimasGranjas] = useState<Granja[]>([]);
  const [ultimosProgramas, setUltimosProgramas] = useState<Programa[]>([]);
  const [ultimosLotes, setUltimosLotes] = useState<Lote[]>([]);

  useEffect(() => {
    cargarDatosInicio();
    
    // Obtener nombre del usuario del localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setNombreUsuario(user.nombre || user.email || 'Usuario');
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  const cargarDatosInicio = async () => {
    try {
      setLoading(true);
      
      // Cargar datos recientes (solo para mostrar ejemplos)
      const [granjasResp, programasResp, lotesResp] = await Promise.all([
        granjaService.obtenerGranjas().catch(() => []),
        programaService.obtenerProgramas().catch(() => []),
        loteService.obtenerLotes().catch(() => [])
      ]);

      const granjas = normalizarArray<Granja>(granjasResp);
      const programas = normalizarArray<Programa>(programasResp);
      const lotes = normalizarArray<Lote>(lotesResp);

      // Obtener los 3 más recientes (asumiendo que tienen fecha_creacion)
      setUltimasGranjas(granjas.slice(0, 3));
      setUltimosProgramas(programas.slice(0, 3));
      setUltimosLotes(lotes.slice(0, 3));

    } catch (error) {
      console.error('Error cargando datos de inicio:', error);
    } finally {
      setLoading(false);
    }
  };

  const irA = (ruta: string) => navigate(ruta);

  // Componente para tarjeta de módulo
  const ModuloCard = ({ 
    titulo, 
    descripcion, 
    icono, 
    color, 
    ruta,
    stats 
  }: { 
    titulo: string; 
    descripcion: string; 
    icono: string; 
    color: string; 
    ruta: string;
    stats?: string;
  }) => (
    <div 
      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-gray-100"
      onClick={() => irA(ruta)}
    >
      <div className={`h-2 ${color}`}></div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg ${color} bg-opacity-20 flex items-center justify-center`}>
            <i className={`fas fa-${icono} text-2xl ${color.replace('bg-', 'text-')}`}></i>
          </div>
          {stats && (
            <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              {stats}
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{titulo}</h3>
        <p className="text-gray-600 mb-4">{descripcion}</p>
        <div className="flex items-center text-sm font-medium text-green-600">
          <span>Acceder al módulo</span>
          <i className="fas fa-arrow-right ml-2 text-xs"></i>
        </div>
      </div>
    </div>
  );

  // Componente para actividad reciente
  const ActividadItem = ({ 
    icono, 
    color, 
    titulo, 
    subtitulo, 
    fecha 
  }: { 
    icono: string; 
    color: string; 
    titulo: string; 
    subtitulo: string; 
    fecha?: string;
  }) => (
    <div className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-0">
      <div className={`w-8 h-8 rounded-full ${color} bg-opacity-20 flex items-center justify-center flex-shrink-0`}>
        <i className={`fas fa-${icono} text-sm ${color.replace('bg-', 'text-')}`}></i>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{titulo}</p>
        <p className="text-xs text-gray-500">{subtitulo}</p>
      </div>
      {fecha && <span className="text-xs text-gray-400">{fecha}</span>}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando tu espacio de trabajo...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-8">
          
          {/* Banner de bienvenida personalizado */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  ¡Bienvenido, {nombreUsuario}! 👋
                </h1>
                <p className="text-green-100 text-lg max-w-2xl">
                  Sistema de Gestión Agrícola - Universidad de Caldas
                </p>
                <div className="mt-4 flex space-x-4">
                  <button 
                    onClick={() => irA('/gestion/granjas/nueva')}
                    className="bg-white text-green-700 px-4 py-2 rounded-lg font-medium hover:bg-green-50 transition-colors flex items-center"
                  >
                    <i className="fas fa-plus-circle mr-2"></i>
                    Comenzar nueva granja
                  </button>
                  <button 
                    onClick={() => irA('/ayuda')}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-400 transition-colors flex items-center"
                  >
                    <i className="fas fa-question-circle mr-2"></i>
                    Ayuda
                  </button>
                </div>
              </div>
              <div className="hidden lg:block">
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/1995/1995572.png" 
                  alt="Granja" 
                  className="w-32 h-32 opacity-20"
                />
              </div>
            </div>
          </div>

          {/* Módulos principales */}
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Módulos del Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ModuloCard
              titulo="Granjas"
              descripcion="Administra tus granjas, ubicaciones y configuración general"
              icono="warehouse"
              color="bg-blue-600"
              ruta="/gestion/granjas"
              stats="3 activas"
            />
            <ModuloCard
              titulo="Programas"
              descripcion="Gestiona programas agrícolas y pecuarios"
              icono="clipboard-list"
              color="bg-green-600"
              ruta="/gestion/programas"
              stats="11 registrados"
            />
            <ModuloCard
              titulo="Lotes"
              descripcion="Controla lotes de producción y seguimiento de cultivos"
              icono="tractor"
              color="bg-purple-600"
              ruta="/lotes"
              stats="8 activos"
            />
            <ModuloCard
              titulo="Usuarios"
              descripcion="Administra roles, permisos y acceso al sistema"
              icono="users"
              color="bg-amber-600"
              ruta="/gestion/usuarios"
              stats="7 usuarios"
            />
          </div>

          {/* Segunda fila de módulos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <ModuloCard
              titulo="Labores"
              descripcion="Planifica y da seguimiento a las labores agrícolas"
              icono="calendar-alt"
              color="bg-orange-600"
              ruta="/labores"
            />
            <ModuloCard
              titulo="Inventario"
              descripcion="Control de insumos, herramientas y productos"
              icono="boxes"
              color="bg-indigo-600"
              ruta="/gestion/inventario"
            />
            <ModuloCard
              titulo="Reportes"
              descripcion="Genera informes y exporta datos del sistema"
              icono="file-pdf"
              color="bg-red-600"
              ruta="/reportes"
            />
          </div>

          {/* Actividad reciente y guías */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Actividad reciente */}
            <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                  <i className="fas fa-clock text-green-600 mr-2"></i>
                  Actividad Reciente
                </h3>
                <button 
                  onClick={() => irA('/actividad')}
                  className="text-sm text-green-600 hover:text-green-800"
                >
                  Ver todo <i className="fas fa-arrow-right ml-1"></i>
                </button>
              </div>

              <div className="space-y-1">
                {ultimasGranjas.length > 0 ? (
                  <>
                    {ultimasGranjas.map(granja => (
                      <ActividadItem
                        key={`granja-${granja.id}`}
                        icono="warehouse"
                        color="bg-blue-600"
                        titulo={`Nueva granja: ${granja.nombre}`}
                        subtitulo={granja.ubicacion || 'Sin ubicación'}
                        fecha="Hace 2 días"
                      />
                    ))}
                  </>
                ) : (
                  <ActividadItem
                    icono="plus-circle"
                    color="bg-gray-600"
                    titulo="Bienvenido al sistema"
                    subtitulo="Comienza creando tu primera granja"
                  />
                )}

                {ultimosProgramas.map(programa => (
                  <ActividadItem
                    key={`programa-${programa.id}`}
                    icono={programa.tipo === 'agricola' ? 'seedling' : 'paw'}
                    color={programa.tipo === 'agricola' ? 'bg-green-600' : 'bg-amber-600'}
                    titulo={`Programa: ${programa.nombre}`}
                    subtitulo={`Tipo: ${programa.tipo === 'agricola' ? 'Agrícola' : 'Pecuario'}`}
                  />
                ))}
              </div>
            </div>

            {/* Guías y enlaces útiles */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                Primeros pasos
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                  <div>
                    <p className="font-medium text-gray-800">Crea una granja</p>
                    <p className="text-sm text-gray-500">Registra los datos básicos de tu granja</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                  <div>
                    <p className="font-medium text-gray-800">Define programas</p>
                    <p className="text-sm text-gray-500">Agrícolas o pecuarios según tu producción</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
                  <div>
                    <p className="font-medium text-gray-800">Configura lotes</p>
                    <p className="text-sm text-gray-500">Divide tu terreno en áreas de producción</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">4</div>
                  <div>
                    <p className="font-medium text-gray-800">Asigna labores</p>
                    <p className="text-sm text-gray-500">Programa actividades y tareas agrícolas</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <a 
                    href="#" 
                    className="flex items-center text-green-600 hover:text-green-800 text-sm"
                    onClick={(e) => { e.preventDefault(); irA('/tutoriales'); }}
                  >
                    <i className="fas fa-video mr-2"></i>
                    Ver tutoriales en video
                  </a>
                  <a 
                    href="#" 
                    className="flex items-center text-green-600 hover:text-green-800 text-sm mt-2"
                    onClick={(e) => { e.preventDefault(); irA('/documentacion'); }}
                  >
                    <i className="fas fa-book mr-2"></i>
                    Leer documentación
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Mensaje de bienvenida para nuevos usuarios */}
          {ultimasGranjas.length === 0 && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <i className="fas fa-smile text-blue-500 text-3xl"></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">
                    ¡Bienvenido al Sistema Granjas UCaldas!
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Este es tu espacio de trabajo. Comienza creando tu primera granja para explorar todas las funcionalidades del sistema.
                  </p>
                  <button
                    onClick={() => irA('/gestion/granjas/nueva')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                  >
                    <i className="fas fa-plus-circle mr-2"></i>
                    Crear primera granja
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer informativo */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Sistema de Gestión Agrícola - Universidad de Caldas © 2026</p>
            <p className="mt-1">
              <a href="#" className="text-green-600 hover:underline mx-2">Términos de uso</a>
              <a href="#" className="text-green-600 hover:underline mx-2">Privacidad</a>
              <a href="#" className="text-green-600 hover:underline mx-2">Contacto</a>
            </p>
          </div>

        </main>
      </div>
    </div>
  );
};

export default Dashboard;