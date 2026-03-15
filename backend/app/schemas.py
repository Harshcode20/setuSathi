from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ErrorResponse(BaseModel):
    detail: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    member_id: str
    email: EmailStr
    mobile: str | None = None
    photo_url: str | None = None
    role: str


class LoginRequest(BaseModel):
    email: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=6)


class FirebaseLoginRequest(BaseModel):
    id_token: str = Field(min_length=10)


class LoginIdentifierRequest(BaseModel):
    identifier: str = Field(min_length=2, max_length=255)


class LoginIdentifierResponse(BaseModel):
    success: bool = True
    email: EmailStr


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    member_id: str = Field(min_length=2, max_length=30)
    email: EmailStr
    mobile: str | None = None
    password: str = Field(min_length=6)
    role: str = Field(default='doctor')
    photo_url: str | None = None


class LoginResponse(BaseModel):
    success: bool = True
    user: UserOut
    access_token: str


class RegisterResponse(BaseModel):
    success: bool = True
    user: UserOut


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class MessageResponse(BaseModel):
    success: bool = True
    message: str


class ProfileUpdateRequest(BaseModel):
    full_name: str | None = None
    member_id: str | None = None
    mobile: str | None = None
    photo_url: str | None = None


class ProfileUpdateResponse(BaseModel):
    success: bool = True
    user: UserOut


class PatientCreate(BaseModel):
    full_name: str
    gender: str
    date_of_birth: date | None = None
    age: int
    mobile_number: str | None = None
    address: str | None = None
    photo_url: str | None = None
    created_by: int = 1
    updated_by: int = 1


class PatientUpdate(BaseModel):
    full_name: str | None = None
    gender: str | None = None
    date_of_birth: date | None = None
    age: int | None = None
    mobile_number: str | None = None
    address: str | None = None
    photo_url: str | None = None
    updated_by: int


class PatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    patient_id: int
    full_name: str
    gender: str
    date_of_birth: date | None = None
    age: int
    mobile_number: str | None = None
    address: str | None = None
    photo_url: str | None = None
    created_by: int | None = None
    updated_by: int | None = None
    created_at: datetime
    updated_at: datetime


class OPDSessionCreate(BaseModel):
    opd_id: str
    pin: str = Field(min_length=6, max_length=6)
    village: str
    desk_role: str
    created_by: str | None = None


class OPDSessionPatientCreate(BaseModel):
    id: str
    name: str
    gender: str
    age: int
    token: int
    complaints: list[str] = Field(default_factory=list)
    registration_notes: str | None = None


class OPDSessionPatientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    gender: str
    age: int
    token: int
    queue_status: Literal['waiting_vitals', 'waiting_doctor', 'consult_done', 'completed'] = 'waiting_vitals'
    complaints: list[str] = Field(default_factory=list)
    registration_notes: str | None = None


class OPDSessionPatientStatusUpdate(BaseModel):
    status: Literal['waiting_vitals', 'waiting_doctor', 'consult_done', 'completed']


class OPDSessionResponse(BaseModel):
    opd_id: str
    pin: str
    village: str
    desk_role: str
    status: str
    patients: list[OPDSessionPatientOut]
    created_at: datetime


class OPDStartResponse(BaseModel):
    success: bool = True
    opd_id: str
    pin: str


class OPDStatsResponse(BaseModel):
    totalOPDs: int
    vitalsRecorded: int
    consultsDone: int
    medicinesGiven: int


class VitalsCreate(BaseModel):
    temp: str | None = None
    pulse: str | None = None
    bp: str | None = None
    spo2: str | None = None
    blood_sugar: str | None = None
    allergies: str | None = None
    notes: str | None = None


class VitalsResponse(BaseModel):
    success: bool = True
    vitals_id: int


class ConsultCreate(BaseModel):
    diagnosis: list[str] = Field(default_factory=list)
    lab_tests: list[str] = Field(default_factory=list)
    follow_up: str | None = None
    doctor_notes: str | None = None
    consulted_by: str | None = None


class ConsultResponse(BaseModel):
    success: bool = True
    consult_id: int


class MedicineItem(BaseModel):
    id: str
    name: str
    dosage: str
    days: int | str
    timing: str


class MedicineDispenseCreate(BaseModel):
    medicines: list[MedicineItem] = Field(default_factory=list)


class MedicineDispenseResponse(BaseModel):
    success: bool = True
    dispense_id: int


class HistoryEntry(BaseModel):
    id: str
    date: str
    consulted_by: str | None = None
    complaints: list[str] = Field(default_factory=list)
    vitals: dict[str, Any] | None = None
    allergies: str | None = None
    registration_notes: str | None = None
    vitals_notes: str | None = None
    diagnosis: list[str] = Field(default_factory=list)
    lab_tests: list[str] = Field(default_factory=list)
    medicines: list[dict[str, Any]] = Field(default_factory=list)
