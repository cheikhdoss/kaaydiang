<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssignmentSubmission;
use App\Models\Certificate;
use App\Models\Chapter;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function student(Request $request)
    {
        $user = $request->user();

        $enrolledCourseIds = Enrollment::query()
            ->where('user_id', $user->id)
            ->pluck('course_id');

        $activeCourses = $enrolledCourseIds->count();
        $totalLessons = Lesson::query()
            ->whereIn('chapter_id', function ($query) use ($enrolledCourseIds) {
                $query->select('id')
                    ->from('chapters')
                    ->whereIn('course_id', $enrolledCourseIds);
            })
            ->count();

        $completedLessons = LessonProgress::query()
            ->where('user_id', $user->id)
            ->where('is_completed', true)
            ->count();

        $learningHours = (int) floor(
            LessonProgress::query()->where('user_id', $user->id)->sum('watched_seconds') / 3600
        );

        $certificatesCount = Certificate::query()->where('user_id', $user->id)->count();

        $catalogCourses = Course::query()
            ->where('is_published', true)
            ->count();

        $latestAttempt = QuizAttempt::query()
            ->where('user_id', $user->id)
            ->latest('attempted_at')
            ->first();

        $quizAttemptsCount = QuizAttempt::query()
            ->where('user_id', $user->id)
            ->count();

        $assignmentDue = AssignmentSubmission::query()
            ->where('user_id', $user->id)
            ->where('status', 'submitted')
            ->count();

        $weeklyGoal = min(100, max(5, $completedLessons * 12));
        $weeklyGrowth = $latestAttempt ? max(5, min(45, (int) round($latestAttempt->score / 2))) : 12;
        $streakDays = min(30, max(1, $completedLessons));

        return response()->json([
            'role' => User::ROLE_STUDENT,
            'greeting' => "Bienvenue {$user->first_name}",
            'stats' => [
                'active_courses' => $activeCourses,
                'certificates' => $certificatesCount,
                'learning_hours' => $learningHours,
                'weekly_growth' => $weeklyGrowth,
            ],
            'progress' => [
                'weekly_goal' => $weeklyGoal,
                'completed_lessons' => $completedLessons,
                'total_lessons' => $totalLessons,
                'streak_days' => $streakDays,
            ],
            'modules' => [
                [
                    'key' => 'catalog',
                    'title' => 'Catalogue',
                    'description' => "{$catalogCourses} cours publies disponibles a l'inscription.",
                    'cta' => 'Explorer les cours',
                ],
                [
                    'key' => 'lessons',
                    'title' => 'Lecons',
                    'description' => "{$completedLessons}/{$totalLessons} lecons completees sur vos cours actifs.",
                    'cta' => 'Continuer les lecons',
                ],
                [
                    'key' => 'progress',
                    'title' => 'Progression',
                    'description' => "Objectif hebdomadaire a {$weeklyGoal}% et serie active de {$streakDays} jours.",
                    'cta' => 'Suivre ma progression',
                ],
                [
                    'key' => 'quiz',
                    'title' => 'Quiz',
                    'description' => $latestAttempt
                        ? "Dernier score: {$latestAttempt->score}% sur {$quizAttemptsCount} tentatives."
                        : 'Aucun quiz tente pour le moment.',
                    'cta' => 'Voir les quiz',
                ],
                [
                    'key' => 'assignments',
                    'title' => 'Devoirs',
                    'description' => "{$assignmentDue} soumissions en attente de retour formateur.",
                    'cta' => 'Gerer mes devoirs',
                ],
                [
                    'key' => 'certificates',
                    'title' => 'Certificats',
                    'description' => "{$certificatesCount} certificats debloques.",
                    'cta' => 'Consulter mes certificats',
                ],
            ],
        ]);
    }

    public function studentModules(Request $request)
    {
        $user = $request->user();

        $enrollments = Enrollment::query()
            ->where('user_id', $user->id)
            ->with([
                'course' => function ($query) {
                    $query->select('id', 'title', 'thumbnail', 'instructor_id', 'level', 'is_published')
                        ->with(['instructor:id,first_name,last_name']);
                },
            ])
            ->latest('enrolled_at')
            ->limit(6)
            ->get();

        $courseIds = $enrollments->pluck('course_id')->all();

        $totalLessonsByCourse = Lesson::query()
            ->selectRaw('chapters.course_id as course_id, COUNT(lessons.id) as total_lessons')
            ->join('chapters', 'chapters.id', '=', 'lessons.chapter_id')
            ->whereIn('chapters.course_id', $courseIds)
            ->groupBy('chapters.course_id')
            ->pluck('total_lessons', 'course_id');

        $completedLessonsByCourse = LessonProgress::query()
            ->selectRaw('chapters.course_id as course_id, COUNT(DISTINCT lesson_progress.lesson_id) as completed_lessons')
            ->join('lessons', 'lessons.id', '=', 'lesson_progress.lesson_id')
            ->join('chapters', 'chapters.id', '=', 'lessons.chapter_id')
            ->where('lesson_progress.user_id', $user->id)
            ->where('lesson_progress.is_completed', true)
            ->whereIn('chapters.course_id', $courseIds)
            ->groupBy('chapters.course_id')
            ->pluck('completed_lessons', 'course_id');

        $myCourses = $enrollments->map(function ($enrollment) use ($totalLessonsByCourse, $completedLessonsByCourse) {
            $course = $enrollment->course;

            if (!$course) {
                return null;
            }

            $courseId = (int) $course->id;
            $totalLessons = (int) ($totalLessonsByCourse[$courseId] ?? 0);
            $completedLessons = (int) ($completedLessonsByCourse[$courseId] ?? 0);
            $progressPercent = $totalLessons > 0
                ? (int) round(($completedLessons / $totalLessons) * 100)
                : 0;

            return [
                'id' => $courseId,
                'title' => $course->title,
                'thumbnail' => $course->thumbnail,
                'level' => $course->level,
                'is_published' => (bool) $course->is_published,
                'instructor' => trim(($course->instructor?->first_name ?? '').' '.($course->instructor?->last_name ?? '')),
                'enrolled_at' => $enrollment->enrolled_at?->toISOString() ?? $enrollment->created_at?->toISOString(),
                'completed_lessons' => $completedLessons,
                'total_lessons' => $totalLessons,
                'progress_percent' => $progressPercent,
            ];
        })->filter()->values();

        $pendingAssignments = AssignmentSubmission::query()
            ->where('user_id', $user->id)
            ->where('status', 'submitted')
            ->with(['assignment:id,title,due_date,course_id'])
            ->latest('submitted_at')
            ->limit(6)
            ->get()
            ->map(function (AssignmentSubmission $submission) {
                return [
                    'id' => $submission->id,
                    'status' => $submission->status,
                    'submitted_at' => $submission->submitted_at?->toISOString(),
                    'score' => $submission->score,
                    'assignment' => [
                        'id' => $submission->assignment?->id,
                        'course_id' => $submission->assignment?->course_id,
                        'title' => $submission->assignment?->title,
                        'due_date' => $submission->assignment?->due_date?->toISOString(),
                    ],
                ];
            })->values();

        return response()->json([
            'role' => User::ROLE_STUDENT,
            'modules' => [
                'my_courses' => $myCourses,
                'deadlines' => $pendingAssignments,
            ],
        ]);
    }

    public function instructor(Request $request)
    {
        $user = $request->user();

        $courseIds = Course::query()
            ->where('instructor_id', $user->id)
            ->pluck('id');

        $coursesCount = $courseIds->count();
        $publishedCount = Course::query()
            ->whereIn('id', $courseIds)
            ->where('is_published', true)
            ->count();

        $chaptersCount = Chapter::query()->whereIn('course_id', $courseIds)->count();
        $drafts = max(0, $coursesCount - $publishedCount);
        $readyToPublish = min(2, $drafts);

        $pendingReviews = AssignmentSubmission::query()
            ->whereIn('assignment_id', function ($query) use ($courseIds) {
                $query->select('id')
                    ->from('assignments')
                    ->whereIn('course_id', $courseIds);
            })
            ->where('status', 'submitted')
            ->count();

        $avgQuizScore = (int) round(
            (float) (QuizAttempt::query()
                ->whereIn('quiz_id', function ($query) use ($courseIds) {
                    $query->select('id')
                        ->from('quizzes')
                        ->whereIn('course_id', $courseIds);
                })
                ->avg('score') ?? 0)
        );

        $engagementRate = max(45, min(98, $avgQuizScore));

        return response()->json([
            'role' => User::ROLE_INSTRUCTOR,
            'greeting' => "Bonjour {$user->first_name}",
            'stats' => [
                'courses_created' => $coursesCount,
                'courses_published' => $publishedCount,
                'chapters' => $chaptersCount,
                'engagement_rate' => $engagementRate,
            ],
            'pipeline' => [
                'drafts' => $drafts,
                'ready_to_publish' => $readyToPublish,
                'pending_reviews' => $pendingReviews,
            ],
            'modules' => [
                [
                    'key' => 'course-studio',
                    'title' => 'Course Studio',
                    'description' => "{$coursesCount} cours crees, {$publishedCount} publies.",
                    'cta' => 'Creer un cours',
                ],
                [
                    'key' => 'content-quality',
                    'title' => 'Qualite du contenu',
                    'description' => "Score quiz moyen: {$avgQuizScore}%.",
                    'cta' => 'Analyser',
                ],
                [
                    'key' => 'learners',
                    'title' => 'Apprenants',
                    'description' => "{$pendingReviews} soumissions necessitent une correction.",
                    'cta' => 'Voir cohortes',
                ],
            ],
        ]);
    }

    public function admin()
    {
        $users = User::query();
        $courses = Course::query();

        return response()->json([
            'role' => User::ROLE_ADMIN,
            'greeting' => 'Console admin',
            'stats' => [
                'users' => $users->count(),
                'students' => (clone $users)->where('role', User::ROLE_STUDENT)->count(),
                'instructors' => (clone $users)->where('role', User::ROLE_INSTRUCTOR)->count(),
                'published_courses' => (clone $courses)->where('is_published', true)->count(),
            ],
            'modules' => [
                [
                    'key' => 'user-governance',
                    'title' => 'Gouvernance utilisateurs',
                    'description' => 'Gerer les roles, acces et statut des comptes.',
                    'cta' => 'Administrer',
                ],
                [
                    'key' => 'content-moderation',
                    'title' => 'Moderation contenu',
                    'description' => 'Controler les cours publies et la qualite editoriale.',
                    'cta' => 'Verifier',
                ],
                [
                    'key' => 'platform-health',
                    'title' => 'Sante plateforme',
                    'description' => 'Suivre indicateurs globaux et stabilite.',
                    'cta' => 'Consulter',
                ],
            ],
        ]);
    }

    public function adminModules()
    {
        $recentUsers = User::query()
            ->select('id', 'first_name', 'last_name', 'email', 'role', 'created_at')
            ->latest()
            ->limit(8)
            ->get()
            ->map(function (User $user) {
                return [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'created_at' => $user->created_at?->toISOString(),
                ];
            })
            ->values();

        $recentCourses = Course::query()
            ->select('id', 'title', 'level', 'is_published', 'created_at', 'instructor_id')
            ->with(['instructor:id,first_name,last_name'])
            ->withCount('chapters')
            ->latest()
            ->limit(8)
            ->get()
            ->map(function (Course $course) {
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'level' => $course->level,
                    'is_published' => (bool) $course->is_published,
                    'chapters_count' => $course->chapters_count,
                    'created_at' => $course->created_at?->toISOString(),
                    'instructor' => trim(($course->instructor?->first_name ?? '').' '.($course->instructor?->last_name ?? '')),
                ];
            })
            ->values();

        $openReviews = AssignmentSubmission::query()
            ->where('status', 'submitted')
            ->with([
                'user:id,first_name,last_name,email',
                'assignment:id,title,course_id',
            ])
            ->latest('submitted_at')
            ->limit(8)
            ->get()
            ->map(function (AssignmentSubmission $submission) {
                return [
                    'id' => $submission->id,
                    'status' => $submission->status,
                    'submitted_at' => $submission->submitted_at?->toISOString(),
                    'student' => [
                        'id' => $submission->user?->id,
                        'first_name' => $submission->user?->first_name,
                        'last_name' => $submission->user?->last_name,
                        'email' => $submission->user?->email,
                    ],
                    'assignment' => [
                        'id' => $submission->assignment?->id,
                        'course_id' => $submission->assignment?->course_id,
                        'title' => $submission->assignment?->title,
                    ],
                ];
            })
            ->values();

        $roleDistribution = [
            'students' => User::query()->where('role', User::ROLE_STUDENT)->count(),
            'instructors' => User::query()->where('role', User::ROLE_INSTRUCTOR)->count(),
            'admins' => User::query()->where('role', User::ROLE_ADMIN)->count(),
        ];

        $publicationStatus = [
            'published' => Course::query()->where('is_published', true)->count(),
            'drafts' => Course::query()->where('is_published', false)->count(),
        ];

        return response()->json([
            'role' => User::ROLE_ADMIN,
            'modules' => [
                'recent_users' => $recentUsers,
                'recent_courses' => $recentCourses,
                'open_reviews' => $openReviews,
                'role_distribution' => $roleDistribution,
                'publication_status' => $publicationStatus,
            ],
        ]);
    }
}
