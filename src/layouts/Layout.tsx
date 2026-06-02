import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Cctv, Bell, User, UserPlus, LogOut, ChevronLeft, ChevronRight, LayoutDashboard, Map, Sun, Moon, Languages, BellDot } from 'lucide-react';
import styles from './Layout.module.css';
import { logOut } from '../services/authService';
import keycloak from '../configurations/keycloak';
import { useTheme } from '../contexts/ThemeContext';
import { useIntrusionAlertContext } from '../contexts/IntrusionAlertContext';
import { useTranslation } from 'react-i18next';

const Layout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { theme, toggle } = useTheme();
    const { unreadCount } = useIntrusionAlertContext();
    const { t, i18n } = useTranslation();
    const parsed = keycloak.tokenParsed as { preferred_username?: string } | undefined;
    const username = parsed?.preferred_username ?? 'User';

    const isVi = i18n.language === 'vi';

    const toggleLanguage = () => {
        const next = isVi ? 'en' : 'vi';
        i18n.changeLanguage(next);
        localStorage.setItem('cctv-lang', next);
    };

    const NAV_ITEMS = [
        { to: '/',              icon: <Cctv size={20} />,          label: t('nav.liveMonitor'), end: true },
        { to: '/dashboard',     icon: <LayoutDashboard size={20} />, label: t('nav.dashboard') },
        { to: '/map',           icon: <Map size={20} />,            label: t('nav.map') },
        { to: '/notifications', icon: <Bell size={20} />,           label: t('nav.alerts') },
        { to: '/profile',       icon: <User size={20} />,           label: t('nav.profile') },
        { to: '/add-user',      icon: <UserPlus size={20} />,       label: t('nav.addUser') },
        { to: '/notification-settings',   icon: <BellDot size={20} />,  label: t('nav.notificationSettings') },
    ];

    return (
        <div className={styles.shell}>
            <nav className={`${styles.nav} ${collapsed ? styles.navCollapsed : ''}`}>
                <div className={styles.navHeader}>
                    {!collapsed && <span className={styles.brand}>SmartCCTV</span>}
                    <button
                        className={styles.collapseBtn}
                        onClick={() => setCollapsed(p => !p)}
                        title={collapsed ? 'Expand menu' : 'Collapse menu'}
                    >
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                <div className={styles.navItems}>
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            title={collapsed ? item.label : undefined}
                            className={({ isActive }) =>
                                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                            }
                        >
                            <span className={styles.navIcon}>
                                {item.to === '/notifications' && unreadCount > 0 ? (
                                    <span className={styles.badgeWrapper}>
                                        {item.icon}
                                        <span className={styles.unreadBadge}>
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    </span>
                                ) : item.icon}
                            </span>
                            {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                        </NavLink>
                    ))}
                </div>

                <div className={styles.navFooter}>
                    <button
                        className={styles.themeBtn}
                        onClick={toggleLanguage}
                        title={collapsed ? (isVi ? t('nav.english') : t('nav.vietnamese')) : undefined}
                    >
                        <Languages size={18} />
                        {!collapsed && <span>{isVi ? t('nav.english') : t('nav.vietnamese')}</span>}
                    </button>
                    <button
                        className={styles.themeBtn}
                        onClick={toggle}
                        title={collapsed ? t(theme === 'dark' ? 'nav.lightMode' : 'nav.darkMode') : undefined}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        {!collapsed && <span>{t(theme === 'dark' ? 'nav.lightMode' : 'nav.darkMode')}</span>}
                    </button>
                    <div className={styles.userRow} title={collapsed ? username : undefined}>
                        <div className={styles.avatar}>{username[0].toUpperCase()}</div>
                        {!collapsed && <span className={styles.username}>{username}</span>}
                    </div>
                    <button
                        className={styles.logoutBtn}
                        onClick={logOut}
                        title={collapsed ? t('nav.logout') : undefined}
                    >
                        <LogOut size={18} />
                        {!collapsed && <span>{t('nav.logout')}</span>}
                    </button>
                </div>
            </nav>

            <main className={styles.content}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
