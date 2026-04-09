<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizAnswer extends Model
{
    protected $fillable = [
        'quiz_attempt_id',
        'question_id',
        'answer_data',
        'is_correct',
        'points_earned',
    ];

    protected function casts(): array
    {
        return [
            'answer_data' => 'array',
            'is_correct' => 'boolean',
            'points_earned' => 'integer',
        ];
    }

    public function quizAttempt()
    {
        return $this->belongsTo(QuizAttempt::class);
    }

    public function question()
    {
        return $this->belongsTo(QuizQuestion::class);
    }
}
