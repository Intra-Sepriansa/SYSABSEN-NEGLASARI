<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendancePhoto extends Model
{
    protected $fillable = [
        'attendance_id',
        'filename',
        'original_name',
        'mime_type',
        'file_size',
        'dimensions',
        'storage_path',
    ];

    protected function casts(): array
    {
        return [
            'dimensions' => 'array',
        ];
    }

    /**
     * Get the attendance that owns the photo.
     */
    public function attendance(): BelongsTo
    {
        return $this->belongsTo(Attendance::class);
    }

    /**
     * Get the photo URL.
     */
    public function getUrlAttribute(): string
    {
        return \Storage::disk('s3')->url($this->storage_path);
    }

    /**
     * Get signed URL for photo access.
     */
    public function getSignedUrl(int $expirationMinutes = 10): string
    {
        return \Storage::disk('s3')->temporaryUrl(
            $this->storage_path,
            now()->addMinutes($expirationMinutes)
        );
    }
}
