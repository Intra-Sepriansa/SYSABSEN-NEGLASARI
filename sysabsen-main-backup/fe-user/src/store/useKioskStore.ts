import { create } from 'zustand';
import { ThemeMode, useThemeStore } from '../theme';

export type TapStatus = 'IDLE' | 'SUCCESS' | 'LATE' | 'EARLY' | 'REJECTED' | 'OFFLINE' | 'ERROR';

export interface AttendanceRow {
  id: number;
  name: string;
  nim?: string;
  course?: string;
  device?: string;
  type: 'in' | 'out' | 'auto';
  flags?: {
    ontime?: boolean;
    late?: boolean;
    early_leave?: boolean;
    rejected_reason?: string;
  };
  tapTime: string;
  createdAt?: string;
}

export type LayoutMode = 'A' | 'B' | 'C';

export interface KioskConfig {
  apiBaseUrl: string;
  deviceId: string;
  deviceKey: string;
  youtubeVideoId: string;
  photoEnabled: boolean;
  photoMaxKB: number;
  pusherKey?: string;
  pusherCluster?: string;
  layoutMode: LayoutMode;
  brandTitle?: string;
  brandSubtitle?: string;
  brandLogo?: string;
  defaultTheme: ThemeMode;
}

export type NetworkHealth = 'online' | 'degraded' | 'offline';

interface State {
  token?: string;
  status: TapStatus;
  lastAttendance?: AttendanceRow;
  history: AttendanceRow[];
  latencyMs?: number;
  queueLagMs?: number;
  networkHealth: NetworkHealth;
  photoStatus: 'idle' | 'uploading' | 'success' | 'error';
  config: KioskConfig;
  setToken: (token?: string) => void;
  setStatus: (status: TapStatus) => void;
  pushAttendance: (row: AttendanceRow, latencyMs?: number) => void;
  setHistory: (rows: AttendanceRow[]) => void;
  setConfig: (config: Partial<KioskConfig>) => void;
  setQueueLag: (lagMs?: number) => void;
  setNetworkHealth: (health: NetworkHealth) => void;
  setPhotoStatus: (state: State['photoStatus']) => void;
  setLastAttendance: (row?: AttendanceRow) => void;
  reset: () => void;
}

const envTheme = import.meta.env.VITE_DEFAULT_THEME;
const defaultTheme = envTheme === 'light' || envTheme === 'dark' ? (envTheme as ThemeMode) : 'dark';

const defaultConfig: KioskConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  deviceId: import.meta.env.VITE_DEVICE_ID ?? '',
  deviceKey: import.meta.env.VITE_DEVICE_KEY ?? '',
  youtubeVideoId: import.meta.env.VITE_YOUTUBE_VIDEO_ID ?? 'dQw4w9WgXcQ',
  photoEnabled: (import.meta.env.VITE_PHOTO_ENABLED ?? 'false') === 'true',
  photoMaxKB: Number(import.meta.env.VITE_PHOTO_MAX_KB ?? 500),
  pusherKey: import.meta.env.VITE_PUSHER_KEY,
  pusherCluster: import.meta.env.VITE_PUSHER_CLUSTER,
  layoutMode: 'A',
  brandTitle: import.meta.env.VITE_BRAND_TITLE,
  brandSubtitle: import.meta.env.VITE_BRAND_SUBTITLE,
  brandLogo: import.meta.env.VITE_BRAND_LOGO,
  defaultTheme
};

export const useKioskStore = create<State>((set) => ({
  token: undefined,
  status: 'IDLE',
  lastAttendance: undefined,
  history: [],
  latencyMs: undefined,
  queueLagMs: undefined,
  networkHealth: 'offline',
  photoStatus: 'idle',
  config: defaultConfig,
  setToken: (token) => set({ token }),
  setStatus: (status) => set({ status }),
  pushAttendance: (row, latencyMs) =>
    set((state) => {
      let status: TapStatus = 'SUCCESS';
      if (row.flags?.rejected_reason) {
        status = 'REJECTED';
      } else if (row.flags?.late) {
        status = 'LATE';
      } else if (row.flags?.early_leave) {
        status = 'EARLY';
      }
      return {
        status,
        lastAttendance: row,
        history: [row, ...state.history.filter((item) => item.id !== row.id)].slice(0, 20),
        latencyMs
      };
    }),
  setHistory: (rows) =>
    set((state) => ({
      history: rows.slice(0, 20),
      lastAttendance: state.lastAttendance ?? rows[0]
    })),
  setLastAttendance: (row) => set({ lastAttendance: row }),
  setConfig: (config) =>
    set((state) => {
      if (config.defaultTheme) {
        useThemeStore.getState().setMode(config.defaultTheme);
      }
      return {
        config: { ...state.config, ...config }
      };
    }),
  setQueueLag: (lagMs) => set({ queueLagMs: lagMs }),
  setNetworkHealth: (health) => set({ networkHealth: health }),
  setPhotoStatus: (photoStatus) => set({ photoStatus }),
  reset: () =>
    set({
      token: undefined,
      status: 'IDLE',
      lastAttendance: undefined,
      history: [],
      latencyMs: undefined,
      queueLagMs: undefined,
      networkHealth: 'offline',
      photoStatus: 'idle'
    })
}));

if (typeof window !== 'undefined' && import.meta.env.MODE !== 'production') {
  (window as typeof window & { __kioskStore__?: typeof useKioskStore }).__kioskStore__ = useKioskStore;
}
