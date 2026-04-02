import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import keycloak from "./configurations/keycloak";

const Main = () => {
  const [keycloakInitialized, setKeycloakInitialized] = useState(false);
  const isRun = useRef(false);

  useEffect(() => {
    if (isRun.current) return;
    isRun.current = true;

    keycloak
      .init({
        onLoad: "check-sso",
        checkLoginIframe: false,
      })
      .then((authenticated) => {
        setKeycloakInitialized(true);
        if (authenticated) {
          console.log("Access Token: ", keycloak.token);
        } else {
          console.log("User is not authenticated. Token is undefined.");
          // uncomment the line below if you want to force login immediately
          // keycloak.login();
        }
      })
      .catch((err) => {
        console.error("Authenticated Failed", err);
      });
  }, []);

  if (!keycloakInitialized) {

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "16px"
        }}
      >
        <div className="spinner"></div>
        <span style={{ fontFamily: "sans-serif", color: "#555" }}>Initializing...</span>
        <style>
          {`
            .spinner {
              border: 4px solid rgba(0, 0, 0, 0.1);
              width: 40px;
              height: 40px;
              border-radius: 50%;
              border-left-color: #1976d2;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return <App />;
};

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
