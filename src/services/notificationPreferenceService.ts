import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import type { Subscriber } from "../types/notificationPreference";

const BASE = API.NOTIFICATION_PREFERENCES;

export interface SubscriberRequest {
    userId?: string;
    email: string | null;
    telegramChatId: string | null;
    channels: string[];
    enabled: boolean;
    jobIds: string[];
}

export const getPreference = () =>
    httpClient.get<{ code: number; data: Subscriber | null }>(BASE);

export const upsertPreference = (data: SubscriberRequest) =>
    httpClient.put<{ code: number; data: Subscriber }>(BASE, data);

export const deletePreference = () =>
    httpClient.delete(BASE);

export const togglePreference = () =>
    httpClient.patch<{ code: number; data: Subscriber }>(`${BASE}/toggle`, null);

// Admin endpoints
export const getAllPreferences = () =>
    httpClient.get<{ code: number; data: Subscriber[] }>(`${BASE}/admin/all`);

export const adminUpsertPreference = (userId: string, data: SubscriberRequest) =>
    httpClient.put<{ code: number; data: Subscriber }>(`${BASE}/admin/${userId}`, data);

export const adminDeletePreference = (userId: string) =>
    httpClient.delete(`${BASE}/admin/${userId}`);
