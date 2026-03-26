import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import keycloak from "../configurations/keycloak";
import type { CreateUserRequest } from "../types/user";

export const register = async (data: CreateUserRequest) => {
    return await httpClient.post(API.REGISTRATION, data, {
        headers: {
            Authorization: "Bearer " + keycloak.token
        }
    });
};

export const getMyProfile = async () => {
    return await httpClient.get(API.MY_PROFILE, {
        headers: {
            Authorization: "Bearer " + keycloak.token
        }
    })
}