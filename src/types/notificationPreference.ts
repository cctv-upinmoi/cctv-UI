export interface Subscription {
    cameraId: string;
    cameraName: string;
    /** empty = all zones */
    zoneNames: string[];
    alertTypes: string[];
    channels: string[];
}

export interface NotificationPreference {
    id?: string;
    userId?: string;
    email: string | null;
    telegramChatId: string | null;
    enabled: boolean;
    subscriptions: Subscription[];
}
