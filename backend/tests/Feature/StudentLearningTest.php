<?php

namespace Tests\Feature;

use App\Models\Chapter;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Certificate;
use App\Models\User;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
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

    public function test_student_can_view_course_detail_when_enrolled(): void
    {
        $instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);

        $course = Course::query()->create([
            'title' => 'Detail Course',
            'description' => 'Course description',
            'instructor_id' => $instructor->id,
            'level' => 'beginner',
            'price' => 0,
            'is_published' => true,
        ]);

        $chapter = Chapter::query()->create([
            'title' => 'Chapter',
            'description' => null,
            'course_id' => $course->id,
            'order' => 1,
        ]);

        Lesson::query()->create([
            'title' => 'Lesson',
            'chapter_id' => $chapter->id,
            'duration' => 300,
            'order' => 1,
            'is_free' => true,
        ]);

        Sanctum::actingAs($student);

        $this->postJson("/api/student/enroll/{$course->id}")->assertCreated();

        $this->getJson("/api/student/courses/{$course->id}")
            ->assertOk()
            ->assertJsonPath('id', $course->id)
            ->assertJsonStructure([
                'id',
                'title',
                'chapters' => [
                    ['id', 'title', 'lessons'],
                ],
            ]);
    }

    public function test_student_can_submit_assignment_when_enrolled(): void
    {
        $instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);

        $course = Course::query()->create([
            'title' => 'Assignment Course',
            'description' => 'Course description',
            'instructor_id' => $instructor->id,
            'level' => 'beginner',
            'price' => 0,
            'is_published' => true,
        ]);

        $assignment = Assignment::query()->create([
            'course_id' => $course->id,
            'title' => 'Project',
            'description' => 'Submit project',
            'due_date' => now()->addDays(5),
        ]);

        Sanctum::actingAs($student);
        $this->postJson("/api/student/enroll/{$course->id}")->assertCreated();

        $file = UploadedFile::fake()->create('solution.zip', 100, 'application/zip');

        $this->postJson("/api/student/assignments/{$assignment->id}/submit", [
            'files' => [$file],
            'note' => 'Please review',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Assignment submitted successfully.')
            ->assertJsonStructure([
                'submission' => [
                    'id',
                    'assignment_id',
                    'status',
                    'submitted_at',
                    'file_url',
                    'student_attachments' => [
                        ['path', 'name', 'mime_type', 'size', 'uploaded_at'],
                    ],
                ],
            ])
            ->assertJsonPath('submission.student_attachments.0.name', 'solution.zip');
    }

    public function test_student_can_download_own_certificate(): void
    {
        $instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);

        $course = Course::query()->create([
            'title' => 'Certificate Course',
            'description' => 'Course description',
            'instructor_id' => $instructor->id,
            'level' => 'beginner',
            'price' => 0,
            'is_published' => true,
        ]);

        $certificate = Certificate::query()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'certificate_code' => 'TEST-CERT-001',
            'issued_at' => now(),
        ]);

        Sanctum::actingAs($student);

        $this->get("/api/student/certificates/{$certificate->id}/download")
            ->assertOk();
    }

    public function test_student_grades_and_notifications_endpoints_return_real_data(): void
    {
        $instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);

        $course = Course::query()->create([
            'title' => 'Course with evaluations',
            'description' => 'Course description',
            'instructor_id' => $instructor->id,
            'level' => 'beginner',
            'price' => 0,
            'is_published' => true,
        ]);

        $quiz = Quiz::query()->create([
            'course_id' => $course->id,
            'title' => 'Quiz 1',
            'description' => null,
            'pass_score' => 60,
        ]);

        QuizAttempt::query()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $student->id,
            'score' => 88,
            'is_passed' => true,
            'attempted_at' => now()->subDay(),
        ]);

        $assignment = Assignment::query()->create([
            'course_id' => $course->id,
            'title' => 'Assignment 1',
            'description' => 'Work to submit',
            'due_date' => now()->addDays(2),
        ]);

        AssignmentSubmission::query()->create([
            'assignment_id' => $assignment->id,
            'user_id' => $student->id,
            'file_url' => 'submissions/work.zip',
            'status' => 'reviewed',
            'score' => 91,
            'submitted_at' => now()->subDays(2),
        ]);

        
        Sanctum::actingAs($student);
        $this->postJson("/api/student/enroll/{$course->id}")->assertCreated();

        $this->getJson('/api/student/grades')
            ->assertOk()
            ->assertJsonStructure([
                'summary' => ['average', 'total_quizzes', 'total_assignments', 'best_score'],
                'grades' => [
                    ['id', 'title', 'type', 'score', 'max_score', 'course', 'date'],
                ],
            ]);

        $this->getJson('/api/student/notifications')
            ->assertOk()
            ->assertJsonStructure([
                '*' => ['id', 'title', 'message', 'type', 'read', 'date'],
            ]);

        $notificationId = $this->getJson('/api/student/notifications')
            ->assertOk()
            ->json('0.id');

        $this->postJson('/api/student/notifications/'.urlencode((string) $notificationId).'/read')
            ->assertOk()
            ->assertJsonPath('message', 'Notification marked as read.');

        $this->postJson('/api/student/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('message', 'All notifications marked as read.');

        $this->assertDatabaseHas('notification_reads', [
            'user_id' => $student->id,
            'notification_id' => (string) $notificationId,
        ]);
    }

    public function test_student_can_read_and_send_message_thread(): void
    {
        $instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);

        $course = Course::query()->create([
            'title' => 'Messaging course',
            'description' => 'Course description',
            'instructor_id' => $instructor->id,
            'level' => 'beginner',
            'price' => 0,
            'is_published' => true,
        ]);

        $assignment = Assignment::query()->create([
            'course_id' => $course->id,
            'title' => 'Messaging assignment',
            'description' => 'Work to submit',
            'due_date' => now()->addDays(3),
        ]);

        $submission = AssignmentSubmission::query()->create([
            'assignment_id' => $assignment->id,
            'user_id' => $student->id,
            'file_url' => 'submissions/work.zip',
            'status' => 'submitted',
            'score' => null,
            'submitted_at' => now()->subDay(),
        ]);

        Sanctum::actingAs($student);

        $this->postJson('/api/student/enroll/'.$course->id)->assertCreated();

        $this->getJson('/api/student/messages/'.$submission->id.'/thread')
            ->assertOk()
            ->assertJsonPath('conversation_id', $submission->id)
            ->assertJsonPath('participant.id', $instructor->id)
            ->assertJsonStructure([
                'messages' => [
                    ['id', 'sender', 'text', 'date'],
                ],
            ]);

        $this->postJson('/api/student/messages/'.$submission->id.'/thread', [
            'message' => 'Bonjour professeur, pouvez-vous verifier mon rendu ?',
        ])->assertCreated()->assertJsonPath('sender', 'me');

        $this->assertDatabaseHas('instructor_messages', [
            'student_id' => $student->id,
            'instructor_id' => $instructor->id,
            'course_id' => $course->id,
            'sender_role' => 'student',
        ]);
    }
}
