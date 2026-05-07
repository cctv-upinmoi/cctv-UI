import React, { useEffect, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import styles from './IntrusionAlertToast.module.css';
import type { IntrusionAlert } from '../types/intrusion';

const ALERT_COLOR = '#ef4444';

interface Props {
    alerts:     IntrusionAlert[];
    connected:  boolean;
    onDismiss:  (alertId: string) => void;
    onClearAll: () => void;
}

const IntrusionAlertToast: React.FC<Props> = ({ alerts, onDismiss, onClearAll }) => {
    return (
        <div className={styles.container}>
            {alerts.length > 0 && (
                <div className={styles.alertList}>
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

const AlertCard: React.FC<{ alert: IntrusionAlert; onDismiss: (id: string) => void }> = ({ alert, onDismiss }) => {
    const [progress, setProgress] = useState(100);

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

    const time = alert.receivedAt.toLocaleTimeString('vi-VN');

    return (
        <div className={styles.card}>
            <div
                className={styles.progressBar}
                style={{ width: `${progress}%`, backgroundColor: ALERT_COLOR }}
            />
            <div className={styles.cardBody}>
                <ShieldAlert size={20} color={ALERT_COLOR} className={styles.alertIcon} />
                <div className={styles.content}>
                    <div className={styles.topRow}>
                        <span className={styles.cameraName}>{alert.cameraName}</span>
                        <span
                            className={styles.zoneTypeBadge}
                            style={{ backgroundColor: ALERT_COLOR }}
                        >
                            Xâm nhập
                        </span>
                    </div>
                    <div className={styles.bottomRow}>
                        <span className={styles.zoneName}>Zone: {alert.zoneName}</span>
                        <span className={styles.meta}>{time}</span>
                    </div>
                </div>
                <button className={styles.closeBtn} onClick={() => onDismiss(alert.alertId)}>
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

export default IntrusionAlertToast;
