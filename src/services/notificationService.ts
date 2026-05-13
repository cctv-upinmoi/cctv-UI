import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";

export interface NotificationRes {
    id: string;
    cameraId: string;
    cameraName: string;
    zoneName: string;
    detectedAt: string;
    imageUrl: string;
    read: boolean;
    createdAt: string;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export const getNotifications = (page = 0, size = 20, read?: boolean) => {
    const params: Record<string, string | number | boolean> = { page, size };
    if (read !== undefined) params.read = read;
    return httpClient.get<{ code: number; data: PageResponse<NotificationRes> }>(
        API.NOTIFICATIONS,
        { params }
    );
};

export const getUnreadCount = () =>
    httpClient.get<{ code: number; data: number }>(
        `${API.NOTIFICATIONS}/unread-count`
    );

export const markRead = (id: string) =>
    httpClient.patch(
        `${API.NOTIFICATIONS}/${id}/read`,
        null,
    );

export const markAllRead = () =>
    httpClient.patch(
        `${API.NOTIFICATIONS}/read-all`,
        null,
    );
