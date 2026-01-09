<p align="center">
  <img src="backend/public/jasinga.jpg" alt="Logo Kelurahan Neglasari" width="120" height="120">
</p>

<h1 align="center">SysAbsensi - Kelurahan Neglasari</h1>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=16&duration=3200&pause=900&color=0EA5E9&center=true&vCenter=true&width=720&lines=Absensi+RFID+real-time+untuk+Kelurahan+Neglasari;Kiosk+mode+dan+admin+panel+di+satu+domain;Laravel+12+%7C+Filament+3+%7C+Vite+7">
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/Status-Active-22c55e?style=flat">
  <img alt="Admin" src="https://img.shields.io/badge/Admin-Filament-0ea5e9?style=flat&logo=laravel&logoColor=white">
  <img alt="Mode" src="https://img.shields.io/badge/Mode-Kiosk-f97316?style=flat">
  <img alt="Realtime" src="https://img.shields.io/badge/Realtime-Pusher-8b5cf6?style=flat&logo=pusher&logoColor=white">
</p>

Laravel 12 monolith for the attendance system used by Kelurahan Neglasari. The application bundles the Filament v3 admin panel and a kiosk mode that runs on the same domain to avoid CORS complexity.

## Tech Stack

![PHP](https://img.shields.io/badge/PHP-8.3%2B-777BB4?style=flat&logo=php&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?style=flat&logo=laravel&logoColor=white)
![Filament](https://img.shields.io/badge/Filament-3.2-0f172a?style=flat&logo=laravel&logoColor=white)
![Livewire](https://img.shields.io/badge/Livewire-3-FB70A9?style=flat&logo=livewire&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Alpine.js](https://img.shields.io/badge/Alpine.js-3.14-8BC0D0?style=flat&logo=alpinedotjs&logoColor=white)
![Pusher JS](https://img.shields.io/badge/Pusher_JS-8.4-300D4F?style=flat&logo=pusher&logoColor=white)
![Laravel Echo](https://img.shields.io/badge/Laravel_Echo-2.2-3B82F6?style=flat&logo=laravel&logoColor=white)
![Animate.css](https://img.shields.io/badge/Animate.css-4.1-FF6F61?style=flat&logo=css3&logoColor=white)

## Experience

![UI](https://img.shields.io/badge/UI-Filament-0ea5e9?style=flat)
![Responsive](https://img.shields.io/badge/Responsive-Yes-22c55e?style=flat)
![Theme](https://img.shields.io/badge/Theme-Dark%2FLight-0f172a?style=flat)
![Animation](https://img.shields.io/badge/Animation-Animate.css-f97316?style=flat)
![Kiosk](https://img.shields.io/badge/Kiosk-Mode-ef4444?style=flat)
![RFID](https://img.shields.io/badge/RFID-Tap-10b981?style=flat)
![Webcam](https://img.shields.io/badge/Webcam-Capture-14b8a6?style=flat)
![Realtime](https://img.shields.io/badge/Realtime-Broadcasting-8b5cf6?style=flat)

## Features

- **Filament Admin** with navigation grouped as Dashboard, Data Master, Absensi, Laporan, Notifikasi, Audit & Keamanan, dan Pengaturan.
- **RFID tap endpoint** for kiosks/devices with hashed API token validation and rate limiting.
- **Real-time broadcasting** via Pusher + Laravel Echo to update the kiosk display instantly.
- **Kiosk view** (Blade + Vanilla JS) supporting dark/light theme toggle through `?theme=` query.
- **Automatic webcam capture** after each tap and photo upload to the backend.
- **Spatie Laravel Settings** to manage general branding and kiosk preferences from the admin UI.
- **Seed data** for admin credentials, sample device, users, cards, and default settings.

## Getting Started

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
npm install
npm run dev
php artisan serve
```

### Default Accounts and Device

| Type   | Credential / Token              |
|--------|---------------------------------|
| Admin  |                                 |
| Device | Generated token printed after seeding |

Run `php artisan db:seed` again if you need to regenerate the sample device token.

## Environment Notes

- Configure Pusher credentials inside `.env` (`BROADCAST_DRIVER=pusher`).
- Set `FILESYSTEM_DISK=public` to store kiosk photos under `storage/app/public/attendance/*`.
- Update `APP_URL` to the domain where both admin and kiosk will run.

## Kiosk URL

The kiosk interface is available at `http://your-app.test/kiosk`. Append `?theme=light` or `?theme=dark` to override the default theme stored in settings.

## Tests and Quality

- Run `php artisan test` for backend tests.
- Use Filament for manual QA on admin features (`php artisan serve` -> `/admin`).

## Deployment Checklist

1. Configure queue workers for broadcasting and photo processing if you switch to queued broadcasting.
2. Ensure `storage:link` is executed on the server.
3. Set up HTTPS so the kiosk can access webcam streams (browser requirement).
4. Update `config/cors.php` if the kiosk will be embedded in a different origin.
