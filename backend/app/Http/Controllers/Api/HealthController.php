<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class HealthController extends Controller
{
    /**
     * Health check endpoint
     */
    public function check()
    {
        $status = [
            'db' => $this->checkDatabase(),
            'redis' => $this->checkRedis(),
            'storage' => $this->checkStorage(),
        ];

        $allHealthy = collect($status)->every(fn($healthy) => $healthy);

        return response()->json($status, $allHealthy ? 200 : 503);
    }

    /**
     * Check database connection
     */
    private function checkDatabase(): bool
    {
        try {
            \DB::connection()->getPdo();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Check Redis connection
     */
    private function checkRedis(): bool
    {
        try {
            \Redis::ping();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Check storage connection
     */
    private function checkStorage(): bool
    {
        try {
            \Storage::disk('local')->exists('health-check.txt') || 
            \Storage::disk('local')->put('health-check.txt', 'ok');
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
