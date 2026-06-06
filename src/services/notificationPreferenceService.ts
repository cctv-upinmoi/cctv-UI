import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import type { NotificationPreference } from "../types/notificationPreference";

const BASE = API.NOTIFICATION_PREFERENCES;

export const getPreference = () =>
    httpClient.get<{ code: number; data: NotificationPreference | null }>(BASE);

export const upsertPreference = (data: NotificationPreference) =>
    httpClient.put<{ code: number; data: NotificationPreference }>(BASE, data);

export const deletePreference = () =>
    httpClient.delete(BASE);

export const togglePreference = () =>
    httpClient.patch<{ code: number; data: NotificationPreference }>(`${BASE}/toggle`, null);

export const toggleSubscription = (subscriptionId: string) =>
    httpClient.patch<{ code: number; data: NotificationPreference }>(
        `${BASE}/subscription/${subscriptionId}/toggle`,
        null
    );

// Admin endpoints
export const getAllPreferences = () =>
    httpClient.get<{ code: number; data: NotificationPreference[] }>(`${BASE}/admin/all`);

export const adminUpsertPreference = (userId: string, data: NotificationPreference) =>
    httpClient.put<{ code: number; data: NotificationPreference }>(`${BASE}/admin/${userId}`, data);

export const adminDeletePreference = (userId: string) =>
    httpClient.delete(`${BASE}/admin/${userId}`);

export const adminToggleSubscription = (userId: string, subscriptionId: string) =>
    httpClient.patch<{ code: number; data: NotificationPreference }>(
        `${BASE}/admin/${userId}/subscription/${subscriptionId}/toggle`,
        null
    );
