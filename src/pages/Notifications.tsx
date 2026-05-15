import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Search, Camera, MapPin, Clock, ChevronRight, X, CheckCheck, ChevronLeft, ShieldX, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './Notifications.module.css';
import * as notificationService from '../services/notificationService';
import type { NotificationRes } from '../services/notificationService';
import { useIntrusionAlertContext } from '../contexts/IntrusionAlertContext';

type StatusFilter = 'ALL' | 'UNREAD' | 'READ';
type DateFilter  = 'ALL' | 'TODAY' | '7D' | '30D' | 'CUSTOM';

const PAGE_SIZE = 20;

const ALERT_TYPE_CONFIG = {
    INTRUSION: { color: '#ef4444', Icon: ShieldX,    labelVi: 'Xâm nhập',  labelEn: 'Intrusion' },
    PROXIMITY: { color: '#eab308', Icon: ShieldAlert, labelVi: 'Tiếp cận', labelEn: 'Proximity' },
} as const;

const Notifications: React.FC = () => {
    const { t, i18n } = useTranslation();

    const DATE_FILTERS: { key: DateFilter; label: string }[] = [
        { key: 'ALL',    label: t('common.all') },
        { key: 'TODAY',  label: t('common.today') },
        { key: '7D',     label: t('notifications.sevenDays') },
        { key: '30D',    label: t('notifications.thirtyDays') },
        { key: 'CUSTOM', label: t('notifications.customDate') },
    ];

    const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
        { key: 'ALL',    label: t('common.all') },
        { key: 'UNREAD', label: t('notifications.unreadFilter') },
        { key: 'READ',   label: t('notifications.readFilter') },
    ];

    const formatRelative = (iso: string): string => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60_000);
        if (mins < 1) return t('notifications.justNow');
        if (mins < 60) return t('notifications.minutesAgo', { count: mins });
        const hours = Math.floor(mins / 60);
        if (hours < 24) return t('notifications.hoursAgo', { count: hours });
        return t('notifications.daysAgo', { count: Math.floor(hours / 24) });
    };

    const formatFull = (iso: string): string => {
        const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
        return new Date(iso).toLocaleString(locale, {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false,
        });
    };

    const [items,         setItems]         = useState<NotificationRes[]>([]);
    const [totalPages,    setTotalPages]    = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [page,          setPage]          = useState(0);
    const [loading,       setLoading]       = useState(false);
    const [unreadCount,   setUnreadCount]   = useState(0);
    const { decrementUnread, resetUnread } = useIntrusionAlertContext();
    const [selected,      setSelected]      = useState<NotificationRes | null>(null);
    const [search,        setSearch]        = useState('');
    const [statusFilter,  setStatusFilter]  = useState<StatusFilter>('ALL');
    const [dateFilter,    setDateFilter]    = useState<DateFilter>('ALL');
    const [dateFrom,      setDateFrom]      = useState('');
    const [dateTo,        setDateTo]        = useState('');

    const readParam = statusFilter === 'UNREAD' ? false : statusFilter === 'READ' ? true : undefined;

    const fetchItems = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const res = await notificationService.getNotifications(p, PAGE_SIZE, readParam);
            const data = res.data.data;
            setItems(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    }, [readParam]);

    const fetchUnread = useCallback(async () => {
        try {
            const res = await notificationService.getUnreadCount();
            setUnreadCount(res.data.data);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        setPage(0);
        fetchItems(0);
        fetchUnread();
    }, [statusFilter, fetchItems, fetchUnread]);

    useEffect(() => {
        fetchItems(page);
    }, [page, fetchItems]);

    const filterByDate = (n: NotificationRes) => {
        if (dateFilter === 'ALL') return true;
        const t = new Date(n.detectedAt).getTime();
        const now = Date.now();
        if (dateFilter === 'TODAY') {
            const d = new Date(); d.setHours(0, 0, 0, 0);
            return t >= d.getTime();
        }
        if (dateFilter === '7D') return t >= now - 7 * 86_400_000;
        if (dateFilter === '30D') return t >= now - 30 * 86_400_000;
        if (dateFilter === 'CUSTOM') {
            const from = dateFrom ? new Date(dateFrom).getTime() : -Infinity;
            const to   = dateTo   ? new Date(dateTo).getTime() + 86_400_000 - 1 : Infinity;
            return t >= from && t <= to;
        }
        return true;
    };

    const filtered = items
        .filter(filterByDate)
        .filter(n =>
            n.cameraName.toLowerCase().includes(search.toLowerCase()) ||
            n.zoneName.toLowerCase().includes(search.toLowerCase())
        );

    const handleSelect = async (n: NotificationRes) => {
        setSelected(prev => prev?.id === n.id ? null : n);
        if (!n.read) {
            try {
                await notificationService.markRead(n.id);
                setItems(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                setUnreadCount(prev => Math.max(0, prev - 1));
                decrementUnread();
            } catch { /* ignore */ }
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllRead();
            setItems(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            resetUnread();
        } catch { /* ignore */ }
    };

    return (
        <div className={styles.container}>

            {/* ── Header ── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Bell size={18} className={styles.headerIcon} />
                    <h1 className={styles.title}>{t('notifications.title')}</h1>
                    <span className={styles.totalBadge}>{totalElements}</span>
                    {unreadCount > 0 && (
                        <span className={styles.unreadBadge}>{unreadCount} {t('notifications.unread')}</span>
                    )}
                </div>
                <div className={styles.headerRight}>
                    {unreadCount > 0 && (
                        <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
                            <CheckCheck size={14} />
                            <span>{t('notifications.markAllRead')}</span>
                        </button>
                    )}
                    <div className={styles.searchBox}>
                        <Search size={13} className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder={t('notifications.searchPlaceholder')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
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
                    <label className={styles.dateLabel}>{t('notifications.dateFrom')}</label>
                    <input
                        type="date"
                        className={styles.dateInput}
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                    />
                    <label className={styles.dateLabel}>{t('notifications.dateTo')}</label>
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
                            <X size={12} /> {t('common.clear')}
                        </button>
                    )}
                </div>
            )}

            {/* ── Body ── */}
            <div className={styles.body}>

                {/* List */}
                <div className={styles.list}>
                    {loading ? (
                        <div className={styles.listEmpty}>{t('common.loading')}</div>
                    ) : filtered.length === 0 ? (
                        <div className={styles.listEmpty}>{t('common.noResults')}</div>
                    ) : (
                        <>
                            {filtered.map(n => {
                                const isActive = selected?.id === n.id;
                                return (
                                    <div
                                        key={n.id}
                                        className={`${styles.item} ${isActive ? styles.itemActive : ''} ${!n.read ? styles.itemUnread : ''}`}
                                        onClick={() => handleSelect(n)}
                                    >
                                        <div className={styles.unreadIndicator}>
                                            {!n.read && <span className={styles.unreadDot} />}
                                        </div>

                                        {n.imageUrl ? (
                                            <img src={n.imageUrl} alt="snapshot" className={styles.thumb} />
                                        ) : (
                                            <div className={styles.thumbPlaceholder}>
                                                <Camera size={20} />
                                            </div>
                                        )}

                                        <div className={styles.itemBody}>
                                            <div className={styles.itemTop}>
                                                <span className={styles.camName}>{n.cameraName}</span>
                                                {(() => {
                                                    const cfg = ALERT_TYPE_CONFIG[n.alertType as keyof typeof ALERT_TYPE_CONFIG] ?? ALERT_TYPE_CONFIG.INTRUSION;
                                                    const label = i18n.language === 'vi' ? cfg.labelVi : cfg.labelEn;
                                                    return (
                                                        <span className={styles.badge} style={{ color: cfg.color, borderColor: cfg.color }}>
                                                            {label}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <div className={styles.itemBottom}>
                                                <span className={styles.zoneName}>{n.zoneName}</span>
                                                <span className={styles.time}>{formatRelative(n.detectedAt)}</span>
                                            </div>
                                        </div>

                                        <ChevronRight
                                            size={14}
                                            className={`${styles.chevron} ${isActive ? styles.chevronActive : ''}`}
                                        />
                                    </div>
                                );
                            })}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className={styles.pagination}>
                                    <button
                                        className={styles.pageBtn}
                                        disabled={page === 0}
                                        onClick={() => setPage(p => p - 1)}
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <span className={styles.pageInfo}>
                                        {page + 1} / {totalPages}
                                    </span>
                                    <button
                                        className={styles.pageBtn}
                                        disabled={page >= totalPages - 1}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Detail panel */}
                {selected ? (
                    <div className={styles.detail}>
                        <div className={styles.detailHeader}>
                            <span className={styles.detailTitle}>{t('notifications.detailTitle')}</span>
                            <button className={styles.closeBtn} onClick={() => setSelected(null)}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className={styles.detailContent}>
                            {selected.imageUrl ? (
                                <img src={selected.imageUrl} alt="snapshot" className={styles.detailImage} />
                            ) : (
                                <div className={styles.detailImagePlaceholder}>
                                    <Camera size={48} />
                                    <span>{t('notifications.noImage')}</span>
                                </div>
                            )}

                            {(() => {
                                const cfg = ALERT_TYPE_CONFIG[selected.alertType as keyof typeof ALERT_TYPE_CONFIG] ?? ALERT_TYPE_CONFIG.INTRUSION;
                                const label = i18n.language === 'vi' ? cfg.labelVi : cfg.labelEn;
                                const { Icon } = cfg;
                                return (
                                    <span className={styles.detailBadge} style={{ color: cfg.color, borderColor: cfg.color, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <Icon size={13} />
                                        {label}
                                    </span>
                                );
                            })()}

                            <div className={styles.infoCard}>
                                <div className={styles.infoRow}>
                                    <Camera size={14} className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>{t('notifications.camera')}</span>
                                        <span className={styles.infoValue}>{selected.cameraName}</span>
                                    </div>
                                </div>
                                <div className={styles.infoRow}>
                                    <MapPin size={14} className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>{t('notifications.zone')}</span>
                                        <span className={styles.infoValue}>{selected.zoneName}</span>
                                    </div>
                                </div>
                                <div className={styles.infoRow}>
                                    <Clock size={14} className={styles.infoIcon} />
                                    <div className={styles.infoContent}>
                                        <span className={styles.infoLabel}>{t('notifications.detectedAt')}</span>
                                        <span className={styles.infoValue}>{formatFull(selected.detectedAt)}</span>
                                    </div>
                                </div>
                                {selected.personCount > 0 && (
                                    <div className={styles.infoRow}>
                                        <ShieldAlert size={14} className={styles.infoIcon} />
                                        <div className={styles.infoContent}>
                                            <span className={styles.infoLabel}>{t('notifications.personCount')}</span>
                                            <span className={styles.infoValue}>{selected.personCount}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.emptyDetail}>
                        <Bell size={36} className={styles.emptyDetailIcon} />
                        <p>{t('notifications.selectAlert')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
