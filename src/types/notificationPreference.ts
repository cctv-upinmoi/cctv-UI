export interface Subscription {
    subscriptionId?: string;
    cameraId: string;
    cameraName: string;
    /** empty = all zones */
    zoneNames: string[];
    alertTypes: string[];
    channels: string[];
    enabled: boolean;
}

export interface NotificationPreference {
    id?: string;
    userId?: string;
    email: string | null;
    telegramChatId: string | null;
    enabled: boolean;
    subscriptions: Subscription[];
}

/** Flat row used by the table — one row per subscription */
export interface SubscriptionRow {
    userId: string;
    subscriberName: string;
    subscriberEmail: string;
    email: string | null;
    telegramChatId: string | null;
    subscriptionId: string;
    cameraId: string;
    cameraName: string;
    zoneNames: string[];
    alertTypes: string[];
    channels: string[];
    enabled: boolean;
}
