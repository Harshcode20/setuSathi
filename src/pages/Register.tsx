import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const logoImg = require('../assets/setusaathi-logo.png');

import { authService } from '../lib/api';
import { useToast } from '../components/Toast';
import { usePreferences } from '../lib/PreferencesContext';

type Role = 'doctor' | 'volunteer';

const RegisterScreen = () => {
  const [role, setRole] = useState<Role>('doctor');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoOptionVisible, setPhotoOptionVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileError, setMobileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const navigation = useNavigation();
  const toast = useToast();
  const { t, colors } = usePreferences();

  const isMobileValid = /^\d{10}$/.test(mobile.trim());

  const handleMobileChange = (value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 10);
    setMobile(sanitized);
    if (!sanitized) {
      setMobileError(null);
    } else if (sanitized.length < 10) {
      setMobileError(t('Mobile number must be 10 digits.'));
    } else {
      setMobileError(null);
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (!value) {
      setPasswordError(null);
    } else if (value.length < 6) {
      setPasswordError(t('Password must be at least 6 characters.'));
    } else {
      setPasswordError(null);
    }
    if (confirmPassword) {
      setConfirmPasswordError(value === confirmPassword ? null : t('Passwords do not match.'));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (!value) {
      setConfirmPasswordError(null);
    } else if (value !== password) {
      setConfirmPasswordError(t('Passwords do not match.'));
    } else {
      setConfirmPasswordError(null);
    }
  };

  const pickFromLibrary = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('Error'), 'Please allow access to your photo library.');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert(t('Error'), err?.message || 'Could not open photo library.');
    }
  };

  const takePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('Error'), 'Please allow camera access.');
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert(t('Error'), err?.message || 'Could not open camera.');
    }
  };

  const choosePhoto = () => {
    setPhotoOptionVisible(true);
  };

  const handleRegister = async () => {
    if (!photoUri) {
      Alert.alert(t('Error'), 'Profile Photo field is necessary.');
      return;
    }
    if (!fullName.trim()) {
      Alert.alert(t('Error'), 'Full Name field is necessary.');
      return;
    }
    if (!memberId.trim()) {
      Alert.alert(t('Error'), 'Member ID field is necessary.');
      return;
    }
    if (!email.trim()) {
      Alert.alert(t('Error'), 'Email Address field is necessary.');
      return;
    }
    if (!mobile.trim()) {
      Alert.alert(t('Error'), 'Mobile Number field is necessary.');
      return;
    }
    if (!isMobileValid) {
      setMobileError(t('Mobile number must be 10 digits.'));
      Alert.alert(t('Error'), t('Mobile number must be 10 digits.'));
      return;
    }
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert(t('Error'), 'Password field is necessary.');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError(t('Passwords do not match.'));
      Alert.alert(t('Error'), t('Passwords do not match.'));
      return;
    }
    if (password.length < 6) {
      setPasswordError(t('Password must be at least 6 characters.'));
      Alert.alert(t('Error'), t('Password must be at least 6 characters.'));
      return;
    }
    setLoading(true);
    try {
      await authService.register(email.trim(), password, fullName.trim(), memberId.trim(), mobile.trim(), photoUri, role);
      setLoading(false);
      toast.show(t('Registration successful! Please log in.'), 'success');
      setTimeout(() => navigation.navigate('Login' as never), 1200);
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message?.includes('email-already-in-use')
        ? t('This email is already registered.')
        : err?.message || t('Registration failed. Please try again.');
      toast.show(msg, 'error');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.surface }]} keyboardShouldPersistTaps="handled">
        <Image source={logoImg} style={styles.logoImage} resizeMode="contain" />
        <Text style={[styles.title, { color: colors.text }]}>{t('Create Account')}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>{t('Select your role and register')}</Text>

        <View style={styles.labelRow}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Profile Photo</Text>
          <Text style={styles.requiredMark}>*</Text>
        </View>
        <TouchableOpacity style={[styles.photoRow, { backgroundColor: colors.subSurface, borderColor: colors.border }]} onPress={choosePhoto} activeOpacity={0.8}>
          <View style={styles.photoCircle}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoImage} />
            ) : (
              <Ionicons name="camera-outline" size={22} color="#2563EB" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.photoTitle}>{photoUri ? 'Change Photo' : 'Take / Upload Photo'}</Text>
            <Text style={[styles.photoHint, { color: colors.mutedText }]}>Tap to capture with camera or choose from gallery</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
        </TouchableOpacity>

        {/* Role Toggle */}
        <View style={styles.roleToggleWrapper}>
          <TouchableOpacity
            style={[styles.roleToggleBtn, role === 'doctor' && styles.roleToggleBtnActive]}
            onPress={() => setRole('doctor')}
            activeOpacity={0.8}
          >
            <Ionicons name="medkit-outline" size={18} color={role === 'doctor' ? '#fff' : '#2563EB'} />
            <Text style={[styles.roleToggleText, role === 'doctor' && styles.roleToggleTextActive]}>{t('Doctor')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleToggleBtn, role === 'volunteer' && styles.roleToggleBtnActive]}
            onPress={() => setRole('volunteer')}
            activeOpacity={0.8}
          >
            <Ionicons name="people-outline" size={18} color={role === 'volunteer' ? '#fff' : '#2563EB'} />
            <Text style={[styles.roleToggleText, role === 'volunteer' && styles.roleToggleTextActive]}>{t('Volunteer')}</Text>
          </TouchableOpacity>
        </View>

        {/* Full Name */}
        <View style={styles.labelRow}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('Full Name')}</Text>
          <Text style={styles.requiredMark}>*</Text>
        </View>
        <View style={[styles.inputWrapper, { backgroundColor: colors.subSurface, borderColor: colors.border }]}>
          <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput style={[styles.input, { color: colors.text }]} placeholder={t('Full Name')} placeholderTextColor={colors.mutedText} value={fullName} onChangeText={setFullName} autoCapitalize="words" />
        </View>

        {/* Member ID */}
        <View style={styles.labelRow}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Member ID</Text>
          <Text style={styles.requiredMark}>*</Text>
        </View>
        <View style={[styles.inputWrapper, { backgroundColor: colors.subSurface, borderColor: colors.border }]}>
          <Ionicons name="id-card-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={role === 'doctor' ? t('Doctor ID (e.g. D0024)') : t('Volunteer ID (e.g. V1234)')}
            placeholderTextColor={colors.mutedText}
            value={memberId}
            onChangeText={setMemberId}
            autoCapitalize="characters"
          />
        </View>

        {/* Email */}
        <View style={styles.labelRow}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('Email Address')}</Text>
          <Text style={styles.requiredMark}>*</Text>
        </View>
        <View style={[styles.inputWrapper, { backgroundColor: colors.subSurface, borderColor: colors.border }]}>
          <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput style={[styles.input, { color: colors.text }]} placeholder={t('Email Address')} placeholderTextColor={colors.mutedText} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        </View>

        {/* Mobile */}
        <View style={styles.labelRow}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('Mobile Number')}</Text>
          <Text style={styles.requiredMark}>*</Text>
        </View>
        <View style={[styles.inputWrapper, { backgroundColor: colors.subSurface, borderColor: colors.border }]}>
          <Ionicons name="call-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={t('Mobile Number')}
            placeholderTextColor={colors.mutedText}
            value={mobile}
            onChangeText={handleMobileChange}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>
        {mobileError ? <Text style={styles.errorText}>{mobileError}</Text> : null}

        {/* Password */}
        <View style={styles.labelRow}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('Password')}</Text>
          <Text style={styles.requiredMark}>*</Text>
        </View>
        <View style={[styles.inputWrapper, { backgroundColor: colors.subSurface, borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput style={[styles.input, { paddingRight: 48, color: colors.text }]} placeholder={t('Password')} placeholderTextColor={colors.mutedText} value={password} onChangeText={handlePasswordChange} secureTextEntry={!showPassword} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
          </TouchableOpacity>
        </View>
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        {/* Confirm Password */}
        <View style={styles.labelRow}>
          <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('Confirm Password')}</Text>
          <Text style={styles.requiredMark}>*</Text>
        </View>
        <View style={[styles.inputWrapper, { backgroundColor: colors.subSurface, borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput style={[styles.input, { paddingRight: 48, color: colors.text }]} placeholder={t('Confirm Password')} placeholderTextColor={colors.mutedText} value={confirmPassword} onChangeText={handleConfirmPasswordChange} secureTextEntry={!showConfirmPassword} />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
            <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
          </TouchableOpacity>
        </View>
        {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}

        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} activeOpacity={0.85} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.registerBtnText}>{t('Register as')} {role === 'doctor' ? t('Doctor') : t('Volunteer')}</Text>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={[styles.loginRowText, { color: colors.mutedText }]}>{t('Already have an account?')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
            <Text style={styles.loginLink}>{t('Log In')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={photoOptionVisible} transparent animationType="fade" onRequestClose={() => setPhotoOptionVisible(false)}>
        <View style={styles.photoModalOverlay}>
          <TouchableOpacity style={styles.photoModalBackdrop} activeOpacity={1} onPress={() => setPhotoOptionVisible(false)} />
          <View style={[styles.photoModalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
            <Text style={[styles.photoModalTitle, { color: colors.text }]}>Profile Photo</Text>
            <TouchableOpacity
              style={[styles.photoOptionBtn, { borderBottomColor: colors.border }]}
              onPress={async () => {
                setPhotoOptionVisible(false);
                await takePhoto();
              }}
            >
              <Ionicons name="camera-outline" size={18} color="#2563EB" />
              <Text style={[styles.photoOptionText, { color: colors.text }]}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoOptionBtn, { borderBottomColor: colors.border }]}
              onPress={async () => {
                setPhotoOptionVisible(false);
                await pickFromLibrary();
              }}
            >
              <Ionicons name="images-outline" size={18} color="#2563EB" />
              <Text style={[styles.photoOptionText, { color: colors.text }]}>Upload Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoOptionBtn} onPress={() => setPhotoOptionVisible(false)}>
              <Ionicons name="close-circle-outline" size={18} color={colors.mutedText} />
              <Text style={[styles.photoOptionText, { color: colors.mutedText }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 },
  logoImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  labelRow: { width: '100%', flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#111' },
  requiredMark: { color: '#DC2626', fontSize: 14, fontWeight: '700', marginLeft: 4 },
  photoRow: { width: '100%', borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  photoCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  photoImage: { width: 52, height: 52, borderRadius: 26 },
  photoTitle: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
  photoHint: { fontSize: 11, marginTop: 2 },
  roleToggleWrapper: { flexDirection: 'row', width: '100%', backgroundColor: '#EEF2FF', borderRadius: 14, padding: 4, marginBottom: 20 },
  roleToggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 6 },
  roleToggleBtnActive: { backgroundColor: '#2563EB', shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  roleToggleText: { fontSize: 15, fontWeight: '600', color: '#2563EB' },
  roleToggleTextActive: { color: '#fff' },
  inputWrapper: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e2e2e2', borderRadius: 14, marginBottom: 14, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#222' },
  eyeBtn: { position: 'absolute', right: 14, padding: 4 },
  registerBtn: { width: '100%', backgroundColor: '#2563EB', paddingVertical: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 10, marginBottom: 16 },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorText: { width: '100%', fontSize: 12, color: '#DC2626', marginTop: -8, marginBottom: 10, paddingHorizontal: 4 },
  loginRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  loginRowText: { fontSize: 14, color: '#888' },
  loginLink: { fontSize: 14, color: '#2563EB', fontWeight: 'bold' },
  photoModalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  photoModalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  photoModalSheet: { width: '100%', maxWidth: 360, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  photoModalTitle: { fontSize: 16, fontWeight: '700', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  photoOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  photoOptionText: { fontSize: 15, fontWeight: '600' },
});

export default RegisterScreen;
