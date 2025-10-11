<?php

namespace App\Services;

use App\Events\AttendanceRecorded;
use App\Jobs\DispatchAttendanceNotifications;
use App\Jobs\ProcessAttendancePhoto;
use App\Models\Attendance;
use App\Models\AttendancePhoto;
use App\Models\Device;
use App\Models\RfidCard;
use App\Models\User;
use App\Models\UserShiftMap;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class AttendanceService
{
    /**
     * Process RFID card tap and create attendance record
     */
    public function processTap(array $data, Device $device): Attendance
    {
        $cardUid = $data['card_uid'];
        $clientTime = $data['ts_client'] ?? null;
        $tapTime = now();

        // Check for duplicate tap (debounce with Redis)
        $duplicateKey = "tap_debounce:{$device->id}:{$cardUid}";
        if (Redis::exists($duplicateKey)) {
            throw new \Exception('Duplicate tap detected. Please wait before tapping again.');
        }

        // Set debounce key with 3 second TTL
        Redis::setex($duplicateKey, 3, '1');

        // Lookup user from card_uid (with cache)
        $user = $this->lookupUserFromCard($cardUid);
        if (!$user) {
            throw new \Exception('Invalid RFID card');
        }

        // Verify user is active
        if (!$user->isActive()) {
            throw new \Exception('User account is inactive');
        }

        // Determine attendance type (IN/OUT/AUTO)
        $type = $this->determineAttendanceType($user, $device, $tapTime);

        // Determine status flag (ontime/late/early_leave)
        $statusFlag = $this->determineStatusFlag($user, $tapTime, $type);

        // Create attendance record
        $attendance = Attendance::create([
            'user_id' => $user->id,
            'device_id' => $device->id,
            'card_uid' => $cardUid,
            'type' => $type,
            'status_flag' => $statusFlag,
            'tap_time' => $tapTime,
            'client_time' => $clientTime ? Carbon::parse($clientTime) : null,
            'metadata' => [
                'device_name' => $device->name,
                'device_location' => $device->location,
                'ip_address' => request()->ip(),
            ]
        ]);

        // Fire event for realtime broadcasting
        event(new AttendanceRecorded($attendance));

        // Dispatch notification job
        DispatchAttendanceNotifications::dispatch($attendance);

        return $attendance;
    }

    /**
     * Process attendance photo upload
     */
    public function processPhoto(Attendance $attendance, array $data): AttendancePhoto
    {
        $imageBase64 = $data['image_base64'];
        
        // Extract base64 data
        $base64 = substr($imageBase64, strpos($imageBase64, ',') + 1);
        $decoded = base64_decode($base64);
        
        // Dispatch photo processing job
        ProcessAttendancePhoto::dispatch($attendance, $decoded, $imageBase64);

        // Return temporary response (job will update this)
        return new AttendancePhoto([
            'attendance_id' => $attendance->id,
            'filename' => 'processing_' . Str::random(40),
            'mime_type' => 'image/jpeg',
            'file_size' => strlen($decoded),
            'dimensions' => ['width' => 0, 'height' => 0],
            'storage_path' => 'photos/processing/' . Str::random(40) . '.jpg',
        ]);
    }

    /**
     * Lookup user from card_uid with Redis cache
     */
    private function lookupUserFromCard(string $cardUid): ?User
    {
        $cacheKey = "card_user:{$cardUid}";
        
        // Try cache first
        $userId = Cache::remember($cacheKey, 3600, function () use ($cardUid) {
            $card = RfidCard::active()
                ->where('card_uid', $cardUid)
                ->with('user')
                ->first();
            
            return $card?->user_id;
        });

        if (!$userId) {
            return null;
        }

        return User::find($userId);
    }

    /**
     * Determine attendance type (IN/OUT/AUTO)
     */
    private function determineAttendanceType(User $user, Device $device, Carbon $tapTime): string
    {
        // Check if user has any attendance today
        $todayAttendance = Attendance::forUser($user->id)
            ->today()
            ->orderBy('tap_time', 'desc')
            ->first();

        if (!$todayAttendance) {
            return 'in'; // First tap of the day
        }

        // If last attendance was OUT, this must be IN
        if ($todayAttendance->type === 'out') {
            return 'in';
        }

        // If last attendance was IN, this must be OUT
        if ($todayAttendance->type === 'in') {
            return 'out';
        }

        // Default to auto detection
        return 'auto';
    }

    /**
     * Determine status flag (ontime/late/early_leave)
     */
    private function determineStatusFlag(User $user, Carbon $tapTime, string $type): string
    {
        if ($type === 'in') {
            return $this->checkLateArrival($user, $tapTime);
        }

        if ($type === 'out') {
            return $this->checkEarlyLeave($user, $tapTime);
        }

        return 'ontime';
    }

    /**
     * Check if user is late for arrival
     */
    private function checkLateArrival(User $user, Carbon $tapTime): string
    {
        $shift = $this->getUserShift($user, $tapTime);
        if (!$shift) {
            return 'ontime'; // No shift defined
        }

        $expectedStart = $tapTime->copy()->setTimeFromTimeString($shift->start_time);
        $toleranceEnd = $expectedStart->copy()->addMinutes($shift->tolerance_minutes);

        if ($tapTime->gt($toleranceEnd)) {
            return 'late';
        }

        return 'ontime';
    }

    /**
     * Check if user is leaving early
     */
    private function checkEarlyLeave(User $user, Carbon $tapTime): string
    {
        $shift = $this->getUserShift($user, $tapTime);
        if (!$shift) {
            return 'ontime'; // No shift defined
        }

        $expectedEnd = $tapTime->copy()->setTimeFromTimeString($shift->end_time);
        $toleranceStart = $expectedEnd->copy()->subMinutes($shift->tolerance_minutes);

        if ($tapTime->lt($toleranceStart)) {
            return 'early_leave';
        }

        return 'ontime';
    }

    /**
     * Get user's shift for given date
     */
    private function getUserShift(User $user, Carbon $date): ?\App\Models\Shift
    {
        $shiftMap = UserShiftMap::active()
            ->where('user_id', $user->id)
            ->effectiveOn($date)
            ->with('shift')
            ->first();

        return $shiftMap?->shift;
    }
}
