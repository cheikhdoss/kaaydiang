<?php

use App\Http\Controllers\Api\AuthController;
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
        Route::post('/courses', [CourseManagementController::class, 'store']);
        Route::put('/courses/{course}', [CourseManagementController::class, 'update']);
        Route::delete('/courses/{course}', [CourseManagementController::class, 'destroy']);

        Route::post('/courses/{course}/chapters', [ChapterManagementController::class, 'store']);
        Route::put('/chapters/{chapter}', [ChapterManagementController::class, 'update']);
        Route::delete('/chapters/{chapter}', [ChapterManagementController::class, 'destroy']);

        Route::post('/chapters/{chapter}/lessons', [LessonManagementController::class, 'store']);
        Route::put('/lessons/{lesson}', [LessonManagementController::class, 'update']);
        Route::delete('/lessons/{lesson}', [LessonManagementController::class, 'destroy']);
    });

    Route::middleware('role:student')->prefix('student')->group(function () {
        Route::get('/catalog', [StudentLearningController::class, 'catalog']);
        Route::get('/my-courses', [StudentLearningController::class, 'myCourses']);
        Route::get('/supplements/deadlines', [StudentLearningController::class, 'deadlines']);
        Route::get('/supplements/certificates', [StudentLearningController::class, 'certificates']);
        Route::get('/supplements/next-lesson', [StudentLearningController::class, 'nextLesson']);
        Route::post('/enroll/{course}', [StudentLearningController::class, 'enroll']);
        Route::post('/lessons/{lesson}/complete', [StudentLearningController::class, 'markLessonCompleted']);
    });

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/users', [AdminManagementController::class, 'users']);
        Route::patch('/users/{user}/role', [AdminManagementController::class, 'updateRole']);
        Route::patch('/users/{user}/status', [AdminManagementController::class, 'updateStatus']);
    });
});
