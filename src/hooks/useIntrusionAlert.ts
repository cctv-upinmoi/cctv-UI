import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { CONFIG } from '../configurations/configuration';
import keycloak from '../configurations/keycloak';
import type { IntrusionAlert, IntrusionEvent } from '../types/intrusion';

const WS_TOPIC          = '/topic/intrusion-alerts';
const AUTO_DISMISS_MS   = 10_000; // alert tự đóng sau 10 giây
const TOKEN_MIN_VALIDITY_SEC = 30; // refresh token nếu còn < 30s

export function useIntrusionAlert() {
    const [alerts, setAlerts]       = useState<IntrusionAlert[]>([]);
    const [connected, setConnected] = useState(false);
    const clientRef                 = useRef<Client | null>(null);

    useEffect(() => {
        const client = new Client({
            brokerURL:       CONFIG.WS_URL,
            reconnectDelay:  5_000,   // tự reconnect sau 5s nếu mất kết nối
            heartbeatIncoming: 4_000,
            heartbeatOutgoing: 4_000,

            /**
             * Được gọi trước mỗi lần connect (cả lần đầu lẫn reconnect).
             * Refresh token Keycloak nếu sắp hết hạn, sau đó gán connectHeaders.
             */
            beforeConnect: async () => {
                try {
                    await keycloak.updateToken(TOKEN_MIN_VALIDITY_SEC);
                } catch {
                    // Token hết hạn và không refresh được → redirect về login
                    keycloak.login();
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
                            ...event,
                            alertId:    crypto.randomUUID(),
                            receivedAt: new Date(),
                        };

                        setAlerts(prev => [alert, ...prev].slice(0, 20)); // giữ tối đa 20 alerts

                        // Auto-dismiss sau AUTO_DISMISS_MS
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
                const detail    = frame.headers['detail'] ?? frame.body;

                if (errorType === 'UNAUTHORIZED') {
                    console.warn('[WS] JWT rejected by server — redirecting to login');
                    keycloak.login();
                    return;
                }
                console.error('[WS] STOMP error:', errorType, detail);
                setConnected(false);
            },

            onWebSocketError: (event) => {
                console.error('[WS] Transport error:', event);
                setConnected(false);
            },

            onWebSocketClose: (event) => {
                if (event.code !== 1000) {
                    console.warn('[WS] Closed abnormally, code:', event.code, event.reason);
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

    const dismissAlert = useCallback((alertId: string) => {
        setAlerts(prev => prev.filter(a => a.alertId !== alertId));
    }, []);

    const clearAll = useCallback(() => setAlerts([]), []);

    return { alerts, connected, dismissAlert, clearAll };
}