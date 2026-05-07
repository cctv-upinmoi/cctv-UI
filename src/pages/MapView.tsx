import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon, Camera, MapPin, Wifi, WifiOff, Search, X, Layers } from 'lucide-react';
import styles from './MapView.module.css';

type CameraStatus = 'ONLINE' | 'OFFLINE';
type StatusFilter = 'ALL' | 'ONLINE' | 'OFFLINE';

interface CameraLocation {
    id: string;
    name: string;
    status: CameraStatus;
    lat: number;
    lng: number;
    address: string;
    district: string;
    city: string;
    zoneCount: number;
}

// Mock data — GeoJSON coordinates: backend sends [lng, lat], leaflet uses [lat, lng]
const MOCK_CAMERAS: CameraLocation[] = [
    {
        id: 'cam1', name: 'Camera Cổng Chính',
        status: 'ONLINE', lat: 10.7769, lng: 106.7009,
        address: '1 Nguyễn Huệ', district: 'Quận 1', city: 'TP. Hồ Chí Minh', zoneCount: 3,
    },
    {
        id: 'cam2', name: 'Camera Kho Hàng',
        status: 'ONLINE', lat: 10.7241, lng: 106.7212,
        address: '45 Nguyễn Thị Thập', district: 'Quận 7', city: 'TP. Hồ Chí Minh', zoneCount: 2,
    },
    {
        id: 'cam3', name: 'Camera Hành Lang A',
        status: 'ONLINE', lat: 10.7844, lng: 106.6907,
        address: '12 Võ Văn Tần', district: 'Quận 3', city: 'TP. Hồ Chí Minh', zoneCount: 1,
    },
    {
        id: 'cam4', name: 'Camera Bãi Đỗ Xe',
        status: 'OFFLINE', lat: 10.8012, lng: 106.7143,
        address: '88 Xô Viết Nghệ Tĩnh', district: 'Bình Thạnh', city: 'TP. Hồ Chí Minh', zoneCount: 2,
    },
    {
        id: 'cam5', name: 'Camera Hành Lang B',
        status: 'ONLINE', lat: 10.7749, lng: 106.6694,
        address: '230 Lý Thường Kiệt', district: 'Quận 10', city: 'TP. Hồ Chí Minh', zoneCount: 2,
    },
    {
        id: 'cam6', name: 'Camera Cổng Phụ',
        status: 'OFFLINE', lat: 10.7604, lng: 106.7028,
        address: '67 Đoàn Văn Bơ', district: 'Quận 4', city: 'TP. Hồ Chí Minh', zoneCount: 1,
    },
    {
        id: 'cam7', name: 'Camera Khu Kho B',
        status: 'ONLINE', lat: 10.8452, lng: 106.7728,
        address: '14 Võ Văn Ngân', district: 'TP. Thủ Đức', city: 'TP. Hồ Chí Minh', zoneCount: 3,
    },
    {
        id: 'cam8', name: 'Camera Sảnh Chờ',
        status: 'ONLINE', lat: 10.7547, lng: 106.6621,
        address: '190 Nguyễn Trãi', district: 'Quận 5', city: 'TP. Hồ Chí Minh', zoneCount: 1,
    },
];

const MAP_CENTER: [number, number] = [10.7850, 106.7009];
const MAP_ZOOM = 12;

function createCameraIcon(status: CameraStatus, selected: boolean): L.DivIcon {
    const online = status === 'ONLINE';
    const bg  = online ? '#10b981' : '#ef4444';
    const shadow = selected
        ? `0 0 0 3px #3b82f6, 0 0 0 6px rgba(59,130,246,0.25), 0 4px 16px ${bg}90`
        : `0 2px 10px ${bg}70`;

    return L.divIcon({
        className: '',
        html: `<div style="
            width:28px; height:28px; border-radius:50%;
            background:${bg};
            display:flex; align-items:center; justify-content:center;
            border:2px solid rgba(255,255,255,0.25);
            box-shadow:${shadow};
            cursor:pointer;
        ">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="white" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                <circle cx="12" cy="13" r="3"/>
            </svg>
        </div>`,
        iconSize:    [28, 28],
        iconAnchor:  [14, 14],
        popupAnchor: [0, -18],
    });
}

// Flies the map to a position whenever `target` changes
function FlyToMarker({ target }: { target: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (target) map.flyTo(target, 16, { duration: 1.1 });
    }, [target, map]);
    return null;
}

