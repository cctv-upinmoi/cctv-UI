import axios from "axios";
import { CONFIG } from "./configuration";
import keycloak from "./keycloak";

const httpClient = axios.create({
    baseURL: CONFIG.API_GATEWAY,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Inject fresh token vào mọi request
httpClient.interceptors.request.use(async (config) => {
    if (keycloak.authenticated) {
        try {
            await keycloak.updateToken(30);
        } catch {
            // token refresh thất bại — vẫn tiếp tục với token hiện tại
        }
        config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
});

// Khi nhận 401, thử refresh token rồi retry 1 lần
httpClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            try {
                await keycloak.updateToken(0);
                original.headers.Authorization = `Bearer ${keycloak.token}`;
                return httpClient(original);
            } catch {
                // refresh thất bại — trả về lỗi gốc
            }
        }
        return Promise.reject(error);
    }
);

export default httpClient;
