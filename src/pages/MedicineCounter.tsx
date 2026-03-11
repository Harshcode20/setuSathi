import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const mockQueue = [
  { id: 'P1234', name: 'Dharamshinhbhai Prajapati', gender: 'Male', age: 58, token: 1 },
  { id: 'P1235', name: 'Manguben Solanki', gender: 'Female', age: 58, token: 2 },
  { id: 'P1236', name: 'Ramilaben Thakor', gender: 'Female', age: 58, token: 3 },
  { id: 'P1237', name: 'Ramilaben Thakor', gender: 'Female', age: 58, token: 4 },
  { id: 'P1238', name: 'Ramilaben Thakor', gender: 'Female', age: 58, token: 5 },
  { id: 'P1239', name: 'Ramilaben Thakor', gender: 'Female', age: 58, token: 6 },
];

const mockComplaints = ['1.1 શરીરનો દુઃખાવો', '2.1 તાવ', '3.1 ખંજવાળ', '4.1 ચક્કર'];
const mockVitals = { temp: '98.2', pulse: '86', bpUpper: '140', bpLower: '120', spo2: '99', bloodSugar: '120' };
const mockMedicines = [
  { id: '6.2', name: 'T. Citra', dosage: '1-0-1', days: '3' },
  { id: '6.7', name: 'T. Cip Z', dosage: '0-1-0', days: '3' },
  { id: '6.9', name: 'T. Losartan', dosage: '1-0-1', days: '3' },
  { id: '6.13', name: 'Calcium Tab', dosage: '1-0-1', days: '3' },
];
const mockDoctorNotes = ['Take tablet T. Para only if fever goes above 99°F.', 'Revisit after 3 days'];

type ViewState = 'pin' | 'queue' | 'prescription';

