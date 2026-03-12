import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const OPDStarted = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { village = 'Ramagri', deskRole = 'registration' } = (route.params as any) || {};

  const deskLabels: Record<string, string> = {
    registration: 'Registration Desk',
    vitals: "Vital's Desk",
    doctor: "Doctor's Assistant",
    medicine: 'Medicine Counter',
  };

  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, '0')}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getFullYear().toString().slice(-2)}`;
  const opdId = `OPD-${village.toUpperCase().slice(0, 6)}-${dateStr}`;

  const [pin] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());

  const otherDesks = [
    { id: 'vitals', label: "Vital's Desk", icon: 'heart-pulse' as const, color: '#F97316' },
    { id: 'doctor', label: "Doctor's\nAssistant", icon: 'stethoscope' as const, color: '#65A30D' },
    { id: 'medicine', label: "Medicine\nCounter", icon: 'pill' as const, color: '#0D9488' },
    { id: 'hospital', label: 'Doctor', icon: 'hospital-building' as const, color: '#2563EB' },
  ].filter((d) => d.id !== deskRole);

  const handleContinue = () => {
    (navigation as any).navigate('RegistrationDesk', { village, deskRole, opdId });
  };

  const navigateDesk = (id: string) => {
    if (id === 'vitals') navigation.navigate('VitalsDesk' as never);
    else if (id === 'doctor') navigation.navigate('DoctorAssistant' as never);
    else if (id === 'medicine') navigation.navigate('MedicineCounter' as never);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>{deskLabels[deskRole] || 'Registration Desk'}</Text>
          <Text style={styles.headerSub}>{opdId}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* OPD Started Card */}
        <View style={styles.opdCard}>
          <TouchableOpacity style={styles.opdStartedBtn} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.opdStartedText}>OPD Started</Text>
          </TouchableOpacity>
          <View style={styles.pinSection}>
            <Text style={styles.pinLabel}>6 Digit PIN</Text>
            <View style={styles.pinRow}>
              {pin.split('').map((digit, i) => (
                <Text key={i} style={styles.pinDigit}>{digit}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Info Text */}
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={18} color="#999" />
          <Text style={styles.infoText}>Ask your team to Enter this code to begin their OPD</Text>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Other Desk Status</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Other Desks Grid */}
        <View style={styles.deskGrid}>
          {otherDesks.map((desk) => (
            <TouchableOpacity key={desk.id} style={styles.deskCard} onPress={() => navigateDesk(desk.id)} activeOpacity={0.8}>
              <MaterialCommunityIcons name={desk.icon} size={28} color={desk.color} />
              <Text style={styles.deskLabel}>{desk.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5', overflow: 'hidden' as any },
  header: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  headerSub: { fontSize: 13, color: '#999', marginTop: 2 },
  scroll: { flex: 1, paddingHorizontal: 20 },
  opdCard: { backgroundColor: '#fff', borderRadius: 18, marginTop: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  opdStartedBtn: { backgroundColor: '#16A34A', paddingVertical: 16, alignItems: 'center', borderRadius: 14, marginHorizontal: 0 },
  opdStartedText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  pinSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24 },
  pinLabel: { fontSize: 13, color: '#999', marginBottom: 12 },
  pinRow: { flexDirection: 'row', gap: 12 },
  pinDigit: { fontSize: 36, fontWeight: 'bold', color: '#111', letterSpacing: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 24, paddingHorizontal: 8 },
  infoText: { fontSize: 13, color: '#999', flex: 1 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 32, marginBottom: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e5e5e5' },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: '#999', fontWeight: '500' },
  deskGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  deskCard: { width: '30%', backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  deskLabel: { fontSize: 11, fontWeight: '500', color: '#111', textAlign: 'center' },
});

export default OPDStarted;
