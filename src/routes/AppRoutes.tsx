import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/Home";
import Profile from "../pages/Profile";
import Notifications from "../pages/Notifications";
import Dashboard from "../pages/Dashboard";
import MapView from "../pages/MapView";
import NotificationSettings from "../pages/NotificationSettings";
import ProtectedRoute from "./ProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";
import Layout from "../layouts/Layout";
import { ROLES } from "../auth/roles";

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedRoute />}>
                    <Route element={<Layout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/map" element={<MapView />} />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route element={<RoleProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.CONFIGURATOR]} />}>
                            <Route path="/notification-settings" element={<NotificationSettings />} />
                        </Route>
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes;
