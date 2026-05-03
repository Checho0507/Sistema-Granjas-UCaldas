import React from 'react';
import DashboardHeader from '../components/Common/DashboardHeader';
import GestionLotes from '../components/Lotes/GestionLote';

const GestionLotesPage: React.FC = () => (
    <div className="min-h-screen bg-gray-50">
        <DashboardHeader
            title="Gestión de Lotes"
            selectedModule="lotes"
            onBack={() => window.history.back()}
        />
        <div className="container mx-auto px-4 py-8">
            <GestionLotes />
        </div>
    </div>
);

export default GestionLotesPage;