const MedicineCounter = () => {
  const navigation = useNavigation();
  const pinRefs = useRef<Array<TextInput | null>>([]);

  const [view, setView] = useState<ViewState>('pin');
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [givenDone, setGivenDone] = useState<number[]>([]);
  const [activePatient, setActivePatient] = useState<typeof mockQueue[0] | null>(null);

  const [complaintsOpen, setComplaintsOpen] = useState(true);
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [checkedMeds, setCheckedMeds] = useState<Set<string>>(new Set());

  const opdId = 'OPD-RAMAGRI-250622';
  const totalCases = mockQueue.length;
  const completed = givenDone.length;
  const inQueue = totalCases - completed;
  const pinString = pin.join('');

  const handlePinChange = (text: string, index: number) => {
    const val = text.replace(/\D/g, '');
    const newPin = [...pin];
    newPin[index] = val;
    setPin(newPin);
    if (val && index < 5) pinRefs.current[index + 1]?.focus();
  };

  const handleJoinOPD = () => { if (pinString.length === 6) setView('queue'); };

  const handleSelectPatient = (patient: typeof mockQueue[0]) => {
    setActivePatient(patient);
    setComplaintsOpen(true); setVitalsOpen(false);
    setCheckedMeds(new Set());
    setView('prescription');
  };

  const toggleMed = (id: string) => {
    setCheckedMeds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleMarkDone = () => {
    if (activePatient) {
      setGivenDone((prev) => [...prev, activePatient.token]);
      Alert.alert('Medicines Given', `${activePatient.name} medicines dispensed successfully.`);
      setActivePatient(null);
      setView('queue');
    }
  };

  // PIN Entry
  if (view === 'pin') {
    return (
      <View style={s.root}>
        <View style={s.simpleHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={s.simpleHeaderTitle}>Medicine Counter</Text>
        </View>
        <View style={s.pinCenter}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
          <Text style={s.pinTitle}>Enter OPD Code to Join</Text>
          <Text style={s.pinSub}><Text style={{ fontWeight: '600' }}>Registration desk</Text> has already started the OPD session. Please enter the 6-digit PIN to begin.</Text>
          <View style={s.pinRow}>
            {pin.map((digit, i) => (
              <TextInput key={i} ref={(ref) => { pinRefs.current[i] = ref; }} style={s.pinInput} value={digit}
                onChangeText={(t) => handlePinChange(t, i)} keyboardType="number-pad" maxLength={1} textAlign="center" />
            ))}
          </View>
        </View>
        <View style={s.bottomBar}>
          <TouchableOpacity style={[s.primaryBtn, pinString.length < 6 && s.primaryBtnDisabled]} disabled={pinString.length < 6} onPress={handleJoinOPD} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>Join OPD</Text><Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={s.noteRow}><View style={s.noteLine} /><Text style={s.noteLabel}>Note</Text><View style={s.noteLine} /></View>
          <Text style={s.noteText}>Ask your Registration Desk teammate to share 6 digit PIN with you</Text>
        </View>
      </View>
    );
  }

  // Prescription Screen
  if (view === 'prescription' && activePatient) {
    const allChecked = checkedMeds.size === mockMedicines.length;
    return (
      <View style={s.root}>
        <View style={s.blueHeader}>
          <Text style={s.blueHeaderTitle}>Patient Prescription</Text>
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
            <View style={s.collLeft}><Ionicons name="document-text-outline" size={18} color="#2563EB" /><Text style={s.collTitle}>Patient Complaints</Text></View>
            <Ionicons name={complaintsOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#2563EB" />
          </TouchableOpacity>
          {complaintsOpen && (
            <View style={s.tagsRow}>
              {mockComplaints.map((c) => (<View key={c} style={s.tag}><Text style={s.tagText}>{c}</Text></View>))}
            </View>
          )}

          {/* Vitals */}
          <TouchableOpacity style={[s.collapsible, { marginTop: 8 }]} onPress={() => setVitalsOpen(!vitalsOpen)}>
            <View style={s.collLeft}><Ionicons name="heart-outline" size={18} color="#999" /><Text style={s.collTitle}>Recorded Vitals</Text></View>
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
              <View style={s.divider} />
              <Text style={s.vitalsInfoItem}>Allergies: <Text style={{ color: '#999' }}>Smoke Allergie</Text></Text>
            </View>
          )}

          {/* Notes from desks */}
          <View style={s.notesCard}>
            <View style={s.noteCardRow}><Ionicons name="document-text-outline" size={16} color="#999" /><Text style={s.noteCardTitle}>Notes from Registration Desk</Text></View>
            <Text style={s.noteCardContent}>Patient felt dizziy earlier today</Text>
            <View style={s.divider} />
            <View style={s.noteCardRow}><Ionicons name="document-text-outline" size={16} color="#999" /><Text style={s.noteCardTitle}>Notes from Vital Desk</Text></View>
            <Text style={s.noteCardContent}>Patient felt dizziy earlier today</Text>
          </View>

          {/* Prescribed Medicines Checklist */}
          <View style={{ marginTop: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#111' }}>Prescribed Medicines</Text>
              <View style={s.medCountBadge}><Text style={s.medCountText}>{mockMedicines.length}</Text></View>
            </View>

            {/* Table header */}
            <View style={s.tableHeader}>
              <Text style={[s.tableHeaderText, { flex: 1 }]}>Medicine Name</Text>
              <Text style={[s.tableHeaderText, { width: 80, textAlign: 'center' }]}>Dosage</Text>
              <Text style={[s.tableHeaderText, { width: 40 }]} />
            </View>

            {mockMedicines.map((med) => (
              <View key={med.id} style={s.medItem}>
                <View style={{ flex: 1 }}>
                  <Text style={s.medName}>({med.id}) {med.name}</Text>
                </View>
                <Text style={s.medDosage}>{med.dosage}</Text>
                <Text style={s.medDays}>{med.days} Days</Text>
                <TouchableOpacity style={[s.medCheck, checkedMeds.has(med.id) && s.medCheckActive]} onPress={() => toggleMed(med.id)}>
                  {checkedMeds.has(med.id) && <Ionicons name="checkmark" size={16} color="#fff" />}
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Doctor Notes */}
          <View style={s.notesCard}>
            <View style={s.noteCardRow}><MaterialCommunityIcons name="stethoscope" size={18} color="#999" /><Text style={{ fontSize: 15, fontWeight: 'bold', color: '#111' }}>Notes from Doctor</Text></View>
            {mockDoctorNotes.map((note, i) => (
              <Text key={i} style={s.doctorNoteItem}>• {note}</Text>
            ))}
          </View>
        </ScrollView>

        <View style={s.bottomBar}>
          <TouchableOpacity style={[s.primaryBtn, !allChecked && s.primaryBtnDisabled]} disabled={!allChecked} onPress={handleMarkDone} activeOpacity={0.85}>
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={s.primaryBtnText}>Mark as Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Queue Screen
  return (
    <View style={s.root}>
      <View style={s.simpleHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111' }}>Medicine Counter</Text>
          <Text style={{ fontSize: 13, color: '#999', marginTop: 2 }}>{opdId}</Text>
        </View>
        <TouchableOpacity><Ionicons name="ellipsis-vertical" size={20} color="#999" /></TouchableOpacity>
      </View>

      {/* Teal Banner */}
      <View style={s.bannerContainer}>
        <View style={[s.banner, { backgroundColor: '#0D9488' }]}>
          <View style={s.bannerTop}>
            <View style={s.bannerTopLeft}>
              <View style={[s.pulseDot, { backgroundColor: '#5EEAD4' }]} />
              <Text style={s.bannerLabel}>Ready for Medicines</Text>
            </View>
            <View style={s.bannerBadge}>
              <Text style={[s.bannerBadgeNum, { color: '#0F766E' }]}>{inQueue} </Text>
              <Text style={[s.bannerBadgeLabel, { color: '#0F766E' }]}>In Queue</Text>
            </View>
          </View>
          <View style={s.bannerStats}>
            <View style={s.bannerStat}><View style={[s.bannerBar, { backgroundColor: 'rgba(255,255,255,0.4)' }]} /><View><Text style={s.bannerStatNum}>{totalCases}</Text><Text style={s.bannerStatLabel}>Todays Total Case</Text></View></View>
            <View style={s.bannerStat}><View style={[s.bannerBar, { backgroundColor: '#5EEAD4' }]} /><View><Text style={s.bannerStatNum}>{completed}</Text><Text style={s.bannerStatLabel}>Medicines Given</Text></View></View>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        <View style={s.queueList}>
          {mockQueue.map((p) => {
            const done = givenDone.includes(p.token);
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
  bold: { fontWeight: '600', color: '#111' },
  divider: { height: 1, backgroundColor: '#e5e5e5', marginVertical: 8 },
  notesCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  noteCardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  noteCardTitle: { fontSize: 13, fontWeight: '600', color: '#111' },
  noteCardContent: { fontSize: 13, color: '#999', paddingLeft: 24, marginBottom: 4 },
  medCountBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  medCountText: { fontSize: 11, fontWeight: '600', color: '#999' },
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  tableHeaderText: { fontSize: 11, color: '#999' },
  medItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  medName: { fontSize: 13, fontWeight: 'bold', color: '#111' },
  medDosage: { width: 40, textAlign: 'center', fontSize: 13, color: '#111' },
  medDays: { width: 56, textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#111' },
  medCheck: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  medCheckActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  doctorNoteItem: { fontSize: 13, color: '#999', marginTop: 4, paddingLeft: 8 },
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

export default MedicineCounter;
