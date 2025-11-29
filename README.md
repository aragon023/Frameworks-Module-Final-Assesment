Designed and Developed by: Mauricio Aragon Ramos 
Nov 2025
Course: UCD Full Stack Development
Course Module: Frameworks - Final Assessment

Github Repository:
 https://github.com/aragon023/Frameworks-Module-Final-Assesment.git

Deployment in Render:
https://frameworks-module-final-assesment.onrender.com

*The initial screen has been left to see the UI of the application when clicked, but any user can sign up with a username and password to create content for the household. 
This is an MVP that will consider additional functionalities for the Final Project. (more information below). 

Name of the Application: Home Task Manager
Home Task Manager is a full-stack web application that helps families manage household tasks, members and pets. It is built as a modern SPA with a Django REST API backend and a React + Vite frontend.
It is structured so that both the backend and frontend can be deployed independently (Render is used for hosting).


Table of Contents

1.Features
2.Tech Stack & Design Choices
3.Architecture & Folder Structure
4.Backend (Django)
5. Frontend (React
6. Environment Variables
7. Running the Project Locally
8. Deployment Notes
9. Security Considerations
10 Future Improvements



2. Tech Stack and Design Choices
>Backend
- Django 5
  - Mature, batteries-included web framework
  - Built-in ORM, auth system and admin 
- Django REST Framework
  - Makes it simple to expose clean JSON APIs
  - Browsable API is useful for debugging (I used it heavily while deploying to Render)
- SimpleJWT
  - Stateless authentication with access & refresh tokens
  - Works very well with a separate SPA frontend
- django-anymail + SendGrid
  - Unified email API for Django, with a simple configuration layer
  - SendGrid free tier is enough for password reset emails


> Frontend
- React + TypeScript
  - React is widely used and well-suited for SPAs
  - TypeScript helps catch errors early and documents data shapes clearly
- Vite
  - Very fast dev server & build tool
  - Simple configuration for environment variables (e.g. `VITE_API_BASE`)
- React-Bootstrap
  - Quickly build a consistent UI using familiar Bootstrap components
  - I chose Bootstrap to focus more on functionality and less on custom CSS
- React Query (@tanstack/react-query)**
  - Handles data fetching, caching and loading/error states
  - Simplifies API interactions vs manual `useState` + `useEffect`


> Hosting & Database
- Render
  - Django backend deployed as a Web Service (`gunicorn` + `task_management_system.wsgi`)
  - PostgreSQL database provisioned on Render
- SQLite for local development
  - Simpler setup locally
  - In production, `dj-database-url` switches to the Postgres `DATABASE_URL` automatically


3. Architecture and Folder Structure

Frameworks-Module-Final-Assesment/
└── Home_Task_Manager/
    ├── backend/
    │   └── task_management_system/
    │       ├── manage.py
    │       ├── requirements.txt
    │       ├── core/
    │       │   ├── models.py
    │       │   ├── serializers.py
    │       │   ├── views.py
    │       │   ├── urls.py
    │       │   └── utils.py
    │       └── task_management_system/
    │           ├── settings.py
    │           ├── urls.py
    │           ├── wsgi.py
    │           └── asgi.py
    └── frontend/
        └── react-app/
            ├── src/
            │   ├── App.tsx
            │   ├── Routes.tsx
            │   ├── layouts/
            │   │   └── DashboardLayout.tsx
            │   ├── components/
            │   │   ├── Sidebar.tsx
            │   │   ├── TaskModal.tsx
            │   │   └── RequireAuth.tsx
            │   ├── hooks/
            │   │   ├── useTasks.ts
            │   │   ├── useCategories.ts
            │   │   ├── useMembers.ts
            │   │   ├── usePets.ts
            │   │   └── useCurrentUser.ts
            │   └── pages/
            │       ├── DashboardPage (App.tsx as dashboard)
            │       ├── TasksPage.tsx
            │       ├── CategoriesPage.tsx
            │       ├── MembersPage.tsx
            │       ├── PetsPage.tsx
            │       ├── LoginPage.tsx
            │       ├── RegisterPage.tsx
            │       ├── ForgotPasswordPage.tsx
            │       ├── ResetPasswordPage.tsx
            │       └── ProfilePage.tsx
            ├── .env
            └── vite.config.ts

4. Backend (Django)

> Key points:

App: core
Main URLconf: task_management_system/urls.py
API base path: /api/

> Important Endpoints

Public Endpoints:
POST /api/register/ — create a new user
POST /api/token/ — obtain access & refresh tokens
POST /api/token/refresh/ — refresh access token
POST /api/password-reset/ — request a password reset email
POST /api/password-reset-confirm/ — confirm reset (uid + token + new password)

> Authenticated Endpoints (JWT required):

GET /api/dashboard/?household=1
GET/POST /api/tasks/
GET/POST /api/categories/
GET/POST /api/members/
GET/POST /api/pets/
GET/PATCH /api/me/ — current user profile
POST /api/change-password/

> Models (Simplified)

Task:
household (int, MVP)
title, description
due_date, priority, completed, completed_at
category (FK)
assignee_member (FK)
assignee_pet (FK)

timestamps

Category:
name
household (int, MVP)

Member:
name
avatar_url
household (int, MVP)

Pet:
name
icon (string, often emoji)
household (int, MVP)

Password Reset & Email
core/utils.py builds the reset link.

Email sent through send_mail using Anymail + SendGrid.

Reset link matches the React route format:

FRONTEND_BASE_URL/reset-password/<uid>/<token>

In development, if SENDGRID_API_KEY is missing,
The link can simply be logged instead of sending a real email.


5. Frontend REACT

>Routing (src/Routes.tsx)

Public Routes:
/login
/register
/forgot-password
/reset-password/:uid/:token

Protected Routes (wrapped with RequireAuth):
/ (dashboard – uses App.tsx inside DashboardLayout)
/tasks
/categories
/members
/pets
/profile

>Layout and Navigation

DashboardLayout includes:
Desktop sidebar (always visible on large screens)
Mobile top bar with menu button
Mobile off-canvas sidebar (Sidebar component)
Logout button

Sidebar contains links to:
Dashboard
Tasks
Categories
Family
Pets
Calendar (future)
Rewards (future)
Profile
Settings (future)

Sidebar also shows:
Household information
Members list

>Styling
React-Bootstrap is used for all UI components:
Cards, buttons, forms, alerts, layout, etc.

Primary action buttons (e.g., “Add pet”, “Save changes”, “Update password”)
use: variant="success"

The theme uses a minimalist approach with neutral whites/greys and green colour for primary actions.

>Data Fetching

API data is handled via React Query hooks:
useTasks
useCategories
useMembers
usePets
useCurrentUser

Each hook manages:
Loading and error states
Caching
Automatic refetching
Invalidating queries after mutations


> Authentication Frontend

On successful login, the backend returns:

access token (JWT)
refresh token (JWT)
Tokens are stored in localStorage (sufficient for MVP).

RequireAuth behaviour:
Checks for access token
If missing → redirect to /login

6. Environment Variables
Backend (backend/task_management_system/.env in local dev)

Examples:

# Core Django
DJANGO_SECRET_KEY=your-local-dev-secret-key
DJANGO_DEBUG=True

# Optional, for Postgres (used automatically on Render)
# DATABASE_URL=postgres://...

# Allowed hosts (for production)
# DJANGO_ALLOWED_HOSTS=home-task-manager-backend.onrender.com

# Email / SendGrid
SENDGRID_API_KEY=your_sendgrid_key
DEFAULT_FROM_EMAIL=you@example.com

# Frontend base URL (used for reset-password links)
FRONTEND_BASE_URL=http://localhost:5173


On Render, these same keys are configured in the service’s Environment tab, with appropriate production values (DJANGO_DEBUG=False, DATABASE_URL pointing to the Render Postgres instance, etc).

Frontend (frontend/react-app/.env)
# Local development
VITE_API_BASE=http://127.0.0.1:8000/api


For the deployed frontend, VITE_API_BASE is set to the Render backend URL:

VITE_API_BASE=https://home-task-manager-backend.onrender.com/api
7. Running the Project Locally
Prerequisites:
>Python 3.12+ (project developed with Python 3.13)
>Node.js (LTS) + npm
>Optional: PostgreSQL (not required for local dev; SQLite is default)


BACKEND – Django API
From the backend directory:
cd Home_Task_Manager/backend/task_management_system
 python -m venv venv
 source venv/bin/activate
 (Windows: venv\Scripts\activate)
Install dependencies:
pip install -r requirements.txt
Create a .env file in the same folder as settings.py.
Run migrations and create a superuser:
python manage.py migrate
 python manage.py createsuperuser
Start the development server:
python manage.py runserver
API URL: http://127.0.0.1:8000/

2. FRONTEND – React App
Open a new terminal:
cd Home_Task_Manager/frontend/react-app
 npm install
Create the file: frontend/react-app/.env
 Add the following line:
VITE_API_BASE=http://127.0.0.1:8000/api
Start the Vite dev server:
npm run dev
Frontend URL: http://localhost:5173/
Login using the superuser account you created, or register a new user through the UI.

8. Deployment Notes
> Backend is deployed as a Render Web Service:
- Build command: pip install -r requirements.txt
- Start command: gunicorn task_management_system.wsgi:application
- DATABASE_URL (Render Postgres) and other env vars configured in the Render dashboard.


>Frontend is built with Vite and deployed as a static site on Render
- Build command: npm install && npm run build
-Publish directory: dist
-VITE_API_BASE points to the deployed backend (https://home-task-manager-backend.onrender.com/api).
- A catch-all rewrite rule is used so routes like /reset-password/:uid/:token are handled by React:
/* → /index.html


9. Security Considerations
A few security-related practices were used:
>Password storage – Django’s built-in auth system hashes passwords using a strong password hasher; raw passwords are never stored.

>JWT Authentication – The API uses access + refresh tokens via SimpleJWT. Only authenticated routes require a valid token.

>Password reset safety
Uses Django’s PasswordResetTokenGenerator for signed time-sensitive tokens.
The reset request endpoint always returns a generic success message and does not reveal whether an email exists in the system.

>Environment variables
Secrets like DJANGO_SECRET_KEY, DATABASE_URL, and SENDGRID_API_KEY are never checked into source control; they are loaded from .env locally and from Render’s environment configuration in production.

>CORS
django-cors-headers is used. For local development, all origins are allowed to simplify setup; in a real production app this should be tightened.

>Transport
Render serves the production app over HTTPS.

For simplicity, this MVP stores JWT tokens in localStorage. For a production system, it would be better to move to HttpOnly cookies and add CSRF protection for non-GET requests.

10. Future Improvements
Some ideas for future work
Real Household model with:
- Each user owning or joining a household
- Roles (parents vs children)
- Invitations via email
- Calendar view (tasks on a calendar)
- Reward system tied to completed tasks
- Activity timeline (who completed what and when)
- Avatar upload instead of just URLs
- Stronger permission model and more robust validation


