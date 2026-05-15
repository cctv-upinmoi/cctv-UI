import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import styles from './DeleteConfirmDialog.module.css';
import { deleteCamera } from '../services/cameraService';

interface DeleteConfirmDialogProps {
    cameraId: string;
    cameraName: string;
    onClose: () => void;
    onDeleted: () => void;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({ cameraId, cameraName, onClose, onDeleted }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setLoading(true);
        setError(null);
        try {
            await deleteCamera(cameraId);
            onDeleted();
            onClose();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            setError(message || 'Không thể xóa camera. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.backdrop}>
            <div className={styles.dialog}>
                <div className={styles.iconWrapper}>
                    <Trash2 size={24} color="#d32f2f" />
                </div>
                <div className={styles.title}>Xóa camera</div>
                <div className={styles.message}>
                    Bạn có chắc muốn xóa camera <strong>{cameraName}</strong>? Hành động này không thể hoàn tác.
                </div>
                {error && (
                    <div className={styles.error}>{error}</div>
                )}
                <div className={styles.footer}>
                    <button className={`${styles.btn} ${styles.btnCancel}`} onClick={onClose} disabled={loading}>
                        Hủy
                    </button>
                    <button className={`${styles.btn} ${styles.btnDelete}`} onClick={handleDelete} disabled={loading}>
                        {loading ? 'Đang xóa...' : 'Xóa'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmDialog;
