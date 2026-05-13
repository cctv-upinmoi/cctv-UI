import httpClient from "../configurations/httpClient";
import { API } from "../configurations/configuration";

export interface AnalyticsSummaryRes {
    todayTotal: number;
    yesterdayTotal: number;
    total7d: number;
    topCameraName: string | null;
    topCameraCount: number;
}

export interface HourlyCountRes {
    hour: number;
    count: number;
}

export interface DailyCountRes {
    date: string; // yyyy-MM-dd UTC
    count: number;
}

export interface CameraRankRes {
    cameraId: string;
    cameraName: string;
    count: number;
}

const BASE = API.ANALYTICS;

export const getSummary = () =>
    httpClient.get<{ code: number; data: AnalyticsSummaryRes }>(
        `${BASE}/summary`,
        {}
    );

export const getHourlyToday = () =>
    httpClient.get<{ code: number; data: HourlyCountRes[] }>(
        `${BASE}/hourly`,
        {}
    );

export const getDailyTrend = (days = 7) =>
    httpClient.get<{ code: number; data: DailyCountRes[] }>(
        `${BASE}/daily`,
        { params: { days } }
    );

export const getTopCameras = (limit = 10) =>
    httpClient.get<{ code: number; data: CameraRankRes[] }>(
        `${BASE}/top-cameras`,
        { params: { limit } }
    );
