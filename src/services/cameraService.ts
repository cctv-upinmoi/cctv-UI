import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import keycloak from "../configurations/keycloak";
import type { AddCameraReq, UpdateCameraReq } from "../types/camera";

const authHeader = () => ({
    Authorization: "Bearer " + keycloak.token,
});

export const getAllCameras = () =>
    httpClient.get(API.CAMERAS, { headers: authHeader() });

export const getCameraById = (id: string) =>
    httpClient.get(`${API.CAMERAS}/${id}`, { headers: authHeader() });

export const addCamera = (data: AddCameraReq) =>
    httpClient.post(API.CAMERAS, data, { headers: authHeader() });

export const updateCamera = (data: UpdateCameraReq) =>
    httpClient.patch(API.CAMERAS, data, { headers: authHeader() });

export const deleteCamera = (id: string) =>
    httpClient.delete(`${API.CAMERAS}/${id}`, { headers: authHeader() });

export const updateZone = (data: { cameraId: string; zones: import('../types/camera').Zone[] }) =>
    httpClient.patch(`${API.CAMERAS}/update-zone`, data, { headers: authHeader() });
