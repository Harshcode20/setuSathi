import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Image, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { usePatientStore } from '../lib/PatientStore';
import { useToast } from '../components/Toast';
import { usePreferences } from '../lib/PreferencesContext';

const RegisterPatient = () => {
  const navigation = useNavigation();
  const { addPatient } = usePatientStore();
  const toast = useToast();
  const { t, colors } = usePreferences();

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');
  const [noDob, setNoDob] = useState(false);
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const isMobileValid = /^\d{10}$/.test(mobile.trim());
  const isFormValid =
    !!photoUri
    && fullName.trim().length > 0
    && (dob.length > 0 || (noDob && age.trim().length > 0))
    && mobile.trim().length > 0
    && isMobileValid
    && address.trim().length > 0;

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('Permission needed'), t('Please allow access to your photo library.'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const calculateAge = (date: Date) => {
    const today = new Date();
    let a = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) a--;
    return a.toString();
  };

  const handleDateSelect = (day: number) => {
    if (!tempYear || !tempMonth) return;
    const date = new Date(parseInt(tempYear), parseInt(tempMonth) - 1, day);
    setSelectedDate(date);
    setDob(formatDate(date));
    setAge(calculateAge(date));
    setShowDatePicker(false);
  };

  const [tempMonth, setTempMonth] = useState((new Date().getMonth() + 1).toString());
  const [tempYear, setTempYear] = useState(new Date().getFullYear().toString());

  const getDaysInMonth = (month: number, year: number) => new Date(year, month, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month - 1, 1).getDay();

  const handleSubmit = async () => {
    if (!photoUri) {
      Alert.alert(t('Error'), 'Patient Photo field is necessary.');
      return;
    }
    if (!fullName.trim()) {
      Alert.alert(t('Error'), 'Full Name field is necessary.');
      return;
    }
    if (!dob && !noDob) {
      Alert.alert(t('Error'), 'Date of Birth field is necessary.');
      return;
    }
    if (noDob && !age.trim()) {
      Alert.alert(t('Error'), 'Age field is necessary.');
      return;
    }
    if (!mobile.trim()) {
      Alert.alert(t('Error'), 'Mobile Number field is necessary.');
      return;
    }
    if (!isMobileValid) {
      Alert.alert(t('Error'), 'Mobile Number should be 10 digit.');
      return;
    }
    if (!address.trim()) {
      Alert.alert(t('Error'), 'Address field is necessary.');
      return;
    }

    const today = new Date();
    const lastVisit = today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    try {
      await addPatient({
        name: fullName.trim(),
        gender: gender === 'male' ? 'Male' : 'Female',
        age: parseInt(age) || 0,
        dob: dob || undefined,
        mobile: mobile || undefined,
        address: address || undefined,
        photoUri: photoUri || undefined,
        lastVisit,
      });
      toast.show(`✅ ${t('Patient registered successfully!')}`);
      setTimeout(() => navigation.navigate('Dashboard' as never), 600);
    } catch (err: any) {
      Alert.alert(t('Registration Failed'), err?.message || t('Could not register patient. Please try again.'));
    }
  };

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.surface }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('Register New Patient')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#111" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        {/* Patient Identity */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Patient Identity')}</Text>

          <View style={styles.labelRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Patient Photo</Text>
            <Text style={styles.requiredMark}>*</Text>
          </View>

          {/* Photo picker */}
          <TouchableOpacity style={styles.photoRow} onPress={pickPhoto} activeOpacity={0.7}>
            <View style={styles.photoCircle}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoImage} />
              ) : (
                <Ionicons name="camera" size={28} color="#2563EB" />
              )}
            </View>
            <View>
              <Text style={styles.photoLabel}>{photoUri ? t('Change Photo') : t('Add Patient Photo')}</Text>
              <Text style={styles.photoHint}>{photoUri ? t('Tap to change photo') : t('Tap to upload patient photo')}</Text>
            </View>
          </TouchableOpacity>

          {/* Full Name */}
          <View style={styles.labelRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('Full Name (as per ID)')}</Text>
            <Text style={styles.requiredMark}>*</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder={t('Full Name (as per ID)')}
            placeholderTextColor="#999"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* Demographic Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Demographic Details')}</Text>

          <View style={styles.labelRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Gender</Text>
            <Text style={styles.requiredMark}>*</Text>
          </View>

          {/* Gender Toggle */}
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'male' && styles.genderActive]}
              onPress={() => setGender('male')}
            >
              <Text style={styles.genderEmoji}>👦</Text>
              <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>{t('Male')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'female' && styles.genderActive]}
              onPress={() => setGender('female')}
            >
              <Text style={styles.genderEmoji}>👧</Text>
              <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>{t('Female')}</Text>
            </TouchableOpacity>
          </View>

          {/* Date of birth & Age */}
          <View style={styles.labelRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('Date of Birth')}</Text>
            <Text style={styles.requiredMark}>*</Text>
          </View>
          <View style={styles.dobRow}>
            <TouchableOpacity
              style={[styles.input, { flex: 1, opacity: noDob ? 0.5 : 1, flexDirection: 'row', alignItems: 'center' }]}
              onPress={() => { if (!noDob) setShowDatePicker(true); }}
              disabled={noDob}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={18} color="#2563EB" style={{ marginRight: 10 }} />
              <Text style={{ fontSize: 15, color: dob ? '#111' : '#999' }}>
                {dob || t('Date of Birth')}
              </Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { width: 80, marginLeft: 10, opacity: noDob ? 1 : 0.5 }]}
              placeholder="Age"
              placeholderTextColor="#999"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              editable={noDob}
            />
          </View>

          {/* No DOB checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => {
              setNoDob(!noDob);
              if (!noDob) setDob(''); else setAge('');
            }}
          >
            <View style={[styles.checkbox, noDob && styles.checkboxChecked]}>
              {noDob && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>Patient does not know their date of birth</Text>
          </TouchableOpacity>
        </View>

        {/* Contact and Address */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Contact and Address')}</Text>

          <View style={styles.labelRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('Mobile Number')}</Text>
            <Text style={styles.requiredMark}>*</Text>
          </View>

          {/* Mobile */}
          <View style={styles.iconInput}>
            <Ionicons name="phone-portrait-outline" size={18} color="#999" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.iconInputField}
              placeholder={t('Mobile Number')}
              placeholderTextColor="#999"
              value={mobile}
              onChangeText={(value) => setMobile(value.replace(/\D/g, '').slice(0, 10))}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          <View style={styles.labelRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>{t('Address')}</Text>
            <Text style={styles.requiredMark}>*</Text>
          </View>

          {/* Address */}
          <View style={styles.iconInput}>
            <Ionicons name="location-outline" size={18} color="#999" style={{ marginRight: 10, marginTop: 2 }} />
            <TextInput
              style={[styles.iconInputField, { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder={t('Address')}
              placeholderTextColor="#999"
              value={address}
              onChangeText={setAddress}
              multiline
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.submitBtn, !isFormValid && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid}
          activeOpacity={0.85}
        >
          <Ionicons name="person-add-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.submitBtnText}>{t('Register Patient')}</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Modal */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <TouchableOpacity style={styles.calOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.calSheet}>
            <View style={styles.calHeader}>
              <Text style={styles.calTitle}>{t('Select Date of Birth')}</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Month/Year selectors */}
            <View style={styles.calNav}>
              <TouchableOpacity onPress={() => {
                let m = parseInt(tempMonth) - 1;
                let y = parseInt(tempYear);
                if (m < 1) { m = 12; y--; }
                setTempMonth(m.toString());
                setTempYear(y.toString());
              }}>
                <Ionicons name="chevron-back" size={22} color="#2563EB" />
              </TouchableOpacity>

              <View style={styles.calMonthYear}>
                <Text style={styles.calMonthText}>
                  {new Date(parseInt(tempYear), parseInt(tempMonth) - 1).toLocaleString('default', { month: 'long' })}
                </Text>
                <Text style={styles.calYearText}>{tempYear}</Text>
              </View>

              <TouchableOpacity onPress={() => {
                let m = parseInt(tempMonth) + 1;
                let y = parseInt(tempYear);
                if (m > 12) { m = 1; y++; }
                setTempMonth(m.toString());
                setTempYear(y.toString());
              }}>
                <Ionicons name="chevron-forward" size={22} color="#2563EB" />
              </TouchableOpacity>
            </View>

            {/* Year quick-jump */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calYearScroll} contentContainerStyle={{ paddingHorizontal: 8 }}>
              {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.calYearPill, tempYear === y.toString() && styles.calYearPillActive]}
                  onPress={() => setTempYear(y.toString())}
                >
                  <Text style={[styles.calYearPillText, tempYear === y.toString() && styles.calYearPillTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Day-of-week headers */}
            <View style={styles.calWeekRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <Text key={d} style={styles.calWeekDay}>{d}</Text>
              ))}
            </View>

            {/* Day grid */}
            <View style={styles.calGrid}>
              {Array.from({ length: getFirstDayOfMonth(parseInt(tempMonth), parseInt(tempYear)) }).map((_, i) => (
                <View key={`e-${i}`} style={styles.calDayCell} />
              ))}
              {Array.from({ length: getDaysInMonth(parseInt(tempMonth), parseInt(tempYear)) }, (_, i) => i + 1).map((day) => {
                const isToday = selectedDate &&
                  selectedDate.getDate() === day &&
                  selectedDate.getMonth() + 1 === parseInt(tempMonth) &&
                  selectedDate.getFullYear() === parseInt(tempYear);
                const isFuture = new Date(parseInt(tempYear), parseInt(tempMonth) - 1, day) > new Date();
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.calDayCell, isToday && styles.calDaySelected]}
                    onPress={() => { if (!isFuture) handleDateSelect(day); }}
                    disabled={isFuture}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.calDayText, isToday && styles.calDayTextSelected, isFuture && { color: '#ccc' }]}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', overflow: 'hidden' as any },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111' },
  scroll: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 20, marginHorizontal: 20, marginTop: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#111' },
  requiredMark: { color: '#DC2626', fontSize: 14, fontWeight: '700', marginLeft: 4 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  photoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e2e2e2', overflow: 'hidden' },
  photoImage: { width: 72, height: 72, borderRadius: 36 },
  photoLabel: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
  photoHint: { fontSize: 11, color: '#999', marginTop: 2 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#111' },
  section: { marginHorizontal: 20, marginTop: 24 },
  genderRow: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, borderColor: '#e5e5e5', overflow: 'hidden', marginBottom: 14 },
  genderBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, backgroundColor: '#fff', gap: 8 },
  genderActive: { backgroundColor: '#2563EB' },
  genderEmoji: { fontSize: 18 },
  genderText: { fontSize: 14, fontWeight: '600', color: '#999' },
  genderTextActive: { color: '#fff' },
  dobRow: { flexDirection: 'row', marginBottom: 10 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  checkboxLabel: { fontSize: 13, color: '#111' },
  iconInput: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 14 },
  iconInputField: { flex: 1, fontSize: 15, color: '#111', padding: 0 },
  bottomBar: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e5e5' },
  submitBtn: { backgroundColor: '#2563EB', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { backgroundColor: '#e5e5e5' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  // Calendar Modal styles
  calOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  calSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 30, maxHeight: '80%' as any },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  calTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  calNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 },
  calMonthYear: { alignItems: 'center' },
  calMonthText: { fontSize: 16, fontWeight: '600', color: '#111' },
  calYearText: { fontSize: 13, color: '#666', marginTop: 2 },
  calYearScroll: { maxHeight: 36, marginBottom: 10 },
  calYearPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f3f4f6', marginHorizontal: 3 },
  calYearPillActive: { backgroundColor: '#2563EB' },
  calYearPillText: { fontSize: 13, color: '#666', fontWeight: '500' },
  calYearPillTextActive: { color: '#fff' },
  calWeekRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 4 },
  calWeekDay: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#999' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  calDayCell: { width: '14.28%' as any, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calDayText: { fontSize: 15, color: '#111' },
  calDaySelected: { backgroundColor: '#2563EB', borderRadius: 20 },
  calDayTextSelected: { color: '#fff', fontWeight: 'bold' },
});

export default RegisterPatient;
