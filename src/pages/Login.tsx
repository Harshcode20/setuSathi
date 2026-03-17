import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const logoImg = require('../assets/setusaathi-logo.png');

import { authService } from '../lib/api';
import { usePreferences } from '../lib/PreferencesContext';

const LoginScreen = () => {
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const navigation = useNavigation();
  const { t, colors, theme } = usePreferences();

  const handleMemberChange = (value: string) => {
    setMemberId(value);
    if (loginError) setLoginError(null);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (loginError) setLoginError(null);
  };

  const handleLogin = async () => {
    if (!memberId.trim() || !password.trim()) {
      Alert.alert(t('Error'), t('Please enter your email and password.'));
      return;
    }
    setLoginError(null);
    setLoading(true);
    try {
      // Just sign in with Firebase — onAuthStateChanged in AuthProvider
      // will automatically fetch the user profile (with role) and
      // App.tsx's RootNavigator will switch to the correct dashboard.
      await authService.login(memberId.trim(), password);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      const errorCode = err?.code || '';
      const errorMessage = err?.message || '';
      let friendly = t('Invalid credentials.');
      if (errorCode.includes('wrong-password') || errorMessage.includes('wrong-password')) {
        friendly = t('Incorrect password. Please try again.');
      } else if (errorCode.includes('user-not-found')) {
        friendly = t('Account not found. Please check the email/Member ID.');
      } else if (errorCode.includes('too-many-requests')) {
        friendly = t('Too many attempts. Please wait a moment and try again.');
      }
      setLoginError(friendly);
      Alert.alert(t('Login Failed'), friendly);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) {
      Alert.alert(t('Error'), t('Please enter your email address.'));
      return;
    }
    try {
      await authService.forgotPassword(resetEmail.trim());
      setResetSent(true);
      setTimeout(() => {
        setResetSent(false);
        setResetEmail('');
        setForgotModalVisible(false);
      }, 3000);
    } catch {
      Alert.alert(t('Error'), t('Could not send reset link. Try again.'));
    }
  };

  const backgroundColors = theme === 'dark'
    ? { top: '#0f172a', middle: '#1e293b', bottom: '#0f172a' }
    : { top: '#DFF3FF', middle: '#EAF7FF', bottom: '#FFFFFF' };

  return (
    <KeyboardAvoidingView style={{ flex: 1, overflow: 'hidden' as any, backgroundColor: backgroundColors.bottom }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.backgroundLayer, { backgroundColor: backgroundColors.top }]} pointerEvents="none" />
      <View style={[styles.backgroundLayer, styles.backgroundLayerMid, { backgroundColor: backgroundColors.middle }]} pointerEvents="none" />
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: 'transparent' }]} keyboardShouldPersistTaps="handled">
        <Image source={logoImg} style={styles.logoImage} resizeMode="contain" />
        <Text style={[styles.title, { color: colors.text }]}>{t('Log In')}</Text>

        <View style={[styles.inputWrapper, { backgroundColor: colors.subSurface, borderColor: colors.border }]}>
          <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput style={[styles.input, { color: colors.text }]} placeholder={t('Member ID')} placeholderTextColor={colors.mutedText} value={memberId} onChangeText={handleMemberChange} autoCapitalize="none" keyboardType="email-address" />
        </View>

        <View style={[styles.inputWrapper, { backgroundColor: colors.subSurface, borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput style={[styles.input, { paddingRight: 48, color: colors.text }]} placeholder={t('Password')} placeholderTextColor={colors.mutedText} value={password} onChangeText={handlePasswordChange} secureTextEntry={!showPassword} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
          </TouchableOpacity>
        </View>

        <View style={styles.optionsRow}>
          <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={[styles.rememberText, { color: colors.text }]}>{t('Remember me')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setForgotModalVisible(true)}>
            <Text style={styles.forgotText}>{t('Forgot Password?')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.85} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.loginBtnText}>{t('Log In')}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>

        {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}

        <View style={styles.registerRow}>
          <Text style={[styles.registerRowText, { color: colors.mutedText }]}>{t("Don't have an account?")} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register' as never)}>
            <Text style={styles.registerLink}>{t('Register')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.contactText, { color: colors.mutedText }]}>
          {t('Having trouble? Contact')} <Text style={styles.link}>SETU Admin</Text>
        </Text>
      </ScrollView>

      {/* Forgot Password Modal */}
      <Modal visible={forgotModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity onPress={() => { setForgotModalVisible(false); setResetEmail(''); setResetSent(false); }}>
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>

            {resetSent ? (
              <View style={styles.successContainer}>
                <View style={styles.successCircle}>
                  <Ionicons name="checkmark" size={32} color="#fff" />
                </View>
                <Text style={styles.successTitle}>Email Sent!</Text>
                <Text style={styles.successSub}>Password reset instructions have been sent to your email address.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalDesc}>
                  Enter your registered email address and we'll send you instructions to reset your password.
                </Text>
                <View style={styles.modalInputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#888" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Email address"
                    placeholderTextColor="#888"
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
                <TouchableOpacity style={styles.resetBtn} onPress={handleForgotPassword} activeOpacity={0.85}>
                  <Ionicons name="send-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.resetBtnText}>Send Reset Link</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  backgroundLayer: { position: 'absolute', top: 0, left: 0, right: 0, height: '60%', borderBottomLeftRadius: 200, borderBottomRightRadius: 200 },
  backgroundLayerMid: { top: '20%', height: '55%', opacity: 0.6 },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logoImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111', marginBottom: 28 },
  inputWrapper: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e2e2e2', borderRadius: 14, marginBottom: 14, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#222' },
  eyeBtn: { position: 'absolute', right: 14, padding: 4 },
  optionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 24, marginTop: 4 },
  rememberRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 22, height: 22, borderWidth: 1.5, borderColor: '#ccc', borderRadius: 5, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  rememberText: { fontSize: 14, color: '#222' },
  forgotText: { fontSize: 14, color: '#2563EB', fontWeight: '600' },
  loginBtn: { width: '100%', backgroundColor: '#2563EB', paddingVertical: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: 12 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorText: { width: '100%', textAlign: 'center', color: '#DC2626', fontSize: 13, marginBottom: 12 },
  contactText: { fontSize: 14, color: '#888', marginTop: 8 },
  link: { color: '#2563EB', fontWeight: 'bold' },
  registerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  registerRowText: { fontSize: 14, color: '#888' },
  registerLink: { fontSize: 14, color: '#2563EB', fontWeight: 'bold' },
  // Forgot Password Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalSheet: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  modalDesc: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 20 },
  modalInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e2e2e2', borderRadius: 14, paddingHorizontal: 14, marginBottom: 16 },
  modalInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#222' },
  resetBtn: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  resetBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  successContainer: { alignItems: 'center', paddingVertical: 20 },
  successCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
});

export default LoginScreen;
