import enum
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class UserRole(str, enum.Enum):
    doctor = 'doctor'
    volunteer = 'volunteer'


class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    member_id: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    mobile: Mapped[str | None] = mapped_column(String(20), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default=UserRole.doctor.value, nullable=False)
    photo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    reset_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reset_token_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Patient(Base):
    __tablename__ = 'patients'

    patient_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    mobile_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[int | None] = mapped_column(Integer, nullable=True)
    updated_by: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    vitals: Mapped[list['VitalsRecord']] = relationship(back_populates='patient', cascade='all, delete-orphan')
    consults: Mapped[list['ConsultRecord']] = relationship(back_populates='patient', cascade='all, delete-orphan')
    medicines: Mapped[list['MedicineDispense']] = relationship(back_populates='patient', cascade='all, delete-orphan')


class OPDSession(Base):
    __tablename__ = 'opd_sessions'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    opd_id: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    pin: Mapped[str] = mapped_column(String(6), unique=True, index=True, nullable=False)
    village: Mapped[str] = mapped_column(String(120), nullable=False)
    desk_role: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default='active', nullable=False)
    created_by: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    patients: Mapped[list['OPDSessionPatient']] = relationship(back_populates='session', cascade='all, delete-orphan')


class OPDSessionPatient(Base):
    __tablename__ = 'opd_session_patients'
    __table_args__ = (
        UniqueConstraint('session_id', 'token', name='uq_session_token'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey('opd_sessions.id', ondelete='CASCADE'), index=True)
    patient_ref: Mapped[str] = mapped_column(String(40), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    token: Mapped[int] = mapped_column(Integer, nullable=False)
    queue_status: Mapped[str] = mapped_column(String(30), default='waiting_vitals', nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    session: Mapped['OPDSession'] = relationship(back_populates='patients')

class OPDSessionPatientMeta(Base):
    __tablename__ = 'opd_session_patient_meta'
    __table_args__ = (
        UniqueConstraint('session_id', 'token', name='uq_session_token_meta'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = mapped_column(ForeignKey('opd_sessions.id', ondelete='CASCADE'), index=True)
    token: Mapped[int] = mapped_column(Integer, nullable=False)
    complaints: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    registration_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class VitalsRecord(Base):
    __tablename__ = 'vitals_records'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey('patients.patient_id', ondelete='CASCADE'), index=True)
    temp: Mapped[str | None] = mapped_column(String(20), nullable=True)
    pulse: Mapped[str | None] = mapped_column(String(20), nullable=True)
    bp: Mapped[str | None] = mapped_column(String(30), nullable=True)
    spo2: Mapped[str | None] = mapped_column(String(20), nullable=True)
    blood_sugar: Mapped[str | None] = mapped_column(String(20), nullable=True)
    allergies: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    patient: Mapped['Patient'] = relationship(back_populates='vitals')


class ConsultRecord(Base):
    __tablename__ = 'consult_records'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey('patients.patient_id', ondelete='CASCADE'), index=True)
    diagnosis: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    lab_tests: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    follow_up: Mapped[str | None] = mapped_column(String(60), nullable=True)
    doctor_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    consulted_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    consulted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    patient: Mapped['Patient'] = relationship(back_populates='consults')


class MedicineDispense(Base):
    __tablename__ = 'medicine_dispenses'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey('patients.patient_id', ondelete='CASCADE'), index=True)
    medicines: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)
    dispensed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    patient: Mapped['Patient'] = relationship(back_populates='medicines')
