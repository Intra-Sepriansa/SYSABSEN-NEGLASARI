<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNotificationPref extends Model
{
    protected $fillable = [
        'user_id',
        'notification_channel_id',
        'contact_value',
        'event_preferences',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'event_preferences' => 'array',
        ];
    }

    /**
     * Get the user that owns the notification preference.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the notification channel.
     */
    public function notificationChannel(): BelongsTo
    {
        return $this->belongsTo(NotificationChannel::class);
    }

    /**
     * Check if preference is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if event type is enabled.
     */
    public function isEventEnabled(string $eventType): bool
    {
        return in_array($eventType, $this->event_preferences);
    }

    /**
     * Scope for active preferences.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
