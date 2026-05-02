export interface IntrusionEvent {
    eventId:    string;
    cameraId:   string;
    cameraName: string;
    zoneName:   string;
    zoneType:   'INTRUSION' | 'LOITERING' | 'LINE_CROSSING';
    detectedAt: string; // ISO-8601 UTC
    confidence: number; // 0.0 – 1.0
    centroid:   { x: number; y: number };
}

/** IntrusionEvent + metadata dùng trong UI (id local, thời điểm nhận) */
export interface IntrusionAlert extends IntrusionEvent {
    /** ID nội bộ để làm React key và dismiss */
    alertId:    string;
    receivedAt: Date;
}