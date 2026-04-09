<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Certificate;
use App\Models\Chapter;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminHealthController extends Controller
{
    /**
     * Get platform health overview stats
     */
    public function stats(Request $request)
    {
        $user = $request->user();

        if ($user->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $totalUsers = User::count();
        $totalStudents = User::where('role', User::ROLE_STUDENT)->count();
        $totalInstructors = User::where('role', User::ROLE_INSTRUCTOR)->count();
        $totalAdmins = User::where('role', User::ROLE_ADMIN)->count();
        $totalCourses = Course::count();
        $publishedCourses = Course::where('is_published', true)->count();
        $draftCourses = Course::where('is_published', false)->count();
        $totalChapters = Chapter::count();
        $totalLessons = Lesson::count();
        $totalEnrollments = Enrollment::count();
        $totalCertificates = Certificate::count();
        $totalQuizzes = Quiz::count();
        $totalQuizAttempts = QuizAttempt::count();
        $totalAssignments = Assignment::count();
        $totalSubmissions = AssignmentSubmission::count();

        // Activity in last 7 days
        $sevenDaysAgo = now()->subDays(7);
        $newUsersLast7Days = User::where('created_at', '>=', $sevenDaysAgo)->count();
        $newEnrollmentsLast7Days = Enrollment::where('enrolled_at', '>=', $sevenDaysAgo)->count();
        $newCoursesLast7Days = Course::where('created_at', '>=', $sevenDaysAgo)->count();
        $lessonsCompletedLast7Days = LessonProgress::where('completed_at', '>=', $sevenDaysAgo)->count();

        // Top courses by enrollment
        $topCourses = Course::query()
            ->select('courses.id', 'courses.title', 'courses.level', 'courses.is_published')
            ->selectRaw('COUNT(enrollments.id) as enrollment_count')
            ->leftJoin('enrollments', 'enrollments.course_id', '=', 'courses.id')
            ->groupBy('courses.id', 'courses.title', 'courses.level', 'courses.is_published')
            ->orderByDesc('enrollment_count')
            ->limit(5)
            ->get();

        // Role distribution over time (last 30 days)
        $roleDistribution = User::query()
            ->select('role', DB::raw('COUNT(*) as count'))
            ->groupBy('role')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->role => (int) $row->count]);

        // Publication status
        $publicationStatus = [
            'published' => (int) $publishedCourses,
            'drafts' => (int) $draftCourses,
        ];

        // Course levels distribution
        $levelDistribution = Course::query()
            ->select('level', DB::raw('COUNT(*) as count'))
            ->groupBy('level')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->level => (int) $row->count]);

        return response()->json([
            'total_users' => (int) $totalUsers,
            'total_students' => (int) $totalStudents,
            'total_instructors' => (int) $totalInstructors,
            'total_admins' => (int) $totalAdmins,
            'total_courses' => (int) $totalCourses,
            'published_courses' => (int) $publishedCourses,
            'draft_courses' => (int) $draftCourses,
            'total_chapters' => (int) $totalChapters,
            'total_lessons' => (int) $totalLessons,
            'total_enrollments' => (int) $totalEnrollments,
            'total_certificates' => (int) $totalCertificates,
            'total_quizzes' => (int) $totalQuizzes,
            'total_quiz_attempts' => (int) $totalQuizAttempts,
            'total_assignments' => (int) $totalAssignments,
            'total_submissions' => (int) $totalSubmissions,
            'activity' => [
                'new_users_7d' => (int) $newUsersLast7Days,
                'new_enrollments_7d' => (int) $newEnrollmentsLast7Days,
                'new_courses_7d' => (int) $newCoursesLast7Days,
                'lessons_completed_7d' => (int) $lessonsCompletedLast7Days,
            ],
            'top_courses' => $topCourses,
            'role_distribution' => $roleDistribution,
            'publication_status' => $publicationStatus,
            'level_distribution' => $levelDistribution,
        ]);
    }

    /**
     * List all courses for admin moderation
     */
    public function courses(Request $request)
    {
        $user = $request->user();

        if ($user->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $query = Course::query()
            ->with(['instructor:id,first_name,last_name'])
            ->withCount(['chapters', 'enrollments']);

        // Filters
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('level')) {
            $query->where('level', $request->input('level'));
        }

        if ($request->has('is_published') !== false && $request->has('is_published')) {
            $query->where('is_published', (bool) $request->input('is_published'));
        }

        if ($request->has('instructor_id')) {
            $query->where('instructor_id', $request->input('instructor_id'));
        }

        $courses = $query
            ->latest()
            ->paginate($request->input('per_page', 20));

        $courses->getCollection()->transform(function (Course $course) {
            return [
                'id' => $course->id,
                'title' => $course->title,
                'description' => $course->description,
                'thumbnail' => $course->thumbnail,
                'level' => $course->level,
                'price' => $course->price,
                'is_published' => (bool) $course->is_published,
                'instructor' => trim(($course->instructor?->first_name ?? '') . ' ' . ($course->instructor?->last_name ?? '')),
                'instructor_id' => $course->instructor_id,
                'chapters_count' => $course->chapters_count,
                'enrollments_count' => $course->enrollments_count,
                'created_at' => $course->created_at?->toISOString(),
            ];
        });

        return response()->json($courses);
    }

    /**
     * Toggle course published status
     */
    public function toggleCourseStatus(Request $request, Course $course)
    {
        $user = $request->user();

        if ($user->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'is_published' => ['required', 'boolean'],
        ]);

        $course->update(['is_published' => (bool) $validated['is_published']]);

        return response()->json([
            'message' => $validated['is_published'] ? 'Course published.' : 'Course unpublished.',
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'is_published' => (bool) $course->is_published,
            ],
        ]);
    }

    /**
     * Delete a course (admin only)
     */
    public function deleteCourse(Request $request, Course $course)
    {
        $user = $request->user();

        if ($user->role !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $course->delete();

        return response()->json(['message' => 'Course deleted successfully.']);
    }
}
