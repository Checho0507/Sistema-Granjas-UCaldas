// src/components/ProtectedRoute.tsx
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import DashboardHeader from "./Common/DashboardHeader";

interface Props {
    children: React.ReactNode;
    requiredRole?: string;
    allowedRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRole, allowedRoles }: Props) {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const rol = user?.rol;
    const denied =
        (requiredRole && rol !== requiredRole) ||
        (allowedRoles && allowedRoles.length > 0 && (!rol || !allowedRoles.includes(rol)));

    if (denied) {
        return (
            <div className="min-h-screen bg-gray-50">
                <DashboardHeader />
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-4">
                    <div className="bg-white rounded-2xl shadow-md p-10 max-w-sm w-full text-center space-y-5">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <i className="fas fa-lock text-red-500 text-2xl"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Acceso restringido</h2>
                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                                Tu rol{' '}
                                <span className="font-semibold text-gray-700 capitalize">
                                    ({rol?.replace('_', ' ')})
                                </span>{' '}
                                no tiene permisos para acceder a este módulo.
                            </p>
                        </div>
                        <Link
                            to="/dashboard"
                            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                        >
                            <i className="fas fa-home"></i>
                            Ir al Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
