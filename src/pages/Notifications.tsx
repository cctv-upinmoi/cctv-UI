import React, { useState, useMemo } from 'react';
import { Bell, Search, Camera, MapPin, Clock, ChevronRight, X, CheckCheck } from 'lucide-react';
import styles from './Notifications.module.css';

type ZoneType    = 'INTRUSION' | 'LOITERING' | 'LINE_CROSSING';
type ZoneFilter  = 'ALL' | ZoneType;
type StatusFilter = 'ALL' | 'UNREAD' | 'READ';
type DateFilter  = 'ALL' | 'TODAY' | '7D' | '30D' | 'CUSTOM';

interface Notification {
    id: string;
    cameraName: string;
    zoneName: string;
    zoneType: ZoneType;
    confidence: number;
    detectedAt: string; // ISO-8601
    imageUrl: string;
}

const ZONE_CONFIG: Record<ZoneType, { label: string; color: string }> = {
    INTRUSION:     { label: 'Xâm nhập',      color: '#ef4444' },
    LOITERING:     { label: 'Lảng vảng',      color: '#f97316' },
    LINE_CROSSING: { label: 'Vượt ranh giới', color: '#3b82f6' },
};

const ZONE_FILTERS: { key: ZoneFilter; label: string }[] = [
    { key: 'ALL',          label: 'Tất cả' },
    { key: 'INTRUSION',    label: 'Xâm nhập' },
    { key: 'LOITERING',    label: 'Lảng vảng' },
    { key: 'LINE_CROSSING', label: 'Vượt ranh giới' },
];

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
    { key: 'ALL',    label: 'Tất cả' },
    { key: 'TODAY',  label: 'Hôm nay' },
    { key: '7D',     label: '7 ngày' },
    { key: '30D',    label: '30 ngày' },
    { key: 'CUSTOM', label: 'Tùy chọn' },
];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'ALL',    label: 'Tất cả' },
    { key: 'UNREAD', label: 'Chưa đọc' },
    { key: 'READ',   label: 'Đã đọc' },
];

const MOCK: Notification[] = [
    { id: '1',  cameraName: 'Camera Cổng Chính',  zoneName: 'Khu vực hạn chế',    zoneType: 'INTRUSION',     confidence: 0.94, detectedAt: '2026-05-05T21:55:00Z', imageUrl: '/mock-snapshot.jpg' },
    { id: '2',  cameraName: 'Camera Kho Hàng',    zoneName: 'Vùng cấm vào',       zoneType: 'INTRUSION',     confidence: 0.87, detectedAt: '2026-05-05T21:30:00Z', imageUrl: '/mock-snapshot.jpg' },
    { id: '3',  cameraName: 'Camera Hành Lang A', zoneName: 'Ranh giới khu vực',  zoneType: 'LINE_CROSSING', confidence: 0.78, detectedAt: '2026-05-05T20:15:00Z', imageUrl: '/mock-snapshot.jpg' },
    { id: '4',  cameraName: 'Camera Bãi Đỗ Xe',  zoneName: 'Khu vực giám sát',   zoneType: 'LOITERING',     confidence: 0.72, detectedAt: '2026-05-05T19:00:00Z', imageUrl: '/mock-snapshot.jpg' },
    { id: '5',  cameraName: 'Camera Cổng Chính',  zoneName: 'Khu vực hạn chế',    zoneType: 'INTRUSION',     confidence: 0.96, detectedAt: '2026-05-05T17:30:00Z', imageUrl: '/mock-snapshot.jpg' },
    { id: '6',  cameraName: 'Camera Hành Lang B', zoneName: 'Lối đi nội bộ',      zoneType: 'LINE_CROSSING', confidence: 0.81, detectedAt: '2026-05-05T15:45:00Z', imageUrl: '/mock-snapshot.jpg' },
    { id: '7',  cameraName: 'Camera Kho Hàng',    zoneName: 'Vùng cấm vào',       zoneType: 'INTRUSION',     confidence: 0.89, detectedAt: '2026-05-05T13:20:00Z', imageUrl: '/mock-snapshot.jpg' },
    { id: '8',  cameraName: 'Camera Bãi Đỗ Xe',  zoneName: 'Khu vực giám sát',   zoneType: 'LOITERING',     confidence: 0.65, detectedAt: '2026-05-05T10:05:00Z', imageUrl: '/mock-snapshot.jpg' },
    { id: '9',  cameraName: 'Camera Cổng Chính',  zoneName: 'Khu vực hạn chế',    zoneType: 'INTRUSION',     confidence: 0.91, detectedAt: '2026-05-04T22:30:00Z', imageUrl: '/mock-snapshot.jpg' },
    { id: '10', cameraName: 'Camera Hành Lang A', zoneName: 'Ranh giới khu vực',  zoneType: 'LINE_CROSSING', confidence: 0.76, detectedAt: '2026-05-04T14:15:00Z', imageUrl: '/mock-snapshot.jpg' },
    { id: '11', cameraName: 'Camera Kho Hàng',    zoneName: 'Vùng cấm vào',       zoneType: 'INTRUSION',     confidence: 0.83, detectedAt: '2026-05-03T09:30:00Z', imageUrl: '/mock-snapshot.jpg' },
    { id: '12', cameraName: 'Camera Bãi Đỗ Xe',  zoneName: 'Khu vực giám sát',   zoneType: 'LOITERING',     confidence: 0.69, detectedAt: '2026-05-02T16:45:00Z', imageUrl: '/mock-snapshot.jpg' },
];

