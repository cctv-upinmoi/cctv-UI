import React, { useState } from 'react';
import { X, Cctv } from 'lucide-react';
import styles from './NewCameraDialog.module.css';

interface NewCameraDialogProps {
    onClose: () => void;
}

const NewCameraDialog: React.FC<NewCameraDialogProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'General' | 'Connection'>('General');

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

                    {/* Tab Panels */}
                    {activeTab === 'General' && (
                        <div className={styles.tabPanel}>
                            <div className={styles.row}>
                                <div className={styles.field} style={{ flex: 1 }}>
                                    <label>Name <span className={styles.required}>*</span></label>
                                    <input type="text" className={styles.input} />
                                </div>
                                <div className={styles.field} style={{ flex: 2 }}>
                                    <label>Description</label>
                                    <input type="text" className={styles.input} />
                                </div>
                            </div>

                            <div className={styles.sectionTitle}>Location</div>
                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>Primary roadway</label>
                                    <input type="text" className={styles.input} />
                                </div>
                                <div className={styles.field}>
                                    <label>Direction</label>
                                    <input type="text" className={styles.input} />
                                </div>
                                <div className={styles.field}>
                                    <label>Milepost</label>
                                    <input type="text" className={styles.input} />
                                </div>
                            </div>
                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>Secondary reference</label>
                                    <input type="text" className={styles.input} />
                                </div>
                                <div className={styles.field}>
                                    <label>Latitude</label>
                                    <input type="text" className={styles.input} />
                                </div>
                                <div className={styles.field}>
                                    <label>Longitude</label>
                                    <input type="text" className={styles.input} />
                                </div>
                            </div>

                            <div className={styles.sectionTitle}>Regions</div>
                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <input type="text" className={styles.input} />
                                </div>
                            </div>

                            <div className={styles.sectionTitle}>Comments</div>
                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <textarea className={styles.textarea}></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Connection' && (
                        <div className={styles.tabPanel}>
                            <div className={styles.row}>
                                <div className={styles.field} style={{ flex: 1, maxWidth: '200px' }}>
                                    <label>Protocol <span className={styles.required}>*</span></label>
                                    <select className={styles.select}>
                                        <option value=""></option>
                                        <option value="onvif">ONVIF</option>
                                        <option value="rtsp">RTSP</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>Username</label>
                                    <input type="text" className={styles.input} />
                                </div>
                                <div className={styles.field}>
                                    <label>Password</label>
                                    <input type="password" className={styles.input} />
                                </div>
                                <div className={styles.field} style={{ flex: 0.5 }}>
                                    <label>Required</label>
                                    <div className={styles.switchContainer}>
                                        <label className={styles.switch}>
                                            <input type="checkbox" />
                                            <span className={styles.slider}></span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>SNMP Port</label>
                                    <input type="text" className={styles.input} />
                                </div>
                                <div className={styles.field}>
                                    <label>SNMP Write Comm</label>
                                    <input type="text" className={styles.input} />
                                </div>
                                <div className={styles.field}>
                                    <label>SNMP Read Comm</label>
                                    <input type="text" className={styles.input} />
                                </div>
                            </div>

                            <div className={styles.row}>
                                <div className={styles.field}>
                                    <label>ONVIF Port</label>
                                    <input type="text" className={styles.input} />
                                </div>
                                <div className={styles.field}>
                                    <label>ONVIF Profile</label>
                                    <input type="text" className={styles.input} />
                                </div>
                                <div className={styles.field}>
                                    <label>PTZ Service URI</label>
                                    <input type="text" className={styles.input} />
                                </div>
                                <div className={styles.field}>
                                    <label>Device Service URI</label>
                                    <input type="text" className={styles.input} />
                                </div>
                            </div>

                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Stream</th>
                                        <th>URL</th>
                                        <th>Frame rate (fps)</th>
                                        <th>Packet size (bytes)</th>
                                        <th>Max packets</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>RTSP</td>
                                        <td><input type="text" className={styles.input} /></td>
                                        <td><input type="number" className={styles.input} defaultValue={15} /></td>
                                        <td><input type="number" className={styles.input} defaultValue={1048576} /></td>
                                        <td><input type="number" className={styles.input} defaultValue={8} /></td>
                                    </tr>
                                    <tr>
                                        <td>MJPEG</td>
                                        <td><input type="text" className={styles.input} /></td>
                                        <td><input type="number" className={styles.input} defaultValue={15} /></td>
                                        <td><input type="number" className={styles.input} defaultValue={1048576} /></td>
                                        <td><input type="number" className={styles.input} defaultValue={8} /></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <button className={`${styles.btn} ${styles.btnCreate}`}>Create</button>
                    <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default NewCameraDialog;
