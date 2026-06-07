// ── Job ───────────────────────────────────────────────────────────────────────

export interface Job {
    id?: string;
    name: string;
    cameraId: string;
    cameraName: string;
    alertTypes: string[];
    enabled: boolean;
}

// ── Subscriber ────────────────────────────────────────────────────────────────

export interface Subscriber {
    id?: string;
    userId?: string;
    email: string | null;
    telegramChatId: string | null;
    channels: string[];
    enabled: boolean;
    jobs: Job[];
}

// ── Legacy aliases (keep for compatibility during migration) ──────────────────
/** @deprecated use Subscriber */
export type NotificationPreference = Subscriber;
/** @deprecated use Job */
export type Subscription = Job;

// ── Row types for table display ───────────────────────────────────────────────

export interface SubscriberRow {
    userId: string;
    subscriberName: string;
    subscriberEmail: string;
    email: string | null;
    telegramChatId: string | null;
    channels: string[];
    enabled: boolean;
    jobs: Job[];
}
