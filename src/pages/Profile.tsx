import React from 'react';
import { User, Shield, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './Profile.module.css';
import { useUser } from '../contexts/UserContext';

const Profile: React.FC = () => {
    const { t } = useTranslation();
    const { user, loading, error } = useUser();

    if (loading) {
        return (
            <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center' }}>
                <p>{t('profile.loading')}</p>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center' }}>
                <p>{error || t('profile.error')}</p>
            </div>
        );
    }

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    const roles = user.roles && user.roles.length > 0 ? user.roles : ['User'];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t('profile.title')}</h1>
                <div className={styles.actions} />
            </div>

            <div className={styles.content}>
                <div className={styles.profileCard}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatar}>
                            <User size={64} color="#fff" />
                        </div>
                        <h2 className={styles.userName}>{fullName}</h2>
                    </div>

                    <div className={styles.detailsSection}>
                        <div className={styles.detailItem}>
                            <Mail className={styles.detailIcon} size={20} />
                            <div className={styles.detailInfo}>
                                <label>{t('profile.email')}</label>
                                <span>{user.email}</span>
                            </div>
                        </div>
                        <div className={styles.detailItem}>
                            <Shield className={styles.detailIcon} size={20} />
                            <div className={styles.detailInfo}>
                                <label>{t('profile.role')}</label>
                                <div className={styles.roleList}>
                                    {roles.map(role => (
                                        <span key={role} className={styles.roleBadge}>{role}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
