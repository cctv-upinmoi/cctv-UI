import React, { useState, useEffect } from 'react';
import { LayoutDashboard, AlertTriangle, Camera as CameraIcon, TrendingUp, Clock } from 'lucide-react';
import styles from './Dashboard.module.css';
import * as analyticsService from '../services/analyticsService';
import type { AnalyticsSummaryRes, HourlyCountRes, DailyCountRes, CameraRankRes } from '../services/analyticsService';

const DAY_SHORT: Record<number, string> = {
    0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7',
};

function dayLabel(dateStr: string, isLast: boolean): string {
    if (isLast) return 'Hôm nay';
    const d = new Date(dateStr + 'T00:00:00Z');
    return DAY_SHORT[d.getUTCDay()];
}

const Dashboard: React.FC = () => {
    const [chartView, setChartView] = useState<'today' | '7d'>('today');
    const [summary, setSummary] = useState<AnalyticsSummaryRes | null>(null);
    const [hourly, setHourly] = useState<HourlyCountRes[]>([]);
    const [daily, setDaily] = useState<DailyCountRes[]>([]);
    const [topCameras, setTopCameras] = useState<CameraRankRes[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [s, h, d, c] = await Promise.all([
                    analyticsService.getSummary(),
                    analyticsService.getHourlyToday(),
                    analyticsService.getDailyTrend(7),
                    analyticsService.getTopCameras(10),
                ]);
                setSummary(s.data.data);
                setHourly(h.data.data);
                setDaily(d.data.data);
                setTopCameras(c.data.data);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const todayDelta = summary ? summary.todayTotal - summary.yesterdayTotal : 0;
    const maxHour = Math.max(...hourly.map(h => h.count), 1);
    const max7d = Math.max(...daily.map(d => d.count), 1);
    const avgPerDay = summary ? (summary.total7d / 7).toFixed(1) : '0';

    const dateLabel = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
    });

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>Đang tải dữ liệu...</div>
            </div>
        );
    }

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
                            <span className={styles.statValue}>{summary?.todayTotal ?? 0}</span>
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
                                {summary?.topCameraName ?? '—'}
                            </span>
                            <span className={styles.statSub}>
                                {summary?.topCameraName
                                    ? `${summary.topCameraCount} lần hôm nay`
                                    : 'Chưa có dữ liệu'}
                            </span>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#1a1040' }}>
                            <TrendingUp size={18} color="#a78bfa" />
                        </div>
                        <div className={styles.statBody}>
                            <span className={styles.statLabel}>Tổng 7 ngày qua</span>
                            <span className={styles.statValue}>{summary?.total7d ?? 0}</span>
                            <span className={styles.statSub}>~{avgPerDay} cảnh báo / ngày</span>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#2d1212' }}>
                            <AlertTriangle size={18} color="#f87171" />
                        </div>
                        <div className={styles.statBody}>
                            <span className={styles.statLabel}>Hôm qua</span>
                            <span className={styles.statValue}>{summary?.yesterdayTotal ?? 0}</span>
                            <span className={styles.statSub}>cảnh báo ngày hôm qua</span>
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
                                {hourly.map(({ hour, count }) => (
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
                                {daily.map(({ date, count }, i) => (
                                    <div key={date} className={styles.barCol}>
                                        <span className={`${styles.barValue} ${count === 0 ? styles.barValueHidden : ''}`}>
                                            {count > 0 ? count : '·'}
                                        </span>
                                        <div className={styles.barTrack}>
                                            <div
                                                className={styles.bar}
                                                style={{
                                                    height: `${(count / max7d) * 100}%`,
                                                    background: i === daily.length - 1 ? '#60a5fa' : '#3b82f6',
                                                }}
                                            />
                                        </div>
                                        <span className={`${styles.barLabel} ${i === daily.length - 1 ? styles.barLabelToday : ''}`}>
                                            {dayLabel(date, i === daily.length - 1)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Bottom row ── */}
                <div className={styles.bottomRow}>
                    <div className={`${styles.card} ${styles.cardFull}`}>
                        <div className={styles.cardHeader}>
                            <CameraIcon size={14} />
                            <span>Camera hoạt động nhiều nhất — Hôm nay</span>
                        </div>
                        <div className={styles.rankList}>
                            {topCameras.length === 0 ? (
                                <div className={styles.emptyMsg}>Chưa có dữ liệu</div>
                            ) : (
                                topCameras.map(({ cameraId, cameraName, count }, i) => (
                                    <div key={cameraId} className={styles.rankRow}>
                                        <span className={`${styles.rankNum} ${i === 0 ? styles.rankNumTop : ''}`}>
                                            #{i + 1}
                                        </span>
                                        <div className={styles.rankBody}>
                                            <div className={styles.rankTop}>
                                                <span className={styles.rankName}>{cameraName}</span>
                                                <span className={styles.rankCount}>{count}</span>
                                            </div>
                                            <div className={styles.rankBar}>
                                                <div
                                                    className={styles.rankFill}
                                                    style={{
                                                        width: `${(count / topCameras[0].count) * 100}%`,
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
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
