import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, Plus, CircleHelp, ShieldCheck, ShieldX, Cctv, User, Pencil, Trash2, MapPin, X, Wifi, WifiOff, LogOut } from 'lucide-react';
import styles from './Home.module.css';
import NewCameraDialog from '../components/NewCameraDialog';
import EditCameraDialog from '../components/EditCameraDialog';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import ZoneEditorDialog from '../components/ZoneEditorDialog';
import IntrusionAlertToast from '../components/IntrusionAlertToast';
import CameraStreamCell from '../components/CameraStreamCell';
import { getAllCameras } from '../services/cameraService';
import { logOut } from '../services/authService';
import { useIntrusionAlert } from '../hooks/useIntrusionAlert';
import type { CameraRes } from '../types/camera';
import type { ApiResponse } from '../types/common';

const GRID_SIZE = 4;

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'Cameras' | 'Sequences'>('Cameras');
    const [controlMode, setControlMode] = useState(false);
    const [isAddCameraOpen, setIsAddCameraOpen] = useState(false);
    const [editingCamera, setEditingCamera] = useState<CameraRes | null>(null);
    const [deletingCamera, setDeletingCamera] = useState<CameraRes | null>(null);
    const [zoneCamera, setZoneCamera] = useState<CameraRes | null>(null);
    const [cameras, setCameras] = useState<CameraRes[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedCameras, setSelectedCameras] = useState<(CameraRes | null)[]>(
        Array(GRID_SIZE).fill(null)
    );

    const { alerts, connected, dismissAlert, clearAll } = useIntrusionAlert();

    const fetchCameras = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAllCameras();
            const body = res.data as ApiResponse<CameraRes[]>;
            setCameras(body.data ?? []);
        } catch {
            // ignore errors silently, list stays empty
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCameras();
    }, [fetchCameras]);

    const filteredCameras = cameras.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.ip.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCameraClick = (camera: CameraRes) => {
        setSelectedCameras(prev => {
            const existingIdx = prev.findIndex(c => c?.id === camera.id);
            if (existingIdx !== -1) {
                // Camera đang active → bỏ ra khỏi grid
                const next = [...prev];
                next[existingIdx] = null;
                return next;
            }
            // Tìm ô trống đầu tiên
            const emptyIdx = prev.findIndex(c => c === null);
            if (emptyIdx === -1) return prev; // grid đầy, bỏ qua
            const next = [...prev];
            next[emptyIdx] = camera;
            return next;
        });
    };

    const removeFromSlot = (slotIdx: number) => {
        setSelectedCameras(prev => {
            const next = [...prev];
            next[slotIdx] = null;
            return next;
        });
    };

    const isCameraActive = (camera: CameraRes) =>
        selectedCameras.some(c => c?.id === camera.id);

    return (
        <div className={styles.container}>
            <IntrusionAlertToast
                alerts={alerts}
                connected={connected}
                onDismiss={dismissAlert}
                onClearAll={clearAll}
            />
            {/* Sidebar */}
            <div className={styles.sidebar}>
                <div className={styles.tabs}>
                    <div
                        className={`${styles.tab} ${activeTab === 'Cameras' ? styles.active : ''}`}
                        onClick={() => setActiveTab('Cameras')}
                    >
                        Cameras
                    </div>
                    <CircleHelp className={styles.helpIcon} size={18} />
                </div>

                <div className={styles.searchSection}>
                    <div className={styles.searchBox}>
                        <Search className={styles.searchBoxIcon} />
                        <input
                            type="text"
                            placeholder="Search"
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <SlidersHorizontal className={styles.filterIcon} size={18} />
                </div>

                <div className={styles.addAction}>
                    <button className={styles.addBtn} onClick={() => setIsAddCameraOpen(true)}>
                        <Plus size={20} />
                    </button>
                </div>

                <div className={styles.cameraList}>
                    {loading && (
                        <div className={styles.loadingText}>Đang tải...</div>
                    )}
                    {!loading && filteredCameras.length === 0 && (
                        <div className={styles.emptyText}>Không có camera</div>
                    )}
                    {filteredCameras.map((camera) => (
                        <div
                            key={camera.id}
                            className={`${styles.cameraItem} ${isCameraActive(camera) ? styles.cameraItemActive : ''}`}
                            onClick={() => handleCameraClick(camera)}
                        >
                            {camera.status === 'OK'
                                ? <ShieldCheck className={styles.statusIcon} size={18} />
                                : <ShieldX className={styles.statusIconNok} size={18} />
                            }
                            <div className={styles.cameraInfo}>
                                <span className={styles.cameraName}>{camera.name}</span>
                                <span className={styles.cameraDesc}>{camera.ip}</span>
                            </div>
                            <div className={styles.cameraActions}>
                                <button
                                    className={styles.actionBtn}
                                    title="Vẽ vùng cấm"
                                    onClick={e => { e.stopPropagation(); setZoneCamera(camera); }}
                                >
                                    <MapPin size={14} />
                                </button>
                                <button
                                    className={styles.actionBtn}
                                    title="Sửa"
                                    onClick={e => { e.stopPropagation(); setEditingCamera(camera); }}
                                >
                                    <Pencil size={14} />
                                </button>
                                <button
                                    className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                                    title="Xóa"
                                    onClick={e => { e.stopPropagation(); setDeletingCamera(camera); }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                <div className={styles.topBar}>
                    <div className={styles.topBarLeft}>
                        <label className={styles.controlModeSwitch}>
                            <div className={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={controlMode}
                                    onChange={(e) => setControlMode(e.target.checked)}
                                />
                                <span className={styles.slider}></span>
                            </div>
                            Control Mode
                        </label>
                    </div>
                    <div className={styles.topBarRight}>
                        <div className={`${styles.statusBadge} ${connected ? styles.statusConnected : styles.statusDisconnected}`}>
                            {connected ? <><Wifi size={12} /> Live</> : <><WifiOff size={12} /> Offline</>}
                        </div>
                        <button className={styles.profileBtn} onClick={() => navigate('/profile')}>
                            <User size={18} />
                            <span>Profile</span>
                        </button>
                        <button className={styles.profileBtn} onClick={logOut}>
                            <LogOut size={18} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>

                <div className={styles.videoGrid}>
                    {selectedCameras.map((camera, idx) => (
                        <div key={idx} className={styles.gridCell}>
                            {camera ? (
                                <>
                                    <div className={styles.streamLabel}>
                                        {camera.name}
                                        <button
                                            className={styles.streamCloseBtn}
                                            onClick={() => removeFromSlot(idx)}
                                            title="Đóng stream"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <CameraStreamCell
                                        cameraName={camera.name}
                                        zones={camera.zones}
                                    />
                                </>
                            ) : (
                                <>
                                    <div className={styles.streamLabel}>Stream {idx + 1}</div>
                                    <div className={styles.placeholder}>
                                        <Cctv className={styles.placeholderIcon} size={32} />
                                        <span className={styles.placeholderText}>Select camera to play stream</span>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Dialogs */}
            {isAddCameraOpen && (
                <NewCameraDialog
                    onClose={() => setIsAddCameraOpen(false)}
                    onCreated={fetchCameras}
                />
            )}
            {editingCamera && (
                <EditCameraDialog
                    camera={editingCamera}
                    onClose={() => setEditingCamera(null)}
                    onUpdated={fetchCameras}
                />
            )}
            {deletingCamera && (
                <DeleteConfirmDialog
                    cameraId={deletingCamera.id}
                    cameraName={deletingCamera.name}
                    onClose={() => setDeletingCamera(null)}
                    onDeleted={fetchCameras}
                />
            )}
            {zoneCamera && (
                <ZoneEditorDialog
                    camera={zoneCamera}
                    onClose={() => setZoneCamera(null)}
                    onSaved={fetchCameras}
                />
            )}
        </div>
    );
};

export default Home;