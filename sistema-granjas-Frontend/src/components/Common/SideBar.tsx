import { useState, useEffect } from 'react';
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import exportService from '../../services/exportService';
import granjaService from '../../services/granjaService';
import programaService from '../../services/programaService';
import loteService from '../../services/loteService';
import usuarioService from '../../services/usuarioService';
import cultivoService from '../../services/cultivoService';

interface SidebarProps {
    isOpen?: boolean;
    onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen: externalIsOpen, onToggle }) => {
    const { user } = useAuth();
    const [exporting, setExporting] = useState(false);
    const [exportMessage, setExportMessage] = useState('');
    const [stats, setStats] = useState({
        granjas: 0,
        programas: 0,
        lotes: 0,
        cultivos: 0,
        usuarios: 0,
        loading: true
    });

    // Estado interno para móvil
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    const toggleSidebar = () => {
        if (onToggle) {
            onToggle();
        } else {
            setInternalIsOpen(!internalIsOpen);
        }
    };

    useEffect(() => {
        cargarEstadisticas();
    }, []);

    const cargarEstadisticas = async () => {
        try {
            const [granjas, programas, lotes, cultivos, usuarios] = await Promise.all([
                granjaService.obtenerGranjas(),
                programaService.obtenerProgramas(),
                loteService.obtenerLotes(),
                cultivoService.obtenerCultivos(),
                usuarioService.obtenerUsuarios()
            ]);

            setStats({
                granjas: Array.isArray(granjas) ? granjas.length : 0,
                programas: Array.isArray(programas) ? programas.length : 0,
                lotes: Array.isArray(lotes) ? lotes.length : 0,
                cultivos: Array.isArray(cultivos) ? cultivos.length : 0,
                usuarios: Array.isArray(usuarios) ? usuarios.length : 0,
                loading: false
            });
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            setStats(prev => ({ ...prev, loading: false }));
        }
    };

    const canSee = (requiredRoles: string[]) => {
        if (!user || !user.rol) return false;
        return requiredRoles.includes(user.rol);
    };

    const handleExportBackup = async () => {
        if (exporting) return;
        setExporting(true);
        setExportMessage('Preparando exportación...');

        try {
            const result = await exportService.exportarBackupCompleto();
            setExportMessage(`¡Exportación completada! (${result.filename})`);
            setTimeout(() => setExportMessage(''), 5000);
        } catch (error) {
            console.error('❌ Error en exportación:', error);
            setExportMessage('Error al exportar. Verifica tu conexión.');
            setTimeout(() => setExportMessage(''), 5000);
        } finally {
            setExporting(false);
        }
    };

    // Función para determinar si estamos en móvil (solo para estilos)
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Botón flotante para abrir en móvil
    if (!isOpen && isMobile) {
        return (
            <button
                onClick={toggleSidebar}
                className="fixed top-20 left-4 z-50 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors"
                aria-label="Abrir menú"
            >
                <i className="fas fa-bars"></i>
            </button>
        );
    }

    return (
        <>
            {/* Overlay para móvil */}
            {isOpen && isMobile && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={toggleSidebar}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`
                    fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 bg-white shadow-xl border-r border-gray-200
                    transition-transform duration-300 ease-in-out z-50
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:translate-x-0
                    overflow-y-auto
                `}
            >
                <div className="relative h-full p-5">
                    {/* Botón de cierre en móvil */}
                    {isMobile && (
                        <button
                            onClick={toggleSidebar}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                            aria-label="Cerrar menú"
                        >
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    )}

                    {/* Perfil del usuario - más compacto y visual */}
                    {user && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-md">
                                    <i className="fas fa-user text-white text-xl"></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 truncate">{user.nombre}</p>
                                    <p className="text-xs text-gray-600 capitalize flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                                        {user.rol?.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 text-xs text-gray-500 flex justify-between">
                                <span><i className="fas fa-clock mr-1"></i>Último acceso: Hoy</span>
                                <span><i className="fas fa-id-card mr-1"></i>ID: {user.id}</span>
                            </div>
                        </div>
                    )}

                    {/* Estadísticas rápidas con iconos y colores */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                            <i className="fas fa-chart-pie mr-2 text-green-600"></i>
                            Panorama General
                        </h3>
                        {stats.loading ? (
                            <div className="grid grid-cols-2 gap-3">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="bg-gray-100 p-3 rounded-lg animate-pulse">
                                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                        <div className="h-6 bg-gray-200 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <StatCard icon="fa-warehouse" value={stats.granjas} label="Granjas" color="blue" />
                                <StatCard icon="fa-clipboard-list" value={stats.programas} label="Programas" color="green" />
                                <StatCard icon="fa-tractor" value={stats.lotes} label="Lotes" color="amber" />
                                <StatCard icon="fa-leaf" value={stats.cultivos} label="Cultivos" color="emerald" />
                                <StatCard icon="fa-users" value={stats.usuarios} label="Usuarios" color="purple" className="col-span-2" />
                            </div>
                        )}
                    </div>

                    {/* Jerarquía del Sistema - visualización en árbol mejorada */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                            <i className="fas fa-sitemap mr-2 text-green-600"></i>
                            Jerarquía del Sistema
                        </h3>
                        <div className="space-y-1">
                            <HierarchyItem
                                icon="fa-warehouse"
                                color="blue"
                                label="Granjas"
                                count={stats.granjas}
                                href="/gestion/granjas"
                                active={location.pathname.startsWith('/gestion/granjas')}
                            />
                            <div className="ml-6 pl-4 border-l-2 border-green-200">
                                <HierarchyItem
                                    icon="fa-clipboard-list"
                                    color="green"
                                    label="Programas"
                                    count={stats.programas}
                                    href="/gestion/programas"
                                    active={location.pathname.startsWith('/gestion/programas')}
                                />
                                <div className="ml-6 pl-4 border-l-2 border-green-200">
                                    <HierarchyItem
                                        icon="fa-tractor"
                                        color="amber"
                                        label="Lotes"
                                        count={stats.lotes}
                                        href="/gestion/lotes"
                                        active={location.pathname.startsWith('/gestion/lotes')}
                                    />
                                    <div className="ml-6 space-y-1 mt-1">
                                        <HierarchyItem
                                            icon="fa-leaf"
                                            color="emerald"
                                            label="Cultivos"
                                            count={stats.cultivos}
                                            href="/gestion/cultivos"
                                            subItem
                                            active={location.pathname.startsWith('/gestion/cultivos')}
                                        />
                                        <HierarchyItem
                                            icon="fa-stethoscope"
                                            color="teal"
                                            label="Diagnósticos"
                                            href="/gestion/diagnosticos"
                                            subItem
                                            active={location.pathname.startsWith('/gestion/diagnosticos')}
                                        />
                                        <HierarchyItem
                                            icon="fa-lightbulb"
                                            color="purple"
                                            label="Recomendaciones"
                                            href="/gestion/recomendaciones"
                                            subItem
                                            active={location.pathname.startsWith('/gestion/recomendaciones')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Acciones rápidas por rol - organizadas por categorías */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                            <i className="fas fa-bolt mr-2 text-green-600"></i>
                            Acciones Rápidas
                        </h3>
                        <div className="space-y-1">
                            {canSee(['admin', 'asesor', 'docente']) && (
                                <>
                                    <QuickAction icon="fa-warehouse" label="Ver Granjas" href="/gestion/granjas" color="blue" />
                                    <QuickAction icon="fa-clipboard-list" label="Ver Programas" href="/gestion/programas" color="green" />
                                </>
                            )}
                            {canSee(['admin']) && (
                                <QuickAction icon="fa-user-cog" label="Gestionar Usuarios" href="/gestion/usuarios" color="purple" />
                            )}
                            {canSee(['admin', 'docente', 'asesor']) && (
                                <QuickAction icon="fa-boxes" label="Ver Inventario" href="/gestion/inventario" color="amber" />
                            )}
                            {canSee(['admin', 'asesor', 'docente', 'estudiante']) && (
                                <QuickAction icon="fa-stethoscope" label="Crear Diagnóstico" href="/gestion/diagnosticos" color="teal" />
                            )}
                            {canSee(['admin', 'asesor', 'docente']) && (
                                <QuickAction icon="fa-lightbulb" label="Crear Recomendación" href="/gestion/recomendaciones" color="purple" />
                            )}
                            {canSee(['admin', 'talento_humano']) && (
                                <QuickAction icon="fa-tasks" label="Asignar Labores" href="/gestion/labores" color="orange" />
                            )}
                        </div>
                    </div>

                    {/* Herramientas del Sistema */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                            <i className="fas fa-tools mr-2 text-green-600"></i>
                            Herramientas
                        </h3>
                        {canSee(['admin']) && (
                            <div className="space-y-2">
                                <button
                                    onClick={handleExportBackup}
                                    disabled={exporting}
                                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    <div className="flex items-center space-x-3">
                                        <i className={`fas ${exporting ? 'fa-spinner fa-spin' : 'fa-database'} text-blue-500 w-5`}></i>
                                        <span className="text-sm font-medium text-gray-700">
                                            {exporting ? 'Exportando Backup...' : 'Backup Completo'}
                                        </span>
                                    </div>
                                    <i className="fas fa-chevron-right text-gray-400 group-hover:text-gray-600 text-xs"></i>
                                </button>
                                {exportMessage && (
                                    <div className={`text-xs p-2 rounded ${exportMessage.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                        {exportMessage}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Información del Sistema */}
                    <div className="mt-8 pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-500 space-y-1">
                            <div className="flex items-center justify-between">
                                <span>Sistema:</span>
                                <span className="font-medium text-gray-700">Granjas UCaldas v2.0</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Estado:</span>
                                <span className="text-green-600 font-medium flex items-center">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                                    Operativo
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Base de datos:</span>
                                <span className="text-blue-600">PostgreSQL</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

// Componentes auxiliares para mejorar legibilidad y reutilización
const StatCard: React.FC<{ icon: string; value: number; label: string; color: string; className?: string }> = ({ icon, value, label, color, className = '' }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-700',
        green: 'bg-green-50 text-green-700',
        amber: 'bg-amber-50 text-amber-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        purple: 'bg-purple-50 text-purple-700',
    };
    return (
        <div className={`${colorClasses[color]} p-3 rounded-lg flex items-center justify-between ${className}`}>
            <div>
                <div className="text-xs font-medium opacity-75">{label}</div>
                <div className="text-xl font-bold">{value}</div>
            </div>
            <i className={`fas ${icon} text-2xl opacity-50`}></i>
        </div>
    );
};

const HierarchyItem: React.FC<{
    icon: string;
    color: string;
    label: string;
    count?: number;
    href: string;
    active?: boolean;
    subItem?: boolean;
}> = ({ icon, color, label, count, href, active, subItem }) => {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-50',
        green: 'text-green-600 bg-green-50',
        amber: 'text-amber-600 bg-amber-50',
        emerald: 'text-emerald-600 bg-emerald-50',
        purple: 'text-purple-600 bg-purple-50',
        teal: 'text-teal-600 bg-teal-50',
    };
    return (
        <a
            href={href}
            className={`block p-2 rounded-lg transition-all ${active ? 'bg-green-100 shadow-sm' : 'hover:bg-gray-50'}`}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className={`w-7 h-7 rounded-full ${colorClasses[color]} flex items-center justify-center ${subItem ? 'w-6 h-6 text-xs' : ''}`}>
                        <i className={`fas ${icon} text-xs`}></i>
                    </div>
                    <span className={`text-sm font-medium text-gray-700 ${subItem ? 'text-xs' : ''}`}>{label}</span>
                </div>
                {count !== undefined && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colorClasses[color]}`}>
                        {count}
                    </span>
                )}
            </div>
        </a>
    );
};

const QuickAction: React.FC<{ icon: string; label: string; href: string; color: string }> = ({ icon, label, href, color }) => {
    const colorClasses = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        amber: 'text-amber-600',
        purple: 'text-purple-600',
        teal: 'text-teal-600',
        orange: 'text-orange-600',
    };
    return (
        <a
            href={href}
            className="flex items-center space-x-3 text-gray-700 hover:text-green-600 hover:bg-gray-50 p-2 rounded-lg transition-colors group"
        >
            <i className={`fas ${icon} w-5 ${colorClasses[color]}`}></i>
            <span className="text-sm flex-1">{label}</span>
            <i className="fas fa-arrow-right text-xs text-gray-400 group-hover:text-green-500 transition-colors"></i>
        </a>
    );
};

export default Sidebar;