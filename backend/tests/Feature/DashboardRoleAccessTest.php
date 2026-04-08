<?php

namespace Tests\Feature;

use App\Models\User;
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

        $this->getJson('/api/dashboard/admin')->assertForbidden();
        $this->getJson('/api/dashboard/admin/modules')->assertForbidden();
    }

    public function test_admin_can_access_admin_endpoints_only(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        Sanctum::actingAs($admin);

        $this->getJson('/api/dashboard/admin')->assertOk();
        $this->getJson('/api/dashboard/admin/modules')->assertOk();

        $this->getJson('/api/dashboard/student')->assertForbidden();
        $this->getJson('/api/dashboard/student/modules')->assertForbidden();
    }

    public function test_unauthenticated_user_cannot_access_dashboard_endpoints(): void
    {
        $this->getJson('/api/dashboard/student')->assertUnauthorized();
        $this->getJson('/api/dashboard/admin')->assertUnauthorized();
        $this->getJson('/api/dashboard/student/modules')->assertUnauthorized();
        $this->getJson('/api/dashboard/admin/modules')->assertUnauthorized();
    }
}
