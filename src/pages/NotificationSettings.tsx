import React, { useCallback, useEffect, useState } from 'react';
import {
    Bell, Plus, Trash2, Pencil, Search, X, Camera, Check,
    Mail, MessageCircle, Briefcase, Users, ChevronDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './NotificationSettings.module.css';
import keycloak from '../configurations/keycloak';
import {
    getPreference, getAllPreferences,
    adminUpsertPreference, adminDeletePreference,
    upsertPreference, deletePreference,
    type SubscriberRequest,
} from '../services/notificationPreferenceService';
import { getAllJobs, createJob, updateJob, deleteJob } from '../services/jobService';
import { getAllCameras } from '../services/cameraService';
import { kcGetUsers } from '../services/keycloakAdminService';
import type { Job, Subscriber } from '../types/notificationPreference';
import type { CameraRes } from '../types/camera';
import type { KcUser } from '../types/keycloakAdmin';

// ── Constants ────────────────────────────────────────────────────────────────

const ALL_ALERT_TYPES = ['INTRUSION', 'NO_HARDHAT', 'NO_SAFETY_VEST', 'NO_MASK'] as const;
const ALL_CHANNELS    = ['EMAIL', 'TELEGRAM'] as const;

type ActiveTab = 'jobs' | 'subscribers';

const isAdminUser = (): boolean => {
    const roles = (keycloak.tokenParsed as { realm_access?: { roles?: string[] } })
        ?.realm_access?.roles ?? [];
    return roles.includes('ADMIN') || roles.includes('CONFIGURATOR');
};

const kcDisplayName = (u: KcUser): string => {
    const full = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
    return full || u.username;
};

// ── Default forms ────────────────────────────────────────────────────────────

const defaultJobForm = (): Omit<Job, 'id'> => ({
    name: '', cameraId: '', cameraName: '', alertTypes: [], enabled: true,
});

const defaultSubscriberForm = (): SubscriberRequest => ({
    userId: '', email: null, telegramChatId: null, channels: [], enabled: true, jobIds: [],
});

// ── Component ─────────────────────────────────────────────────────────────────

const NotificationSettings: React.FC = () => {
    const { t } = useTranslation();
    const admin = isAdminUser();

    const currentUserId   = keycloak.subject ?? '';
    const currentUserName = (keycloak.tokenParsed as { name?: string })?.name
        || (keycloak.tokenParsed as { preferred_username?: string })?.preferred_username || '';
    const currentUserEmail = (keycloak.tokenParsed as { email?: string })?.email || '';

    const [activeTab,    setActiveTab]    = useState<ActiveTab>('jobs');
    const [jobs,         setJobs]         = useState<Job[]>([]);
    const [subscribers,  setSubscribers]  = useState<Subscriber[]>([]);
    const [cameras,      setCameras]      = useState<CameraRes[]>([]);
    const [kcUsers,      setKcUsers]      = useState<KcUser[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [search,       setSearch]       = useState('');

    // ── Job drawer ──────────────────────────────────────────────────
    const [jobDrawer,    setJobDrawer]    = useState(false);
    const [jobForm,      setJobForm]      = useState(defaultJobForm());
    const [editingJob,   setEditingJob]   = useState<Job | null>(null);
    const [jobError,     setJobError]     = useState<string | null>(null);
    const [savingJob,    setSavingJob]    = useState(false);

    // ── Subscriber drawer ───────────────────────────────────────────
    const [subDrawer,    setSubDrawer]    = useState(false);
    const [subForm,      setSubForm]      = useState(defaultSubscriberForm());
    const [editingSub,   setEditingSub]   = useState<Subscriber | null>(null);
    const [subError,     setSubError]     = useState<string | null>(null);
    const [savingSub,    setSavingSub]    = useState(false);
    const [jobDropOpen,  setJobDropOpen]  = useState(false);
    const [jobSearch,    setJobSearch]    = useState('');

    // ── Load ────────────────────────────────────────────────────────
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [jobsRes, camRes] = await Promise.all([
                getAllJobs(),
                getAllCameras(),
            ]);
            setJobs(jobsRes.data?.data ?? []);
            const camData = (camRes.data as { code: number; data: CameraRes[] })?.data;
            if (Array.isArray(camData)) setCameras(camData);

            if (admin) {
                const [subsRes, users] = await Promise.all([
                    getAllPreferences(),
                    kcGetUsers().catch(() => [] as KcUser[]),
                ]);
                setSubscribers(subsRes.data?.data ?? []);
                setKcUsers(users);
            } else {
                const ownRes = await getPreference();
                const sub = ownRes.data?.data;
                setSubscribers(sub ? [sub] : []);
            }
        } finally {
            setLoading(false);
        }
    }, [admin]);

    useEffect(() => { load(); }, [load]);

    // ── Job handlers ────────────────────────────────────────────────

    const openCreateJob = () => {
        setEditingJob(null);
        setJobForm(defaultJobForm());
        setJobError(null);
        setJobDrawer(true);
    };

    const openEditJob = (job: Job) => {
        setEditingJob(job);
        setJobForm({ name: job.name, cameraId: job.cameraId, cameraName: job.cameraName,
                     alertTypes: job.alertTypes, enabled: job.enabled });
        setJobError(null);
        setJobDrawer(true);
    };

    const saveJob = async () => {
        if (!jobForm.name.trim()) { setJobError(t('notificationSettings.errorJobName')); return; }
        if (!jobForm.cameraId)    { setJobError(t('notificationSettings.errorSelectCamera')); return; }
        setSavingJob(true);
        try {
            if (editingJob?.id) {
                const res = await updateJob(editingJob.id, jobForm);
                setJobs(prev => prev.map(j => j.id === editingJob.id ? res.data.data : j));
            } else {
                const res = await createJob(jobForm);
                setJobs(prev => [...prev, res.data.data]);
            }
            setJobDrawer(false);
        } catch { setJobError(t('notificationSettings.saveError')); }
        finally { setSavingJob(false); }
    };

    const handleDeleteJob = async (job: Job) => {
        if (!job.id) return;
        if (!window.confirm(`Xóa job "${job.name}"?`)) return;
        await deleteJob(job.id);
        setJobs(prev => prev.filter(j => j.id !== job.id));
    };

    // ── Subscriber handlers ─────────────────────────────────────────

    const openCreateSub = () => {
        setEditingSub(null);
        setSubForm({ ...defaultSubscriberForm(),
            userId: admin ? '' : currentUserId,
            email: admin ? null : currentUserEmail,
        });
        setSubError(null);
        setSubDrawer(true);
    };

    const openEditSub = (sub: Subscriber) => {
        setEditingSub(sub);
        setSubForm({
            userId: sub.userId ?? '',
            email: sub.email,
            telegramChatId: sub.telegramChatId,
            channels: sub.channels ?? [],
            enabled: sub.enabled,
            jobIds: sub.jobs?.map(j => j.id ?? '') ?? [],
        });
        setSubError(null);
        setSubDrawer(true);
    };

    const saveSub = async () => {
        if (!subForm.channels.length) { setSubError(t('notificationSettings.errorSelectChannel')); return; }
        setSavingSub(true);
        try {
            if (admin) {
                const userId = (editingSub?.userId ?? subForm.userId) ?? '';
                const res = await adminUpsertPreference(userId, subForm);
                const updated = res.data.data;
                setSubscribers(prev => {
                    const idx = prev.findIndex(s => s.userId === updated.userId);
                    return idx >= 0 ? prev.map((s, i) => i === idx ? updated : s) : [...prev, updated];
                });
            } else {
                const res = await upsertPreference(subForm);
                setSubscribers([res.data.data]);
            }
            setSubDrawer(false);
        } catch { setSubError(t('notificationSettings.saveError')); }
        finally { setSavingSub(false); }
    };

    const handleDeleteSub = async (sub: Subscriber) => {
        if (!window.confirm(`Xóa subscriber này?`)) return;
        if (admin && sub.userId) {
            await adminDeletePreference(sub.userId);
            setSubscribers(prev => prev.filter(s => s.userId !== sub.userId));
        } else {
            await deletePreference();
            setSubscribers([]);
        }
    };

    // ── Filter ──────────────────────────────────────────────────────

    const filteredJobs = jobs.filter(j =>
        !search || j.name.toLowerCase().includes(search.toLowerCase())
            || j.cameraName.toLowerCase().includes(search.toLowerCase())
    );

    const filteredSubs = subscribers.filter(s => {
        if (!search) return true;
        const q = search.toLowerCase();
        const name = kcUsers.find(u => u.id === s.userId);
        return (name ? kcDisplayName(name) : s.userId ?? '').toLowerCase().includes(q)
            || (s.email ?? '').toLowerCase().includes(q);
    });

    // ── Render ──────────────────────────────────────────────────────

    return (
        <div className={styles.container}>

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Bell size={18} className={styles.headerIcon} />
                    <h1 className={styles.title}>{t('notificationSettings.title')}</h1>
                </div>
                <div className={styles.headerRight}>
                    <div className={styles.searchBox}>
                        <Search size={13} className={styles.searchIcon} />
                        <input className={styles.searchInput} placeholder={t('notificationSettings.searchPlaceholder')}
                               value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabBar}>
                <button className={`${styles.tab} ${activeTab === 'jobs' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('jobs')}>
                    <Briefcase size={14} /> {t('notificationSettings.tabJobs')}
                    <span className={styles.tabCount}>{jobs.length}</span>
                </button>
                <button className={`${styles.tab} ${activeTab === 'subscribers' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('subscribers')}>
                    <Users size={14} /> {t('notificationSettings.tabSubscribers')}
                    <span className={styles.tabCount}>{subscribers.length}</span>
                </button>
            </div>

            {/* ── JOBS TAB ── */}
            {activeTab === 'jobs' && (
                <div className={styles.tabContent}>
                    <div className={styles.tableActions}>
                        <button className={styles.addBtn} onClick={openCreateJob}>
                            <Plus size={14} /> {t('notificationSettings.newJob')}
                        </button>
                    </div>
                    {loading ? <div className={styles.empty}>{t('common.loading')}</div>
                    : filteredJobs.length === 0 ? <div className={styles.empty}>{t('notificationSettings.noJobs')}</div>
                    : (
                        <table className={styles.table}>
                            <thead><tr>
                                <th>{t('notificationSettings.jobName')}</th>
                                <th>{t('notificationSettings.col.camera')}</th>
                                <th>{t('notificationSettings.alertTypeLabel')}</th>
                                <th>{t('notificationSettings.col.status')}</th>
                                <th />
                            </tr></thead>
                            <tbody>
                            {filteredJobs.map(job => (
                                <tr key={job.id}>
                                    <td><strong>{job.name}</strong></td>
                                    <td>
                                        <span className={styles.camChip}>
                                            <Camera size={12} /> {job.cameraName || job.cameraId}
                                        </span>
                                    </td>
                                    <td>
                                        {job.alertTypes.length === 0
                                            ? <span className={styles.dimText}>{t('notificationSettings.allAlertTypes')}</span>
                                            : job.alertTypes.map(at => (
                                                <span key={at} className={styles.badgeAlert}>
                                                    {t(`notificationSettings.alertType.${at}`, at)}
                                                </span>
                                            ))
                                        }
                                    </td>
                                    <td>
                                        <span className={job.enabled ? styles.badgeOn : styles.badgeOff}>
                                            {job.enabled ? t('notificationSettings.enabled') : t('notificationSettings.disabled')}
                                        </span>
                                    </td>
                                    <td className={styles.actions}>
                                        <button className={styles.iconBtn} onClick={() => openEditJob(job)}>
                                            <Pencil size={14} />
                                        </button>
                                        <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                                onClick={() => handleDeleteJob(job)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ── SUBSCRIBERS TAB ── */}
            {activeTab === 'subscribers' && (
                <div className={styles.tabContent}>
                    <div className={styles.tableActions}>
                        <button className={styles.addBtn} onClick={openCreateSub}>
                            <Plus size={14} /> {t('notificationSettings.newSubscription')}
                        </button>
                    </div>
                    {loading ? <div className={styles.empty}>{t('common.loading')}</div>
                    : filteredSubs.length === 0 ? <div className={styles.empty}>{t('notificationSettings.noSubscriptions')}</div>
                    : (
                        <table className={styles.table}>
                            <thead><tr>
                                <th>{t('notificationSettings.col.subscriber')}</th>
                                <th>{t('notificationSettings.deliveryChannel')}</th>
                                <th>Jobs</th>
                                <th>{t('notificationSettings.col.status')}</th>
                                <th />
                            </tr></thead>
                            <tbody>
                            {filteredSubs.map(sub => {
                                const kcUser = kcUsers.find(u => u.id === sub.userId);
                                const name = kcUser ? kcDisplayName(kcUser)
                                    : sub.userId === currentUserId ? currentUserName : (sub.userId ?? '');
                                return (
                                    <tr key={sub.userId ?? sub.id}>
                                        <td>
                                            <div className={styles.subName}>{name}</div>
                                            <div className={styles.subMeta}>
                                                {sub.email && <span><Mail size={11}/> {sub.email}</span>}
                                                {sub.telegramChatId && <span><MessageCircle size={11}/> {sub.telegramChatId}</span>}
                                            </div>
                                        </td>
                                        <td>
                                            {(sub.channels ?? []).map(ch => (
                                                <span key={ch} className={styles.badge}>
                                                    {ch === 'EMAIL' ? <Mail size={11}/> : <MessageCircle size={11}/>}
                                                    {' '}{t(`notificationSettings.channel.${ch}`, ch)}
                                                </span>
                                            ))}
                                        </td>
                                        <td>
                                            <span className={styles.jobCount}>
                                                {sub.jobs?.length ?? 0} jobs
                                            </span>
                                        </td>
                                        <td>
                                            <span className={sub.enabled ? styles.badgeOn : styles.badgeOff}>
                                                {sub.enabled ? t('notificationSettings.enabled') : t('notificationSettings.disabled')}
                                            </span>
                                        </td>
                                        <td className={styles.actions}>
                                            <button className={styles.iconBtn} onClick={() => openEditSub(sub)}>
                                                <Pencil size={14} />
                                            </button>
                                            <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                                    onClick={() => handleDeleteSub(sub)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* ── JOB DRAWER ── */}
            {jobDrawer && (
                <div className={styles.drawerOverlay} onClick={() => setJobDrawer(false)}>
                    <div className={styles.drawer} onClick={e => e.stopPropagation()}>
                        <div className={styles.drawerHeader}>
                            <span>{editingJob ? t('notificationSettings.editJob') : t('notificationSettings.newJob')}</span>
                            <button className={styles.closeBtn} onClick={() => setJobDrawer(false)}><X size={16}/></button>
                        </div>
                        <div className={styles.drawerBody}>

                            {/* Job name */}
                            <label className={styles.label}>{t('notificationSettings.jobName')}</label>
                            <input className={styles.input}
                                   placeholder="VD: Giám sát cổng vào"
                                   value={jobForm.name}
                                   onChange={e => setJobForm(f => ({ ...f, name: e.target.value }))} />

                            {/* Camera */}
                            <label className={styles.label}>{t('notificationSettings.camera')}</label>
                            <select className={styles.select}
                                    value={jobForm.cameraId}
                                    onChange={e => {
                                        const cam = cameras.find(c => c.id === e.target.value);
                                        setJobForm(f => ({ ...f, cameraId: e.target.value, cameraName: cam?.name ?? '' }));
                                    }}>
                                <option value="">{t('notificationSettings.selectCamera')}</option>
                                {cameras.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            {/* Alert types */}
                            <label className={styles.label}>
                                {t('notificationSettings.alertTypeLabel')}
                                <span className={styles.hint}> {t('notificationSettings.emptyMeansAllAlertTypes')}</span>
                            </label>
                            <div className={styles.chipGroup}>
                                {ALL_ALERT_TYPES.map(at => {
                                    const active = jobForm.alertTypes.includes(at);
                                    return (
                                        <button key={at}
                                                className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                                                onClick={() => setJobForm(f => ({
                                                    ...f,
                                                    alertTypes: active
                                                        ? f.alertTypes.filter(x => x !== at)
                                                        : [...f.alertTypes, at],
                                                }))}>
                                            {active && <Check size={11}/>}
                                            {t(`notificationSettings.alertType.${at}`, at)}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Enabled */}
                            <label className={styles.checkRow}>
                                <input type="checkbox" checked={jobForm.enabled}
                                       onChange={e => setJobForm(f => ({ ...f, enabled: e.target.checked }))} />
                                {t('notificationSettings.enabled')}
                            </label>

                            {jobError && <div className={styles.error}>{jobError}</div>}
                        </div>
                        <div className={styles.drawerFooter}>
                            <button className={styles.cancelBtn} onClick={() => setJobDrawer(false)}>
                                {t('common.cancel')}
                            </button>
                            <button className={styles.saveBtn} onClick={saveJob} disabled={savingJob}>
                                {savingJob ? '...' : t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── SUBSCRIBER DRAWER ── */}
            {subDrawer && (
                <div className={styles.drawerOverlay} onClick={() => setSubDrawer(false)}>
                    <div className={styles.drawer} onClick={e => e.stopPropagation()}>
                        <div className={styles.drawerHeader}>
                            <span>{editingSub ? t('notificationSettings.editTitle') : t('notificationSettings.createTitle')}</span>
                            <button className={styles.closeBtn} onClick={() => setSubDrawer(false)}><X size={16}/></button>
                        </div>
                        <div className={styles.drawerBody}>

                            {/* User (admin only) */}
                            {admin && (
                                <>
                                    <label className={styles.label}>{t('notificationSettings.subscriber')}</label>
                                    <select className={styles.select}
                                            value={subForm.userId ?? ''}
                                            onChange={e => {
                                                const u = kcUsers.find(u => u.id === e.target.value);
                                                setSubForm(f => ({ ...f, userId: e.target.value,
                                                    email: u?.email ?? f.email }));
                                            }}>
                                        <option value="">{t('notificationSettings.selectSubscriber')}</option>
                                        {kcUsers.map(u => (
                                            <option key={u.id} value={u.id}>{kcDisplayName(u)}</option>
                                        ))}
                                    </select>
                                </>
                            )}

                            {/* Jobs multi-select dropdown */}
                            <label className={styles.label}>
                                Jobs <span className={styles.hint}>(chọn jobs muốn nhận thông báo)</span>
                            </label>

                            {/* Selected job tags */}
                            {subForm.jobIds.length > 0 && (
                                <div className={styles.selectedJobTags}>
                                    {subForm.jobIds.map(id => {
                                        const job = jobs.find(j => j.id === id);
                                        return job ? (
                                            <span key={id} className={styles.selectedJobTag}>
                                                <Briefcase size={11}/>
                                                {job.name}
                                                <button className={styles.tagRemove}
                                                        onClick={() => setSubForm(f => ({
                                                            ...f,
                                                            jobIds: f.jobIds.filter(x => x !== id),
                                                        }))}>
                                                    <X size={10}/>
                                                </button>
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            )}

                            {/* Dropdown trigger */}
                            <div className={styles.jobDropdown}>
                                <button type="button"
                                        className={`${styles.jobDropTrigger} ${jobDropOpen ? styles.jobDropTriggerOpen : ''}`}
                                        onClick={() => { setJobDropOpen(v => !v); setJobSearch(''); }}>
                                    <span className={styles.jobDropLabel}>
                                        {subForm.jobIds.length === 0
                                            ? 'Chọn jobs...'
                                            : `${subForm.jobIds.length} job đã chọn`}
                                    </span>
                                    <ChevronDown size={14} className={`${styles.jobDropChevron} ${jobDropOpen ? styles.jobDropChevronUp : ''}`}/>
                                </button>

                                {jobDropOpen && (
                                    <div className={styles.jobDropPanel}>
                                        {/* Search */}
                                        <div className={styles.jobDropSearch}>
                                            <Search size={12} className={styles.jobDropSearchIcon}/>
                                            <input className={styles.jobDropSearchInput}
                                                   placeholder="Tìm job..."
                                                   value={jobSearch}
                                                   onChange={e => setJobSearch(e.target.value)}
                                                   autoFocus/>
                                        </div>

                                        {/* Job options */}
                                        <div className={styles.jobDropOptions}>
                                            {jobs
                                                .filter(j => j.enabled)
                                                .filter(j => !jobSearch || j.name.toLowerCase().includes(jobSearch.toLowerCase()) || j.cameraName.toLowerCase().includes(jobSearch.toLowerCase()))
                                                .map(job => {
                                                    const selected = subForm.jobIds.includes(job.id ?? '');
                                                    return (
                                                        <div key={job.id}
                                                             className={`${styles.jobDropOption} ${selected ? styles.jobDropOptionSelected : ''}`}
                                                             onClick={() => setSubForm(f => ({
                                                                 ...f,
                                                                 jobIds: selected
                                                                     ? f.jobIds.filter(id => id !== job.id)
                                                                     : [...f.jobIds, job.id ?? ''],
                                                             }))}>
                                                            <div className={`${styles.jobDropCheck} ${selected ? styles.jobDropCheckActive : ''}`}>
                                                                {selected && <Check size={11}/>}
                                                            </div>
                                                            <div className={styles.jobDropInfo}>
                                                                <span className={styles.jobDropName}>{job.name}</span>
                                                                <span className={styles.jobDropMeta}>
                                                                    <Camera size={10}/> {job.cameraName}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            {jobs.filter(j => j.enabled).length === 0 && (
                                                <div className={styles.jobDropEmpty}>Chưa có job nào.</div>
                                            )}
                                        </div>

                                        <div className={styles.jobDropFooter}>
                                            <button className={styles.jobDropDone}
                                                    onClick={() => setJobDropOpen(false)}>
                                                Xong
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Channels */}
                            <label className={styles.label}>{t('notificationSettings.deliveryChannel')}</label>
                            <div className={styles.chipGroup}>
                                {ALL_CHANNELS.map(ch => {
                                    const active = subForm.channels.includes(ch);
                                    return (
                                        <button key={ch}
                                                className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                                                onClick={() => setSubForm(f => ({
                                                    ...f,
                                                    channels: active
                                                        ? f.channels.filter(x => x !== ch)
                                                        : [...f.channels, ch],
                                                }))}>
                                            {active && <Check size={11}/>}
                                            {ch === 'EMAIL' ? <><Mail size={11}/> Email</> : <><MessageCircle size={11}/> Telegram</>}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Email */}
                            <label className={styles.label}>{t('notificationSettings.email')}</label>
                            <input className={styles.input} type="email"
                                   placeholder={t('notificationSettings.emailPlaceholder')}
                                   value={subForm.email ?? ''}
                                   onChange={e => setSubForm(f => ({ ...f, email: e.target.value || null }))} />

                            {/* Telegram */}
                            <label className={styles.label}>{t('notificationSettings.telegram')}</label>
                            <input className={styles.input}
                                   placeholder={t('notificationSettings.telegramPlaceholder')}
                                   value={subForm.telegramChatId ?? ''}
                                   onChange={e => setSubForm(f => ({ ...f, telegramChatId: e.target.value || null }))} />

                            {subError && <div className={styles.error}>{subError}</div>}
                        </div>
                        <div className={styles.drawerFooter}>
                            <button className={styles.cancelBtn} onClick={() => setSubDrawer(false)}>
                                {t('common.cancel')}
                            </button>
                            <button className={styles.saveBtn} onClick={saveSub} disabled={savingSub}>
                                {savingSub ? '...' : t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationSettings;
