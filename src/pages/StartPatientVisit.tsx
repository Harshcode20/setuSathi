import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { opdService } from '../lib/api';
import { usePreferences } from '../lib/PreferencesContext';

const symptomCategories = [
  {
    title: '1. Physical Discomfort',
    items: [
      { id: '1.1', label: 'શરીરનો દુઃખાવો' },
      { id: '1.2', label: 'સાંધાનો દુઃખાવો' },
      { id: '1.3', label: 'ગળામાં દુઃખે' },
      { id: '1.4', label: 'માથું દુઃખે' },
      { id: '1.5', label: 'છાતીમાં દુઃખે' },
    ],
  },
  {
    title: '2. Fever, Cold & Cough',
    items: [
      { id: '2.1', label: 'તાવ' },
      { id: '2.2', label: 'ઉધરસ' },
      { id: '2.3', label: 'શરદી' },
      { id: '2.4', label: 'ઠંડી લાગે' },
    ],
  },
  {
    title: '3. Other Symptoms',
    items: [
      { id: '3.1', label: 'ખંજવાળ' },
      { id: '3.2', label: 'ફોડલા' },
      { id: '3.3', label: 'ગુંડાં' },
      { id: '3.4', label: 'સોજો' },
      { id: '3.5', label: 'પેશાબ' },
      { id: '3.6', label: 'કબજિયાત' },
      { id: '3.7', label: 'ઉલટી' },
      { id: '3.8', label: 'ગાઢા' },
      { id: '3.9', label: 'આંખ' },
      { id: '3.10', label: 'કાન' },
    ],
  },
  {
    title: '4. Vital & Functional Issues',
    items: [
      { id: '4.1', label: 'ચક્કર' },
      { id: '4.2', label: 'અશક્તિ' },
      { id: '4.3', label: 'ભૂખ' },
      { id: '4.4', label: 'શ્વાસ' },
    ],
  },
];

