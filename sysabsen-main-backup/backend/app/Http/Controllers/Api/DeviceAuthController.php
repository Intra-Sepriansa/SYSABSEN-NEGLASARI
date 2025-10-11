<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DeviceAuthController extends Controller
{
    /**
     * Authenticate device and return Sanctum token
     */
    public function authenticate(Request $request)
    {
        $request->validate([
            'device_key' => 'required|string',
        ]);

        $deviceKey = $request->input('device_key');

        // Find device by verifying the key
        $device = \App\Models\Device::where('status', 'active')->get()
            ->first(fn($d) => $d->verifyDeviceKey($deviceKey));

        if (!$device) {
            return response()->json([
                'message' => 'Invalid device key'
            ], 401);
        }

        // Update device last seen
        $device->updateLastSeen($request->ip());

        // Create token for device with 'device' scope
        $token = $device->createToken('device-token', ['device']);

        return response()->json([
            'access_token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'device' => [
                'id' => $device->id,
                'name' => $device->name,
                'location' => $device->location,
            ]
        ]);
    }
}
