<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardRoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_access_student_endpoints_only(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        Sanctum::actingAs($student);

        $this->getJson('/api/dashboard/student')->assertOk();
        $this->getJson('/api/dashboard/student/modules')->assertOk();
        $this->getJson('/api/student/calendar')->assertOk();
        $this->getJson('/api/student/messages')->assertOk();
        $this->getJson('/api/student/messages/1/thread')->assertNotFound();
        $this->postJson('/api/student/messages/1/thread', ['message' => 'Bonjour'])->assertNotFound();
        $this->postJson('/api/student/messages/1/thread/read')->assertNotFound();
        $this->getJson('/api/student/grades')->assertOk();
        $this->getJson('/api/student/notifications')->assertOk();

        $this->getJson('/api/dashboard/admin')->assertForbidden();
        $this->getJson('/api/dashboard/admin/modules')->assertForbidden();
        $this->getJson('/api/instructor/calendar')->assertForbidden();

        $courseId = \App\Models\Course::query()->create([
            'title' => 'Temp',
            'instructor_id' => $student->id,
            'level' => 'beginner',
            'price' => 0,
            'is_published' => true,
        ])->id;

        $this->getJson("/api/student/courses/{$courseId}")->assertForbidden();
    }

    public function test_instructor_notifications_returns_real_payload_shape(): void
    {
        $instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);

        $courseId = DB::table('courses')->insertGetId([
            'title' => 'Cours brouillon test',
            'description' => 'Description',
            'thumbnail' => null,
            'instructor_id' => $instructor->id,
            'level' => 'beginner',
            'price' => 0,
            'is_published' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $assignmentId = DB::table('assignments')->insertGetId([
            'course_id' => $courseId,
            'title' => 'Devoir test',
            'description' => 'A rendre',
            'due_date' => now()->addDay(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('assignment_submissions')->insert([
            'assignment_id' => $assignmentId,
            'user_id' => $student->id,
            'file_url' => null,
            'status' => 'submitted',
            'score' => null,
            'submitted_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($instructor);

        $this->getJson('/api/instructor/notifications')
            ->assertOk()
            ->assertJsonStructure([
                '*' => ['id', 'title', 'message', 'type', 'read', 'date'],
            ]);
    }

    public function test_admin_can_access_admin_endpoints_only(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        Sanctum::actingAs($admin);

        $this->getJson('/api/dashboard/admin')->assertOk();
        $this->getJson('/api/dashboard/admin/modules')->assertOk();

        $this->getJson('/api/dashboard/student')->assertForbidden();
        $this->getJson('/api/dashboard/student/modules')->assertForbidden();
        $this->getJson('/api/instructor/calendar')->assertForbidden();
    }

    public function test_instructor_can_access_instructor_and_supplement_endpoints_only(): void
    {
        $instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
        Sanctum::actingAs($instructor);

        $this->getJson('/api/dashboard/instructor')->assertOk();
        $this->getJson('/api/instructor/calendar')->assertOk();
        $this->getJson('/api/instructor/quizzes')->assertOk();
        $this->postJson('/api/instructor/quizzes', [
            'title' => 'Quiz test',
            'course_id' => 1,
        ])->assertUnprocessable();
        $this->getJson('/api/instructor/assignments')->assertOk();
        $this->getJson('/api/instructor/assignments/1/submissions')->assertNotFound();
        $this->getJson('/api/instructor/students')->assertOk();
        $this->getJson('/api/instructor/messages')->assertOk();
        $this->getJson('/api/instructor/stats')->assertOk();
        $this->getJson('/api/instructor/notifications')->assertOk();
        $this->getJson('/api/instructor/profile')->assertOk();

        $studentForThread = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $this->getJson('/api/instructor/messages/'.$studentForThread->id.'/thread')->assertOk();
        $this->postJson('/api/instructor/messages/'.$studentForThread->id.'/thread', [
            'message' => 'Bonjour',
        ])->assertForbidden();
        $this->postJson('/api/instructor/messages/'.$studentForThread->id.'/thread/read')->assertNotFound();
        $this->putJson('/api/instructor/quizzes/1', ['title' => 'Updated'])->assertNotFound();
        $this->deleteJson('/api/instructor/quizzes/1')->assertNotFound();
        $this->patchJson('/api/instructor/assignments/1/submissions/1', [
            'status' => 'reviewed',
            'score' => 90,
        ])->assertNotFound();

        $this->getJson('/api/dashboard/student')->assertForbidden();
        $this->getJson('/api/dashboard/admin')->assertForbidden();
        $this->getJson('/api/student/calendar')->assertForbidden();
    }

    public function test_instructor_can_send_and_read_persisted_thread_message(): void
    {
        $instructor = User::factory()->create(['role' => User::ROLE_INSTRUCTOR]);
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);

        $courseId = DB::table('courses')->insertGetId([
            'title' => 'Cours messages',
            'description' => 'Description',
            'thumbnail' => null,
            'instructor_id' => $instructor->id,
            'level' => 'beginner',
            'price' => 0,
            'is_published' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('enrollments')->insert([
            'user_id' => $student->id,
            'course_id' => $courseId,
            'enrolled_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($instructor);

        $this->postJson('/api/instructor/messages/'.$student->id.'/thread', [
            'message' => 'Message de suivi pedagogique',
            'course_id' => $courseId,
        ])->assertCreated()->assertJsonStructure([
            'id',
            'sender',
            'text',
            'course_title',
            'created_at',
        ]);

        $this->getJson('/api/instructor/messages/'.$student->id.'/thread')
            ->assertOk()
            ->assertJsonPath('participant.id', $student->id)
            ->assertJsonPath('messages.0.sender', 'instructor')
            ->assertJsonPath('messages.0.text', 'Message de suivi pedagogique')
            ->assertJsonPath('messages.0.course_title', 'Cours messages');

        $this->getJson('/api/instructor/messages')
            ->assertOk()
            ->assertJsonPath('0.id', $student->id)
            ->assertJsonPath('0.last_message', 'Message de suivi pedagogique')
            ->assertJsonPath('0.course_title', 'Cours messages');
    }

    public function test_unauthenticated_user_cannot_access_dashboard_endpoints(): void
    {
        $this->getJson('/api/dashboard/student')->assertUnauthorized();
        $this->getJson('/api/dashboard/admin')->assertUnauthorized();
        $this->getJson('/api/dashboard/student/modules')->assertUnauthorized();
        $this->getJson('/api/dashboard/admin/modules')->assertUnauthorized();
        $this->getJson('/api/dashboard/instructor')->assertUnauthorized();
        $this->getJson('/api/student/calendar')->assertUnauthorized();
        $this->getJson('/api/student/messages')->assertUnauthorized();
        $this->getJson('/api/student/messages/1/thread')->assertUnauthorized();
        $this->postJson('/api/student/messages/1/thread', ['message' => 'Bonjour'])->assertUnauthorized();
        $this->postJson('/api/student/messages/1/thread/read')->assertUnauthorized();
        $this->getJson('/api/student/grades')->assertUnauthorized();
        $this->getJson('/api/student/notifications')->assertUnauthorized();
        $this->getJson('/api/student/courses/1')->assertUnauthorized();
        $this->getJson('/api/instructor/calendar')->assertUnauthorized();
        $this->getJson('/api/instructor/quizzes')->assertUnauthorized();
        $this->postJson('/api/instructor/quizzes', ['title' => 'Q', 'course_id' => 1])->assertUnauthorized();
        $this->putJson('/api/instructor/quizzes/1', ['title' => 'Q'])->assertUnauthorized();
        $this->deleteJson('/api/instructor/quizzes/1')->assertUnauthorized();
        $this->getJson('/api/instructor/assignments')->assertUnauthorized();
        $this->getJson('/api/instructor/assignments/1/submissions')->assertUnauthorized();
        $this->patchJson('/api/instructor/assignments/1/submissions/1', ['status' => 'reviewed', 'score' => 80])->assertUnauthorized();
        $this->getJson('/api/instructor/students')->assertUnauthorized();
        $this->getJson('/api/instructor/messages')->assertUnauthorized();
        $this->getJson('/api/instructor/messages/1/thread')->assertUnauthorized();
        $this->postJson('/api/instructor/messages/1/thread', ['message' => 'Bonjour'])->assertUnauthorized();
        $this->postJson('/api/instructor/messages/1/thread/read')->assertUnauthorized();
        $this->getJson('/api/instructor/stats')->assertUnauthorized();
        $this->getJson('/api/instructor/notifications')->assertUnauthorized();
        $this->getJson('/api/instructor/profile')->assertUnauthorized();
    }
}
