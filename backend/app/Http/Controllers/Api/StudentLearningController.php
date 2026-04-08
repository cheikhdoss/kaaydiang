<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use Illuminate\Http\Request;

class StudentLearningController extends Controller
{
    public function catalog()
    {
        $courses = Course::query()
            ->where('is_published', true)
            ->with(['instructor:id,first_name,last_name'])
            ->withCount('chapters')
            ->latest()
            ->limit(24)
            ->get()
            ->map(function (Course $course) {
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'description' => $course->description,
                    'level' => $course->level,
                    'price' => $course->price,
                    'thumbnail' => $course->thumbnail,
                    'chapters_count' => $course->chapters_count,
                    'instructor' => trim(($course->instructor?->first_name ?? '').' '.($course->instructor?->last_name ?? '')),
                ];
            })
            ->values();

        return response()->json($courses);
    }

    public function myCourses(Request $request)
    {
        $user = $request->user();

        $items = Enrollment::query()
            ->where('user_id', $user->id)
            ->with(['course:id,title,description,thumbnail,level,instructor_id,is_published'])
            ->latest('enrolled_at')
            ->get()
            ->map(function (Enrollment $enrollment) {
                $course = $enrollment->course;

                if (!$course) {
                    return null;
                }

                return [
                    'enrollment_id' => $enrollment->id,
                    'enrolled_at' => $enrollment->enrolled_at?->toISOString() ?? $enrollment->created_at?->toISOString(),
                    'course' => [
                        'id' => $course->id,
                        'title' => $course->title,
                        'description' => $course->description,
                        'thumbnail' => $course->thumbnail,
                        'level' => $course->level,
                        'is_published' => (bool) $course->is_published,
                    ],
                ];
            })
            ->filter()
            ->values();

        return response()->json($items);
    }

    public function enroll(Request $request, Course $course)
    {
        $user = $request->user();

        if (!$course->is_published) {
            return response()->json(['message' => 'Course is not available for enrollment.'], 422);
        }

        $enrollment = Enrollment::query()->firstOrCreate(
            [
                'user_id' => $user->id,
                'course_id' => $course->id,
            ],
            [
                'enrolled_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Enrollment successful',
            'enrollment' => $enrollment,
        ], $enrollment->wasRecentlyCreated ? 201 : 200);
    }

    public function markLessonCompleted(Request $request, Lesson $lesson)
    {
        $user = $request->user();

        $isEnrolled = Enrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $lesson->chapter?->course_id)
            ->exists();

        if (!$isEnrolled) {
            return response()->json(['message' => 'You must enroll before completing lessons.'], 403);
        }

        $validated = $request->validate([
            'watched_seconds' => ['nullable', 'integer', 'min:0'],
        ]);

        $progress = LessonProgress::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'lesson_id' => $lesson->id,
            ],
            [
                'is_completed' => true,
                'watched_seconds' => $validated['watched_seconds'] ?? max(0, (int) $lesson->duration),
                'completed_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Lesson marked as completed.',
            'progress' => $progress,
        ]);
    }

    public function deadlines(Request $request)
    {
        $user = $request->user();

        $courseIds = Enrollment::query()
            ->where('user_id', $user->id)
            ->pluck('course_id');

        $deadlines = Assignment::query()
            ->whereIn('course_id', $courseIds)
            ->whereNotNull('due_date')
            ->with([
                'course:id,title',
                'submissions' => function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                        ->latest('submitted_at')
                        ->limit(1);
                },
            ])
            ->orderBy('due_date')
            ->limit(8)
            ->get()
            ->map(function (Assignment $assignment) {
                $latestSubmission = $assignment->submissions->first();

                return [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'course_id' => $assignment->course_id,
                    'course_title' => $assignment->course?->title,
                    'due_date' => $assignment->due_date?->toISOString(),
                    'status' => $latestSubmission?->status ?? 'pending',
                    'submitted_at' => $latestSubmission?->submitted_at?->toISOString(),
                ];
            })
            ->values();

        return response()->json($deadlines);
    }

    public function certificates(Request $request)
    {
        $user = $request->user();

        $certificates = Certificate::query()
            ->where('user_id', $user->id)
            ->with('course:id,title,level')
            ->latest('issued_at')
            ->limit(8)
            ->get()
            ->map(function (Certificate $certificate) {
                return [
                    'id' => $certificate->id,
                    'certificate_code' => $certificate->certificate_code,
                    'issued_at' => $certificate->issued_at?->toISOString(),
                    'course' => [
                        'id' => $certificate->course?->id,
                        'title' => $certificate->course?->title,
                        'level' => $certificate->course?->level,
                    ],
                ];
            })
            ->values();

        return response()->json($certificates);
    }

    public function nextLesson(Request $request)
    {
        $user = $request->user();

        $courseIds = Enrollment::query()
            ->where('user_id', $user->id)
            ->pluck('course_id');

        if ($courseIds->isEmpty()) {
            return response()->json(['next_lesson' => null]);
        }

        $completedLessonIds = LessonProgress::query()
            ->where('user_id', $user->id)
            ->where('is_completed', true)
            ->pluck('lesson_id');

        $nextLesson = Lesson::query()
            ->select(
                'lessons.id',
                'lessons.title',
                'lessons.duration',
                'lessons.order',
                'chapters.id as chapter_id',
                'chapters.title as chapter_title',
                'chapters.order as chapter_order',
                'courses.id as course_id',
                'courses.title as course_title',
            )
            ->join('chapters', 'chapters.id', '=', 'lessons.chapter_id')
            ->join('courses', 'courses.id', '=', 'chapters.course_id')
            ->whereIn('courses.id', $courseIds)
            ->whereNotIn('lessons.id', $completedLessonIds)
            ->orderBy('courses.id')
            ->orderBy('chapters.order')
            ->orderBy('lessons.order')
            ->first();

        if (!$nextLesson) {
            return response()->json(['next_lesson' => null]);
        }

        $totalLessonsInCourse = Lesson::query()
            ->join('chapters', 'chapters.id', '=', 'lessons.chapter_id')
            ->where('chapters.course_id', $nextLesson->course_id)
            ->count();

        $completedLessonsInCourse = LessonProgress::query()
            ->join('lessons', 'lessons.id', '=', 'lesson_progress.lesson_id')
            ->join('chapters', 'chapters.id', '=', 'lessons.chapter_id')
            ->where('lesson_progress.user_id', $user->id)
            ->where('lesson_progress.is_completed', true)
            ->where('chapters.course_id', $nextLesson->course_id)
            ->count();

        $progressPercent = $totalLessonsInCourse > 0
            ? (int) round(($completedLessonsInCourse / $totalLessonsInCourse) * 100)
            : 0;

        return response()->json([
            'next_lesson' => [
                'lesson_id' => $nextLesson->id,
                'lesson_title' => $nextLesson->title,
                'duration' => (int) $nextLesson->duration,
                'order' => (int) $nextLesson->order,
                'chapter' => [
                    'id' => (int) $nextLesson->chapter_id,
                    'title' => $nextLesson->chapter_title,
                    'order' => (int) $nextLesson->chapter_order,
                ],
                'course' => [
                    'id' => (int) $nextLesson->course_id,
                    'title' => $nextLesson->course_title,
                ],
                'progress' => [
                    'completed_lessons' => $completedLessonsInCourse,
                    'total_lessons' => $totalLessonsInCourse,
                    'progress_percent' => $progressPercent,
                ],
            ],
        ]);
    }
}
