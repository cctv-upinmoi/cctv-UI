import React, { useState, useMemo } from 'react';
import { LayoutDashboard, AlertTriangle, Camera as CameraIcon, TrendingUp, Clock } from 'lucide-react';
import styles from './Dashboard.module.css';

type ZoneType = 'INTRUSION' | 'LOITERING' | 'LINE_CROSSING';

interface AlertRecord {
    id: string;
    cameraName: string;
    zoneType: ZoneType;
    detectedAt: string; // ISO-8601 UTC
}

const ZONE_CONFIG: Record<ZoneType, { label: string; color: string }> = {
    INTRUSION:     { label: 'Xâm nhập',      color: '#ef4444' },
    LOITERING:     { label: 'Lảng vảng',      color: '#f97316' },
    LINE_CROSSING: { label: 'Vượt ranh giới', color: '#3b82f6' },
};

const DAY_SHORT: Record<number, string> = {
    0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7',
};

// Mock data — replace with API response
const MOCK_ALERTS: AlertRecord[] = [
    // 2026-05-06 today — 18 alerts
    { id: 't1',  cameraName: 'Camera Cổng Chính',  zoneType: 'INTRUSION',     detectedAt: '2026-05-06T01:15:00Z' },
    { id: 't2',  cameraName: 'Camera Kho Hàng',    zoneType: 'INTRUSION',     detectedAt: '2026-05-06T02:30:00Z' },
    { id: 't3',  cameraName: 'Camera Hành Lang A', zoneType: 'LINE_CROSSING', detectedAt: '2026-05-06T03:45:00Z' },
    { id: 't4',  cameraName: 'Camera Cổng Chính',  zoneType: 'INTRUSION',     detectedAt: '2026-05-06T06:20:00Z' },
    { id: 't5',  cameraName: 'Camera Bãi Đỗ Xe',   zoneType: 'LOITERING',     detectedAt: '2026-05-06T07:10:00Z' },
    { id: 't6',  cameraName: 'Camera Cổng Chính',  zoneType: 'INTRUSION',     detectedAt: '2026-05-06T08:05:00Z' },
    { id: 't7',  cameraName: 'Camera Kho Hàng',    zoneType: 'INTRUSION',     detectedAt: '2026-05-06T08:40:00Z' },
    { id: 't8',  cameraName: 'Camera Hành Lang A', zoneType: 'LINE_CROSSING', detectedAt: '2026-05-06T09:15:00Z' },
    { id: 't9',  cameraName: 'Camera Cổng Chính',  zoneType: 'LOITERING',     detectedAt: '2026-05-06T10:30:00Z' },
    { id: 't10', cameraName: 'Camera Bãi Đỗ Xe',   zoneType: 'LOITERING',     detectedAt: '2026-05-06T11:00:00Z' },
    { id: 't11', cameraName: 'Camera Kho Hàng',    zoneType: 'INTRUSION',     detectedAt: '2026-05-06T12:15:00Z' },
    { id: 't12', cameraName: 'Camera Cổng Chính',  zoneType: 'LINE_CROSSING', detectedAt: '2026-05-06T13:45:00Z' },
    { id: 't13', cameraName: 'Camera Hành Lang B', zoneType: 'INTRUSION',     detectedAt: '2026-05-06T14:20:00Z' },
    { id: 't14', cameraName: 'Camera Cổng Chính',  zoneType: 'INTRUSION',     detectedAt: '2026-05-06T15:00:00Z' },
    { id: 't15', cameraName: 'Camera Kho Hàng',    zoneType: 'LINE_CROSSING', detectedAt: '2026-05-06T15:30:00Z' },
    { id: 't16', cameraName: 'Camera Bãi Đỗ Xe',   zoneType: 'LOITERING',     detectedAt: '2026-05-06T16:10:00Z' },
    { id: 't17', cameraName: 'Camera Cổng Chính',  zoneType: 'INTRUSION',     detectedAt: '2026-05-06T17:45:00Z' },
    { id: 't18', cameraName: 'Camera Hành Lang A', zoneType: 'LINE_CROSSING', detectedAt: '2026-05-06T18:30:00Z' },
    // 2026-05-05 — 8 alerts
    { id: 'y1',  cameraName: 'Camera Cổng Chính',  zoneType: 'INTRUSION',     detectedAt: '2026-05-05T21:55:00Z' },
    { id: 'y2',  cameraName: 'Camera Kho Hàng',    zoneType: 'INTRUSION',     detectedAt: '2026-05-05T21:30:00Z' },
    { id: 'y3',  cameraName: 'Camera Hành Lang A', zoneType: 'LINE_CROSSING', detectedAt: '2026-05-05T20:15:00Z' },
    { id: 'y4',  cameraName: 'Camera Bãi Đỗ Xe',   zoneType: 'LOITERING',     detectedAt: '2026-05-05T19:00:00Z' },
    { id: 'y5',  cameraName: 'Camera Cổng Chính',  zoneType: 'INTRUSION',     detectedAt: '2026-05-05T17:30:00Z' },
    { id: 'y6',  cameraName: 'Camera Hành Lang B', zoneType: 'LINE_CROSSING', detectedAt: '2026-05-05T15:45:00Z' },
    { id: 'y7',  cameraName: 'Camera Kho Hàng',    zoneType: 'INTRUSION',     detectedAt: '2026-05-05T13:20:00Z' },
    { id: 'y8',  cameraName: 'Camera Bãi Đỗ Xe',   zoneType: 'LOITERING',     detectedAt: '2026-05-05T10:05:00Z' },
    // 2026-05-04 — 4 alerts
    { id: 'd1',  cameraName: 'Camera Cổng Chính',  zoneType: 'INTRUSION',     detectedAt: '2026-05-04T22:30:00Z' },
    { id: 'd2',  cameraName: 'Camera Hành Lang A', zoneType: 'LINE_CROSSING', detectedAt: '2026-05-04T14:15:00Z' },
    { id: 'd3',  cameraName: 'Camera Kho Hàng',    zoneType: 'INTRUSION',     detectedAt: '2026-05-04T09:30:00Z' },
    { id: 'd4',  cameraName: 'Camera Bãi Đỗ Xe',   zoneType: 'LOITERING',     detectedAt: '2026-05-04T07:45:00Z' },
    // 2026-05-03 — 4 alerts
    { id: 'd5',  cameraName: 'Camera Cổng Chính',  zoneType: 'INTRUSION',     detectedAt: '2026-05-03T20:00:00Z' },
    { id: 'd6',  cameraName: 'Camera Kho Hàng',    zoneType: 'INTRUSION',     detectedAt: '2026-05-03T15:30:00Z' },
    { id: 'd7',  cameraName: 'Camera Hành Lang B', zoneType: 'LINE_CROSSING', detectedAt: '2026-05-03T12:00:00Z' },
    { id: 'd8',  cameraName: 'Camera Cổng Chính',  zoneType: 'LOITERING',     detectedAt: '2026-05-03T09:15:00Z' },
    // 2026-05-02 — 3 alerts
    { id: 'd9',  cameraName: 'Camera Bãi Đỗ Xe',   zoneType: 'LOITERING',     detectedAt: '2026-05-02T18:45:00Z' },
    { id: 'd10', cameraName: 'Camera Cổng Chính',  zoneType: 'INTRUSION',     detectedAt: '2026-05-02T14:20:00Z' },
    { id: 'd11', cameraName: 'Camera Kho Hàng',    zoneType: 'INTRUSION',     detectedAt: '2026-05-02T11:00:00Z' },
    // 2026-05-01 — 3 alerts
    { id: 'd12', cameraName: 'Camera Hành Lang A', zoneType: 'LINE_CROSSING', detectedAt: '2026-05-01T22:15:00Z' },
    { id: 'd13', cameraName: 'Camera Cổng Chính',  zoneType: 'INTRUSION',     detectedAt: '2026-05-01T18:30:00Z' },
    { id: 'd14', cameraName: 'Camera Bãi Đỗ Xe',   zoneType: 'LOITERING',     detectedAt: '2026-05-01T10:45:00Z' },
    // 2026-04-30 — 3 alerts
    { id: 'd15', cameraName: 'Camera Kho Hàng',    zoneType: 'INTRUSION',     detectedAt: '2026-04-30T21:00:00Z' },
    { id: 'd16', cameraName: 'Camera Hành Lang B', zoneType: 'LINE_CROSSING', detectedAt: '2026-04-30T16:30:00Z' },
    { id: 'd17', cameraName: 'Camera Cổng Chính',  zoneType: 'INTRUSION',     detectedAt: '2026-04-30T09:00:00Z' },
];

