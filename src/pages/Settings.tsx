import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';
import { usePreferences } from '../lib/PreferencesContext';
import { useAuth } from '../lib/AuthContext';
import { authService } from '../lib/api';

const Settings = () => {
  const navigation = useNavigation();
  const { language, setLanguage, theme, toggleTheme, colors, t } = usePreferences();
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [mobile, setMobile] = useState('');
  const [savingMobile, setSavingMobile] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    setMobile(userProfile?.mobile || '');
  }, [userProfile?.mobile]);

  const handleSaveMobile = async () => {
    const mobileTrimmed = mobile.trim();
    if (!mobileTrimmed) {
      Alert.alert(t('Error'), 'Mobile Number field is necessary.');
      return;
    }
    if (!/^\d{10}$/.test(mobileTrimmed)) {
      Alert.alert(t('Error'), 'Mobile Number should be 10 digit.');
      return;
    }
    if (!user?.uid) {
      Alert.alert(t('Error'), 'Please login again to update profile.');
      return;
    }

    try {
      setSavingMobile(true);
      await authService.updateUserProfile(user.uid, { mobile: mobileTrimmed });
      await refreshUserProfile();
      Alert.alert('Success', 'Mobile number updated successfully.');
    } catch (err: any) {
      Alert.alert(t('Error'), err?.message || 'Failed to update mobile number.');
    } finally {
      setSavingMobile(false);
    }
  };

  const handleChangePassword = async () => {
    const emailForReset = userProfile?.email || user?.email || '';
    if (!emailForReset) {
      Alert.alert(t('Error'), 'Email not available for password reset.');
      return;
    }

    try {
      await authService.forgotPassword(emailForReset);
      Alert.alert('Password Reset Link Sent', `A reset link has been sent to ${emailForReset}.`);
    } catch (err: any) {
      Alert.alert(t('Error'), err?.message || 'Failed to send reset link.');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: '#2563EB' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.scopeNote, { color: colors.mutedText }]}>{t('settings.scopeNote')}</Text>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Profile</Text>
          <Text style={[styles.cardSub, { color: colors.mutedText }]}>Update your contact info and password options</Text>

          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: colors.mutedText }]}>Name</Text>
            <Text style={[styles.profileValue, { color: colors.text }]}>{userProfile?.fullName || '-'}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: colors.mutedText }]}>Member ID</Text>
            <Text style={[styles.profileValue, { color: colors.text }]}>{userProfile?.memberId || '-'}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={[styles.profileLabel, { color: colors.mutedText }]}>Email</Text>
            <Text style={[styles.profileValue, { color: colors.text }]}>{userProfile?.email || '-'}</Text>
          </View>

          <Text style={[styles.inputLabel, { color: colors.text }]}>Mobile Number *</Text>
          <View style={[styles.inputWrap, { backgroundColor: colors.subSurface, borderColor: colors.border }]}>
            <Ionicons name="call-outline" size={18} color={colors.mutedText} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t('Mobile Number')}
              placeholderTextColor={colors.mutedText}
              value={mobile}
              onChangeText={(value) => setMobile(value.replace(/\D/g, '').slice(0, 10))}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveMobile} disabled={savingMobile} activeOpacity={0.85}>
            {savingMobile ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Update Mobile Number</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.subSurface }]} onPress={handleChangePassword} activeOpacity={0.85}>
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Change Password</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.language')}</Text>
          <Text style={[styles.cardSub, { color: colors.mutedText }]}>{t('settings.languageHelp')}</Text>

          <View style={styles.segRow}>
            <TouchableOpacity
              style={[
                styles.segBtn,
                { borderColor: colors.border, backgroundColor: colors.subSurface },
                language === 'en' && styles.segBtnActive,
              ]}
              onPress={() => setLanguage('en')}
              activeOpacity={0.8}
            >
              <Text style={[styles.segBtnText, { color: language === 'en' ? '#fff' : colors.text }]}>{t('settings.english')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segBtn,
                { borderColor: colors.border, backgroundColor: colors.subSurface },
                language === 'gu' && styles.segBtnActive,
              ]}
              onPress={() => setLanguage('gu')}
              activeOpacity={0.8}
            >
              <Text style={[styles.segBtnText, { color: language === 'gu' ? '#fff' : colors.text }]}>{t('settings.gujarati')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.theme')}</Text>
          <Text style={[styles.cardSub, { color: colors.mutedText }]}>{t('settings.themeHelp')}</Text>

          <View style={styles.switchRow}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>
              {isDark ? t('settings.darkMode') : t('settings.lightMode')}
            </Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={isDark ? '#2563EB' : '#f8fafc'}
            />
          </View>
        </View>
      </View>

      <BottomNav />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingTop: 52, paddingBottom: 18, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  content: { flex: 1, padding: 20, gap: 16 },
  scopeNote: { fontSize: 12, lineHeight: 18 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardSub: { fontSize: 13, marginTop: 4, marginBottom: 14 },
  segRow: { flexDirection: 'row', gap: 10 },
  segBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  segBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  segBtnText: { fontSize: 14, fontWeight: '600' },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  profileLabel: { fontSize: 12 },
  profileValue: { fontSize: 13, fontWeight: '600', maxWidth: '68%' },
  inputLabel: { fontSize: 13, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15 },
  primaryBtn: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  secondaryBtn: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  secondaryBtnText: { fontSize: 14, fontWeight: '700' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: 15, fontWeight: '600' },
});

export default Settings;
