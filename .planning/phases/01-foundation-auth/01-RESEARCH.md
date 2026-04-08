# Phase 1: Foundation & Auth - Research

**Phase:** 01-foundation-auth
**Researched:** 2026-04-07
**Status:** Complete

## Decisions Snapshot

- Backend: Laravel 13
- Database: PostgreSQL local (`elearn`)
- Auth: Email/password + Sanctum
- Frontend: React + TypeScript + Vite
- OAuth tiers: retire du scope

## Backend References

- `backend/routes/api.php`
- `backend/app/Http/Controllers/Api/AuthController.php`
- `backend/app/Models/User.php`

## Frontend References

- `frontend/src/hooks/useAuth.tsx`
- `frontend/src/router/ProtectedRoute.tsx`
- `frontend/src/router/PublicRoute.tsx`

## Risks

1. URL API differente entre pages/hooks/services
2. Type user incoherent entre backend et frontend
3. Reset password non expose en API

## Verification Commands

```bash
cd backend && php artisan test
cd frontend && npm run dev
```

---
*Research updated for Laravel-only scope*
