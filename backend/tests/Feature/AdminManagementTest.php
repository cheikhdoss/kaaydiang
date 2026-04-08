<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_users(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        User::factory()->count(3)->create();

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonStructure([
                'data',
                'current_page',
                'last_page',
            ]);
    }

    public function test_admin_can_update_user_role_and_status(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
        $target = User::factory()->create(['role' => User::ROLE_STUDENT, 'is_active' => true]);

        Sanctum::actingAs($admin);

        $this->patchJson("/api/admin/users/{$target->id}/role", [
            'role' => User::ROLE_INSTRUCTOR,
        ])->assertOk();

        $this->patchJson("/api/admin/users/{$target->id}/status", [
            'is_active' => false,
        ])->assertOk();

        $target->refresh();
        $this->assertSame(User::ROLE_INSTRUCTOR, $target->role);
        $this->assertFalse($target->is_active);
    }

    public function test_non_admin_cannot_manage_users(): void
    {
        $student = User::factory()->create(['role' => User::ROLE_STUDENT]);
        $target = User::factory()->create(['role' => User::ROLE_STUDENT]);

        Sanctum::actingAs($student);

        $this->getJson('/api/admin/users')->assertForbidden();
        $this->patchJson("/api/admin/users/{$target->id}/role", [
            'role' => User::ROLE_INSTRUCTOR,
        ])->assertForbidden();
    }
}
