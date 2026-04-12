# KayyDiang - README Onboarding Complet

Plateforme e-learning full-stack avec frontend React/Vite/TypeScript et backend Laravel API REST.

Ce README sert de guide d'onboarding technique complet pour rejoindre rapidement le projet, comprendre son architecture et contribuer sans friction.

## 1) Vue d'ensemble

KayyDiang permet :

- aux etudiants de suivre des cours, lecons, quiz, devoirs et certificats ;
- aux instructeurs de creer et gerer le contenu pedagogique ;
- aux admins de piloter les utilisateurs et la moderation de la plateforme.

### Stack principale

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, Framer Motion, GSAP
- Backend: Laravel 13, Sanctum, Eloquent ORM
- Base de donnees: PostgreSQL 16 (base locale `elearn`)
- Services dev optionnels: Redis (notifications/queue/cache) via Docker

### Contraintes produit importantes

- Authentification officielle: email/password uniquement
- OAuth tiers: hors scope
- Backend officiel: Laravel uniquement

## 2) Architecture globale (frontend + backend)

## Frontend (SPA)

- Router centralise dans `frontend/src/router/index.tsx`
- Auth context dans `frontend/src/hooks/useAuth.tsx`
- Client HTTP Axios et intercepteurs dans `frontend/src/services/api.ts`
- Domaines dashboard et metier dans `frontend/src/features/dashboard/*`
- Composants drag-and-drop de creation de lecons dans `frontend/src/components/lesson-blocks/*`

Le frontend est role-based : les routes dashboard sont protegees et filtrees par role (`student`, `instructor`, `admin`).

## Backend (API REST)

- Routes API: `backend/routes/api.php`
- Controllers API: `backend/app/Http/Controllers/Api/*`
- Modeles Eloquent: `backend/app/Models/*`
- Schema relationnel: `backend/database/migrations/*`
- Tests backend: `backend/tests/Feature/*`

Le backend expose des endpoints publics (`register`, `login`, `forgot-password`) et des endpoints proteges par Sanctum + middleware de role.

## 3) Arborescence utile

```text
kaaydiang/
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   │   ├── pages/
│   │   │   │   ├── hooks/
│   │   │   │   └── services/dashboard.api.ts
│   │   │   ├── landing/
│   │   │   └── demo/
│   │   ├── components/
│   │   │   └── lesson-blocks/
│   │   ├── hooks/
│   │   │   └── useAuth.tsx
│   │   ├── router/
│   │   └── services/api.ts
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   └── Models/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/DatabaseSeeder.php
│   ├── routes/api.php
│   ├── tests/Feature/
│   └── composer.json
├── docker-compose.yml
├── context.md
└── .planning/
```

## 4) Flux d'authentification (Sanctum)

## Etapes fonctionnelles

1. `POST /api/register` cree un compte (role initial: `student`) et retourne un token
2. `POST /api/login` valide credentials et retourne un token
3. Le token est stocke dans `localStorage` (`token` + `user`)
4. Le frontend ajoute `Authorization: Bearer <token>` via intercepteur Axios
5. `GET /api/user` hydrate la session au refresh
6. `POST /api/logout` invalide le token courant

## Cote frontend

- Hook central: `frontend/src/hooks/useAuth.tsx`
- Intercepteurs API: `frontend/src/services/api.ts`
- Redirection automatique vers `/login` sur `401`
- Resolution de dashboard par role via `resolveDashboardPath`

## Cote backend

- Controller: `backend/app/Http/Controllers/Api/AuthController.php`
- Middleware de protection: `auth:sanctum`
- Controle role-based: middleware `role:student|instructor|admin`

## 5) Appels API majeurs par domaine

Base URL API par defaut: `http://localhost:8000/api`

## Public

- `POST /register`
- `POST /login`
- `POST /forgot-password`

## Session authentifiee

- `POST /logout`
- `GET /user`

## Dashboard

- `GET /dashboard/student`
- `GET /dashboard/student/modules`
- `GET /dashboard/instructor`
- `GET /dashboard/admin`
- `GET /dashboard/admin/modules`

