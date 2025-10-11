<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shift extends Model
{
    protected $fillable = [
        'name',
        'start_time',
        'end_time',
        'tolerance_minutes',
        'working_days',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime:H:i',
            'end_time' => 'datetime:H:i',
            'working_days' => 'array',
        ];
    }

    /**
     * Get the user shift mappings.
     */
    public function userShiftMaps(): HasMany
    {
        return $this->hasMany(UserShiftMap::class);
    }

    /**
     * Check if shift is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if today is a working day.
     */
    public function isWorkingDay(): bool
    {
        $today = now()->dayOfWeek;
        return in_array($today, $this->working_days);
    }

    /**
     * Get working days as human readable.
     */
    public function getWorkingDaysTextAttribute(): string
    {
        $days = [
            1 => 'Senin',
            2 => 'Selasa', 
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
            7 => 'Minggu',
        ];

        return collect($this->working_days)
            ->map(fn($day) => $days[$day] ?? 'Unknown')
            ->implode(', ');
    }

    /**
     * Scope for active shifts.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
