<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Attendance extends Model
{
    protected $fillable = [
        'user_id',
        'device_id',
        'card_uid',
        'type',
        'status_flag',
        'tap_time',
        'client_time',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'tap_time' => 'datetime',
            'client_time' => 'datetime',
            'metadata' => 'array',
        ];
    }

    /**
     * Get the user that owns the attendance.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the device that recorded the attendance.
     */
    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    /**
     * Get the attendance photo.
     */
    public function photo(): HasOne
    {
        return $this->hasOne(AttendancePhoto::class);
    }

    /**
     * Check if attendance is late.
     */
    public function isLate(): bool
    {
        return $this->status_flag === 'late';
    }

    /**
     * Check if attendance is early leave.
     */
    public function isEarlyLeave(): bool
    {
        return $this->status_flag === 'early_leave';
    }

    /**
     * Check if attendance is on time.
     */
    public function isOnTime(): bool
    {
        return $this->status_flag === 'ontime';
    }

    /**
     * Scope for today's attendances.
     */
    public function scopeToday($query)
    {
        return $query->whereDate('tap_time', today());
    }

    /**
     * Scope for user attendances.
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for device attendances.
     */
    public function scopeForDevice($query, $deviceId)
    {
        return $query->where('device_id', $deviceId);
    }
}
