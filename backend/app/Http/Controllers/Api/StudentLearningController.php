<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\StudentMessageRead;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\NotificationRead;
use App\Models\Quiz;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\QuizOption;
use App\Models\QuizQuestion;
use App\Models\InstructorMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

    public function courseDetail(Request $request, Course $course)
    {
        $user = $request->user();

        $isEnrolled = Enrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->exists();

        if (!$isEnrolled) {
            return response()->json(['message' => 'You must enroll to access this course.'], 403);
        }

        $course->load([
            'instructor:id,first_name,last_name',
            'chapters' => function ($chapterQuery) {
                $chapterQuery
                    ->select('id', 'course_id', 'title', 'description', 'order')
                    ->orderBy('order')
                    ->with([
                        'lessons' => function ($lessonQuery) {
                            $lessonQuery
                                ->select('id', 'chapter_id', 'title', 'content', 'blocks', 'video_url', 'duration', 'order')
                                ->orderBy('order');
                        },
                    ]);
            },
        ]);

        $completedLessonIds = LessonProgress::query()
            ->where('user_id', $user->id)
            ->where('is_completed', true)
            ->whereIn('lesson_id', function ($query) use ($course) {
                $query->select('lessons.id')
                    ->from('lessons')
                    ->join('chapters', 'chapters.id', '=', 'lessons.chapter_id')
                    ->where('chapters.course_id', $course->id);
            })
            ->pluck('lesson_id')
            ->map(fn ($id) => (int) $id)
            ->flip();

        $encounteredFirstIncomplete = false;

        $chapters = $course->chapters->map(function ($chapter) use ($completedLessonIds, &$encounteredFirstIncomplete) {
            return [
                'id' => $chapter->id,
                'title' => $chapter->title,
                'description' => $chapter->description,
                'lessons' => $chapter->lessons->map(function ($lesson) use ($completedLessonIds, &$encounteredFirstIncomplete) {
                    $isCompleted = $completedLessonIds->has((int) $lesson->id);
                    $isLocked = !$isCompleted && $encounteredFirstIncomplete;

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

                    $hasBlocks = count($normalizedBlocks) > 0;

                    if (!$isCompleted && !$encounteredFirstIncomplete) {
                        $encounteredFirstIncomplete = true;
                    }

                    return [
                        'id' => $lesson->id,
                        'title' => $lesson->title,
                        'type' => $hasBlocks ? 'blocks' : ($lesson->video_url ? 'video' : 'pdf'),
                        'duration' => (int) round(((int) $lesson->duration) / 60),
                        'completed' => $isCompleted,
                        'locked' => $isLocked,
                        'resourceUrl' => $lesson->video_url,
                        'description' => $lesson->content,
                        'blocks' => $normalizedBlocks,
                    ];
                })->values(),
            ];
        })->values();

        return response()->json([
            'id' => $course->id,
            'title' => $course->title,
            'description' => $course->description,
            'thumbnail' => $course->thumbnail,
            'instructor' => trim(($course->instructor?->first_name ?? '').' '.($course->instructor?->last_name ?? '')),
            'level' => $course->level,
            'enrolledStudents' => Enrollment::query()->where('course_id', $course->id)->count(),
            'chapters' => $chapters,
        ]);
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

    public function grades(Request $request)
    {
        $user = $request->user();

        $quizGrades = QuizAttempt::query()
            ->where('user_id', $user->id)
            ->with(['quiz:id,title,course_id', 'quiz.course:id,title'])
            ->latest('attempted_at')
            ->limit(50)
            ->get()
            ->map(function ($attempt) {
                return [
                    'id' => 'quiz-'.$attempt->id,
                    'title' => $attempt->quiz?->title ?? 'Quiz',
                    'type' => 'quiz',
                    'score' => (int) $attempt->score,
                    'max_score' => 100,
                    'course' => $attempt->quiz?->course?->title ?? 'Cours',
                    'date' => ($attempt->attempted_at ?? $attempt->created_at)?->toISOString(),
                ];
            });

        $assignmentGrades = AssignmentSubmission::query()
            ->where('user_id', $user->id)
            ->whereNotNull('score')
            ->with(['assignment:id,title,course_id', 'assignment.course:id,title'])
            ->latest('updated_at')
            ->limit(50)
            ->get()
            ->map(function (AssignmentSubmission $submission) {
                return [
                    'id' => 'assignment-'.$submission->id,
                    'title' => $submission->assignment?->title ?? 'Devoir',
                    'type' => 'assignment',
                    'score' => (int) ($submission->score ?? 0),
                    'max_score' => 100,
                    'course' => $submission->assignment?->course?->title ?? 'Cours',
                    'date' => ($submission->updated_at ?? $submission->submitted_at ?? $submission->created_at)?->toISOString(),
                ];
            });

        $grades = $quizGrades
            ->concat($assignmentGrades)
            ->sortByDesc('date')
            ->values();

        $average = $grades->isNotEmpty()
            ? (int) round($grades->avg('score'))
            : 0;

        return response()->json([
            'summary' => [
                'average' => $average,
                'total_quizzes' => $quizGrades->count(),
                'total_assignments' => $assignmentGrades->count(),
                'best_score' => $grades->max('score') ?? 0,
            ],
            'grades' => $grades,
        ]);
    }

    public function notifications(Request $request)
    {
        $user = $request->user();

        $courseIds = Enrollment::query()
            ->where('user_id', $user->id)
            ->pluck('course_id');

        $quizNotifications = QuizAttempt::query()
            ->where('user_id', $user->id)
            ->with(['quiz:id,title,course_id', 'quiz.course:id,title'])
            ->latest('attempted_at')
            ->limit(20)
            ->get()
            ->map(function ($attempt) {
                $score = (int) $attempt->score;

                return [
                    'id' => 'quiz-'.$attempt->id,
                    'title' => 'Note de quiz disponible',
                    'message' => 'Vous avez obtenu '.$score.'/100 sur "'.($attempt->quiz?->title ?? 'Quiz').'".',
                    'type' => $score >= 70 ? 'success' : 'warning',
                    'read' => false,
                    'date' => ($attempt->attempted_at ?? $attempt->created_at)?->toISOString(),
                ];
            });

        $assignmentNotifications = AssignmentSubmission::query()
            ->where('user_id', $user->id)
            ->with(['assignment:id,title,course_id,due_date', 'assignment.course:id,title'])
            ->latest('updated_at')
            ->limit(20)
            ->get()
            ->map(function (AssignmentSubmission $submission) {
                $score = $submission->score;
                $status = (string) $submission->status;

                $title = $score !== null ? 'Devoir corrige' : 'Soumission en cours';
                $message = $score !== null
                    ? 'Votre devoir "'.($submission->assignment?->title ?? 'Devoir').'" a ete corrige. Score: '.((int) $score).'/100.'
                    : 'Votre soumission "'.($submission->assignment?->title ?? 'Devoir').'" est en attente de correction.';

                $type = $status === 'rejected'
                    ? 'error'
                    : ($score !== null && (int) $score >= 70 ? 'success' : 'info');

                $read = in_array($status, ['reviewed', 'rejected'], true);

                return [
                    'id' => 'assignment-'.$submission->id,
                    'title' => $title,
                    'message' => $message,
                    'type' => $type,
                    'read' => $read,
                    'date' => ($submission->updated_at ?? $submission->submitted_at ?? $submission->created_at)?->toISOString(),
                ];
            });

        $deadlineNotifications = Assignment::query()
            ->whereIn('course_id', $courseIds)
            ->whereNotNull('due_date')
            ->with('course:id,title')
            ->orderBy('due_date')
            ->limit(20)
            ->get()
            ->filter(function (Assignment $assignment) {
                return $assignment->due_date?->between(now()->subDays(1), now()->addDays(5)) ?? false;
            })
            ->map(function (Assignment $assignment) {
                $dueDate = $assignment->due_date;
                $daysUntilDue = $dueDate ? (int) ceil(now()->diffInSeconds($dueDate, false) / 86400) : 0;

                return [
                    'id' => 'deadline-'.$assignment->id,
                    'title' => $daysUntilDue < 0 ? 'Devoir en retard' : 'Echeance proche',
                    'message' => $daysUntilDue < 0
                        ? 'Le devoir "'.$assignment->title.'" est depasse depuis '.abs($daysUntilDue).' jour(s).'
                        : 'Le devoir "'.$assignment->title.'" est a rendre dans '.max($daysUntilDue, 0).' jour(s).',
                    'type' => $daysUntilDue < 0 ? 'error' : 'warning',
                    'read' => false,
                    'date' => $dueDate?->toISOString() ?? now()->toISOString(),
                ];
            });

        $notifications = $quizNotifications
            ->concat($assignmentNotifications)
            ->concat($deadlineNotifications)
            ->sortByDesc('date')
            ->take(40)
            ->values();

        $readIds = NotificationRead::query()
            ->where('user_id', $user->id)
            ->pluck('notification_id')
            ->flip();

        $notifications = $notifications
            ->map(function (array $notification) use ($readIds) {
                if ($readIds->has((string) $notification['id'])) {
                    $notification['read'] = true;
                }

                return $notification;
            })
            ->values();

        return response()->json($notifications);
    }

    public function messageThread(Request $request, int $conversationId)
    {
        $user = $request->user();

        $submission = AssignmentSubmission::query()
            ->where('user_id', $user->id)
            ->where('id', $conversationId)
            ->with([
                'assignment:id,title,course_id',
                'assignment.course:id,title,instructor_id',
                'assignment.course.instructor:id,first_name,last_name',
            ])
            ->first();

        $instructor = null;
        $courseId = null;
        $assignmentMessages = collect();

        if ($submission) {
            $instructor = $submission->assignment?->course?->instructor;
            $courseId = $submission->assignment?->course_id;
            $assignmentMessages = collect([
                [
                    'id' => 'submission-'.$submission->id,
                    'sender' => 'me',
                    'text' => 'J\'ai soumis le devoir "'.($submission->assignment?->title ?? 'Devoir').'".',
                    'date' => ($submission->submitted_at ?? $submission->created_at)?->toISOString(),
                ],
                [
                    'id' => 'status-'.$submission->id,
                    'sender' => 'instructor',
                    'text' => match ((string) $submission->status) {
                        'reviewed' => 'Votre devoir a ete corrige. Consultez votre resultat.',
                        'rejected' => 'Une revision est demandee sur votre devoir.',
                        default => 'Votre soumission est en attente de correction.',
                    },
                    'date' => ($submission->updated_at ?? $submission->created_at)?->toISOString(),
                ],
            ]);
        }

        $manualMessagesQuery = InstructorMessage::query()
            ->where('student_id', $user->id)
            ->with(['instructor:id,first_name,last_name', 'course:id,title'])
            ->orderBy('created_at', 'desc');

        if ($courseId) {
            $manualMessagesQuery->where(function ($query) use ($courseId) {
                $query->where('course_id', $courseId)
                    ->orWhereNull('course_id');
            });
        }

        $manualMessages = $manualMessagesQuery
            ->limit(25)
            ->get()
            ->reverse()
            ->values();

        if (!$instructor && $manualMessages->isNotEmpty()) {
            $instructor = $manualMessages->first()?->instructor;
        }

        if (!$instructor) {
            return response()->json(['message' => 'Conversation not found.'], 404);
        }

        $messages = $assignmentMessages
            ->concat(
                $manualMessages->map(function (InstructorMessage $message) {
                    return [
                        'id' => (($message->sender_role ?? 'instructor') === 'student' ? 'student-msg-' : 'instructor-msg-').$message->id,
                        'sender' => ($message->sender_role ?? 'instructor') === 'student' ? 'me' : 'instructor',
                        'text' => $message->message,
                        'date' => $message->created_at?->toISOString(),
                    ];
                })
            )
            ->filter(fn (array $item) => !empty($item['text']))
            ->sortBy('date')
            ->values();

        return response()->json([
            'conversation_id' => $conversationId,
            'participant' => [
                'id' => $instructor->id,
                'name' => trim(($instructor->first_name ?? '').' '.($instructor->last_name ?? '')),
                'role' => 'Instructeur',
            ],
            'course' => $submission?->assignment?->course?->title,
            'messages' => $messages,
        ]);
    }

    public function sendMessage(Request $request, int $conversationId)
    {
        $user = $request->user();

        $submission = AssignmentSubmission::query()
            ->where('user_id', $user->id)
            ->where('id', $conversationId)
            ->with('assignment:id,course_id')
            ->first();

        if (!$submission) {
            return response()->json(['message' => 'Conversation not found.'], 404);
        }

        $courseId = $submission->assignment?->course_id;
        if (!$courseId) {
            return response()->json(['message' => 'Course not found for this conversation.'], 422);
        }

        $instructorId = Course::query()->where('id', $courseId)->value('instructor_id');
        if (!$instructorId) {
            return response()->json(['message' => 'Instructor not found for this course.'], 422);
        }

        $validated = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $stored = InstructorMessage::query()->create([
            'instructor_id' => (int) $instructorId,
            'student_id' => $user->id,
            'course_id' => (int) $courseId,
            'message' => trim($validated['message']),
            'sender_role' => 'student',
        ]);

        return response()->json([
            'id' => 'me-msg-'.$stored->id,
            'sender' => 'me',
            'text' => $stored->message,
            'date' => $stored->created_at?->toISOString(),
        ], 201);
    }

    public function markMessageThreadRead(Request $request, int $conversationId)
    {
        $user = $request->user();

        $submission = AssignmentSubmission::query()
            ->where('user_id', $user->id)
            ->where('id', $conversationId)
            ->first();

        if (!$submission) {
            return response()->json(['message' => 'Conversation not found.'], 404);
        }

        StudentMessageRead::query()->updateOrCreate(
            [
                'student_id' => $user->id,
                'conversation_id' => $conversationId,
            ],
            [
                'last_read_at' => now(),
            ]
        );

        return response()->json(['message' => 'Conversation marked as read.']);
    }

    public function markNotificationRead(Request $request, string $notificationId)
    {
        $user = $request->user();

        NotificationRead::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'notification_id' => $notificationId,
            ],
            [
                'read_at' => now(),
            ]
        );

        return response()->json(['message' => 'Notification marked as read.']);
    }

    public function markAllNotificationsRead(Request $request)
    {
        $user = $request->user();

        $notifications = $this->notifications($request)->getData(true);

        $now = now();
        $payload = collect($notifications)
            ->map(fn (array $item) => [
                'user_id' => $user->id,
                'notification_id' => (string) ($item['id'] ?? ''),
                'read_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->filter(fn (array $item) => $item['notification_id'] !== '')
            ->values()
            ->all();

        if (!empty($payload)) {
            NotificationRead::query()->upsert(
                $payload,
                ['user_id', 'notification_id'],
                ['read_at', 'updated_at']
            );
        }

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    public function submitAssignment(Request $request, Assignment $assignment)
    {
        $user = $request->user();

        $isEnrolled = Enrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $assignment->course_id)
            ->exists();

        if (!$isEnrolled) {
            return response()->json(['message' => 'You must enroll to submit this assignment.'], 403);
        }

        $validated = $request->validate([
            'files' => ['required', 'array', 'min:1'],
            'files.*' => ['file', 'max:51200', 'mimes:pdf,zip'],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        $uploadedFiles = collect($request->file('files', []))
            ->filter()
            ->map(function ($file) {
                $path = $file->store('submissions', 'public');

                return [
                    'path' => $path,
                    'name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                    'uploaded_at' => now()->toISOString(),
                ];
            })
            ->values();

        $storedPath = $uploadedFiles->first()['path'] ?? null;

        $submission = AssignmentSubmission::query()->updateOrCreate(
            [
                'assignment_id' => $assignment->id,
                'user_id' => $user->id,
            ],
            [
                'file_url' => $storedPath,
                'student_attachments' => $uploadedFiles->all(),
                'correction_attachments' => null,
                'status' => 'submitted',
                'score' => null,
                'submitted_at' => now(),
            ]
        );

        return response()->json([
            'message' => 'Assignment submitted successfully.',
            'submission' => [
                'id' => $submission->id,
                'assignment_id' => $submission->assignment_id,
                'status' => $submission->status,
                'submitted_at' => $submission->submitted_at?->toISOString(),
                'file_url' => $submission->file_url,
                'student_attachments' => $submission->student_attachments ?? [],
                'note' => $validated['note'] ?? null,
            ],
        ]);
    }

    public function downloadCertificate(Request $request, Certificate $certificate)
    {
        $user = $request->user();

        if ((int) $certificate->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Certificate not found.'], 404);
        }

        $certificate->load('course:id,title');

        $content = implode("\n", [
            'KayyDiang Certificate',
            '--------------------',
            'Code: '.$certificate->certificate_code,
            'Learner: '.trim(($user->first_name ?? '').' '.($user->last_name ?? '')),
            'Course: '.($certificate->course?->title ?? 'Unknown course'),
            'Issued at: '.($certificate->issued_at?->toDateString() ?? 'N/A'),
        ]);

        return response($content, 200, [
            'Content-Type' => 'application/octet-stream',
            'Content-Disposition' => 'attachment; filename="certificate-'.$certificate->id.'.txt"',
        ]);
    }

    public function viewCertificate(Request $request, Certificate $certificate)
    {
        $user = $request->user();

        if ((int) $certificate->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Certificate not found.'], 404);
        }

        $certificate->load('course:id,title,level');

        return response()->json([
            'id' => $certificate->id,
            'certificate_code' => $certificate->certificate_code,
            'issued_at' => $certificate->issued_at?->toISOString(),
            'course' => [
                'id' => $certificate->course?->id,
                'title' => $certificate->course?->title,
                'level' => $certificate->course?->level,
            ],
            'student' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
            ],
        ]);
    }

    // ==================== STUDENT QUIZ ====================

    /**
     * GET /student/quizzes/{quiz}
     * Retourne le quiz avec questions et options (SANS indiquer les bonnes réponses).
     * Vérifie que l'étudiant est inscrit au cours associé.
     */
    public function quizDetail(Request $request, Quiz $quiz)
    {
        $user = $request->user();

        // Vérifier l'inscription au cours
        $isEnrolled = Enrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $quiz->course_id)
            ->exists();

        if (!$isEnrolled) {
            return response()->json(['message' => 'You must enroll in this course to access its quizzes.'], 403);
        }

        // Charger les questions avec options (sans is_correct)
        $questions = QuizQuestion::query()
            ->where('quiz_id', $quiz->id)
            ->with(['options' => function ($query) {
                // On retourne TOUTES les options mais pas is_correct
                $query->orderBy('order');
            }])
            ->orderBy('order')
            ->get()
            ->map(function (QuizQuestion $question) {
                $options = $question->options->map(function (QuizOption $option) {
                    return [
                        'id' => $option->id,
                        'option_text' => $option->option_text,
                        'order' => $option->order,
                        // is_correct est volontairement EXCLU
                    ];
                })->values();

                // Pour true_false, on génère les options si elles n'existent pas
                if ($question->question_type === 'true_false' && $options->isEmpty()) {
                    $options = collect([
                        ['id' => 'true', 'option_text' => 'Vrai', 'order' => 0],
                        ['id' => 'false', 'option_text' => 'Faux', 'order' => 1],
                    ]);
                }

                return [
                    'id' => $question->id,
                    'question_text' => $question->question_text,
                    'question_type' => $question->question_type,
                    'points' => $question->points,
                    'options' => $options,
                ];
            })
            ->values();

        // Vérifier si l'étudiant a déjà tenté ce quiz
        $existingAttempt = QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->latest('attempted_at')
            ->first();

        return response()->json([
            'id' => $quiz->id,
            'title' => $quiz->title,
            'description' => $quiz->description,
            'course_id' => $quiz->course_id,
            'pass_score' => $quiz->pass_score,
            'total_questions' => $questions->count(),
            'total_points' => $questions->sum('points'),
            'questions' => $questions,
            'previous_attempt' => $existingAttempt ? [
                'id' => $existingAttempt->id,
                'score' => (int) $existingAttempt->score,
                'is_passed' => (bool) $existingAttempt->is_passed,
                'attempted_at' => $existingAttempt->attempted_at?->toISOString(),
            ] : null,
        ]);
    }

    /**
     * POST /student/quizzes/{quiz}/submit
     * Reçoit les réponses de l'étudiant, corrige automatiquement,
     * calcule le score, crée un QuizAttempt et les QuizAnswers.
     *
     * Payload attendu :
     * {
     *   "answers": [
     *     { "question_id": 1, "answer_data": {"selected_option_ids": [2, 3]} },
     *     { "question_id": 2, "answer_data": {"value": "true"} },
     *     { "question_id": 3, "answer_data": {"text": "ma réponse"} }
     *   ]
     * }
     */
    public function submitQuiz(Request $request, Quiz $quiz)
    {
        $user = $request->user();

        // Vérifier l'inscription
        $isEnrolled = Enrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $quiz->course_id)
            ->exists();

        if (!$isEnrolled) {
            return response()->json(['message' => 'You must enroll in this course.'], 403);
        }

        $validated = $request->validate([
            'answers' => ['required', 'array', 'min:1'],
            'answers.*.question_id' => ['required', 'integer'],
            'answers.*.answer_data' => ['required', 'array'],
        ]);

        // Charger toutes les questions du quiz avec leurs options correctes
        $questions = QuizQuestion::query()
            ->where('quiz_id', $quiz->id)
            ->with(['options'])
            ->orderBy('order')
            ->get()
            ->keyBy('id');

        if ($questions->isEmpty()) {
            return response()->json(['message' => 'This quiz has no questions.'], 422);
        }

        $totalPoints = $questions->sum('points');
        $earnedPoints = 0;

        // Traiter les réponses dans une transaction
        $answerResults = DB::transaction(function () use ($quiz, $user, $validated, $questions, $totalPoints, &$earnedPoints) {
            // Créer le QuizAttempt
            $attempt = QuizAttempt::query()->create([
                'quiz_id' => $quiz->id,
                'user_id' => $user->id,
                'score' => 0, // sera mis à jour après
                'is_passed' => false,
                'attempted_at' => now(),
            ]);

            $answers = [];

            foreach ($validated['answers'] as $answerPayload) {
                $questionId = (int) $answerPayload['question_id'];
                $answerData = $answerPayload['answer_data'];

                // Skip si la question n'existe pas dans ce quiz
                if (!$questions->has($questionId)) {
                    continue;
                }

                $question = $questions->get($questionId);
                $isCorrect = false;
                $pointsEarned = 0;

                // Corriger selon le type de question
                if ($question->question_type === 'multiple_choice') {
                    $selectedOptionIds = $answerData['selected_option_ids'] ?? [];
                    $correctOptionIds = $question->options
                        ->where('is_correct', true)
                        ->pluck('id')
                        ->toArray();

                    sort($selectedOptionIds);
                    sort($correctOptionIds);

                    $isCorrect = ($selectedOptionIds === $correctOptionIds);
                    $pointsEarned = $isCorrect ? $question->points : 0;
                    $storedAnswerData = ['selected_option_ids' => $selectedOptionIds];
                } elseif ($question->question_type === 'true_false') {
                    $submittedValue = strtolower((string) ($answerData['value'] ?? ''));
                    $correctOption = $question->options->where('is_correct', true)->first();
                    $correctValue = $correctOption ? strtolower($correctOption->option_text) : 'true';

                    $isCorrect = ($submittedValue === $correctValue || $submittedValue === substr($correctValue, 0, 1));
                    $pointsEarned = $isCorrect ? $question->points : 0;
                    $storedAnswerData = ['value' => $submittedValue];
                } elseif ($question->question_type === 'short_answer') {
                    // Pour short_answer, on stocke la réponse mais la correction
                    // nécessite une intervention manuelle (on met 0 par défaut)
                    $isCorrect = false;
                    $pointsEarned = 0;
                    $storedAnswerData = ['text' => (string) ($answerData['text'] ?? '')];
                }

                $earnedPoints += $pointsEarned;

                $answer = QuizAnswer::query()->create([
                    'quiz_attempt_id' => $attempt->id,
                    'question_id' => $questionId,
                    'answer_data' => $storedAnswerData,
                    'is_correct' => $isCorrect,
                    'points_earned' => $pointsEarned,
                ]);

                $answers[] = $answer;
            }

            // Calculer le score final en pourcentage
            $scorePercent = $totalPoints > 0
                ? (int) round(($earnedPoints / $totalPoints) * 100)
                : 0;

            $isPassed = $scorePercent >= $quiz->pass_score;

            // Mettre à jour le QuizAttempt
            $attempt->update([
                'score' => $scorePercent,
                'is_passed' => $isPassed,
            ]);

            return [
                'attempt' => $attempt,
                'answers' => $answers,
                'score_percent' => $scorePercent,
                'is_passed' => $isPassed,
                'total_questions' => $questions->count(),
                'correct_answers' => collect($answers)->where('is_correct', true)->count(),
            ];
        });

        return response()->json([
            'message' => $answerResults['is_passed']
                ? 'Félicitations, vous avez réussi ce quiz !'
                : 'Quiz terminé. Score insuffisant pour la validation.',
            'result' => [
                'attempt_id' => $answerResults['attempt']->id,
                'score' => $answerResults['score_percent'],
                'is_passed' => $answerResults['is_passed'],
                'pass_score' => $quiz->pass_score,
                'total_questions' => $answerResults['total_questions'],
                'correct_answers' => $answerResults['correct_answers'],
            ],
        ], 201);
    }

    /**
     * GET /student/quizzes/{quiz}/result
     * Retourne le résultat détaillé d'une tentative de quiz avec corrections.
     * Optionnel: ?attempt_id=X pour une tentative spécifique, sinon la plus récente.
     */
    public function quizResult(Request $request, Quiz $quiz)
    {
        $user = $request->user();

        // Vérifier l'inscription
        $isEnrolled = Enrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $quiz->course_id)
            ->exists();

        if (!$isEnrolled) {
            return response()->json(['message' => 'You must enroll in this course.'], 403);
        }

        // Trouver la tentative
        $attemptId = $request->query('attempt_id');

        $attempt = QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->when($attemptId, function ($query) use ($attemptId) {
                $query->where('id', $attemptId);
            })
            ->latest('attempted_at')
            ->first();

        if (!$attempt) {
            return response()->json(['message' => 'No quiz attempt found.'], 404);
        }

        // Charger les réponses avec les questions et les options correctes
        $attempt->load(['answers' => function ($query) {
            $query->with(['question' => function ($q) {
                $q->with(['options' => function ($optQuery) {
                    $optQuery->orderBy('order');
                }]);
            }])->orderBy('created_at');
        }]);

        $detailedAnswers = $attempt->answers->map(function (QuizAnswer $answer) {
            $question = $answer->question;

            // Construire la réponse détaillée avec corrections
            $detail = [
                'question_id' => $question->id,
                'question_text' => $question->question_text,
                'question_type' => $question->question_type,
                'points_possible' => $question->points,
                'points_earned' => $answer->points_earned,
                'is_correct' => $answer->is_correct,
                'your_answer' => $answer->answer_data,
            ];

            // Ajouter les bonnes réponses pour comparaison
            if ($question->question_type === 'multiple_choice') {
                $correctOptions = $question->options
                    ->where('is_correct', true)
                    ->map(fn ($opt) => ['id' => $opt->id, 'text' => $opt->option_text])
                    ->values();

                $allOptions = $question->options
                    ->map(fn ($opt) => [
                        'id' => $opt->id,
                        'text' => $opt->option_text,
                        'is_correct' => $opt->is_correct,
                        'was_selected' => in_array($opt->id, $answer->answer_data['selected_option_ids'] ?? []),
                    ])
                    ->values();

                $detail['correct_options'] = $correctOptions;
                $detail['all_options'] = $allOptions;
            } elseif ($question->question_type === 'true_false') {
                $correctOption = $question->options->where('is_correct', true)->first();
                $correctValue = $correctOption ? strtolower($correctOption->option_text) : 'true';

                $detail['correct_answer'] = $correctValue;
                $detail['all_options'] = [
                    ['value' => 'true', 'text' => 'Vrai', 'is_correct' => $correctValue === 'true' || $correctValue === 'vrai'],
                    ['value' => 'false', 'text' => 'Faux', 'is_correct' => $correctValue === 'false' || $correctValue === 'faux'],
                ];
            } elseif ($question->question_type === 'short_answer') {
                $detail['note'] = 'Cette question nécessite une correction manuelle par l\'instructeur.';
            }

            return $detail;
        })->values();

        return response()->json([
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'pass_score' => $quiz->pass_score,
            ],
            'attempt' => [
                'id' => $attempt->id,
                'score' => (int) $attempt->score,
                'is_passed' => (bool) $attempt->is_passed,
                'attempted_at' => $attempt->attempted_at?->toISOString(),
            ],
            'summary' => [
                'total_questions' => $detailedAnswers->count(),
                'correct_answers' => $detailedAnswers->where('is_correct', true)->count(),
                'incorrect_answers' => $detailedAnswers->where('is_correct', false)->count(),
                'total_points_earned' => $detailedAnswers->sum('points_earned'),
                'total_points_possible' => $detailedAnswers->sum('points_possible'),
            ],
            'answers' => $detailedAnswers,
        ]);
    }
}