## Student

- Catalogue/cours: `/student/catalog`, `/student/my-courses`, `/student/courses/{course}`
- Inscription/progression: `/student/enroll/{course}`, `/student/lessons/{lesson}/complete`
- Quiz: `/student/quizzes`, `/student/quizzes/{quiz}`, `/student/quizzes/{quiz}/submit`, `/student/quizzes/{quiz}/result`
- Devoirs: `/student/assignments/{assignment}/submit`
- Certificats: `/student/certificates/{certificate}/download`, `/student/certificates/{certificate}/view`
- Messaging: `/student/messages`, `/student/messages/{conversation}/thread`
- Supplements: deadlines/certificates/next-lesson/grades/notifications

## Instructor

- CRUD cours: `/instructor/courses*`
- CRUD chapitres/lecons + reorder + assets
- CRUD quiz + questions + options
- CRUD devoirs + correction submissions
- Calendrier, messages, stats, notifications, profil

## Admin

- Gestion users: `/admin/users*` + role/status
- Health/stats: `/admin/stats`
- Moderation cours: `/admin/courses*`

Reference complete: `backend/routes/api.php`

## 6) Messagerie: fonctionnement actuel

## Student -> Instructor

- Ecran student: `frontend/src/features/dashboard/pages/StudentMessagesPage.tsx`
- Hook metier: `frontend/src/features/dashboard/hooks/useStudentSupplements.ts`
- APIs front: `fetchStudentMessages`, `fetchStudentMessageThread`, `sendStudentMessage`

La conversation est liee a une logique de suivi de soumission/devoir + messages directs stockes en base (`instructor_messages`).

## Instructor -> Student

- Endpoints thread instructor: `/instructor/messages/{student}/thread`
- Envoi: `POST /instructor/messages/{student}/thread`
- Read-tracking: `instructor_conversation_reads` et `student_message_reads`

## 7) Quiz: fonctionnement end-to-end

## Cote instructeur

- Creation quiz, questions, options via endpoints `/instructor/*`
- Types de questions supportes:
  - `multiple_choice`
  - `true_false`
  - `short_answer`

## Cote etudiant

1. Listing quiz accessibles via `GET /student/quizzes`
2. Chargement detail quiz via `GET /student/quizzes/{quiz}` (sans leak des bonnes reponses)
3. Soumission via `POST /student/quizzes/{quiz}/submit`
4. Consultation correction detaillee via `GET /student/quizzes/{quiz}/result`

## Correction

- Auto-correction: QCM + vrai/faux
- Reponse courte: stockee, correction manuelle necessaire
- Stockage des reponses detaillees en base (`quiz_answers`)

Implementation backend: `backend/app/Http/Controllers/Api/StudentLearningController.php`

## 8) Drag-and-drop et editeur de contenu

Le projet integre une edition modulaire de lecons avec blocs drag-and-drop.

## Bibliotheques

- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

## Fichiers cles

- `frontend/src/components/lesson-blocks/LessonEditor.tsx`
- `frontend/src/components/lesson-blocks/BlockWrapper.tsx`
- `frontend/src/components/lesson-blocks/LessonBlockToolbar.tsx`

## Capacites

- Ajout de blocs (`text`, `video`, `pdf`)
- Reorder visuel des blocs
- Upload de PDF par bloc
- Sauvegarde normalisee des blocs cote API

## 9) Base de donnees (schema fonctionnel)

PostgreSQL local, base recommandee: `elearn`

## Entites coeur

- Utilisateurs: `users` (roles + statut actif)
- Cours: `courses`, `chapters`, `lessons`
- Progression: `enrollments`, `lesson_progress`
- Quiz: `quizzes`, `quiz_attempts`, `quiz_questions`, `quiz_options`, `quiz_answers`
- Devoirs: `assignments`, `assignment_submissions`
- Certificats: `certificates`
- Messagerie/lecture: `instructor_messages`, `instructor_conversation_reads`, `student_message_reads`
- Notifications: `notifications`, `notification_reads`

