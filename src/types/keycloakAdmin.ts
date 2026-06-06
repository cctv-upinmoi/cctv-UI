export interface KcUser {
    id: string;
    username: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    enabled: boolean;
    createdTimestamp: number;
    emailVerified?: boolean;
    realmRoles?: string[];
}

export interface KcRole {
    id: string;
    name: string;
    description?: string;
    composite?: boolean;
    clientRole?: boolean;
}

export interface KcCreateUserReq {
    username: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    enabled: boolean;
    credentials?: Array<{ type: 'password'; value: string; temporary: boolean }>;
}

export interface KcUpdateUserReq {
    email?: string;
    firstName?: string;
    lastName?: string;
    enabled?: boolean;
}
