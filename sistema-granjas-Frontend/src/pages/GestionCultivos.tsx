import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardHeader from '../components/Common/DashboardHeader';
import GestionCultivos from '../components/Cultivos/GestionCultivos';
import programaService from '../services/programaService';

const GestionCultivosPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const programaId = searchParams.get('programaId');
    const [nombrePrograma, setNombrePrograma] = useState<string>('');
    const [cargando, setCargando] = useState<boolean>(false);

    console.log('📍 GestionCultivosPage - programaId:', programaId);

    useEffect(() => {
        const cargarNombrePrograma = async () => {
            if (programaId) {
                try {
                    setCargando(true);
                    const programa = await programaService.obtenerProgramaPorId(Number(programaId));
                    setNombrePrograma(programa.nombre);
                } catch (error) {
                    console.error('Error al cargar nombre del programa:', error);
                    setNombrePrograma('(desconocido)');
                } finally {
                    setCargando(false);
                }
            } else {
                setNombrePrograma('');
            }
        };

        cargarNombrePrograma();
    }, [programaId]);

    // Determinar el título basado en si hay programaId o no
    const title = programaId
        ? `Cultivos: ${nombrePrograma || '...'}`
        : "Gestión de Cultivos/Especies";

    if (cargando && programaId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando información del programa...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader
                title={title}
                selectedModule="cultivos"
                onBack={() => window.history.back()}
            />
            <div className="container mx-auto px-4 py-8">
                <GestionCultivos />
            </div>
        </div>
    );
};

export default GestionCultivosPage;