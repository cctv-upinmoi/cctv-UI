import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, SlidersHorizontal, Plus, CircleHelp, ShieldCheck, ShieldX, Cctv,
    Pencil, Trash2, MapPin, X, Wifi, WifiOff, MoreHorizontal, Square, LayoutGrid, Grid3x3, Video, FileUp,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCameraStatusSSE } from '../hooks/useCameraStatusSSE';
import styles from './Home.module.css';
import NewCameraDialog from '../components/NewCameraDialog';
import EditCameraDialog from '../components/EditCameraDialog';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import ZoneEditorDialog from '../components/ZoneEditorDialog';
import ImportCameraDialog from '../components/ImportCameraDialog';
import IntrusionAlertToast from '../components/IntrusionAlertToast';
import CameraStreamCell from '../components/CameraStreamCell';
import { getAllCameras } from '../services/cameraService';
import { useIntrusionAlertContext } from '../contexts/IntrusionAlertContext';
import { useAuth } from '../hooks/useAuth';
import type { CameraRes } from '../types/camera';
import type { ApiResponse } from '../types/common';

const GRID_PRESETS = [1, 4, 9] as const;
type GridPreset = typeof GRID_PRESETS[number];

const loadGridSize = (): GridPreset => {
    const saved = parseInt(localStorage.getItem('cctv-grid-size') ?? '', 10);
    return (GRID_PRESETS as readonly number[]).includes(saved) ? (saved as GridPreset) : 4;
};

