<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminHealthController;
use App\Http\Controllers\Api\AdminManagementController;
use App\Http\Controllers\Api\ChapterManagementController;
use App\Http\Controllers\Api\CourseManagementController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\LessonManagementController;
use App\Http\Controllers\Api\StudentLearningController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::prefix('dashboard')->group(function () {
        Route::get('/student', [DashboardController::class, 'student'])->middleware('role:student');
        Route::get('/student/modules', [DashboardController::class, 'studentModules'])->middleware('role:student');
        Route::get('/instructor', [DashboardController::class, 'instructor'])->middleware('role:instructor');
        Route::get('/admin', [DashboardController::class, 'admin'])->middleware('role:admin');
        Route::get('/admin/modules', [DashboardController::class, 'adminModules'])->middleware('role:admin');
    });

    Route::middleware('role:instructor')->prefix('instructor')->group(function () {
        Route::get('/courses', [CourseManagementController::class, 'index']);
        Route::get('/courses/{course}', [CourseManagementController::class, 'show']);
        Route::post('/courses', [CourseManagementController::class, 'store']);
        Route::put('/courses/{course}', [CourseManagementController::class, 'update']);
        Route::delete('/courses/{course}', [CourseManagementController::class, 'destroy']);

        Route::get('/calendar', [DashboardController::class, 'instructorCalendar']);
        Route::get('/quizzes', [DashboardController::class, 'instructorQuizzes']);
        Route::post('/quizzes', [DashboardController::class, 'instructorCreateQuiz']);
        Route::put('/quizzes/{quiz}', [DashboardController::class, 'instructorUpdateQuiz']);
        Route::delete('/quizzes/{quiz}', [DashboardController::class, 'instructorDeleteQuiz']);

        // Quiz Questions CRUD
        Route::get('/quizzes/{quiz}/questions', [DashboardController::class, 'instructorQuizQuestions']);
        Route::post('/quizzes/{quiz}/questions', [DashboardController::class, 'instructorCreateQuizQuestion']);
        Route::put('/quiz-questions/{question}', [DashboardController::class, 'instructorUpdateQuizQuestion']);
        Route::delete('/quiz-questions/{question}', [DashboardController::class, 'instructorDeleteQuizQuestion']);

        // Quiz Options CRUD (nested under questions)
        Route::post('/quiz-questions/{question}/options', [DashboardController::class, 'instructorCreateQuizOption']);
        Route::put('/quiz-options/{option}', [DashboardController::class, 'instructorUpdateQuizOption']);
        Route::delete('/quiz-options/{option}', [DashboardController::class, 'instructorDeleteQuizOption']);

        // Assignments CRUD
        Route::get('/assignments', [DashboardController::class, 'instructorAssignments']);
        Route::post('/assignments', [DashboardController::class, 'instructorCreateAssignment']);
        Route::put('/assignments/{assignment}', [DashboardController::class, 'instructorUpdateAssignment']);
        Route::delete('/assignments/{assignment}', [DashboardController::class, 'instructorDeleteAssignment']);
        Route::get('/assignments/{assignment}/submissions', [DashboardController::class, 'instructorAssignmentSubmissions']);
        Route::patch('/assignments/{assignment}/submissions/{submission}', [DashboardController::class, 'instructorGradeAssignmentSubmission']);
        Route::get('/students', [DashboardController::class, 'instructorStudents']);
        Route::get('/messages', [DashboardController::class, 'instructorMessages']);
        Route::get('/messages/{student}/thread', [DashboardController::class, 'instructorMessageThread']);
        Route::post('/messages/{student}/thread', [DashboardController::class, 'instructorSendMessage']);
        Route::post('/messages/{student}/thread/read', [DashboardController::class, 'markInstructorThreadRead']);
        Route::get('/stats', [DashboardController::class, 'instructorStats']);
        Route::get('/notifications', [DashboardController::class, 'instructorNotifications']);
        Route::get('/profile', [DashboardController::class, 'instructorProfile']);

        Route::post('/courses/{course}/chapters', [ChapterManagementController::class, 'store']);
        Route::post('/courses/{course}/chapters/reorder', [ChapterManagementController::class, 'reorder']);
        Route::put('/chapters/{chapter}', [ChapterManagementController::class, 'update']);
        Route::delete('/chapters/{chapter}', [ChapterManagementController::class, 'destroy']);

        Route::post('/chapters/{chapter}/lessons', [LessonManagementController::class, 'store']);
        Route::post('/chapters/{chapter}/lessons/reorder', [LessonManagementController::class, 'reorder']);
        Route::post('/chapters/{chapter}/assets', [ChapterManagementController::class, 'uploadAssets']);
        Route::post('/lessons/{lesson}/blocks/{blockId}/pdf', [LessonManagementController::class, 'uploadBlockPdf']);
        Route::put('/lessons/{lesson}', [LessonManagementController::class, 'update']);
        Route::delete('/lessons/{lesson}', [LessonManagementController::class, 'destroy']);
    });

    Route::middleware('role:student')->prefix('student')->group(function () {
        Route::get('/catalog', [StudentLearningController::class, 'catalog']);
        Route::get('/my-courses', [StudentLearningController::class, 'myCourses']);
        Route::get('/courses/{course}', [StudentLearningController::class, 'courseDetail']);
        Route::get('/calendar', [DashboardController::class, 'studentCalendar']);
        Route::get('/messages', [DashboardController::class, 'studentMessages']);
        Route::get('/messages/{conversation}/thread', [DashboardController::class, 'studentMessageThread']);
        Route::post('/messages/{conversation}/thread', [DashboardController::class, 'sendStudentMessage']);
        Route::post('/messages/{conversation}/thread/read', [DashboardController::class, 'markStudentMessageThreadRead']);
        Route::get('/supplements/deadlines', [StudentLearningController::class, 'deadlines']);
        Route::get('/supplements/certificates', [StudentLearningController::class, 'certificates']);
        Route::get('/supplements/next-lesson', [StudentLearningController::class, 'nextLesson']);
        Route::get('/grades', [StudentLearningController::class, 'grades']);
        Route::get('/notifications', [StudentLearningController::class, 'notifications']);
        Route::post('/notifications/{notificationId}/read', [StudentLearningController::class, 'markNotificationRead']);
        Route::post('/notifications/read-all', [StudentLearningController::class, 'markAllNotificationsRead']);
        Route::post('/assignments/{assignment}/submit', [StudentLearningController::class, 'submitAssignment']);
        Route::get('/quizzes', [StudentLearningController::class, 'quizzes']);
        Route::get('/quizzes/{quiz}', [StudentLearningController::class, 'quizDetail']);
        Route::post('/quizzes/{quiz}/submit', [StudentLearningController::class, 'submitQuiz']);
        Route::get('/quizzes/{quiz}/result', [StudentLearningController::class, 'quizResult']);
        Route::get('/certificates/{certificate}/download', [StudentLearningController::class, 'downloadCertificate']);
        Route::get('/certificates/{certificate}/view', [StudentLearningController::class, 'viewCertificate']);
        Route::post('/enroll/{course}', [StudentLearningController::class, 'enroll']);
        Route::post('/lessons/{lesson}/complete', [StudentLearningController::class, 'markLessonCompleted']);
    });

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/users', [AdminManagementController::class, 'users']);
        Route::post('/users', [AdminManagementController::class, 'store']);
        Route::patch('/users/{user}/role', [AdminManagementController::class, 'updateRole']);
        Route::patch('/users/{user}/status', [AdminManagementController::class, 'updateStatus']);

        // Platform health & stats
        Route::get('/stats', [AdminHealthController::class, 'stats']);
        Route::get('/chart-data', [AdminHealthController::class, 'chartData']);
        Route::get('/activity-logs', [AdminHealthController::class, 'activityLogs']);

        // Content moderation - courses
        Route::get('/courses', [AdminHealthController::class, 'courses']);
        Route::patch('/courses/{course}/status', [AdminHealthController::class, 'toggleCourseStatus']);
        Route::delete('/courses/{course}', [AdminHealthController::class, 'deleteCourse']);
    });
});
