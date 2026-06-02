import React, { useCallback, useEffect, useState } from 'react';
import {
    Bell, BellOff, Mail, MessageCircle, Plus, Trash2, X,
    Save, CheckCircle, AlertCircle, ChevronDown, ChevronRight,
    Camera,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './NotificationSettings.module.css';
import {
    getPreference,
    upsertPreference,
    deletePreference,
    togglePreference,
} from '../services/notificationPreferenceService';
import { getAllCameras } from '../services/cameraService';
import type { NotificationPreference, Subscription } from '../types/notificationPreference';
import type { CameraRes } from '../types/camera';

interface NewSubForm {
    cameraId: string;
    cameraName: string;
    zoneNames: string[];
    alertTypes: string[];
    channels: string[];
}

const defaultNewSub = (): NewSubForm => ({
    cameraId: '',
    cameraName: '',
    zoneNames: [],
    alertTypes: ['INTRUSION'],
    channels: [],
});

const toggleItem = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];

const ALERT_TYPES = ['INTRUSION', 'PROXIMITY'];
const CHANNELS = ['EMAIL', 'TELEGRAM'];

const NotificationSettings: React.FC = () => {
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [telegramChatId, setTelegramChatId] = useState('');
    const [enabled, setEnabled] = useState(true);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [cameras, setCameras] = useState<CameraRes[]>([]);
    const [formOpen, setFormOpen] = useState(false);
    const [newSub, setNewSub] = useState<NewSubForm>(defaultNewSub());
    const [formError, setFormError] = useState<string | null>(null);

    const loadPreference = useCallback(async () => {
        try {
            const res = await getPreference();
            console.log('[NotificationSettings] loadPreference raw res.data:', res.data);
            const pref = res.data?.data;
            console.log('[NotificationSettings] pref:', pref);
            if (pref) {
                setEmail(pref.email ?? '');
                setTelegramChatId(pref.telegramChatId ?? '');
                setEnabled(pref.enabled);
                setSubscriptions(pref.subscriptions ?? []);
                console.log('[NotificationSettings] subscriptions loaded:', pref.subscriptions);
            }
        } catch (e) {
            console.warn('[NotificationSettings] loadPreference error (may not exist yet):', e);
        }
    }, []);

    const loadCameras = useCallback(async () => {
        try {
            const res = await getAllCameras();
            const data = (res.data as { code: number; data: CameraRes[] })?.data;
            console.log('[NotificationSettings] loadCameras raw res.data:', res.data);
            console.log('[NotificationSettings] cameras parsed:', data);
            if (Array.isArray(data)) setCameras(data);
            else console.warn('[NotificationSettings] cameras data is not array:', data);
        } catch (e) {
            console.error('[NotificationSettings] loadCameras error:', e);
        }
    }, []);

    useEffect(() => {
        Promise.all([loadPreference(), loadCameras()]).finally(() => setLoading(false));
    }, [loadPreference, loadCameras]);

    const showSuccess = (key: string) => {
        setSuccessMsg(t(key));
        setTimeout(() => setSuccessMsg(null), 3000);
    };

    const handleToggleEnabled = async () => {
        setToggling(true);
        setError(null);
        try {
            const res = await togglePreference();
            if (res.data?.code === 1000) setEnabled(res.data.data.enabled);
        } catch {
            setEnabled(prev => !prev);
        } finally {
            setToggling(false);
        }
    };

    const handleAddSub = () => {
        console.log('[NotificationSettings] handleAddSub called, newSub:', newSub, 'cameras:', cameras.length);
        if (!newSub.cameraId) { setFormError(t('notificationSettings.errorSelectCamera')); return; }
        if (newSub.channels.length === 0) { setFormError(t('notificationSettings.errorSelectChannel')); return; }
        setFormError(null);
        setSubscriptions(prev => {
            const next = [...prev, {
                cameraId: newSub.cameraId,
                cameraName: newSub.cameraName,
                zoneNames: newSub.zoneNames,
                alertTypes: newSub.alertTypes,
                channels: newSub.channels,
            }];
            console.log('[NotificationSettings] subscriptions after add:', next);
            return next;
        });
        setNewSub(defaultNewSub());
        setFormOpen(false);
    };

    const handleRemoveSub = (idx: number) =>
        setSubscriptions(prev => prev.filter((_, i) => i !== idx));

    const handleSave = async () => {
        console.log('[NotificationSettings] handleSave, subscriptions state:', subscriptions);
        setError(null);
        if (subscriptions.some(s => s.channels.includes('EMAIL')) && !email.trim()) {
            setError(t('notificationSettings.errorEmailRequired')); return;
        }
        if (subscriptions.some(s => s.channels.includes('TELEGRAM')) && !telegramChatId.trim()) {
            setError(t('notificationSettings.errorTelegramRequired')); return;
        }
        setSaving(true);
        try {
            const payload: NotificationPreference = {
                email: email.trim() || null,
                telegramChatId: telegramChatId.trim() || null,
                enabled,
                subscriptions,
            };
            console.log('[NotificationSettings] PUT payload:', JSON.stringify(payload));
            await upsertPreference(payload);
            showSuccess('notificationSettings.saveSuccess');
        } catch {
            setError(t('notificationSettings.saveError'));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAll = async () => {
        setDeleting(true);
        setError(null);
        try {
            await deletePreference();
            setEmail(''); setTelegramChatId(''); setEnabled(true); setSubscriptions([]);
            setShowDeleteConfirm(false);
            showSuccess('notificationSettings.deleteSuccess');
        } catch {
            setError(t('notificationSettings.deleteError'));
        } finally {
            setDeleting(false);
        }
    };

    const selectedCamera = cameras.find(c => c.id === newSub.cameraId);
    const cameraZones = selectedCamera?.zones?.map(z => z.name) ?? [];

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingWrap}><p className={styles.loadingText}>{t('common.loading')}</p></div>
            </div>
        );
    }

    return (
        <div className={styles.container}>

            {/* ── Header ── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    {enabled
                        ? <Bell size={22} className={styles.headerIcon} />
                        : <BellOff size={22} className={styles.headerIconMuted} />
                    }
                    <h1 className={styles.title}>{t('notificationSettings.title')}</h1>
                    <span className={enabled ? styles.statusBadgeOn : styles.statusBadgeOff}>
                        {enabled ? t('notificationSettings.statusOn') : t('notificationSettings.statusOff')}
                    </span>
                </div>
                <button
                    className={`${styles.toggleBtn} ${enabled ? styles.toggleBtnOn : styles.toggleBtnOff}`}
                    onClick={handleToggleEnabled}
                    disabled={toggling}
                >
                    <span className={styles.toggleKnob} />
                </button>
            </div>

            <div className={styles.body}>

                {/* ── Banners ── */}
                {successMsg && (
                    <div className={styles.successBanner}>
                        <CheckCircle size={16} /><span>{successMsg}</span>
                    </div>
                )}
                {error && (
                    <div className={styles.errorBanner}>
                        <AlertCircle size={16} /><span>{error}</span>
                        <button className={styles.bannerClose} onClick={() => setError(null)}><X size={14} /></button>
                    </div>
                )}

                {/* ── Contact info ── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('notificationSettings.contactInfo')}</h2>
                    <div className={styles.fieldGroup}>
                        <div className={styles.field}>
                            <label className={styles.label}><Mail size={15} />{t('notificationSettings.email')}</label>
                            <input type="email" className={styles.input} value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder={t('notificationSettings.emailPlaceholder')} />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}><MessageCircle size={15} />{t('notificationSettings.telegram')}</label>
                            <input type="text" className={styles.input} value={telegramChatId}
                                onChange={e => setTelegramChatId(e.target.value)}
                                placeholder={t('notificationSettings.telegramPlaceholder')} />
                            <span className={styles.hint}>{t('notificationSettings.telegramHint')}</span>
                        </div>
                    </div>
                </section>

                {/* ── Subscription list ── */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            {t('notificationSettings.subscriptions')}
                            {subscriptions.length > 0 && (
                                <span className={styles.countBadge}>{subscriptions.length}</span>
                            )}
                        </h2>
                    </div>

                    {subscriptions.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Bell size={32} className={styles.emptyIcon} />
                            <p>{t('notificationSettings.noSubscriptions')}</p>
                        </div>
                    ) : (
                        <div className={styles.subList}>
                            {subscriptions.map((sub, idx) => (
                                <div key={idx} className={styles.subCard}>
                                    <div className={styles.subCardLeft}>
                                        <Camera size={16} className={styles.subCardIcon} />
                                        <div className={styles.subCardBody}>
                                            <div className={styles.subCardTop}>
                                                <span className={styles.subCamera}>{sub.cameraName}</span>
                                                <span className={styles.subZoneSep}>·</span>
                                                <span className={styles.subZone}>
                                                    {sub.zoneNames.length === 0
                                                        ? t('notificationSettings.allZones')
                                                        : sub.zoneNames.join(', ')
                                                    }
                                                </span>
                                            </div>
                                            <div className={styles.subBadges}>
                                                {sub.alertTypes.length === 0
                                                    ? <span className={styles.badgeNeutral}>{t('notificationSettings.allAlerts')}</span>
                                                    : sub.alertTypes.map(a => (
                                                        <span key={a} className={a === 'INTRUSION' ? styles.badgeDanger : styles.badgeWarning}>
                                                            {t(`notificationSettings.alertType.${a}`)}
                                                        </span>
                                                    ))
                                                }
                                                {sub.channels.map(ch => (
                                                    <span key={ch} className={styles.badgeAccent}>
                                                        {t(`notificationSettings.channel.${ch}`)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <button className={styles.removeBtn} onClick={() => handleRemoveSub(idx)}
                                        title={t('notificationSettings.remove')}>
                                        <X size={15} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Add subscription accordion ── */}
                <div className={`${styles.accordion} ${formOpen ? styles.accordionOpen : ''}`}>
                    <button
                        className={styles.accordionHeader}
                        onClick={() => { setFormOpen(p => !p); setError(null); setFormError(null); setNewSub(defaultNewSub()); }}
                    >
                        <span className={styles.accordionHeaderLeft}>
                            <Plus size={16} />
                            {t('notificationSettings.addSubscription')}
                        </span>
                        {formOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {formOpen && (
                        <div className={styles.accordionBody}>
                            <div className={styles.addFormGrid}>

                                {/* Camera */}
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}>{t('notificationSettings.camera')}</label>
                                    <select className={styles.select} value={newSub.cameraId}
                                        onChange={e => {
                                            const cam = cameras.find(c => c.id === e.target.value);
                                            setNewSub(prev => ({
                                                ...prev,
                                                cameraId: e.target.value,
                                                cameraName: cam?.name ?? '',
                                                zoneNames: [],
                                            }));
                                        }}>
                                        <option value="">{t('notificationSettings.selectCamera')}</option>
                                        {cameras.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Zone */}
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}>
                                        {t('notificationSettings.zone')}
                                        <span className={styles.optionalHint}>{t('notificationSettings.emptyMeansAllZones')}</span>
                                    </label>
                                    {!newSub.cameraId && (
                                        <span className={styles.hint}>{t('notificationSettings.selectCameraFirst')}</span>
                                    )}
                                    {newSub.cameraId && cameraZones.length === 0 && (
                                        <span className={styles.hint}>{t('notificationSettings.noZonesConfigured')}</span>
                                    )}
                                    {newSub.cameraId && cameraZones.length > 0 && (
                                        <div className={styles.checkboxGroup}>
                                            {cameraZones.map(z => (
                                                <label key={z} className={styles.checkRow}>
                                                    <input type="checkbox"
                                                        checked={newSub.zoneNames.includes(z)}
                                                        onChange={() => setNewSub(prev => ({
                                                            ...prev,
                                                            zoneNames: toggleItem(prev.zoneNames, z),
                                                        }))} />
                                                    {z}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Alert types */}
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}>
                                        {t('notificationSettings.alertTypes')}
                                        <span className={styles.optionalHint}>{t('notificationSettings.emptyMeansAll')}</span>
                                    </label>
                                    <div className={styles.checkboxGroup}>
                                        {ALERT_TYPES.map(a => (
                                            <label key={a} className={styles.checkRow}>
                                                <input type="checkbox"
                                                    checked={newSub.alertTypes.includes(a)}
                                                    onChange={() => setNewSub(prev => ({
                                                        ...prev,
                                                        alertTypes: toggleItem(prev.alertTypes, a),
                                                    }))} />
                                                {t(`notificationSettings.alertType.${a}`)}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Channels */}
                                <div className={styles.formField}>
                                    <label className={styles.formLabel}>{t('notificationSettings.channels')}</label>
                                    <div className={styles.checkboxGroup}>
                                        {CHANNELS.map(ch => (
                                            <label key={ch} className={styles.checkRow}>
                                                <input type="checkbox"
                                                    checked={newSub.channels.includes(ch)}
                                                    onChange={() => setNewSub(prev => ({
                                                        ...prev,
                                                        channels: toggleItem(prev.channels, ch),
                                                    }))} />
                                                {t(`notificationSettings.channel.${ch}`)}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                            </div>

                            {formError && (
                                <div className={styles.formErrorRow}>
                                    <AlertCircle size={14} />
                                    <span>{formError}</span>
                                </div>
                            )}

                            <div className={styles.addFormActions}>
                                <button className={styles.cancelBtn}
                                    onClick={() => { setFormOpen(false); setError(null); setFormError(null); }}>
                                    {t('common.cancel')}
                                </button>
                                <button className={styles.confirmAddBtn} onClick={handleAddSub}>
                                    <Plus size={15} />
                                    {t('notificationSettings.confirmAdd')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                {error && (
                    <div className={styles.footerError}>
                        <AlertCircle size={14} />
                        <span>{error}</span>
                        <button className={styles.bannerClose} onClick={() => setError(null)}><X size={14} /></button>
                    </div>
                )}
                <div className={styles.footer}>
                    {!showDeleteConfirm ? (
                        <button className={styles.deleteBtn} onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
                            <Trash2 size={16} />{t('notificationSettings.deleteAll')}
                        </button>
                    ) : (
                        <div className={styles.deleteConfirm}>
                            <span>{t('notificationSettings.deleteConfirm')}</span>
                            <button className={styles.confirmDeleteBtn} onClick={handleDeleteAll} disabled={deleting}>
                                {deleting ? t('common.loading') : t('notificationSettings.confirmDeleteYes')}
                            </button>
                            <button className={styles.cancelBtn} onClick={() => setShowDeleteConfirm(false)}>
                                {t('common.cancel')}
                            </button>
                        </div>
                    )}
                    <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                        <Save size={16} />
                        {saving ? t('common.loading') : t('notificationSettings.save')}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default NotificationSettings;