const Home: React.FC = () => {
    const { t } = useTranslation();
    const [isAddCameraOpen, setIsAddCameraOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editingCamera, setEditingCamera] = useState<CameraRes | null>(null);
    const [deletingCamera, setDeletingCamera] = useState<CameraRes | null>(null);
    const [zoneCamera, setZoneCamera] = useState<CameraRes | null>(null);
    const [cameras, setCameras] = useState<CameraRes[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [gridSize, setGridSize] = useState<GridPreset>(loadGridSize);
    const [selectedCameras, setSelectedCameras] = useState<(CameraRes | null)[]>(
        Array(loadGridSize()).fill(null)
    );
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const { alerts, connected, dismissAlert, clearAll } = useIntrusionAlertContext();
    const { canCreateCamera, canImportCamera, canEditCamera, canDeleteCamera, canEditZone } = useAuth();
    const showAddActions = canCreateCamera || canImportCamera;
    const showRowMenu = canEditCamera || canDeleteCamera || canEditZone;

    useEffect(() => {
        if (!openMenuId) return;
        const handle = () => setOpenMenuId(null);
        document.addEventListener('click', handle);
        return () => document.removeEventListener('click', handle);
    }, [openMenuId]);

    const setGridPreset = (size: GridPreset) => {
        setGridSize(size);
        localStorage.setItem('cctv-grid-size', String(size));
        setSelectedCameras(cur => {
            if (size > cur.length) return [...cur, ...Array(size - cur.length).fill(null)];
            return cur.slice(0, size);
        });
    };

    useCameraStatusSSE(({ cameras: updates }) => {
        setCameras(prev => prev.map(cam => {
            const update = updates.find(u => u.id === cam.id);
            return update ? { ...cam, status: update.status } : cam;
        }));
    });

    const fetchCameras = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAllCameras();
            const body = res.data as ApiResponse<CameraRes[]>;
            setCameras(body.data ?? []);
        } catch {
            // ignore errors silently
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
                const next = [...prev];
                next[existingIdx] = null;
                return next;
            }
            const emptyIdx = prev.findIndex(c => c === null);
            if (emptyIdx === -1) return prev;
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

    const gridCols = Math.round(Math.sqrt(gridSize));
    const activeCount = selectedCameras.filter(Boolean).length;

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
                    <div className={`${styles.tab} ${styles.active}`}>
                        {t('home.cameras')}
                    </div>
                    <CircleHelp className={styles.helpIcon} size={18} />
                </div>

                <div className={styles.searchSection}>
                    <div className={styles.searchBox}>
                        <Search className={styles.searchBoxIcon} />
                        <input
                            type="text"
                            placeholder={t('common.search')}
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <SlidersHorizontal className={styles.filterIcon} size={18} />
                </div>

                {showAddActions && (
                    <div className={styles.addAction}>
                        {canCreateCamera && (
                            <button className={styles.addBtnFull} onClick={() => setIsAddCameraOpen(true)}>
                                <Plus size={18} />
                            </button>
                        )}
                        {canImportCamera && (
                            <button className={styles.importBtn} onClick={() => setIsImportOpen(true)}>
                                <FileUp size={15} />
                                {t('home.import')}
                            </button>
                        )}
                    </div>
                )}

                <div className={styles.cameraList}>
                    {loading && (
                        <div className={styles.loadingText}>{t('common.loading')}</div>
                    )}
                    {!loading && filteredCameras.length === 0 && (
                        <div className={styles.emptyText}>{t('home.noCamera')}</div>
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
                            <span className={`${styles.cameraBadge} ${camera.status === 'OK' ? styles.cameraBadgeLive : styles.cameraBadgeOff}`}>
                                {camera.status === 'OK' ? t('home.statusLive') : t('home.statusOff')}
                            </span>
                            {showRowMenu && (
                                <div className={styles.menuWrapper} onClick={e => e.stopPropagation()}>
                                    <button
                                        className={`${styles.menuTriggerBtn} ${openMenuId === camera.id ? styles.menuTriggerBtnActive : ''}`}
                                        onClick={e => {
                                            e.stopPropagation();
                                            setOpenMenuId(openMenuId === camera.id ? null : camera.id);
                                        }}
                                    >
                                        <MoreHorizontal size={16} />
                                    </button>
                                    {openMenuId === camera.id && (
                                        <div className={styles.contextMenu}>
                                            {canEditZone && (
                                                <button
                                                    className={styles.menuItem}
                                                    onClick={() => { setZoneCamera(camera); setOpenMenuId(null); }}
                                                >
                                                    <MapPin size={14} />
                                                    {t('home.addZone')}
                                                </button>
                                            )}
                                            {canEditCamera && (
                                                <button
                                                    className={styles.menuItem}
                                                    onClick={() => { setEditingCamera(camera); setOpenMenuId(null); }}
                                                >
                                                    <Pencil size={14} />
                                                    {t('home.edit')}
                                                </button>
                                            )}
                                            {canDeleteCamera && (
                                                <button
                                                    className={`${styles.menuItem} ${styles.menuItemDelete}`}
                                                    onClick={() => { setDeletingCamera(camera); setOpenMenuId(null); }}
                                                >
                                                    <Trash2 size={14} />
                                                    {t('home.delete')}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                <div className={styles.topBar}>
                    <div className={styles.topBarLeft}>
                        <div className={styles.cameraCount}>
                            <Video size={15} className={styles.cameraCountIcon} />
                            <span>{activeCount} / {gridSize}</span>
                        </div>
                    </div>
                    <div className={styles.topBarRight}>
                        <div className={styles.gridPresets}>
                            {GRID_PRESETS.map(size => (
                                <button
                                    key={size}
                                    className={`${styles.gridPresetBtn} ${gridSize === size ? styles.gridPresetBtnActive : ''}`}
                                    onClick={() => setGridPreset(size)}
                                    title={`${Math.round(Math.sqrt(size))}×${Math.round(Math.sqrt(size))}`}
                                >
                                    {size === 1 && <Square size={15} />}
                                    {size === 4 && <LayoutGrid size={15} />}
                                    {size === 9 && <Grid3x3 size={15} />}
                                </button>
                            ))}
                        </div>
                        <div className={`${styles.statusBadge} ${connected ? styles.statusConnected : styles.statusDisconnected}`}>
                            {connected
                                ? <><Wifi size={12} /> {t('home.connected')}</>
                                : <><WifiOff size={12} /> {t('home.disconnected')}</>
                            }
                        </div>
                    </div>
                </div>

                <div
                    className={styles.videoGrid}
                    style={{
                        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                        gridTemplateRows: `repeat(${gridCols}, 1fr)`,
                    }}
                >
                    {selectedCameras.map((camera, idx) => (
                        <div key={idx} className={styles.gridCell}>
                            {camera ? (
                                <>
                                    <div className={styles.streamLabel}>
                                        {camera.name}
                                        <button
                                            className={styles.streamCloseBtn}
                                            onClick={() => removeFromSlot(idx)}
                                            title={t('common.close')}
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
                                    <div className={styles.streamLabel}>{t('home.stream', { num: idx + 1 })}</div>
                                    <div className={styles.placeholder}>
                                        <Cctv className={styles.placeholderIcon} size={32} />
                                        <span className={styles.placeholderText}>{t('home.selectCamera')}</span>
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
            {isImportOpen && (
                <ImportCameraDialog
                    onClose={() => setIsImportOpen(false)}
                    onImported={fetchCameras}
                />
            )}
        </div>
    );
};

export default Home;
