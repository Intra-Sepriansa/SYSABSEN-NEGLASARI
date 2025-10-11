<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;

class Device extends Model
{
    use HasApiTokens;
    protected $fillable = [
        'name',
        'location',
        'device_key_hash',
        'status',
        'settings_json',
        'last_ip',
        'last_seen_at',
    ];

    protected function casts(): array
    {
        return [
            'settings_json' => 'array',
            'last_seen_at' => 'datetime',
        ];
    }

    /**
     * Get the attendances for the device.
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * Get the audit logs for the device.
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'device_id');
    }

    /**
     * Set the device key (hashed).
     */
    public function setDeviceKeyAttribute(string $value): void
    {
        $this->attributes['device_key_hash'] = Hash::make($value);
    }

    /**
     * Verify device key.
     */
    public function verifyDeviceKey(string $key): bool
    {
        return Hash::check($key, $this->device_key_hash);
    }

    /**
     * Check if device is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Scope for active devices.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Update last seen timestamp.
     */
    public function updateLastSeen(string $ip = null): void
    {
        $this->update([
            'last_seen_at' => now(),
            'last_ip' => $ip,
        ]);
    }
}
