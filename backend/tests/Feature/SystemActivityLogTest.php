<?php

namespace Tests\Feature;

use App\Models\SystemActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SystemActivityLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_activity_logs(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        SystemActivityLog::query()->create([
            'user_id' => $admin->id,
            'actor_email' => $admin->email,
            'method' => 'POST',
            'path' => '/api/login',
            'route_name' => null,
            'action_summary' => 'POST /api/login',
            'status_code' => 200,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
            'meta' => null,
        ]);

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/activity-logs')
            ->assertOk()
            ->assertJsonPath('data.0.method', 'POST')
            ->assertJsonPath('data.0.path', '/api/login')
            ->assertJsonStructure([
                'data' => [
                    [
                        'id',
                        'method',
                        'path',
                        'action_summary',
                        'status_code',
                        'created_at',
                        'user',
                    ],
                ],
                'current_page',
                'last_page',
            ]);
    }

    public function test_non_admin_cannot_list_activity_logs(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        Sanctum::actingAs($student);

        $this->getJson('/api/admin/activity-logs')->assertForbidden();
    }

    public function test_api_request_creates_activity_log_row(): void
    {
        $this->postJson('/api/register', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'audit@example.com',
            'password' => 'Password1!xx',
            'password_confirmation' => 'Password1!xx',
        ])->assertCreated();

        $this->assertDatabaseHas('system_activity_logs', [
            'method' => 'POST',
            'path' => '/api/register',
            'actor_email' => 'audit@example.com',
        ]);
    }
}
