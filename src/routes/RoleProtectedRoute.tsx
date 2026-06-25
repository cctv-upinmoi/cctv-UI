import { Navigate, Outlet } from 'react-router-dom';
import keycloak from '../configurations/keycloak';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../auth/roles';

interface Props {
    allowedRoles: Role[];
}

const RoleProtectedRoute: React.FC<Props> = ({ allowedRoles }) => {
    const { hasAnyRole } = useAuth();

    if (!keycloak.authenticated) return <Navigate to="/login" replace />;
    if (!hasAnyRole(allowedRoles)) return <Navigate to="/" replace />;

    return <Outlet />;
};

export default RoleProtectedRoute;
