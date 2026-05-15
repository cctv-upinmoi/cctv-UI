import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldX, X } from 'lucide-react';
import styles from './IntrusionAlertToast.module.css';
import type { IntrusionAlert } from '../types/intrusion';
import { useTranslation } from 'react-i18next';

const ALERT_CONFIG = {
    INTRUSION: {
        color:  '#ef4444',
        Icon:   ShieldX,
        labelKey: 'home.alertIntrusion',
    },
    PROXIMITY: {
        color:  '#eab308',
        Icon:   ShieldAlert,
        labelKey: 'home.alertProximity',
    },
} as const;

interface Props {
    alerts:     IntrusionAlert[];
    connected:  boolean;
    onDismiss:  (alertId: string) => void;
    onClearAll: () => void;
}

const IntrusionAlertToast: React.FC<Props> = ({ alerts, onDismiss, onClearAll }) => {
    const { t } = useTranslation();

    return (
        <div className={styles.container}>
            {alerts.length > 0 && (
                <div className={styles.alertList}>
                    {alerts.length > 1 && (
                        <div className={styles.listHeader}>
                            <span>{alerts.length} {t('home.activeAlerts')}</span>
                            <button className={styles.clearAllBtn} onClick={onClearAll}>
                                {t('home.clearAll')}
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
    const { t } = useTranslation();
    const [progress, setProgress] = useState(100);

    const cfg = ALERT_CONFIG[alert.alertType] ?? ALERT_CONFIG.INTRUSION;
    const { color, Icon, labelKey } = cfg;

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
                style={{ width: `${progress}%`, backgroundColor: color }}
            />
            <div className={styles.cardBody}>
                <Icon size={20} color={color} className={styles.alertIcon} />
                <div className={styles.content}>
                    <div className={styles.topRow}>
                        <span className={styles.cameraName}>{alert.cameraName}</span>
                        <span
                            className={styles.zoneTypeBadge}
                            style={{ backgroundColor: color }}
                        >
                            {t(labelKey)}
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
