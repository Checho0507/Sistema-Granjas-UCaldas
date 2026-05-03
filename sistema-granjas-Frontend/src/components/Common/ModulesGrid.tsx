// components/ModulesGrid.tsx
import React from 'react';
import ModulesCard from "./ModulesCard";
import { useAuth } from '../../hooks/useAuth';

interface ModulesGridProps {
    navigate: (path: string) => void;
}

const ModulesGrid: React.FC<ModulesGridProps> = ({ navigate }) => {
    const { user } = useAuth();

    // Definición de permisos por rol
    const getPermissions = (rol: string) => {
        const permissions: Record<string, string[]> = {
            admin: [
                'granjas', 'programas', 'usuarios', 'lotes', 'cultivos',
                'inventario', 'diagnosticos', 'recomendaciones', 'labores'
            ],
            asesor: ['diagnosticos', 'recomendaciones', 'labores'],
            docente: ['diagnosticos', 'recomendaciones', 'labores'],
            talento_humano: ['recomendaciones', 'labores'],
            estudiante: ['diagnosticos', 'recomendaciones', 'labores'],
            trabajador: ['labores', 'mis_tareas']
        };

        return permissions[rol] || [];
    };

    const userPermissions = user ? getPermissions(user.rol) : [];

    const modules = [
        {
            id: 'granjas',
            title: 'Granjas',
            description: 'Gestiona las granjas registradas',
            icon: 'fas fa-tractor',
            color: 'bg-green-600',
            path: '/gestion/granjas',
            roles: ['admin', 'asesor']
        },
        {
            id: 'programas',
            title: 'Programas',
            description: 'Administra los programas agrícolas',
            icon: 'fas fa-seedling',
            color: 'bg-purple-600',
            path: '/gestion/programas',
            roles: ['admin', 'asesor']
        },
        {
            id: 'usuarios',
            title: 'Usuarios',
            description: 'Gestión de usuarios del sistema',
            icon: 'fas fa-users',
            color: 'bg-blue-600',
            path: '/gestion/usuarios',
            roles: ['admin', 'talento_humano']
        },
        {
            id: 'lotes',
            title: 'Gestión de Lotes',
            description: 'Administra lotes, cultivos y parcelas',
            icon: 'fas fa-th-large',
            color: 'bg-blue-500',
            path: '/gestion/lotes',
            roles: ['admin', 'docente', 'estudiante', 'trabajador']
        },
        {
            id: 'cultivos',
            title: 'Cultivos y Especies',
            description: 'Administra cultivos y especies pecuarias',
            icon: 'fas fa-leaf',
            color: 'bg-green-500',
            path: '/gestion/cultivos',
            roles: ['admin', 'estudiante', 'trabajador']
        },
        {
            id: 'inventario',
            title: 'Gestión de Inventario',
            description: 'Administra herramientas, insumos y categorías',
            icon: 'fas fa-boxes',
            color: 'bg-amber-500',
            path: '/gestion/inventario',
            roles: ['admin', 'trabajador']
        },
        {
            id: 'diagnosticos',
            title: 'Diagnósticos',
            description: 'Crear, revisar y gestionar diagnósticos',
            icon: 'fas fa-stethoscope',
            color: 'bg-teal-500',
            path: '/gestion/diagnosticos',
            roles: ['admin', 'asesor', 'docente', 'estudiante']
        },
        {
            id: 'recomendaciones',
            title: 'Recomendaciones',
            description: 'Gestiona recomendaciones para cultivos',
            icon: 'fas fa-lightbulb',
            color: 'bg-gradient-to-r from-purple-500 to-indigo-600',
            path: '/gestion/recomendaciones',
            roles: ['admin', 'asesor', 'docente', 'estudiante']
        },
        {
            id: 'labores',
            title: 'Labores',
            description: 'Supervisa tareas y asignaciones',
            icon: 'fas fa-tasks',
            color: 'bg-orange-500',
            path: '/gestion/labores',
            roles: ['admin', 'asesor', 'docente', 'talento_humano', 'trabajador']
        },
        {
            id: 'mis_tareas',
            title: 'Mis Tareas',
            description: 'Tablero personal de labores asignadas',
            icon: 'fas fa-clipboard-check',
            color: 'bg-green-600',
            path: '/mis-tareas',
            roles: ['trabajador', 'admin']
        }
    ];

    // Filtrar módulos según permisos del usuario
    const filteredModules = modules.filter(module =>
        userPermissions.includes(module.id)
    );

    const handleAccess = (path: string) => {
        navigate(path);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.length > 0 ? (
                filteredModules.map((module) => (
                    <ModulesCard
                        key={module.id}
                        title={module.title}
                        description={module.description}
                        icon={module.icon}
                        color={module.color}
                        onClick={() => handleAccess(module.path)}
                    />
                ))
            ) : (
                <div className="col-span-full text-center py-12">
                    <i className="fas fa-lock text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">No tienes módulos asignados a tu rol</p>
                    <p className="text-sm text-gray-400 mt-2">Contacta al administrador para obtener acceso</p>
                </div>
            )}
        </div>
    );
};

export default ModulesGrid;