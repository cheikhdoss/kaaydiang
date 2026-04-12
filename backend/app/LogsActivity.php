<?php

namespace App;

use App\Models\ActivityLog;

trait LogsActivity
{
    /**
     * Log an activity entry.
     */
    protected function logActivity(string $action, string $description, array $options = []): ActivityLog
    {
        return ActivityLog::log($action, $description, array_merge([
            'model_type' => $options['model_type'] ?? null,
            'model_id' => $options['model_id'] ?? null,
            'properties' => $options['properties'] ?? null,
        ], $options));
    }
}
