<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * @param array<int, string> $roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (count($roles) > 0 && !in_array($user->role, $roles, true)) {
            return response()->json([
                'message' => 'Access denied for this role.',
            ], 403);
        }

        return $next($request);
    }
}
