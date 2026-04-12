<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\LogsActivity;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminManagementController extends Controller
{
    use LogsActivity;

    public function store(Request $request)
    {
        $admin = $request->user();

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'in:student,instructor,admin'],
        ]);

        $user = User::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'is_active' => true,
        ]);

        $this->logActivity('user.created', "Admin {$admin->email} a créé l'utilisateur utilisateur {$user->email} (role: {$user->role})", [
            'model_type' => User::class,
            'model_id' => $user->id,
            'properties' => ['role' => $user->role],
        ]);

        return response()->json([
            'message' => 'User created successfully.',
            'user' => $user->only(['id', 'first_name', 'last_name', 'email', 'role', 'is_active']),
        ], 201);
    }

    public function users(Request $request)
    {
        $validated = $request->validate([
            'role' => ['nullable', 'in:student,instructor,admin'],
            'active' => ['nullable', 'in:0,1'],
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $query = User::query()->select('id', 'first_name', 'last_name', 'email', 'role', 'is_active', 'created_at');

        if (!empty($validated['role'])) {
            $query->where('role', $validated['role']);
        }

        if (isset($validated['active'])) {
            $query->where('is_active', (bool) $validated['active']);
        }

        if (!empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($subQuery) use ($search) {
                $subQuery->where('email', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        $users = $query->latest()->paginate(20);

        return response()->json($users);
    }

    public function updateRole(Request $request, User $user)
    {
        $admin = $request->user();

        $validated = $request->validate([
            'role' => ['required', 'in:student,instructor,admin'],
        ]);

        if ($admin->id === $user->id && $validated['role'] !== User::ROLE_ADMIN) {
            return response()->json(['message' => 'You cannot remove your own admin role.'], 422);
        }

        $user->update([
            'role' => $validated['role'],
        ]);

        $this->logActivity('user.role_changed', "Admin {$admin->email} a changé le rôle de {$user->email} vers {$validated['role']}", [
            'model_type' => User::class,
            'model_id' => $user->id,
            'properties' => ['old_role' => $user->getOriginal('role'), 'new_role' => $validated['role']],
        ]);

        return response()->json([
            'message' => 'Role updated successfully.',
            'user' => $user->only(['id', 'first_name', 'last_name', 'email', 'role', 'is_active']),
        ]);
    }

    public function updateStatus(Request $request, User $user)
    {
        $admin = $request->user();

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        if ($admin->id === $user->id && $validated['is_active'] === false) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 422);
        }

        $user->update([
            'is_active' => $validated['is_active'],
        ]);

        $statusText = $validated['is_active'] ? 'activé' : 'désactivé';
        $this->logActivity('user.status_changed', "Admin {$admin->email} a {$statusText} le compte de {$user->email}", [
            'model_type' => User::class,
            'model_id' => $user->id,
            'properties' => ['is_active' => $validated['is_active']],
        ]);

        return response()->json([
            'message' => 'Account status updated successfully.',
            'user' => $user->only(['id', 'first_name', 'last_name', 'email', 'role', 'is_active']),
        ]);
    }
}
