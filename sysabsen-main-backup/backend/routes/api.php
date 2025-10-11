<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\DeviceAuthController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\MasterDataController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ReportController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Health check endpoint
Route::get('/health', [HealthController::class, 'check']);

// Device authentication
Route::post('/devices/auth', [DeviceAuthController::class, 'authenticate']);

// User authentication
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes with Sanctum authentication
Route::middleware('auth:sanctum')->group(function () {
    
    // Attendance routes with rate limiting
    Route::middleware('throttle:tap')->group(function () {
        Route::post('/attendances/tap', [AttendanceController::class, 'tap'])
            ->middleware('scope:device,admin');
        
        Route::post('/attendances/{attendance}/photo', [AttendanceController::class, 'uploadPhoto'])
            ->middleware('scope:device,admin');
    });

    // Master data CRUD routes (policy-based)
    Route::middleware('scope:admin')->group(function () {
        // Users
        Route::apiResource('users', MasterDataController::class . '@users');
        
        // RFID Cards
        Route::apiResource('rfid-cards', MasterDataController::class . '@rfidCards');
        
        // Devices
        Route::apiResource('devices', MasterDataController::class . '@devices');
        
        // Shifts
        Route::apiResource('shifts', MasterDataController::class . '@shifts');
    });

    // Reports
    Route::middleware('scope:admin,auditor')->group(function () {
        Route::get('/reports/daily', [ReportController::class, 'daily']);
        Route::get('/reports/export', [ReportController::class, 'export']);
    });

    // Notifications management
    Route::middleware('scope:admin')->group(function () {
        // Channels
        Route::get('/notifications/channels', [NotificationController::class, 'getChannels']);
        Route::put('/notifications/channels/{channel}', [NotificationController::class, 'updateChannel']);
        
        // Templates
        Route::get('/notifications/templates', [NotificationController::class, 'getTemplates']);
        Route::put('/notifications/templates/{template}', [NotificationController::class, 'updateTemplate']);
        
        // User preferences
        Route::get('/notifications/user-prefs', [NotificationController::class, 'getUserPrefs']);
        Route::put('/notifications/user-prefs/{user}', [NotificationController::class, 'updateUserPrefs']);
        
        // Logs
        Route::get('/notifications/logs', [NotificationController::class, 'getLogs']);
        
        // Test send
        Route::post('/notifications/test-send', [NotificationController::class, 'testSend']);
    });

    // User profile
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Logout
    Route::post('/auth/logout', [AuthController::class, 'logout']);
});
