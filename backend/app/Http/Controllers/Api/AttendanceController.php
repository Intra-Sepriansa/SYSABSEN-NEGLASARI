<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TapAttendanceRequest;
use App\Http\Requests\UploadPhotoRequest;
use App\Models\Attendance;
use App\Services\AttendanceService;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    protected AttendanceService $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        $this->attendanceService = $attendanceService;
    }

    /**
     * Handle RFID card tap
     */
    public function tap(TapAttendanceRequest $request)
    {
        $data = $request->validated();
        
        // Get device from request (set by DeviceAuthentication middleware)
        $device = $request->input('device');
        
        try {
            $attendance = $this->attendanceService->processTap($data, $device);
            
            return response()->json([
                'message' => 'Attendance recorded successfully',
                'attendance' => [
                    'id' => $attendance->id,
                    'type' => $attendance->type,
                    'status_flag' => $attendance->status_flag,
                    'tap_time' => $attendance->tap_time,
                    'user' => [
                        'id' => $attendance->user->id,
                        'name' => $attendance->user->name,
                    ]
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to process attendance',
                'error' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Upload attendance photo
     */
    public function uploadPhoto(UploadPhotoRequest $request, Attendance $attendance)
    {
        $data = $request->validated();
        
        try {
            $photo = $this->attendanceService->processPhoto($attendance, $data);
            
            return response()->json([
                'message' => 'Photo uploaded successfully',
                'photo' => [
                    'id' => $photo->id,
                    'signed_url' => $photo->getSignedUrl(),
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to upload photo',
                'error' => $e->getMessage()
            ], 400);
        }
    }
}
