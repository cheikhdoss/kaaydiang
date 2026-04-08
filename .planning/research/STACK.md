# Stack Research

**Domain:** E-Learning Platform
**Researched:** 2026-04-07
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 18.3.1 | Frontend UI | UI interactive et ecosysteme mature |
| TypeScript | 5.4+ | Type safety | Reduit les regressions frontend |
| Laravel | 13.x | Backend API | Productivite et conventions solides |
| PostgreSQL | 16+ | Primary database | Relations riches et stabilite |
| Sanctum | 4.x | Authentication | Auth simple pour API SPA |
| Vite | 5.x | Build tool | Build/dev rapides |

### Supporting Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| Framer Motion | 11.x | Animations UI |
| GSAP | 3.x | Animations avancees |
| TanStack Query | 5.x | Gestion server state |
| Zustand | 4.x | Etat global leger |
| Tailwind CSS | 3.4.x | Styling system |

### Development Tools

| Tool | Purpose |
|------|---------|
| PHPUnit | Tests backend Laravel |
| Vitest | Tests frontend |
| ESLint + Prettier | Qualite code |
| Docker | Services locaux (PostgreSQL/Redis) |

## Installation

```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
composer install
php artisan key:generate
php artisan migrate
```

## What NOT to Use (current scope)

- OAuth tiers
- Stack backend TypeScript precedente

---
*Stack research updated for Laravel baseline*
