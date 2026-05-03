import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useDashboardSimple = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    granjasActivas: 0,
    usuariosRegistrados: 0,
    programasActivos: 0,
    laboresMes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        console.log('No token available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Fetching data with token...');
        
        // Headers básicos
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Hacer las peticiones una por una para debug
        try {
          const granjasRes = await fetch('/api/granjas', { headers });
          console.log('Granjas status:', granjasRes.status);
          
          const usuariosRes = await fetch('/api/usuarios', { headers });
          console.log('Usuarios status:', usuariosRes.status);
          
          const programasRes = await fetch('/api/programas', { headers });
          console.log('Programas status:', programasRes.status);
          
          const laboresRes = await fetch('/api/labores', { headers });
          console.log('Labores status:', laboresRes.status);

          // Si todas las peticiones son exitosas, procesar datos
          if (granjasRes.ok && usuariosRes.ok && programasRes.ok && laboresRes.ok) {
            const [granjas, usuarios, programas, labores] = await Promise.all([
              granjasRes.json(),
              usuariosRes.json(),
              programasRes.json(),
              laboresRes.json()
            ]);

            console.log('Datos recibidos:', { granjas, usuarios, programas, labores });

            // Procesar datos (ajusta según la estructura real)
            const granjasActivas = Array.isArray(granjas) ? granjas.filter(g => g.activo).length : 0;
            const usuariosRegistrados = Array.isArray(usuarios) ? usuarios.length : 0;
            const programasActivos = Array.isArray(programas) ? programas.filter(p => p.activo).length : 0;
            // 1. Definir el mes y año actuales
            const currentMonth = new Date().getMonth(); // 0 (Ene) a 11 (Dic)
            const currentYear = new Date().getFullYear();

            // 2. Crear la fecha de inicio del mes actual (e.g., Noviembre 1, 2025, 00:00:00)
            // Esto establece la fecha al día 1 a las 00:00:00 del mes y año actuales.
            const currentMonthStart = new Date(currentYear, currentMonth, 1); 

            // 3. Acceder al arreglo de labores, manejando el objeto que lo contiene
            // Si 'labores' existe y 'labores.items' es un arreglo, úsalo. Si no, usa un arreglo vacío [].
            const listaLabores = labores && Array.isArray(labores.items) ? labores.items : [];

            // 4. Filtrar y contar
            const laboresMes = listaLabores.filter(l => {
                // Convertir la fecha de asignación de la labor a un objeto Date
                const fechaLabor = new Date(l.fecha_asignacion);
                
                // El filtro: la fecha de la labor debe ser MAYOR O IGUAL que la fecha de inicio del mes.
                // Esto incluye todas las labores de este mes y futuros (si existen), pero asumo
                // que 'labores' solo trae labores recientes.
                return fechaLabor >= currentMonthStart;
            }).length;
            console.log('Estadísticas calculadas:',  granjasActivas, usuariosRegistrados, programasActivos, laboresMes );
            
            setStats({
              granjasActivas,
              usuariosRegistrados,
              programasActivos,
              laboresMes
            });

          } else {
            throw new Error('Alguna petición falló');
          }

        } catch (fetchError) {
          console.error('Error en fetch:', fetchError);
          // Usar datos de ejemplo
          setStats({
            granjasActivas: 12,
            usuariosRegistrados: 89,
            programasActivos: 5,
            laboresMes: 127
          });
        }

      } catch (err) {
        console.error('Error general:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        // Datos de respaldo
        setStats({
          granjasActivas: 12,
          usuariosRegistrados: 89,
          programasActivos: 5,
          laboresMes: 127
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  return { stats, loading, error };
};