# KayyDiang - Cahier des charges technique (Version Laravel)

## 1) Informations generales du projet

- **Nom de la plateforme**: KayyDiang
- **Type**: Plateforme de gestion de cours en ligne (E-learning)
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Laravel 13 (API REST)
- **Authentification**: Email/Password uniquement via Laravel Sanctum
- **Base de donnees**: PostgreSQL locale (base `elearn`)

> Decision produit: **OAuth tiers ne fait plus partie du projet**.

---

## 2) Objectifs

Construire une plateforme e-learning moderne, performante et maintainable qui permet:

- aux etudiants de s'inscrire et se connecter,
- de consulter des cours,
- de suivre leur progression,
- de passer des quiz,
- de soumettre des devoirs,
- et d'obtenir des certificats.

Les instructeurs doivent pouvoir creer et gerer les cours via une API Laravel propre et modulaire.

---

## 3) Stack technique cible

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion + GSAP (animations UX)
- TanStack Query

### Backend

- PHP 8.3+
- Laravel 13
- Laravel Sanctum (tokens API)
- Eloquent ORM

### Base de donnees

- PostgreSQL local (recommande)
- Nom de la base: `elearn`
- Host local: `127.0.0.1`
- Port: `5432`

---

## 4) Configuration locale de la base de donnees

La configuration backend attendue est locale:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=elearn
DB_USERNAME=postgres
DB_PASSWORD=1964
```

Commandes standard:

```bash
cd backend
php artisan migrate
php artisan serve
```

---

## 5) Authentification (mise a jour)

### Scope retenu

- Inscription email/password
- Connexion email/password
- Deconnexion
- Recuperation utilisateur courant

### Scope retire

- OAuth tiers (Google, etc.)

### Endpoints API actuels

- `POST /api/register`
- `POST /api/login`
- `POST /api/forgot-password`
- `POST /api/logout` (auth:sanctum)
- `GET /api/user` (auth:sanctum)

---

## 6) Architecture actuelle du repository

```text
kaydjangue/
├── frontend/   # React + TypeScript + Vite
├── backend/    # Laravel API + Sanctum
├── .planning/  # Roadmap et artefacts de planification
└── context.md  # Ce document (source de verite technique)
```

### Backend (Laravel)

- `app/Http/Controllers/Api/` pour les controllers API
- `app/Models/` pour les modeles Eloquent
- `routes/api.php` pour les routes API
- `database/migrations/` pour le schema

### Frontend (React)

- `src/features/` architecture par fonctionnalite
- `src/router/` gestion des routes publiques/protegees
- `src/hooks/` hooks metier (auth, etc.)

---

## 7) Exigences fonctionnelles prioritaires (v1)

1. Auth email/password stable de bout en bout
2. Catalogue de cours et page detail
3. Chapitres/lecons
4. Suivi de progression
5. Quiz et soumissions de devoirs
6. Dashboard et certificats

---

## 8) Contraintes projet

- Backend officiel du projet: **Laravel**
- Base de donnees officielle: **PostgreSQL locale**
- Auth officielle: **Email/Password uniquement**
- OAuth tiers: **hors scope**
- UX premium: animations Framer Motion + GSAP conservees cote frontend

---

## 9) Notes de coherence

Ce document remplace les anciennes references a une stack backend TypeScript et a l'auth OAuth tiers.

En cas de conflit entre anciens documents de planification et le code, la reference a suivre est:

1. code source actuel,
2. ce `context.md`,
3. puis le reste de la documentation.
