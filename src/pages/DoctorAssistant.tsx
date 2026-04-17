import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePreferences } from '../lib/PreferencesContext';
import { opdService, clinicalService } from '../lib/api';

type QueuePatient = { id: string; name: string; gender: string; age: number; token: number; status?: string };

const mockComplaints = ['1.1 શરીરનો દુઃખાવો', '2.1 તાવ', '3.1 ખંજવાળ', '4.1 ચક્કર'];
const mockVitals = { temp: '98.2', pulse: '86', bpUpper: '140', bpLower: '120', spo2: '99', bloodSugar: '120' };

const diagnosisOptions = [
  { id: '5.1', label: 'Arthritis' }, { id: '5.2', label: 'Asthma' },
  { id: '5.3', label: 'Boils' }, { id: '5.4', label: 'Diarrhea' },
  { id: '5.5', label: 'Diabetes' }, { id: '5.6', label: 'Hypertension' },
  { id: '5.7', label: 'Malaria' }, { id: '5.8', label: 'Typhoid' },
];

const labTestOptions = [
  { id: '6.1', label: 'CBC' }, { id: '6.2', label: 'Urine Test' },
  { id: '6.3', label: 'Blood Sugar' }, { id: '6.4', label: 'Thyroid' },
  { id: '6.5', label: 'Lipid Profile' },
];

interface Medicine { name: string; dosage: string; days: string; }

type ViewState = 'pin' | 'queue' | 'consult';

