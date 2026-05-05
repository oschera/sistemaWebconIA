import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRouter = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        // No hay token, redirigimos al login
        return <Navigate to="/login" replace />;
    }

    try {
        // Verificamos si el token ha expirado
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp < currentTime) {
            // El token expiró
            localStorage.removeItem('token');
            return <Navigate to="/login" replace />;
        }

        // El token es válido, permitimos el acceso a las rutas hijas
        return <Outlet />;
    } catch (error) {
        // Error al decodificar el token (token inválido)
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }
};

export default ProtectedRouter;
