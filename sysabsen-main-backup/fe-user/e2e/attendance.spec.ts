import { test, expect } from '@playwright/test';

const initialAttendancePayload = {
  data: [
    {
      id: 1,
      tap_time: new Date().toISOString(),
      created_at: new Date().toISOString(),
      type: 'in',
      flags: { ontime: true },
      user: { name: 'Awal', nim: '001' },
      device: { id: 'KIOSK-01', name: 'Kiosk Utama' },
      course: 'Petugas'
    }
  ]
};

const healthPayload = {
  status: 'ok',
  queue_lag_ms: 42
};

const initScript = `
  (() => {
    const track = { stop: () => {} };
    const stream = {
      getTracks: () => [track],
      getVideoTracks: () => [track]
    };
    navigator.mediaDevices = navigator.mediaDevices || {};
    navigator.mediaDevices.getUserMedia = () => Promise.resolve(stream);
    HTMLMediaElement.prototype.play = () => Promise.resolve();
    HTMLCanvasElement.prototype.getContext = () => ({
      drawImage: () => {},
      font: '',
      textBaseline: 'bottom',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      fillText: () => {},
      strokeText: () => {}
    });
    HTMLCanvasElement.prototype.toDataURL = () => 'data:image/jpeg;base64,ZmFrZQ==';
  })();
`;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(initScript);
});

test('theme toggle persists across reloads', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: /toggle theme mode/i });
  await toggle.click();
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('themeMode'))).toBe('light');
  await page.reload();
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('themeMode'))).toBe('light');
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(background).toBe('rgb(255, 255, 255)');
});

test('attendance event updates status and uploads photo', async ({ page }) => {
  let photoUploaded = false;

  await page.route('**/api/attendances**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(initialAttendancePayload)
    });
  });

  await page.route('**/api/health**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(healthPayload)
    });
  });

  await page.route('**/api/attendances/*/photo', (route) => {
    photoUploaded = true;
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/');
  await expect(page.getByText(/SIAP TAP/i)).toBeVisible();

  await page.evaluate(() => {
    const store = (window as unknown as { __kioskStore__?: any }).__kioskStore__;
    if (!store) {
      throw new Error('Store bridge missing');
    }
    store.getState().pushAttendance(
      {
        id: 2,
        name: 'Jane Doe',
        type: 'in',
        tapTime: new Date().toISOString(),
        device: 'Kiosk Utama',
        course: 'Warga'
      },
      35
    );
  });

  await page.evaluate(async () => {
    const bridge = window as unknown as { __captureAndUpload__?: (id: number) => Promise<void> };
    if (!bridge.__captureAndUpload__) {
      throw new Error('Capture bridge missing');
    }
    await bridge.__captureAndUpload__(2);
  });

  await expect(page.getByText(/SUDAH TERABSEN/i)).toBeVisible();
  await expect(page.getByText('Jane Doe')).toBeVisible();
  await expect.poll(() => photoUploaded).toBe(true);
});
