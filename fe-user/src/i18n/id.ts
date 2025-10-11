export const id = {
  status: {
    idle: 'Silakan tap kartu Anda',
    success: 'SUDAH TERABSEN',
    late: 'TERLAMBAT',
    early: 'PULANG AWAL',
    rejected: 'DITOLAK',
    offline: 'MODE OFFLINE',
    error: 'TERJADI KESALAHAN'
  },
  labels: {
    tap: 'Tap',
    latency: 'Latensi',
    device: 'Device',
    course: 'Mata Kuliah',
    time: 'Waktu',
    reset: 'Reset',
    settings: 'Settings',
    save: 'Simpan',
    cancel: 'Batal',
    history: 'Riwayat Terakhir',
    network: 'Status Jaringan',
    queueLag: 'Antrean Foto',
    modeOffline: 'MODE OFFLINE',
    processing: 'Memproses Foto',
    photoError: 'Foto gagal diunggah',
    photoSuccess: 'Foto dikirim',
    layout: 'Layout',
    layoutA: 'CineBoard',
    layoutB: 'PiP Focus',
    layoutC: 'Ticker Panel'
  },
  settings: {
    dialogTitle: 'Pengaturan Kiosk (F10)',
    apiBaseUrl: 'API Base URL',
    deviceId: 'Device ID',
    deviceKey: 'Device Key',
    youtubeVideoId: 'YouTube Video ID',
    pusherKey: 'Pusher Key',
    pusherCluster: 'Pusher Cluster',
    photoEnabled: 'Aktifkan Foto Otomatis',
    photoMaxKB: 'Ukuran Maks Foto (KB)',
    layoutMode: 'Layout',
    reset: 'Reset Konfigurasi'
  },
  network: {
    online: 'Online',
    degraded: 'Tertunda',
    offline: 'Offline'
  }
};

export type IdKey = keyof typeof id;
