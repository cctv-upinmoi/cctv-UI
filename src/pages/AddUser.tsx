import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Lock, Shield } from 'lucide-react';
import styles from './AddUser.module.css';
import { register } from '../services/userService';
import type { CreateUserRequest } from '../types/user';

const AddUser: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<CreateUserRequest>({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'User'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await register(formData);
            alert('User created successfully!');
            navigate('/profile');
        } catch (err) {
            console.error('Failed to create user:', err);
            setError('Failed to create user. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate('/profile')}>
                    <ArrowLeft size={24} />
                </button>
                <h1 className={styles.title}>Add New User</h1>
            </div>

            <div className={styles.content}>
                <div className={styles.formCard}>
                    <p className={styles.subtitle}>Fill in the details to create a new user account.</p>

                    {error && (
                        <div style={{ color: '#ff5252', marginBottom: '16px', fontSize: '0.9rem', backgroundColor: 'rgba(255, 82, 82, 0.1)', padding: '10px', borderRadius: '4px' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email Address</label>
                            <div className={styles.inputWrapper}>
                                <Mail className={styles.inputIcon} size={18} />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter email address"
                                    className={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>First Name</label>
                            <div className={styles.inputWrapper}>
                                <User className={styles.inputIcon} size={18} />
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="Enter first name"
                                    className={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Last Name</label>
                            <div className={styles.inputWrapper}>
                                <User className={styles.inputIcon} size={18} />
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Enter last name"
                                    className={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Password</label>
                            <div className={styles.inputWrapper}>
                                <Lock className={styles.inputIcon} size={18} />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter password"
                                    className={styles.input}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Role</label>
                            <div className={styles.inputWrapper}>
                                <Shield className={styles.inputIcon} size={18} />
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className={styles.select}
                                >
                                    <option value="User">User</option>
                                    <option value="Operator">Operator</option>
                                    <option value="Administrator">Administrator</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.formActions}>
                            <button type="button" className={styles.cancelBtn} onClick={() => navigate('/profile')} disabled={loading}>
                                Cancel
                            </button>
                            <button type="submit" className={styles.submitBtn} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
                                {loading ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddUser;
