# Roadmap - KayyDiang E-Learning Platform

**Projet:** KayyDiang E-Learning Platform
**Granularite:** Fine (10 phases)
**Maj:** 2026-04-07

---

## Vue d'ensemble

| # | Phase | Objectif | Requirements | Duree |
|---|-------|----------|--------------|-------|
| 1 | Foundation & Auth | Infrastructure Laravel + auth email/password | AUTH-01 a AUTH-05 | 2 sem |
| 2 | Core Course System | Catalogue et structure des cours | COURSE-01 a COURSE-03 | 2 sem |
| 3 | Video Player & Progress | Lecteur video et progression | COURSE-04 a COURSE-06 | 2 sem |
| 4 | Quiz System | Systeme de quiz | QUIZ-01 a QUIZ-03 | 2 sem |
| 5 | Assignment System | Soumission de devoirs | ASSIGN-01 a ASSIGN-02 | 2 sem |
| 6 | Dashboard & Analytics | Tableau de bord utilisateur | DASH-01 a DASH-02 | 1 sem |
| 7 | Certificates | Generation de certificats | CERT-01 | 1 sem |
| 8 | Notifications | Notifications email | NOTIF-01 | 1 sem |
| 9 | Instructor Tools | Outils de creation de cours | INST-01 a INST-03 | 2 sem |
| 10 | Polish & Optimization | Optimisation globale | Review global | 1 sem |

**Total:** 16-18 semaines

---

## Phase 1: Foundation & Auth

**Objectif:** Stabiliser l'infrastructure Laravel + PostgreSQL local + auth email/password.

**Livraisons:**
- API Laravel (auth, user courant)
- Migrations PostgreSQL
- Frontend auth pages reliees a l'API Laravel
- Routes protegees frontend

**Critere de succes:** register/login/logout/reset fonctionnent de bout en bout.

---

## Notes d'architecture

- Backend: Laravel 13 + Sanctum
- Base de donnees: PostgreSQL locale (`elearn`)
- Frontend: React + TypeScript + Vite
- Auth OAuth tiers: hors scope

---

## Matrice de dependances

```
Phase 1 -> Phase 2 -> Phase 3
                    |- Phase 4
                    |- Phase 5
                    |- Phase 7
Phase 6 depends on 3,4,5
Phase 8 depends on 2,3,5
Phase 9 depends on 2,3
Phase 10 depends on all
```

---

## Prochaines etapes

1. `/gsd-discuss-phase 1`
2. `/gsd-plan-phase 1`
3. `/gsd-execute-phase 1`

---
*Roadmap mis a jour: 2026-04-07*
