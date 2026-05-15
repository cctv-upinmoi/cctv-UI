import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import type { CreateUserRequest } from "../types/user";

export const register = async (data: CreateUserRequest) =>
    httpClient.post(API.REGISTRATION, data);

export const getMyProfile = async () =>
    httpClient.get(API.MY_PROFILE);
