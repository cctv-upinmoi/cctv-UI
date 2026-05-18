#!/bin/sh
cat > /usr/share/nginx/html/config.js << EOF
window.__RUNTIME_CONFIG__ = {
    BACKEND_URL:  "${BACKEND_URL:-http://localhost:8080}",
    GO2RTC_URL:   "${GO2RTC_URL:-http://localhost:1984}",
    KC_URL:       "${KC_URL:-http://localhost:8081}",
    KC_REALM:     "${KC_REALM:-smart-cctv}",
    KC_CLIENT_ID: "${KC_CLIENT_ID:-cctv-web}"
};
EOF

exec nginx -g 'daemon off;'
