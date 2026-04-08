# KayyDiang - E-Learning Platform

Plateforme de gestion de cours en ligne moderne avec React (Frontend) et Laravel (Backend).

## Structure du Projet

```
kaydjangue/
├── frontend/     # Application React + Vite + TypeScript
├── backend/      # API Laravel 13 + PostgreSQL
└── .planning/    # Documentation GSD
```

## Prérequis

- PHP 8.3+
- Composer
- Node.js 20+
- Docker et Docker Compose
- PostgreSQL 16
- PostgreSQL local (base `elearn`)

## Installation

### 1. Cloner le projet

```bash
git clone <repository-url>
cd kaydjangue
```

### 2. Configurer le Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# Configurez votre base de données dans le fichier .env
php artisan migrate
```

### 3. Configurer le Frontend

```bash
cd ../frontend
npm install
cp .env.example .env
# Éditer .env avec l'URL de l'API Laravel
```

## Développement

### Backend

```bash
cd backend
php artisan serve
```

API disponible sur: http://localhost:8000/api

### Frontend

```bash
cd frontend
npm run dev
```

Application disponible sur: http://localhost:5173

## Stack Technique

- **Frontend:** React 18.3, Vite, TypeScript, Framer Motion, GSAP, React Query, Zustand
- **Backend:** Laravel 13, Sanctum, PostgreSQL 16
- **Auth:** Email/Password via Laravel Sanctum

## Documentation

- Cahier des charges: `context.md`
- Planning GSD: `.planning/`

## Notes Scope

- OAuth tiers: hors scope
- Backend officiel: Laravel uniquement
