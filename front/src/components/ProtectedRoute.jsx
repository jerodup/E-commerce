import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Componente para proteger rutas que requieren autenticación
export const ProtectedRoute = ({ children }) => {
  const { isAuth, user, loading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuth || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Componente para rutas públicas (login, register) cuando ya está autenticado
export const PublicRoute = ({ children }) => {
  const { isAuth, user, loading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  // Si ya está autenticado, redirigir al dashboard
  if (isAuth && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Componente para proteger rutas que requieren ser administrador
export const AdminRoute = ({ children }) => {
  const { isAuth, user, loading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuth || !user) {
    return <Navigate to="/login" replace />;
  }

  // Si no es admin, redirigir al dashboard
  if (!user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