const DoctorAssistant = () => {
  const navigation = useNavigation();
  const { t, colors } = usePreferences();
  const pinRefs = useRef<Array<TextInput | null>>([]);

  const [view, setView] = useState<ViewState>('pin');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [queue, setQueue] = useState<QueuePatient[]>([]);
  const [opdId, setOpdId] = useState('');
  const [consultDone, setConsultDone] = useState<number[]>([]);
  const [activePatient, setActivePatient] = useState<QueuePatient | null>(null);

  const [complaintsOpen, setComplaintsOpen] = useState(true);
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Set<string>>(new Set());
  const [selectedLabTests, setSelectedLabTests] = useState<Set<string>>(new Set());
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  const totalCases = queue.length;
  const completed = consultDone.length;
  const inQueue = totalCases - completed;
  const pinString = pin.join('');

  const handlePinChange = (text: string, index: number) => {
    const val = text.replace(/\D/g, '');
    const newPin = [...pin];
    newPin[index] = val;
    setPin(newPin);
    if (val && index < 5) pinRefs.current[index + 1]?.focus();
  };

  const handleJoinOPD = async () => {
    if (pinString.length !== 6) return;
    try {
      const session = await opdService.joinByPin(pinString);
      if (session) {
        setQueue(session.patients || []);
        setOpdId(session.opdId || '');
        setView('queue');
      } else {
        Alert.alert(t('Error'), t('OPD session not found'));
      }
    } catch (err: any) {
      Alert.alert(t('Error'), err.message || t('Failed to join OPD'));
    }
  };

  const handleSelectPatient = (patient: QueuePatient) => {
    setActivePatient(patient);
    setComplaintsOpen(true); setVitalsOpen(false);
    setSelectedDiagnosis(new Set()); setSelectedLabTests(new Set());
    setMedicines([]);
    setView('consult');
  };

  const toggleDiagnosis = (id: string) => {
    setSelectedDiagnosis((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleLabTest = (id: string) => {
    setSelectedLabTests((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const addMedicine = () => setMedicines((prev) => [...prev, { name: '', dosage: '1-0-1', days: '3' }]);
  const updateMedicine = (i: number, field: keyof Medicine, value: string) => {
    setMedicines((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };
  const removeMedicine = (i: number) => setMedicines((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmitConsult = async () => {
    if (activePatient) {
      try {
        const diagnosisList = Array.from(selectedDiagnosis).map((id) => {
          const d = diagnosisOptions.find((x) => x.id === id);
          return d ? `${d.id} ${d.label}` : id;
        });
        const labTestList = Array.from(selectedLabTests).map((id) => {
          const lt = labTestOptions.find((x) => x.id === id);
          return lt ? `${lt.id} ${lt.label}` : id;
        });

        await clinicalService.recordConsult(activePatient.id, {
          diagnosis: diagnosisList,
          lab_tests: labTestList,
          doctor_notes: '',
        });

        if (medicines.length > 0) {
          await clinicalService.dispenseMedicine(activePatient.id, medicines);
        }

        setConsultDone((prev) => [...prev, activePatient.token]);
        Alert.alert(t('Consultation Complete'), `${activePatient.name} ${t('consultation submitted successfully.')}`);
        setActivePatient(null);
        setView('queue');
      } catch (err: any) {
        Alert.alert(t('Error'), err.message || t('Failed to submit consultation'));
      }
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
          <TouchableOpacity style={[s.primaryBtn, pinString.length < 6 && s.primaryBtnDisabled]} disabled={pinString.length < 6} onPress={handleJoinOPD} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>{t('Join OPD')}</Text><Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={s.noteRow}><View style={s.noteLine} /><Text style={s.noteLabel}>{t('Note')}</Text><View style={s.noteLine} /></View>
          <Text style={s.noteText}>{t('Ask your Registration Desk teammate to share 6 digit PIN with you')}</Text>
        </View>
      </View>
    );
  }

  // Consult Screen
  if (view === 'consult' && activePatient) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}> 
        <View style={s.blueHeader}>
          <Text style={s.blueHeaderTitle}>{t('Consulting Patient')}</Text>
          <TouchableOpacity onPress={() => setView('queue')}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
        </View>

        {/* Patient Info */}
        <View style={s.patientCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.smallLabel}>Patient Info.</Text>
            <Text style={s.smallLabel}>{activePatient.id}</Text>
            <Text style={s.patientName}>{activePatient.name}</Text>
            <Text style={s.patientSub}>{activePatient.gender} • {activePatient.age} Yrs</Text>
          </View>
          <View style={s.tokenBadge}><Text style={s.tokenBadgeText}>{activePatient.token}</Text></View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20 }}>
          {/* Complaints */}
          <TouchableOpacity style={s.collapsible} onPress={() => setComplaintsOpen(!complaintsOpen)}>
            <View style={s.collLeft}><Ionicons name="document-text-outline" size={18} color="#2563EB" /><Text style={s.collTitle}>{t('Patient Complaints')}</Text></View>
            <Ionicons name={complaintsOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#2563EB" />
          </TouchableOpacity>
          {complaintsOpen && (
            <View style={s.tagsRow}>
              {mockComplaints.map((c) => (<View key={c} style={s.tag}><Text style={s.tagText}>{c}</Text></View>))}
            </View>
          )}

          {/* Vitals */}
          <TouchableOpacity style={[s.collapsible, { marginTop: 8 }]} onPress={() => setVitalsOpen(!vitalsOpen)}>
            <View style={s.collLeft}><Ionicons name="heart-outline" size={18} color="#999" /><Text style={s.collTitle}>{t('Recorded Vitals')}</Text></View>
            <Ionicons name={vitalsOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#2563EB" />
          </TouchableOpacity>
          {vitalsOpen && (
            <View style={s.vitalsInfo}>
              <View style={s.vitalsInfoRow}>
                <Text style={s.vitalsInfoItem}>Temp. <Text style={s.bold}>{mockVitals.temp} F</Text></Text>
                <Text style={s.vitalsInfoItem}>B.S. <Text style={s.bold}>{mockVitals.bloodSugar}</Text></Text>
              </View>
              <View style={s.vitalsInfoRow}>
                <Text style={s.vitalsInfoItem}>Pulse <Text style={s.bold}>{mockVitals.pulse} bpm</Text></Text>
                <Text style={s.vitalsInfoItem}>B.P. <Text style={s.bold}>{mockVitals.bpUpper}/{mockVitals.bpLower}</Text></Text>
              </View>
              <Text style={s.vitalsInfoItem}>SPO2 <Text style={s.bold}>{mockVitals.spo2}</Text></Text>
              <View style={s.vitalsInfoDivider} />
              <Text style={s.vitalsInfoItem}>Allergies: <Text style={{ color: '#999' }}>Smoke Allergie</Text></Text>
            </View>
          )}

          {/* Notes from desks */}
          <View style={s.notesCard}>
            <View style={s.noteCardRow}>
              <Ionicons name="document-text-outline" size={16} color="#999" />
              <Text style={s.noteCardTitle}>Notes from Registration Desk</Text>
            </View>
            <Text style={s.noteCardText}>Patient felt dizziy earlier today</Text>
            <View style={s.noteCardDivider} />
            <View style={s.noteCardRow}>
              <Ionicons name="document-text-outline" size={16} color="#999" />
              <Text style={s.noteCardTitle}>Notes from Vital Desk</Text>
            </View>
            <Text style={s.noteCardText}>Patient felt dizziy earlier today</Text>
          </View>

          {/* Diagnosis */}
          <View style={s.sectionCard}>
            <View style={s.sectionCardHeader}><MaterialCommunityIcons name="stethoscope" size={18} color="#999" /><Text style={s.sectionCardTitle}>{t("Doctor's Diagnosis")}</Text></View>
            <View style={s.tagsRow}>
              {diagnosisOptions.map((d) => (
                <TouchableOpacity key={d.id} style={[s.selectTag, selectedDiagnosis.has(d.id) && s.selectTagActive]} onPress={() => toggleDiagnosis(d.id)}>
                  <Text style={[s.selectTagText, selectedDiagnosis.has(d.id) && s.selectTagTextActive]}>{d.id} {d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={s.noteCardDivider} />
            <View style={s.sectionCardHeader}><Ionicons name="document-text-outline" size={18} color="#999" /><Text style={s.sectionCardTitle}>{t('Labtest Investigation')}</Text></View>
            <View style={s.tagsRow}>
              {labTestOptions.map((t) => (
                <TouchableOpacity key={t.id} style={[s.selectTag, selectedLabTests.has(t.id) && s.selectTagActive]} onPress={() => toggleLabTest(t.id)}>
                  <Text style={[s.selectTagText, selectedLabTests.has(t.id) && s.selectTagTextActive]}>{t.id} {t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Medicines */}
          <View style={s.sectionCard}>
            <View style={s.sectionCardHeader}>
              <MaterialCommunityIcons name="pill" size={18} color="#999" />
              <Text style={[s.sectionCardTitle, { flex: 1 }]}>{t('Prescribed Medicines')}</Text>
              <TouchableOpacity onPress={addMedicine}><Ionicons name="add" size={22} color="#2563EB" /></TouchableOpacity>
            </View>
            {medicines.length === 0 && <Text style={s.emptyMedText}>{t('Tap + to add medicines')}</Text>}
            {medicines.map((med, i) => (
              <View key={i} style={s.medRow}>
                <MaterialCommunityIcons name="pill" size={16} color="#2563EB" />
                <TextInput style={s.medNameInput} placeholder="Medicine name" placeholderTextColor="#ccc" value={med.name} onChangeText={(v) => updateMedicine(i, 'name', v)} maxLength={100} />
                <TextInput style={s.medSmallInput} placeholder="1-0-1" placeholderTextColor="#ccc" value={med.dosage} onChangeText={(v) => updateMedicine(i, 'dosage', v)} maxLength={10} textAlign="center" />
                <TextInput style={s.medSmallInput} placeholder="3" placeholderTextColor="#ccc" value={med.days} onChangeText={(v) => updateMedicine(i, 'days', v)} maxLength={5} textAlign="center" />
                <Text style={s.medDaysLabel}>days</Text>
                <TouchableOpacity onPress={() => removeMedicine(i)}><Ionicons name="trash-outline" size={16} color="#EF4444" /></TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={s.bottomBar}>
          <TouchableOpacity style={s.primaryBtn} onPress={handleSubmitConsult} activeOpacity={0.85}>
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={s.primaryBtnText}>{t('Complete & Take Next Patient')}</Text>
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
          <Text style={{ fontSize: 13, color: '#999', marginTop: 2 }}>{opdId}</Text>
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
          {queue.map((p) => {
            const done = consultDone.includes(p.token);
            return (
              <TouchableOpacity key={p.token} style={[s.queueItem, done && { opacity: 0.5 }]} onPress={() => !done && handleSelectPatient(p)} disabled={done}>
                <View style={s.queueToken}><Text style={s.queueTokenText}>{p.token}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.queueName}>{p.name}</Text>
                  <Text style={s.queueSub}>{p.id} • {p.gender} • {p.age} Yrs</Text>
                </View>
                {done ? (
                  <View style={s.doneBadge}><Text style={s.doneBadgeText}>Done</Text></View>
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
  emptyMedText: { fontSize: 13, color: '#999', textAlign: 'center', paddingVertical: 12 },
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
