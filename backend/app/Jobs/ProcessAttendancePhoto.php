<?php

namespace App\Jobs;

use App\Models\Attendance;
use App\Models\AttendancePhoto;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ProcessAttendancePhoto implements ShouldQueue
{
    use Queueable;

    public Attendance $attendance;
    public string $imageData;
    public string $originalBase64;

    /**
     * Create a new job instance.
     */
    public function __construct(Attendance $attendance, string $imageData, string $originalBase64)
    {
        $this->attendance = $attendance;
        $this->imageData = $imageData;
        $this->originalBase64 = $originalBase64;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Create filename with random name for security
            $filename = Str::random(40) . '.jpg';
            $storagePath = 'photos/' . date('Y/m/d') . '/' . $filename;

            // Process image with Intervention Image
            $manager = new ImageManager(new Driver());
            $image = $manager->read($this->imageData);

            // Resize if too large (max 800px)
            $image->scaleDown(width: 800, height: 800);

            // Strip EXIF data and re-encode as JPEG
            $processedImage = $image->toJpeg(85); // 85% quality

            // Get dimensions
            $width = $image->width();
            $height = $image->height();

            // Upload to S3/MinIO
            Storage::disk('s3')->put($storagePath, $processedImage);

            // Create attendance photo record
            AttendancePhoto::create([
                'attendance_id' => $this->attendance->id,
                'filename' => $filename,
                'original_name' => 'attendance_' . $this->attendance->id . '_' . time() . '.jpg',
                'mime_type' => 'image/jpeg',
                'file_size' => strlen($processedImage),
                'dimensions' => ['width' => $width, 'height' => $height],
                'storage_path' => $storagePath,
            ]);

            Log::info('Attendance photo processed successfully', [
                'attendance_id' => $this->attendance->id,
                'filename' => $filename,
                'storage_path' => $storagePath,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to process attendance photo', [
                'attendance_id' => $this->attendance->id,
                'error' => $e->getMessage(),
            ]);

            // Create error record
            AttendancePhoto::create([
                'attendance_id' => $this->attendance->id,
                'filename' => 'error_' . Str::random(20),
                'original_name' => 'error.jpg',
                'mime_type' => 'image/jpeg',
                'file_size' => 0,
                'dimensions' => ['width' => 0, 'height' => 0],
                'storage_path' => 'photos/errors/' . Str::random(20) . '.txt',
            ]);

            throw $e;
        }
    }
}
