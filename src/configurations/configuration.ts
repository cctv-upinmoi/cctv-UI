export const CONFIG = {
    API_GATEWAY: "http://localhost:8080/cctv-core",
    GO2RTC_URL:  "http://localhost:1984",
    // WebSocket STOMP endpoint (context-path: /cctv-core)
    WS_URL:      "ws://localhost:8080/cctv-core/ws",
};

export const API = {
    REGISTRATION: "users/register",
    MY_PROFILE: "users",
    CAMERAS: "cameras",
};

export const KEYCLOACK_CONFIG = {
    url: "http://localhost:8081/",
    realm: "smart-cctv",
    clientId: "cctv-web",
};