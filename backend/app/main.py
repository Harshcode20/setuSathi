from datetime import datetime, timedelta, timezone
import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import desc, func, inspect, or_, select, text
from sqlalchemy.orm import Session

from .config import settings
from .database import Base, engine, get_db
from .deps import get_current_user
from .models import (
    ConsultRecord,
    MedicineDispense,
    OPDSession,
    OPDSessionPatient,
    OPDSessionPatientMeta,
    Patient,
    User,
    VitalsRecord,
)
from .schemas import (
    ConsultCreate,
    ConsultResponse,
    FirebaseLoginRequest,
    ForgotPasswordRequest,
    HistoryEntry,
    LoginIdentifierRequest,
    LoginIdentifierResponse,
    LoginRequest,
    LoginResponse,
    MedicineDispenseCreate,
    MedicineDispenseResponse,
    MessageResponse,
    OPDSessionCreate,
    OPDSessionPatientCreate,
    OPDSessionPatientStatusUpdate,
    OPDSessionResponse,
    OPDStartResponse,
    OPDStatsResponse,
    PatientCreate,
    PatientOut,
    PatientUpdate,
    ProfileUpdateRequest,
    ProfileUpdateResponse,
    RegisterRequest,
    RegisterResponse,
    UserOut,
    VitalsCreate,
    VitalsResponse,
)
from .security import create_access_token, generate_reset_token, hash_password, verify_password


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.on_event('startup')
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        inspector = inspect(conn)
        opd_patient_columns = {column['name'] for column in inspector.get_columns('opd_session_patients')}
        if 'queue_status' not in opd_patient_columns:
            conn.execute(
                text("ALTER TABLE opd_session_patients ADD COLUMN queue_status VARCHAR(30) NOT NULL DEFAULT 'waiting_vitals'")
            )


@app.get('/health')
def health() -> dict[str, str]:
    return {'status': 'ok'}


def _verify_firebase_id_token(id_token: str) -> str:
    if not settings.firebase_api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Backend missing FIREBASE_API_KEY configuration',
        )

    endpoint = f'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={settings.firebase_api_key}'
    payload = json.dumps({'idToken': id_token}).encode('utf-8')
    req = Request(
        endpoint,
        data=payload,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )

    try:
        with urlopen(req, timeout=10) as response:
            raw = response.read().decode('utf-8')
            data = json.loads(raw)
    except HTTPError as exc:
        detail = 'Invalid Firebase token'
        try:
            err_body = json.loads(exc.read().decode('utf-8'))
            detail = err_body.get('error', {}).get('message') or detail
        except Exception:
            pass
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f'Firebase verification failed: {detail}')
    except URLError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail='Unable to reach Firebase verification service',
        )

    users = data.get('users') or []
    if not users:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid Firebase token payload')

    email = str(users[0].get('email') or '').strip().lower()
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Firebase token does not include an email')

    return email


def _patient_or_404(db: Session, patient_id: int) -> Patient:
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f'Patient with ID {patient_id} not found')
    return patient


def _normalize_name(value: str) -> str:
    return ' '.join(value.strip().lower().split())


def _find_duplicate_patient(db: Session, payload: PatientCreate) -> Patient | None:
    if not payload.mobile_number:
        return None

    candidates = db.execute(
        select(Patient).where(Patient.mobile_number == payload.mobile_number)
    ).scalars().all()

    expected_name = _normalize_name(payload.full_name)
    expected_gender = payload.gender.strip().lower()

    for candidate in candidates:
        if _normalize_name(candidate.full_name) != expected_name:
            continue
        if candidate.gender.strip().lower() != expected_gender:
            continue

        if payload.date_of_birth:
            if candidate.date_of_birth != payload.date_of_birth:
                continue
        elif candidate.age != payload.age:
            continue

        return candidate

    return None


# -----------------------------------------------------------------------------
# Auth & User Profile
# -----------------------------------------------------------------------------