const INITIALLY_READ = new Set(['9', '10', '11', '12']);

function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

function matchesDate(iso: string, dateFilter: DateFilter, dateFrom: string, dateTo: string): boolean {
    if (dateFilter === 'ALL') return true;
    const t = new Date(iso).getTime();
    const now = Date.now();
    if (dateFilter === 'TODAY') {
        return t >= startOfDay(new Date()).getTime();
    }
    if (dateFilter === '7D') {
        return t >= now - 7 * 24 * 60 * 60 * 1000;
    }
    if (dateFilter === '30D') {
        return t >= now - 30 * 24 * 60 * 60 * 1000;
    }
    if (dateFilter === 'CUSTOM') {
        const from = dateFrom ? new Date(dateFrom).getTime() : -Infinity;
        const to   = dateTo   ? new Date(dateTo).getTime() + 86_400_000 - 1 : Infinity;
        return t >= from && t <= to;
    }
    return true;
}

function formatRelative(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
}

function formatFull(iso: string): string {
    return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
    });
}

function confColor(c: number): string {
    if (c >= 0.9) return '#10b981';
    if (c >= 0.7) return '#f59e0b';
    return '#ef4444';
}

const Notifications: React.FC = () => {
    const [selected,     setSelected]     = useState<Notification | null>(null);
    const [search,       setSearch]       = useState('');
    const [zoneFilter,   setZoneFilter]   = useState<ZoneFilter>('ALL');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [dateFilter,   setDateFilter]   = useState<DateFilter>('ALL');
    const [dateFrom,     setDateFrom]     = useState('');
    const [dateTo,       setDateTo]       = useState('');
    const [reads,        setReads]        = useState<Set<string>>(new Set(INITIALLY_READ));

    const unreadCount = useMemo(() => MOCK.filter(n => !reads.has(n.id)).length, [reads]);

    const filtered = useMemo(() =>
        MOCK
            .filter(n => zoneFilter === 'ALL' || n.zoneType === zoneFilter)
            .filter(n => {
                if (statusFilter === 'UNREAD') return !reads.has(n.id);
                if (statusFilter === 'READ')   return reads.has(n.id);
                return true;
            })
            .filter(n => matchesDate(n.detectedAt, dateFilter, dateFrom, dateTo))
            .filter(n =>
                n.cameraName.toLowerCase().includes(search.toLowerCase()) ||
                n.zoneName.toLowerCase().includes(search.toLowerCase())
            ),
        [search, zoneFilter, statusFilter, dateFilter, dateFrom, dateTo, reads]
    );

    const markRead = (id: string) => setReads(prev => new Set([...prev, id]));

    const markAllRead = () => setReads(new Set(MOCK.map(n => n.id)));

    const handleSelect = (n: Notification) => {
        markRead(n.id);
        setSelected(prev => prev?.id === n.id ? null : n);
    };

    return (
        <div className={styles.container}>

            {/* ── Header ── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Bell size={18} className={styles.headerIcon} />
                    <h1 className={styles.title}>Lịch sử cảnh báo</h1>
                    <span className={styles.totalBadge}>{filtered.length}</span>
                    {unreadCount > 0 && (
                        <span className={styles.unreadBadge}>{unreadCount} chưa đọc</span>
                    )}
                </div>
                <div className={styles.headerRight}>
                    {unreadCount > 0 && (
                        <button className={styles.markAllBtn} onClick={markAllRead}>
                            <CheckCheck size={14} />
                            <span>Đánh dấu tất cả đã đọc</span>
                        </button>
                    )}
                    <div className={styles.searchBox}>
                        <Search size={13} className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder="Tìm camera, vùng..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* ── Zone filter bar ── */}
            <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    {ZONE_FILTERS.map(f => (
                        <button
                            key={f.key}
                            className={`${styles.filterBtn} ${zoneFilter === f.key ? styles.filterBtnActive : ''}`}
                            onClick={() => setZoneFilter(f.key)}
                        >
                            {f.label}
                            {f.key !== 'ALL' && (
                                <span className={styles.filterCount}>
                                    {MOCK.filter(n => n.zoneType === f.key).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Date + Status filter bar ── */}
            <div className={styles.filterBar2}>
                <div className={styles.filterGroup}>
                    {DATE_FILTERS.map(f => (
                        <button
                            key={f.key}
                            className={`${styles.filterBtn} ${dateFilter === f.key ? styles.filterBtnActive : ''}`}
                            onClick={() => setDateFilter(f.key)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className={styles.filterGroup}>
                    {STATUS_FILTERS.map(f => (
                        <button
                            key={f.key}
                            className={`${styles.filterBtn} ${statusFilter === f.key ? styles.filterBtnActive : ''}`}
                            onClick={() => setStatusFilter(f.key)}
                        >
                            {f.key === 'UNREAD' && unreadCount > 0 && (
                                <span className={styles.unreadDotBtn} />
                            )}
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Custom date inputs ── */}
            {dateFilter === 'CUSTOM' && (
                <div className={styles.customDateBar}>
                    <label className={styles.dateLabel}>Từ</label>
                    <input
                        type="date"
                        className={styles.dateInput}
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                    />
                    <label className={styles.dateLabel}>Đến</label>
                    <input
                        type="date"
                        className={styles.dateInput}
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                    />
                    {(dateFrom || dateTo) && (
                        <button
                            className={styles.clearDateBtn}
                            onClick={() => { setDateFrom(''); setDateTo(''); }}
                        >
                            <X size={12} /> Xóa
                        </button>
                    )}
                </div>
            )}

            {/* ── Body ── */}
            <div className={styles.body}>

                {/* List */}
                <div className={styles.list}>
                    {filtered.length === 0 ? (
                        <div className={styles.listEmpty}>Không có kết quả</div>
                    ) : (
                        filtered.map(n => {
                            const cfg      = ZONE_CONFIG[n.zoneType];
                            const isActive = selected?.id === n.id;
                            const isUnread = !reads.has(n.id);
                            return (
                                <div
                                    key={n.id}
                                    className={`${styles.item} ${isActive ? styles.itemActive : ''} ${isUnread ? styles.itemUnread : ''}`}
                                    onClick={() => handleSelect(n)}
                                >
                                    <div className={styles.unreadIndicator}>
                                        {isUnread && <span className={styles.unreadDot} />}
                                    </div>

                                    <img src={n.imageUrl} alt="snapshot" className={styles.thumb} />

                                    <div className={styles.itemBody}>
                                        <div className={styles.itemTop}>
                                            <span className={styles.camName}>{n.cameraName}</span>
                                            <span
                                                className={styles.badge}
                                                style={{
                                                    background:   cfg.color + '1a',
                                                    color:        cfg.color,
                                                    borderColor:  cfg.color + '50',
                                                }}
                                            >
                                                {cfg.label}
                                            </span>
                                        </div>
                                        <div className={styles.itemBottom}>
                                            <span className={styles.zoneName}>{n.zoneName}</span>
                                            <div className={styles.itemMeta}>
                                                <span className={styles.conf} style={{ color: confColor(n.confidence) }}>
                                                    {(n.confidence * 100).toFixed(0)}%
                                                </span>
                                                <span className={styles.time}>{formatRelative(n.detectedAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <ChevronRight
                                        size={14}
                                        className={`${styles.chevron} ${isActive ? styles.chevronActive : ''}`}
                                    />
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Detail panel */}
                {selected ? (
                    <div className={styles.detail}>
                        <div className={styles.detailHeader}>
                            <span className={styles.detailTitle}>Chi tiết cảnh báo</span>
                            <button className={styles.closeBtn} onClick={() => setSelected(null)}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className={styles.detailContent}>
                            <img
                                src={selected.imageUrl}
                                alt="snapshot"
                                className={styles.detailImage}
                            />

                            {/* Type badge */}
                            <div>
                                {(() => {
                                    const cfg = ZONE_CONFIG[selected.zoneType];
                                    return (
                                        <span
                                            className={styles.detailBadge}
                                            style={{
                                                background:  cfg.color + '1a',
                                                color:       cfg.color,
                                                borderColor: cfg.color + '50',
                                            }}
                                        >
                                            {cfg.label}
                                        </span>
                                    );
                                })()}
                            </div>

                            {/* Info rows */}
                            <div className={styles.infoCard}>
                                <div className={styles.infoRow}>
                                    <Camera size={14} className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Camera</span>
                                        <span className={styles.infoValue}>{selected.cameraName}</span>
                                    </div>
                                </div>
                                <div className={styles.infoRow}>
                                    <MapPin size={14} className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Vùng giám sát</span>
                                        <span className={styles.infoValue}>{selected.zoneName}</span>
                                    </div>
                                </div>
                                <div className={styles.infoRow}>
                                    <Clock size={14} className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>Thời gian phát hiện</span>
                                        <span className={styles.infoValue}>{formatFull(selected.detectedAt)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Confidence bar */}
                            <div className={styles.confCard}>
                                <div className={styles.confHeader}>
                                    <span className={styles.confLabel}>Độ tin cậy</span>
                                    <span
                                        className={styles.confValue}
                                        style={{ color: confColor(selected.confidence) }}
                                    >
                                        {(selected.confidence * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <div className={styles.confTrack}>
                                    <div
                                        className={styles.confFill}
                                        style={{
                                            width:      `${selected.confidence * 100}%`,
                                            background: confColor(selected.confidence),
                                        }}
                                    />
                                </div>
                                <span className={styles.confHint}>
                                    {selected.confidence >= 0.9
                                        ? 'Độ chính xác cao'
                                        : selected.confidence >= 0.7
                                            ? 'Độ chính xác trung bình'
                                            : 'Độ chính xác thấp'}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.emptyDetail}>
                        <Bell size={36} className={styles.emptyDetailIcon} />
                        <p>Chọn một cảnh báo để xem chi tiết</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
