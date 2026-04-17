import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { opdService } from '../lib/api';
import { usePreferences } from '../lib/PreferencesContext';

type Patient = {
  id: string;
  name: string;
  gender: string;
  age: number;
  token: number;
};

type OPDSession = {
  opdId: string;
  pin: string;
  village: string;
  status: string;
  patients: Patient[];
};

const DoctorOPDSession = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t, colors } = usePreferences();
  const session = (route.params as any)?.session as OPDSession | undefined;

  const opdId = session?.opdId || 'OPD-UNKNOWN';
  const sessionPin = session?.pin || '';

  // Live patient list — starts with what was passed, then updated by polling
  const [patients, setPatients] = useState<Patient[]>(session?.patients || []);

  useEffect(() => {
    if (!sessionPin) return;

    let active = true;

    const poll = async () => {
      try {
        const data = await opdService.joinByPin(sessionPin);
        if (active && data) {
          setPatients(data.patients || []);
        }
      } catch (err) {
        // silently ignore polling errors
      }
    };

    // Initial fetch
    poll();
    const interval = setInterval(poll, 8000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [sessionPin]);

  const [consultDone, setConsultDone] = useState(0);
  const [toastMsg, setToastMsg] = useState('');
  const toastOpacity = useState(new Animated.Value(0))[0];

  // Show toast when returning from consultation with a completed token
  useEffect(() => {
    const completedToken = (route.params as any)?.completedToken;
    if (completedToken) {
      setConsultDone((prev) => prev + 1);
      setToastMsg(`${t('Consultation for Token')} #${completedToken} ${t('is complete.')}`);
      Animated.sequence([
        Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setToastMsg(''));
      // Clear the param so it doesn't re-trigger
      (navigation as any).setParams({ completedToken: undefined });
    }
  }, [(route.params as any)?.completedToken]);

  const totalCases = patients.length;
  const inQueue = totalCases - consultDone;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('DoctorDashboard')}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{opdId}</Text>
      </View>

      {/* Status Bar */}
      <View style={[styles.statusBar, { borderColor: colors.border }]}>
        <View style={styles.statusLeft}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{t('Ready for Doctor')}</Text>
        </View>
        <View style={[styles.queueBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.queueBadgeNum}>{inQueue}</Text>
          <Text style={[styles.queueBadgeLabel, { color: colors.mutedText }]}>{t('In Queue')}</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={[styles.statsRow, { borderColor: colors.border }]}> 
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{totalCases}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedText }]}>{t('Todays Total Case')}</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxRight, { borderLeftColor: colors.border }]}>
          <Text style={styles.statNum}>{consultDone}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedText }]}>{t('Consult Done')}</Text>
        </View>
      </View>

      {/* Upcoming Patients */}
      <View style={styles.sectionHeader}>
        <Ionicons name="list-outline" size={18} color={colors.text} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Upcoming Patients')}</Text>
      </View>

      <FlatList
        data={patients}
        keyExtractor={(item) => item.id + item.token}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.patientCard}
            activeOpacity={0.7}
            onPress={() => (navigation as any).navigate('ConsultingPatient', { patient: item })}
          >
            <View style={styles.tokenCircle}>
              <Text style={styles.tokenText}>{item.token}</Text>
            </View>
            <View style={styles.patientInfo}>
              <Text style={[styles.patientName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.patientMeta, { color: colors.mutedText }]}>
                {item.id} <Text style={styles.metaDot}>•</Text> {item.gender} <Text style={styles.metaDot}>•</Text> {item.age} Yrs
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
            <Text style={[styles.emptyText, { color: colors.mutedText }]}>{t('No patients in queue yet')}</Text>
            <Text style={[styles.emptySubtext, { color: colors.mutedText }]}>{t('Patients will appear here once the volunteer registers them')}</Text>
          </View>
        }
      />

      {/* Toast */}
      {toastMsg !== '' && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity, backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
          <Text style={[styles.toastText, { color: colors.text }]}>{toastMsg}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', overflow: 'hidden' as any },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },

  statusBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, backgroundColor: '#F0FDF4', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#BBF7D0' },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#65A30D' },
  statusText: { fontSize: 15, fontWeight: '700', color: '#166534' },
  queueBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#E5E7EB', gap: 6 },
  queueBadgeNum: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  queueBadgeLabel: { fontSize: 12, color: '#6B7280' },

  statsRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden' },
  statBox: { flex: 1, paddingVertical: 14, paddingHorizontal: 16 },
  statBoxRight: { borderLeftWidth: 1, borderLeftColor: '#E5E7EB' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#111' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111' },

  patientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  tokenCircle: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  tokenText: { fontSize: 18, fontWeight: 'bold', color: '#374151' },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 15, fontWeight: '600', color: '#111' },
  patientMeta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  metaDot: { color: '#D1D5DB' },

  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#9CA3AF', marginTop: 16 },
  emptySubtext: { fontSize: 13, color: '#D1D5DB', marginTop: 6, textAlign: 'center', lineHeight: 18 },

  toast: { position: 'absolute', bottom: 24, left: 20, right: 20, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, elevation: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  toastText: { fontSize: 14, color: '#111', fontWeight: '500', flex: 1 },
});

export default DoctorOPDSession;
