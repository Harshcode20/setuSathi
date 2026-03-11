import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const villages = ['Gediya', 'Ingrodi', 'Karela', 'Kherva', 'Limbad', 'Modhwana', 'Ramagri'];

const deskRoles = [
  { id: 'registration', label: 'Registration Desk', icon: 'clipboard-plus-outline' as const, color: '#EF4444' },
  { id: 'vitals', label: "Vital's Desk", icon: 'heart-pulse' as const, color: '#F97316' },
  { id: 'doctor', label: "Doctor's Assistant", icon: 'stethoscope' as const, color: '#65A30D' },
  { id: 'medicine', label: 'Medicine Counter', icon: 'pill' as const, color: '#0D9488' },
];

const StartOPD = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  const [village, setVillage] = useState('');
  const [deskRole, setDeskRole] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const handleStart = () => {
    (navigation as any).navigate('OPDStarted', { village, deskRole });
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step === 1 ? navigation.goBack() : setStep(1)}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Start OPD</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.stepLabel}>Step {step}/2</Text>

        {step === 1 ? (
          <>
            <Text style={styles.heading}>Select Village</Text>
            <Text style={styles.sub}>Select village where you are operating your OPD now</Text>

            <TouchableOpacity style={styles.selector} onPress={() => setModalVisible(true)}>
              <Ionicons name="location-outline" size={20} color="#999" />
              <Text style={[styles.selectorText, village ? { color: '#111' } : {}]}>
                {village || 'Select Village'}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#999" />
            </TouchableOpacity>

            {/* Village Picker Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Village</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Ionicons name="close" size={22} color="#999" />
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={villages}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.villageItem}
                        onPress={() => { setVillage(item); setModalVisible(false); }}
                      >
                        <Text style={styles.villageItemText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </View>
            </Modal>
          </>
        ) : (
          <>
            <Text style={styles.heading}>Select Your Desk Role</Text>
            <Text style={styles.sub}>Confirm the desk you're working on for this OPD.</Text>

            <View style={styles.deskGrid}>
              {deskRoles.map((desk) => (
                <TouchableOpacity
                  key={desk.id}
                  style={[styles.deskCard, deskRole === desk.id && styles.deskCardActive]}
                  onPress={() => setDeskRole(desk.id)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name={desk.icon} size={36} color={desk.color} />
                  <Text style={styles.deskLabel}>{desk.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        {step === 1 ? (
          <TouchableOpacity
            style={[styles.primaryBtn, !village && styles.primaryBtnDisabled]}
            disabled={!village}
            onPress={() => setStep(2)}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Continue to Desk Selection</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, !deskRole && styles.primaryBtnDisabled]}
            disabled={!deskRole}
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Start OPD</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', overflow: 'hidden' as any },
  header: { backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, gap: 12 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  stepLabel: { color: '#2563EB', fontWeight: '600', fontSize: 13, marginTop: 24, marginBottom: 4 },
  heading: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  sub: { color: '#999', fontSize: 13, marginBottom: 32 },
  selector: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16, gap: 10 },
  selectorText: { flex: 1, fontSize: 15, color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  villageItem: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  villageItemText: { fontSize: 16, fontWeight: '500', color: '#111' },
  deskGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  deskCard: { width: '47%', borderWidth: 2, borderColor: '#e5e5e5', borderRadius: 14, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#fff' },
  deskCardActive: { borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.05)' },
  deskLabel: { fontSize: 13, fontWeight: '500', color: '#111', textAlign: 'center' },
  bottomBar: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  primaryBtn: { backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default StartOPD;