const StartPatientVisit = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t, colors } = usePreferences();
  const { patient, opdPin, nextToken } = (route.params as any) || {};
  const patientData = patient as { id: string; name: string; gender: string; age: number } | undefined;

  useEffect(() => {
    if (!patientData) {
      Alert.alert(t('Patient not found'), t('Please select a patient from registration desk.'));
      navigation.goBack();
    }
  }, [patientData, navigation, t]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');

  if (!patientData) {
    return <View style={[styles.root, { backgroundColor: colors.surface }]} />;
  }

  const toggleSymptom = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  };

  const handleGenerateToken = async () => {
    if (!opdPin) {
      Alert.alert(t('Unable to Create Case'), t('No active OPD PIN found. Please start or join an OPD session first.'));
      return;
    }

    const fallbackToken = Math.floor(1 + Math.random() * 99);
    const baseToken = Number(nextToken) > 0 ? Number(nextToken) : fallbackToken;
    let token = baseToken;
    const selectedComplaints = symptomCategories
      .flatMap((category) => category.items)
      .filter((item) => selected.has(item.id))
      .map((item) => item.label);
    const registrationNotes = notes.trim();

    const enqueueWithToken = async (requestedToken: number) => {
      await opdService.addPatientToSession(opdPin, {
        id: patientData.id,
        name: patientData.name,
        gender: patientData.gender,
        age: patientData.age,
        token: requestedToken,
        complaints: selectedComplaints,
        registrationNotes,
      });
      return requestedToken;
    };

    try {
      token = await enqueueWithToken(token);
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase();
      const tokenConflict = msg.includes('token already exists') || msg.includes('409');

      if (!tokenConflict) {
        Alert.alert(t('Unable to Create Case'), err?.message || t('Could not add patient to OPD queue.'));
        return;
      }

      try {
        const latestSession = await opdService.joinByPin(opdPin);
        const nextAvailableToken = latestSession
          ? latestSession.patients.reduce((maxToken, queuedPatient) => {
              const queuedToken = Number(queuedPatient.token) || 0;
              return queuedToken > maxToken ? queuedToken : maxToken;
            }, 0) + 1
          : token + 1;

        token = await enqueueWithToken(nextAvailableToken);
      } catch (retryErr: any) {
        Alert.alert(t('Unable to Create Case'), retryErr?.message || t('Could not add patient to OPD queue.'));
        return;
      }
    }

    Alert.alert(`${t('Token')} #${token} ${t('Generated')}`, `${t('Patient')} ${patientData.name} ${t('has been registered with')} ${selected.size} ${t('symptom(s).')}`);
    navigation.goBack();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('Start Patient Visit')}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Patient Info Card */}
      <View style={[styles.patientCard, { backgroundColor: colors.surface }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.patientLabel, { color: colors.mutedText }]}>{t('Patient Info.')}</Text>
          <Text style={[styles.patientId, { color: colors.mutedText }]}>{patientData.id}</Text>
          <Text style={[styles.patientName, { color: colors.text }]}>{patientData.name}</Text>
          <Text style={[styles.patientSub, { color: colors.mutedText }]}>{patientData.gender} • {patientData.age} Yrs</Text>
        </View>
        <View style={styles.patientAvatar}>
          <Text style={styles.patientAvatarText}>{getInitials(patientData.name)}</Text>
        </View>
      </View>

      {/* Symptoms */}
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }}>
        {symptomCategories.map((cat) => (
          <View key={cat.title} style={styles.catSection}>
            <Text style={styles.catTitle}>{cat.title}</Text>
            <View style={styles.symptomsGrid}>
              {cat.items.map((item) => {
                const isSelected = selected.has(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.symptomBtn, isSelected && styles.symptomBtnActive]}
                    onPress={() => toggleSymptom(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.symptomText}>
                      <Text style={styles.symptomId}>{item.id} </Text>{item.label}
                    </Text>
                    <View style={[styles.symptomCheck, isSelected && styles.symptomCheckActive]}>
                      {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Additional Notes */}
        <View style={styles.notesBox}>
          <Ionicons name="list-outline" size={18} color="#999" style={{ marginTop: 2 }} />
          <TextInput
            style={styles.notesInput}
            placeholder={t('Additional Notes')}
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={500}
          />
        </View>
      </ScrollView>

      {/* Generate Token Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.tokenBtn, selected.size === 0 && styles.tokenBtnDisabled]}
          disabled={selected.size === 0}
          onPress={handleGenerateToken}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={styles.tokenBtnText}>{t('Generate Token')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', overflow: 'hidden' as any },
  header: { backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  patientCard: { marginHorizontal: 20, marginTop: 16, backgroundColor: '#fff', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  patientLabel: { fontSize: 11, color: '#999' },
  patientId: { fontSize: 11, color: '#999' },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#111', marginTop: 2 },
  patientSub: { fontSize: 13, color: '#999', marginTop: 2 },
  patientAvatar: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e5e5', alignItems: 'center', justifyContent: 'center' },
  patientAvatarText: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  scroll: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  catSection: { marginBottom: 24 },
  catTitle: { fontSize: 15, fontWeight: 'bold', color: '#111', marginBottom: 12 },
  symptomsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  symptomBtn: { width: '48%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#e5e5e5', backgroundColor: '#fff' },
  symptomBtnActive: { borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.1)' },
  symptomText: { fontSize: 13, color: '#111', flex: 1 },
  symptomId: { color: '#999' },
  symptomCheck: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center' },
  symptomCheckActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  notesBox: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 14, padding: 12, gap: 8, marginBottom: 16 },
  notesInput: { flex: 1, fontSize: 14, color: '#111', minHeight: 80, textAlignVertical: 'top', padding: 0 },
  bottomBar: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  tokenBtn: { backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  tokenBtnDisabled: { opacity: 0.4 },
  tokenBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default StartPatientVisit;
