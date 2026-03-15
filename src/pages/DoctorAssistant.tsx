import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { clinicalService, opdService, QueueStatus } from '../lib/api';
import { usePreferences } from '../lib/PreferencesContext';

type QueuePatient = {
  id: string;
  name: string;
  gender: string;
  age: number;
  token: number;
  queueStatus?: QueueStatus;
  complaints?: string[];
  vitals?: {
    temp?: string;
    pulse?: string;
    bpUpper?: string;
    bpLower?: string;
    spo2?: string;
    bloodSugar?: string;
  };
  allergies?: string;
  registrationNotes?: string;
  vitalsNotes?: string;
};

type HistoryVitals = {
  temp?: string;
  pulse?: string;
  bp?: string;
  bs?: string;
  spo2?: string;
};

type HistoryMedicine = {
  id?: string;
  name?: string;
  dosage?: string;
  days?: string | number;
  timing?: string;
};

type PatientHistoryEntry = {
  id: string;
  date: string;
  consulted_by?: string;
  complaints?: string[];
  vitals?: HistoryVitals | null;
  allergies?: string | null;
  registration_notes?: string | null;
  vitals_notes?: string | null;
  diagnosis?: string[];
  lab_tests?: string[];
  medicines?: HistoryMedicine[];
};

type ViewState = 'pin' | 'queue' | 'consult';

