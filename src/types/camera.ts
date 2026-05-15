export interface LocationDetail {
  address: string;
  ward?: string;
  district?: string;
  province: string;
  description?: string;
}

export interface Zone {
  name: string;
  type: 'INTRUSION' | 'LOITERING' | 'LINE_CROSSING';
  enabled: boolean;
  points: number[][];
}

export interface CameraRes {
  id: string;
  indexId: number;
  name: string;
  ip: string;
  port?: number;
  username: string;
  status: 'OK' | 'NOK';
  mode: string;
  rtspStreamUrl?: string;
  longitude?: number;
  latitude?: number;
  locationDetail?: LocationDetail;
  zones?: Zone[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AddCameraReq {
  name: string;
  ip: string;
  port?: number;
  username: string;
  pwd: string;
  mode: string;
  rtspStreamUrl?: string;
  longitude?: number;
  latitude?: number;
  locationDetail: LocationDetail;
}

export interface UpdateCameraReq {
  cameraId: string;
  name?: string;
  ip?: string;
  port?: number;
  username?: string;
  pwd?: string;
  mode?: string;
  rtspStreamUrl?: string;
  status?: string;
  longitude?: number;
  latitude?: number;
  locationDetail?: LocationDetail;
}
