import React, { useState } from 'react';
import { Search, SlidersHorizontal, Plus, CircleHelp, ShieldCheck, Cctv } from 'lucide-react';
import styles from './Home.module.css';

const cameras = [
    { id: 1, name: 'Cam1', desc: 'NTCIP Ext RTSP' },
    { id: 2, name: 'Cam2', desc: 'MJPEG Ext' },
    { id: 3, name: 'Cam3', desc: 'RTSP Ext' },
    { id: 4, name: 'Cam4', desc: 'External IP' },
    { id: 5, name: 'Cam5', desc: 'Internal IP' },
    { id: 6, name: 'Cam6', desc: 'External IP' },
    { id: 7, name: 'Cam7', desc: 'External IP' },
];

const Home: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'Cameras' | 'Sequences'>('Cameras');
    const [controlMode, setControlMode] = useState(false);

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <div className={styles.sidebar}>
                <div className={styles.tabs}>
                    <div
                        className={`${styles.tab} ${activeTab === 'Cameras' ? styles.active : ''}`}
                        onClick={() => setActiveTab('Cameras')}
                    >
                        Cameras
                    </div>
                    {/* <div 
            className={`${styles.tab} ${activeTab === 'Sequences' ? styles.active : ''}`}
            onClick={() => setActiveTab('Sequences')}
          >
            Sequences
          </div> */}
                    <CircleHelp className={styles.helpIcon} size={18} />
                </div>

                <div className={styles.searchSection}>
                    <div className={styles.searchBox}>
                        <Search className={styles.searchBoxIcon} />
                        <input type="text" placeholder="Search" className={styles.searchInput} />
                    </div>
                    <SlidersHorizontal className={styles.filterIcon} size={18} />
                </div>

                <div className={styles.addAction}>
                    <button className={styles.addBtn}>
                        <Plus size={20} />
                    </button>
                </div>

                <div className={styles.cameraList}>
                    {cameras.map((camera) => (
                        <div key={camera.id} className={styles.cameraItem}>
                            <ShieldCheck className={styles.statusIcon} size={18} />
                            <div className={styles.cameraInfo}>
                                <span className={styles.cameraName}>{camera.name}</span>
                                <span className={styles.cameraDesc}>{camera.desc}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                <div className={styles.topBar}>
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

                <div className={styles.videoGrid}>
                    {[1, 2, 3, 4].map((streamNum) => (
                        <div key={streamNum} className={styles.gridCell}>
                            <div className={styles.streamLabel}>Stream {streamNum}</div>
                            <div className={styles.placeholder}>
                                <Cctv className={styles.placeholderIcon} size={32} />
                                <span className={styles.placeholderText}>Select camera to play stream</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
