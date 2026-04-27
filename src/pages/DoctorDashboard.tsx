import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, Platform, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const logoImg = require('../assets/setusaathi-logo.png');
const doctorAvatarImg = require('../assets/doctor-avatar.jpg');
import { useAuth } from '../lib/AuthContext';
import { authService, opdService } from '../lib/api';
import { useToast } from '../components/Toast';
import { usePreferences } from '../lib/PreferencesContext';

const DoctorDashboard = () => {
  const navigation = useNavigation();
  const { user, userProfile } = useAuth();
  const toast = useToast();
  const { t, theme, colors, language } = usePreferences();
  const displayName = userProfile?.fullName || user?.displayName || 'Doctor';
  const displayId = userProfile?.memberId || 'N/A';
  const profileImageSource = userProfile?.photoUri ? { uri: userProfile.photoUri } : doctorAvatarImg;
  const today = new Date().toLocaleDateString(language === 'gu' ? 'gu-IN' : 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const isDark = theme === 'dark';

  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [joining, setJoining] = useState(false);
  const [opdStats, setOpdStats] = useState({
    totalPatients: 42,
    consultsDone: 18,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const pinRefs = useRef<Array<TextInput | null>>([]);

  // Fetch OPD statistics on component mount
  useEffect(() => {
    const fetchOpdStats = async () => {
      try {
        setLoadingStats(true);
        const stats = await opdService.getStats();
        setOpdStats({
          totalPatients: userProfile?.stats?.patients ?? 42,
          consultsDone: (stats as any)?.consultsDone ?? 18,
        });
      } catch (error) {
        console.warn('Failed to fetch OPD stats:', error);
        // Keep default values on error
      } finally {
        setLoadingStats(false);
      }
    };
    fetchOpdStats();
  }, [userProfile?.stats?.patients]);

  const handlePinChange = (text: string, index: number) => {
    const val = text.replace(/\D/g, '');
    const newPin = [...pin];
    newPin[index] = val;
    setPin(newPin);
    if (val && index < 5) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handleJoinOPD = async () => {
    const pinString = pin.join('');
    if (pinString.length !== 6) {
      toast.show('Please enter all 6 digits', 'error');
      return;
    }
    setJoining(true);
    try {
      const session = await opdService.joinByPin(pinString);
      setJoining(false);
      if (!session) {
        toast.show('Invalid OPD code. Please check and try again.', 'error');
        return;
      }
      toast.show('Joined OPD successfully!', 'success');
      setTimeout(() => {
        (navigation as any).navigate('DoctorOPDSession', { session });
      }, 500);
    } catch {
      setJoining(false);
      toast.show('Failed to join OPD. Try again.', 'error');
    }
  };

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
            <Image source={logoImg} style={[styles.profileWatermark, { opacity: isDark ? 0.20 : 0.09 }]} resizeMode="contain" />
            <Image source={profileImageSource} style={styles.profileAvatarImg} />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileId, { color: colors.mutedText }]}>{displayId}</Text>
              <Text style={[styles.profileName, { color: colors.text }]}>{displayName}</Text>
              <View style={[styles.profileBadge, { backgroundColor: isDark ? '#111827' : '#EEF2FF' }]}> 
                <MaterialCommunityIcons name="hospital-building" size={12} color="#2563EB" />
                <Text style={styles.profileBadgeText}>{t('doctorDashboard.roleBadge')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* OPD Statistics */}
        <View style={styles.section}>
          <View style={[styles.statsCard, { backgroundColor: colors.surface }]}> 
            <Text style={[styles.statsTitle, { color: colors.text }]}>{t('dashboard.opdStatistics')}</Text>
            <View style={styles.bigStatsRow}>
              <View style={[styles.bigStat, { backgroundColor: 'rgba(13,148,136,0.12)' }]}>
                <Ionicons name="people-outline" size={22} color="#0D9488" />
                <Text style={[styles.bigStatNum, { color: '#0D9488' }]}>{opdStats.totalPatients}</Text>
                <Text style={[styles.bigStatLabel, { color: colors.mutedText }]}>{t('dashboard.totalPatients')}</Text>
              </View>
              <View style={[styles.bigStat, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                <MaterialCommunityIcons name="stethoscope" size={22} color="#6366F1" />
                <Text style={[styles.bigStatNum, { color: '#6366F1' }]}>{opdStats.consultsDone}</Text>
                <Text style={[styles.bigStatLabel, { color: colors.mutedText }]}>{t('dashboard.consults')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Enter 6 Digit Code */}
        <View style={[styles.section, styles.pinSection]}> 
          <View style={[styles.pinCard, { backgroundColor: colors.surface }]}> 
            <Text style={[styles.pinCardTitle, { color: colors.text }]}>{t('doctorDashboard.pinTitle')}</Text>
            <View style={styles.pinRow}>
              {pin.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { pinRefs.current[i] = ref; }}
                  style={[styles.pinBox, { borderColor: colors.border, color: colors.text, backgroundColor: colors.subSurface }, digit ? styles.pinBoxFilled : {}]}
                  value={digit}
                  onChangeText={(text) => handlePinChange(text, i)}
                  onKeyPress={(e) => handlePinKeyPress(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>
            <TouchableOpacity
              style={[styles.joinBtn, pin.join('').length < 6 && styles.joinBtnDisabled]}
              onPress={handleJoinOPD}
              disabled={joining || pin.join('').length < 6}
              activeOpacity={0.85}
            >
              {joining ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.joinBtnText}>{t('doctorDashboard.joinOpd')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.navTab} activeOpacity={0.7}>
          <Ionicons name="home" size={24} color="#2563EB" />
          <Text style={[styles.navTabText, styles.navTabTextActive]}>{t('nav.home')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navTab}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('PatientRecord' as never)}
        >
          <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={colors.mutedText} />
          <Text style={[styles.navTabText, { color: colors.mutedText }]}>{t('nav.records')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} activeOpacity={0.7} onPress={() => navigation.navigate('Settings' as never)}>
          <Ionicons name="settings-outline" size={24} color={colors.mutedText} />
          <Text style={[styles.navTabText, { color: colors.mutedText }]}>{t('nav.settings')}</Text>
        </TouchableOpacity>
      </View>
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

  profileCardOuter: { marginTop: -48, marginHorizontal: 20 },
  profileCard: { backgroundColor: '#fff', borderRadius: 24, paddingVertical: 26, paddingHorizontal: 28, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 6, overflow: 'hidden' },
  profileWatermark: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: undefined, height: undefined, transform: [{ rotate: '-4deg' }], alignSelf: 'center' },
    profileAvatarImg: { width: 92, height: 92, borderRadius: 18, borderWidth: 3, borderColor: '#e2e2e2', marginTop: -18, marginRight: 6 },
  profileInfo: { flex: 1, marginLeft: 18 },
  profileId: { fontSize: 14, color: '#64748B' },
  profileName: { fontSize: 22, fontWeight: '800', color: '#111', marginTop: 4 },
  profileBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginTop: 10, alignSelf: 'flex-start', gap: 6 },
  profileBadgeText: { fontSize: 11, color: '#2563EB', fontWeight: '500' },

  section: { marginHorizontal: 20, marginTop: 16 },
  pinSection: { marginBottom: 24 },

  statsCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statsTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 16 },
  bigStatsRow: { flexDirection: 'row', gap: 12 },
  bigStat: { flex: 1, borderRadius: 18, paddingVertical: 24, paddingHorizontal: 12, alignItems: 'center', gap: 4 },
  bigStatNum: { fontSize: 34, fontWeight: '800', marginTop: 2 },
  bigStatLabel: { fontSize: 13, color: '#666', textAlign: 'center' },

  noOpdCard: { backgroundColor: '#fff', borderRadius: 18, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  noOpdIconWrapper: { width: 56, height: 56, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  noOpdTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 6 },
  noOpdDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },

  pinCard: { backgroundColor: '#fff', borderRadius: 18, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  pinCardTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 20 },
  pinRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  pinBox: { width: 48, height: 56, borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 12, textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: '#111', backgroundColor: '#F9FAFB' },
  pinBoxFilled: { borderColor: '#2563EB', backgroundColor: '#EEF2FF' },
  joinBtn: { backgroundColor: '#2563EB', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', width: '100%' },
  joinBtnDisabled: { opacity: 0.4 },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e5e5', paddingBottom: 20, paddingTop: 10 },
  navTab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navTabText: { fontSize: 11, color: '#888', marginTop: 2 },
  navTabTextActive: { color: '#2563EB', fontWeight: '600' },
});

export default DoctorDashboard;
