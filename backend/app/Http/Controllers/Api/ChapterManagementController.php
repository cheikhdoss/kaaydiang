<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Chapter;
use App\Models\Course;
use Illuminate\Http\Request;

class ChapterManagementController extends Controller
{
    public function store(Request $request, Course $course)
    {
        $user = $request->user();

        if ($course->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only add chapters to your courses.'], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'order' => ['nullable', 'integer', 'min:0'],
        ]);

        $chapter = Chapter::query()->create([
            'course_id' => $course->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'order' => $validated['order'] ?? 0,
        ]);

        return response()->json($chapter, 201);
    }

    public function update(Request $request, Chapter $chapter)
    {
        $user = $request->user();

        if ($chapter->course?->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only edit your course chapters.'], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $chapter->update($validated);

        return response()->json($chapter);
    }

    public function destroy(Request $request, Chapter $chapter)
    {
        $user = $request->user();

        if ($chapter->course?->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only delete your course chapters.'], 403);
        }

        $chapter->delete();

        return response()->json(['message' => 'Chapter deleted successfully.']);
    }
}
