import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/Home";
import Profile from "../pages/Profile";
import AddUser from "../pages/AddUser";
import Notifications from "../pages/Notifications";
import Dashboard from "../pages/Dashboard";
import MapView from "../pages/MapView";
import NotificationSettings from "../pages/NotificationSettings";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "../layouts/Layout";


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
                        <Route path="/add-user" element={<AddUser />} />
                        <Route path="/notification-settings" element={<NotificationSettings />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes;