import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = () => {
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigation = useNavigation();

  const handleLogin = () => {
    navigation.navigate('Dashboard' as never);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, overflow: 'hidden' as any }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>SETU</Text>
          <Text style={styles.logoSubText}>Saathi</Text>
        </View>
        <Text style={styles.title}>Log In</Text>

        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Member ID" placeholderTextColor="#888" value={memberId} onChangeText={setMemberId} />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput style={[styles.input, { paddingRight: 48 }]} placeholder="Password" placeholderTextColor="#888" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(!rememberMe)}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
            {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.rememberText}>Remember me</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.85}>
          <Text style={styles.loginBtnText}>Log In</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <Text style={styles.contactText}>
          Having trouble? Contact <Text style={styles.link}>SETU Admin</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 },
  logoCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  logoSubText: { fontSize: 16, color: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111', marginBottom: 28 },
  inputWrapper: { width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e2e2e2', borderRadius: 14, marginBottom: 14, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, color: '#222' },
  eyeBtn: { position: 'absolute', right: 14, padding: 4 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 24, marginTop: 4 },
  checkbox: { width: 22, height: 22, borderWidth: 1.5, borderColor: '#ccc', borderRadius: 5, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  rememberText: { fontSize: 14, color: '#222' },
  loginBtn: { width: '100%', backgroundColor: '#2563EB', paddingVertical: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginBottom: 16 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  contactText: { fontSize: 14, color: '#888', marginTop: 8 },
  link: { color: '#2563EB', fontWeight: 'bold' },
});

export default LoginScreen;
