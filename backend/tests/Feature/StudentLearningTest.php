<?php

namespace Tests\Feature;

use App\Models\Chapter;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StudentLearningTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_view_catalog_and_enroll(): void
    {
        $instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);

        $course = Course::query()->create([
            'title' => 'Test Course',
            'description' => 'Course description',
            'instructor_id' => $instructor->id,
            'level' => 'beginner',
            'price' => 0,
            'is_published' => true,
        ]);

        Sanctum::actingAs($student);

        $this->getJson('/api/student/catalog')->assertOk();

        $this->postJson("/api/student/enroll/{$course->id}")
            ->assertCreated()
            ->assertJsonPath('message', 'Enrollment successful');
    }

    public function test_student_can_mark_lesson_completed_if_enrolled(): void
    {
        $instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);

        $course = Course::query()->create([
            'title' => 'Progress Course',
            'description' => 'Course description',
            'instructor_id' => $instructor->id,
            'level' => 'beginner',
            'price' => 0,
            'is_published' => true,
        ]);

        $chapter = Chapter::query()->create([
            'title' => 'Chapter 1',
            'description' => null,
            'course_id' => $course->id,
            'order' => 1,
        ]);

        $lesson = Lesson::query()->create([
            'title' => 'Lesson 1',
            'chapter_id' => $chapter->id,
            'duration' => 300,
            'order' => 1,
            'is_free' => true,
        ]);

        Sanctum::actingAs($student);

        $this->postJson("/api/student/enroll/{$course->id}")->assertCreated();

        $this->postJson("/api/student/lessons/{$lesson->id}/complete", [
            'watched_seconds' => 300,
        ])->assertOk();
    }
}
