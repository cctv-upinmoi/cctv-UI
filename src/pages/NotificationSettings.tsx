import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Bell, Mail, MessageCircle, Plus, Trash2, Pencil,
    Search, ChevronDown, X, Camera, Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './NotificationSettings.module.css';
import keycloak from '../configurations/keycloak';
import {
    getPreference,
    getAllPreferences,
    adminUpsertPreference,
    adminDeletePreference,
    adminToggleSubscription,
    toggleSubscription,
} from '../services/notificationPreferenceService';
import { getAllCameras } from '../services/cameraService';
import { kcGetUsers } from '../services/keycloakAdminService';
import type { NotificationPreference, Subscription, SubscriptionRow } from '../types/notificationPreference';
import type { CameraRes } from '../types/camera';
import type { KcUser } from '../types/keycloakAdmin';

// ── Types ────────────────────────────────────────────────────────────────────

type ChannelMode = 'EMAIL' | 'TELEGRAM' | 'BOTH' | '';

interface DrawerForm {
    userId: string;
    email: string;
    telegramChatId: string;
    cameraId: string;
    cameraName: string;
    zoneNames: string[];
    alertTypes: string[];
    channelMode: ChannelMode;
    subscriptionId: string;
}

const ALL_ALERT_TYPES = ['INTRUSION', 'PROXIMITY'] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

const defaultForm = (): DrawerForm => ({
    userId: '', email: '', telegramChatId: '',
    cameraId: '', cameraName: '', zoneNames: [],
    alertTypes: [], channelMode: '', subscriptionId: '',
});

const channelsToMode = (channels: string[]): ChannelMode => {
    const e = channels.includes('EMAIL');
    const t = channels.includes('TELEGRAM');
    if (e && t) return 'BOTH';
    if (e) return 'EMAIL';
    if (t) return 'TELEGRAM';
    return '';
};

const modeToChannels = (mode: ChannelMode): string[] => {
    if (mode === 'EMAIL') return ['EMAIL'];
    if (mode === 'TELEGRAM') return ['TELEGRAM'];
    if (mode === 'BOTH') return ['EMAIL', 'TELEGRAM'];
    return [];
};

const AVATAR_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];

const avatarColor = (userId: string): string => {
    let h = 0;
    for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) & 0xffffffff;
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const initials = (name: string): string => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase() || '?';
};

const kcDisplayName = (u: KcUser): string => {
    const full = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
    return full || u.username;
};

const isAdminUser = (): boolean => {
    const roles = (keycloak.tokenParsed as { realm_access?: { roles?: string[] } })
        ?.realm_access?.roles ?? [];
    return roles.includes('ADMIN');
};

// ── Component ─────────────────────────────────────────────────────────────────

