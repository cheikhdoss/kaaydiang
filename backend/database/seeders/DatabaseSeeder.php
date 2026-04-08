<?php

namespace Database\Seeders;

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
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::query()->updateOrCreate(
            ['email' => 'admin@kaydjangue.local'],
            [
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'name' => 'Super Admin',
                'password' => 'password',
                'role' => User::ROLE_ADMIN,
                'is_active' => true,
            ]
        );

        $instructor = User::query()->updateOrCreate(
            ['email' => 'instructor@kaydjangue.local'],
            [
                'first_name' => 'Awa',
                'last_name' => 'Ndiaye',
                'name' => 'Awa Ndiaye',
                'password' => 'password',
                'role' => User::ROLE_INSTRUCTOR,
                'is_active' => true,
            ]
        );

        $student = User::query()->updateOrCreate(
            ['email' => 'student@kaydjangue.local'],
            [
                'first_name' => 'Moussa',
                'last_name' => 'Fall',
                'name' => 'Moussa Fall',
                'password' => 'password',
                'role' => User::ROLE_STUDENT,
                'is_active' => true,
            ]
        );

        $course = Course::query()->updateOrCreate(
            [
                'title' => 'Laravel + React Masterclass',
                'instructor_id' => $instructor->id,
            ],
            [
                'description' => 'Parcours complet pour lancer une plateforme e-learning moderne.',
                'level' => 'intermediate',
                'price' => 0,
                'is_published' => true,
            ]
        );

        $chapter1 = Chapter::query()->updateOrCreate(
            ['course_id' => $course->id, 'order' => 1],
            ['title' => 'Fondations', 'description' => 'Architecture et setup projet']
        );

        $chapter2 = Chapter::query()->updateOrCreate(
            ['course_id' => $course->id, 'order' => 2],
            ['title' => 'Authentification', 'description' => 'Sanctum, roles et securite']
        );

        $lesson1 = Lesson::query()->updateOrCreate(
            ['chapter_id' => $chapter1->id, 'order' => 1],
            [
                'title' => 'Intro plateforme',
                'content' => 'Presentation de la plateforme',
                'duration' => 600,
                'is_free' => true,
            ]
        );

        $lesson2 = Lesson::query()->updateOrCreate(
            ['chapter_id' => $chapter2->id, 'order' => 1],
            [
                'title' => 'Auth API',
                'content' => 'Mise en place API Auth',
                'duration' => 900,
                'is_free' => false,
            ]
        );

        Enrollment::query()->updateOrCreate(
            ['user_id' => $student->id, 'course_id' => $course->id],
            ['enrolled_at' => now()->subDays(8)]
        );

        LessonProgress::query()->updateOrCreate(
            ['user_id' => $student->id, 'lesson_id' => $lesson1->id],
            ['is_completed' => true, 'watched_seconds' => 600, 'completed_at' => now()->subDays(5)]
        );

        LessonProgress::query()->updateOrCreate(
            ['user_id' => $student->id, 'lesson_id' => $lesson2->id],
            ['is_completed' => false, 'watched_seconds' => 420]
        );

        $quiz = Quiz::query()->updateOrCreate(
            ['course_id' => $course->id, 'title' => 'Quiz Auth Foundations'],
            ['description' => 'Validation des acquis sur Sanctum', 'pass_score' => 70]
        );

        QuizAttempt::query()->updateOrCreate(
            ['quiz_id' => $quiz->id, 'user_id' => $student->id],
            ['score' => 82, 'is_passed' => true, 'attempted_at' => now()->subDays(3)]
        );

        $assignment = Assignment::query()->updateOrCreate(
            ['course_id' => $course->id, 'title' => 'Projet API Dashboard'],
            ['description' => 'Construire les endpoints dashboard', 'due_date' => now()->addDays(4)]
        );

        AssignmentSubmission::query()->updateOrCreate(
            ['assignment_id' => $assignment->id, 'user_id' => $student->id],
            ['status' => 'submitted', 'file_url' => 'submissions/project-api-dashboard.zip', 'submitted_at' => now()->subDay()]
        );

        Certificate::query()->updateOrCreate(
            ['user_id' => $student->id, 'course_id' => $course->id],
            ['certificate_code' => Str::upper(Str::random(12)), 'issued_at' => now()->subHours(6)]
        );

        User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'first_name' => 'Test',
                'last_name' => 'User',
                'name' => 'Test User',
                'password' => 'password',
                'role' => User::ROLE_STUDENT,
                'is_active' => true,
            ]
        );
    }
}
