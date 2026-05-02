import React, { useEffect, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import styles from './IntrusionAlertToast.module.css';
import type { IntrusionAlert } from '../types/intrusion';

const ZONE_TYPE_LABEL: Record<string, string> = {
    INTRUSION:     'Xâm nhập',
    LOITERING:     '徘徊',
    LINE_CROSSING: 'Vượt ranh',
};

const ZONE_TYPE_COLOR: Record<string, string> = {
    INTRUSION:     '#ef4444',
    LOITERING:     '#f97316',
    LINE_CROSSING: '#eab308',
};

interface Props {
    alerts:       IntrusionAlert[];
    connected:    boolean;
    onDismiss:    (alertId: string) => void;
    onClearAll:   () => void;
}

const IntrusionAlertToast: React.FC<Props> = ({ alerts, onDismiss, onClearAll }) => {
    return (
        <div className={styles.container}>
            {/* Alert list */}
            {alerts.length > 0 && (
                <div className={styles.alertList}>
                    {/* Header khi có nhiều alert */}
                    {alerts.length > 1 && (
                        <div className={styles.listHeader}>
                            <span>{alerts.length} cảnh báo</span>
                            <button className={styles.clearAllBtn} onClick={onClearAll}>
                                Xóa tất cả
                            </button>
                        </div>
                    )}

                    {alerts.map(alert => (
                        <AlertCard key={alert.alertId} alert={alert} onDismiss={onDismiss} />
                    ))}
                </div>
            )}
        </div>
    );
};

/** -------- Card cho từng alert -------- */
const AlertCard: React.FC<{ alert: IntrusionAlert; onDismiss: (id: string) => void }> = ({ alert, onDismiss }) => {
    const [progress, setProgress] = useState(100);

    // Progress bar đếm ngược 10s
    useEffect(() => {
        const start = Date.now();
        const total = 10_000;
        const id = setInterval(() => {
            const elapsed = Date.now() - start;
            const remaining = Math.max(0, 100 - (elapsed / total) * 100);
            setProgress(remaining);
            if (remaining === 0) clearInterval(id);
        }, 100);
        return () => clearInterval(id);
    }, []);

    const zoneColor = ZONE_TYPE_COLOR[alert.zoneType] ?? '#6b7280';
    const time      = alert.receivedAt.toLocaleTimeString('vi-VN');
    const confPct   = Math.round((alert.confidence ?? 0) * 100);

    return (
        <div className={styles.card}>
            {/* Progress bar */}
            <div
                className={styles.progressBar}
                style={{ width: `${progress}%`, backgroundColor: zoneColor }}
            />

            <div className={styles.cardBody}>
                {/* Icon */}
                <ShieldAlert size={20} color={zoneColor} className={styles.alertIcon} />

                {/* Content */}
                <div className={styles.content}>
                    <div className={styles.topRow}>
                        <span className={styles.cameraName}>{alert.cameraName}</span>
                        <span
                            className={styles.zoneTypeBadge}
                            style={{ backgroundColor: zoneColor }}
                        >
                            {ZONE_TYPE_LABEL[alert.zoneType] ?? alert.zoneType}
                        </span>
                    </div>
                    <div className={styles.bottomRow}>
                        <span className={styles.zoneName}>Zone: {alert.zoneName}</span>
                        <span className={styles.meta}>
                            {confPct}% · {time}
                        </span>
                    </div>
                </div>

                {/* Close */}
                <button className={styles.closeBtn} onClick={() => onDismiss(alert.alertId)}>
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

export default IntrusionAlertToast;