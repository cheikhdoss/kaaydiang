<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\LogsActivity;
use App\Models\ActivityLog;
use App\Models\Course;
use Illuminate\Http\Request;

class CourseManagementController extends Controller
{
    use LogsActivity;
    public function show(Request $request, Course $course)
    {
        $user = $request->user();

        if ($course->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only view your courses.'], 403);
        }

        $course->load([
            'chapters' => function ($chapterQuery) {
                $chapterQuery
                    ->select(
                        'id',
                        'course_id',
                        'title',
                        'description',
                        'order',
                        'asset_type',
                        'asset_path',
                        'asset_original_name',
                        'asset_mime_type',
                        'asset_size'
                    )
                    ->orderBy('order')
                    ->with([
                        'lessons' => function ($lessonQuery) {
                            $lessonQuery
                                ->select('id', 'chapter_id', 'title', 'content', 'blocks', 'video_url', 'duration', 'order', 'is_free')
                                ->orderBy('order');
                        },
                    ]);
            },
        ]);

        return response()->json([
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'thumbnail' => $course->thumbnail,
            'level' => $course->level,
            'price' => $course->price,
            'is_published' => (bool) $course->is_published,
            'chapters_count' => $course->chapters->count(),
            'chapters' => $course->chapters->map(function ($chapter) {
                return [
                    'id' => $chapter->id,
                    'title' => $chapter->title,
                    'description' => $chapter->description,
                    'order' => (int) $chapter->order,
                    'asset_type' => $chapter->asset_type,
                    'asset_path' => $chapter->asset_path,
                    'asset_url' => $chapter->asset_url,
                    'asset_original_name' => $chapter->asset_original_name,
                    'asset_mime_type' => $chapter->asset_mime_type,
                    'asset_size' => $chapter->asset_size !== null ? (int) $chapter->asset_size : null,
                    'lessons' => $chapter->lessons->map(function ($lesson) {
                        $normalizedBlocks = collect($lesson->blocks ?? [])
                            ->map(function ($block) {
                                if (($block['type'] ?? null) !== 'pdf') {
                                    return $block;
                                }

                                if (!empty($block['pdf_url']) || empty($block['pdf_path'])) {
                                    return $block;
                                }

                                $block['pdf_url'] = asset('storage/'.$block['pdf_path']);

                                return $block;
                            })
                            ->values()
                            ->all();

                        return [
                            'id' => $lesson->id,
                            'title' => $lesson->title,
                            'description' => $lesson->content,
                            'video_url' => $lesson->video_url,
                            'blocks' => $normalizedBlocks,
                            'duration' => (int) $lesson->duration,
                            'order' => (int) $lesson->order,
                            'is_free' => (bool) $lesson->is_free,
                        ];
                    })->values(),
                ];
            })->values(),
        ]);
    }

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
            'thumbnail' => ['nullable', 'image', 'max:2048'], // Max 2MB
        ]);

        $thumbnailPath = null;
        if ($request->hasFile('thumbnail')) {
            $thumbnailPath = $request->file('thumbnail')->store('thumbnails', 'public');
        }

        $course = Course::query()->create([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'level' => $validated['level'] ?? 'beginner',
            'price' => $validated['price'] ?? 0,
            'thumbnail' => $thumbnailPath,
            'is_published' => false,
            'instructor_id' => $user->id,
        ]);

        $this->logActivity('course.created', "Instructeur a créé le cours: {$course->title}", [
            'model_type' => Course::class,
            'model_id' => $course->id,
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
            'is_published' => ['sometimes', 'boolean', 'nullable'],
            'thumbnail' => ['nullable', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('thumbnail')) {
            // Optionnel : Supprimer l'ancienne image si nécessaire
            // if ($course->thumbnail) Storage::disk('public')->delete($course->thumbnail);
            $validated['thumbnail'] = $request->file('thumbnail')->store('thumbnails', 'public');
        }

        $wasPublished = $course->is_published;
        $course->update($validated);

        if (!$wasPublished && (bool) $course->is_published) {
            $this->logActivity('course.published', "Instructeur a publié le cours: {$course->title}", [
                'model_type' => Course::class,
                'model_id' => $course->id,
            ]);
        } elseif ($wasPublished && !(bool) $course->is_published) {
            $this->logActivity('course.unpublished', "Instructeur a dépublié le cours: {$course->title}", [
                'model_type' => Course::class,
                'model_id' => $course->id,
            ]);
        }

        return response()->json($course);
    }

    public function destroy(Request $request, Course $course)
    {
        $user = $request->user();

        if ($course->instructor_id !== $user->id) {
            return response()->json(['message' => 'You can only delete your courses.'], 403);
        }

        $title = $course->title;
        $course->delete();

        $this->logActivity('course.deleted', "Instructeur a supprimé le cours: {$title}", [
            'model_type' => Course::class,
            'properties' => ['course_title' => $title],
        ]);

        return response()->json(['message' => 'Course deleted successfully.']);
    }
}
