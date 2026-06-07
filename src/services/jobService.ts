import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";
import type { Job } from "../types/notificationPreference";

const BASE = API.JOBS;

export const getAllJobs = () =>
    httpClient.get<{ code: number; data: Job[] }>(BASE);

export const createJob = (data: Omit<Job, 'id'>) =>
    httpClient.post<{ code: number; data: Job }>(BASE, data);

export const updateJob = (id: string, data: Omit<Job, 'id'>) =>
    httpClient.put<{ code: number; data: Job }>(`${BASE}/${id}`, data);

export const deleteJob = (id: string) =>
    httpClient.delete(`${BASE}/${id}`);
