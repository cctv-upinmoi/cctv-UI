import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Cctv, Bell, User, UserPlus, LogOut, ChevronLeft, ChevronRight, LayoutDashboard, Map, Sun, Moon } from 'lucide-react';
import styles from './Layout.module.css';
import { logOut } from '../services/authService';
import keycloak from '../configurations/keycloak';
import { useTheme } from '../contexts/ThemeContext';
import { useIntrusionAlertContext } from '../contexts/IntrusionAlertContext';

interface NavItem {
    to: string;
    icon: React.ReactNode;
    label: string;
    end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
    { to: '/', icon: <Cctv size={20} />, label: 'Live Monitor', end: true },
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/map', icon: <Map size={20} />, label: 'Bản đồ' },
    { to: '/notifications', icon: <Bell size={20} />, label: 'Cảnh báo' },
    { to: '/profile', icon: <User size={20} />, label: 'Profile' },
    { to: '/add-user', icon: <UserPlus size={20} />, label: 'Add User' },
];

const Layout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);
    const { theme, toggle } = useTheme();
    const { unreadCount } = useIntrusionAlertContext();
    const parsed = keycloak.tokenParsed as { preferred_username?: string } | undefined;
    const username = parsed?.preferred_username ?? 'User';

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
                        onClick={toggle}
                        title={collapsed ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : undefined}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        {!collapsed && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
                    </button>
                    <div className={styles.userRow} title={collapsed ? username : undefined}>
                        <div className={styles.avatar}>{username[0].toUpperCase()}</div>
                        {!collapsed && <span className={styles.username}>{username}</span>}
                    </div>
                    <button
                        className={styles.logoutBtn}
                        onClick={logOut}
                        title={collapsed ? 'Logout' : undefined}
                    >
                        <LogOut size={18} />
                        {!collapsed && <span>Logout</span>}
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
