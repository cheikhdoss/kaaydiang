<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Chapter extends Model
{
    protected $fillable = [
        'title',
        'description',
        'course_id',
        'order',
        'asset_type',
        'asset_path',
        'asset_original_name',
        'asset_mime_type',
        'asset_size',
    ];

    protected $appends = ['asset_url'];

    protected $casts = [
        'asset_size' => 'integer',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function lessons()
    {
        return $this->hasMany(Lesson::class)->orderBy('order');
    }

    public function lessonCount(): int
    {
        return $this->lessons()->count();
    }

    public function getAssetUrlAttribute(): ?string
    {
        if (!$this->asset_path) {
            return null;
        }

        return asset('storage/'.$this->asset_path);
    }
}