Migration examples:

- `backend/database/migrations/2026_04_06_125046_create_courses_table.php`
- `backend/database/migrations/2026_04_07_000120_create_quizzes_table.php`
- `backend/database/migrations/2026_04_09_042950_create_quiz_questions_and_options_tables.php`

## 10) Execution locale - mode recommande (Docker DB + API locale)

## Prerequis

- PHP 8.3+
- Composer
- Node.js 20+
- Docker + Docker Compose

## Etape A - Demarrer les dependances DB/cache

Depuis la racine du projet:

```bash
docker compose up -d
```

Services disponibles:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Adminer (profil tools): `localhost:8080`

## Etape B - Configurer le backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Configurer la DB dans `backend/.env`:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=elearn
DB_USERNAME=postgres
DB_PASSWORD=postgres
```

Puis lancer migrations + seed:

```bash
php artisan migrate
php artisan db:seed
php artisan serve
```

API: `http://localhost:8000/api`

## Etape C - Configurer le frontend

```bash
cd ../frontend
npm install
```

Verifier que l'URL API cible le backend Laravel. Valeur attendue:

```env
VITE_API_URL=http://localhost:8000/api
```

Lancer le frontend:

```bash
npm run dev
```

App: `http://localhost:5173`

## Comptes de test seedes

Source: `backend/database/seeders/DatabaseSeeder.php`

- Admin: `admin@kaydjangue.local` / `password`
- Instructor: `instructor@kaydjangue.local` / `password`
- Student: `student@kaydjangue.local` / `password`
- Student test: `test@example.com` / `password`

## 11) Tests et qualite

## Backend

- Tests Feature existants (auth, student learning, dashboards, instructor/admin)
- Lancer:

```bash
cd backend
php artisan test
```

ou

```bash
cd backend
composer test
```

## Frontend

Actuellement, pas de suite de tests unitaires configuree dans les scripts npm.

Verification minimale disponible:

```bash
cd frontend
npm run lint
npm run build
```

## 12) FAQ technique

## "Je me connecte mais je suis deconnecte apres refresh"

- Verifier `localStorage` (`token`, `user`)
- Verifier `VITE_API_URL`
- Verifier reponse `GET /api/user` (token encore valide)

## "Erreur 401 sur les appels dashboard"

- Token absent ou invalide
- Role non autorise pour la route cible
- Intercepteur Axios redirige automatiquement sur `/login`

## "Les migrations echouent"

- Verifier que PostgreSQL tourne (`docker compose ps`)
- Verifier credentials dans `backend/.env`
- Relancer proprement:

```bash
cd backend
php artisan migrate:fresh --seed
```

## "Les uploads de devoirs/PDF ne fonctionnent pas"

- Verifier taille/type fichier (validation backend)
- Verifier stockage public Laravel
- Verifier droits ecriture sur `storage/`

## "Le quiz vrai/faux ne corrige pas comme attendu"

- Le backend normalise `true|false|vrai|faux`
- Verifier format payload `answer_data.value`

## "Le certificat telecharge un fichier texte"

- Comportement actuel backend: endpoint download retourne un contenu texte
- Si besoin produit, planifier une evolution vers generation PDF serveur

## "Je veux explorer les endpoints rapidement"

- Point d'entree unique: `backend/routes/api.php`
- Contrats frontend: `frontend/src/features/dashboard/services/dashboard.api.ts`

## 13) References internes

- Cahier des charges et contraintes: `context.md`
- Guide Docker equipe: `DOCKER-TEAM-README.md`
- Planification projet: `.planning/`

---

Si vous rejoignez le projet aujourd'hui, commencez par:

1. lancer la stack locale (Docker + backend + frontend),
2. tester un login student seed,
3. suivre un flux complet (catalogue -> inscription -> lecon -> quiz -> messagerie).

C'est le chemin le plus rapide pour comprendre le fonctionnement end-to-end de KayyDiang.
