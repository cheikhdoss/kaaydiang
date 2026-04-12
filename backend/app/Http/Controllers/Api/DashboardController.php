<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Certificate;
use App\Models\Chapter;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\InstructorConversationRead;
use App\Models\InstructorMessage;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
use App\Models\StudentMessageRead;
use App\Models\User;
use App\Notifications\AssignmentGradedNotification;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class DashboardController extends Controller
{
    use \App\LogsActivity;

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

    public function studentMessageThread(Request $request, int $conversationId)
    {
        $user = $request->user();

        // 1. Fetch related assignment submissions to build the history
        $submissions = AssignmentSubmission::query()
            ->where('id', $conversationId)
            ->where('user_id', $user->id)
            ->with([
                'assignment:id,title,course_id',
                'assignment.course:id,title,instructor_id',
                'assignment.course.instructor:id,first_name,last_name',
            ])
            ->get();

        $submission = $submissions->first();
        if (!$submission) {
            return response()->json(['message' => 'Conversation non trouvée.'], 404);
        }

        $instructorId = $submission->assignment?->course?->instructor_id;
        $courseId = $submission->assignment?->course_id;

        // 2. Fetch direct chat messages
        $directMessages = InstructorMessage::query()
            ->where('student_id', $user->id)
            ->where('instructor_id', $instructorId)
            ->with('course:id,title')
            ->latest('created_at')
            ->limit(50)
            ->get();

        // 3. Format history
        $formattedSubmissions = $submissions->flatMap(function ($sub) {
            $date = $sub->submitted_at ?? $sub->updated_at ?? $sub->created_at;
            $msgs = [];

            $msgs[] = [
                'id' => 'student-submission-'.$sub->id,
                'sender' => 'me',
                'text' => 'Soumission du devoir "'.($sub->assignment?->title ?? 'Devoir').'".',
                'date' => $date?->toISOString(),
            ];

            if ($sub->status === 'reviewed') {
                $msgs[] = [
                    'id' => 'instructor-grade-'.$sub->id,
                    'sender' => 'instructor',
                    'text' => 'Votre devoir a été corrigé. Note: '.($sub->score ?? 0).'/100. Feedback: '.($sub->instructor_feedback ?? 'Aucun feedback.'),
                    'date' => $sub->updated_at?->toISOString(),
                ];
            } elseif ($sub->status === 'rejected') {
                $msgs[] = [
                    'id' => 'instructor-reject-'.$sub->id,
                    'sender' => 'instructor',
                    'text' => 'Une révision est demandée sur votre devoir. Feedback: '.($sub->instructor_feedback ?? 'Consultez les corrections.'),
                    'date' => $sub->updated_at?->toISOString(),
                ];
            }

            return $msgs;
        });

        $formattedDirect = $directMessages->map(function ($msg) {
            return [
                'id' => 'direct-'.$msg->id,
                'sender' => $msg->sender_role === 'student' ? 'me' : 'instructor',
                'text' => $msg->message,
                'date' => $msg->created_at?->toISOString(),
            ];
        });

        $messages = $formattedSubmissions->concat($formattedDirect)
            ->sortBy('date')
            ->values();

        return response()->json([
            'conversation_id' => $conversationId,
            'participant' => [
                'id' => $instructorId,
                'name' => trim(($submission->assignment?->course?->instructor?->first_name ?? '').' '.($submission->assignment?->course?->instructor?->last_name ?? '')),
                'role' => 'Instructeur',
            ],
            'course' => $submission->assignment?->course?->title ?? 'Cours',
            'messages' => $messages,
        ]);
    }

    public function sendStudentMessage(Request $request, int $conversationId)
    {
        $user = $request->user();

        $submission = AssignmentSubmission::query()
            ->where('id', $conversationId)
            ->where('user_id', $user->id)
            ->with('assignment.course')
            ->first();

        if (!$submission) {
            return response()->json(['message' => 'Conversation non trouvée.'], 404);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $instructorId = $submission->assignment?->course?->instructor_id;
        $courseId = $submission->assignment?->course_id;

        $message = InstructorMessage::query()->create([
            'instructor_id' => $instructorId,
            'student_id' => $user->id,
            'course_id' => $courseId,
            'message' => trim($validated['message']),
            'sender_role' => 'student',
        ]);

        return response()->json([
            'id' => 'direct-'.$message->id,
            'sender' => 'me',
            'text' => $message->message,
            'date' => $message->created_at?->toISOString(),
        ], 201);
    }

    public function markStudentMessageThreadRead(Request $request, int $conversationId)
    {
        $user = $request->user();

        $submission = AssignmentSubmission::query()
            ->where('id', $conversationId)
            ->where('user_id', $user->id)
            ->first();

        if (!$submission) {
            return response()->json(['message' => 'Conversation non trouvée.'], 404);
        }

        StudentMessageRead::query()->updateOrCreate(
            [
                'student_id' => $user->id,
                'conversation_id' => $submission->id,
            ],
            [
                'last_read_at' => now(),
            ]
        );

        return response()->json(['message' => 'Marqué comme lu.']);
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

    public function studentCalendar(Request $request)
    {
        $user = $request->user();

        $courseIds = Enrollment::query()
            ->where('user_id', $user->id)
            ->pluck('course_id');

        $deadlines = AssignmentSubmission::query()
            ->where('user_id', $user->id)
            ->with(['assignment:id,course_id,title,due_date', 'assignment.course:id,title'])
            ->latest('submitted_at')
            ->limit(20)
            ->get()
            ->map(function (AssignmentSubmission $submission) {
                $dueDate = $submission->assignment?->due_date;

                if (!$dueDate) {
                    return null;
                }

                return [
                    'id' => $submission->id,
                    'title' => $submission->assignment?->title ?? 'Devoir',
                    'date' => $dueDate->toDateString(),
                    'time' => $dueDate->format('H:i'),
                    'type' => 'deadline',
                    'course_id' => $submission->assignment?->course_id,
                    'course_title' => $submission->assignment?->course?->title,
                    'description' => 'Soumission et suivi de votre devoir.',
                ];
            })
            ->filter();

        $quizEvents = Quiz::query()
            ->whereIn('course_id', $courseIds)
            ->with('course:id,title')
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(function (Quiz $quiz) {
                $date = $quiz->created_at ?? now();

                return [
                    'id' => 100000 + $quiz->id,
                    'title' => $quiz->title,
                    'date' => $date->toDateString(),
                    'time' => $date->format('H:i'),
                    'type' => 'exam',
                    'course_id' => $quiz->course_id,
                    'course_title' => $quiz->course?->title,
                    'description' => 'Evaluation de progression du module.',
                ];
            });

        $events = $deadlines
            ->concat($quizEvents)
            ->sortBy([
                ['date', 'asc'],
                ['time', 'asc'],
            ])
            ->values();

        return response()->json($events);
    }

    public function studentMessages(Request $request)
    {
        $user = $request->user();

        $readByConversation = StudentMessageRead::query()
            ->where('student_id', $user->id)
            ->get(['conversation_id', 'last_read_at'])
            ->keyBy('conversation_id');

        $messages = AssignmentSubmission::query()
            ->where('user_id', $user->id)
            ->with([
                'assignment:id,course_id,title',
                'assignment.course:id,title,instructor_id',
                'assignment.course.instructor:id,first_name,last_name',
            ])
            ->latest('updated_at')
            ->limit(25)
            ->get()
            ->map(function (AssignmentSubmission $submission) use ($readByConversation) {
                $instructorFirst = $submission->assignment?->course?->instructor?->first_name ?? 'Equipe';
                $instructorLast = $submission->assignment?->course?->instructor?->last_name ?? 'pedagogique';
                $senderName = trim("{$instructorFirst} {$instructorLast}");

                $preview = match ($submission->status) {
                    'reviewed' => 'Votre devoir a ete corrige. Consultez votre feedback.',
                    'rejected' => 'Une revision est demandee sur votre soumission.',
                    default => 'Votre soumission est en attente de correction.',
                };

                return [
                    'id' => $submission->id,
                    'sender' => [
                        'name' => $senderName,
                        'avatar' => strtoupper(substr($instructorFirst, 0, 1).substr($instructorLast, 0, 1)),
                        'role' => 'Instructeur',
                    ],
                    'subject' => ($submission->assignment?->title ?? 'Devoir').' - mise a jour',
                    'preview' => $preview,
                    'date' => ($submission->updated_at ?? $submission->created_at)?->toISOString(),
                    'unread' => (($submission->updated_at ?? $submission->created_at)?->gt(
                        $readByConversation->get($submission->id)?->last_read_at ?? now()->subYears(10)
                    ) ?? false),
                    'course' => $submission->assignment?->course?->title ?? 'General',
                ];
            })
            ->values();

        return response()->json($messages);
    }

    public function instructorCalendar(Request $request)
    {
        $user = $request->user();

        $courseIds = Course::query()
            ->where('instructor_id', $user->id)
            ->pluck('id');

        $enrollmentCounts = Enrollment::query()
            ->whereIn('course_id', $courseIds)
            ->selectRaw('course_id, COUNT(*) as total')
            ->groupBy('course_id')
            ->pluck('total', 'course_id');

        $deadlineEvents = Assignment::query()
            ->whereIn('course_id', $courseIds)
            ->whereNotNull('due_date')
            ->with('course:id,title')
            ->latest('due_date')
            ->limit(20)
            ->get()
            ->map(function (Assignment $assignment) use ($enrollmentCounts) {
                $dueDate = $assignment->due_date;

                if (!$dueDate) {
                    return null;
                }

                return [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'date' => $dueDate->toDateString(),
                    'time' => $dueDate->format('H:i'),
                    'type' => 'deadline',
                    'course_id' => $assignment->course_id,
                    'course_title' => $assignment->course?->title,
                    'student_count' => (int) ($enrollmentCounts[$assignment->course_id] ?? 0),
                    'description' => 'Echeance de rendu pour les apprenants inscrits.',
                ];
            })
            ->filter();

        $quizEvents = Quiz::query()
            ->whereIn('course_id', $courseIds)
            ->with('course:id,title')
            ->latest('created_at')
            ->limit(20)
            ->get()
            ->map(function (Quiz $quiz) use ($enrollmentCounts) {
                $date = $quiz->created_at ?? now();

                return [
                    'id' => 100000 + $quiz->id,
                    'title' => $quiz->title,
                    'date' => $date->toDateString(),
                    'time' => $date->format('H:i'),
                    'type' => 'exam',
                    'course_id' => $quiz->course_id,
                    'course_title' => $quiz->course?->title,
                    'student_count' => (int) ($enrollmentCounts[$quiz->course_id] ?? 0),
                    'description' => 'Evaluation planifiee du cours.',
                ];
            });

        $events = $deadlineEvents
            ->concat($quizEvents)
            ->sortBy([
                ['date', 'asc'],
                ['time', 'asc'],
            ])
            ->values();

        return response()->json($events);
    }

    public function instructorQuizzes(Request $request)
    {
        $user = $request->user();

        $ownedCourseIds = Course::query()
            ->where('instructor_id', $user->id)
            ->pluck('id');

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', Rule::in(['draft', 'active', 'completed'])],
            'course_id' => ['nullable', 'integer', Rule::in($ownedCourseIds->all())],
        ]);

        $search = isset($validated['search']) ? trim((string) $validated['search']) : '';
        $searchLower = mb_strtolower($search);

        $quizzes = Quiz::query()
            ->whereIn('course_id', $ownedCourseIds)
            ->when(isset($validated['course_id']), function ($query) use ($validated) {
                $query->where('course_id', (int) $validated['course_id']);
            })
            ->when($searchLower !== '', function ($query) use ($searchLower) {
                $like = '%'.$searchLower.'%';

                $query->where(function ($inner) use ($like) {
                    $inner->whereRaw('LOWER(title) LIKE ?', [$like])
                        ->orWhereRaw("LOWER(COALESCE(description, '')) LIKE ?", [$like])
                        ->orWhereIn('course_id', function ($courseQuery) use ($like) {
                            $courseQuery->select('id')
                                ->from('courses')
                                ->whereRaw('LOWER(title) LIKE ?', [$like]);
                        });
                });
            })
            ->with('course:id,title')
            ->withCount('attempts')
            ->withCount('questions')
            ->withAvg('attempts', 'score')
            ->latest('created_at')
            ->get()
            ->map(fn (Quiz $quiz) => $this->formatInstructorQuizItem($quiz))
            ->when(isset($validated['status']), function ($collection) use ($validated) {
                return $collection->where('status', $validated['status']);
            })
            ->take(50)
            ->values();

        return response()->json($quizzes);
    }

    public function instructorCreateQuiz(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:4000'],
            'course_id' => [
                'required',
                'integer',
                Rule::exists('courses', 'id')->where(function ($query) use ($user) {
                    $query->where('instructor_id', $user->id);
                }),
            ],
            'pass_score' => ['nullable', 'integer', 'min:0', 'max:100'],
        ]);

        $quiz = Quiz::query()->create([
            'title' => trim($validated['title']),
            'description' => isset($validated['description']) ? trim((string) $validated['description']) : null,
            'course_id' => (int) $validated['course_id'],
            'pass_score' => isset($validated['pass_score']) ? (int) $validated['pass_score'] : 60,
        ]);

        $quiz->load('course:id,title');
        $quiz->loadCount(['attempts', 'questions']);
        $quiz->loadAvg('attempts', 'score');

        return response()->json($this->formatInstructorQuizItem($quiz), 201);
    }

    public function instructorUpdateQuiz(Request $request, Quiz $quiz)
    {
        $user = $request->user();

        $ownedCourseIds = Course::query()
            ->where('instructor_id', $user->id)
            ->pluck('id');

        if (!$ownedCourseIds->contains($quiz->course_id)) {
            return response()->json(['message' => 'Quiz not found.'], 404);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:4000'],
            'course_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('courses', 'id')->where(function ($query) use ($user) {
                    $query->where('instructor_id', $user->id);
                }),
            ],
            'pass_score' => ['sometimes', 'required', 'integer', 'min:0', 'max:100'],
        ]);

        $updatePayload = [];

        if (array_key_exists('title', $validated)) {
            $updatePayload['title'] = trim((string) $validated['title']);
        }

        if (array_key_exists('description', $validated)) {
            $updatePayload['description'] = $validated['description'] !== null
                ? trim((string) $validated['description'])
                : null;
        }

        if (array_key_exists('course_id', $validated)) {
            $updatePayload['course_id'] = (int) $validated['course_id'];
        }

        if (array_key_exists('pass_score', $validated)) {
            $updatePayload['pass_score'] = (int) $validated['pass_score'];
        }

        if (!empty($updatePayload)) {
            $quiz->fill($updatePayload);
            $quiz->save();
        }

        $quiz->load('course:id,title');
        $quiz->loadCount(['attempts', 'questions']);
        $quiz->loadAvg('attempts', 'score');

        return response()->json($this->formatInstructorQuizItem($quiz));
    }

    public function instructorDeleteQuiz(Request $request, Quiz $quiz)
    {
        $user = $request->user();

        $isOwned = Course::query()
            ->where('id', $quiz->course_id)
            ->where('instructor_id', $user->id)
            ->exists();

        if (!$isOwned) {
            return response()->json(['message' => 'Quiz not found.'], 404);
        }

        $quiz->delete();

        return response()->json(['message' => 'Quiz deleted.']);
    }

    public function instructorAssignments(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', Rule::in(['draft', 'active', 'completed'])],
        ]);

        $search = isset($validated['search']) ? trim((string) $validated['search']) : '';
        $searchLower = mb_strtolower($search);

        $courseIds = Course::query()
            ->where('instructor_id', $user->id)
            ->pluck('id');

        $enrollmentCounts = Enrollment::query()
            ->whereIn('course_id', $courseIds)
            ->selectRaw('course_id, COUNT(*) as total')
            ->groupBy('course_id')
            ->pluck('total', 'course_id');

        $assignments = Assignment::query()
            ->whereIn('course_id', $courseIds)
            ->when($searchLower !== '', function ($query) use ($searchLower) {
                $like = '%'.$searchLower.'%';

                $query->where(function ($inner) use ($like) {
                    $inner->whereRaw('LOWER(title) LIKE ?', [$like])
                        ->orWhereRaw("LOWER(COALESCE(description, '')) LIKE ?", [$like])
                        ->orWhereIn('course_id', function ($courseQuery) use ($like) {
                            $courseQuery->select('id')
                                ->from('courses')
                                ->whereRaw('LOWER(title) LIKE ?', [$like]);
                        });
                });
            })
            ->with('course:id,title')
            ->withCount('submissions')
            ->latest('created_at')
            ->get()
            ->map(function (Assignment $assignment) use ($enrollmentCounts) {
                $status = 'draft';

                if ($assignment->due_date) {
                    $status = $assignment->due_date->isPast() ? 'completed' : 'active';
                }

                return [
                    'id' => $assignment->id,
                    'title' => $assignment->title,
                    'course_id' => $assignment->course_id,
                    'course_title' => $assignment->course?->title ?? 'Cours',
                    'submission_count' => (int) $assignment->submissions_count,
                    'total_students' => (int) ($enrollmentCounts[$assignment->course_id] ?? 0),
                    'due_date' => $assignment->due_date?->toISOString(),
                    'status' => $status,
                ];
            })
            ->when(isset($validated['status']), function ($collection) use ($validated) {
                return $collection->where('status', $validated['status']);
            })
            ->take(50)
            ->values();

        return response()->json($assignments);
    }

    public function instructorAssignmentSubmissions(Request $request, Assignment $assignment)
    {
        $user = $request->user();

        $validated = $request->validate([
            'status' => ['nullable', Rule::in(['submitted', 'reviewed', 'rejected'])],
            'search' => ['nullable', 'string', 'max:120'],
        ]);

        $search = isset($validated['search']) ? trim((string) $validated['search']) : '';
        $searchLower = mb_strtolower($search);

        $isOwned = Course::query()
            ->where('id', $assignment->course_id)
            ->where('instructor_id', $user->id)
            ->exists();

        if (!$isOwned) {
            return response()->json(['message' => 'Assignment not found.'], 404);
        }

        $submissions = AssignmentSubmission::query()
            ->where('assignment_id', $assignment->id)
            ->when(isset($validated['status']), function ($query) use ($validated) {
                $query->where('status', $validated['status']);
            })
            ->when($searchLower !== '', function ($query) use ($searchLower) {
                $like = '%'.$searchLower.'%';

                $query->whereHas('user', function ($userQuery) use ($like) {
                    $userQuery->whereRaw('LOWER(first_name) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(last_name) LIKE ?', [$like])
                        ->orWhereRaw('LOWER(email) LIKE ?', [$like]);
                });
            })
            ->with('user:id,first_name,last_name,email')
            ->latest('submitted_at')
            ->limit(200)
            ->get()
            ->map(function (AssignmentSubmission $submission) {
                return [
                    'id' => $submission->id,
                    'status' => $submission->status,
                    'score' => $submission->score,
                    'instructor_feedback' => $submission->instructor_feedback,
                    'file_url' => $submission->file_url,
                    'student_attachments' => $this->normalizeSubmissionAttachments(
                        $submission->student_attachments,
                        $submission->file_url
                    ),
                    'correction_attachments' => $this->normalizeSubmissionAttachments(
                        $submission->correction_attachments
                    ),
                    'submitted_at' => $submission->submitted_at?->toISOString(),
                    'updated_at' => $submission->updated_at?->toISOString(),
                    'student' => [
                        'id' => $submission->user?->id,
                        'name' => trim(($submission->user?->first_name ?? '').' '.($submission->user?->last_name ?? '')),
                        'email' => $submission->user?->email,
                    ],
                ];
            })
            ->values();

        return response()->json([
            'assignment' => [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'course_id' => $assignment->course_id,
            ],
            'submissions' => $submissions,
        ]);
    }

    public function instructorGradeAssignmentSubmission(Request $request, Assignment $assignment, AssignmentSubmission $submission)
    {
        $user = $request->user();

        $isOwned = Course::query()
            ->where('id', $assignment->course_id)
            ->where('instructor_id', $user->id)
            ->exists();

        if (!$isOwned || (int) $submission->assignment_id !== (int) $assignment->id) {
            return response()->json(['message' => 'Submission not found.'], 404);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['reviewed', 'rejected', 'submitted'])],
            'score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'feedback' => ['nullable', 'string', 'max:5000'],
            'correction_files' => ['sometimes', 'array', 'min:1'],
            'correction_files.*' => ['file', 'max:51200', 'mimes:pdf,zip,doc,docx,png,jpg,jpeg'],
        ]);

        if ($validated['status'] === 'reviewed' && !array_key_exists('score', $validated)) {
            return response()->json(['message' => 'Score is required when reviewing a submission.'], 422);
        }

        $submission->status = $validated['status'];
        $submission->score = $validated['status'] === 'reviewed'
            ? (array_key_exists('score', $validated) ? $validated['score'] : $submission->score)
            : (array_key_exists('score', $validated) ? $validated['score'] : null);
        $submission->instructor_feedback = array_key_exists('feedback', $validated)
            ? ($validated['feedback'] !== null ? trim((string) $validated['feedback']) : null)
            : $submission->instructor_feedback;

        if ($request->hasFile('correction_files')) {
            $existing = collect($submission->correction_attachments ?? []);
            $newFiles = collect($request->file('correction_files', []))
                ->filter()
                ->map(function ($file) {
                    $path = $file->store('submissions/corrections', 'public');

                    return [
                        'path' => $path,
                        'name' => $file->getClientOriginalName(),
                        'mime_type' => $file->getMimeType(),
                        'size' => $file->getSize(),
                        'uploaded_at' => now()->toISOString(),
                    ];
                });

            $submission->correction_attachments = $existing
                ->concat($newFiles)
                ->take(10)
                ->values()
                ->all();
        }

        $submission->save();

        $this->logActivity('assignment.graded', "Devoir noté: {$assignment->title} - Étudiant: {$submission->user?->email} - Score: {$submission->score}", [
            'model_type' => AssignmentSubmission::class,
            'model_id' => $submission->id,
            'properties' => [
                'status' => $submission->status,
                'score' => $submission->score,
            ],
        ]);

        // Send notification to the student
        if ($submission->user) {
            $submission->user->notify(new AssignmentGradedNotification($submission->load(['assignment.course'])));
        }

        return response()->json([
            'id' => $submission->id,
            'status' => $submission->status,
            'score' => $submission->score,
            'instructor_feedback' => $submission->instructor_feedback,
            'student_attachments' => $this->normalizeSubmissionAttachments(
                $submission->student_attachments,
                $submission->file_url
            ),
            'correction_attachments' => $this->normalizeSubmissionAttachments(
                $submission->correction_attachments
            ),
            'updated_at' => $submission->updated_at?->toISOString(),
        ]);
    }

    private function normalizeSubmissionAttachments(?array $attachments, ?string $fallbackPath = null): array
    {
        $items = collect($attachments ?? [])
            ->filter(fn ($item) => is_array($item) && !empty($item['path']))
            ->map(function (array $item) {
                $path = (string) ($item['path'] ?? '');

                return [
                    'path' => $path,
                    'name' => (string) ($item['name'] ?? basename($path)),
                    'mime_type' => $item['mime_type'] ?? null,
                    'size' => isset($item['size']) ? (int) $item['size'] : null,
                    'uploaded_at' => $item['uploaded_at'] ?? null,
                    'url' => $this->normalizeAttachmentUrl($path),
                ];
            })
            ->values();

        if ($items->isEmpty() && $fallbackPath !== null && $fallbackPath !== '') {
            $items = collect([[
                'path' => $fallbackPath,
                'name' => basename($fallbackPath),
                'mime_type' => null,
                'size' => null,
                'uploaded_at' => null,
                'url' => $this->normalizeAttachmentUrl($fallbackPath),
            ]]);
        }

        return $items->all();
    }

    private function normalizeAttachmentUrl(string $path): string
    {
        if ($path === '') {
            return '';
        }

        if (filter_var($path, FILTER_VALIDATE_URL)) {
            return $path;
        }

        $trimmedPath = ltrim($path, '/');

        if (Str::startsWith($trimmedPath, 'storage/')) {
            return url('/'.$trimmedPath);
        }

        $diskUrl = Storage::url($trimmedPath);

        if (Str::startsWith($diskUrl, ['http://', 'https://'])) {
            return $diskUrl;
        }

        return url($diskUrl);
    }

    private function formatInstructorQuizItem(Quiz $quiz): array
    {
        $attemptCount = (int) ($quiz->attempts_count ?? 0);
        $questionCount = $quiz->relationLoaded('questions')
            ? $quiz->questions->count()
            : (int) ($quiz->questions_count ?? 0);
        $status = $attemptCount === 0
            ? 'draft'
            : (($quiz->created_at?->lt(now()->subDays(30)) ?? false) ? 'completed' : 'active');

        return [
            'id' => $quiz->id,
            'title' => $quiz->title,
            'description' => $quiz->description,
            'course_id' => $quiz->course_id,
            'course_title' => $quiz->course?->title ?? 'Cours',
            'question_count' => $questionCount,
            'attempt_count' => $attemptCount,
            'average_score' => (int) round((float) ($quiz->attempts_avg_score ?? 0)),
            'pass_score' => (int) ($quiz->pass_score ?? 60),
            'status' => $status,
        ];
    }

    public function instructorStudents(Request $request)
    {
        $user = $request->user();

        $courseIds = Course::query()
            ->where('instructor_id', $user->id)
            ->pluck('id');

        $studentIds = Enrollment::query()
            ->whereIn('course_id', $courseIds)
            ->distinct()
            ->pluck('user_id');

        $enrolledCoursesByStudent = Enrollment::query()
            ->whereIn('course_id', $courseIds)
            ->selectRaw('user_id, COUNT(DISTINCT course_id) as total_courses')
            ->groupBy('user_id')
            ->pluck('total_courses', 'user_id');

        $lastActiveByStudent = LessonProgress::query()
            ->join('lessons', 'lessons.id', '=', 'lesson_progress.lesson_id')
            ->join('chapters', 'chapters.id', '=', 'lessons.chapter_id')
            ->whereIn('chapters.course_id', $courseIds)
            ->selectRaw('lesson_progress.user_id, MAX(lesson_progress.updated_at) as last_active')
            ->groupBy('lesson_progress.user_id')
            ->pluck('last_active', 'lesson_progress.user_id');

        $completedLessonsByStudent = LessonProgress::query()
            ->join('lessons', 'lessons.id', '=', 'lesson_progress.lesson_id')
            ->join('chapters', 'chapters.id', '=', 'lessons.chapter_id')
            ->whereIn('chapters.course_id', $courseIds)
            ->where('lesson_progress.is_completed', true)
            ->selectRaw('lesson_progress.user_id, COUNT(DISTINCT lesson_progress.lesson_id) as completed_lessons')
            ->groupBy('lesson_progress.user_id')
            ->pluck('completed_lessons', 'lesson_progress.user_id');

        $totalLessonsAcrossInstructorCourses = Lesson::query()
            ->join('chapters', 'chapters.id', '=', 'lessons.chapter_id')
            ->whereIn('chapters.course_id', $courseIds)
            ->count();

        $students = User::query()
            ->whereIn('id', $studentIds)
            ->where('role', User::ROLE_STUDENT)
            ->select('id', 'first_name', 'last_name', 'email')
            ->orderBy('first_name')
            ->limit(50)
            ->get()
            ->map(function (User $student) use ($enrolledCoursesByStudent, $lastActiveByStudent, $completedLessonsByStudent, $totalLessonsAcrossInstructorCourses) {
                $completed = (int) ($completedLessonsByStudent[$student->id] ?? 0);
                $averageProgress = $totalLessonsAcrossInstructorCourses > 0
                    ? (int) round(($completed / $totalLessonsAcrossInstructorCourses) * 100)
                    : 0;

                return [
                    'id' => $student->id,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'email' => $student->email,
                    'enrolled_courses' => (int) ($enrolledCoursesByStudent[$student->id] ?? 0),
                    'last_active' => isset($lastActiveByStudent[$student->id])
                        ? Carbon::parse($lastActiveByStudent[$student->id])->toISOString()
                        : $student->created_at?->toISOString(),
                    'average_progress' => $averageProgress,
                ];
            })
            ->values();

        return response()->json($students);
    }

    public function instructorMessages(Request $request)
    {
        $user = $request->user();

        $submissions = AssignmentSubmission::query()
            ->whereIn('assignment_id', function ($query) use ($user) {
                $query->select('id')
                    ->from('assignments')
                    ->whereIn('course_id', function ($courseQuery) use ($user) {
                        $courseQuery->select('id')
                            ->from('courses')
                            ->where('instructor_id', $user->id);
                    });
            })
            ->with([
                'user:id,first_name,last_name',
                'assignment:id,title,course_id',
                'assignment.course:id,title',
            ])
            ->latest('submitted_at')
            ->limit(100)
            ->get();

        $storedMessages = InstructorMessage::query()
            ->where('instructor_id', $user->id)
            ->with('course:id,title')
            ->latest('created_at')
            ->limit(100)
            ->get();

        $studentIds = $submissions
            ->pluck('user_id')
            ->merge($storedMessages->pluck('student_id'))
            ->filter()
            ->unique()
            ->values();

        if ($studentIds->isEmpty()) {
            return response()->json([]);
        }

        $studentsById = User::query()
            ->whereIn('id', $studentIds)
            ->where('role', User::ROLE_STUDENT)
            ->get(['id', 'first_name', 'last_name'])
            ->keyBy('id');

        $latestSubmissionByStudent = $submissions
            ->groupBy('user_id')
            ->map(function ($items) {
                return $items->sortByDesc(function (AssignmentSubmission $submission) {
                    return ($submission->submitted_at ?? $submission->created_at)?->toISOString();
                })->first();
            });

        $latestStoredMessageByStudent = $storedMessages
            ->groupBy('student_id')
            ->map(function ($items) {
                return $items->sortByDesc('created_at')->first();
            });

        $readByStudent = InstructorConversationRead::query()
            ->where('instructor_id', $user->id)
            ->whereIn('student_id', $studentIds)
            ->get(['student_id', 'last_read_at'])
            ->keyBy('student_id');

        $conversations = $studentIds
            ->map(function ($studentId) use ($studentsById, $latestSubmissionByStudent, $latestStoredMessageByStudent, $submissions, $storedMessages, $readByStudent) {
                /** @var User|null $student */
                $student = $studentsById->get($studentId);

                if (!$student) {
                    return null;
                }

                /** @var AssignmentSubmission|null $latestSubmission */
                $latestSubmission = $latestSubmissionByStudent->get($studentId);
                /** @var InstructorMessage|null $latestStoredMessage */
                $latestStoredMessage = $latestStoredMessageByStudent->get($studentId);

                $submissionDate = ($latestSubmission?->submitted_at ?? $latestSubmission?->created_at)?->toISOString();
                $storedDate = $latestStoredMessage?->created_at?->toISOString();
                $lastDate = $storedDate && (!$submissionDate || $storedDate > $submissionDate)
                    ? $storedDate
                    : $submissionDate;

                $lastMessage = $latestStoredMessage
                    ? $latestStoredMessage->message
                    : (($latestSubmission?->assignment?->title ?? 'Devoir').' - nouvelle soumission');

                $courseTitle = $latestStoredMessage?->course?->title
                    ?? $latestSubmission?->assignment?->course?->title
                    ?? 'Cours';

                $lastReadAt = $readByStudent->get($studentId)?->last_read_at;

                $studentMessagesCount = (int) $storedMessages
                    ->where('student_id', $studentId)
                    ->where('sender_role', 'student')
                    ->filter(function (InstructorMessage $message) use ($lastReadAt) {
                        if (!$lastReadAt) {
                            return true;
                        }

                        return $message->created_at?->gt($lastReadAt) ?? false;
                    })
                    ->count();

                return [
                    'id' => (int) $studentId,
                    'sender_name' => trim(($student->first_name ?? '').' '.($student->last_name ?? '')),
                    'course_title' => $courseTitle,
                    'last_message' => $lastMessage,
                    'created_at' => $lastDate,
                    'unread_count' => (int) $submissions
                        ->where('user_id', $studentId)
                        ->where('status', 'submitted')
                        ->count() + $studentMessagesCount,
                ];
            })
            ->filter()
            ->sortByDesc('created_at')
            ->values();

        return response()->json($conversations);
    }

    public function instructorMessageThread(Request $request, User $student)
    {
        $user = $request->user();

        $courseIds = Course::query()
            ->where('instructor_id', $user->id)
            ->pluck('id');

        $submissions = AssignmentSubmission::query()
            ->where('user_id', $student->id)
            ->whereIn('assignment_id', function ($query) use ($courseIds) {
                $query->select('id')
                    ->from('assignments')
                    ->whereIn('course_id', $courseIds);
            })
            ->with([
                'assignment:id,title,course_id',
                'assignment.course:id,title',
            ])
            ->latest('submitted_at')
            ->limit(30)
            ->get();

        $instructorMessages = InstructorMessage::query()
            ->where('instructor_id', $user->id)
            ->where('student_id', $student->id)
            ->with('course:id,title')
            ->latest('created_at')
            ->limit(50)
            ->get();

        if ($submissions->isEmpty() && $instructorMessages->isEmpty()) {
            return response()->json([
                'participant' => [
                    'id' => $student->id,
                    'name' => trim(($student->first_name ?? '').' '.($student->last_name ?? '')),
                    'role' => 'student',
                ],
                'messages' => [],
            ]);
        }

        $submissionMessages = $submissions
            ->flatMap(function (AssignmentSubmission $submission) {
                $date = $submission->submitted_at ?? $submission->created_at ?? now();

                $studentMessage = [
                    'id' => 'student-'.$submission->id,
                    'sender' => 'student',
                    'text' => 'Soumission du devoir "'.($submission->assignment?->title ?? 'Devoir').'".',
                    'course_title' => $submission->assignment?->course?->title,
                    'created_at' => $date?->toISOString(),
                ];

                $reviewMessage = null;

                if (in_array($submission->status, ['reviewed', 'rejected'], true)) {
                    $reviewText = $submission->status === 'reviewed'
                        ? 'Correction terminee. Vous pouvez consulter votre resultat.'
                        : 'Une revision est demandee sur votre soumission.';

                    $reviewMessage = [
                        'id' => 'instructor-'.$submission->id,
                        'sender' => 'instructor',
                        'text' => $reviewText,
                        'course_title' => $submission->assignment?->course?->title,
                        'created_at' => ($submission->updated_at ?? $date)?->toISOString(),
                    ];
                }

                return array_values(array_filter([$studentMessage, $reviewMessage]));
            })
            ->values();

        $storedMessages = $instructorMessages
            ->map(function (InstructorMessage $message) {
                return [
                    'id' => 'instructor-msg-'.$message->id,
                    'sender' => ($message->sender_role ?? 'instructor') === 'student' ? 'student' : 'instructor',
                    'text' => $message->message,
                    'course_title' => $message->course?->title,
                    'created_at' => $message->created_at?->toISOString(),
                ];
            })
            ->values();

        $messages = $submissionMessages
            ->concat($storedMessages)
            ->sortBy('created_at')
            ->values();

        return response()->json([
            'participant' => [
                'id' => $student->id,
                'name' => trim(($student->first_name ?? '').' '.($student->last_name ?? '')),
                'role' => 'student',
            ],
            'messages' => $messages,
        ]);
    }

    public function markInstructorThreadRead(Request $request, User $student)
    {
        $user = $request->user();

        $courseIds = Course::query()
            ->where('instructor_id', $user->id)
            ->pluck('id');

        $isStudentRelated = Enrollment::query()
            ->where('user_id', $student->id)
            ->whereIn('course_id', $courseIds)
            ->exists();

        $hasThread = InstructorMessage::query()
            ->where('instructor_id', $user->id)
            ->where('student_id', $student->id)
            ->exists() || AssignmentSubmission::query()
                ->where('user_id', $student->id)
                ->whereIn('assignment_id', function ($query) use ($courseIds) {
                    $query->select('id')
                        ->from('assignments')
                        ->whereIn('course_id', $courseIds);
                })
                ->exists();

        if (!$isStudentRelated && !$hasThread) {
            return response()->json(['message' => 'Thread not found.'], 404);
        }

        InstructorConversationRead::query()->updateOrCreate(
            [
                'instructor_id' => $user->id,
                'student_id' => $student->id,
            ],
            [
                'last_read_at' => now(),
            ]
        );

        return response()->json(['message' => 'Thread marked as read.']);
    }

    public function instructorSendMessage(Request $request, User $student)
    {
        $user = $request->user();

        if ($student->role !== User::ROLE_STUDENT) {
            return response()->json(['message' => 'Target user must be a student.'], 422);
        }

        $courseIds = Course::query()
            ->where('instructor_id', $user->id)
            ->pluck('id');

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
            'course_id' => ['nullable', 'integer'],
        ]);

        $courseId = isset($validated['course_id']) ? (int) $validated['course_id'] : null;

        if ($courseId !== null && !$courseIds->contains($courseId)) {
            return response()->json(['message' => 'You can only send messages for your courses.'], 422);
        }

        $isStudentRelated = Enrollment::query()
            ->where('user_id', $student->id)
            ->whereIn('course_id', $courseIds)
            ->exists();

        $hasExistingThread = InstructorMessage::query()
            ->where('instructor_id', $user->id)
            ->where('student_id', $student->id)
            ->exists() || AssignmentSubmission::query()
                ->where('user_id', $student->id)
                ->whereIn('assignment_id', function ($query) use ($courseIds) {
                    $query->select('id')
                        ->from('assignments')
                        ->whereIn('course_id', $courseIds);
                })
                ->exists();

        if (!$isStudentRelated && !$hasExistingThread) {
            return response()->json(['message' => 'You can only message students from your courses.'], 403);
        }

        $message = InstructorMessage::query()->create([
            'instructor_id' => $user->id,
            'student_id' => $student->id,
            'course_id' => $courseId,
            'message' => trim($validated['message']),
            'sender_role' => 'instructor',
        ]);

        $message->load('course:id,title');

        return response()->json([
            'id' => 'instructor-msg-'.$message->id,
            'sender' => 'instructor',
            'text' => $message->message,
            'course_title' => $message->course?->title,
            'created_at' => $message->created_at?->toISOString(),
        ], 201);
    }

    public function instructorProfile(Request $request)
    {
        $user = $request->user();

        $courseIds = Course::query()
            ->where('instructor_id', $user->id)
            ->pluck('id');

        $coursesCreated = $courseIds->count();
        $coursesPublished = Course::query()
            ->whereIn('id', $courseIds)
            ->where('is_published', true)
            ->count();

        $totalStudents = Enrollment::query()
            ->whereIn('course_id', $courseIds)
            ->distinct('user_id')
            ->count('user_id');

        $pendingReviews = AssignmentSubmission::query()
            ->whereIn('assignment_id', function ($query) use ($courseIds) {
                $query->select('id')
                    ->from('assignments')
                    ->whereIn('course_id', $courseIds);
            })
            ->where('status', 'submitted')
            ->count();

        $avgQuizScore = (float) (QuizAttempt::query()
            ->whereIn('quiz_id', function ($query) use ($courseIds) {
                $query->select('id')
                    ->from('quizzes')
                    ->whereIn('course_id', $courseIds);
            })
            ->avg('score') ?? 0);

        return response()->json([
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'full_name' => trim(($user->first_name ?? '').' '.($user->last_name ?? '')),
            'email' => $user->email,
            'role' => User::ROLE_INSTRUCTOR,
            'avatar' => $user->avatar,
            'bio' => $user->bio,
            'created_at' => $user->created_at?->toISOString(),
            'stats' => [
                'courses_created' => $coursesCreated,
                'courses_published' => $coursesPublished,
                'total_students' => $totalStudents,
                'pending_reviews' => $pendingReviews,
                'average_quiz_score' => (int) round($avgQuizScore),
            ],
        ]);
    }

    public function instructorNotifications(Request $request)
    {
        $user = $request->user();

        $courseIds = Course::query()
            ->where('instructor_id', $user->id)
            ->pluck('id');

        $draftCourseNotifications = Course::query()
            ->whereIn('id', $courseIds)
            ->where('is_published', false)
            ->latest('updated_at')
            ->limit(10)
            ->get(['id', 'title', 'updated_at', 'created_at'])
            ->map(function (Course $course) {
                $date = $course->updated_at ?? $course->created_at;

                return [
                    'id' => 'course-'.$course->id,
                    'title' => 'Cours en brouillon',
                    'message' => '"'.$course->title.'" n\'est pas encore publie.',
                    'type' => 'warning',
                    'read' => false,
                    'date' => $date?->toISOString() ?? now()->toISOString(),
                ];
            });

        $assignmentNotifications = Assignment::query()
            ->whereIn('course_id', $courseIds)
            ->whereNotNull('due_date')
            ->with('course:id,title')
            ->latest('due_date')
            ->limit(12)
            ->get(['id', 'title', 'course_id', 'due_date'])
            ->map(function (Assignment $assignment) {
                $dueDate = $assignment->due_date;
                $daysUntilDue = $dueDate ? (int) ceil(now()->diffInSeconds($dueDate, false) / 86400) : null;

                return [
                    'id' => 'assignment-'.$assignment->id,
                    'title' => 'Echeance de devoir',
                    'message' => $daysUntilDue !== null && $daysUntilDue <= 2
                        ? '"'.$assignment->title.'" se termine dans '.max($daysUntilDue, 0).' jour(s).'
                        : '"'.$assignment->title.'" est en cours pour '.($assignment->course?->title ?? 'le cours').'.',
                    'type' => $daysUntilDue !== null && $daysUntilDue <= 2 ? 'warning' : 'info',
                    'read' => false,
                    'date' => $dueDate?->toISOString() ?? now()->toISOString(),
                ];
            });

        $messageNotifications = AssignmentSubmission::query()
            ->whereIn('assignment_id', function ($query) use ($courseIds) {
                $query->select('id')
                    ->from('assignments')
                    ->whereIn('course_id', $courseIds);
            })
            ->with([
                'user:id,first_name,last_name',
                'assignment:id,title,course_id',
                'assignment.course:id,title',
            ])
            ->latest('submitted_at')
            ->limit(12)
            ->get(['id', 'assignment_id', 'user_id', 'status', 'submitted_at', 'updated_at', 'created_at'])
            ->map(function (AssignmentSubmission $submission) {
                $studentName = trim(($submission->user?->first_name ?? '').' '.($submission->user?->last_name ?? ''));
                $date = $submission->submitted_at ?? $submission->updated_at ?? $submission->created_at;

                return [
                    'id' => 'message-'.$submission->id,
                    'title' => 'Message de '.($studentName !== '' ? $studentName : 'etudiant'),
                    'message' => ($submission->assignment?->title ?? 'Devoir').' - nouvelle soumission ('.($submission->assignment?->course?->title ?? 'Cours').')',
                    'type' => 'info',
                    'read' => $submission->status !== 'submitted',
                    'date' => $date?->toISOString() ?? now()->toISOString(),
                ];
            });

        $quizNotifications = Quiz::query()
            ->whereIn('course_id', $courseIds)
            ->withCount('attempts')
            ->latest('updated_at')
            ->limit(10)
            ->get(['id', 'title', 'updated_at', 'created_at'])
            ->filter(function (Quiz $quiz) {
                return (int) $quiz->attempts_count === 0;
            })
            ->map(function (Quiz $quiz) {
                $date = $quiz->updated_at ?? $quiz->created_at;

                return [
                    'id' => 'quiz-'.$quiz->id,
                    'title' => 'Quiz a finaliser',
                    'message' => 'Le quiz "'.$quiz->title.'" est encore en brouillon.',
                    'type' => 'warning',
                    'read' => false,
                    'date' => $date?->toISOString() ?? now()->toISOString(),
                ];
            });

        $notifications = $messageNotifications
            ->concat($assignmentNotifications)
            ->concat($quizNotifications)
            ->concat($draftCourseNotifications)
            ->sortByDesc(function (array $item) {
                return $item['date'];
            })
            ->take(30)
            ->values();

        return response()->json($notifications);
    }

    public function instructorStats(Request $request)
    {
        $user = $request->user();

        $courseIds = Course::query()
            ->where('instructor_id', $user->id)
            ->pluck('id');

        $totalStudents = Enrollment::query()
            ->whereIn('course_id', $courseIds)
            ->distinct('user_id')
            ->count('user_id');

        $totalCourses = $courseIds->count();

        $weeklyViews = LessonProgress::query()
            ->join('lessons', 'lessons.id', '=', 'lesson_progress.lesson_id')
            ->join('chapters', 'chapters.id', '=', 'lessons.chapter_id')
            ->whereIn('chapters.course_id', $courseIds)
            ->where('lesson_progress.updated_at', '>=', now()->subDays(7))
            ->count();

        $certificatesIssued = Certificate::query()
            ->whereIn('course_id', $courseIds)
            ->count();

        $avgScore = (float) (QuizAttempt::query()
            ->whereIn('quiz_id', function ($query) use ($courseIds) {
                $query->select('id')
                    ->from('quizzes')
                    ->whereIn('course_id', $courseIds);
            })
            ->avg('score') ?? 0);

        $engagementRate = max(0, min(100, (int) round($avgScore)));

        $weeklyActivity = collect(range(6, 0))->map(function (int $daysAgo) use ($courseIds) {
            $date = now()->subDays($daysAgo)->startOfDay();
            $nextDate = (clone $date)->addDay();

            $views = LessonProgress::query()
                ->join('lessons', 'lessons.id', '=', 'lesson_progress.lesson_id')
                ->join('chapters', 'chapters.id', '=', 'lessons.chapter_id')
                ->whereIn('chapters.course_id', $courseIds)
                ->whereBetween('lesson_progress.updated_at', [$date, $nextDate])
                ->count();

            $completions = LessonProgress::query()
                ->join('lessons', 'lessons.id', '=', 'lesson_progress.lesson_id')
                ->join('chapters', 'chapters.id', '=', 'lessons.chapter_id')
                ->whereIn('chapters.course_id', $courseIds)
                ->where('lesson_progress.is_completed', true)
                ->whereBetween('lesson_progress.updated_at', [$date, $nextDate])
                ->count();

            return [
                'day' => $date->locale('fr')->shortDayName,
                'views' => $views,
                'completions' => $completions,
            ];
        })->values();

        $topCourses = Course::query()
            ->whereIn('id', $courseIds)
            ->withCount('enrollments')
            ->orderByDesc('enrollments_count')
            ->limit(5)
            ->get()
            ->map(function (Course $course) {
                $avgCourseScore = (float) (QuizAttempt::query()
                    ->whereIn('quiz_id', function ($query) use ($course) {
                        $query->select('id')
                            ->from('quizzes')
                            ->where('course_id', $course->id);
                    })
                    ->avg('score') ?? 0);

                $rating = max(1, min(5, round($avgCourseScore / 20, 1)));

                return [
                    'title' => $course->title,
                    'student_count' => (int) $course->enrollments_count,
                    'progress' => (int) round($avgCourseScore),
                    'rating' => $rating,
                ];
            })
            ->values();

        return response()->json([
            'total_students' => $totalStudents,
            'total_courses' => $totalCourses,
            'weekly_views' => $weeklyViews,
            'certificates_issued' => $certificatesIssued,
            'engagement_rate' => $engagementRate,
            'weekly_activity' => $weeklyActivity,
            'top_courses' => $topCourses,
        ]);
    }

    // ==================== QUIZ QUESTIONS ====================

    public function instructorQuizQuestions(Request $request, Quiz $quiz)
    {
        $user = $request->user();

        $isOwned = Course::query()
            ->where('id', $quiz->course_id)
            ->where('instructor_id', $user->id)
            ->exists();

        if (!$isOwned) {
            return response()->json(['message' => 'Quiz not found.'], 404);
        }

        $questions = QuizQuestion::query()
            ->where('quiz_id', $quiz->id)
            ->with(['options' => function ($query) {
                $query->orderBy('order');
            }])
            ->orderBy('order')
            ->get()
            ->map(function (QuizQuestion $question) {
                return [
                    'id' => $question->id,
                    'quiz_id' => $question->quiz_id,
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'order' => $question->order,
                    'points' => $question->points,
                    'options' => $question->options->map(function (QuizOption $option) {
                        return [
                            'id' => $option->id,
                            'option_text' => $option->option_text,
                            'is_correct' => $option->is_correct,
                            'order' => $option->order,
                        ];
                    })->values(),
                ];
            })
            ->values();

        return response()->json($questions);
    }

    public function instructorCreateQuizQuestion(Request $request, Quiz $quiz)
    {
        $user = $request->user();

        $isOwned = Course::query()
            ->where('id', $quiz->course_id)
            ->where('instructor_id', $user->id)
            ->exists();

        if (!$isOwned) {
            return response()->json(['message' => 'Quiz not found.'], 404);
        }

        $validated = $request->validate([
            'question_text' => ['required', 'string', 'max:5000'],
            'question_type' => ['nullable', Rule::in(['multiple_choice', 'true_false', 'short_answer'])],
            'order' => ['nullable', 'integer', 'min:0'],
            'points' => ['nullable', 'integer', 'min:1'],
            'options' => ['nullable', 'array', 'min:1'],
            'options.*.option_text' => ['required', 'string', 'max:1000'],
            'options.*.is_correct' => ['nullable', 'boolean'],
            'options.*.order' => ['nullable', 'integer', 'min:0'],
        ]);

        $maxOrder = QuizQuestion::where('quiz_id', $quiz->id)->max('order') ?? 0;

        $question = QuizQuestion::query()->create([
            'quiz_id' => $quiz->id,
            'question_text' => trim($validated['question_text']),
            'question_type' => $validated['question_type'] ?? 'multiple_choice',
            'order' => $validated['order'] ?? ($maxOrder + 1),
            'points' => $validated['points'] ?? 1,
        ]);

        if (!empty($validated['options'])) {
            foreach ($validated['options'] as $index => $optionData) {
                QuizOption::query()->create([
                    'question_id' => $question->id,
                    'option_text' => trim($optionData['option_text']),
                    'is_correct' => $optionData['is_correct'] ?? false,
                    'order' => $optionData['order'] ?? $index,
                ]);
            }
        }

        $question->load('options');

        return response()->json([
            'id' => $question->id,
            'quiz_id' => $question->quiz_id,
            'question_text' => $question->question_text,
            'question_type' => $question->question_type,
            'order' => $question->order,
            'points' => $question->points,
            'options' => $question->options->map(function (QuizOption $option) {
                return [
                    'id' => $option->id,
                    'option_text' => $option->option_text,
                    'is_correct' => $option->is_correct,
                    'order' => $option->order,
                ];
            })->values(),
        ], 201);
    }

    public function instructorUpdateQuizQuestion(Request $request, QuizQuestion $question)
    {
        $user = $request->user();

        $isOwned = Course::query()
            ->whereHas('quizzes', function ($query) use ($question) {
                $query->where('id', $question->quiz_id);
            })
            ->where('instructor_id', $user->id)
            ->exists();

        if (!$isOwned) {
            return response()->json(['message' => 'Question not found.'], 404);
        }

        $validated = $request->validate([
            'question_text' => ['sometimes', 'required', 'string', 'max:5000'],
            'question_type' => ['sometimes', 'required', Rule::in(['multiple_choice', 'true_false', 'short_answer'])],
            'order' => ['sometimes', 'required', 'integer', 'min:0'],
            'points' => ['sometimes', 'required', 'integer', 'min:1'],
        ]);

        $question->fill($validated);
        $question->save();

        $question->load('options');

        return response()->json([
            'id' => $question->id,
            'quiz_id' => $question->quiz_id,
            'question_text' => $question->question_text,
            'question_type' => $question->question_type,
            'order' => $question->order,
            'points' => $question->points,
            'options' => $question->options->map(function (QuizOption $option) {
                return [
                    'id' => $option->id,
                    'option_text' => $option->option_text,
                    'is_correct' => $option->is_correct,
                    'order' => $option->order,
                ];
            })->values(),
        ]);
    }

    public function instructorDeleteQuizQuestion(Request $request, QuizQuestion $question)
    {
        $user = $request->user();

        $isOwned = Course::query()
            ->whereHas('quizzes', function ($query) use ($question) {
                $query->where('id', $question->quiz_id);
            })
            ->where('instructor_id', $user->id)
            ->exists();

        if (!$isOwned) {
            return response()->json(['message' => 'Question not found.'], 404);
        }

        $question->delete();

        return response()->json(['message' => 'Question deleted.']);
    }

    // ==================== QUIZ OPTIONS ====================

    public function instructorCreateQuizOption(Request $request, QuizQuestion $question)
    {
        $user = $request->user();

        $isOwned = Course::query()
            ->whereHas('quizzes', function ($query) use ($question) {
                $query->where('id', $question->quiz_id);
            })
            ->where('instructor_id', $user->id)
            ->exists();

        if (!$isOwned) {
            return response()->json(['message' => 'Question not found.'], 404);
        }

        $validated = $request->validate([
            'option_text' => ['required', 'string', 'max:1000'],
            'is_correct' => ['nullable', 'boolean'],
            'order' => ['nullable', 'integer', 'min:0'],
        ]);

        $maxOrder = QuizOption::where('question_id', $question->id)->max('order') ?? 0;

        $option = QuizOption::query()->create([
            'question_id' => $question->id,
            'option_text' => trim($validated['option_text']),
            'is_correct' => $validated['is_correct'] ?? false,
            'order' => $validated['order'] ?? ($maxOrder + 1),
        ]);

        return response()->json([
            'id' => $option->id,
            'option_text' => $option->option_text,
            'is_correct' => $option->is_correct,
            'order' => $option->order,
        ], 201);
    }

    public function instructorUpdateQuizOption(Request $request, QuizOption $option)
    {
        $user = $request->user();

        $isOwned = Course::query()
            ->whereHas('quizzes', function ($query) use ($option) {
                $query->whereHas('questions', function ($q) use ($option) {
                    $q->where('id', $option->question_id);
                });
            })
            ->where('instructor_id', $user->id)
            ->exists();

        if (!$isOwned) {
            return response()->json(['message' => 'Option not found.'], 404);
        }

        $validated = $request->validate([
            'option_text' => ['sometimes', 'required', 'string', 'max:1000'],
            'is_correct' => ['sometimes', 'required', 'boolean'],
            'order' => ['sometimes', 'required', 'integer', 'min:0'],
        ]);

        $option->fill($validated);
        $option->save();

        return response()->json([
            'id' => $option->id,
            'option_text' => $option->option_text,
            'is_correct' => $option->is_correct,
            'order' => $option->order,
        ]);
    }

    public function instructorDeleteQuizOption(Request $request, QuizOption $option)
    {
        $user = $request->user();

        $isOwned = Course::query()
            ->whereHas('quizzes', function ($query) use ($option) {
                $query->whereHas('questions', function ($q) use ($option) {
                    $q->where('id', $option->question_id);
                });
            })
            ->where('instructor_id', $user->id)
            ->exists();

        if (!$isOwned) {
            return response()->json(['message' => 'Option not found.'], 404);
        }

        $option->delete();

        return response()->json(['message' => 'Option deleted.']);
    }

    // ==================== ASSIGNMENTS CRUD ====================

    public function instructorCreateAssignment(Request $request)
    {
        $user = $request->user();

        $ownedCourseIds = Course::query()
            ->where('instructor_id', $user->id)
            ->pluck('id');

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:4000'],
            'course_id' => [
                'required',
                'integer',
                Rule::exists('courses', 'id')->where(function ($query) use ($user) {
                    $query->where('instructor_id', $user->id);
                }),
            ],
            'due_date' => ['nullable', 'date'],
        ]);

        $assignment = Assignment::query()->create([
            'title' => trim($validated['title']),
            'description' => isset($validated['description']) ? trim((string) $validated['description']) : null,
            'course_id' => (int) $validated['course_id'],
            'due_date' => isset($validated['due_date']) ? $validated['due_date'] : null,
        ]);

        $this->logActivity('assignment.created', "Devoir créé: {$assignment->title}", [
            'model_type' => Assignment::class,
            'model_id' => $assignment->id,
        ]);

        $assignment->load('course:id,title');

        $enrollmentCount = Enrollment::query()
            ->where('course_id', $assignment->course_id)
            ->count();

        return response()->json([
            'id' => $assignment->id,
            'title' => $assignment->title,
            'description' => $assignment->description,
            'course_id' => $assignment->course_id,
            'course_title' => $assignment->course?->title ?? 'Cours',
            'due_date' => $assignment->due_date?->toISOString(),
            'submission_count' => 0,
            'total_students' => $enrollmentCount,
            'status' => $this->computeAssignmentStatus($assignment),
        ], 201);
    }

    public function instructorUpdateAssignment(Request $request, Assignment $assignment)
    {
        $user = $request->user();

        $ownedCourseIds = Course::query()
            ->where('instructor_id', $user->id)
            ->pluck('id');

        if (!$ownedCourseIds->contains($assignment->course_id)) {
            return response()->json(['message' => 'Assignment not found.'], 404);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:4000'],
            'course_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('courses', 'id')->where(function ($query) use ($user) {
                    $query->where('instructor_id', $user->id);
                }),
            ],
            'due_date' => ['sometimes', 'nullable', 'date'],
        ]);

        $updatePayload = [];

        if (array_key_exists('title', $validated)) {
            $updatePayload['title'] = trim((string) $validated['title']);
        }

        if (array_key_exists('description', $validated)) {
            $updatePayload['description'] = $validated['description'] !== null
                ? trim((string) $validated['description'])
                : null;
        }

        if (array_key_exists('course_id', $validated)) {
            $updatePayload['course_id'] = (int) $validated['course_id'];
        }

        if (array_key_exists('due_date', $validated)) {
            $updatePayload['due_date'] = $validated['due_date'];
        }

        if (!empty($updatePayload)) {
            $assignment->fill($updatePayload);
            $assignment->save();
        }

        $assignment->load('course:id,title');

        $enrollmentCount = Enrollment::query()
            ->where('course_id', $assignment->course_id)
            ->count();

        return response()->json([
            'id' => $assignment->id,
            'title' => $assignment->title,
            'description' => $assignment->description,
            'course_id' => $assignment->course_id,
            'course_title' => $assignment->course?->title ?? 'Cours',
            'due_date' => $assignment->due_date?->toISOString(),
            'submission_count' => 0,
            'total_students' => $enrollmentCount,
            'status' => $this->computeAssignmentStatus($assignment),
        ]);
    }

    public function instructorDeleteAssignment(Request $request, Assignment $assignment)
    {
        $user = $request->user();

        $isOwned = Course::query()
            ->where('id', $assignment->course_id)
            ->where('instructor_id', $user->id)
            ->exists();

        if (!$isOwned) {
            return response()->json(['message' => 'Assignment not found.'], 404);
        }

        $assignment->delete();

        return response()->json(['message' => 'Assignment deleted.']);
    }

    private function computeAssignmentStatus(Assignment $assignment): string
    {
        if ($assignment->due_date) {
            return $assignment->due_date->isPast() ? 'completed' : 'active';
        }

        return 'draft';
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
