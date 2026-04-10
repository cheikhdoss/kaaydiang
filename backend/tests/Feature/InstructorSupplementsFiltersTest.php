<?php

namespace Tests\Feature;

use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InstructorSupplementsFiltersTest extends TestCase
{
    use RefreshDatabase;

    public function test_instructor_can_filter_quizzes_by_search_status_and_course(): void
    {
        $instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);

        $courseA = Course::query()->create([
            'title' => 'Laravel Masterclass',
            'description' => 'API design',
            'instructor_id' => $instructor->id,
            'level' => 'beginner',
            'price' => 0,
            'is_published' => true,
        ]);

        $courseB = Course::query()->create([
            'title' => 'React Atelier',
            'description' => 'UI practice',
            'instructor_id' => $instructor->id,
            'level' => 'intermediate',
            'price' => 0,
            'is_published' => true,
        ]);

        $draftQuiz = Quiz::query()->create([
            'course_id' => $courseA->id,
            'title' => 'Draft API quiz',
            'description' => 'No attempts yet',
            'pass_score' => 60,
        ]);

        $activeQuiz = Quiz::query()->create([
            'course_id' => $courseA->id,
            'title' => 'Backend filtering challenge',
            'description' => 'Search and status',
            'pass_score' => 60,
        ]);
        $activeQuiz->forceFill([
            'created_at' => now()->subDays(3),
            'updated_at' => now()->subDays(3),
        ])->saveQuietly();

        $completedQuiz = Quiz::query()->create([
            'course_id' => $courseB->id,
            'title' => 'React archived quiz',
            'description' => 'Old quiz',
            'pass_score' => 60,
        ]);
        $completedQuiz->forceFill([
            'created_at' => now()->subDays(45),
            'updated_at' => now()->subDays(45),
        ])->saveQuietly();

        QuizAttempt::query()->create([
            'quiz_id' => $activeQuiz->id,
            'user_id' => $student->id,
            'score' => 84,
            'is_passed' => true,
            'attempted_at' => now()->subDay(),
        ]);

        QuizAttempt::query()->create([
            'quiz_id' => $completedQuiz->id,
            'user_id' => $student->id,
            'score' => 64,
            'is_passed' => true,
            'attempted_at' => now()->subDays(30),
        ]);

        Sanctum::actingAs($instructor);

        $this->getJson('/api/instructor/quizzes?search=backend&status=active&course_id='.$courseA->id)
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $activeQuiz->id)
            ->assertJsonPath('0.status', 'active');

        $this->getJson('/api/instructor/quizzes?status=draft')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $draftQuiz->id)
            ->assertJsonPath('0.status', 'draft');

        $this->getJson('/api/instructor/quizzes?status=completed')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $completedQuiz->id)
            ->assertJsonPath('0.status', 'completed');
    }

    public function test_instructor_can_filter_assignments_and_submission_status_and_search(): void
    {
        $instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
        $studentA = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $studentB = User::factory()->create(['role' => User::ROLE_STUDENT]);

        $course = Course::query()->create([
            'title' => 'Evaluation Course',
            'description' => 'Course description',
            'instructor_id' => $instructor->id,
            'level' => 'beginner',
            'price' => 0,
            'is_published' => true,
        ]);

        $assignmentActive = Assignment::query()->create([
            'course_id' => $course->id,
            'title' => 'Project Milestone',
            'description' => 'Deliverables',
            'due_date' => now()->addDays(5),
        ]);

        $assignmentCompleted = Assignment::query()->create([
            'course_id' => $course->id,
            'title' => 'Archived homework',
            'description' => 'Completed',
            'due_date' => now()->subDays(2),
        ]);

        AssignmentSubmission::query()->create([
            'assignment_id' => $assignmentActive->id,
            'user_id' => $studentA->id,
            'status' => 'submitted',
            'score' => null,
            'submitted_at' => now()->subHour(),
        ]);

        AssignmentSubmission::query()->create([
            'assignment_id' => $assignmentActive->id,
            'user_id' => $studentB->id,
            'status' => 'reviewed',
            'score' => 90,
            'submitted_at' => now()->subHours(2),
        ]);

        Sanctum::actingAs($instructor);

        $this->getJson('/api/instructor/assignments?search=project&status=active')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $assignmentActive->id)
            ->assertJsonPath('0.status', 'active');

        $this->getJson('/api/instructor/assignments?status=completed')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $assignmentCompleted->id)
            ->assertJsonPath('0.status', 'completed');

        $this->getJson('/api/instructor/assignments/'.$assignmentActive->id.'/submissions?status=reviewed&search='.$studentB->email)
            ->assertOk()
            ->assertJsonCount(1, 'submissions')
            ->assertJsonPath('submissions.0.student.email', $studentB->email)
            ->assertJsonPath('submissions.0.status', 'reviewed');
    }

    public function test_instructor_can_upload_correction_attachments_and_receive_attachment_payloads(): void
    {
        Storage::fake('public');

        $instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);

        $course = Course::query()->create([
            'title' => 'Correction Course',
            'description' => 'Course description',
            'instructor_id' => $instructor->id,
            'level' => 'beginner',
            'price' => 0,
            'is_published' => true,
        ]);

        $assignment = Assignment::query()->create([
            'course_id' => $course->id,
            'title' => 'Correction assignment',
            'description' => 'Deliver work',
            'due_date' => now()->addDays(2),
        ]);

        $studentFile = UploadedFile::fake()->create('student-work.zip', 150, 'application/zip');
        $studentPath = $studentFile->store('submissions', 'public');

        $submission = AssignmentSubmission::query()->create([
            'assignment_id' => $assignment->id,
            'user_id' => $student->id,
            'file_url' => $studentPath,
            'student_attachments' => [[
                'path' => $studentPath,
                'name' => 'student-work.zip',
                'mime_type' => 'application/zip',
                'size' => 153600,
                'uploaded_at' => now()->toISOString(),
            ]],
            'status' => 'submitted',
            'score' => null,
            'submitted_at' => now(),
        ]);

        Sanctum::actingAs($instructor);

        $correctionA = UploadedFile::fake()->create('feedback.pdf', 80, 'application/pdf');
        $correctionB = UploadedFile::fake()->create('annotated.jpg', 60, 'image/jpeg');

        $response = $this->patch('/api/instructor/assignments/'.$assignment->id.'/submissions/'.$submission->id, [
            'status' => 'reviewed',
            'score' => 88,
            'feedback' => 'Good work, see annotations.',
            'correction_files' => [$correctionA, $correctionB],
        ]);

        $expectedStudentUrl = url(Storage::url($studentPath));

        $response
            ->assertOk()
            ->assertJsonPath('status', 'reviewed')
            ->assertJsonPath('score', 88)
            ->assertJsonCount(1, 'student_attachments')
            ->assertJsonCount(2, 'correction_attachments')
            ->assertJsonPath('student_attachments.0.name', 'student-work.zip')
            ->assertJsonPath('student_attachments.0.url', $expectedStudentUrl);

        $gradePayload = $response->json();

        $this->assertStringContainsString(
            '/storage/submissions/corrections/',
            (string) ($gradePayload['correction_attachments'][0]['url'] ?? '')
        );

        $this->getJson('/api/instructor/assignments/'.$assignment->id.'/submissions')
            ->assertOk()
            ->assertJsonPath('submissions.0.id', $submission->id)
            ->assertJsonPath('submissions.0.student_attachments.0.name', 'student-work.zip')
            ->assertJsonPath('submissions.0.student_attachments.0.url', $expectedStudentUrl)
            ->assertJsonCount(2, 'submissions.0.correction_attachments');
    }

    public function test_submission_file_url_fallback_is_normalized_when_student_attachments_missing(): void
    {
        Storage::fake('public');

        $instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);

        $course = Course::query()->create([
            'title' => 'Fallback Course',
            'description' => 'Course description',
            'instructor_id' => $instructor->id,
            'level' => 'beginner',
            'price' => 0,
            'is_published' => true,
        ]);

        $assignment = Assignment::query()->create([
            'course_id' => $course->id,
            'title' => 'Fallback assignment',
            'description' => 'Upload work',
            'due_date' => now()->addDays(3),
        ]);

        $studentFile = UploadedFile::fake()->create('legacy-upload.pdf', 120, 'application/pdf');
        $studentPath = $studentFile->store('submissions', 'public');

        $submission = AssignmentSubmission::query()->create([
            'assignment_id' => $assignment->id,
            'user_id' => $student->id,
            'file_url' => $studentPath,
            'student_attachments' => null,
            'status' => 'submitted',
            'score' => null,
            'submitted_at' => now(),
        ]);

        Sanctum::actingAs($instructor);

        $expectedStudentUrl = url(Storage::url($studentPath));

        $this->getJson('/api/instructor/assignments/'.$assignment->id.'/submissions')
            ->assertOk()
            ->assertJsonPath('submissions.0.id', $submission->id)
            ->assertJsonCount(1, 'submissions.0.student_attachments')
            ->assertJsonPath('submissions.0.student_attachments.0.path', $studentPath)
            ->assertJsonPath('submissions.0.student_attachments.0.name', basename($studentPath))
            ->assertJsonPath('submissions.0.student_attachments.0.url', $expectedStudentUrl);
    }
}
