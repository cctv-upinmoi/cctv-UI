// Default values for local development.
// In Docker, this file is overwritten by docker-entrypoint.sh using env vars.
window.__RUNTIME_CONFIG__ = {
    BACKEND_URL:  "http://localhost:8080",
    GO2RTC_URL:   "http://localhost:1984",
    KC_URL:       "http://localhost:8081",
    KC_REALM:     "smart-cctv",
    KC_CLIENT_ID: "cctv-web"
};
