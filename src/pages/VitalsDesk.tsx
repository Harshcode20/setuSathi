import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { clinicalService, opdService, QueueStatus } from '../lib/api';
import { usePreferences } from '../lib/PreferencesContext';

type QueuePatient = {
  id: string;
  name: string;
  gender: string;
  age: number;
  token: number;
  queueStatus?: QueueStatus;
};

type ViewState = 'pin' | 'queue' | 'record';

const VitalsDesk = () => {
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
  const [queuePatients, setQueuePatients] = useState<QueuePatient[]>([]);
  const [sessionPin, setSessionPin] = useState<string>(presetPin);
  const [opdId, setOpdId] = useState<string>(presetOpdId);
  const [joining, setJoining] = useState(false);
  const [complaintsOpen, setComplaintsOpen] = useState(false);

  // Vitals form
  const [bodyTemp, setBodyTemp] = useState('');
  const [pulse, setPulse] = useState('');
  const [bpUpper, setBpUpper] = useState('');
  const [bpLower, setBpLower] = useState('');
  const [spo2, setSpo2] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [allergies, setAllergies] = useState('');
  const [notes, setNotes] = useState('');

  const totalCases = queuePatients.length;
  const vitalsCompleted = queuePatients.filter((patient) => (patient.queueStatus || 'waiting_vitals') !== 'waiting_vitals').length;
  const vitalsQueuePatients = queuePatients.filter((patient) => (patient.queueStatus || 'waiting_vitals') === 'waiting_vitals');
  const inQueue = vitalsQueuePatients.length;

  const pinString = pin.join('');

  const handlePinChange = (text: string, index: number) => {
    const val = text.replace(/\D/g, '');
    const newPin = [...pin];
    newPin[index] = val;
    setPin(newPin);
    if (val && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
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
          console.warn('Failed to refresh vitals queue:', err);
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

  const handleSelectPatient = (patient: QueuePatient) => {
    setActivePatient(patient);
    setBodyTemp(''); setPulse(''); setBpUpper(''); setBpLower('');
    setSpo2(''); setBloodSugar(''); setHeight(''); setWeight('');
    setAllergies(''); setNotes('');
    setComplaintsOpen(false);
    setView('record');
  };

  const handleComplete = async () => {
    if (!activePatient) return;

    const patientId = Number(String(activePatient.id).replace(/\D/g, ''));
    if (!Number.isFinite(patientId) || patientId <= 0) {
      Alert.alert(t('Invalid Patient'), t('Unable to identify patient for vitals submission.'));
      return;
    }

    try {
      await clinicalService.recordVitals(String(patientId), {
        temp: bodyTemp || null,
        pulse: pulse || null,
        bp: bpUpper || bpLower ? `${bpUpper || ''}/${bpLower || ''}` : null,
        spo2: spo2 || null,
        blood_sugar: bloodSugar || null,
        allergies: allergies || null,
        notes: notes || null,
      });

      let statusSynced = true;
      if (sessionPin) {
        try {
          await opdService.updatePatientQueueStatus(sessionPin, activePatient.token, 'waiting_doctor');
          setQueuePatients((prev) =>
            prev.map((patient) =>
              patient.token === activePatient.token
                ? { ...patient, queueStatus: 'waiting_doctor' }
                : patient
            )
          );
        } catch (statusErr) {
          statusSynced = false;
          console.warn('Vitals saved but queue status update failed:', statusErr);
        }
      }

      if (statusSynced) {
        Alert.alert(t('Vitals Recorded'), `${activePatient.name} ${t('vitals completed successfully.')}`);
      } else {
        Alert.alert(t('Vitals Recorded'), t('Vitals were saved, but queue sync is still pending.'));
      }
      setActivePatient(null);
      setView('queue');
    } catch (err: any) {
      Alert.alert(t('Failed to Save'), err?.message || t('Could not record vitals.'));
    }
  };

  // PIN Entry Screen
  if (view === 'pin') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.simpleHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.simpleHeaderTitle}>{t('Vitals Desk')}</Text>
        </View>

        <View style={styles.pinCenter}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🔒</Text>
          <Text style={styles.pinTitle}>{t('Enter OPD Code to Join')}</Text>
          <Text style={styles.pinSub}>
            <Text style={{ fontWeight: '600' }}>{t('Registration desk')}</Text> {t('has already started the OPD session for this location. Please enter the 6-digit PIN to begin.')}
          </Text>

          <View style={styles.pinRow}>
            {pin.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { pinRefs.current[i] = ref; }}
                style={styles.pinInput}
                value={digit}
                onChangeText={(text) => handlePinChange(text, i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.primaryBtn, pinString.length < 6 && styles.primaryBtnDisabled]}
            disabled={pinString.length < 6 || joining}
            onPress={handleJoinOPD}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>{joining ? t('Joining...') : t('Join OPD')}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={styles.noteRow}>
            <View style={styles.noteLine} />
            <Text style={styles.noteLabel}>{t('Note')}</Text>
            <View style={styles.noteLine} />
          </View>
          <Text style={styles.noteText}>{t('Ask your Registration Desk teammate to share 6 digit PIN with you')}</Text>
        </View>
      </View>
    );
  }

  // Record Vitals Screen
  if (view === 'record' && activePatient) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.blueHeader}>
          <Text style={styles.blueHeaderTitle}>{t('Record Vitals')}</Text>
          <TouchableOpacity onPress={() => setView('queue')}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Patient Info Card */}
        <View style={styles.patientCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.patientLabel}>{t('Patient Info.')}</Text>
            <Text style={styles.patientId}>{activePatient.id}</Text>
            <Text style={styles.patientName}>{activePatient.name}</Text>
            <Text style={styles.patientSub}>{activePatient.gender} • {activePatient.age} Yrs</Text>
          </View>
          <View style={styles.tokenBadge}>
            <Text style={styles.tokenBadgeText}>{activePatient.token}</Text>
          </View>
        </View>

        {/* Complaints Collapsible */}
        <TouchableOpacity style={styles.collapsible} onPress={() => setComplaintsOpen(!complaintsOpen)}>
          <View style={styles.collapsibleLeft}>
            <Ionicons name="pulse" size={18} color="#2563EB" />
            <Text style={styles.collapsibleTitle}>{t('Patient Complaints')}</Text>
          </View>
          <Ionicons name={complaintsOpen ? 'chevron-up' : 'chevron-down'} size={20} color="#2563EB" />
        </TouchableOpacity>
        {complaintsOpen && (
          <View style={styles.collapsibleBody}>
            <Text style={styles.collapsibleText}>{t('Symptoms recorded during registration will appear here.')}</Text>
          </View>
        )}

        <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} contentContainerStyle={{ paddingBottom: 100 }}>
          <Text style={styles.formSectionTitle}>{t('Vitals')}</Text>
          <View style={styles.vitalsGrid}>
            {[
              { label: 'Body temp.', icon: 'thermometer-outline' as const, value: bodyTemp, setter: setBodyTemp, placeholder: '98' },
              { label: 'Pulse (BPM)', icon: 'heart-outline' as const, value: pulse, setter: setPulse, placeholder: '86' },
              { label: 'BP Upper', icon: 'pulse-outline' as const, value: bpUpper, setter: setBpUpper, placeholder: '140' },
              { label: 'BP Lower', icon: 'pulse-outline' as const, value: bpLower, setter: setBpLower, placeholder: '120' },
              { label: 'SPO2', icon: 'cloud-outline' as const, value: spo2, setter: setSpo2, placeholder: '99' },
              { label: 'Blood Sugar', icon: 'water-outline' as const, value: bloodSugar, setter: setBloodSugar, placeholder: '120' },
            ].map((field) => (
              <View key={field.label} style={styles.vitalField}>
                <View style={styles.vitalFieldHeader}>
                  <Ionicons name={field.icon} size={16} color="#2563EB" />
                  <Text style={styles.vitalFieldLabel}>{t(field.label)}</Text>
                </View>
                <TextInput
                  style={styles.vitalFieldInput}
                  placeholder={field.placeholder}
                  placeholderTextColor="#ccc"
                  value={field.value}
                  onChangeText={field.setter}
                  keyboardType="numeric"
                />
              </View>
            ))}
          </View>

          <Text style={styles.formSectionTitle}>{t('Other Info.')}</Text>
          <View style={styles.vitalsGrid}>
            <View style={styles.vitalField}>
              <View style={styles.vitalFieldHeader}>
                <Ionicons name="resize-outline" size={16} color="#2563EB" />
                <Text style={styles.vitalFieldLabel}>{t('Height')}</Text>
              </View>
              <TextInput style={styles.vitalFieldInput} placeholder="5.6" placeholderTextColor="#ccc" value={height} onChangeText={setHeight} keyboardType="numeric" />
            </View>
            <View style={styles.vitalField}>
              <View style={styles.vitalFieldHeader}>
                <Ionicons name="square-outline" size={16} color="#2563EB" />
                <Text style={styles.vitalFieldLabel}>{t('Weight')}</Text>
              </View>
              <TextInput style={styles.vitalFieldInput} placeholder="57" placeholderTextColor="#ccc" value={weight} onChangeText={setWeight} keyboardType="numeric" />
            </View>
          </View>

          <View style={[styles.vitalField, { width: '100%', marginTop: 8 }]}>
            <View style={styles.vitalFieldHeader}>
              <Ionicons name="eye-outline" size={16} color="#2563EB" />
              <Text style={styles.vitalFieldLabel}>{t('Allergies')}</Text>
            </View>
            <TextInput style={styles.vitalFieldInput} placeholder="e.g. Dust Allergy" placeholderTextColor="#ccc" value={allergies} onChangeText={setAllergies} maxLength={200} />
          </View>

          <View style={styles.notesBox}>
            <Ionicons name="list-outline" size={18} color="#999" style={{ marginTop: 2 }} />
            <TextInput
              style={styles.notesInput}
              placeholder={t('Additional Notes')}
              placeholderTextColor="#999"
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={500}
            />
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleComplete} activeOpacity={0.85}>
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>{t('Complete & Take Next Patient')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Queue Screen
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.simpleHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.simpleHeaderTitle}>{t('Vitals Desk')}</Text>
          <Text style={styles.headerSub}>{opdId || 'OPD-UNKNOWN'}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Amber Status Banner */}
      <View style={styles.bannerContainer}>
        <View style={[styles.banner, { backgroundColor: '#F59E0B' }]}>
          <View style={styles.bannerTop}>
            <View style={styles.bannerTopLeft}>
              <View style={[styles.pulseDot, { backgroundColor: '#FDE68A' }]} />
              <Text style={styles.bannerLabel}>{t('Ready for Vitals')}</Text>
            </View>
            <View style={styles.bannerBadge}>
              <Text style={[styles.bannerBadgeNum, { color: '#D97706' }]}>{inQueue} </Text>
              <Text style={[styles.bannerBadgeText, { color: '#D97706' }]}>{t('In Queue')}</Text>
            </View>
          </View>
          <View style={styles.bannerStats}>
            <View style={styles.bannerStat}>
              <View style={[styles.bannerBar, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
              <View>
                <Text style={styles.bannerStatNum}>{totalCases}</Text>
                <Text style={styles.bannerStatLabel}>{t('Todays Total Case')}</Text>
              </View>
            </View>
            <View style={styles.bannerStat}>
              <View style={[styles.bannerBar, { backgroundColor: '#FDE68A' }]} />
              <View>
                <Text style={styles.bannerStatNum}>{vitalsCompleted}</Text>
                <Text style={styles.bannerStatLabel}>{t('Vitals Done')}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        <View style={styles.queueList}>
          {vitalsQueuePatients.map((p) => {
            return (
              <TouchableOpacity
                key={p.token}
                style={styles.queueItem}
                onPress={() => handleSelectPatient(p)}
              >
                <View style={styles.queueToken}>
                  <Text style={styles.queueTokenText}>{p.token}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.queueName}>{p.name}</Text>
                  <Text style={styles.queueSub}>{p.id} • {p.gender} • {p.age} Yrs</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5', overflow: 'hidden' as any },
  simpleHeader: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  simpleHeaderTitle: { fontSize: 20, fontWeight: 'bold', color: '#111', marginLeft: 12 },
  headerSub: { fontSize: 13, color: '#999', marginTop: 2 },
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
  patientLabel: { fontSize: 11, color: '#999' },
  patientId: { fontSize: 11, color: '#999' },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#111', marginTop: 2 },
  patientSub: { fontSize: 13, color: '#999', marginTop: 2 },
  tokenBadge: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e5e5', alignItems: 'center', justifyContent: 'center' },
  tokenBadgeText: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  collapsible: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  collapsibleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  collapsibleTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  collapsibleBody: { marginHorizontal: 20, paddingVertical: 8 },
  collapsibleText: { fontSize: 13, color: '#999' },
  formSectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#111', marginTop: 16, marginBottom: 12 },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vitalField: { width: '48%', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#e5e5e5' },
  vitalFieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  vitalFieldLabel: { fontSize: 11, color: '#999' },
  vitalFieldInput: { fontSize: 18, fontWeight: 'bold', color: '#111', padding: 0 },
  notesBox: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 14, padding: 12, gap: 8, marginTop: 16 },
  notesInput: { flex: 1, fontSize: 14, color: '#111', minHeight: 80, textAlignVertical: 'top', padding: 0 },
  bannerContainer: { paddingHorizontal: 20, paddingTop: 20 },
  banner: { borderRadius: 14, padding: 16 },
  bannerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bannerTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: { width: 10, height: 10, borderRadius: 5 },
  bannerLabel: { color: '#fff', fontWeight: '600', fontSize: 15 },
  bannerBadge: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' },
  bannerBadgeNum: { fontWeight: 'bold', fontSize: 14 },
  bannerBadgeText: { fontSize: 11 },
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

export default VitalsDesk;
