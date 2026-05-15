import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileSpreadsheet, X, AlertTriangle, CheckCircle, Cctv } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './ImportCamera.module.css';
import { importCameras } from '../services/cameraService';

interface ImportError {
    row: number;
    field: string;
    message: string;
}

interface ImportedCamera {
    id: string;
    name: string;
    ip: string;
}

interface ImportResult {
    totalRows: number;
    successCount: number;
    failCount: number;
    imported: ImportedCamera[];
    errors: ImportError[];
}

const ACCEPTED = '.csv,.xlsx,.xls';

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ImportCamera: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const setSelectedFile = (f: File) => {
        setFile(f);
        setResult(null);
        setError(null);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) setSelectedFile(dropped);
    }, []);

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
    const handleDragLeave = () => setDragging(false);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) setSelectedFile(f);
        e.target.value = '';
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            const res = await importCameras(file);
            const body = res.data as { data: ImportResult };
            setResult(body.data);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr?.response?.data?.message ?? t('importCamera.uploadError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate('/')}>
                    <ArrowLeft size={22} />
                </button>
                <h1 className={styles.title}>{t('importCamera.title')}</h1>
            </div>

            <div className={styles.content}>
                {/* Upload card */}
                <div className={styles.card}>
                    <p className={styles.sectionTitle}>{t('importCamera.uploadSection')}</p>
                    <p className={styles.hint}>{t('importCamera.hint')}</p>

                    <div
                        className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => inputRef.current?.click()}
                    >
                        <Upload className={styles.dropIcon} size={36} />
                        <span className={styles.dropText}>{t('importCamera.dropText')}</span>
                        <span className={styles.dropSub}>
                            {t('importCamera.dropSub')}{' '}
                            <span className={styles.browseLink}>{t('importCamera.browse')}</span>
                        </span>
                        <span className={styles.dropSub}>{t('importCamera.acceptedFormats')}</span>
                    </div>

                    <input
                        ref={inputRef}
                        type="file"
                        accept={ACCEPTED}
                        style={{ display: 'none' }}
                        onChange={handleFileInput}
                    />

                    {file && (
                        <div className={styles.fileInfo}>
                            <FileSpreadsheet className={styles.fileIcon} size={20} />
                            <span className={styles.fileName}>{file.name}</span>
                            <span className={styles.fileSize}>{formatBytes(file.size)}</span>
                            <button className={styles.clearBtn} onClick={() => { setFile(null); setResult(null); setError(null); }}>
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {error && (
                        <div style={{ marginTop: 14, padding: '10px 14px', background: 'color-mix(in srgb, var(--danger) 8%, transparent)', border: '1px solid var(--danger)', borderRadius: 6, color: 'var(--danger)', fontSize: 13 }}>
                            {error}
                        </div>
                    )}

                    <div className={styles.actions}>
                        <button
                            className={styles.uploadBtn}
                            onClick={handleUpload}
                            disabled={!file || loading}
                        >
                            {loading ? <span className={styles.spinner} /> : <Upload size={16} />}
                            {loading ? t('importCamera.uploading') : t('importCamera.upload')}
                        </button>
                    </div>
                </div>

                {/* Result card */}
                {result && (
                    <>
                        <div className={styles.card}>
                            <p className={styles.sectionTitle}>{t('importCamera.resultTitle')}</p>
                            <div className={styles.summaryGrid}>
                                <div className={`${styles.stat} ${styles.total}`}>
                                    <div className={styles.statValue}>{result.totalRows}</div>
                                    <div className={styles.statLabel}>{t('importCamera.totalRows')}</div>
                                </div>
                                <div className={`${styles.stat} ${styles.success}`}>
                                    <div className={styles.statValue}>{result.successCount}</div>
                                    <div className={styles.statLabel}>{t('importCamera.successCount')}</div>
                                </div>
                                <div className={`${styles.stat} ${styles.fail}`}>
                                    <div className={styles.statValue}>{result.failCount}</div>
                                    <div className={styles.statLabel}>{t('importCamera.failCount')}</div>
                                </div>
                            </div>
                        </div>

                        {result.imported.length > 0 && (
                            <div className={styles.card}>
                                <p className={styles.successHeader}>
                                    <CheckCircle size={16} />
                                    {t('importCamera.importedCameras', { count: result.imported.length })}
                                </p>
                                <div className={styles.tagList}>
                                    {result.imported.map(cam => (
                                        <span key={cam.id} className={styles.cameraTag}>
                                            <Cctv size={12} />
                                            {cam.name} <span style={{ color: 'var(--text-5)', fontSize: 11 }}>({cam.ip})</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {result.errors.length > 0 && (
                            <div className={styles.card}>
                                <p className={styles.errorHeader}>
                                    <AlertTriangle size={16} />
                                    {t('importCamera.errorsTitle', { count: result.errors.length })}
                                </p>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>{t('importCamera.colRow')}</th>
                                            <th>{t('importCamera.colField')}</th>
                                            <th>{t('importCamera.colMessage')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.errors.map((err, i) => (
                                            <tr key={i}>
                                                <td className={styles.rowNum}>{err.row}</td>
                                                <td className={styles.fieldCell}>{err.field}</td>
                                                <td>{err.message}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ImportCamera;
