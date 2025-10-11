<?php

namespace App\Jobs;

use App\Adapters\NotificationChannelAdapter;
use App\Adapters\TelegramAdapter;
use App\Adapters\WhatsAppAdapter;
use App\Models\Attendance;
use App\Models\NotificationChannel;
use App\Models\NotificationLog;
use App\Models\NotificationTemplate;
use App\Models\UserNotificationPref;
use App\Services\TemplateRenderer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class DispatchAttendanceNotifications implements ShouldQueue
{
    use Queueable;

    public Attendance $attendance;

    /**
     * Create a new job instance.
     */
    public function __construct(Attendance $attendance)
    {
        $this->attendance = $attendance;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $user = $this->attendance->user;
        
        // Get notification preferences for user
        $preferences = UserNotificationPref::active()
            ->where('user_id', $user->id)
            ->with('notificationChannel')
            ->get();

        if ($preferences->isEmpty()) {
            Log::info('No notification preferences found for user', [
                'user_id' => $user->id,
                'attendance_id' => $this->attendance->id,
            ]);
            return;
        }

        // Determine event type based on attendance
        $eventType = $this->getEventType();
        
        // Get template for this event type
        $template = NotificationTemplate::active()
            ->forEventType($eventType)
            ->first();

        if (!$template) {
            Log::warning('No notification template found for event type', [
                'event_type' => $eventType,
                'attendance_id' => $this->attendance->id,
            ]);
            return;
        }

        // Process each notification preference
        foreach ($preferences as $pref) {
            if (!$pref->isEventEnabled($eventType)) {
                continue;
            }

            $channel = $pref->notificationChannel;
            if (!$channel->isActive()) {
                continue;
            }

            $this->sendNotification($pref, $template, $channel);
        }
    }

    /**
     * Send notification via channel
     */
    private function sendNotification(
        UserNotificationPref $pref,
        NotificationTemplate $template,
        NotificationChannel $channel
    ): void {
        try {
            $adapter = $this->createAdapter($channel);
            if (!$adapter || !$adapter->isAvailable()) {
                Log::warning('Channel adapter not available', [
                    'channel_id' => $channel->id,
                    'channel_type' => $channel->type,
                ]);
                return;
            }

            // Render template
            $templateRenderer = new TemplateRenderer();
            $rendered = $templateRenderer->render($template, $this->attendance);

            // Send notification
            $result = $adapter->sendMessage($pref->contact_value, $rendered['body']);

            // Log notification
            NotificationLog::create([
                'user_id' => $this->attendance->user_id,
                'notification_channel_id' => $channel->id,
                'event_type' => $this->getEventType(),
                'contact_value' => $pref->contact_value,
                'message' => $rendered['body'],
                'status' => $result['success'] ? 'sent' : 'failed',
                'response' => $result['response'] ?? null,
                'external_id' => $result['message_id'] ?? null,
                'sent_at' => $result['success'] ? now() : null,
            ]);

            Log::info('Notification sent successfully', [
                'user_id' => $this->attendance->user_id,
                'channel_type' => $channel->type,
                'event_type' => $this->getEventType(),
                'status' => $result['success'] ? 'sent' : 'failed',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send notification', [
                'user_id' => $this->attendance->user_id,
                'channel_id' => $channel->id,
                'error' => $e->getMessage(),
            ]);

            // Log failed notification
            NotificationLog::create([
                'user_id' => $this->attendance->user_id,
                'notification_channel_id' => $channel->id,
                'event_type' => $this->getEventType(),
                'contact_value' => $pref->contact_value,
                'message' => 'Failed to send: ' . $e->getMessage(),
                'status' => 'failed',
                'response' => ['error' => $e->getMessage()],
            ]);
        }
    }

    /**
     * Create adapter instance for channel
     */
    private function createAdapter(NotificationChannel $channel): ?NotificationChannelAdapter
    {
        $credentials = $channel->getDecryptedCredentials();
        $settings = $channel->settings ?? [];

        return match($channel->type) {
            'whatsapp' => new WhatsAppAdapter($credentials, $settings),
            'telegram' => new TelegramAdapter($credentials, $settings),
            default => null,
        };
    }

    /**
     * Get event type based on attendance
     */
    private function getEventType(): string
    {
        return match($this->attendance->type) {
            'in' => $this->attendance->status_flag === 'late' ? 'late_arrival' : 'attendance_in',
            'out' => 'attendance_out',
            default => 'attendance_in',
        };
    }
}
