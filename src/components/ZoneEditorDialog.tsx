import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, MapPin, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import styles from './ZoneEditorDialog.module.css';
import { updateZone } from '../services/cameraService';
import type { CameraRes, Zone } from '../types/camera';
import { CONFIG } from '../configurations/configuration';

const ZONE_COLORS: Record<string, { fill: string; stroke: string }> = {
    INTRUSION: { fill: 'rgba(239,68,68,0.25)', stroke: '#ef4444' },
    LOITERING: { fill: 'rgba(249,115,22,0.25)', stroke: '#f97316' },
    LINE_CROSSING: { fill: 'rgba(59,130,246,0.25)', stroke: '#3b82f6' },
};

interface Point { x: number; y: number; }

interface ZoneEditorDialogProps {
    camera: CameraRes;
    onClose: () => void;
    onSaved: () => void;
}

const ZoneEditorDialog: React.FC<ZoneEditorDialogProps> = ({ camera, onClose, onSaved }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    const [zones, setZones] = useState<Zone[]>(camera.zones ?? []);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
    const [mousePos, setMousePos] = useState<Point | null>(null);
    const [newZoneName, setNewZoneName] = useState('');
    const [newZoneType, setNewZoneType] = useState<Zone['type']>('INTRUSION');
    const [imgLoaded, setImgLoaded] = useState(false);
    const [snapshotError, setSnapshotError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TODO: remove mock — replace with go2rtc live snapshot
    const USE_MOCK = true;
    const snapshotUrl = USE_MOCK
        ? '/mock-snapshot.jpg'
        : `${CONFIG.GO2RTC_URL}/api/frame.jpeg?src=${encodeURIComponent(camera.name)}&_t=${Date.now()}`;

    // ─── Canvas Drawing ────────────────────────────────────────────────────────

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img || !imgLoaded) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);

        // Draw completed zones
        zones.forEach(zone => {
            if (zone.points.length < 3) return;
            const colors = ZONE_COLORS[zone.type] ?? ZONE_COLORS.INTRUSION;

            ctx.beginPath();
            zone.points.forEach(([nx, ny], i) => {
                const px = nx * width;
                const py = ny * height;
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            });
            ctx.closePath();
            ctx.fillStyle = zone.enabled ? colors.fill : 'rgba(150,150,150,0.15)';
            ctx.fill();
            ctx.strokeStyle = zone.enabled ? colors.stroke : '#999';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Zone label at centroid
            const cx = zone.points.reduce((s, [x]) => s + x * width, 0) / zone.points.length;
            const cy = zone.points.reduce((s, [, y]) => s + y * height, 0) / zone.points.length;
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // text shadow
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillText(zone.name, cx + 1, cy + 1);
            ctx.fillStyle = zone.enabled ? colors.stroke : '#999';
            ctx.fillText(zone.name, cx, cy);
        });

        // Draw in-progress polygon
        if (isDrawing && drawingPoints.length > 0) {
            const colors = ZONE_COLORS[newZoneType] ?? ZONE_COLORS.INTRUSION;
            const previewPts = mousePos ? [...drawingPoints, mousePos] : drawingPoints;

            ctx.beginPath();
            ctx.setLineDash([6, 4]);
            ctx.strokeStyle = colors.stroke;
            ctx.lineWidth = 2;
            previewPts.forEach(({ x, y }, i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw vertices
            drawingPoints.forEach(({ x, y }, i) => {
                const isFirst = i === 0;
                ctx.beginPath();
                ctx.arc(x, y, isFirst ? 7 : 4, 0, Math.PI * 2);
                ctx.fillStyle = isFirst ? colors.stroke : '#fff';
                ctx.fill();
                ctx.strokeStyle = colors.stroke;
                ctx.lineWidth = 2;
                ctx.stroke();

                // Highlight first point when close enough to close
                if (isFirst && mousePos) {
                    const dist = Math.sqrt((mousePos.x - x) ** 2 + (mousePos.y - y) ** 2);
                    if (dist < 15 && drawingPoints.length >= 3) {
                        ctx.beginPath();
                        ctx.arc(x, y, 12, 0, Math.PI * 2);
                        ctx.strokeStyle = colors.stroke;
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                }
            });
        }
    }, [zones, isDrawing, drawingPoints, mousePos, newZoneType, imgLoaded]);

    useEffect(() => { draw(); }, [draw]);

    const syncCanvasSize = useCallback(() => {
        const canvas = canvasRef.current;
        const img = imgRef.current;
        if (!canvas || !img) return;
        canvas.width = img.clientWidth;
        canvas.height = img.clientHeight;
        draw();
    }, [draw]);

    useEffect(() => {
        if (!imgLoaded) return;
        syncCanvasSize();
        window.addEventListener('resize', syncCanvasSize);
        return () => window.removeEventListener('resize', syncCanvasSize);
    }, [imgLoaded, syncCanvasSize]);

    // ESC cancels drawing
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isDrawing) {
                setIsDrawing(false);
                setDrawingPoints([]);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isDrawing]);

    // ─── Canvas Event Handlers ─────────────────────────────────────────────────

    const getPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
        const rect = canvasRef.current!.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const nearFirstPoint = (pt: Point): boolean => {
        if (drawingPoints.length < 3) return false;
        const { x, y } = drawingPoints[0];
        return Math.sqrt((pt.x - x) ** 2 + (pt.y - y) ** 2) < 15;
    };

    const finishPolygon = (points: Point[]) => {
        const { width, height } = canvasRef.current!;
        const normalized: [number, number][] = points.map(({ x, y }) => [
            parseFloat((x / width).toFixed(4)),
            parseFloat((y / height).toFixed(4)),
        ]);
        setZones(prev => [...prev, {
            name: newZoneName.trim() || `Zone ${prev.length + 1}`,
            type: newZoneType,
            enabled: true,
            points: normalized,
        }]);
        setIsDrawing(false);
        setDrawingPoints([]);
        setNewZoneName('');
    };

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        // ignore right-click
        if (e.button !== 0) return;
        const pt = getPoint(e);
        if (nearFirstPoint(pt)) {
            finishPolygon(drawingPoints);
        } else {
            setDrawingPoints(prev => [...prev, pt]);
        }
    };

    const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || drawingPoints.length < 3) return;
        e.preventDefault();
        // double-click fires click twice — strip the last duplicate point
        finishPolygon(drawingPoints.slice(0, -1));
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isDrawing) setMousePos(getPoint(e));
    };

    // ─── Zone Panel Actions ────────────────────────────────────────────────────

    const startDrawing = () => {
        if (!newZoneName.trim()) {
            setError('Vui lòng nhập tên vùng trước khi vẽ.');
            return;
        }
        setError(null);
        setIsDrawing(true);
        setDrawingPoints([]);
    };

    const toggleZone = (i: number) =>
        setZones(prev => prev.map((z, idx) => idx === i ? { ...z, enabled: !z.enabled } : z));

    const removeZone = (i: number) =>
        setZones(prev => prev.filter((_, idx) => idx !== i));

    // ─── Save ──────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await updateZone({ cameraId: camera.id, zones });
            onSaved();
            onClose();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(message || 'Không thể lưu zones. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <div className={styles.backdrop}>
            <div className={styles.dialog}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerIcon}><MapPin size={18} /></div>
                    <div className={styles.title}>Zone Editor — {camera.name}</div>
                    <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    {/* Canvas */}
                    <div className={styles.canvasWrapper}>
                        {snapshotError ? (
                            <div className={styles.snapshotError}>
                                <MapPin size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                                <div>Không thể tải snapshot từ go2rtc.</div>
                                <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>
                                    Stream: <code>{camera.name}</code>
                                </div>
                            </div>
                        ) : (
                            <>
                                <img
                                    ref={imgRef}
                                    src={snapshotUrl}
                                    alt="camera snapshot"
                                    className={styles.snapshot}
                                    onLoad={() => setImgLoaded(true)}
                                    onError={() => setSnapshotError(true)}
                                    draggable={false}
                                />
                                <canvas
                                    ref={canvasRef}
                                    className={`${styles.canvas} ${isDrawing ? styles.canvasActive : ''}`}
                                    onClick={handleClick}
                                    onDoubleClick={handleDoubleClick}
                                    onMouseMove={handleMouseMove}
                                    onMouseLeave={() => setMousePos(null)}
                                />
                                {!imgLoaded && (
                                    <div className={styles.snapshotLoading}>Đang tải snapshot...</div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Right panel */}
                    <div className={styles.panel}>
                        {/* Add zone */}
                        <div className={styles.panelSection}>
                            <div className={styles.panelTitle}>Thêm vùng mới</div>
                            <input
                                className={styles.input}
                                placeholder="Tên vùng *"
                                value={newZoneName}
                                onChange={e => setNewZoneName(e.target.value)}
                                disabled={isDrawing}
                            />
                            <select
                                className={styles.select}
                                value={newZoneType}
                                onChange={e => setNewZoneType(e.target.value as Zone['type'])}
                                disabled={isDrawing}
                            >
                                <option value="INTRUSION">Xâm nhập (INTRUSION)</option>
                                <option value="LOITERING">Lảng vảng (LOITERING)</option>
                                <option value="LINE_CROSSING">Vượt ranh giới (LINE_CROSSING)</option>
                            </select>

                            {!isDrawing ? (
                                <button className={styles.btnDraw} onClick={startDrawing}>
                                    <Plus size={14} /> Bắt đầu vẽ
                                </button>
                            ) : (
                                <div className={styles.drawingHint}>
                                    <div className={styles.drawingBadge}>
                                        <span className={styles.dot} /> Đang vẽ — {drawingPoints.length} điểm
                                    </div>
                                    <ul className={styles.hintList}>
                                        <li>Click để thêm điểm</li>
                                        <li>Click vào điểm đầu (vòng tròn trắng) để đóng vùng</li>
                                        <li>Double-click để đóng vùng</li>
                                        <li>ESC để hủy</li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Zone list */}
                        <div className={styles.panelSection} style={{ flex: 1, overflowY: 'auto' }}>
                            <div className={styles.panelTitle}>
                                Danh sách vùng
                                <span className={styles.zoneBadge}>{zones.length}</span>
                            </div>
                            {zones.length === 0 && (
                                <div className={styles.emptyZones}>Chưa có vùng nào được vẽ</div>
                            )}
                            {zones.map((zone, i) => {
                                const colors = ZONE_COLORS[zone.type] ?? ZONE_COLORS.INTRUSION;
                                return (
                                    <div key={i} className={`${styles.zoneItem} ${!zone.enabled ? styles.zoneDisabled : ''}`}>
                                        <span className={styles.zoneColorDot} style={{ background: colors.stroke }} />
                                        <div className={styles.zoneInfo}>
                                            <span className={styles.zoneName}>{zone.name}</span>
                                            <span className={styles.zoneTypeBadge} style={{ color: colors.stroke }}>
                                                {zone.type}
                                            </span>
                                        </div>
                                        <button
                                            className={styles.iconBtn}
                                            title={zone.enabled ? 'Tắt vùng' : 'Bật vùng'}
                                            onClick={() => toggleZone(i)}
                                        >
                                            {zone.enabled ? <Eye size={13} /> : <EyeOff size={13} />}
                                        </button>
                                        <button
                                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                            title="Xóa vùng"
                                            onClick={() => removeZone(i)}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {error && <div className={styles.errorMsg}>{error}</div>}
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <button
                        className={`${styles.btn} ${styles.btnSave}`}
                        onClick={handleSave}
                        disabled={saving || isDrawing}
                    >
                        {saving ? 'Đang lưu...' : 'Lưu zones'}
                    </button>
                    <button
                        className={`${styles.btn} ${styles.btnCancel}`}
                        onClick={onClose}
                        disabled={saving}
                    >
                        Hủy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ZoneEditorDialog;