@app.post('/auth/register', response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> RegisterResponse:
    role_value = payload.role if payload.role in {'doctor', 'volunteer'} else 'doctor'
    normalized_email = payload.email.strip().lower()
    member_id = payload.member_id.strip()

    existing_user = db.execute(
        select(User).where(or_(User.email == normalized_email, User.member_id == member_id))
    ).scalars().first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='User with email or member_id already exists')

    user = User(
        full_name=payload.full_name,
        member_id=member_id,
        email=normalized_email,
        mobile=payload.mobile,
        password_hash=hash_password(payload.password),
        role=role_value,
        photo_url=payload.photo_url,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return RegisterResponse(success=True, user=UserOut.model_validate(user))


@app.post('/auth/login', response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    identifier = payload.email.strip()
    identifier_email = identifier.lower()
    user = db.execute(
        select(User).where(
            or_(
                User.email == identifier_email,
                User.member_id == identifier,
            )
        )
    ).scalars().first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid credentials')

    token = create_access_token(str(user.id))
    return LoginResponse(success=True, user=UserOut.model_validate(user), access_token=token)


@app.post('/auth/resolve-login-identifier', response_model=LoginIdentifierResponse)
def resolve_login_identifier(payload: LoginIdentifierRequest, db: Session = Depends(get_db)) -> LoginIdentifierResponse:
    identifier = payload.identifier.strip()
    normalized_email = identifier.lower()

    user = db.execute(
        select(User).where(
            or_(
                User.email == normalized_email,
                User.member_id == identifier,
            )
        )
    ).scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Account not found')

    return LoginIdentifierResponse(success=True, email=user.email)


@app.post('/auth/firebase-login', response_model=LoginResponse)
def firebase_login(payload: FirebaseLoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    verified_email = _verify_firebase_id_token(payload.id_token)

    user = db.execute(select(User).where(User.email == verified_email)).scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Account verified in Firebase but not found in PostgreSQL. Please register first.',
        )

    token = create_access_token(str(user.id))
    return LoginResponse(success=True, user=UserOut.model_validate(user), access_token=token)


@app.post('/auth/forgot-password', response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)) -> MessageResponse:
    normalized_email = payload.email.strip().lower()
    user = db.execute(select(User).where(User.email == normalized_email)).scalars().first()
    if user:
        user.reset_token = generate_reset_token()
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(minutes=30)
        db.commit()

    return MessageResponse(success=True, message='Reset link sent')


@app.get('/users/me', response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)


@app.patch('/users/me', response_model=ProfileUpdateResponse)
def update_me(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProfileUpdateResponse:
    if payload.member_id and payload.member_id != current_user.member_id:
        duplicate = db.execute(select(User).where(User.member_id == payload.member_id)).scalars().first()
        if duplicate:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='member_id already in use')
        current_user.member_id = payload.member_id

    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.mobile is not None:
        current_user.mobile = payload.mobile
    if payload.photo_url is not None:
        current_user.photo_url = payload.photo_url

    db.commit()
    db.refresh(current_user)

    return ProfileUpdateResponse(success=True, user=UserOut.model_validate(current_user))


# -----------------------------------------------------------------------------
# Patients
# -----------------------------------------------------------------------------


@app.post('/patients', response_model=PatientOut, status_code=status.HTTP_201_CREATED)
def create_patient(payload: PatientCreate, response: Response, db: Session = Depends(get_db)) -> PatientOut:
    duplicate = _find_duplicate_patient(db, payload)
    if duplicate:
        updated = False

        if payload.date_of_birth and not duplicate.date_of_birth:
            duplicate.date_of_birth = payload.date_of_birth
            updated = True

        if payload.age and payload.age != duplicate.age:
            duplicate.age = payload.age
            updated = True

        if payload.address and payload.address != duplicate.address:
            duplicate.address = payload.address
            updated = True

        if payload.photo_url and payload.photo_url != duplicate.photo_url:
            duplicate.photo_url = payload.photo_url
            updated = True

        if payload.updated_by and payload.updated_by != duplicate.updated_by:
            duplicate.updated_by = payload.updated_by
            updated = True

        if updated:
            db.commit()
            db.refresh(duplicate)

        response.status_code = status.HTTP_200_OK
        return PatientOut.model_validate(duplicate)

    patient = Patient(
        full_name=payload.full_name,
        gender=payload.gender,
        date_of_birth=payload.date_of_birth,
        age=payload.age,
        mobile_number=payload.mobile_number,
        address=payload.address,
        photo_url=payload.photo_url,
        created_by=payload.created_by,
        updated_by=payload.updated_by,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return PatientOut.model_validate(patient)


@app.get('/patients', response_model=list[PatientOut])
def get_patients(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[PatientOut]:
    patients = db.execute(
        select(Patient)
        .order_by(desc(Patient.patient_id))
        .offset(skip)
        .limit(limit)
    ).scalars().all()
    return [PatientOut.model_validate(patient) for patient in patients]


@app.get('/patients/{patient_id}', response_model=PatientOut)
def get_patient(patient_id: int, db: Session = Depends(get_db)) -> PatientOut:
    patient = _patient_or_404(db, patient_id)
    return PatientOut.model_validate(patient)


@app.put('/patients/{patient_id}', response_model=PatientOut)
def update_patient(patient_id: int, payload: PatientUpdate, db: Session = Depends(get_db)) -> PatientOut:
    patient = _patient_or_404(db, patient_id)

    if payload.full_name is not None:
        patient.full_name = payload.full_name
    if payload.gender is not None:
        patient.gender = payload.gender
    if payload.date_of_birth is not None:
        patient.date_of_birth = payload.date_of_birth
    if payload.age is not None:
        patient.age = payload.age
    if payload.mobile_number is not None:
        patient.mobile_number = payload.mobile_number
    if payload.address is not None:
        patient.address = payload.address
    if payload.photo_url is not None:
        patient.photo_url = payload.photo_url

    patient.updated_by = payload.updated_by

    db.commit()
    db.refresh(patient)
    return PatientOut.model_validate(patient)


@app.delete('/patients/{patient_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: int, db: Session = Depends(get_db)) -> Response:
    patient = _patient_or_404(db, patient_id)
    db.delete(patient)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get('/patients/search/{search_term}', response_model=list[PatientOut])
def search_patients(
    search_term: str,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[PatientOut]:
    like_term = f'%{search_term}%'
    patients = db.execute(
        select(Patient)
        .where(
            or_(
                Patient.full_name.ilike(like_term),
                Patient.mobile_number.ilike(like_term),
            )
        )
        .order_by(desc(Patient.patient_id))
        .offset(skip)
        .limit(limit)
    ).scalars().all()
    return [PatientOut.model_validate(patient) for patient in patients]


# -----------------------------------------------------------------------------
# OPD Sessions
# -----------------------------------------------------------------------------


@app.post('/opd/sessions', response_model=OPDStartResponse, status_code=status.HTTP_201_CREATED)
def start_opd_session(payload: OPDSessionCreate, db: Session = Depends(get_db)) -> OPDStartResponse:
    twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
    existing_active = db.execute(
        select(OPDSession)
        .where(
            OPDSession.village == payload.village,
            OPDSession.status == 'active',
            OPDSession.created_at >= twenty_four_hours_ago,
        )
        .order_by(desc(OPDSession.created_at))
    ).scalars().first()

    if existing_active:
        return OPDStartResponse(success=True, opd_id=existing_active.opd_id, pin=existing_active.pin)

    existing_pin = db.execute(select(OPDSession).where(OPDSession.pin == payload.pin)).scalars().first()
    if existing_pin:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='OPD session with this PIN already exists')

    session = OPDSession(
        opd_id=payload.opd_id,
        pin=payload.pin,
        village=payload.village,
        desk_role=payload.desk_role,
        created_by=payload.created_by,
        status='active',
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return OPDStartResponse(success=True, opd_id=session.opd_id, pin=session.pin)


@app.get('/opd/sessions/{pin}', response_model=OPDSessionResponse)
def join_opd_session(pin: str, db: Session = Depends(get_db)) -> OPDSessionResponse:
    session = db.execute(select(OPDSession).where(OPDSession.pin == pin)).scalars().first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='OPD session not found')

    queued_patients = db.execute(
        select(OPDSessionPatient)
        .where(OPDSessionPatient.session_id == session.id)
        .order_by(OPDSessionPatient.token.asc())
    ).scalars().all()

    metadata_rows = db.execute(
        select(OPDSessionPatientMeta)
        .where(OPDSessionPatientMeta.session_id == session.id)
    ).scalars().all()
    metadata_by_token = {row.token: row for row in metadata_rows}

    return OPDSessionResponse(
        opd_id=session.opd_id,
        pin=session.pin,
        village=session.village,
        desk_role=session.desk_role,
        status=session.status,
        patients=[
            {
                'id': patient.patient_ref,
                'name': patient.name,
                'gender': patient.gender,
                'age': patient.age,
                'token': patient.token,
                'queue_status': patient.queue_status,
                'complaints': (metadata_by_token.get(patient.token).complaints if metadata_by_token.get(patient.token) else []),
                'registration_notes': (metadata_by_token.get(patient.token).registration_notes if metadata_by_token.get(patient.token) else None),
            }
            for patient in queued_patients
        ],
        created_at=session.created_at,
    )


@app.post('/opd/sessions/{pin}/patients', response_model=MessageResponse)
def add_patient_to_session(pin: str, payload: OPDSessionPatientCreate, db: Session = Depends(get_db)) -> MessageResponse:
    session = db.execute(select(OPDSession).where(OPDSession.pin == pin)).scalars().first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='OPD session not found')

    token_exists = db.execute(
        select(OPDSessionPatient).where(
            OPDSessionPatient.session_id == session.id,
            OPDSessionPatient.token == payload.token,
        )
    ).scalars().first()
    if token_exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Token already exists in this session')

    queue_item = OPDSessionPatient(
        session_id=session.id,
        patient_ref=payload.id,
        name=payload.name,
        gender=payload.gender,
        age=payload.age,
        token=payload.token,
        queue_status='waiting_vitals',
    )
    db.add(queue_item)

    normalized_complaints = [item.strip() for item in payload.complaints if item and item.strip()]
    normalized_registration_notes = payload.registration_notes.strip() if payload.registration_notes else None

    if normalized_complaints or normalized_registration_notes:
        existing_meta = db.execute(
            select(OPDSessionPatientMeta).where(
                OPDSessionPatientMeta.session_id == session.id,
                OPDSessionPatientMeta.token == payload.token,
            )
        ).scalars().first()

        if existing_meta:
            existing_meta.complaints = normalized_complaints
            existing_meta.registration_notes = normalized_registration_notes
        else:
            db.add(
                OPDSessionPatientMeta(
                    session_id=session.id,
                    token=payload.token,
                    complaints=normalized_complaints,
                    registration_notes=normalized_registration_notes,
                )
            )

    db.commit()

    return MessageResponse(success=True, message='Patient added to OPD queue')


@app.patch('/opd/sessions/{pin}/patients/{token}/status', response_model=MessageResponse)
def update_patient_status(
    pin: str,
    token: int,
    payload: OPDSessionPatientStatusUpdate,
    db: Session = Depends(get_db),
) -> MessageResponse:
    session = db.execute(select(OPDSession).where(OPDSession.pin == pin)).scalars().first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='OPD session not found')

    queue_item = db.execute(
        select(OPDSessionPatient).where(
            OPDSessionPatient.session_id == session.id,
            OPDSessionPatient.token == token,
        )
    ).scalars().first()

    if not queue_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Patient token not found in this session')

    queue_item.queue_status = payload.status
    db.commit()

    return MessageResponse(success=True, message='Patient queue status updated')


@app.get('/opd/stats', response_model=OPDStatsResponse)
def get_opd_stats(db: Session = Depends(get_db)) -> OPDStatsResponse:
    total_opds = db.scalar(select(func.count(OPDSession.id))) or 0
    vitals_recorded = db.scalar(select(func.count(VitalsRecord.id))) or 0
    consults_done = db.scalar(select(func.count(ConsultRecord.id))) or 0
    medicines_given = db.scalar(select(func.count(MedicineDispense.id))) or 0

    return OPDStatsResponse(
        totalOPDs=int(total_opds),
        vitalsRecorded=int(vitals_recorded),
        consultsDone=int(consults_done),
        medicinesGiven=int(medicines_given),
    )


# -----------------------------------------------------------------------------
# Clinical
# -----------------------------------------------------------------------------


@app.post('/patients/{patient_id}/vitals', response_model=VitalsResponse, status_code=status.HTTP_201_CREATED)
def record_vitals(patient_id: int, payload: VitalsCreate, db: Session = Depends(get_db)) -> VitalsResponse:
    _patient_or_404(db, patient_id)

    vitals = VitalsRecord(
        patient_id=patient_id,
        temp=payload.temp,
        pulse=payload.pulse,
        bp=payload.bp,
        spo2=payload.spo2,
        blood_sugar=payload.blood_sugar,
        allergies=payload.allergies,
        notes=payload.notes,
    )
    db.add(vitals)
    db.commit()
    db.refresh(vitals)

    return VitalsResponse(success=True, vitals_id=vitals.id)


@app.post('/patients/{patient_id}/consult', response_model=ConsultResponse, status_code=status.HTTP_201_CREATED)
def record_consult(patient_id: int, payload: ConsultCreate, db: Session = Depends(get_db)) -> ConsultResponse:
    _patient_or_404(db, patient_id)

    consult = ConsultRecord(
        patient_id=patient_id,
        diagnosis=payload.diagnosis,
        lab_tests=payload.lab_tests,
        follow_up=payload.follow_up,
        doctor_notes=payload.doctor_notes,
        consulted_by=payload.consulted_by,
    )
    db.add(consult)
    db.commit()
    db.refresh(consult)

    return ConsultResponse(success=True, consult_id=consult.id)


@app.post('/patients/{patient_id}/medicines', response_model=MedicineDispenseResponse, status_code=status.HTTP_201_CREATED)
def dispense_medicines(
    patient_id: int,
    payload: MedicineDispenseCreate,
    db: Session = Depends(get_db),
) -> MedicineDispenseResponse:
    _patient_or_404(db, patient_id)

    dispense = MedicineDispense(
        patient_id=patient_id,
        medicines=[medicine.model_dump() for medicine in payload.medicines],
    )
    db.add(dispense)
    db.commit()
    db.refresh(dispense)

    return MedicineDispenseResponse(success=True, dispense_id=dispense.id)


@app.get('/patients/{patient_id}/history', response_model=list[HistoryEntry])
def get_patient_history(patient_id: int, db: Session = Depends(get_db)) -> list[HistoryEntry]:
    _patient_or_404(db, patient_id)

    consults = db.execute(
        select(ConsultRecord)
        .where(ConsultRecord.patient_id == patient_id)
        .order_by(desc(ConsultRecord.consulted_at))
    ).scalars().all()

    vitals_records = db.execute(
        select(VitalsRecord)
        .where(VitalsRecord.patient_id == patient_id)
        .order_by(desc(VitalsRecord.recorded_at))
    ).scalars().all()

    medicine_records = db.execute(
        select(MedicineDispense)
        .where(MedicineDispense.patient_id == patient_id)
        .order_by(desc(MedicineDispense.dispensed_at))
    ).scalars().all()

    history_map: dict[str, dict[str, Any]] = {}

    def ensure_entry(date_key: str) -> dict[str, Any]:
        if date_key not in history_map:
            history_map[date_key] = {
                'id': '',
                'date': date_key,
                'consulted_by': None,
                'complaints': [],
                'vitals': None,
                'allergies': None,
                'registration_notes': None,
                'vitals_notes': None,
                'diagnosis': [],
                'lab_tests': [],
                'medicines': [],
            }
        return history_map[date_key]

    for consult in consults:
        date_key = consult.consulted_at.date().isoformat()
        entry = ensure_entry(date_key)

        if consult.consulted_by:
            entry['consulted_by'] = consult.consulted_by

        for diagnosis_item in consult.diagnosis or []:
            if diagnosis_item not in entry['diagnosis']:
                entry['diagnosis'].append(diagnosis_item)

        for lab_item in consult.lab_tests or []:
            if lab_item not in entry['lab_tests']:
                entry['lab_tests'].append(lab_item)

    for vitals in vitals_records:
        date_key = vitals.recorded_at.date().isoformat()
        entry = ensure_entry(date_key)

        vitals_payload: dict[str, Any] = {}
        if vitals.temp:
            vitals_payload['temp'] = vitals.temp
        if vitals.bp:
            vitals_payload['bp'] = vitals.bp
        if vitals.pulse:
            vitals_payload['pulse'] = vitals.pulse
        if vitals.blood_sugar:
            vitals_payload['bs'] = vitals.blood_sugar
        if vitals.spo2:
            vitals_payload['spo2'] = vitals.spo2

        if vitals_payload:
            entry['vitals'] = vitals_payload

        if vitals.allergies:
            entry['allergies'] = vitals.allergies

        if vitals.notes:
            entry['vitals_notes'] = vitals.notes

    for dispense in medicine_records:
        date_key = dispense.dispensed_at.date().isoformat()
        entry = ensure_entry(date_key)

        for medicine in dispense.medicines or []:
            entry['medicines'].append(medicine)

    sorted_dates = sorted(history_map.keys(), reverse=True)
    result: list[HistoryEntry] = []
    for idx, date_key in enumerate(sorted_dates, start=1):
        row = history_map[date_key]
        row['id'] = f'vh-{idx}'
        result.append(HistoryEntry.model_validate(row))

    return result