const DoctorAssistant = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t, colors } = usePreferences();
  const pinRefs = useRef<Array<TextInput | null>>([]);
  const presetPin = typeof (route.params as any)?.pin === 'string' ? (route.params as any).pin : '';
  const presetOpdId = typeof (route.params as any)?.opdId === 'string' ? (route.params as any).opdId : '';
  const defaultPin = presetPin.length === 6 ? presetPin.split('') : ['', '', '', '', '', ''];

  const [view, setView] = useState<ViewState>('pin');
  const [pin, setPin] = useState<string[]>(defaultPin);
  const [activePatient, setActivePatient] = useState<QueuePatient | null>(null);
  const [patientHistory, setPatientHistory] = useState<PatientHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [queuePatients, setQueuePatients] = useState<QueuePatient[]>([]);
  const [sessionPin, setSessionPin] = useState<string>(presetPin);
  const [opdId, setOpdId] = useState<string>(presetOpdId);
  const [joining, setJoining] = useState(false);

  const [complaintsOpen, setComplaintsOpen] = useState(true);
  const [vitalsOpen, setVitalsOpen] = useState(false);

  const doctorVisiblePatients = queuePatients.filter((patient) => {
    const status = patient.queueStatus || 'waiting_vitals';
    return status === 'waiting_doctor' || status === 'consult_done' || status === 'completed';
  });
  const totalCases = doctorVisiblePatients.length;
  const completed = doctorVisiblePatients.filter((patient) => {
    const status = patient.queueStatus || 'waiting_vitals';
    return status === 'consult_done' || status === 'completed';
  }).length;
  const inQueue = doctorVisiblePatients.filter((patient) => (patient.queueStatus || 'waiting_vitals') === 'waiting_doctor').length;
  const pinString = pin.join('');

  const handlePinChange = (text: string, index: number) => {
    const val = text.replace(/\D/g, '');
    const newPin = [...pin];
    newPin[index] = val;
    setPin(newPin);
    if (val && index < 5) pinRefs.current[index + 1]?.focus();
  };

  const joinOpdSession = async (pinValue: string) => {
    setJoining(true);
    try {
      const session = await opdService.joinByPin(pinValue);
      if (!session) {
        Alert.alert(t('Invalid PIN'), t('No active OPD session found for this PIN.'));
        return;
      }

      setSessionPin(session.pin);
      setOpdId(session.opdId);
      setQueuePatients(session.patients || []);
      setView('queue');
    } catch (err: any) {
      Alert.alert(t('Unable to Join'), err?.message || t('Could not join OPD session.'));
    } finally {
      setJoining(false);
    }
  };

  const handleJoinOPD = () => {
    if (pinString.length === 6) {
      joinOpdSession(pinString);
    }
  };

  useEffect(() => {
    if (presetPin.length === 6) {
      joinOpdSession(presetPin);
    }
  }, [presetPin]);

  useEffect(() => {
    if (!sessionPin || view === 'pin') return;

    let mounted = true;

    const refreshQueue = async () => {
      try {
        const session = await opdService.joinByPin(sessionPin);
        if (mounted && session) {
          setQueuePatients(session.patients || []);
          setOpdId(session.opdId);
        }
      } catch (err) {
        if (mounted) {
          console.warn('Failed to refresh doctor queue:', err);
        }
      }
    };

    refreshQueue();
    const timer = setInterval(refreshQueue, 3000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [sessionPin, view]);

  const getPatientNumericId = (patientRef: string) => {
    const parsed = Number(String(patientRef).replace(/\D/g, ''));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const closeDetails = () => {
    setView('queue');
    setActivePatient(null);
    setPatientHistory([]);
    setHistoryError('');
    setHistoryLoading(false);
  };

  const handleSelectPatient = async (patient: QueuePatient) => {
    setActivePatient(patient);
    setPatientHistory([]);
    setHistoryError('');
    setComplaintsOpen(true);
    setVitalsOpen(false);
    setView('consult');
    const patientId = getPatientNumericId(patient.id);
    if (!patientId) {
      setHistoryError(t('Unable to identify patient for loading history.'));
      return;
    }

    setHistoryLoading(true);
    try {
      const history = await clinicalService.getPatientHistory(String(patientId)) as PatientHistoryEntry[];
      setPatientHistory(Array.isArray(history) ? history : []);
    } catch (err: any) {
      setHistoryError(err?.message || t('Could not load patient history.'));
    } finally {
      setHistoryLoading(false);
    }
  };

  // PIN Entry
  if (view === 'pin') {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}> 
        <View style={s.simpleHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={s.simpleHeaderTitle}>{t("Doctor's Assistant")}</Text>
        </View>
        <View style={s.pinCenter}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
          <Text style={s.pinTitle}>{t('Enter OPD Code to Join')}</Text>
          <Text style={s.pinSub}><Text style={{ fontWeight: '600' }}>{t('Registration desk')}</Text> {t('has already started the OPD session. Please enter the 6-digit PIN to begin.')}</Text>
          <View style={s.pinRow}>
            {pin.map((digit, i) => (
              <TextInput key={i} ref={(ref) => { pinRefs.current[i] = ref; }} style={s.pinInput} value={digit}
                onChangeText={(t) => handlePinChange(t, i)} keyboardType="number-pad" maxLength={1} textAlign="center" />
            ))}
          </View>
        </View>
        <View style={s.bottomBar}>
          <TouchableOpacity style={[s.primaryBtn, pinString.length < 6 && s.primaryBtnDisabled]} disabled={pinString.length < 6 || joining} onPress={handleJoinOPD} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>{joining ? t('Joining...') : t('Join OPD')}</Text><Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={s.noteRow}><View style={s.noteLine} /><Text style={s.noteLabel}>{t('Note')}</Text><View style={s.noteLine} /></View>
          <Text style={s.noteText}>{t('Ask your Registration Desk teammate to share 6 digit PIN with you')}</Text>
        </View>
      </View>
    );
  }

  // Consult Screen (read-only)
  if (view === 'consult' && activePatient) {
    const latestEntry = patientHistory.length > 0 ? patientHistory[0] : null;
    const complaints = (latestEntry?.complaints && latestEntry.complaints.length > 0)
      ? latestEntry.complaints
      : (activePatient.complaints || []);
    const vitals = latestEntry?.vitals || null;
    const allergies = latestEntry?.allergies || activePatient.allergies || '';
    const registrationNotes = latestEntry?.registration_notes || activePatient.registrationNotes || '';
    const vitalsNotes = latestEntry?.vitals_notes || activePatient.vitalsNotes || '';
    const diagnosisList = latestEntry?.diagnosis || [];
    const labTests = latestEntry?.lab_tests || [];
    const medicines = patientHistory.flatMap((entry) => Array.isArray(entry.medicines) ? entry.medicines : []);

    return (
      <View style={[s.root, { backgroundColor: colors.background }]}> 
        <View style={s.blueHeader}>
          <Text style={s.blueHeaderTitle}>{t("Doctor's Assistant")}</Text>
          <TouchableOpacity onPress={closeDetails}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
        </View>

        <View style={s.patientCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.smallLabel}>Patient Info.</Text>
            <Text style={s.smallLabel}>{activePatient.id}</Text>
            <Text style={s.patientName}>{activePatient.name}</Text>
            <Text style={s.patientSub}>{activePatient.gender} • {activePatient.age} Yrs</Text>
            {latestEntry?.date ? <Text style={s.smallLabel}>Last Visit: {latestEntry.date}</Text> : null}
          </View>
          <View style={s.tokenBadge}><Text style={s.tokenBadgeText}>{activePatient.token}</Text></View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 90, paddingHorizontal: 20 }}>
          {historyLoading ? (
            <View style={s.loadingWrap}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={s.loadingText}>{t('Loading patient history...')}</Text>
            </View>
          ) : null}

          {historyError ? <Text style={s.errorText}>{historyError}</Text> : null}

          <TouchableOpacity style={s.collapsible} onPress={() => setComplaintsOpen(!complaintsOpen)}>
            <View style={s.collLeft}><Ionicons name="document-text-outline" size={18} color="#2563EB" /><Text style={s.collTitle}>{t('Patient Complaints')}</Text></View>
            <Ionicons name={complaintsOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#2563EB" />
          </TouchableOpacity>
          {complaintsOpen && (
            <View style={s.tagsRow}>
              {complaints.length > 0 ? complaints.map((complaint, index) => (
                <View key={`${complaint}-${index}`} style={s.tag}><Text style={s.tagText}>{complaint}</Text></View>
              )) : <Text style={s.vitalsInfoItem}>{t('No complaints recorded')}</Text>}
            </View>
          )}

          <TouchableOpacity style={[s.collapsible, { marginTop: 8 }]} onPress={() => setVitalsOpen(!vitalsOpen)}>
            <View style={s.collLeft}><Ionicons name="heart-outline" size={18} color="#999" /><Text style={s.collTitle}>{t('Recorded Vitals')}</Text></View>
            <Ionicons name={vitalsOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#2563EB" />
          </TouchableOpacity>
          {vitalsOpen && (
            <View style={s.vitalsInfo}>
              {(vitals?.temp || vitals?.bs || vitals?.pulse || vitals?.bp || vitals?.spo2) ? (
                <>
                  <View style={s.vitalsInfoRow}>
                    <Text style={s.vitalsInfoItem}>Temp. <Text style={s.bold}>{vitals?.temp || '-'}</Text></Text>
                    <Text style={s.vitalsInfoItem}>B.S. <Text style={s.bold}>{vitals?.bs || '-'}</Text></Text>
                  </View>
                  <View style={s.vitalsInfoRow}>
                    <Text style={s.vitalsInfoItem}>Pulse <Text style={s.bold}>{vitals?.pulse || '-'}{vitals?.pulse ? ' bpm' : ''}</Text></Text>
                    <Text style={s.vitalsInfoItem}>B.P. <Text style={s.bold}>{vitals?.bp || '-'}</Text></Text>
                  </View>
                  <Text style={s.vitalsInfoItem}>SPO2 <Text style={s.bold}>{vitals?.spo2 || '-'}</Text></Text>
                </>
              ) : (
                <Text style={s.vitalsInfoItem}>{t('No vitals recorded yet')}</Text>
              )}
              <View style={s.vitalsInfoDivider} />
              <Text style={s.vitalsInfoItem}>Allergies: <Text style={{ color: '#999' }}>{allergies || t('None reported')}</Text></Text>
            </View>
          )}

          <View style={s.notesCard}>
            <View style={s.noteCardRow}>
              <Ionicons name="document-text-outline" size={16} color="#999" />
              <Text style={s.noteCardTitle}>Notes from Registration Desk</Text>
            </View>
            <Text style={s.noteCardText}>{registrationNotes || t('No notes')}</Text>
            <View style={s.noteCardDivider} />
            <View style={s.noteCardRow}>
              <Ionicons name="document-text-outline" size={16} color="#999" />
              <Text style={s.noteCardTitle}>Notes from Vital Desk</Text>
            </View>
            <Text style={s.noteCardText}>{vitalsNotes || t('No notes')}</Text>
          </View>

          <View style={s.sectionCard}>
            <View style={s.sectionCardHeader}><MaterialCommunityIcons name="stethoscope" size={18} color="#999" /><Text style={s.sectionCardTitle}>{t("Doctor's Diagnosis")}</Text></View>
            <View style={s.tagsRow}>
              {diagnosisList.length > 0 ? diagnosisList.map((item, index) => (
                <View key={`${item}-${index}`} style={s.tag}><Text style={s.tagText}>{item}</Text></View>
              )) : <Text style={s.emptyMedText}>{t('No diagnosis recorded')}</Text>}
            </View>

            <View style={s.noteCardDivider} />
            <View style={s.sectionCardHeader}><Ionicons name="document-text-outline" size={18} color="#999" /><Text style={s.sectionCardTitle}>{t('Labtest Investigation')}</Text></View>
            <View style={s.tagsRow}>
              {labTests.length > 0 ? labTests.map((item, index) => (
                <View key={`${item}-${index}`} style={s.tag}><Text style={s.tagText}>{item}</Text></View>
              )) : <Text style={s.emptyMedText}>{t('No lab tests recorded')}</Text>}
            </View>
          </View>

          <View style={s.sectionCard}>
            <View style={s.sectionCardHeader}>
              <MaterialCommunityIcons name="pill" size={18} color="#999" />
              <Text style={[s.sectionCardTitle, { flex: 1 }]}>{t('Prescribed Medicines')}</Text>
            </View>
            {medicines.length === 0 ? (
              <Text style={s.emptyMedText}>{t('No prescribed medicines found in patient history')}</Text>
            ) : medicines.map((med, index) => (
              <View key={`${med.id || 'med'}-${med.name || 'name'}-${index}`} style={s.medHistoryRow}>
                <MaterialCommunityIcons name="pill" size={16} color="#2563EB" />
                <View style={{ flex: 1 }}>
                  <Text style={s.medHistoryName}>{`${med.id || ''} ${med.name || ''}`.trim() || t('Unnamed medicine')}</Text>
                  <Text style={s.medHistoryMeta}>{`${med.dosage || '-'} • ${med.days ?? '-'} ${t('days')} • ${med.timing || '-'}`}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={s.bottomBar}>
          <TouchableOpacity style={s.primaryBtn} onPress={closeDetails} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={18} color="#fff" />
            <Text style={s.primaryBtnText}>{t('Back to Queue')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Queue Screen
  return (
    <View style={[s.root, { backgroundColor: colors.background }]}> 
      <View style={s.simpleHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111' }}>{t("Doctor's Assistant")}</Text>
          <Text style={{ fontSize: 13, color: '#999', marginTop: 2 }}>{opdId || 'OPD-UNKNOWN'}</Text>
        </View>
        <TouchableOpacity><Ionicons name="ellipsis-vertical" size={20} color="#999" /></TouchableOpacity>
      </View>

      {/* Green Banner */}
      <View style={s.bannerContainer}>
        <View style={[s.banner, { backgroundColor: '#65A30D' }]}>
          <View style={s.bannerTop}>
            <View style={s.bannerTopLeft}>
              <View style={[s.pulseDot, { backgroundColor: '#BEF264' }]} />
              <Text style={s.bannerLabel}>{t('Ready for Doctor')}</Text>
            </View>
            <View style={s.bannerBadge}>
              <Text style={[s.bannerBadgeNum, { color: '#4D7C0F' }]}>{inQueue} </Text>
              <Text style={[s.bannerBadgeLabel, { color: '#4D7C0F' }]}>{t('In Queue')}</Text>
            </View>
          </View>
          <View style={s.bannerStats}>
            <View style={s.bannerStat}><View style={[s.bannerBar, { backgroundColor: 'rgba(255,255,255,0.4)' }]} /><View><Text style={s.bannerStatNum}>{totalCases}</Text><Text style={s.bannerStatLabel}>{t('Todays Total Case')}</Text></View></View>
            <View style={s.bannerStat}><View style={[s.bannerBar, { backgroundColor: '#BEF264' }]} /><View><Text style={s.bannerStatNum}>{completed}</Text><Text style={s.bannerStatLabel}>{t('Consult Done')}</Text></View></View>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        <View style={s.queueList}>
          {doctorVisiblePatients.map((p) => {
            const status = p.queueStatus || 'waiting_vitals';
            const done = status === 'consult_done' || status === 'completed';
            return (
              <TouchableOpacity key={p.token} style={[s.queueItem, done && { opacity: 0.5 }]} onPress={() => !done && handleSelectPatient(p)} disabled={done}>
                <View style={s.queueToken}><Text style={s.queueTokenText}>{p.token}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.queueName}>{p.name}</Text>
                  <Text style={s.queueSub}>{p.id} • {p.gender} • {p.age} Yrs</Text>
                </View>
                {done ? (
                  <View style={s.doneBadge}><Text style={s.doneBadgeText}>{t('Done')}</Text></View>
                ) : (
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5', overflow: 'hidden' as any },
  simpleHeader: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  simpleHeaderTitle: { fontSize: 20, fontWeight: 'bold', color: '#111', marginLeft: 12 },
  blueHeader: { backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
  blueHeaderTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  pinCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  pinTitle: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  pinSub: { fontSize: 13, color: '#999', textAlign: 'center', marginBottom: 32 },
  pinRow: { flexDirection: 'row', gap: 10 },
  pinInput: { width: 48, height: 56, borderWidth: 2, borderColor: '#e5e5e5', borderRadius: 14, fontSize: 20, fontWeight: 'bold', color: '#111', backgroundColor: 'rgba(0,0,0,0.03)' },
  bottomBar: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  primaryBtn: { backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  noteRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 4 },
  noteLine: { flex: 1, height: 1, backgroundColor: '#e5e5e5' },
  noteLabel: { marginHorizontal: 12, fontSize: 12, color: '#999' },
  noteText: { fontSize: 13, color: '#999', textAlign: 'center' },
  patientCard: { marginHorizontal: 20, marginTop: 16, backgroundColor: '#fff', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  smallLabel: { fontSize: 11, color: '#999' },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#111', marginTop: 2 },
  patientSub: { fontSize: 13, color: '#999', marginTop: 2 },
  tokenBadge: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e5e5', alignItems: 'center', justifyContent: 'center' },
  tokenBadgeText: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  collapsible: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  collLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  collTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 10 },
  tag: { backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontSize: 13, color: '#111' },
  vitalsInfo: { paddingVertical: 12 },
  vitalsInfoRow: { flexDirection: 'row', marginBottom: 8 },
  vitalsInfoItem: { flex: 1, fontSize: 13, color: '#999' },
  vitalsInfoDivider: { height: 1, backgroundColor: '#e5e5e5', marginVertical: 8 },
  bold: { fontWeight: '600', color: '#111' },
  notesCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  noteCardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  noteCardTitle: { fontSize: 13, fontWeight: '600', color: '#111' },
  noteCardText: { fontSize: 13, color: '#999', paddingLeft: 24, marginBottom: 4 },
  noteCardDivider: { height: 1, backgroundColor: '#e5e5e5', marginVertical: 12 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  sectionCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionCardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  selectTag: { backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  selectTagActive: { backgroundColor: '#2563EB' },
  selectTagText: { fontSize: 13, color: '#111', fontWeight: '500' },
  selectTagTextActive: { color: '#fff' },
  loadingWrap: { backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 12, marginBottom: 8 },
  loadingText: { fontSize: 13, color: '#2563EB', marginTop: 8 },
  errorText: { fontSize: 13, color: '#DC2626', marginTop: 8, marginBottom: 4 },
  emptyMedText: { fontSize: 13, color: '#999', textAlign: 'center', paddingVertical: 12 },
  medHistoryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  medHistoryName: { fontSize: 13, fontWeight: '600', color: '#111' },
  medHistoryMeta: { fontSize: 12, color: '#999', marginTop: 2 },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  medNameInput: { flex: 1, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, fontSize: 13, color: '#111' },
  medSmallInput: { width: 50, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 6, fontSize: 13, color: '#111' },
  medDaysLabel: { fontSize: 11, color: '#999' },
  bannerContainer: { paddingHorizontal: 20, paddingTop: 20 },
  banner: { borderRadius: 14, padding: 16 },
  bannerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bannerTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: { width: 10, height: 10, borderRadius: 5 },
  bannerLabel: { color: '#fff', fontWeight: '600', fontSize: 15 },
  bannerBadge: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' },
  bannerBadgeNum: { fontWeight: 'bold', fontSize: 14 },
  bannerBadgeLabel: { fontSize: 11 },
  bannerStats: { flexDirection: 'row' },
  bannerStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerBar: { width: 3, height: 32, borderRadius: 2 },
  bannerStatNum: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  bannerStatLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  queueList: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, marginBottom: 20 },
  queueItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12 },
  queueToken: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e5e5', alignItems: 'center', justifyContent: 'center' },
  queueTokenText: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  queueName: { fontSize: 15, fontWeight: '600', color: '#111' },
  queueSub: { fontSize: 12, color: '#999', marginTop: 2 },
  doneBadge: { backgroundColor: '#F0FDF4', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  doneBadgeText: { fontSize: 11, fontWeight: '500', color: '#16A34A' },
});

export default DoctorAssistant;
