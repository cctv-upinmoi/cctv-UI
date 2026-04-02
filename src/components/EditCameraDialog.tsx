import React, { useState } from 'react';
import { X, Cctv } from 'lucide-react';
import styles from './NewCameraDialog.module.css';
import { updateCamera } from '../services/cameraService';
import type { CameraRes, UpdateCameraReq } from '../types/camera';

interface EditCameraDialogProps {
    camera: CameraRes;
    onClose: () => void;
    onUpdated: () => void;
}

const EditCameraDialog: React.FC<EditCameraDialogProps> = ({ camera, onClose, onUpdated }) => {
    const [activeTab, setActiveTab] = useState<'General' | 'Connection'>('General');
    const [form, setForm] = useState<UpdateCameraReq>({
        cameraId: camera.id,
        name: camera.name,
        ip: camera.ip,
        port: camera.port,
        username: camera.username,
        pwd: '',
        mode: camera.mode,
        rtspStreamUrl: camera.rtspStreamUrl ?? '',
        latitude: camera.latitude,
        longitude: camera.longitude,
        locationDetail: camera.locationDetail
            ? { ...camera.locationDetail }
            : { address: '', province: '', ward: '', district: '', description: '' },
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const setField = (field: keyof UpdateCameraReq, value: string | number | undefined) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const setLocationField = (field: string, value: string) => {
        setForm(prev => ({
            ...prev,
            locationDetail: { ...prev.locationDetail!, [field]: value },
        }));
    };

    const handleSave = async () => {
        setError(null);
        if (!form.name?.trim()) { setError('Tên camera là bắt buộc.'); setActiveTab('General'); return; }
        if (!form.ip?.trim()) { setError('Địa chỉ IP là bắt buộc.'); setActiveTab('Connection'); return; }
        if (!form.locationDetail?.address?.trim()) { setError('Địa chỉ là bắt buộc.'); setActiveTab('General'); return; }
        if (!form.locationDetail?.province?.trim()) { setError('Tỉnh/Thành phố là bắt buộc.'); setActiveTab('General'); return; }

        const payload: UpdateCameraReq = { ...form };
        if (!payload.pwd?.trim()) delete payload.pwd;

        setLoading(true);
        try {
            await updateCamera(payload);
            onUpdated();
            onClose();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(message || 'Không thể cập nhật camera. Vui lòng thử lại.');
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
                    <div className={styles.title}>Edit Camera</div>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
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
                                <div className={styles.field}>
                                    <label>Name <span className={styles.required}>*</span></label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={form.name ?? ''}
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
                                        value={form.locationDetail?.address ?? ''}
                                        onChange={e => setLocationField('address', e.target.value)}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>Tỉnh/Thành phố <span className={styles.required}>*</span></label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={form.locationDetail?.province ?? ''}
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
                                        value={form.locationDetail?.district ?? ''}
                                        onChange={e => setLocationField('district', e.target.value)}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>Phường/Xã</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={form.locationDetail?.ward ?? ''}
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
                                        value={form.locationDetail?.description ?? ''}
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
                                    <label>Protocol</label>
                                    <select
                                        className={styles.select}
                                        value={form.mode ?? 'RTSP'}
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
                                        value={form.ip ?? ''}
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
                                    <label>Username</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={form.username ?? ''}
                                        onChange={e => setField('username', e.target.value)}
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label>Password <span style={{ color: '#888', fontSize: 11 }}>(để trống nếu không đổi)</span></label>
                                    <input
                                        type="password"
                                        className={styles.input}
                                        value={form.pwd ?? ''}
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
                                        value={form.rtspStreamUrl ?? ''}
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
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? 'Đang lưu...' : 'Save'}
                    </button>
                    <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditCameraDialog;
