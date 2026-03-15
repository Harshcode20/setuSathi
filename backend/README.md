# SetuSathi Backend (FastAPI + PostgreSQL)

This backend implements all endpoints listed in `API_CONTRACT.md`.

## Tech Stack

- FastAPI
- SQLAlchemy 2.x
- PostgreSQL (via `psycopg2`)
- JWT auth (`python-jose`)
- Password hashing (`passlib`/bcrypt)

## Folder Structure

- `app/main.py` — all route handlers
- `app/models.py` — SQLAlchemy models
- `app/schemas.py` — request/response schemas
- `app/database.py` — DB engine/session
- `app/security.py` — JWT/password utils
- `app/deps.py` — auth dependency

## Setup

1. Create Python virtual environment
2. Install dependencies

```bash
pip install -r requirements.txt
```

3. Create `.env` from `.env.example`
4. Ensure Postgres is running and database exists
5. Run server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Database Scripts Order

1. Run your team-provided base schema SQL first.
2. Then run [backend/sql/02_required_additions.sql](sql/02_required_additions.sql) to add missing structures needed by the frontend API contract.
3. Update backend environment values to match your DB setup:
	- DATABASE_URL=postgresql+psycopg2://setuapi:<password>@<host>:5432/setusaathi

## Implemented Endpoints

### Auth & User Profile
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/resolve-login-identifier`
- `POST /auth/firebase-login`
- `POST /auth/forgot-password`
- `GET /users/me` (Bearer token)
- `PATCH /users/me` (Bearer token)

### Patients
- `POST /patients`
- `GET /patients`
- `GET /patients/{patient_id}`
- `PUT /patients/{patient_id}`
- `DELETE /patients/{patient_id}`
- `GET /patients/search/{search_term}`

### OPD
- `POST /opd/sessions`
- `GET /opd/sessions/{pin}`
- `POST /opd/sessions/{pin}/patients`
- `GET /opd/stats`

### Clinical
- `POST /patients/{patient_id}/vitals`
- `POST /patients/{patient_id}/consult`
- `POST /patients/{patient_id}/medicines`
- `GET /patients/{patient_id}/history`

## Notes

- Tables are auto-created at startup (`Base.metadata.create_all`).
- `forgot-password` currently generates and stores reset token/expiry but does not send email provider integration.
- `firebase-login` verifies Firebase ID tokens using `FIREBASE_API_KEY` from `.env`.
- Use `/health` to verify service is up.
