export const ROLES = {
    ADMIN: 'ADMIN',
    CONFIGURATOR: 'CONFIGURATOR',
    VIEWER: 'VIEWER',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
