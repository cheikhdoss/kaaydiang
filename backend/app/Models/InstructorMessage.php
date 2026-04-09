<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InstructorMessage extends Model
{
    protected $fillable = [
        'instructor_id',
        'student_id',
        'course_id',
        'message',
        'sender_role',
    ];

    public function instructor()
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