function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

const Dashboard: React.FC = () => {
    const [chartView, setChartView] = useState<'today' | '7d'>('today');

    const today = useMemo(() => new Date(), []);

    const todayStr = useMemo(() => isoDate(today), [today]);

    const yesterdayStr = useMemo(() => {
        const d = new Date(today);
        d.setDate(d.getDate() - 1);
        return isoDate(d);
    }, [today]);

    const todayAlerts = useMemo(
        () => MOCK_ALERTS.filter(a => a.detectedAt.startsWith(todayStr)),
        [todayStr],
    );

    const yesterdayAlerts = useMemo(
        () => MOCK_ALERTS.filter(a => a.detectedAt.startsWith(yesterdayStr)),
        [yesterdayStr],
    );

    // Last 7 days including today
    const last7Days = useMemo(() =>
        Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() - (6 - i));
            const dateStr = isoDate(d);
            return {
                dateStr,
                count: MOCK_ALERTS.filter(a => a.detectedAt.startsWith(dateStr)).length,
                label: i === 6 ? 'Hôm nay' : DAY_SHORT[d.getDay()],
                isToday: i === 6,
            };
        }),
        [today],
    );

    // 24-hour breakdown for today (UTC hours)
    const hourCounts = useMemo(() =>
        Array.from({ length: 24 }, (_, h) => ({
            hour: h,
            count: todayAlerts.filter(a => new Date(a.detectedAt).getUTCHours() === h).length,
        })),
        [todayAlerts],
    );

    const cameraCounts = useMemo(() => {
        const map = new Map<string, number>();
        todayAlerts.forEach(a => map.set(a.cameraName, (map.get(a.cameraName) ?? 0) + 1));
        return [...map.entries()]
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }, [todayAlerts]);

    const zoneCounts = useMemo(() =>
        (Object.keys(ZONE_CONFIG) as ZoneType[]).map(type => ({
            type,
            label: ZONE_CONFIG[type].label,
            color: ZONE_CONFIG[type].color,
            count: todayAlerts.filter(a => a.zoneType === type).length,
        })).sort((a, b) => b.count - a.count),
        [todayAlerts],
    );

    const todayTotal     = todayAlerts.length;
    const yesterdayTotal = yesterdayAlerts.length;
    const todayDelta     = todayTotal - yesterdayTotal;
    const total7d        = last7Days.reduce((s, d) => s + d.count, 0);
    const topCamera      = cameraCounts[0];
    const topZone        = zoneCounts[0];

    const maxHour = Math.max(...hourCounts.map(h => h.count), 1);
    const max7d   = Math.max(...last7Days.map(d => d.count), 1);

    const dateLabel = today.toLocaleDateString('vi-VN', {
        weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
    });

    return (
        <div className={styles.container}>

            {/* ── Header ── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <LayoutDashboard size={18} className={styles.headerIcon} />
                    <h1 className={styles.title}>Dashboard</h1>
                </div>
                <span className={styles.dateBadge}>{dateLabel}</span>
            </div>

            <div className={styles.body}>

                {/* ── Stat cards ── */}
                <div className={styles.statsRow}>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#0c2340' }}>
                            <AlertTriangle size={18} color="#60a5fa" />
                        </div>
                        <div className={styles.statBody}>
                            <span className={styles.statLabel}>Cảnh báo hôm nay</span>
                            <span className={styles.statValue}>{todayTotal}</span>
                            <span className={`${styles.statDelta} ${todayDelta > 0 ? styles.deltaUp : todayDelta < 0 ? styles.deltaDown : styles.deltaNeutral}`}>
                                {todayDelta > 0 ? `+${todayDelta}` : todayDelta} so với hôm qua
                            </span>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#0a2318' }}>
                            <CameraIcon size={18} color="#4ade80" />
                        </div>
                        <div className={styles.statBody}>
                            <span className={styles.statLabel}>Camera nhiều nhất</span>
                            <span className={styles.statValue} style={{ fontSize: '15px' }}>
                                {topCamera?.name ?? '—'}
                            </span>
                            <span className={styles.statSub}>
                                {topCamera ? `${topCamera.count} lần hôm nay` : 'Chưa có dữ liệu'}
                            </span>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#2d1212' }}>
                            <AlertTriangle size={18} color="#f87171" />
                        </div>
                        <div className={styles.statBody}>
                            <span className={styles.statLabel}>Loại phổ biến nhất</span>
                            <span
                                className={styles.statValue}
                                style={{ fontSize: '15px', color: topZone ? ZONE_CONFIG[topZone.type].color : undefined }}
                            >
                                {topZone?.label ?? '—'}
                            </span>
                            <span className={styles.statSub}>
                                {topZone ? `${topZone.count} lần hôm nay` : 'Chưa có dữ liệu'}
                            </span>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#1a1040' }}>
                            <TrendingUp size={18} color="#a78bfa" />
                        </div>
                        <div className={styles.statBody}>
                            <span className={styles.statLabel}>Tổng 7 ngày qua</span>
                            <span className={styles.statValue}>{total7d}</span>
                            <span className={styles.statSub}>
                                ~{(total7d / 7).toFixed(1)} cảnh báo / ngày
                            </span>
                        </div>
                    </div>

                </div>

                {/* ── Chart card ── */}
                <div className={styles.chartCard}>
                    <div className={styles.chartCardHeader}>
                        <span className={styles.chartCardTitle}>
                            <Clock size={14} />
                            {chartView === 'today'
                                ? 'Phân bổ cảnh báo theo giờ — Hôm nay'
                                : 'Cảnh báo 7 ngày qua'}
                        </span>
                        <div className={styles.chartTabs}>
                            <button
                                className={`${styles.chartTab} ${chartView === 'today' ? styles.chartTabActive : ''}`}
                                onClick={() => setChartView('today')}
                            >
                                Hôm nay
                            </button>
                            <button
                                className={`${styles.chartTab} ${chartView === '7d' ? styles.chartTabActive : ''}`}
                                onClick={() => setChartView('7d')}
                            >
                                7 ngày
                            </button>
                        </div>
                    </div>

                    <div className={styles.chartArea}>
                        {chartView === 'today' ? (
                            <div className={styles.barChart}>
                                {hourCounts.map(({ hour, count }) => (
                                    <div key={hour} className={styles.barCol}>
                                        <span className={`${styles.barValue} ${count === 0 ? styles.barValueHidden : ''}`}>
                                            {count > 0 ? count : '·'}
                                        </span>
                                        <div className={styles.barTrack}>
                                            <div
                                                className={styles.bar}
                                                style={{ height: `${(count / maxHour) * 100}%` }}
                                            />
                                        </div>
                                        <span className={styles.barLabel}>
                                            {hour % 4 === 0 ? `${hour}h` : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.barChart7d}>
                                {last7Days.map(({ label, count, isToday, dateStr }) => (
                                    <div key={dateStr} className={styles.barCol}>
                                        <span className={`${styles.barValue} ${count === 0 ? styles.barValueHidden : ''}`}>
                                            {count > 0 ? count : '·'}
                                        </span>
                                        <div className={styles.barTrack}>
                                            <div
                                                className={styles.bar}
                                                style={{
                                                    height: `${(count / max7d) * 100}%`,
                                                    background: isToday ? '#60a5fa' : '#3b82f6',
                                                }}
                                            />
                                        </div>
                                        <span className={`${styles.barLabel} ${isToday ? styles.barLabelToday : ''}`}>
                                            {label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Bottom row ── */}
                <div className={styles.bottomRow}>

                    {/* Camera ranking */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <CameraIcon size={14} />
                            <span>Camera hoạt động nhiều nhất — Hôm nay</span>
                        </div>
                        <div className={styles.rankList}>
                            {cameraCounts.length === 0 ? (
                                <div className={styles.emptyMsg}>Chưa có dữ liệu</div>
                            ) : (
                                cameraCounts.map(({ name, count }, i) => (
                                    <div key={name} className={styles.rankRow}>
                                        <span className={`${styles.rankNum} ${i === 0 ? styles.rankNumTop : ''}`}>
                                            #{i + 1}
                                        </span>
                                        <div className={styles.rankBody}>
                                            <div className={styles.rankTop}>
                                                <span className={styles.rankName}>{name}</span>
                                                <span className={styles.rankCount}>{count}</span>
                                            </div>
                                            <div className={styles.rankBar}>
                                                <div
                                                    className={styles.rankFill}
                                                    style={{
                                                        width: `${(count / (cameraCounts[0].count)) * 100}%`,
                                                        background: i === 0 ? '#3b82f6' : '#1e3a5f',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Zone breakdown */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <AlertTriangle size={14} />
                            <span>Phân loại cảnh báo — Hôm nay</span>
                        </div>
                        <div className={styles.zoneList}>
                            {zoneCounts.map(({ type, label, color, count }) => (
                                <div key={type} className={styles.zoneRow}>
                                    <div className={styles.zoneInfo}>
                                        <span className={styles.zoneDot} style={{ background: color }} />
                                        <span className={styles.zoneLabel}>{label}</span>
                                    </div>
                                    <div className={styles.zoneBar}>
                                        <div
                                            className={styles.zoneFill}
                                            style={{
                                                width: todayTotal > 0 ? `${(count / todayTotal) * 100}%` : '0%',
                                                background: color,
                                            }}
                                        />
                                    </div>
                                    <div className={styles.zoneStats}>
                                        <span className={styles.zoneCount} style={{ color }}>{count}</span>
                                        <span className={styles.zonePct}>
                                            {todayTotal > 0 ? `${Math.round((count / todayTotal) * 100)}%` : '0%'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {todayTotal === 0 && (
                                <div className={styles.emptyMsg}>Chưa có dữ liệu</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