const MapView: React.FC = () => {
    const [search,     setSearch]     = useState('');
    const [filter,     setFilter]     = useState<StatusFilter>('ALL');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [flyTarget,  setFlyTarget]  = useState<[number, number] | null>(null);

    const onlineCount  = MOCK_CAMERAS.filter(c => c.status === 'ONLINE').length;
    const offlineCount = MOCK_CAMERAS.filter(c => c.status === 'OFFLINE').length;

    const filtered = useMemo(() =>
        MOCK_CAMERAS
            .filter(c => filter === 'ALL' || c.status === filter)
            .filter(c =>
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.address.toLowerCase().includes(search.toLowerCase()) ||
                c.district.toLowerCase().includes(search.toLowerCase())
            ),
        [search, filter],
    );

    const handleSidebarClick = (cam: CameraLocation) => {
        setSelectedId(cam.id);
        setFlyTarget([cam.lat, cam.lng]);
    };

    const handleMarkerClick = (cam: CameraLocation) => {
        setSelectedId(cam.id);
    };

    const selected = MOCK_CAMERAS.find(c => c.id === selectedId) ?? null;

    return (
        <div className={styles.container}>

            {/* ── Header ── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <MapIcon size={18} className={styles.headerIcon} />
                    <h1 className={styles.title}>Bản đồ Camera</h1>
                    <span className={styles.totalBadge}>{MOCK_CAMERAS.length} camera</span>
                </div>
                <div className={styles.filterGroup}>
                    {([['ALL', 'Tất cả', MOCK_CAMERAS.length], ['ONLINE', 'Online', onlineCount], ['OFFLINE', 'Offline', offlineCount]] as [StatusFilter, string, number][]).map(
                        ([key, label, count]) => (
                            <button
                                key={key}
                                className={`${styles.filterBtn} ${filter === key ? styles.filterBtnActive : ''}`}
                                onClick={() => setFilter(key)}
                            >
                                {key !== 'ALL' && (
                                    <span
                                        className={styles.statusDot}
                                        style={{ background: key === 'ONLINE' ? '#10b981' : '#ef4444' }}
                                    />
                                )}
                                {label}
                                <span className={styles.filterCount}>{count}</span>
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* ── Body ── */}
            <div className={styles.body}>

                {/* Sidebar */}
                <div className={styles.sidebar}>
                    <div className={styles.searchBox}>
                        <Search size={13} className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder="Tìm camera, địa chỉ..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button className={styles.clearBtn} onClick={() => setSearch('')}>
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    <div className={styles.cameraList}>
                        {filtered.length === 0 ? (
                            <div className={styles.listEmpty}>Không có kết quả</div>
                        ) : (
                            filtered.map(cam => {
                                const online    = cam.status === 'ONLINE';
                                const isSelected = cam.id === selectedId;
                                return (
                                    <div
                                        key={cam.id}
                                        className={`${styles.cameraCard} ${isSelected ? styles.cameraCardActive : ''}`}
                                        onClick={() => handleSidebarClick(cam)}
                                    >
                                        <div className={styles.cardTop}>
                                            <span
                                                className={styles.camStatusDot}
                                                style={{ background: online ? '#10b981' : '#ef4444' }}
                                            />
                                            <span className={styles.camName}>{cam.name}</span>
                                            <span
                                                className={styles.statusBadge}
                                                style={{
                                                    background:  (online ? '#10b981' : '#ef4444') + '1a',
                                                    color:       online ? '#10b981' : '#ef4444',
                                                    borderColor: (online ? '#10b981' : '#ef4444') + '50',
                                                }}
                                            >
                                                {online ? 'Online' : 'Offline'}
                                            </span>
                                        </div>
                                        <div className={styles.cardMeta}>
                                            <MapPin size={11} className={styles.metaIcon} />
                                            <span className={styles.metaText}>
                                                {cam.address}, {cam.district}
                                            </span>
                                        </div>
                                        <div className={styles.cardMeta}>
                                            <Layers size={11} className={styles.metaIcon} />
                                            <span className={styles.metaText}>
                                                {cam.zoneCount} vùng giám sát
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Map */}
                <div className={styles.mapWrapper}>
                    <MapContainer
                        center={MAP_CENTER}
                        zoom={MAP_ZOOM}
                        style={{ width: '100%', height: '100%' }}
                        zoomControl={false}
                    >
                        {/* Dark tile layer — CartoDB Dark Matter */}
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            subdomains="abcd"
                            maxZoom={20}
                        />

                        <FlyToMarker target={flyTarget} />

                        {MOCK_CAMERAS.map(cam => (
                            <Marker
                                key={`${cam.id}-${selectedId === cam.id}`}
                                position={[cam.lat, cam.lng]}
                                icon={createCameraIcon(cam.status, selectedId === cam.id)}
                                eventHandlers={{ click: () => handleMarkerClick(cam) }}
                            >
                                <Popup className={styles.leafletPopup}>
                                    <div className={styles.popup}>
                                        <div className={styles.popupHeader}>
                                            <Camera size={13} />
                                            <span className={styles.popupName}>{cam.name}</span>
                                        </div>
                                        <span
                                            className={styles.popupStatus}
                                            style={{
                                                background:  (cam.status === 'ONLINE' ? '#10b981' : '#ef4444') + '1a',
                                                color:       cam.status === 'ONLINE' ? '#10b981' : '#ef4444',
                                                borderColor: (cam.status === 'ONLINE' ? '#10b981' : '#ef4444') + '50',
                                            }}
                                        >
                                            {cam.status === 'ONLINE'
                                                ? <><Wifi size={10} /> Online</>
                                                : <><WifiOff size={10} /> Offline</>
                                            }
                                        </span>
                                        <div className={styles.popupRow}>
                                            <MapPin size={11} className={styles.popupIcon} />
                                            <span>{cam.address}, {cam.district}, {cam.city}</span>
                                        </div>
                                        <div className={styles.popupRow}>
                                            <Layers size={11} className={styles.popupIcon} />
                                            <span>{cam.zoneCount} vùng giám sát</span>
                                        </div>
                                        <div className={styles.popupRow}>
                                            <span className={styles.popupCoords}>
                                                {cam.lat.toFixed(5)}, {cam.lng.toFixed(5)}
                                            </span>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>

                    {/* Legend */}
                    <div className={styles.legend}>
                        <div className={styles.legendRow}>
                            <span className={styles.legendDot} style={{ background: '#10b981' }} />
                            <span>Online ({onlineCount})</span>
                        </div>
                        <div className={styles.legendRow}>
                            <span className={styles.legendDot} style={{ background: '#ef4444' }} />
                            <span>Offline ({offlineCount})</span>
                        </div>
                    </div>

                    {/* Selected info overlay */}
                    {selected && (
                        <div className={styles.selectedOverlay}>
                            <div className={styles.selectedHeader}>
                                <span className={styles.selectedName}>{selected.name}</span>
                                <button className={styles.closeOverlay} onClick={() => setSelectedId(null)}>
                                    <X size={14} />
                                </button>
                            </div>
                            <div className={styles.selectedCoords}>
                                {selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapView;
