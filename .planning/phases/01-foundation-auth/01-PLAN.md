# Phase 1: Foundation & Auth - Plan

**Phase:** 01-foundation-auth
**Status:** Ready for execution
**Updated:** 2026-04-07

## Overview

Plan d'execution pour finaliser la base Laravel + auth email/password.

## Plan 1: Environment & Database

- [ ] Verifier `backend/.env` sur PostgreSQL local
- [ ] Lancer `php artisan migrate`
- [ ] Verifier tables auth (users, password_reset_tokens, personal_access_tokens)

## Plan 2: Backend Auth API

- [ ] Verifier `POST /api/register`
- [ ] Verifier `POST /api/login`
- [ ] Verifier `POST /api/logout`
- [ ] Verifier `GET /api/user`
- [ ] Verifier `POST /api/forgot-password`

## Plan 3: Frontend Auth Integration

- [ ] Aligner `VITE_API_URL` avec backend Laravel
- [ ] Tester login/register depuis pages React
- [ ] Tester reset password depuis UI
- [ ] Verifier redirections routes publiques/protegees

## Plan 4: Validation

- [ ] Lancer tests backend
- [ ] Verifier endpoints via curl/Postman
- [ ] Controle manuel des flows auth de bout en bout

## Success Criteria

1. Register/login/logout fonctionnent
2. Reset password envoie un lien
3. Utilisateur courant recuperable via token Sanctum
4. Frontend et backend utilisent la meme URL API

---
*Plan updated: 2026-04-07*
