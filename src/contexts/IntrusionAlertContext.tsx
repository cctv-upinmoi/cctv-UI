import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { CONFIG } from '../configurations/configuration';
import keycloak from '../configurations/keycloak';
import { getUnreadCount } from '../services/notificationService';
import type { IntrusionAlert, IntrusionEvent } from '../types/intrusion';

const WS_TOPIC             = '/topic/intrusion-alerts';
const AUTO_DISMISS_MS      = 10_000;
const TOKEN_MIN_VALIDITY_SEC = 30;

interface IntrusionAlertContextValue {
    alerts: IntrusionAlert[];
    connected: boolean;
    unreadCount: number;
    dismissAlert: (alertId: string) => void;
    clearAll: () => void;
    decrementUnread: () => void;
    resetUnread: () => void;
}

const IntrusionAlertContext = createContext<IntrusionAlertContextValue>({
    alerts: [],
    connected: false,
    unreadCount: 0,
    dismissAlert: () => {},
    clearAll: () => {},
    decrementUnread: () => {},
    resetUnread: () => {},
});

export const IntrusionAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [alerts,      setAlerts]      = useState<IntrusionAlert[]>([]);
    const [connected,   setConnected]   = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const clientRef = useRef<Client | null>(null);

    // Fetch initial unread count
    useEffect(() => {
        getUnreadCount()
            .then(res => setUnreadCount(res.data.data))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!keycloak.authenticated) return;

        const client = new Client({
            brokerURL:         CONFIG.WS_URL,
            reconnectDelay:    5_000,
            heartbeatIncoming: 4_000,
            heartbeatOutgoing: 4_000,

            beforeConnect: async () => {
                try {
                    await keycloak.updateToken(TOKEN_MIN_VALIDITY_SEC);
                } catch {
                    client.deactivate();
                    return;
                }
                client.connectHeaders = {
                    Authorization: `Bearer ${keycloak.token ?? ''}`,
                };
            },

            onConnect: () => {
                setConnected(true);
                client.subscribe(WS_TOPIC, (message) => {
                    try {
                        const event: IntrusionEvent = JSON.parse(message.body);
                        const alert: IntrusionAlert = {
                            id:         event.id,
                            cameraId:   event.cameraId,
                            cameraName: event.cameraName,
                            zoneName:   event.zoneName,
                            detectedAt: event.detectedAt,
                            imageUrl:   event.imageUrl,
                            alertId:    crypto.randomUUID(),
                            receivedAt: new Date(),
                        };

                        setAlerts(prev => [alert, ...prev].slice(0, 20));
                        setUnreadCount(prev => prev + 1);

                        setTimeout(() => {
                            setAlerts(prev => prev.filter(a => a.alertId !== alert.alertId));
                        }, AUTO_DISMISS_MS);
                    } catch (err) {
                        console.error('[WS] Failed to parse intrusion event:', err);
                    }
                });
            },

            onDisconnect: () => setConnected(false),

            onStompError: (frame) => {
                const errorType = frame.headers['error-type'] ?? frame.headers['message'];
                if (errorType === 'UNAUTHORIZED') {
                    setConnected(false);
                    return;
                }
                console.error('[WS] STOMP error:', errorType, frame.headers['detail'] ?? frame.body);
                setConnected(false);
            },

            onWebSocketError: (event) => {
                console.error('[WS] Transport error:', event);
                setConnected(false);
            },

            onWebSocketClose: (event) => {
                if (event.code !== 1000) {
                    console.warn('[WS] Closed abnormally, code:', event.code);
                }
                setConnected(false);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
            clientRef.current = null;
        };
    }, []);

    const dismissAlert   = useCallback((alertId: string) => {
        setAlerts(prev => prev.filter(a => a.alertId !== alertId));
    }, []);

    const clearAll       = useCallback(() => setAlerts([]), []);
    const decrementUnread = useCallback(() => setUnreadCount(prev => Math.max(0, prev - 1)), []);
    const resetUnread    = useCallback(() => setUnreadCount(0), []);

    return (
        <IntrusionAlertContext.Provider
            value={{ alerts, connected, unreadCount, dismissAlert, clearAll, decrementUnread, resetUnread }}
        >
            {children}
        </IntrusionAlertContext.Provider>
    );
};

export const useIntrusionAlertContext = () => useContext(IntrusionAlertContext);
