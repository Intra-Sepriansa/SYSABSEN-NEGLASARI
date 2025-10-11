<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;

class NotificationChannel extends Model
{
    protected $fillable = [
        'name',
        'type',
        'credentials',
        'settings',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'credentials' => 'array',
            'settings' => 'array',
        ];
    }

    /**
     * Get the notification logs for the channel.
     */
    public function notificationLogs(): HasMany
    {
        return $this->hasMany(NotificationLog::class);
    }

    /**
     * Get the user notification preferences.
     */
    public function userNotificationPrefs(): HasMany
    {
        return $this->hasMany(UserNotificationPref::class);
    }

    /**
     * Get decrypted credentials.
     */
    public function getDecryptedCredentials(): array
    {
        return Crypt::decrypt($this->credentials);
    }

    /**
     * Set encrypted credentials.
     */
    public function setCredentialsAttribute(array $value): void
    {
        $this->attributes['credentials'] = Crypt::encrypt($value);
    }

    /**
     * Check if channel is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Scope for active channels.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
