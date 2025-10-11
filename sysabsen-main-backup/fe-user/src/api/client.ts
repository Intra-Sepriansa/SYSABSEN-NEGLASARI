import axios from 'axios';
import { useKioskStore } from '../store/useKioskStore';

export const api = axios.create({
  baseURL: useKioskStore.getState().config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10_000
});

api.interceptors.request.use((config) => {
  const state = useKioskStore.getState();
  if (state.token) {
    config.headers.Authorization = `Bearer ${state.token}`;
  }
  if (state.config.deviceId) {
    config.headers['X-Device-ID'] = state.config.deviceId;
  }
  if (state.config.deviceKey) {
    config.headers['X-Device-Key'] = state.config.deviceKey;
  }
  if (state.config.apiBaseUrl) {
    config.baseURL = state.config.apiBaseUrl;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    useKioskStore.getState().setNetworkHealth('online');
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      useKioskStore.getState().reset();
    }
    useKioskStore.getState().setNetworkHealth('degraded');
    return Promise.reject(error);
  }
);

useKioskStore.subscribe((state, prevState) => {
  if (state.config.apiBaseUrl !== prevState.config.apiBaseUrl) {
    api.defaults.baseURL = state.config.apiBaseUrl;
  }
});
