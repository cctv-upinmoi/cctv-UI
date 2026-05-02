import React, { useState } from 'react';
import { X, Cctv } from 'lucide-react';
import styles from './NewCameraDialog.module.css';
import { addCamera } from '../services/cameraService';
import type { AddCameraReq } from '../types/camera';

interface NewCameraDialogProps {
    onClose: () => void;
    onCreated: () => void;
}

const defaultForm: AddCameraReq = {
    name: '',
    ip: '',
    port: undefined,
    username: '',
    pwd: '',
    mode: 'RTSP',
    rtspStreamUrl: '',
    latitude: undefined,
    longitude: undefined,
    locationDetail: {
        address: '',
        ward: '',
        district: '',
        province: '',
        description: '',
    },
};

const NewCameraDialog: React.FC<NewCameraDialogProps> = ({ onClose, onCreated }) => {
    const [activeTab, setActiveTab] = useState<'General' | 'Connection'>('General');
    const [form, setForm] = useState<AddCameraReq>(defaultForm);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const setField = (field: keyof AddCameraReq, value: string | number | undefined) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const setLocationField = (field: keyof AddCameraReq['locationDetail'], value: string) => {
        setForm(prev => ({
            ...prev,
            locationDetail: { ...prev.locationDetail, [field]: value },
        }));
    };

    const handleCreate = async () => {
        setError(null);
        if (!form.name.trim()) { setError('Tên camera là bắt buộc.'); setActiveTab('General'); return; }
        if (!form.ip.trim()) { setError('Địa chỉ IP là bắt buộc.'); setActiveTab('Connection'); return; }
        if (!form.locationDetail.address.trim()) { setError('Địa chỉ là bắt buộc.'); setActiveTab('General'); return; }
        if (!form.locationDetail.province.trim()) { setError('Tỉnh/Thành phố là bắt buộc.'); setActiveTab('General'); return; }

        setLoading(true);
        try {
            await addCamera(form);
            onCreated();
            onClose();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(message || 'Không thể thêm camera. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.backdrop}>
            <div className={styles.dialog}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerIcon}>
                        <Cctv size={18} />
                    </div>
                    <div className={styles.title}>New Camera</div>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {/* Tabs */}
                    <div className={styles.tabs}>
                        <div
                            className={`${styles.tab} ${activeTab === 'General' ? styles.active : ''}`}
                            onClick={() => setActiveTab('General')}
                        >
                            General
                        </div>
                        <div
                            className={`${styles.tab} ${activeTab === 'Connection' ? styles.active : ''}`}
                            onClick={() => setActiveTab('Connection')}
                        >
                            Connection
                        </div>
                    </div>

                    {error && (
                        <div style={{ color: '#d32f2f', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: '#fff3f3', borderRadius: 4, border: '1px solid #f5c6cb' }}>
                            {error}
                        </div>
                    )}

                    {/* General Tab */}
                    {activeTab === 'General' && (
                        <div className={styles.tabPanel}>
                            <div className={styles.row}>
                                <div className={styles.field} style={{ flex: 1 }}>
                                    <label>Name <span className={styles.required}>*</span></label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={form.name}
                                        onChange={e => setField('name', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={styles.sectionTitle}>Location</div>
                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>Địa chỉ <span className={styles.required}>*</span></label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={form.locationDetail.address}
                                        onChange={e => setLocationField('address', e.target.value)}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>Tỉnh/Thành phố <span className={styles.required}>*</span></label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={form.locationDetail.province}
                                        onChange={e => setLocationField('province', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>Quận/Huyện</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={form.locationDetail.district}
                                        onChange={e => setLocationField('district', e.target.value)}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>Phường/Xã</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={form.locationDetail.ward}
                                        onChange={e => setLocationField('ward', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>Latitude</label>
                                    <input
                                        type="number"
                                        className={styles.input}
                                        value={form.latitude ?? ''}
                                        onChange={e => setField('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>Longitude</label>
                                    <input
                                        type="number"
                                        className={styles.input}
                                        value={form.longitude ?? ''}
                                        onChange={e => setField('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                                    />
                                </div>
                            </div>

                            <div className={styles.sectionTitle}>Mô tả</div>
                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <textarea
                                        className={styles.textarea}
                                        value={form.locationDetail.description}
                                        onChange={e => setLocationField('description', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Connection Tab */}
                    {activeTab === 'Connection' && (
                        <div className={styles.tabPanel}>
                            <div className={styles.row}>
                                <div className={styles.field} style={{ flex: 1, maxWidth: 200 }}>
                                    <label>Protocol <span className={styles.required}>*</span></label>
                                    <select
                                        className={styles.select}
                                        value={form.mode}
                                        onChange={e => setField('mode', e.target.value)}
                                    >
                                        <option value="RTSP">RTSP</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>IP Address <span className={styles.required}>*</span></label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={form.ip}
                                        onChange={e => setField('ip', e.target.value)}
                                    />
                                </div>
                                <div className={styles.field} style={{ flex: 0.4 }}>
                                    <label>Port</label>
                                    <input
                                        type="number"
                                        className={styles.input}
                                        value={form.port ?? ''}
                                        onChange={e => setField('port', e.target.value ? parseInt(e.target.value) : undefined)}
                                    />
                                </div>
                            </div>

                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>Username <span className={styles.required}>*</span></label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={form.username}
                                        onChange={e => setField('username', e.target.value)}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>Password <span className={styles.required}>*</span></label>
                                    <input
                                        type="password"
                                        className={styles.input}
                                        value={form.pwd}
                                        onChange={e => setField('pwd', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>RTSP Stream URL</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="rtsp://..."
                                        value={form.rtspStreamUrl}
                                        onChange={e => setField('rtspStreamUrl', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <button
                        className={`${styles.btn} ${styles.btnCreate}`}
                        onClick={handleCreate}
                        disabled={loading}
                    >
                        {loading ? 'Đang tạo...' : 'Create'}
                    </button>
                    <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewCameraDialog;
