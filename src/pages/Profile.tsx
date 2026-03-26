import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Mail, ArrowLeft, UserPlus } from 'lucide-react';
import styles from './Profile.module.css';
import { getMyProfile } from '../services/userService';
import type { UserProfile } from '../types/user';

const Profile: React.FC = () => {
    const navigate = useNavigate();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await getMyProfile();
                const resData = response.data;
                if (resData && resData.code === 1000) {
                    setUser(resData.data);
                } else {
                    throw new Error("Invalid response format");
                }
            } catch (err) {
                console.error("Failed to fetch profile data", err);
                setError("Could not load user profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center' }}>
                <p>Loading profile...</p>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center' }}>
                <p>{error || "Profile not found"}</p>
                <button className={styles.backBtn} style={{ marginTop: 16 }} onClick={() => navigate('/')}>
                    <ArrowLeft size={24} /> Back to Home
                </button>
            </div>
        );
    }

    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate('/')}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className={styles.title}>User Profile</h1>
                <div className={styles.actions}>
                    <button className={styles.addUserBtn} onClick={() => navigate('/add-user')}>
                        <UserPlus size={20} />
                        <span>Add User</span>
                    </button>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.profileCard}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatar}>
                            <User size={64} color="#fff" />
                        </div>
                        <h2 className={styles.userName}>{fullName}</h2>
                        <span className={styles.userStatus}>{user.status || 'Active'}</span>
                    </div>

                    <div className={styles.detailsSection}>
                        <div className={styles.detailItem}>
                            <Mail className={styles.detailIcon} size={20} />
                            <div className={styles.detailInfo}>
                                <label>Email Address</label>
                                <span>{user.email}</span>
                            </div>
                        </div>
                        <div className={styles.detailItem}>
                            <Shield className={styles.detailIcon} size={20} />
                            <div className={styles.detailInfo}>
                                <label>Role</label>
                                <span>{user.role || 'User'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
