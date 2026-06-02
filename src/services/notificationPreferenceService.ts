import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import type { NotificationPreference } from "../types/notificationPreference";

export const getPreference = () =>
    httpClient.get<{ code: number; data: NotificationPreference | null }>(
        API.NOTIFICATION_PREFERENCES
    );

export const upsertPreference = (data: NotificationPreference) =>
    httpClient.put<{ code: number; data: NotificationPreference }>(
        API.NOTIFICATION_PREFERENCES,
        data
    );

export const deletePreference = () =>
    httpClient.delete(API.NOTIFICATION_PREFERENCES);

export const togglePreference = () =>
    httpClient.patch<{ code: number; data: NotificationPreference }>(
        `${API.NOTIFICATION_PREFERENCES}/toggle`,
        null
    );
