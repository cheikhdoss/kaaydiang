<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;

class CourseManagementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $courses = Course::query()
            ->where('instructor_id', $user->id)
            ->withCount('chapters')
            ->latest()
            ->get();

        return response()->json($courses);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'level' => ['nullable', 'in:beginner,intermediate,advanced'],
            'price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $course = Course::query()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'level' => $validated['level'] ?? 'beginner',
            'price' => $validated['price'] ?? 0,
            'is_published' => false,
            'instructor_id' => $user->id,
        ]);

        return response()->json($course, 201);
    }

    public function update(Request $request, Course $course)
    {
        $user = $request->user();

        if ($course->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only edit your courses.'], 403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'level' => ['sometimes', 'in:beginner,intermediate,advanced'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'is_published' => ['sometimes', 'boolean'],
        ]);

        $course->update($validated);

        return response()->json($course);
    }

    public function destroy(Request $request, Course $course)
    {
        $user = $request->user();

        if ($course->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only delete your courses.'], 403);
        }

        $course->delete();

        return response()->json(['message' => 'Course deleted successfully.']);
    }
}
