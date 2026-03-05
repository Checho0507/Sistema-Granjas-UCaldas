// src/pages/GestionGranjasPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../components/Common/DashboardHeader';
import GestionGranjas from '../components/Granjas/GestionGranjas';

const GestionGranjasPage: React.FC = () => {
    const navigate = useNavigate();
    return (<div className="min-h-screen bg-gray-50">
        <DashboardHeader
            title="Gestión de Granjas"
            selectedModule="granjas"
            onBack={() => navigate("/dashboard")}
        />
        <div className="container mx-auto px-4 py-8">
            <GestionGranjas />
        </div>
    </div>)
};

export default GestionGranjasPage;