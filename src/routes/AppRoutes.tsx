import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/Home";
import Profile from "../pages/Profile";
import AddUser from "../pages/AddUser";
import ProtectedRoute from "./ProtectedRoute";


const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/add-user" element={<AddUser />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes;