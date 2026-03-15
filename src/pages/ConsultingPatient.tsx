import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePreferences } from '../lib/PreferencesContext';

// ─── Data ────────────────────────────────────────────

const diseases = [
  { id: '5.1', label: 'Arthritis' },
  { id: '5.2', label: 'Dermatosis' },
  { id: '5.3', label: 'Boils' },
  { id: '5.4', label: 'Diarrhea' },
  { id: '5.5', label: 'Diabetes' },
  { id: '5.6', label: 'Cough & Cold' },
  { id: '5.7', label: 'Fever' },
  { id: '5.8', label: 'Constipation' },
  { id: '5.9', label: 'Hypertension' },
  { id: '5.10', label: 'Cardiac' },
];

const labTests = [
  { id: '6.1', label: 'CBC' },
  { id: '6.2', label: 'RBS' },
  { id: '6.3', label: 'MP' },
  { id: '6.4', label: 'Urine (R/M)' },
  { id: '6.5', label: 'T3' },
  { id: '6.6', label: 'T4' },
  { id: '6.7', label: 'TSH' },
  { id: '6.8', label: 'Lipid' },
  { id: '6.9', label: 'FBS/PPBS' },
];

type MedicineCategory = 'All' | 'Diabetes' | 'Gastric' | 'Infection' | 'Dental' | 'Eye' | 'Pain' | 'Cardiac';

const medicineCategories: MedicineCategory[] = ['All', 'Diabetes', 'Gastric', 'Infection', 'Dental', 'Eye', 'Pain', 'Cardiac'];

type Medicine = { id: string; label: string; category: MedicineCategory[] };

const allMedicines: Medicine[] = [
  { id: '7.1', label: 'T. Para', category: ['Pain'] },
  { id: '7.2', label: 'T. Citra', category: ['Pain'] },
  { id: '7.3', label: 'C. Amoxy', category: ['Infection'] },
  { id: '7.4', label: 'T. Aceclopara', category: ['Pain'] },
  { id: '7.5', label: 'C. B-Complex', category: ['Diabetes'] },
  { id: '7.6', label: 'C. Cad-Fol', category: ['Cardiac'] },
  { id: '7.7', label: 'T. Metformin', category: ['Diabetes'] },
  { id: '7.8', label: 'T. Glimep', category: ['Diabetes'] },
  { id: '7.9', label: 'T. Pantoprazole', category: ['Gastric'] },
  { id: '7.10', label: 'T. Domperidone', category: ['Gastric'] },
  { id: '7.11', label: 'T. Ranitidine', category: ['Gastric'] },
  { id: '7.12', label: 'T. Azithromycin', category: ['Infection'] },
  { id: '7.13', label: 'T. Ciprofloxacin', category: ['Infection'] },
  { id: '7.14', label: 'T. Amlodipine', category: ['Cardiac'] },
  { id: '7.15', label: 'T. Atenolol', category: ['Cardiac'] },
  { id: '7.16', label: 'Eye Drop Gentamicin', category: ['Eye'] },
  { id: '7.17', label: 'Eye Drop Ciproflox', category: ['Eye'] },
  { id: '7.18', label: 'T. Ibuprofen', category: ['Pain', 'Dental'] },
  { id: '7.19', label: 'C. Amoxicillin', category: ['Dental', 'Infection'] },
  { id: '7.20', label: 'Clove Oil', category: ['Dental'] },
];

const dosageOptions = ['0-1-0', '1-0-1', '1-1-1', 'Custom'];
const timingOptions = ['Before Meal', 'With Meal', 'After Meal'];

type SelectedMedicine = {
  id: string;
  label: string;
  days: number;
  dosage: string;
  timing: string;
  note: string;
};

type HistoryVitals = {
  temp?: string;
  bp?: string;
  pulse?: string;
  bs?: string;
  spo2?: string;
};

type HistoryMedicine = {
  id: string;
  name: string;
  dosage: string;
  days: string;
  timing: string;
};

type VisitHistoryEntry = {
  id: string;
  date: string;
  consultedBy?: string;
  complaints?: string[];
  vitals?: HistoryVitals;
  allergies?: string;
  registrationNotes?: string;
  vitalsNotes?: string;
  diagnosis?: string[];
  labTests?: string[];
  medicines?: HistoryMedicine[];
};

const defaultVisitHistory: VisitHistoryEntry[] = [
  {
    id: 'vh-1',
    date: '10-6-2025',
    labTests: ['6.1 CBC'],
    medicines: [
      { id: '6.2', name: 'T. Citra', dosage: '1-0-1', days: '3', timing: 'After Meal' },
      { id: '6.7', name: 'T. Cip Z', dosage: '1-0-1', days: '3', timing: 'Before Meal' },
      { id: '6.9', name: 'T. Losartan', dosage: '1-0-1', days: '3', timing: 'After Meal' },
      { id: '6.13', name: 'Calcium Tab', dosage: '1-0-1', days: '3', timing: 'After Meal' },
    ],
  },
  {
    id: 'vh-2',
    date: '10-6-2025',
    consultedBy: 'Dr. Ramesh Jani',
    complaints: ['1.1 Body Pain', '2.1 Fever', '3.1 Cough', '4.1 Weakness'],
    vitals: { temp: '98.2 F', bp: '140/120', pulse: '86 bpm', bs: '120', spo2: '99' },
    allergies: 'Smoke Allergie',
    registrationNotes: 'Patient felt dizziy earlier today',
    vitalsNotes: 'Patient felt dizziy earlier today',
    diagnosis: ['5.1 Arthritis', '5.3 Boils', '5.4 Diarrhea'],
    labTests: ['6.1 CBC'],
    medicines: [
      { id: '6.2', name: 'T. Citra', dosage: '1-0-1', days: '3', timing: 'After Meal' },
      { id: '6.7', name: 'T. Cip Z', dosage: '1-0-1', days: '3', timing: 'Before Meal' },
      { id: '6.9', name: 'T. Losartan', dosage: '1-0-1', days: '3', timing: 'After Meal' },
      { id: '6.13', name: 'Calcium Tab', dosage: '1-0-1', days: '3', timing: 'After Meal' },
    ],
  },
];

// ─── Component ───────────────────────────────────────

const ConsultingPatient = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t, colors } = usePreferences();
  const { patient } = (route.params as any) || {};

  const patientData = patient || {
    id: 'P1234', name: 'Dharamshinhbhai Prajapati', gender: 'Male', age: 58, token: 1,
    complaints: [], vitals: {}, allergies: '', registrationNotes: '', vitalsNotes: '',
  };

  // Step management: 1 = Diagnosis, 2 = Prescribe Medicines, 3 = Follow-up Recommendation
  const [step, setStep] = useState(1);

  // Step 1 state — Diagnosis
  const [selectedDiseases, setSelectedDiseases] = useState<Set<string>>(new Set());
  const [otherDiagnosis, setOtherDiagnosis] = useState('');
  const [requireLabTests, setRequireLabTests] = useState(false);
  const [selectedLabTests, setSelectedLabTests] = useState<Set<string>>(new Set());
  const [otherLabTest, setOtherLabTest] = useState('');

  // Step 2 state — Medicines
  const [medSearch, setMedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<MedicineCategory>('All');
  const [selectedMedicines, setSelectedMedicines] = useState<Map<string, SelectedMedicine>>(new Map());

  // Step 3 state — Follow-up
  const [followUp, setFollowUp] = useState('Not Required');

  // Step 1 — complaints section collapsed
  const [complaintsExpanded, setComplaintsExpanded] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  const visitHistory = Array.isArray((patientData as any).history) && (patientData as any).history.length > 0
    ? (patientData as any).history as VisitHistoryEntry[]
    : defaultVisitHistory;

  const medicineCategoryLabels: Record<MedicineCategory, string> = {
    All: t('All'),
    Diabetes: t('Diabetes'),
    Gastric: t('Gastric'),
    Infection: t('Infection'),
    Dental: t('Dental'),
    Eye: t('Eye'),
    Pain: t('Pain'),
    Cardiac: t('Cardiac'),
  };

  // ─── Helpers ─────

  const toggleDisease = (id: string) => {
    setSelectedDiseases((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleLabTest = (id: string) => {
    setSelectedLabTests((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleMedicine = (med: Medicine) => {
    setSelectedMedicines((prev) => {
      const next = new Map(prev);
      if (next.has(med.id)) {
        next.delete(med.id);
      } else {
        next.set(med.id, { id: med.id, label: med.label, days: 3, dosage: '1-0-1', timing: 'After Meal', note: '' });
      }
      return next;
    });
  };

  const updateMedicine = (id: string, field: keyof SelectedMedicine, value: any) => {
    setSelectedMedicines((prev) => {
      const next = new Map(prev);
      const existing = next.get(id);
      if (existing) next.set(id, { ...existing, [field]: value });
      return next;
    });
  };

  const filteredMedicines = allMedicines.filter((m) => {
    const matchesCategory = activeCategory === 'All' || m.category.includes(activeCategory);
    const matchesSearch = !medSearch || m.label.toLowerCase().includes(medSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  };

  const removeMedicine = (id: string) => {
    setSelectedMedicines((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const handleMarkAsDone = () => {
    const tokenNum = patientData.token || 1;
    (navigation as any).navigate('DoctorOPDSession', { completedToken: tokenNum });
  };

  const renderHistoryChips = (items: string[] | undefined) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={styles.historyChipWrap}>
        {items.map((item, index) => (
          <View key={`${item}-${index}`} style={[styles.historyChip, { backgroundColor: colors.subSurface, borderColor: colors.border }]}>
            <Text style={[styles.historyChipText, { color: colors.text }]}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderHistoryTimeline = () => (
    <Modal visible={historyOpen} transparent animationType="slide" onRequestClose={() => setHistoryOpen(false)}>
      <View style={styles.historyBackdrop}>
        <View style={[styles.historySheet, { backgroundColor: colors.background }]}> 
          <View style={styles.historyHeaderRow}>
            <View style={styles.historyTitleWrap}>
              <Text style={[styles.historyTitle, { color: colors.text }]}>{t('Visit History')}</Text>
              <View style={[styles.historyCountBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                <Text style={[styles.historyCountText, { color: colors.mutedText }]}>{visitHistory.length}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setHistoryOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={26} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          {visitHistory.length === 0 ? (
            <View style={styles.historyEmptyWrap}>
              <Text style={[styles.historyEmptyText, { color: colors.mutedText }]}>{t('No history available')}</Text>
            </View>
          ) : (
            <ScrollView style={styles.historyScroll} contentContainerStyle={styles.historyScrollContent}>
              {visitHistory.map((entry, index) => (
                <View key={entry.id || `${entry.date}-${index}`} style={styles.historyRow}>
                  <View style={styles.historyRail}>
                    <View style={styles.historyDotOuter}>
                      <View style={styles.historyDotInner} />
                    </View>
                    {index < visitHistory.length - 1 && <View style={[styles.historyLine, { backgroundColor: colors.border }]} />}
                  </View>

                  <View style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
                    <View style={[styles.historyCardDateRow, { borderBottomColor: colors.border }]}> 
                      <Ionicons name="calendar-outline" size={18} color="#2563EB" />
                      <Text style={[styles.historyDateText, { color: colors.text }]}>{entry.date}</Text>
                    </View>

                    <View style={styles.historyCardBody}>
                      {entry.consultedBy ? (
                        <Text style={[styles.historyConsultedBy, { color: colors.mutedText }]}>
                          {t('Consulted by')} <Text style={styles.historyConsultedByStrong}>{entry.consultedBy}</Text>
                        </Text>
                      ) : null}

                      {entry.complaints && entry.complaints.length > 0 ? (
                        <View style={styles.historySection}>
                          <View style={styles.historySectionHead}>
                            <Ionicons name="document-text-outline" size={18} color={colors.mutedText} />
                            <Text style={[styles.historySectionTitle, { color: colors.text }]}>{t('Patient Complaints')}</Text>
                          </View>
                          {renderHistoryChips(entry.complaints)}
                        </View>
                      ) : null}

                      {entry.vitals ? (
                        <View style={styles.historySection}>
                          <View style={styles.historySectionHead}>
                            <Ionicons name="heart-outline" size={18} color={colors.mutedText} />
                            <Text style={[styles.historySectionTitle, { color: colors.text }]}>{t('Recorded Vitals')}</Text>
                          </View>
                          <View style={styles.historyVitalsGrid}>
                            {entry.vitals.temp ? <Text style={[styles.historyVitalsItem, { color: colors.mutedText }]}>{t('Temp.')}  <Text style={styles.historyVitalsStrong}>{entry.vitals.temp}</Text></Text> : null}
                            {entry.vitals.bp ? <Text style={[styles.historyVitalsItem, { color: colors.mutedText }]}>{t('B.P.')}  <Text style={styles.historyVitalsStrong}>{entry.vitals.bp}</Text></Text> : null}
                            {entry.vitals.pulse ? <Text style={[styles.historyVitalsItem, { color: colors.mutedText }]}>{t('Pulse')}  <Text style={styles.historyVitalsStrong}>{entry.vitals.pulse}</Text></Text> : null}
                            {entry.vitals.bs ? <Text style={[styles.historyVitalsItem, { color: colors.mutedText }]}>{t('B.S.')}  <Text style={styles.historyVitalsStrong}>{entry.vitals.bs}</Text></Text> : null}
                            {entry.vitals.spo2 ? <Text style={[styles.historyVitalsItem, { color: colors.mutedText }]}>{t('SPO2')}  <Text style={styles.historyVitalsStrong}>{entry.vitals.spo2}</Text></Text> : null}
                          </View>
                        </View>
                      ) : null}

                      {entry.allergies ? (
                        <View style={styles.historySection}>
                          <View style={styles.historySectionHead}>
                            <Ionicons name="eye-outline" size={18} color={colors.mutedText} />
                            <Text style={[styles.historySectionTitle, { color: colors.text }]}>{t('Allergies')}</Text>
                          </View>
                          <Text style={[styles.historyValue, { color: colors.mutedText }]}>{entry.allergies}</Text>
                        </View>
                      ) : null}

                      {entry.registrationNotes ? (
                        <View style={styles.historySection}>
                          <View style={styles.historySectionHead}>
                            <Ionicons name="create-outline" size={18} color={colors.mutedText} />
                            <Text style={[styles.historySectionTitle, { color: colors.text }]}>{t('Notes from Registration Desk')}</Text>
                          </View>
                          <Text style={[styles.historyValue, { color: colors.mutedText }]}>{entry.registrationNotes}</Text>
                        </View>
                      ) : null}

                      {entry.vitalsNotes ? (
                        <View style={styles.historySection}>
                          <View style={styles.historySectionHead}>
                            <Ionicons name="create-outline" size={18} color={colors.mutedText} />
                            <Text style={[styles.historySectionTitle, { color: colors.text }]}>{t('Notes from Vital Desk')}</Text>
                          </View>
                          <Text style={[styles.historyValue, { color: colors.mutedText }]}>{entry.vitalsNotes}</Text>
                        </View>
                      ) : null}

                      {entry.diagnosis && entry.diagnosis.length > 0 ? (
                        <View style={styles.historySection}>
                          <View style={styles.historySectionHead}>
                            <MaterialCommunityIcons name="stethoscope" size={18} color={colors.mutedText} />
                            <Text style={[styles.historySectionTitle, { color: colors.text }]}>{t("Doctor's Diagnosis")}</Text>
                          </View>
                          {renderHistoryChips(entry.diagnosis)}
                        </View>
                      ) : null}

                      {entry.labTests && entry.labTests.length > 0 ? (
                        <View style={styles.historySection}>
                          <View style={styles.historySectionHead}>
                            <Ionicons name="document-text-outline" size={18} color={colors.mutedText} />
                            <Text style={[styles.historySectionTitle, { color: colors.text }]}>{t('Labtest Investigation')}</Text>
                          </View>
                          {renderHistoryChips(entry.labTests)}
                        </View>
                      ) : null}

                      {entry.medicines && entry.medicines.length > 0 ? (
                        <View style={styles.historySection}>
                          <View style={styles.historySectionHead}>
                            <MaterialCommunityIcons name="clipboard-text-outline" size={18} color={colors.mutedText} />
                            <Text style={[styles.historySectionTitle, { color: colors.text }]}>{t('Prescribed Medicines')}</Text>
                          </View>
                          <View style={styles.historyMedicineList}>
                            {entry.medicines.map((medicine, medicineIndex) => (
                              <View key={`${medicine.id}-${medicineIndex}`} style={[styles.historyMedicineCard, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
                                <Text style={[styles.historyMedicineName, { color: colors.text }]}>{medicine.id} {medicine.name}</Text>
                                <Text style={[styles.historyMedicineMeta, { color: colors.mutedText }]}>
                                  {medicine.dosage}  •  {medicine.days} {t('days')}  •  {t(medicine.timing)}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  // ─── Step indicator ─────

  const renderStepIndicator = () => (
    <View style={[styles.stepRow, { backgroundColor: colors.surface }]}> 
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          {s > 1 && <View style={[styles.stepLine, step >= s && styles.stepLineActive]} />}
          <TouchableOpacity
            onPress={() => { if (s < step) setStep(s); }}
            style={[styles.stepCircle, step >= s && styles.stepCircleActive]}
          >
            <Text style={[styles.stepNum, step >= s && styles.stepNumActive]}>{s}</Text>
          </TouchableOpacity>
          {s === step && (
            <Text style={[styles.stepLabel, { color: colors.text }]}> 
              {s === 1 ? t('Patient Diagnosis') : s === 2 ? t('Prescribe Medicines') : t('Follow-up Recommendation')}
            </Text>
          )}
        </React.Fragment>
      ))}
    </View>
  );

  // ─── Patient Info Card ─────

  const renderPatientInfo = () => (
    <View style={[styles.patientCard, { backgroundColor: colors.surface }]}> 
      <View style={styles.patientCardHeader}>
        <Text style={[styles.patientCardLabel, { color: colors.mutedText }]}>{t('Patient Info.')}</Text>
        <View style={styles.tokenBadge}>
          <Text style={styles.tokenBadgeText}>{patientData.token || 1}</Text>
        </View>
      </View>
      <View style={styles.patientCardBody}>
        <View style={styles.patientAvatarCircle}>
          <Text style={styles.patientAvatarText}>{getInitials(patientData.name)}</Text>
        </View>
        <View style={styles.patientInfoCol}>
          <Text style={[styles.patientId, { color: colors.mutedText }]}>P{patientData.id}</Text>
          <Text style={[styles.patientName, { color: colors.text }]}>{patientData.name}</Text>
          <Text style={[styles.patientMeta, { color: colors.mutedText }]}>{t(patientData.gender)}  •  {patientData.age} {t('Yrs')}</Text>
        </View>
      </View>
    </View>
  );

  // ─── Patient Complaints ─────

  const renderComplaints = () => {
    const complaints: string[] = patientData.complaints || [];
    return (
      <TouchableOpacity style={[styles.complaintsCard, { backgroundColor: colors.surface }]} onPress={() => setComplaintsExpanded(!complaintsExpanded)} activeOpacity={0.8}>
        <View style={styles.complaintsHeader}>
          <View style={styles.complaintsHeaderLeft}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={colors.text} />
            <Text style={[styles.complaintsTitle, { color: colors.text }]}>{t('Patient Complaints')}</Text>
          </View>
          <Ionicons name={complaintsExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#2563EB" />
        </View>
        {complaintsExpanded && (
          <View style={styles.complaintsBody}>
            {complaints.length > 0 ? (
              <View style={styles.chipRow}>
                {complaints.map((c: string, i: number) => (
                  <View key={i} style={[styles.chip, { borderColor: colors.border }]}><Text style={[styles.chipText, { color: colors.text }]}>{c}</Text></View>
                ))}
              </View>
            ) : (
              <Text style={[styles.noDataText, { color: colors.mutedText }]}>{t('No complaints recorded')}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ─── Recorded Vitals ─────

  const renderVitals = () => {
    const v = patientData.vitals || {};
    const hasVitals = v.temp || v.pulse || v.spo2 || v.bs || v.bp;
    return (
      <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}> 
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="heart-pulse" size={20} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Recorded Vitals')}</Text>
        </View>
        {hasVitals ? (
          <View style={styles.vitalsGrid}>
            {v.temp ? <VitalItem icon="thermometer" label="Temp." value={`${v.temp} F`} /> : null}
            {v.bs ? <VitalItem icon="water-outline" label="B.S." value={`${v.bs}`} /> : null}
            {v.pulse ? <VitalItem icon="pulse" label="Pulse" value={`${v.pulse} bpm`} /> : null}
            {v.bp ? <VitalItem icon="fitness-outline" label="B.P." value={`${v.bp}`} /> : null}
            {v.spo2 ? <VitalItem icon="cloud-outline" label="SPO2" value={`${v.spo2}`} /> : null}
          </View>
        ) : (
          <Text style={[styles.noDataText, { color: colors.mutedText }]}>{t('No vitals recorded yet')}</Text>
        )}
      </View>
    );
  };

  // ─── Allergies ─────

  const renderAllergies = () => (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}> 
      <View style={styles.sectionHeader}>
        <Ionicons name="eye-outline" size={20} color={colors.text} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Allergies')}</Text>
      </View>
      <Text style={[styles.sectionValue, { color: colors.mutedText }]}>{patientData.allergies || t('None reported')}</Text>
    </View>
  );

  // ─── Notes ─────

  const renderNotes = () => (
    <>
      <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}> 
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text-outline" size={20} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Notes from Registration Desk')}</Text>
        </View>
        <Text style={[styles.sectionValue, { color: colors.mutedText }]}>{patientData.registrationNotes || t('No notes')}</Text>
      </View>
      <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}> 
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text-outline" size={20} color={colors.text} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Notes from Vitals Desk')}</Text>
        </View>
        <Text style={[styles.sectionValue, { color: colors.mutedText }]}>{patientData.vitalsNotes || t('No notes')}</Text>
      </View>
    </>
  );

  // ─── STEP 1: Diagnosis ─────────────────────────────

  const renderStep1 = () => (
    <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }}>
      {renderPatientInfo()}
      {renderComplaints()}
      {renderVitals()}
      {renderAllergies()}
      {renderNotes()}

      {/* Step indicator */}
      {renderStepIndicator()}

      {/* Disease Selection */}
      <View style={styles.sectionPadded}>
        <Text style={[styles.diagnosisHeading, { color: colors.text }]}>{t('Select Disease')}</Text>
        <View style={styles.diseaseGrid}>
          {diseases.map((d) => {
            const isActive = selectedDiseases.has(d.id);
            return (
              <TouchableOpacity
                key={d.id}
                style={[styles.diseaseBtn, { backgroundColor: colors.surface, borderColor: colors.border }, isActive && styles.diseaseBtnActive]}
                onPress={() => toggleDisease(d.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.diseaseBtnText, { color: colors.text }, isActive && styles.diseaseBtnTextActive]}>{d.id}  {d.label}</Text>
                <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
                  {isActive && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Other Diagnosis */}
        <View style={[styles.otherBox, { backgroundColor: colors.subSurface, borderColor: colors.border }]}> 
          <MaterialCommunityIcons name="stethoscope" size={18} color={colors.mutedText} />
          <TextInput
            style={[styles.otherInput, { color: colors.text }]}
            placeholder={t('Other Diagnosis')}
            placeholderTextColor={colors.mutedText}
            value={otherDiagnosis}
            onChangeText={setOtherDiagnosis}
            maxLength={200}
            multiline
          />
        </View>

        {/* Require Lab Tests */}
        <TouchableOpacity style={[styles.labTestToggle, { borderTopColor: colors.border }]} onPress={() => setRequireLabTests(!requireLabTests)} activeOpacity={0.7}>
          <View>
            <Text style={[styles.labTestTitle, { color: colors.text }]}>{t('Require Lab Tests?')}</Text>
            <Text style={[styles.labTestSub, { color: colors.mutedText }]}>{t('Tick only if lab tests are required for this patient.')}</Text>
          </View>
          <View style={[styles.checkbox, requireLabTests && styles.checkboxActive]}>
            {requireLabTests && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
        </TouchableOpacity>

        {/* Lab Test Selection */}
        {requireLabTests && (
          <>
            <View style={styles.diseaseGrid}>
              {labTests.map((test) => {
                const isActive = selectedLabTests.has(test.id);
                return (
                  <TouchableOpacity
                    key={test.id}
                    style={[styles.diseaseBtn, { backgroundColor: colors.surface, borderColor: colors.border }, isActive && styles.diseaseBtnActive]}
                    onPress={() => toggleLabTest(test.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.diseaseBtnText, { color: colors.text }, isActive && styles.diseaseBtnTextActive]}>{test.id}  {test.label}</Text>
                    <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
                      {isActive && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={[styles.otherBox, { backgroundColor: colors.subSurface, borderColor: colors.border }]}> 
              <MaterialCommunityIcons name="test-tube" size={18} color={colors.mutedText} />
              <TextInput
                style={[styles.otherInput, { color: colors.text }]}
                placeholder={t('Other Lab-test')}
                placeholderTextColor={colors.mutedText}
                value={otherLabTest}
                onChangeText={setOtherLabTest}
                maxLength={200}
                multiline
              />
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );

  // ─── STEP 2: Prescribe Medicines ────────────────────

  const renderStep2 = () => (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }}>
        {renderPatientInfo()}
        {renderComplaints()}

        {/* Step indicator */}
        {renderStepIndicator()}

        {/* Search */}
        <View style={[styles.searchBarMed, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Ionicons name="search" size={20} color={colors.mutedText} />
          <TextInput
            style={[styles.searchInputMed, { color: colors.text }]}
            placeholder={t('Search medicines')}
            placeholderTextColor={colors.mutedText}
            value={medSearch}
            onChangeText={setMedSearch}
            maxLength={100}
          />
          {medSearch.length > 0 && (
            <TouchableOpacity onPress={() => setMedSearch('')}>
              <Ionicons name="close" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category tabs */}
        <Text style={[styles.selectMedTitle, { color: colors.text }]}>{t('Select Medicines')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          {medicineCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, { backgroundColor: colors.surface, borderColor: colors.border }, activeCategory === cat && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryChipText, { color: colors.text }, activeCategory === cat && styles.categoryChipTextActive]}>{medicineCategoryLabels[cat]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Medicine List */}
        <View style={styles.medList}>
          {filteredMedicines.map((med) => {
            const selected = selectedMedicines.get(med.id);
            const isSelected = !!selected;
            return (
              <View key={med.id}>
                <TouchableOpacity
                  style={[styles.medItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }, isSelected && styles.medItemActive]}
                  onPress={() => toggleMedicine(med)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.medCheckbox, isSelected && styles.medCheckboxActive]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text style={[styles.medLabel, { color: colors.text }, isSelected && styles.medLabelActive]}>
                    {med.id}  -  {med.label}
                  </Text>
                  {isSelected && (
                    <TouchableOpacity onPress={() => updateMedicine(med.id, 'note', selected?.note ? '' : ' ')}>
                      <Text style={styles.addNoteLink}>{t('Add Note')}</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                {/* Expanded config for selected medicine */}
                {isSelected && selected && (
                  <View style={[styles.medConfig, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}> 
                    {/* Days */}
                    <View style={styles.medConfigRow}>
                      <Text style={[styles.medConfigLabel, { color: colors.mutedText }]}>{t('Days')}</Text>
                      <TouchableOpacity
                        style={styles.dayBtn}
                        onPress={() => updateMedicine(med.id, 'days', Math.max(1, selected.days - 1))}
                      >
                        <Ionicons name="remove" size={16} color="#fff" />
                      </TouchableOpacity>
                      <Text style={[styles.dayValue, { color: colors.text }]}>{selected.days}</Text>
                      <TouchableOpacity
                        style={styles.dayBtn}
                        onPress={() => updateMedicine(med.id, 'days', selected.days + 1)}
                      >
                        <Ionicons name="add" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>

                    {/* Dosage */}
                    <View style={styles.medConfigRow}>
                      <Text style={[styles.medConfigLabel, { color: colors.mutedText }]}>{t('Dosage')}</Text>
                      <View style={styles.optionRow}>
                        {dosageOptions.map((opt) => (
                          <TouchableOpacity
                            key={opt}
                            style={[styles.optionBtn, { backgroundColor: colors.surface, borderColor: colors.border }, selected.dosage === opt && styles.optionBtnActive]}
                            onPress={() => updateMedicine(med.id, 'dosage', opt)}
                          >
                            <Text style={[styles.optionBtnText, { color: colors.text }, selected.dosage === opt && styles.optionBtnTextActive]}>{opt}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Timing */}
                    <View style={styles.medConfigRow}>
                      <Text style={[styles.medConfigLabel, { color: colors.mutedText }]}>{t('Timing')}</Text>
                      <View style={styles.optionRow}>
                        {timingOptions.map((opt) => (
                          <TouchableOpacity
                            key={opt}
                            style={[styles.optionBtn, { backgroundColor: colors.surface, borderColor: colors.border }, selected.timing === opt && styles.optionBtnActive]}
                            onPress={() => updateMedicine(med.id, 'timing', opt)}
                          >
                            <Text style={[styles.optionBtnText, { color: colors.text }, selected.timing === opt && styles.optionBtnTextActive]}>{t(opt)}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Selected Medicines Summary Card */}
        {selectedMedicines.size > 0 && (
          <View style={[styles.selectedMedsCard, { backgroundColor: colors.subSurface, borderColor: colors.border }]}> 
            <View style={styles.selectedMedsHeader}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={colors.text} />
              <Text style={[styles.selectedMedsTitle, { color: colors.text }]}>{t('Selected Medicines')}</Text>
            </View>
            {Array.from(selectedMedicines.values()).map((m) => (
              <View key={m.id} style={[styles.selectedMedRow, { borderBottomColor: colors.border }]}> 
                <View style={styles.selectedMedInfo}>
                  <View style={styles.selectedMedNameRow}>
                    <MaterialCommunityIcons name="pill" size={16} color="#2563EB" />
                    <Text style={[styles.selectedMedName, { color: colors.text }]}>{m.id} - <Text style={{ fontWeight: '700' }}>{m.label}</Text></Text>
                  </View>
                  <Text style={[styles.selectedMedDetail, { color: colors.mutedText }]}>{m.dosage}       {m.days} {t('days')}       {t(m.timing)}</Text>
                </View>
                <TouchableOpacity onPress={() => removeMedicine(m.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );

  // ─── STEP 3: Follow-up Recommendation ───────────────

  const followUpOptions = ['After 1 Week', 'After 2 Week', 'After Month', 'Not Required'];

  const renderStep3 = () => (
    <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }}>
      {renderPatientInfo()}
      {renderComplaints()}

      {/* Step indicator */}
      {renderStepIndicator()}

      <View style={styles.sectionPadded}>
        <Text style={[styles.diagnosisHeading, { color: colors.text }]}>{t('Does this patient required a Follow-up visit?')}</Text>
        <View style={styles.diseaseGrid}>
          {followUpOptions.map((opt) => {
            const isActive = followUp === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.diseaseBtn, { backgroundColor: colors.surface, borderColor: colors.border }, isActive && styles.diseaseBtnActive]}
                onPress={() => setFollowUp(opt)}
                activeOpacity={0.7}
              >
                <Text style={[styles.diseaseBtnText, { color: colors.text }, isActive && styles.diseaseBtnTextActive]}>{t(opt)}</Text>
                <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
                  {isActive && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );

  // ─── Bottom Button ─────────────────────────────────

  const renderBottomBar = () => {
    if (step === 1) {
      return (
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}> 
          <TouchableOpacity
            style={[styles.primaryBtn, selectedDiseases.size === 0 && !otherDiagnosis && styles.primaryBtnDisabled]}
            disabled={selectedDiseases.size === 0 && !otherDiagnosis}
            onPress={() => setStep(2)}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>{t('Next: Prescribe Medicines')}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }
    if (step === 2) {
      return (
        <View style={[styles.bottomBarRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}> 
          <TouchableOpacity style={[styles.prevBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setStep(1)} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={16} color={colors.text} />
            <Text style={[styles.prevBtnText, { color: colors.text }]}>{t('Prev')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtnFlex]}
            onPress={() => setStep(3)}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>{t('Continue to Final Step')}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={[styles.bottomBarRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}> 
        <TouchableOpacity style={[styles.prevBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setStep(2)} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={16} color={colors.text} />
          <Text style={[styles.prevBtnText, { color: colors.text }]}>{t('Prev')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryBtnFlex}
          onPress={handleMarkAsDone}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>{t('Mark as Done')}</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Render ────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('Consulting Patient')}</Text>
        <TouchableOpacity onPress={() => setHistoryOpen(true)}>
          <Ionicons name="time-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      {renderBottomBar()}
      {renderHistoryTimeline()}
    </View>
  );
};

// ─── VitalItem ───────────────────────────────────────

const VitalItem = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={styles.vitalItem}>
    <Ionicons name={icon as any} size={16} color="#2563EB" />
    <Text style={styles.vitalLabel}>{label}</Text>
    <Text style={styles.vitalValue}>{value}</Text>
  </View>
);

// ─── Styles ──────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  scroll: { flex: 1 },

  historyBackdrop: { flex: 1, backgroundColor: 'rgba(2,6,23,0.15)' },
  historySheet: { flex: 1, marginTop: 42, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  historyHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12 },
  historyTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  historyCountBadge: { minWidth: 32, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  historyCountText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  historyScroll: { flex: 1 },
  historyScrollContent: { paddingHorizontal: 12, paddingBottom: 40 },
  historyEmptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  historyEmptyText: { fontSize: 14, color: '#6B7280' },
  historyRow: { flexDirection: 'row' },
  historyRail: { width: 24, alignItems: 'center' },
  historyDotOuter: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  historyDotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2563EB' },
  historyLine: { width: 2, flex: 1, marginTop: 4 },
  historyCard: { flex: 1, borderWidth: 1, borderRadius: 16, marginBottom: 14, overflow: 'hidden' },
  historyCardDateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  historyDateText: { fontSize: 22, fontWeight: '700', color: '#111' },
  historyCardBody: { padding: 14, gap: 12 },
  historyConsultedBy: { fontSize: 15, color: '#6B7280' },
  historyConsultedByStrong: { fontWeight: '700', color: '#4B5563' },
  historySection: { paddingTop: 4, borderTopWidth: 1, borderTopColor: '#D1D5DB' },
  historySectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  historySectionTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  historyChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  historyChip: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  historyChipText: { fontSize: 13, color: '#374151' },
  historyVitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  historyVitalsItem: { width: '50%', fontSize: 15, color: '#6B7280' },
  historyVitalsStrong: { color: '#374151', fontWeight: '700' },
  historyValue: { fontSize: 15, color: '#4B5563', lineHeight: 22 },
  historyMedicineList: { gap: 8 },
  historyMedicineCard: { borderWidth: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10 },
  historyMedicineName: { fontSize: 16, fontWeight: '700', color: '#111' },
  historyMedicineMeta: { fontSize: 14, marginTop: 2, color: '#6B7280' },

  // Step indicator
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 20, backgroundColor: '#fff', marginHorizontal: 20, marginTop: 16, borderRadius: 14, marginBottom: 12 },
  stepCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { borderColor: '#2563EB', backgroundColor: '#2563EB' },
  stepNum: { fontSize: 15, fontWeight: 'bold', color: '#D1D5DB' },
  stepNumActive: { color: '#fff' },
  stepLine: { width: 40, height: 2, backgroundColor: '#D1D5DB' },
  stepLineActive: { backgroundColor: '#2563EB' },
  stepLabel: { fontSize: 11, color: '#111', fontWeight: '600', marginLeft: 6, lineHeight: 14 },

  // Patient card
  patientCard: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 16, borderRadius: 18, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  patientCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  patientCardLabel: { fontSize: 12, color: '#999', fontWeight: '500' },
  tokenBadge: { width: 32, height: 32, borderRadius: 8, borderWidth: 2, borderColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  tokenBadgeText: { fontSize: 16, fontWeight: 'bold', color: '#2563EB' },
  patientCardBody: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  patientAvatarCircle: { width: 60, height: 60, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  patientAvatarText: { fontSize: 20, fontWeight: 'bold', color: '#374151' },
  patientInfoCol: { flex: 1 },
  patientId: { fontSize: 12, color: '#999' },
  patientName: { fontSize: 17, fontWeight: 'bold', color: '#111', marginTop: 2 },
  patientMeta: { fontSize: 13, color: '#6B7280', marginTop: 2 },

  // Complaints
  complaintsCard: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 12, borderRadius: 14, padding: 16 },
  complaintsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  complaintsHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  complaintsTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  complaintsBody: { marginTop: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },

  // Section cards (vitals, allergies, notes)
  sectionCard: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 12, borderRadius: 14, padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  sectionValue: { fontSize: 14, color: '#374151', lineHeight: 20 },
  noDataText: { fontSize: 13, color: '#9CA3AF' },

  // Vitals grid
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  vitalItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '45%', marginBottom: 4 },
  vitalLabel: { fontSize: 13, color: '#6B7280' },
  vitalValue: { fontSize: 15, fontWeight: '700', color: '#111' },

  // Step 1 — Diagnosis
  sectionPadded: { paddingHorizontal: 20, paddingTop: 4 },
  diagnosisHeading: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 14 },
  diseaseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  diseaseBtn: { width: '47%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 14, borderRadius: 30, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  diseaseBtnActive: { borderColor: '#2563EB', backgroundColor: '#EEF2FF' },
  diseaseBtnText: { fontSize: 13, color: '#374151', fontWeight: '500', flex: 1 },
  diseaseBtnTextActive: { color: '#2563EB', fontWeight: '600' },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: '#2563EB', backgroundColor: '#2563EB' },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

  otherBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, padding: 14, gap: 10, marginBottom: 20 },
  otherInput: { flex: 1, fontSize: 14, color: '#111', minHeight: 60, textAlignVertical: 'top', padding: 0 },

  labTestToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', marginBottom: 16 },
  labTestTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  labTestSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },

  // Step 2 — Medicines
  searchBarMed: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginTop: 8, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, gap: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInputMed: { flex: 1, fontSize: 15, color: '#111', padding: 0 },
  selectMedTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginHorizontal: 20, marginTop: 16, marginBottom: 10 },
  categoryScroll: { marginBottom: 12 },
  categoryChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  categoryChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  categoryChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  categoryChipTextActive: { color: '#fff' },
  medList: { marginHorizontal: 20 },
  medItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12 },
  medItemActive: { backgroundColor: '#EEF2FF', borderLeftWidth: 3, borderLeftColor: '#2563EB' },
  medCheckbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center' },
  medCheckboxActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  medLabel: { flex: 1, fontSize: 15, color: '#374151', fontWeight: '500' },
  medLabelActive: { fontWeight: '700', color: '#111' },
  addNoteLink: { fontSize: 13, color: '#2563EB', fontWeight: '600' },

  medConfig: { backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  medConfigRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  medConfigLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600', width: 50 },
  dayBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  dayValue: { fontSize: 18, fontWeight: 'bold', color: '#111', minWidth: 24, textAlign: 'center' },
  optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  optionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  optionBtnActive: { borderColor: '#2563EB', backgroundColor: '#EEF2FF' },
  optionBtnText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  optionBtnTextActive: { color: '#2563EB', fontWeight: '700' },

  // Selected Medicines card (Step 2)
  selectedMedsCard: { backgroundColor: '#F9FAFB', marginHorizontal: 20, marginTop: 20, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  selectedMedsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  selectedMedsTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  selectedMedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  selectedMedInfo: { flex: 1 },
  selectedMedNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  selectedMedName: { fontSize: 14, color: '#111' },
  selectedMedDetail: { fontSize: 12, color: '#6B7280' },

  // Bottom bar
  bottomBar: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  bottomBarRow: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 12 },
  prevBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  prevBtnText: { fontSize: 15, fontWeight: '600', color: '#111' },
  primaryBtn: { backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnFlex: { flex: 1, backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default ConsultingPatient;
