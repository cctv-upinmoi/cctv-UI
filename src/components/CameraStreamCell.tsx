import React, { useRef, useEffect, useCallback, useState } from 'react';
import styles from './CameraStreamCell.module.css';
import { CONFIG } from '../configurations/configuration';
import { videoContentRect } from '../utils/videoRect';
import type { Zone } from '../types/camera';

const ZONE_COLORS: Record<string, { fill: string; stroke: string }> = {
    INTRUSION: { fill: 'rgba(239,68,68,0.25)', stroke: '#ef4444' },
    LOITERING: { fill: 'rgba(249,115,22,0.25)', stroke: '#f97316' },
    LINE_CROSSING: { fill: 'rgba(59,130,246,0.25)', stroke: '#3b82f6' },
};

interface CameraStreamCellProps {
    cameraName: string;
    zones?: Zone[];
}

const CameraStreamCell: React.FC<CameraStreamCellProps> = ({ cameraName, zones }) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [natW, setNatW] = useState(0);
    const [natH, setNatH] = useState(0);

    // Fetch one frame to get video natural dimensions
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            setNatW(img.naturalWidth);
            setNatH(img.naturalHeight);
        };
        img.src = `${CONFIG.GO2RTC_URL}/api/frame.jpeg?src=${encodeURIComponent(cameraName)}`;
    }, [cameraName]);

    const drawZones = useCallback(() => {
        const canvas = canvasRef.current;
        const wrapper = wrapperRef.current;
        if (!canvas || !wrapper) return;

        canvas.width = wrapper.clientWidth;
        canvas.height = wrapper.clientHeight;
        const { width, height } = canvas;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);

        if (!zones || zones.length === 0) return;

        // Map zone coordinates (video frame space) to canvas pixel space
        const vr = videoContentRect(width, height, natW, natH);

        zones.forEach(zone => {
            if (!zone.enabled || zone.points.length < 3) return;
            const colors = ZONE_COLORS[zone.type] ?? ZONE_COLORS.INTRUSION;

            ctx.beginPath();
            zone.points.forEach(([nx, ny], i) => {
                const px = vr.x + nx * vr.w;
                const py = vr.y + ny * vr.h;
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            });
            ctx.closePath();
            ctx.fillStyle = colors.fill;
            ctx.fill();
            ctx.strokeStyle = colors.stroke;
            ctx.lineWidth = 2;
            ctx.stroke();

            const cx = zone.points.reduce((s, [x]) => s + vr.x + x * vr.w, 0) / zone.points.length;
            const cy = zone.points.reduce((s, [, y]) => s + vr.y + y * vr.h, 0) / zone.points.length;
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillText(zone.name, cx + 1, cy + 1);
            ctx.fillStyle = colors.stroke;
            ctx.fillText(zone.name, cx, cy);
        });
    }, [zones, natW, natH]);

    useEffect(() => {
        drawZones();
        const observer = new ResizeObserver(drawZones);
        if (wrapperRef.current) observer.observe(wrapperRef.current);
        return () => observer.disconnect();
    }, [drawZones]);

    return (
        <div ref={wrapperRef} className={styles.wrapper}>
            <iframe
                src={`${CONFIG.GO2RTC_URL}/stream.html?src=${encodeURIComponent(cameraName)}`}
                className={styles.stream}
                allowFullScreen
                allow="autoplay"
            />
            <canvas ref={canvasRef} className={styles.overlay} />
        </div>
    );
};

export default CameraStreamCell;