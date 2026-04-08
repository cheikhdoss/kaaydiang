<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    protected $fillable = [
        'title',
        'content',
        'video_url',
        'chapter_id',
        'order',
        'duration',
        'is_free',
    ];

    protected $casts = [
        'is_free' => 'boolean',
    ];

    public function chapter()
    {
        return $this->belongsTo(Chapter::class);
    }

    public function progressEntries()
    {
        return $this->hasMany(LessonProgress::class);
    }
}
