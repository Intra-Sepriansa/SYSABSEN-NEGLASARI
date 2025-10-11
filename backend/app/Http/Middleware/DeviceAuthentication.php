<?php

namespace App\Http\Middleware;

use App\Models\Device;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DeviceAuthentication
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $deviceId = $request->header('X-Device-ID');
        $deviceKey = $request->header('X-Device-Key');

        if (!$deviceId || !$deviceKey) {
            return response()->json([
                'message' => 'Device ID and Device Key are required'
            ], 401);
        }

        $device = Device::where('id', $deviceId)
            ->where('status', 'active')
            ->first();

        if (!$device) {
            return response()->json([
                'message' => 'Invalid device ID'
            ], 401);
        }

        if (!$device->verifyDeviceKey($deviceKey)) {
            return response()->json([
                'message' => 'Invalid device key'
            ], 401);
        }

        // Update device last seen
        $device->updateLastSeen($request->ip());

        // Add device to request for use in controllers
        $request->merge(['device' => $device]);

        return $next($request);
    }
}
