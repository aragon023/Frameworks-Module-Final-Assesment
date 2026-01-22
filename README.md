# Home Task Manager

Designed and Developed by: Mauricio Aragon Ramos  
Course: UCD Full Stack Development - Frameworks (Final Assessment)

Repository:
https://github.com/aragon023/Frameworks-Module-Final-Assesment.git

Deployment (Render):
- Frontend: https://frameworks-module-final-assesment.onrender.com
- Backend API: https://home-task-manager-backend.onrender.com/api

Home Task Manager is a full-stack web application that helps families manage household tasks, members, and pets. It is built as a modern SPA with a Django REST API backend and a React + Vite frontend.

---

## Table of Contents

1. Features
2. Tech Stack & Design Choices
3. Architecture & Folder Structure
4. Backend (Django)
5. Frontend (React)
6. Environment Variables
7. Running the Project Locally
8. Tests
9. Deployment Notes
10. Security Considerations
11. Future Improvements

---

## 1. Features

- JWT authentication (login + refresh)
- Google OAuth login
- Password reset flow with email
- Household-scoped tasks, categories, members, and pets
- Role-aware UI (admin/adult/child)
- Responsive dashboard layout with mobile sidebar

---

## 2. Tech Stack & Design Choices

Backend
- Django 5
- Django REST Framework
- SimpleJWT for stateless auth
- django-anymail + MailerSend for email delivery
- PostgreSQL on Render, SQLite for local development

Frontend
- React + TypeScript
- Vite
- React-Bootstrap
- React Query (@tanstack/react-query)

Hosting & Database
- Render (frontend static site + backend web service)
- Render Postgres

---

## 3. Architecture & Folder Structure

Frameworks-Module-Final-Assesment/
+-- Home_Task_Manager/
    +-- backend/
    |   +-- task_management_system/
    |       +-- manage.py
    |       +-- requirements.txt
    |       +-- core/
    |       |   +-- models.py
    |       |   +-- serializers.py
    |       |   +-- views.py
    |       |   +-- urls.py
    |       |   +-- utils.py
    |       +-- task_management_system/
    |           +-- settings.py
    |           +-- urls.py
    |           +-- wsgi.py
    |           +-- asgi.py
    +-- frontend/
        +-- react-app/
            +-- src/
            |   +-- App.tsx
            |   +-- Routes.tsx
            |   +-- layouts/
            |   |   +-- DashboardLayout.tsx
            |   +-- components/
            |   +-- hooks/
            |   +-- pages/
            +-- .env
            +-- vite.config.ts

---

## 4. Backend (Django)

App: core  
Main URLconf: task_management_system/urls.py  
API base path: /api/

Public endpoints:
- POST /api/register/ - create a new user (also creates a default Member)
- POST /api/token/ - obtain access & refresh tokens (also backfills Member on login if missing)
- POST /api/token/refresh/ - refresh access token
- POST /api/auth/google/ - Google OAuth login
- POST /api/password-reset/ - request a password reset email
- POST /api/password-reset-confirm/ - confirm reset (uid + token + new password)

Authenticated endpoints (JWT required):
- GET /api/dashboard/
- CRUD: /api/tasks/, /api/categories/, /api/members/, /api/pets/
- GET/PATCH /api/me/ - current user profile
- POST /api/change-password/

Notes
- Household scoping is enforced server-side from the authenticated user.
- Password-based registration now creates a Member record.
- Login also creates a Member if missing (for existing users).

---

## 5. Frontend (React)

Routing (src/Routes.tsx):
Public routes:
- /login
- /register
- /forgot-password
- /reset-password/:uid/:token

Protected routes:
- /
- /tasks
- /categories
- /members
- /pets
- /profile
- /calendar
- /rewards

DashboardLayout
- Desktop sidebar + mobile top bar + off-canvas sidebar
- Logo is shown in both mobile and desktop headers

Authentication
- JWT stored in localStorage (MVP)
- RequireAuth guard redirects to /login if missing

---

## 6. Environment Variables

Backend (local: backend/task_management_system/.env)

- DJANGO_SECRET_KEY=...
- DJANGO_DEBUG=True
- DATABASE_URL=postgres://... (optional locally)
- DJANGO_ALLOWED_HOSTS=... (prod only)

Email (MailerSend):
- MAILERSEND_API_TOKEN=...
- DEFAULT_FROM_EMAIL=no-reply@your-verified-domain

Frontend base URL for reset links:
- FRONTEND_BASE_URL=http://localhost:5173

Frontend (local: frontend/react-app/.env)
- VITE_API_BASE=http://127.0.0.1:8000/api
- VITE_GOOGLE_CLIENT_ID=your_google_client_id

Render (production)
- Frontend: set VITE_API_BASE and VITE_GOOGLE_CLIENT_ID in Render env vars
- Backend: set DATABASE_URL, GOOGLE_OAUTH_CLIENT_ID, MAILERSEND_API_TOKEN, DEFAULT_FROM_EMAIL, FRONTEND_BASE_URL

---

## 7. Running the Project Locally

Backend
1) cd Home_Task_Manager/backend/task_management_system
2) python -m venv venv
3) venv\Scripts\activate (Windows) or source venv/bin/activate (macOS/Linux)
4) pip install -r requirements.txt
5) Create .env (see variables above)
6) python manage.py migrate
7) python manage.py createsuperuser
8) python manage.py runserver
API URL: http://127.0.0.1:8000/api

Frontend
1) cd Home_Task_Manager/frontend/react-app
2) npm install
3) Create .env with VITE_API_BASE=http://127.0.0.1:8000/api
4) npm run dev
Frontend URL: http://localhost:5173

---

## 8. Tests

Backend tests (pytest)
1) cd Home_Task_Manager/backend/task_management_system
2) pytest

Test modules include:
- tests/test_google_auth.py
- tests/test_rewards.py
- tests/test_dashboard_auth.py
- tests/test_auth_required.py
- tests/test_household_isolation_bdd.py

Note
- Tests are configured via pytest.ini (pytest-django)
- There are no frontend automated tests in this repository yet

---

## 9. Deployment Notes (Render)

Backend Web Service
- Build: pip install -r requirements.txt
- Start: gunicorn task_management_system.wsgi:application
- DATABASE_URL must point to Render Postgres

Frontend Static Site
- Build: npm install && npm run build
- Publish dir: dist
- Add rewrite rule: /* -> /index.html

Important
- Render free tier services can sleep (first request may return 503 while waking).

---

## 10. Security Considerations

- Django password hashing (raw passwords never stored)
- JWT authentication
- Password reset tokens are time-limited
- Environment variables used for secrets
- CORS enabled for development; tighten for production

---

## 11. Future Improvements

- Stronger permissions and roles
- Invitation workflow enhancements
- Calendar + rewards expansions
- File uploads for avatars
- Move JWT storage to HttpOnly cookies
