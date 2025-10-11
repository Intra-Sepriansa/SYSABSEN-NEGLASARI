<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\NotificationTemplate;

class TemplateRenderer
{
    /**
     * Render template with attendance data
     */
    public function render(NotificationTemplate $template, Attendance $attendance, array $additionalData = []): array
    {
        $variables = $this->prepareVariables($attendance, $additionalData);
        
        $subject = $this->renderString($template->subject ?? '', $variables);
        $body = $this->renderString($template->body, $variables);

        return [
            'subject' => $subject,
            'body' => $body,
        ];
    }

    /**
     * Render string with variables
     */
    private function renderString(string $template, array $variables): string
    {
        return preg_replace_callback('/\{\{(\w+)\}\}/', function ($matches) use ($variables) {
            $key = $matches[1];
            return $variables[$key] ?? $matches[0]; // Return original if variable not found
        }, $template);
    }

    /**
     * Prepare variables for template rendering
     */
    private function prepareVariables(Attendance $attendance, array $additionalData = []): array
    {
        $user = $attendance->user;
        $device = $attendance->device;
        $photo = $attendance->photo;

        $variables = [
            'name' => $this->sanitize($user->name),
            'time' => $attendance->tap_time->format('H:i:s'),
            'date' => $attendance->tap_time->format('d/m/Y'),
            'datetime' => $attendance->tap_time->format('d/m/Y H:i:s'),
            'type' => $this->getTypeText($attendance->type),
            'status_flag' => $this->getStatusFlagText($attendance->status_flag),
            'device_name' => $this->sanitize($device->name),
            'device_location' => $this->sanitize($device->location ?? ''),
            'photo_url_signed' => $photo ? $photo->getSignedUrl() : '',
        ];

        // Merge additional data
        $variables = array_merge($variables, $additionalData);

        // Sanitize all string values
        foreach ($variables as $key => $value) {
            if (is_string($value)) {
                $variables[$key] = $this->sanitize($value);
            }
        }

        return $variables;
    }

    /**
     * Get human readable type text
     */
    private function getTypeText(string $type): string
    {
        return match($type) {
            'in' => 'Masuk',
            'out' => 'Keluar',
            'auto' => 'Otomatis',
            default => ucfirst($type)
        };
    }

    /**
     * Get human readable status flag text
     */
    private function getStatusFlagText(string $statusFlag): string
    {
        return match($statusFlag) {
            'ontime' => 'Tepat Waktu',
            'late' => 'Terlambat',
            'early_leave' => 'Pulang Lebih Awal',
            default => ucfirst($statusFlag)
        };
    }

    /**
     * Sanitize string to prevent XSS
     */
    private function sanitize(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }
}
