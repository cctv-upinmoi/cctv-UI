declare global {
    interface Window {
        __RUNTIME_CONFIG__?: {
            BACKEND_URL:  string;
            GO2RTC_URL:   string;
            KC_URL:       string;
            KC_REALM:     string;
            KC_CLIENT_ID: string;
        };
    }
}

const rc = window.__RUNTIME_CONFIG__;

const backendUrl = rc?.BACKEND_URL ?? 'http://localhost:8080';

export const CONFIG = {
    API_GATEWAY: `${backendUrl}/cctv-core`,
    GO2RTC_URL:  rc?.GO2RTC_URL ?? 'http://localhost:1984',
    WS_URL:      `${backendUrl.replace(/^http/, 'ws')}/cctv-core/ws`,
};

export const API = {
    MY_PROFILE:               'users',
    CAMERAS:                  'cameras',
    NOTIFICATIONS:            'notifications',
    NOTIFICATION_PREFERENCES: 'notifications/preferences',
    ANALYTICS:                'analytics',
};

export const KEYCLOACK_CONFIG = {
    url:      rc?.KC_URL       ?? 'http://localhost:8081/',
    realm:    rc?.KC_REALM     ?? 'smart-cctv',
    clientId: rc?.KC_CLIENT_ID ?? 'cctv-web',
};
