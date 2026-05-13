import { useEffect, useRef } from 'react';
import { CONFIG } from '../configurations/configuration';

export interface CameraStatusUpdate {
    id: string;
    name: string;
    status: 'OK' | 'NOK';
    checkedAt: string;
}

export interface CameraStatusEvent {
    type: 'snapshot' | 'update' | 'heartbeat';
    cameras: CameraStatusUpdate[];
}

export function useCameraStatusSSE(onEvent: (event: CameraStatusEvent) => void) {
    const callbackRef = useRef(onEvent);
    callbackRef.current = onEvent;

    useEffect(() => {
        const es = new EventSource(`${CONFIG.API_GATEWAY}/cameras/status/stream`);

        es.addEventListener('camera-status', (e: MessageEvent) => {
            try {
                const data: CameraStatusEvent = JSON.parse(e.data);
                if (data.type !== 'heartbeat') {
                    callbackRef.current(data);
                }
            } catch { /* ignore */ }
        });

        return () => es.close();
    }, []);
}
