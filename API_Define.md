# SetuSathi API Contract (Frontend -> Backend)

This document defines API endpoints required by the current frontend flows.

Base URL: `http://<your-server-host>:8000`

---

## 0) Common Conventions

- Content type: `application/json`
- Date format: `YYYY-MM-DD`
- Timestamp format: ISO 8601 (`YYYY-MM-DDTHH:MM:SS`)
- Standard error response:

```json
{
  "detail": "Human-readable error message"
}
```

---

## 1) Auth & User Profile APIs

### 1.1 Login
- **Method/Path:** `POST /auth/login`
- **Used by:** Login screen
- **Request:**

```json
{
  "email": "doctor@setu.test",
  "password": "secret123"
}
```

- **Response:**

```json
{
  "success": true,
  "user": {
    "id": "u_123",
    "name": "Dr. Demo",
    "email": "doctor@setu.test"
  },
  "access_token": "jwt-or-session-token"
}
```

### 1.2 Register Doctor/Volunteer
- **Method/Path:** `POST /auth/register`
- **Used by:** Register screen
- **Request:**

```json
{
  "full_name": "Dr. Asha Patel",
  "member_id": "D0024",
  "email": "asha@setu.test",
  "mobile": "9876543210",
  "password": "secret123",
  "role": "doctor",
  "photo_url": "https://..."
}
```

- **Response:**

```json
{
  "success": true,
  "user": {
    "id": "u_124",
    "full_name": "Dr. Asha Patel",
    "member_id": "D0024",
    "email": "asha@setu.test",
    "mobile": "9876543210",
    "role": "doctor",
    "photo_url": "https://..."
  }
}
```

### 1.3 Forgot Password (send reset link)
- **Method/Path:** `POST /auth/forgot-password`
- **Used by:** Login + Settings
- **Request:**

```json
{
  "email": "asha@setu.test"
}
```

- **Response:**

```json
{
  "success": true,
  "message": "Reset link sent"
}
```

### 1.4 Get Current User Profile
- **Method/Path:** `GET /users/me`
- **Used by:** App bootstrap, Dashboards, Settings
- **Response:**

```json
{
  "id": "u_124",
  "full_name": "Dr. Asha Patel",
  "member_id": "D0024",
  "email": "asha@setu.test",
  "mobile": "9876543210",
  "photo_url": "https://...",
  "role": "doctor"
}
```

### 1.5 Update User Profile
- **Method/Path:** `PATCH /users/me`
- **Used by:** Settings (update mobile)
- **Request:**

```json
{
  "mobile": "9999999999"
}
```

- **Response:**

```json
{
  "success": true,
  "user": {
    "id": "u_124",
    "full_name": "Dr. Asha Patel",
    "member_id": "D0024",
    "email": "asha@setu.test",
    "mobile": "9999999999",
    "photo_url": "https://...",
    "role": "doctor"
  }
}
```

---

## 2) Patient APIs (Already used by frontend)

### 2.1 Create Patient
- **Method/Path:** `POST /patients`
- **Used by:** Register Patient screen
- **Request:**

```json
{
  "full_name": "John Doe",
  "gender": "Male",
  "date_of_birth": "1990-01-15",
  "age": 33,
  "mobile_number": "+1234567890",
  "address": "123 Main St",
  "photo_url": "https://example.com/photo.jpg",
  "created_by": 1,
  "updated_by": 1
}
```

- **Response:** `201 Created`

```json
{
  "patient_id": 1,
  "full_name": "John Doe",
  "gender": "Male",
  "date_of_birth": "1990-01-15",
  "age": 33,
  "mobile_number": "+1234567890",
  "address": "123 Main St",
  "photo_url": "https://example.com/photo.jpg",
  "created_by": 1,
  "updated_by": 1,
  "created_at": "2024-06-01T12:00:00",
  "updated_at": "2024-06-01T12:00:00"
}
```

### 2.2 Get All Patients
- **Method/Path:** `GET /patients?skip={skip}&limit={limit}`
- **Used by:** Patient Record screen, store refresh
- **Response:** `200 OK` (array of Patient objects)

### 2.3 Get Patient by ID
- **Method/Path:** `GET /patients/{patient_id}`
- **Used by:** Patient detail / future detail screen
- **Response:** `200 OK` (single Patient object)

### 2.4 Update Patient
- **Method/Path:** `PUT /patients/{patient_id}`
- **Used by:** patient update flow (store method already present)
- **Request (example):**

```json
{
  "full_name": "John Smith",
  "updated_by": 2
}
```

- **Response:** `200 OK` (updated Patient object)

### 2.5 Delete Patient
- **Method/Path:** `DELETE /patients/{patient_id}`
- **Used by:** patient delete flow (store method already present)
- **Response:** `204 No Content`

### 2.6 Search Patients
- **Method/Path:** `GET /patients/search/{search_term}?skip={skip}&limit={limit}`
- **Used by:** Registration Desk search, Patient Record search
- **Response:** `200 OK` (array of Patient objects)

---

## 3) OPD Session APIs

### 3.1 Start OPD Session
- **Method/Path:** `POST /opd/sessions`
- **Used by:** Start OPD / OPD Started
- **Request:**

```json
{
  "opd_id": "OPD-RAMAGRI-250622",
  "pin": "123456",
  "village": "Ramagri",
  "desk_role": "registration",
  "created_by": "u_124"
}
```

- **Response:**

```json
{
  "success": true,
  "opd_id": "OPD-RAMAGRI-250622",
  "pin": "123456"
}
```

