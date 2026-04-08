<!-- GSD:project-start source:PROJECT.md -->
## Project

**KayyDiang - Plateforme E-Learning**

Plateforme de gestion de cours en ligne (E-learning) moderne avec interface utilisateur fluide. Les etudiants peuvent s'inscrire aux cours, suivre des lecons, passer des quiz, soumettre des devoirs et obtenir des certificats. Les instructeurs peuvent creer et gerer des cours.

**Core Value:** Permettre un apprentissage progressif, simple et fiable via une stack Laravel + React.

### Constraints

- **Tech Stack**: React 18.3+ frontend, Laravel 13 backend, PostgreSQL 16+
- **Database**: PostgreSQL local nomme `elearn`
- **Auth**: Email/Password via Laravel Sanctum uniquement
- **Animations**: Framer Motion + GSAP cote frontend
- **Performance**: Interface fluide et API stable
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 18.3.1 | Frontend UI | Ecosysteme riche pour UI interactive |
| TypeScript | 5.4+ | Type safety | Reduit les regressions cote frontend |
| Laravel | 13.x | Backend framework | Productif, conventions solides, ecosysteme mature |
| PostgreSQL | 16+ | Primary database | Relations riches et robustesse transactionnelle |
| Sanctum | 4.x | API auth | Auth token simple pour SPA/API Laravel |
| Vite | 5.x | Build tool | Dev rapide et build moderne |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Framer Motion | 11.x | Animations UI | Transitions et micro-interactions |
| GSAP | 3.x | Advanced animations | Animations timeline/scroll avancees |
| TanStack Query | 5.x | Server state | Cache des donnees API |
| Zustand | 4.x | Client state | Etat global leger |
| Tailwind CSS | 3.4.x | Styling | UI rapide et coherente |

### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest | Unit testing frontend | Rapide avec Vite |
| PHPUnit | Unit/feature backend | Standard Laravel |
| ESLint + Prettier | Code quality | Convention TypeScript |
| Docker | Containerization | PostgreSQL/Redis local |
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions non finalisees. Suivre les patterns existants du codebase Laravel/React.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

- Frontend: `frontend/src/features/*` (architecture par fonctionnalite)
- Backend: controllers API Laravel dans `backend/app/Http/Controllers/Api`
- Routes API: `backend/routes/api.php`
- Modele de donnees: migrations Laravel dans `backend/database/migrations`
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
