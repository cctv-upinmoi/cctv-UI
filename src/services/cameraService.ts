import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import type { AddCameraReq, UpdateCameraReq } from "../types/camera";

export const getAllCameras = () =>
    httpClient.get(API.CAMERAS);

export const getCameraById = (id: string) =>
    httpClient.get(`${API.CAMERAS}/${id}`);

export const addCamera = (data: AddCameraReq) =>
    httpClient.post(API.CAMERAS, data);

export const updateCamera = (data: UpdateCameraReq) =>
    httpClient.patch(API.CAMERAS, data);

export const deleteCamera = (id: string) =>
    httpClient.delete(`${API.CAMERAS}/${id}`);

export const updateZone = (data: { cameraId: string; zones: import('../types/camera').Zone[] }) =>
    httpClient.patch(`${API.CAMERAS}/update-zone`, data);

export const importCameras = (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return httpClient.post(`${API.CAMERAS}/import`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};
