<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Daily attendance report
     */
    public function daily(Request $request)
    {
        return response()->json(['message' => 'Daily report - to be implemented']);
    }

    /**
     * Export attendance data
     */
    public function export(Request $request)
    {
        return response()->json(['message' => 'Export report - to be implemented']);
    }
}
