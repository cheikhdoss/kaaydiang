<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\Lesson;
use Illuminate\Http\Request;

class LessonManagementController extends Controller
{
    public function store(Request $request, Chapter $chapter)
    {
        $user = $request->user();

        if ($chapter->course?->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only add lessons to your chapters.'], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'video_url' => ['nullable', 'string', 'max:2048'],
            'order' => ['nullable', 'integer', 'min:0'],
            'duration' => ['nullable', 'integer', 'min:0'],
            'is_free' => ['nullable', 'boolean'],
        ]);

        $lesson = Lesson::query()->create([
            'chapter_id' => $chapter->id,
            'title' => $validated['title'],
            'content' => $validated['content'] ?? null,
            'video_url' => $validated['video_url'] ?? null,
            'order' => $validated['order'] ?? 0,
            'duration' => $validated['duration'] ?? 0,
            'is_free' => $validated['is_free'] ?? false,
        ]);

        return response()->json($lesson, 201);
    }

    public function update(Request $request, Lesson $lesson)
    {
        $user = $request->user();

        if ($lesson->chapter?->course?->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only edit your lessons.'], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'video_url' => ['nullable', 'string', 'max:2048'],
            'order' => ['sometimes', 'integer', 'min:0'],
            'duration' => ['sometimes', 'integer', 'min:0'],
            'is_free' => ['sometimes', 'boolean'],
        ]);

        $lesson->update($validated);

        return response()->json($lesson);
    }

    public function destroy(Request $request, Lesson $lesson)
    {
        $user = $request->user();

        if ($lesson->chapter?->course?->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only delete your lessons.'], 403);
        }

        $lesson->delete();

        return response()->json(['message' => 'Lesson deleted successfully.']);
    }
}
