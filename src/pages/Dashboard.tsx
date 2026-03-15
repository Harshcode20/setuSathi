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
import { usePreferences } from '../lib/PreferencesContext';

const Dashboard = () => {
  const navigation = useNavigation();
  const { patients } = usePatientStore();
  const { user, userProfile, doctorProfile } = useAuth();
  const { t, theme, colors, language } = usePreferences();
  const displayName = userProfile?.fullName || doctorProfile?.fullName || user?.displayName || 'Volunteer';
  const displayDoctorId = userProfile?.memberId || (doctorProfile as any)?.doctorId || 'N/A';
  const profileImageSource = userProfile?.photoUri ? { uri: userProfile.photoUri } : doctorAvatarImg;
  const today = new Date().toLocaleDateString(language === 'gu' ? 'gu-IN' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const isDark = theme === 'dark';

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if ((globalThis as any).confirm('Are you sure you want to logout?')) {
        authService.logout();
      }
      return;
    }
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => authService.logout(),
      },
    ]);
  };
  const todayISO = new Date().toISOString().split('T')[0];
  const registeredToday = patients.filter(p => p.registeredAt === todayISO).length;

  const opdStats = { totalOPDs: 12, totalPatients: patients.length, registeredToday, vitalsRecorded: 24, consultsDone: 18, medicinesGiven: 15 };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
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
          <View style={[styles.profileCard, { backgroundColor: colors.surface }]}> 
            <Image source={logoImg} style={[styles.profileWatermark, { opacity: isDark ? 0.1 : 0.16 }]} resizeMode="contain" />
            <Image source={profileImageSource} style={styles.profileAvatarImg} />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileId, { color: colors.mutedText }]}>{displayDoctorId}</Text>
              <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
              <View style={[styles.profileBadge, { backgroundColor: isDark ? '#111827' : '#f3f4f6' }]}>
                <Ionicons name="calendar-outline" size={12} color={colors.mutedText} />
                <Text style={[styles.profileBadgeText, { color: colors.mutedText }]}>{t('dashboard.roleNotDefined')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* OPD Statistics */}
        <View style={styles.section}>
          <View style={[styles.statsCard, { backgroundColor: colors.surface }]}> 
            <Text style={[styles.statsTitle, { color: colors.text }]}>{t('dashboard.opdStatistics')}</Text>
            <View style={styles.bigStatsRow}>
              <View style={[styles.bigStat, { backgroundColor: 'rgba(37,99,235,0.1)' }]}>
                <MaterialCommunityIcons name="briefcase-outline" size={20} color="#2563EB" />
                <Text style={[styles.bigStatNum, { color: '#2563EB' }]}>{opdStats.totalOPDs}</Text>
                <Text style={[styles.bigStatLabel, { color: colors.mutedText }]}>{t('dashboard.totalOpds')}</Text>
              </View>
              <View style={[styles.bigStat, { backgroundColor: 'rgba(13,148,136,0.1)' }]}>
                <Ionicons name="people-outline" size={20} color="#0D9488" />
                <Text style={[styles.bigStatNum, { color: '#0D9488' }]}>{opdStats.totalPatients}</Text>
                <Text style={[styles.bigStatLabel, { color: colors.mutedText }]}>{t('dashboard.totalPatients')}</Text>
              </View>
            </View>
            <View style={styles.smallStatsRow}>
              <View style={[styles.smallStat, { backgroundColor: colors.subSurface }]}> 
                <MaterialCommunityIcons name="clipboard-plus-outline" size={16} color="#F97316" />
                <Text style={[styles.smallStatNum, { color: colors.text }]}>{opdStats.registeredToday}</Text>
                <Text style={[styles.smallStatLabel, { color: colors.mutedText }]}>{t('dashboard.registered')}</Text>
              </View>
              <View style={[styles.smallStat, { backgroundColor: colors.subSurface }]}> 
                <Ionicons name="heart-outline" size={16} color="#F59E0B" />
                <Text style={[styles.smallStatNum, { color: colors.text }]}>{opdStats.vitalsRecorded}</Text>
                <Text style={[styles.smallStatLabel, { color: colors.mutedText }]}>{t('dashboard.vitals')}</Text>
              </View>
              <View style={[styles.smallStat, { backgroundColor: colors.subSurface }]}> 
                <MaterialCommunityIcons name="stethoscope" size={16} color="#65A30D" />
                <Text style={[styles.smallStatNum, { color: colors.text }]}>{opdStats.consultsDone}</Text>
                <Text style={[styles.smallStatLabel, { color: colors.mutedText }]}>{t('dashboard.consults')}</Text>
              </View>
              <View style={[styles.smallStat, { backgroundColor: colors.subSurface }]}> 
                <MaterialCommunityIcons name="pill" size={16} color="#0D9488" />
                <Text style={[styles.smallStatNum, { color: colors.text }]}>{opdStats.medicinesGiven}</Text>
                <Text style={[styles.smallStatLabel, { color: colors.mutedText }]}>{t('dashboard.medicines')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedText }]}>{t('dashboard.quickActions')}</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0D9488' }]} onPress={() => navigation.navigate('RegisterPatient' as never)} activeOpacity={0.85}>
              <Ionicons name="person-add-outline" size={36} color="#fff" />
              <Text style={styles.actionBtnText}>{t('dashboard.registerPatient')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F97316' }]} onPress={() => navigation.navigate('StartOPD' as never)} activeOpacity={0.85}>
              <MaterialCommunityIcons name="briefcase-outline" size={36} color="#fff" />
              <Text style={styles.actionBtnText}>{t('dashboard.startOpd')}</Text>
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
  profileCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, overflow: 'hidden' },
  profileWatermark: { position: 'absolute', right: -16, top: -8, width: 170, height: 120 },
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
