<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create superadmin user
        $superadmin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@sysabsen.com',
            'password' => bcrypt('password123'),
            'role' => 'superadmin',
            'status' => 'active',
            'phone' => '08123456789',
            'email_verified_at' => now(),
        ]);

        // Create default shift (Senin-Jumat 08:00-17:00)
        $shift = \App\Models\Shift::create([
            'name' => 'Shift Pagi',
            'start_time' => '08:00:00',
            'end_time' => '17:00:00',
            'tolerance_minutes' => 15,
            'working_days' => [1, 2, 3, 4, 5], // Senin-Jumat
            'status' => 'active',
        ]);

        // Create default device
        $device = \App\Models\Device::create([
            'name' => 'Device Kiosk Utama',
            'location' => 'Lobby Gedung A',
            'device_key_hash' => bcrypt('device123'),
            'status' => 'active',
            'last_seen_at' => now(),
        ]);

        // Create notification channels
        $whatsappChannel = \App\Models\NotificationChannel::create([
            'name' => 'WhatsApp Gateway',
            'type' => 'whatsapp',
            'credentials' => \Illuminate\Support\Facades\Crypt::encrypt([
                'api_url' => 'https://api.whatsapp.com',
                'token' => 'your_whatsapp_token',
            ]),
            'settings' => [
                'rate_limit' => 100,
                'timeout' => 30,
            ],
            'status' => 'active',
        ]);

        $telegramChannel = \App\Models\NotificationChannel::create([
            'name' => 'Telegram Bot',
            'type' => 'telegram',
            'credentials' => \Illuminate\Support\Facades\Crypt::encrypt([
                'bot_token' => 'your_telegram_bot_token',
                'chat_id' => 'your_chat_id',
            ]),
            'settings' => [
                'rate_limit' => 30,
                'timeout' => 30,
            ],
            'status' => 'active',
        ]);

        // Create notification templates
        \App\Models\NotificationTemplate::create([
            'name' => 'Template Masuk',
            'event_type' => 'attendance_in',
            'subject' => 'Absensi Masuk',
            'body' => 'Halo {{name}}, Anda telah melakukan absensi masuk pada {{time}} di {{device_name}}. Status: {{status_flag}}',
            'variables' => ['name', 'time', 'device_name', 'status_flag'],
            'status' => 'active',
        ]);

        \App\Models\NotificationTemplate::create([
            'name' => 'Template Keluar',
            'event_type' => 'attendance_out',
            'subject' => 'Absensi Keluar',
            'body' => 'Halo {{name}}, Anda telah melakukan absensi keluar pada {{time}} di {{device_name}}. Terima kasih!',
            'variables' => ['name', 'time', 'device_name'],
            'status' => 'active',
        ]);

        \App\Models\NotificationTemplate::create([
            'name' => 'Template Terlambat',
            'event_type' => 'late_arrival',
            'subject' => 'Absensi Terlambat',
            'body' => 'Halo {{name}}, Anda terlambat melakukan absensi masuk pada {{time}} di {{device_name}}. Status: {{status_flag}}',
            'variables' => ['name', 'time', 'device_name', 'status_flag'],
            'status' => 'active',
        ]);

        $this->command->info('Database seeded successfully!');
        $this->command->info('Superadmin: admin@sysabsen.com / password123');
        $this->command->info('Device Key: device123');
    }
}
