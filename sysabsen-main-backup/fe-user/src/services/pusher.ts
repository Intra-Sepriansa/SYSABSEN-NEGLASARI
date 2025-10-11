import Pusher, { Channel } from 'pusher-js';
import type { AttendancePayload } from '../api/types';
import { useKioskStore } from '../store/useKioskStore';
import { captureAndUpload } from './photo';

let client: Pusher | null = null;
let channel: Channel | null = null;

const CHANNEL_NAME = 'attendance.recorded';
const EVENT_NAMES = ['AttendanceRecorded', 'attendance.recorded'];

function normalizeAttendance(payload: AttendancePayload) {
  return {
    id: payload.id,
    name: payload.user?.name ?? 'Unknown User',
    nim: payload.user?.nim,
    course: payload.course,
    device: payload.device?.name ?? payload.device?.id,
    type: payload.type,
    flags: payload.flags,
    tapTime: payload.tap_time,
    createdAt: payload.created_at
  };
}

export function connectPusher() {
  const { config } = useKioskStore.getState();
  if (!config.pusherKey || !config.pusherCluster) {
    return null;
  }
  if (client) {
    return client;
  }

  client = new Pusher(config.pusherKey, {
    cluster: config.pusherCluster,
    forceTLS: true,
    enabledTransports: ['ws', 'wss']
  });

  client.connection.bind('connected', () => {
    useKioskStore.getState().setNetworkHealth('online');
  });

  client.connection.bind('disconnected', () => {
    useKioskStore.getState().setNetworkHealth('offline');
  });

  client.connection.bind('unavailable', () => {
    useKioskStore.getState().setNetworkHealth('degraded');
  });

  channel = client.subscribe(CHANNEL_NAME);

  EVENT_NAMES.forEach((eventName) => {
    channel?.bind(eventName, (payload: AttendancePayload) => {
      const latency = Math.max(0, Date.now() - Date.parse(payload.tap_time));
      const store = useKioskStore.getState();
      store.pushAttendance(normalizeAttendance(payload), latency);
      if (store.config.photoEnabled) {
        captureAndUpload(payload.id, store.config.photoMaxKB).catch((error) => {
          console.warn('captureAndUpload failed', error);
        });
      }
    });
  });

  return client;
}

export function disconnectPusher() {
  if (channel) {
    EVENT_NAMES.forEach((eventName) => channel?.unbind(eventName));
    client?.unsubscribe(CHANNEL_NAME);
    channel = null;
  }
  client?.disconnect();
  client = null;
}
