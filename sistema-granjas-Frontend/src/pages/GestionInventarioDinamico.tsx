import React from 'react';
import DashboardHeader from '../components/Common/DashboardHeader';
import GestionInventarioDinamico from '../components/InventarioDinamico/GestionInventarioDinamico';

const GestionInventarioPage: React.FC = () => (
    <div className="min-h-screen bg-gray-50">
        <DashboardHeader
            title="Gestión de Inventario Dinámico"
            selectedModule="inventario"
            onBack={() => window.history.back()}
        />
        <div className="container mx-auto px-4 py-8">
            <GestionInventarioDinamico />
        </div>
    </div>
);

export default GestionInventarioPage;