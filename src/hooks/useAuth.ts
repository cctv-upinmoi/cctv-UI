import keycloak from '../configurations/keycloak';
import { ROLES, type Role } from '../auth/roles';

interface AuthInfo {
    roles: string[];
    hasRole: (r: Role) => boolean;
    hasAnyRole: (rs: Role[]) => boolean;
    isAdmin: boolean;
    isConfigurator: boolean;
    isViewer: boolean;
    canCreateCamera: boolean;
    canEditCamera: boolean;
    canImportCamera: boolean;
    canDeleteCamera: boolean;
    canEditZone: boolean;
    canManageJobs: boolean;
    canManageOwnSubscription: boolean;
    canManageAllSubscriptions: boolean;
    canOpenUserManagement: boolean;
}

export const useAuth = (): AuthInfo => {
    const parsed = keycloak.tokenParsed as
        | { realm_access?: { roles?: string[] } }
        | undefined;
    const roles = parsed?.realm_access?.roles ?? [];

    const hasRole = (r: Role) => roles.includes(r);
    const hasAnyRole = (rs: Role[]) => rs.some(r => roles.includes(r));

    const isAdmin = hasRole(ROLES.ADMIN);
    const isConfigurator = hasRole(ROLES.CONFIGURATOR);
    const isViewer = hasRole(ROLES.VIEWER) || (!isAdmin && !isConfigurator);

    const adminOrConfigurator = isAdmin || isConfigurator;

    return {
        roles,
        hasRole,
        hasAnyRole,
        isAdmin,
        isConfigurator,
        isViewer,
        canCreateCamera: adminOrConfigurator,
        canEditCamera: adminOrConfigurator,
        canImportCamera: adminOrConfigurator,
        canDeleteCamera: isAdmin,
        canEditZone: isAdmin,
        canManageJobs: adminOrConfigurator,
        canManageOwnSubscription: adminOrConfigurator,
        canManageAllSubscriptions: isAdmin,
        canOpenUserManagement: isAdmin,
    };
};
