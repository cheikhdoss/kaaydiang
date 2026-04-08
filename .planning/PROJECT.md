# KayyDiang - Plateforme E-Learning

## What This Is

Plateforme de gestion de cours en ligne (E-learning) moderne avec frontend React et backend Laravel. Les etudiants peuvent suivre des cours, passer des quiz, soumettre des devoirs et consulter leur progression. Les instructeurs peuvent creer et gerer des contenus.

## Core Value

Permettre aux etudiants d'apprendre a leur rythme avec un suivi de progression clair, et fournir aux instructeurs des outils simples de creation de cours.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Authentification email/password (register, login, logout, reset)
- [ ] Gestion complete des cours multimedia (creation, edition, publication)
- [ ] Lecteur video avec suivi de progression
- [ ] Systeme de quiz et evaluations
- [ ] Systeme de devoirs avec soumission de fichiers
- [ ] Tableaux de bord interactifs (etudiant, instructeur, admin)
- [ ] Systeme de notifications
- [ ] Certificats de completion
- [ ] Profils utilisateurs
- [ ] Analytics et statistiques de cours

### Out of Scope

- OAuth tiers
- Forum/Discussion communautaire
- Application mobile native
- IA/ML features
- Paiement integre

## Context

**Stack Technique:**
- Frontend: React 18.3+, TypeScript, Vite, Tailwind CSS
- Backend: Laravel 13 (API)
- Database: PostgreSQL 16+ local
- Auth: Laravel Sanctum (email/password)
- Animations: Framer Motion + GSAP

**Architecture:**
- Frontend: architecture modulaire par features
- Backend: architecture Laravel standard (Controllers, Models, Migrations, Routes)

## Constraints

- **Tech Stack**: React frontend + Laravel backend + PostgreSQL local
- **Database**: PostgreSQL nomme `elearn`
- **Auth**: Email/password uniquement via Laravel
- **Animations**: Framer Motion + GSAP

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Laravel backend | Cohesion avec le code existant | Active |
| PostgreSQL local | Simplicite dev et controle des donnees | Active |
| Auth email/password only | Reduction de complexite | Active |
| Framer Motion + GSAP | UX premium | Active |

---
*Last updated: 2026-04-07 after stack cleanup*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check
3. Update Context with current state
