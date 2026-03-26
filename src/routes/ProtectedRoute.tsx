import { Navigate, Outlet } from "react-router-dom";
import keycloak from "../configurations/keycloak";

const ProtectedRoute = () => {
    return keycloak.authenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;