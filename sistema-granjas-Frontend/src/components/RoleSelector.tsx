import type { Role } from "../types/auth";

interface Props {
    roles: Role[];
    selectedRole: number | null;
    onSelect: (roleId: number) => void;
}

export default function RoleSelector({ roles, selectedRole, onSelect }: Props) {
    const formatearNombre = (nombre: string) => {
        return nombre
            .split("_")
            .map(p => p.charAt(0).toUpperCase() + p.slice(1))
            .join(" ");
    };

    // 👇 MAPA DE ICONOS (todos disponibles en FontAwesome)
    const getIcon = (nombre: string) => {
        switch (nombre) {
            case "estudiante":
                return "fa-user-graduate";
            case "asesor":
                return "fa-user-tie";
            case "trabajador":
                return "fa-hard-hat";  // ← CORREGIDO: era "fa-user-hard-hat"
            case "admin":
                return "fa-user-shield";
            case "docente":
                return "fa-chalkboard-teacher";
            case "talento_humano":
                return "fa-users-cog";
            default:
                return "fa-user-cog";
        }
    };

    // 👇 COLORES POR ROL
    const getColor = (nombre: string) => {
        switch (nombre) {
            case "estudiante":
                return "text-amber-600";
            case "asesor":
                return "text-blue-600";
            case "trabajador":
                return "text-orange-600";
            case "admin":
                return "text-purple-600";
            case "docente":
                return "text-green-600";
            case "talento_humano":
                return "text-red-600";
            default:
                return "text-gray-600";
        }
    };

    return (
        <div className="grid grid-cols-2 gap-3">
            {roles.map((rol) => {
                const icon = getIcon(rol.nombre);
                const color = getColor(rol.nombre);
                const isSelected = selectedRole === rol.id;

                return (
                    <div
                        key={rol.id}
                        onClick={() => onSelect(rol.id)}
                        className={`cursor-pointer rounded-lg border p-3 text-center transition ${
                            isSelected
                                ? "border-green-700 bg-green-50"
                                : "border-gray-300 hover:border-green-400"
                        }`}
                    >
                        <div className={`text-xl mb-1 ${isSelected ? "text-green-700" : color}`}>
                            <i className={`fas ${icon}`}></i>
                        </div>
                        <p className="font-medium">{formatearNombre(rol.nombre)}</p>
                    </div>
                );
            })}
        </div>
    );
}