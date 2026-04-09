<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InstructorConversationRead extends Model
{
    protected $fillable = [
        'instructor_id',
        'student_id',
        'last_read_at',
    ];

    protected $casts = [
        'last_read_at' => 'datetime',
    ];
}
