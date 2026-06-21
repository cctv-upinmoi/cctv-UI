import axios from 'axios';
import keycloak from '../configurations/keycloak';
import { KEYCLOACK_CONFIG } from '../configurations/configuration';
import type { KcUser, KcRole, KcCreateUserReq, KcUpdateUserReq } from '../types/keycloakAdmin';

const adminBase = () =>
    `${KEYCLOACK_CONFIG.url.replace(/\/$/, '')}/admin/realms/${KEYCLOACK_CONFIG.realm}`;

const withToken = async <T>(fn: (token: string) => Promise<T>): Promise<T> => {
    await keycloak.updateToken(30).catch(() => keycloak.login());
    return fn(keycloak.token!);
};

export const kcGetUsers = (search?: string): Promise<KcUser[]> =>
    withToken(token =>
        axios.get(`${adminBase()}/users`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { max: 200, ...(search ? { search } : {}) },
        }).then(r => r.data)
    );

export const kcCreateUser = (data: KcCreateUserReq): Promise<void> =>
    withToken(token =>
        axios.post(`${adminBase()}/users`, data, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(() => undefined)
    );

export const kcUpdateUser = (id: string, data: KcUpdateUserReq): Promise<void> =>
    withToken(token =>
        axios.put(`${adminBase()}/users/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(() => undefined)
    );

export const kcDeleteUser = (id: string): Promise<void> =>
    withToken(token =>
        axios.delete(`${adminBase()}/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(() => undefined)
    );

export const kcResetPassword = (id: string, value: string, temporary: boolean): Promise<void> =>
    withToken(token =>
        axios.put(
            `${adminBase()}/users/${id}/reset-password`,
            { type: 'password', value, temporary },
            { headers: { Authorization: `Bearer ${token}` } },
        ).then(() => undefined)
    );

export const kcGetRealmRoles = (): Promise<KcRole[]> =>
    withToken(token =>
        axios.get(`${adminBase()}/roles`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.data)
    );

export const kcGetUserRoles = (id: string): Promise<KcRole[]> =>
    withToken(token =>
        axios.get(`${adminBase()}/users/${id}/role-mappings/realm`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.data)
    );

export const kcAssignRoles = (id: string, roles: KcRole[]): Promise<void> =>
    withToken(token =>
        axios.post(`${adminBase()}/users/${id}/role-mappings/realm`, roles, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(() => undefined)
    );

export const kcRemoveRoles = (id: string, roles: KcRole[]): Promise<void> =>
    withToken(token =>
        axios.delete(`${adminBase()}/users/${id}/role-mappings/realm`, {
            headers: { Authorization: `Bearer ${token}` },
            data: roles,
        }).then(() => undefined)
    );
