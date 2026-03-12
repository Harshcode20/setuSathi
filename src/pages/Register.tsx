import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const logoImg = require('../assets/setusaathi-logo.png');

import { authService } from '../lib/api';

const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !doctorId.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await authService.register(email.trim(), password, fullName.trim(), doctorId.trim());
      setLoading(false);
      Alert.alert('Success', 'Account created successfully! You can now log in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login' as never) },
      ]);
    } catch (err: any) {
      setLoading(false);
      const msg = err?.message?.includes('email-already-in-use')
        ? 'This email is already registered.'
        : err?.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', msg);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image source={logoImg} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Register as a new doctor</Text>

        {/* Full Name */}
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#888" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
        </View>

        {/* Doctor ID */}
        <View style={styles.inputWrapper}>
          <Ionicons name="id-card-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Doctor ID (e.g. S1234)" placeholderTextColor="#888" value={doctorId} onChangeText={setDoctorId} autoCapitalize="characters" />
        </View>

        {/* Email */}
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor="#888" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        </View>

        {/* Password */}
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput style={[styles.input, { paddingRight: 48 }]} placeholder="Password" placeholderTextColor="#888" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput style={[styles.input, { paddingRight: 48 }]} placeholder="Confirm Password" placeholderTextColor="#888" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
            <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} activeOpacity={0.85} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.registerBtnText}>Register</Text>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginRowText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 },
  logoImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 28 },
  inputWrapper: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e2e2e2', borderRadius: 14, marginBottom: 14, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#222' },
  eyeBtn: { position: 'absolute', right: 14, padding: 4 },
  registerBtn: { width: '100%', backgroundColor: '#2563EB', paddingVertical: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 10, marginBottom: 16 },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loginRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  loginRowText: { fontSize: 14, color: '#888' },
  loginLink: { fontSize: 14, color: '#2563EB', fontWeight: 'bold' },
});

export default RegisterScreen;
