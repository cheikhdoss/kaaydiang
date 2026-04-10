<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemActivityLog;
use Illuminate\Http\Request;

class SystemActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min(max((int) $request->query('per_page', 25), 1), 100);

        $logs = SystemActivityLog::query()
            ->with(['user:id,first_name,last_name,email,role'])
            ->latest()
            ->paginate($perPage);

        return response()->json($logs);
    }
}
