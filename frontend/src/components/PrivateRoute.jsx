import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
//Este componente protege rutas que solo pueden ser accedidas por usuarios autenticados y con ciertos roles específicos. Si el usuario no está autenticado o no tiene los permisos necesarios, se lo redirige a la página de login o a una página de "no autorizado".
// PrivateRoute.jsx
export default function PrivateRoute({ children, allowedRoles }) {
    const { currentUser } = useAuth();
    const location = useLocation();

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Permitir acceso a usuarios inhabilitados a la ruta de reportes
    const isReportesRoute = location.pathname.startsWith('/reportes');
    if (currentUser.estado === 'Inhabilitado' && !isReportesRoute) {
        return <Navigate to="/reportes/gestion" replace />;
    }

    // Mapeo de tipos técnicos
    const userType = currentUser?.tipo === 'Tecnico' ? 'Tecnico' : currentUser?.tipo;

    // Verificar si el usuario tiene permiso
    const hasPermission = allowedRoles.includes(userType) || 
                         (userType === 'Tecnico' && allowedRoles.includes('Tecnico'));

    if (!hasPermission) {
        return <Navigate to="/no-autorizado" state={{ from: location }} replace />;
    }

    return children;
}