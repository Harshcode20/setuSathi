import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const logoImg = require('../assets/setusaathi-logo.png');
const doctorAvatarImg = require('../assets/doctor-avatar.jpg');
import BottomNav from '../components/BottomNav';
import { usePatientStore } from '../lib/PatientStore';
import { useAuth } from '../lib/AuthContext';
import { authService } from '../lib/api';

const Dashboard = () => {
  const navigation = useNavigation();
  const { patients } = usePatientStore();
  const { user, doctorProfile } = useAuth();
  const displayName = doctorProfile?.fullName || user?.displayName || 'Doctor';
  const displayDoctorId = doctorProfile?.doctorId || 'N/A';
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if ((globalThis as any).confirm('Are you sure you want to logout?')) {
        authService.logout().then(() => {
          navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
        });
      }
      return;
    }
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
        },
      },
    ]);
  };
  const todayISO = new Date().toISOString().split('T')[0];
  const registeredToday = patients.filter(p => p.registeredAt === todayISO).length;

  const opdStats = { totalOPDs: 12, totalPatients: patients.length, registeredToday, vitalsRecorded: 24, consultsDone: 18, medicinesGiven: 15 };

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Image source={logoImg} style={styles.headerLogoImg} resizeMode="contain" />
              <Text style={styles.headerTitle}>SetuSaathi</Text>
            </View>
            <View style={styles.headerRight}>
              <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.headerDate}>{today}</Text>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <Ionicons name="log-out-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Doctor Profile Card */}
        <View style={styles.profileCardOuter}>
          <View style={styles.profileCard}>
            <Image source={doctorAvatarImg} style={styles.profileAvatarImg} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileId}>{displayDoctorId}</Text>
              <Text style={styles.profileName}>{displayName}</Text>
              <View style={styles.profileBadge}><Ionicons name="calendar-outline" size={12} color="#888" /><Text style={styles.profileBadgeText}>Not Defined</Text></View>
            </View>
          </View>
        </View>

        {/* OPD Statistics */}
        <View style={styles.section}>
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>OPD Statistics</Text>
            <View style={styles.bigStatsRow}>
              <View style={[styles.bigStat, { backgroundColor: 'rgba(37,99,235,0.1)' }]}>
                <MaterialCommunityIcons name="briefcase-outline" size={20} color="#2563EB" />
                <Text style={[styles.bigStatNum, { color: '#2563EB' }]}>{opdStats.totalOPDs}</Text>
                <Text style={styles.bigStatLabel}>Total OPDs</Text>
              </View>
              <View style={[styles.bigStat, { backgroundColor: 'rgba(13,148,136,0.1)' }]}>
                <Ionicons name="people-outline" size={20} color="#0D9488" />
                <Text style={[styles.bigStatNum, { color: '#0D9488' }]}>{opdStats.totalPatients}</Text>
                <Text style={styles.bigStatLabel}>Total Patients</Text>
              </View>
            </View>
            <View style={styles.smallStatsRow}>
              <View style={styles.smallStat}>
                <MaterialCommunityIcons name="clipboard-plus-outline" size={16} color="#F97316" />
                <Text style={styles.smallStatNum}>{opdStats.registeredToday}</Text>
                <Text style={styles.smallStatLabel}>Registered</Text>
              </View>
              <View style={styles.smallStat}>
                <Ionicons name="heart-outline" size={16} color="#F59E0B" />
                <Text style={styles.smallStatNum}>{opdStats.vitalsRecorded}</Text>
                <Text style={styles.smallStatLabel}>Vitals</Text>
              </View>
              <View style={styles.smallStat}>
                <MaterialCommunityIcons name="stethoscope" size={16} color="#65A30D" />
                <Text style={styles.smallStatNum}>{opdStats.consultsDone}</Text>
                <Text style={styles.smallStatLabel}>Consults</Text>
              </View>
              <View style={styles.smallStat}>
                <MaterialCommunityIcons name="pill" size={16} color="#0D9488" />
                <Text style={styles.smallStatNum}>{opdStats.medicinesGiven}</Text>
                <Text style={styles.smallStatLabel}>Medicines</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Quick Actions</Text>
            <View style={styles.dividerLine} />
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0D9488' }]} onPress={() => navigation.navigate('RegisterPatient' as never)} activeOpacity={0.85}>
              <Ionicons name="person-add-outline" size={36} color="#fff" />
              <Text style={styles.actionBtnText}>Register Patient</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F97316' }]} onPress={() => navigation.navigate('StartOPD' as never)} activeOpacity={0.85}>
              <MaterialCommunityIcons name="briefcase-outline" size={36} color="#fff" />
              <Text style={styles.actionBtnText}>Start OPD</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <BottomNav />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5', overflow: 'hidden' as any },
  scroll: { flex: 1 },
  header: { backgroundColor: '#2563EB', paddingHorizontal: 20, paddingTop: 48, paddingBottom: 60, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogoImg: { width: 36, height: 36, borderRadius: 18 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerDate: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  logoutBtn: { marginLeft: 12, padding: 4 },
  profileCardOuter: { marginTop: -40, marginHorizontal: 20 },
  profileCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  profileAvatarImg: { width: 72, height: 72, borderRadius: 14, borderWidth: 2, borderColor: '#e2e2e2' },
  profileInfo: { flex: 1, marginLeft: 14 },
  profileId: { fontSize: 13, color: '#888' },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#111', marginTop: 2 },
  profileBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6, alignSelf: 'flex-start', gap: 4 },
  profileBadgeText: { fontSize: 11, color: '#888' },
  section: { marginHorizontal: 20, marginTop: 20 },
  statsCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statsTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 16 },
  bigStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  bigStat: { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
  bigStatNum: { fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  bigStatLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  smallStatsRow: { flexDirection: 'row', gap: 8 },
  smallStat: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 14, padding: 12, alignItems: 'center' },
  smallStatNum: { fontSize: 18, fontWeight: 'bold', color: '#111', marginTop: 4 },
  smallStatLabel: { fontSize: 9, color: '#888', marginTop: 2, textAlign: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e5e5e5' },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: '#888' },
  actionsRow: { flexDirection: 'row', gap: 16 },
  actionBtn: { flex: 1, borderRadius: 18, padding: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold', marginTop: 10 },
});

export default Dashboard;
