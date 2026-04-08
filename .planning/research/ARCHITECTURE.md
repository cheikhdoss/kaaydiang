# Architecture Research

**Domain:** E-Learning Platform
**Researched:** 2026-04-07
**Confidence:** HIGH

## System Overview

```text
Frontend (React + TypeScript)
  -> API REST (Laravel 13)
    -> PostgreSQL local (elearn)
```

## Frontend Structure

```text
frontend/src/
  features/
  router/
  hooks/
  services/
  components/
```

## Backend Structure

```text
backend/
  app/Http/Controllers/Api
  app/Models
  routes/api.php
  database/migrations
```

## Auth Flow

1. Frontend envoie email/password a `POST /api/register` ou `POST /api/login`
2. Laravel valide et cree/identifie l'utilisateur
3. Sanctum genere un token API
4. Frontend stocke token + user
5. Routes protegees utilisent `auth:sanctum`

## Data Model (current)

- Users
- Courses
- Chapters
- Lessons

## Build Order

1. Foundation & Auth
2. Course catalog + detail
3. Video + progress
4. Quiz + assignments
5. Dashboard + certificates + notifications

---
*Architecture aligned to Laravel codebase*
