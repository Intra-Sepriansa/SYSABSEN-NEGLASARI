<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MasterDataController extends Controller
{
    /**
     * Users management
     */
    public function users()
    {
        return response()->json(['message' => 'Users management - to be implemented']);
    }

    /**
     * RFID Cards management
     */
    public function rfidCards()
    {
        return response()->json(['message' => 'RFID Cards management - to be implemented']);
    }

    /**
     * Devices management
     */
    public function devices()
    {
        return response()->json(['message' => 'Devices management - to be implemented']);
    }

    /**
     * Shifts management
     */
    public function shifts()
    {
        return response()->json(['message' => 'Shifts management - to be implemented']);
    }
}