const NotificationSettings: React.FC = () => {
    const { t } = useTranslation();
    const admin = isAdminUser();

    const currentUserId = keycloak.subject ?? '';
    const currentUserName =
        (keycloak.tokenParsed as { name?: string })?.name ||
        (keycloak.tokenParsed as { preferred_username?: string })?.preferred_username || '';
    const currentUserEmail = (keycloak.tokenParsed as { email?: string })?.email || '';

    // ── Data state ──────────────────────────────────────────────────
    const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
    const [cameras, setCameras] = useState<CameraRes[]>([]);
    const [kcUsers, setKcUsers] = useState<KcUser[]>([]);
    const [loading, setLoading] = useState(true);

    // ── UI state ────────────────────────────────────────────────────
    const [search, setSearch] = useState('');
    const [channelFilter, setChannelFilter] = useState<'ALL' | 'EMAIL' | 'TELEGRAM'>('ALL');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<SubscriptionRow | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SubscriptionRow | null>(null);
    const [form, setForm] = useState<DrawerForm>(defaultForm());
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [toggling, setToggling] = useState<string | null>(null);

    // ── Load data ───────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        try {
            const camRes = await getAllCameras();
            const camData = (camRes.data as { code: number; data: CameraRes[] })?.data;
            if (Array.isArray(camData)) setCameras(camData);

            if (admin) {
                const [allPrefsRes, users] = await Promise.all([
                    getAllPreferences(),
                    kcGetUsers().catch(() => [] as KcUser[]),
                ]);
                setPreferences(allPrefsRes.data?.data ?? []);
                setKcUsers(users);
            } else {
                const ownRes = await getPreference();
                const pref = ownRes.data?.data;
                setPreferences(pref ? [pref] : []);
            }
        } catch (e) {
            console.error('loadData error:', e);
        } finally {
            setLoading(false);
        }
    }, [admin]);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Flatten to rows ─────────────────────────────────────────────
    const rows: SubscriptionRow[] = useMemo(() => {
        const result: SubscriptionRow[] = [];
        for (const pref of preferences) {
            const kcUser = kcUsers.find(u => u.id === pref.userId);
            const subscriberName = kcUser
                ? kcDisplayName(kcUser)
                : pref.userId === currentUserId ? currentUserName : (pref.userId ?? '');
            const subscriberEmail = kcUser?.email
                ?? (pref.userId === currentUserId ? currentUserEmail : '');

            for (const sub of pref.subscriptions) {
                if (!sub.subscriptionId) continue;
                result.push({
                    userId: pref.userId ?? '',
                    subscriberName,
                    subscriberEmail,
                    email: pref.email,
                    telegramChatId: pref.telegramChatId,
                    subscriptionId: sub.subscriptionId,
                    cameraId: sub.cameraId,
                    cameraName: sub.cameraName,
                    zoneNames: sub.zoneNames ?? [],
                    alertTypes: sub.alertTypes ?? [],
                    channels: sub.channels ?? [],
                    enabled: sub.enabled,
                });
            }
        }
        return result;
    }, [preferences, kcUsers, currentUserId, currentUserName, currentUserEmail]);

    const filteredRows = useMemo(() => rows.filter(r => {
        if (search) {
            const q = search.toLowerCase();
            if (!r.subscriberName.toLowerCase().includes(q)
                && !r.subscriberEmail.toLowerCase().includes(q)
                && !r.cameraName.toLowerCase().includes(q)) return false;
        }
        if (channelFilter !== 'ALL' && !r.channels.includes(channelFilter)) return false;
        return true;
    }), [rows, search, channelFilter]);

    const activeCount = rows.filter(r => r.enabled).length;

    // ── Toggle ──────────────────────────────────────────────────────
    const handleToggle = async (row: SubscriptionRow) => {
        setToggling(row.subscriptionId);
        try {
            const res = (admin && row.userId !== currentUserId)
                ? await adminToggleSubscription(row.userId, row.subscriptionId)
                : await toggleSubscription(row.subscriptionId);
            const updated = res.data?.data;
            if (updated) {
                setPreferences(prev => prev.map(p => p.userId === updated.userId ? updated : p));
            }
        } catch (e) {
            console.error('toggle error:', e);
        } finally {
            setToggling(null);
        }
    };

    // ── Drawer ──────────────────────────────────────────────────────
    const openCreate = () => {
        setEditingRow(null);
        setForm(defaultForm());
        setFormError(null);
        setDrawerOpen(true);
    };

    const openEdit = (row: SubscriptionRow) => {
        setEditingRow(row);
        setForm({
            userId: row.userId,
            email: row.email ?? '',
            telegramChatId: row.telegramChatId ?? '',
            cameraId: row.cameraId,
            cameraName: row.cameraName,
            zoneNames: row.zoneNames,
            alertTypes: row.alertTypes,
            channelMode: channelsToMode(row.channels),
            subscriptionId: row.subscriptionId,
        });
        setFormError(null);
        setDrawerOpen(true);
    };

    const closeDrawer = () => { setDrawerOpen(false); setEditingRow(null); };

    const handleSubscriberChange = (userId: string) => {
        const pref = preferences.find(p => p.userId === userId);
        setForm(prev => ({
            ...prev,
            userId,
            email: pref?.email ?? '',
            telegramChatId: pref?.telegramChatId ?? '',
            cameraId: '',
            cameraName: '',
            zoneNames: [],
            alertTypes: [],
        }));
    };

    // ── Save ────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!form.userId) { setFormError(t('notificationSettings.errorSelectSubscriber')); return; }
        if (!form.cameraId) { setFormError(t('notificationSettings.errorSelectCamera')); return; }
        if (!form.channelMode) { setFormError(t('notificationSettings.errorSelectChannel')); return; }

        const needsEmail = form.channelMode === 'EMAIL' || form.channelMode === 'BOTH';
        const needsTelegram = form.channelMode === 'TELEGRAM' || form.channelMode === 'BOTH';
        if (needsEmail && !form.email.trim()) { setFormError(t('notificationSettings.errorEmailRequired')); return; }
        if (needsTelegram && !form.telegramChatId.trim()) { setFormError(t('notificationSettings.errorTelegramRequired')); return; }

        setSaving(true);
        setFormError(null);
        try {
            const existingPref = preferences.find(p => p.userId === form.userId);
            const newSub: Subscription = {
                subscriptionId: form.subscriptionId || undefined,
                cameraId: form.cameraId,
                cameraName: form.cameraName,
                zoneNames: form.zoneNames,
                alertTypes: form.alertTypes,
                channels: modeToChannels(form.channelMode),
                enabled: editingRow?.enabled ?? true,
            };

            const updatedSubs: Subscription[] = editingRow
                ? (existingPref?.subscriptions ?? []).map(s =>
                    s.subscriptionId === form.subscriptionId ? newSub : s)
                : [...(existingPref?.subscriptions ?? []), newSub];

            const payload: NotificationPreference = {
                userId: form.userId,
                email: needsEmail ? form.email.trim() : (existingPref?.email ?? null),
                telegramChatId: needsTelegram ? form.telegramChatId.trim() : (existingPref?.telegramChatId ?? null),
                enabled: existingPref?.enabled ?? true,
                subscriptions: updatedSubs,
            };

            const res = await adminUpsertPreference(form.userId, payload);
            const updated = res.data?.data;
            if (updated) {
                setPreferences(prev => {
                    const exists = prev.some(p => p.userId === updated.userId);
                    return exists
                        ? prev.map(p => p.userId === updated.userId ? updated : p)
                        : [...prev, updated];
                });
            }
            closeDrawer();
        } catch (e) {
            console.error('save error:', e);
            setFormError(t('notificationSettings.saveError'));
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ──────────────────────────────────────────────────────
    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        try {
            const pref = preferences.find(p => p.userId === deleteTarget.userId);
            if (!pref) return;

            const updatedSubs = pref.subscriptions.filter(
                s => s.subscriptionId !== deleteTarget.subscriptionId
            );

            if (updatedSubs.length === 0) {
                await adminDeletePreference(deleteTarget.userId);
                setPreferences(prev => prev.filter(p => p.userId !== deleteTarget.userId));
            } else {
                const res = await adminUpsertPreference(deleteTarget.userId, { ...pref, subscriptions: updatedSubs });
                const updated = res.data?.data;
                if (updated) setPreferences(prev => prev.map(p => p.userId === updated.userId ? updated : p));
            }
        } catch (e) {
            console.error('delete error:', e);
        } finally {
            setDeleteTarget(null);
        }
    };

    // ── Derived ─────────────────────────────────────────────────────
    const selectedCamera = cameras.find(c => c.id === form.cameraId);
    const cameraZones = selectedCamera?.zones?.map((z: { name: string }) => z.name) ?? [];

    // ── Render ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingWrap}><p>{t('common.loading')}</p></div>
            </div>
        );
    }

    return (
        <div className={styles.page}>

            {/* ── Header ─────────────────────────────────────── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Bell size={20} className={styles.headerIcon} />
                    <h1 className={styles.title}>{t('notificationSettings.title')}</h1>
                    <span className={styles.tabPill}>{t('notificationSettings.allSubscriptions')}</span>
                </div>
                {admin && (
                    <button className={styles.newBtn} onClick={openCreate}>
                        <Plus size={15} />
                        {t('notificationSettings.newSubscription')}
                    </button>
                )}
            </div>

            {/* ── Toolbar ────────────────────────────────────── */}
            <div className={styles.toolbar}>
                <div className={styles.statsPills}>
                    <span className={styles.statPill}>
                        <strong>{rows.length}</strong>&nbsp;{t('notificationSettings.subscriptions')}
                    </span>
                    <span className={styles.statPill}>
                        <strong>{activeCount}</strong>&nbsp;{t('notificationSettings.active')}
                    </span>
                </div>
                <div className={styles.toolbarRight}>
                    <div className={styles.searchWrap}>
                        <Search size={14} className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder={t('notificationSettings.searchPlaceholder')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className={styles.filterWrap}>
                        <select
                            className={styles.filterSelect}
                            value={channelFilter}
                            onChange={e => setChannelFilter(e.target.value as typeof channelFilter)}
                        >
                            <option value="ALL">{t('notificationSettings.allChannels')}</option>
                            <option value="EMAIL">{t('notificationSettings.channel.EMAIL')}</option>
                            <option value="TELEGRAM">{t('notificationSettings.channel.TELEGRAM')}</option>
                        </select>
                        <ChevronDown size={13} className={styles.filterChevron} />
                    </div>
                </div>
            </div>

            {/* ── Table ──────────────────────────────────────── */}
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {admin && <th>{t('notificationSettings.col.subscriber')}</th>}
                            <th>{t('notificationSettings.col.camera')}</th>
                            <th>{t('notificationSettings.col.zone')}</th>
                            <th>{t('notificationSettings.col.alertType')}</th>
                            <th>{t('notificationSettings.col.channel')}</th>
                            <th>{t('notificationSettings.col.status')}</th>
                            {admin && <th />}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.length === 0 ? (
                            <tr>
                                <td colSpan={admin ? 7 : 5} className={styles.emptyCell}>
                                    <Bell size={30} className={styles.emptyIcon} />
                                    <p>{t('notificationSettings.noSubscriptions')}</p>
                                </td>
                            </tr>
                        ) : filteredRows.map(row => {
                            const cam = cameras.find(c => c.id === row.cameraId);
                            const camOnline = cam?.status === 'OK';
                            return (
                                <tr key={row.subscriptionId} className={styles.tr}>
                                    {admin && (
                                        <td>
                                            <div className={styles.subscriber}>
                                                <span
                                                    className={styles.avatar}
                                                    style={{ background: avatarColor(row.userId) }}
                                                >
                                                    {initials(row.subscriberName || row.userId)}
                                                </span>
                                                <div>
                                                    <div className={styles.subName}>{row.subscriberName}</div>
                                                    <div className={styles.subEmail}>{row.subscriberEmail}</div>
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                    <td>
                                        <div className={styles.cameraCell}>
                                            <span className={camOnline ? styles.dotOnline : styles.dotOffline} />
                                            <div>
                                                <div className={styles.cameraName}>{row.cameraName}</div>
                                                <div className={styles.cameraAddr}>{row.cameraId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {row.zoneNames.length === 0 ? (
                                            <span className={styles.badgeNeutral}>
                                                {t('notificationSettings.allZones')}
                                            </span>
                                        ) : (
                                            <div className={styles.zoneBadges}>
                                                {row.zoneNames.map(z => (
                                                    <span key={z} className={styles.badgeZone}>{z}</span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {row.alertTypes.length === 0 ? (
                                            <span className={styles.badgeNeutral}>
                                                {t('notificationSettings.allAlertTypes')}
                                            </span>
                                        ) : (
                                            <div className={styles.zoneBadges}>
                                                {row.alertTypes.map(at => (
                                                    <span key={at} className={styles.badgeAlert}>
                                                        {t(`notificationSettings.alertType.${at}`)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div className={styles.channelBadges}>
                                            {row.channels.includes('EMAIL') && (
                                                <span className={styles.badgeEmail}>
                                                    <Mail size={11} />{t('notificationSettings.channel.EMAIL')}
                                                </span>
                                            )}
                                            {row.channels.includes('TELEGRAM') && (
                                                <span className={styles.badgeTelegram}>
                                                    <MessageCircle size={11} />{t('notificationSettings.channel.TELEGRAM')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            className={`${styles.toggle} ${row.enabled ? styles.toggleOn : styles.toggleOff}`}
                                            onClick={() => handleToggle(row)}
                                            disabled={toggling === row.subscriptionId}
                                            aria-label="toggle subscription"
                                        >
                                            <span className={styles.toggleKnob} />
                                        </button>
                                    </td>
                                    {admin && (
                                        <td>
                                            <div className={styles.actions}>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={() => openEdit(row)}
                                                    title={t('common.edit')}
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    className={styles.actionBtnDanger}
                                                    onClick={() => setDeleteTarget(row)}
                                                    title={t('common.delete')}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── Subscription Drawer ─────────────────────── */}
            {drawerOpen && (
                <div className={styles.overlay} onClick={closeDrawer}>
                    <div className={styles.drawer} onClick={e => e.stopPropagation()}>

                        <div className={styles.drawerHeader}>
                            <div className={styles.drawerHeaderLeft}>
                                <span className={styles.drawerIconWrap}><Bell size={17} /></span>
                                <div>
                                    <div className={styles.drawerTitle}>
                                        {editingRow
                                            ? t('notificationSettings.editTitle')
                                            : t('notificationSettings.createTitle')}
                                    </div>
                                    <div className={styles.drawerSub}>
                                        {editingRow
                                            ? t('notificationSettings.editSubtitle')
                                            : t('notificationSettings.newSubscription')}
                                    </div>
                                </div>
                            </div>
                            <button className={styles.drawerClose} onClick={closeDrawer}>
                                <X size={17} />
                            </button>
                        </div>

                        <div className={styles.drawerBody}>

                            {/* Subscriber */}
                            <div className={styles.fGroup}>
                                <label className={styles.fLabel}>
                                    {t('notificationSettings.subscriber')}
                                </label>
                                <div className={styles.selectWrap}>
                                    <select
                                        className={styles.fSelect}
                                        value={form.userId}
                                        onChange={e => handleSubscriberChange(e.target.value)}
                                    >
                                        <option value="">{t('notificationSettings.selectSubscriber')}</option>
                                        {kcUsers.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {kcDisplayName(u)} — {u.email ?? u.username}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={13} className={styles.selectChevron} />
                                </div>
                            </div>

                            {/* Camera */}
                            <div className={styles.fGroup}>
                                <label className={styles.fLabel}>
                                    <Camera size={13} style={{ marginRight: 5 }} />
                                    {t('notificationSettings.camera')}
                                </label>
                                <div className={styles.selectWrap}>
                                    <select
                                        className={styles.fSelect}
                                        value={form.cameraId}
                                        onChange={e => {
                                            const cam = cameras.find(c => c.id === e.target.value);
                                            setForm(prev => ({
                                                ...prev,
                                                cameraId: e.target.value,
                                                cameraName: cam?.name ?? '',
                                                zoneNames: [],
                                            }));
                                        }}
                                    >
                                        <option value="">{t('notificationSettings.selectCamera')}</option>
                                        {cameras.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={13} className={styles.selectChevron} />
                                </div>
                            </div>

                            {/* Zones */}
                            <div className={styles.fGroup}>
                                <label className={styles.fLabel}>
                                    {t('notificationSettings.zone')}
                                    <span className={styles.optTag}>{t('notificationSettings.emptyMeansAllZones')}</span>
                                </label>
                                {!form.cameraId && (
                                    <p className={styles.hint}>{t('notificationSettings.selectCameraFirst')}</p>
                                )}
                                {form.cameraId && cameraZones.length === 0 && (
                                    <p className={styles.hint}>{t('notificationSettings.noZonesConfigured')}</p>
                                )}
                                {form.cameraId && cameraZones.length > 0 && (
                                    <div className={styles.zoneGrid}>
                                        {cameraZones.map(z => {
                                            const active = form.zoneNames.includes(z);
                                            return (
                                                <label
                                                    key={z}
                                                    className={`${styles.zoneChip} ${active ? styles.zoneChipActive : ''}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={active}
                                                        onChange={() => setForm(prev => ({
                                                            ...prev,
                                                            zoneNames: active
                                                                ? prev.zoneNames.filter(x => x !== z)
                                                                : [...prev.zoneNames, z],
                                                        }))}
                                                    />
                                                    {z}
                                                    {active && <Check size={11} />}
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Alert types */}
                            <div className={styles.fGroup}>
                                <label className={styles.fLabel}>
                                    {t('notificationSettings.alertTypeLabel')}
                                    <span className={styles.optTag}>{t('notificationSettings.emptyMeansAllAlertTypes')}</span>
                                </label>
                                <div className={styles.zoneGrid}>
                                    {ALL_ALERT_TYPES.map(at => {
                                        const active = form.alertTypes.includes(at);
                                        return (
                                            <label
                                                key={at}
                                                className={`${styles.zoneChip} ${active ? styles.zoneChipActive : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={active}
                                                    onChange={() => setForm(prev => ({
                                                        ...prev,
                                                        alertTypes: active
                                                            ? prev.alertTypes.filter(x => x !== at)
                                                            : [...prev.alertTypes, at],
                                                    }))}
                                                />
                                                {t(`notificationSettings.alertType.${at}`)}
                                                {active && <Check size={11} />}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Contact inputs — always visible */}
                            <div className={styles.fGroup}>
                                <label className={styles.fLabel}>
                                    <Mail size={13} style={{ marginRight: 5 }} />
                                    {t('notificationSettings.email')}
                                </label>
                                <input
                                    type="email"
                                    className={styles.fInput}
                                    value={form.email}
                                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder={t('notificationSettings.emailPlaceholder')}
                                />
                            </div>
                            <div className={styles.fGroup}>
                                <label className={styles.fLabel}>
                                    <MessageCircle size={13} style={{ marginRight: 5 }} />
                                    {t('notificationSettings.telegram')}
                                </label>
                                <input
                                    type="text"
                                    className={styles.fInput}
                                    value={form.telegramChatId}
                                    onChange={e => setForm(prev => ({ ...prev, telegramChatId: e.target.value }))}
                                    placeholder={t('notificationSettings.telegramPlaceholder')}
                                />
                            </div>

                            {/* Delivery channel */}
                            <div className={styles.fGroup}>
                                <label className={styles.fLabel}>
                                    <Bell size={13} style={{ marginRight: 5 }} />
                                    {t('notificationSettings.deliveryChannel')}
                                </label>
                                <div className={styles.channelCards}>
                                    {(['EMAIL', 'TELEGRAM', 'BOTH'] as const).map(mode => (
                                        <label
                                            key={mode}
                                            className={`${styles.channelCard} ${form.channelMode === mode ? styles.channelCardActive : ''}`}
                                            onClick={() => setForm(prev => ({ ...prev, channelMode: mode }))}
                                        >
                                            <span className={styles.chCardIcon}>
                                                {mode === 'EMAIL'
                                                    ? <Mail size={17} />
                                                    : mode === 'TELEGRAM'
                                                        ? <MessageCircle size={17} />
                                                        : <Bell size={17} />}
                                            </span>
                                            <div className={styles.chCardInfo}>
                                                <div className={styles.chCardName}>
                                                    {t(`notificationSettings.channelMode.${mode}`)}
                                                </div>
                                                <div className={styles.chCardSub}>
                                                    {mode === 'BOTH'
                                                        ? t('notificationSettings.channelMode.BOTH_SUB')
                                                        : mode === 'EMAIL'
                                                            ? t('notificationSettings.channelMode.EMAIL')
                                                            : t('notificationSettings.channelMode.TELEGRAM')}
                                                </div>
                                            </div>
                                            <span className={`${styles.chRadio} ${form.channelMode === mode ? styles.chRadioActive : ''}`} />
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {formError && <div className={styles.fError}>{formError}</div>}

                        </div>

                        <div className={styles.drawerFooter}>
                            <button className={styles.cancelBtn} onClick={closeDrawer}>
                                {t('common.cancel')}
                            </button>
                            <button className={styles.createBtn} onClick={handleSave} disabled={saving}>
                                <Plus size={14} />
                                {saving
                                    ? t('common.loading')
                                    : editingRow
                                        ? t('notificationSettings.saveBtn')
                                        : t('notificationSettings.createBtn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm ──────────────────────────── */}
            {deleteTarget && (
                <div className={styles.overlay} onClick={() => setDeleteTarget(null)}>
                    <div className={styles.confirmDialog} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.confirmTitle}>
                            {t('notificationSettings.deleteConfirmTitle')}
                        </h3>
                        <p className={styles.confirmBody}>
                            {t('notificationSettings.deleteConfirmBody', {
                                camera: deleteTarget.cameraName,
                                user: deleteTarget.subscriberName,
                            })}
                        </p>
                        <div className={styles.confirmActions}>
                            <button className={styles.cancelBtn} onClick={() => setDeleteTarget(null)}>
                                {t('common.cancel')}
                            </button>
                            <button className={styles.deleteBtn} onClick={handleDeleteConfirm}>
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default NotificationSettings;