### 3.2 Join OPD by PIN
- **Method/Path:** `GET /opd/sessions/{pin}`
- **Used by:** Doctor Dashboard / desk join flows
- **Response:**

```json
{
  "opd_id": "OPD-RAMAGRI-250622",
  "pin": "123456",
  "village": "Ramagri",
  "desk_role": "registration",
  "status": "active",
  "patients": [
    {
      "id": "P1234",
      "name": "Dharamshinhbhai Prajapati",
      "gender": "Male",
      "age": 58,
      "token": 1
    }
  ],
  "created_at": "2026-03-15T10:00:00"
}
```

### 3.3 Add Patient to OPD Session Queue
- **Method/Path:** `POST /opd/sessions/{pin}/patients`
- **Used by:** Start Patient Visit
- **Request:**

```json
{
  "id": "P1234",
  "name": "Dharamshinhbhai Prajapati",
  "gender": "Male",
  "age": 58,
  "token": 1
}
```

- **Response:**

```json
{
  "success": true
}
```

### 3.4 OPD Stats
- **Method/Path:** `GET /opd/stats`
- **Used by:** Dashboard statistics
- **Response:**

```json
{
  "totalOPDs": 12,
  "vitalsRecorded": 24,
  "consultsDone": 18,
  "medicinesGiven": 15
}

```

### 3.5 Update OPD Patient Status
- **Method/Path:** `PATCH /opd/sessions/{pin}/patients/{patient_id}`
- **Used by:** Doctor OPD session (mark patient as consulted/completed)
- **Request:**

```json
{
  "status": "consulted",
  "notes": "Follow-up after 1 week"
}
```

- **Response:**

```json
{
  "success": true,
  "patient": {
    "id": "P1234",
    "name": "Dharamshinhbhai Prajapati",
    "gender": "Male",
    "age": 58,
    "token": 1,
    "status": "consulted",
    "notes": "Follow-up after 1 week"
  }
}
```

---

## 4) Clinical APIs

### 4.1 Record Vitals
- **Method/Path:** `POST /patients/{patient_id}/vitals`
- **Used by:** Vitals Desk
- **Request (example):**

```json
{
  "temp": "98.2",
  "pulse": "86",
  "bp": "140/120",
  "spo2": "99",
  "blood_sugar": "120",
  "allergies": "Smoke allergy",
  "notes": "Patient felt dizzy"
}
```

- **Response:**

```json
{
  "success": true,
  "vitals_id": 501
}
```

### 4.2 Record Consultation
- **Method/Path:** `POST /patients/{patient_id}/consult`
- **Used by:** Consulting Patient
- **Request (example):**

```json
{
  "diagnosis": ["Arthritis", "Diabetes"],
  "lab_tests": ["CBC"],
  "follow_up": "After 1 Week",
  "doctor_notes": "Revisit after 3 days"
}
```

- **Response:**

```json
{
  "success": true,
  "consult_id": 7001
}
```

### 4.3 Dispense Medicines
- **Method/Path:** `POST /patients/{patient_id}/medicines`
- **Used by:** Medicine Counter
- **Request:**

```json
{
  "medicines": [
    {
      "id": "6.2",
      "name": "T. Citra",
      "dosage": "1-0-1",
      "days": 3,
      "timing": "After Meal"
    }
  ]
}
```

- **Response:**

```json
{
  "success": true,
  "dispense_id": 9001
}
```

### 4.4 Patient History (recommended for consult history modal)
- **Method/Path:** `GET /patients/{patient_id}/history`
- **Used by:** Consulting Patient history view
- **Response:**

```json
[
  {
    "id": "vh-1",
    "date": "2026-03-10",
    "consulted_by": "Dr. Ramesh Jani",
    "complaints": ["Body pain", "Fever"],
    "vitals": {
      "temp": "98.2 F",
      "bp": "140/120",
      "pulse": "86 bpm",
      "bs": "120",
      "spo2": "99"
    },
    "allergies": "Smoke allergy",
    "registration_notes": "Patient felt dizzy earlier",
    "vitals_notes": "BP high",
    "diagnosis": ["Arthritis"],
    "lab_tests": ["CBC"],
    "medicines": [
      {
        "id": "6.2",
        "name": "T. Citra",
        "dosage": "1-0-1",
        "days": "3",
        "timing": "After Meal"
      }
    ]
  }
]
```

---

## 5) Screen -> Endpoint Mapping Summary

- **Login:** `POST /auth/login`, `POST /auth/forgot-password`
- **Register:** `POST /auth/register`
- **Dashboard / Doctor Dashboard:** `GET /users/me`, `GET /opd/stats`
- **Settings:** `GET /users/me`, `PATCH /users/me`, `POST /auth/forgot-password`
- **Register Patient:** `POST /patients`
- **Patient Record:** `GET /patients`, `GET /patients/search/{search_term}`, `GET /patients/{patient_id}`, `PUT /patients/{patient_id}`, `DELETE /patients/{patient_id}`
- **Registration Desk:** `GET /patients/search/{search_term}`
- **Start OPD / OPD Started:** `POST /opd/sessions`
- **Join OPD flows:** `GET /opd/sessions/{pin}`
- **Start Patient Visit:** `POST /opd/sessions/{pin}/patients`
- **Vitals Desk:** `POST /patients/{patient_id}/vitals`
- **Consulting Patient:** `POST /patients/{patient_id}/consult`, `GET /patients/{patient_id}/history`
- **Medicine Counter:** `POST /patients/{patient_id}/medicines`

---
