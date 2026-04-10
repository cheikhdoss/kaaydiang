<?php

namespace App\Http\Middleware;

use App\Models\SystemActivityLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class LogSystemActivity
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($this->shouldRecord($request, $response)) {
            try {
                $this->persist($request, $response);
            } catch (Throwable) {
                // Never break the request because of audit logging
            }
        }

        return $response;
    }

    private function shouldRecord(Request $request, Response $response): bool
    {
        if (!str_starts_with($request->path(), 'api')) {
            return false;
        }

        if ($request->isMethod('OPTIONS')) {
            return false;
        }

        $path = '/'.$request->path();
        if ($path === '/api/admin/activity-logs' && $request->isMethod('GET')) {
            return false;
        }

        return true;
    }

    private function persist(Request $request, Response $response): void
    {
        $user = $request->user();
        $path = '/'.$request->path();
        $route = $request->route();
        $routeName = $route?->getName();

        $summary = $routeName
            ? $this->humanizeRouteName((string) $routeName)
            : $request->method().' '.$path;

        $meta = $this->safeMeta($request);

        SystemActivityLog::query()->create([
            'user_id' => $user?->id,
            'actor_email' => $user?->email ?? $this->guestActorEmail($request),
            'method' => $request->method(),
            'path' => mb_substr($path, 0, 500),
            'route_name' => $routeName ? mb_substr($routeName, 0, 255) : null,
            'action_summary' => mb_substr($summary, 0, 500),
            'status_code' => $response->getStatusCode(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent() ? mb_substr($request->userAgent(), 0, 512) : null,
            'meta' => $meta,
        ]);
    }

    private function guestActorEmail(Request $request): ?string
    {
        $email = $request->input('email');
        if (is_string($email) && $email !== '') {
            return mb_substr($email, 0, 255);
        }

        return null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function safeMeta(Request $request): ?array
    {
        if (!$request->isMethod('POST') && !$request->isMethod('PUT') && !$request->isMethod('PATCH')) {
            return null;
        }

        $route = $request->route();
        $params = $route?->parameters() ?? [];
        $cleanParams = [];
        foreach ($params as $key => $value) {
            if (is_scalar($value) || $value === null) {
                $cleanParams[$key] = $value;
            } elseif (is_object($value) && method_exists($value, 'getKey')) {
                $cleanParams[$key] = $value->getKey();
            }
        }

        if ($cleanParams === []) {
            return null;
        }

        return ['route_parameters' => $cleanParams];
    }

    private function humanizeRouteName(string $name): string
    {
        return str_replace(['.', '_'], [' → ', ' '], $name);
    }
}
