export type AlertType = 'INTRUSION' | 'PROXIMITY';

export interface IntrusionEvent {
    id:          string;
    cameraId:    string;
    cameraName:  string;
    zoneName:    string;
    detectedAt:  string; // ISO-8601 UTC
    imageUrl:    string;
    alertType:   AlertType;
    personCount: number;
}

export interface IntrusionAlert extends IntrusionEvent {
    alertId:    string; // local UI key for dismiss
    receivedAt: Date;
}
