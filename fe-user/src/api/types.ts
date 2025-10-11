export interface DeviceAuthRequest {
  device_key: string;
}

export interface DeviceAuthResponse {
  token: string;
  expires_at?: string;
}

export interface AttendanceUser {
  id: number;
  name: string;
  nim?: string;
}

export interface AttendanceDevice {
  id: string;
  name: string;
}

export interface AttendanceFlags {
  ontime?: boolean;
  late?: boolean;
  early_leave?: boolean;
  rejected_reason?: string;
}

export interface AttendancePayload {
  id: number;
  user: AttendanceUser;
  device: AttendanceDevice;
  type: 'in' | 'out' | 'auto';
  flags: AttendanceFlags;
  tap_time: string;
  course?: string;
  status?: 'success' | 'late' | 'early' | 'rejected';
  created_at?: string;
}

export interface PhotoUploadResponse {
  status: 'queued' | 'processing' | 'completed';
  job_id?: string;
  url?: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  queue_lag_ms?: number;
  timestamp: string;
}
