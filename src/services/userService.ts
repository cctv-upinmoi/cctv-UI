import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";

export const getMyProfile = async () =>
    httpClient.get(API.MY_PROFILE);
