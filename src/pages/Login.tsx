import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import keycloak from "../configurations/keycloak";

const Login = () => {
    const navigate = useNavigate();

    useEffect(() => {
        if (keycloak.authenticated) {
            navigate("/");
        }
    }, [navigate]);

    const handleLogin = () => {
        keycloak.login();
    };

    return (
        <div style={{ height: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f0f2f5", fontFamily: "system-ui, sans-serif" }}>
            <div style={{ padding: "40px", backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)", textAlign: "center", maxWidth: "400px", width: "100%", boxSizing: "border-box" }}>
                <ShieldCheck size={48} color="#1976d2" style={{ marginBottom: "16px", margin: "0 auto", display: "block" }} />
                <h1 style={{ margin: "0 0 8px 0", color: "#333", fontSize: "24px" }}>Smart CCTV Access</h1>
                <p style={{ margin: "0 0 24px 0", color: "#666", fontSize: "14px", lineHeight: "1.5" }}>Welcome back. Please log in with Keycloak to access your camera streams and sequences.</p>
                <button
                    onClick={handleLogin}
                    style={{
                        width: "100%", padding: "12px", backgroundColor: "#1976d2", color: "#fff",
                        border: "none", borderRadius: "4px", fontSize: "16px", fontWeight: "600",
                        cursor: "pointer", transition: "background-color 0.2s"
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1565c0')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#1976d2')}
                >
                    Sign In
                </button>
            </div>
        </div>
    )
}

export default Login;