import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { usePatientStore } from '../lib/PatientStore';

interface CaseEntry {
  token: number;
  patient: { id: string; name: string; gender: string; age: number };
  symptoms: string[];
  notes: string;
}

const RegistrationDesk = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { patients: allPatients, searchPatients } = usePatientStore();
  const locState = (route.params as any) || {};
  const opdId = locState.opdId || 'OPD-RAMAGRI-250622';

  const [cases, setCases] = useState<CaseEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<typeof allPatients>([]);

  const totalCases = cases.length;
  const inQueue = cases.length;

  // Search via API when term changes
  useEffect(() => {
    if (search.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const apiResults = await searchPatients(search.trim());
      if (apiResults.length > 0) {
        setSearchResults(apiResults);
      } else {
        // Fallback to local filter
        setSearchResults(
          allPatients.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
        );
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, allPatients, searchPatients]);

  const filtered = searchResults;

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Registration Desk</Text>
          <Text style={styles.headerSub}>{opdId}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Status Banner */}
      <View style={styles.bannerContainer}>
        <View style={styles.banner}>
          <View style={styles.bannerTop}>
            <View style={styles.bannerTopLeft}>
              <View style={styles.pulseDot} />
              <Text style={styles.bannerLabel}>Ready for Vitals</Text>
            </View>
            <View style={styles.bannerBadge}>
              <Text style={styles.bannerBadgeNum}>{inQueue} </Text>
              <Text style={styles.bannerBadgeText}>In Queue</Text>
            </View>
          </View>
          <View style={styles.bannerStats}>
            <View style={styles.bannerStat}>
              <View style={[styles.bannerBar, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
              <View>
                <Text style={styles.bannerStatNum}>{totalCases}</Text>
                <Text style={styles.bannerStatLabel}>Todays Total Case</Text>
              </View>
            </View>
            <View style={styles.bannerStat}>
              <View style={[styles.bannerBar, { backgroundColor: '#FCA5A5' }]} />
              <View>
                <Text style={styles.bannerStatNum}>{totalCases}</Text>
                <Text style={styles.bannerStatLabel}>Marked for Vitals</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Cases List or Empty State */}
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }}>
        {cases.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <View style={styles.emptyLine} />
              <View style={[styles.emptyLine, { width: 50 }]} />
            </View>
            <Text style={styles.emptyTitle}>No Cases Created Yet</Text>
            <Text style={styles.emptySub}>Start by creating a new case to begin today's OPD.</Text>
          </View>
        ) : (
          <View style={styles.casesList}>
            {cases.map((c, i) => (
              <View key={i} style={styles.caseItem}>
                <View style={styles.caseToken}>
                  <Text style={styles.caseTokenText}>{c.token}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.caseName}>{c.patient.name}</Text>
                  <Text style={styles.caseSub}>{c.patient.id} • {c.patient.gender} • {c.patient.age} Yrs</Text>
                </View>
                <Ionicons name="ellipsis-vertical" size={18} color="#999" />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.outlineBtn} onPress={() => navigation.navigate('RegisterPatient' as never)}>
          <Ionicons name="person-add-outline" size={18} color="#111" />
          <Text style={styles.outlineBtnText}>Register New</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => { setSearch(''); setModalOpen(true); }}>
          <MaterialCommunityIcons name="clipboard-plus-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>New Case</Text>
        </TouchableOpacity>
      </View>

      {/* New Case Modal */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>New Patient Case</Text>
                <Text style={styles.modalSub}>Search for an existing patient or register a new one to create a case.</Text>
              </View>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Ionicons name="close" size={22} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search patient name..."
                placeholderTextColor="#999"
                value={search}
                onChangeText={setSearch}
                maxLength={100}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close" size={18} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {search.trim().length > 0 && (
              <Text style={styles.searchCount}>{filtered.length} patients found</Text>
            )}

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item: patient }) => (
                <TouchableOpacity
                  style={styles.patientItem}
                  onPress={() => {
                    setModalOpen(false);
                    (navigation as any).navigate('StartPatientVisit', { patient });
                  }}
                >
                  <View style={styles.patientAvatar}>
                    <Text style={styles.patientAvatarText}>{getInitials(patient.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{patient.name}</Text>
                    <Text style={styles.patientSub}>{patient.id} • {patient.gender} • {patient.age} Yrs</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </TouchableOpacity>
              )}
            />

            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>Didn't found the patient you are looking for?</Text>
              <TouchableOpacity onPress={() => { setModalOpen(false); navigation.navigate('RegisterPatient' as never); }}>
                <Text style={styles.modalFooterLink}>Go Register New Patient</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5', overflow: 'hidden' as any },
  header: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  headerSub: { fontSize: 13, color: '#999', marginTop: 2 },
  bannerContainer: { paddingHorizontal: 20, paddingTop: 20 },
  banner: { backgroundColor: '#B91C1C', borderRadius: 14, padding: 16 },
  bannerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bannerTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FCA5A5' },
  bannerLabel: { color: '#fff', fontWeight: '600', fontSize: 15 },
  bannerBadge: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' },
  bannerBadgeNum: { color: '#B91C1C', fontWeight: 'bold', fontSize: 14 },
  bannerBadgeText: { color: '#B91C1C', fontSize: 11 },
  bannerStats: { flexDirection: 'row' },
  bannerStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerBar: { width: 3, height: 32, borderRadius: 2 },
  bannerStatNum: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  bannerStatLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  scroll: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 24, gap: 8 },
  emptyLine: { width: 60, height: 8, backgroundColor: '#e5e5e5', borderRadius: 4 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#999', textAlign: 'center' },
  casesList: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  caseItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12 },
  caseToken: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e5e5', alignItems: 'center', justifyContent: 'center' },
  caseTokenText: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  caseName: { fontSize: 15, fontWeight: '600', color: '#111' },
  caseSub: { fontSize: 12, color: '#999', marginTop: 2 },
  bottomBar: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  outlineBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 14, paddingVertical: 14 },
  outlineBtnText: { fontSize: 15, fontWeight: '600', color: '#111' },
  primaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 14 },
  primaryBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  modalSub: { fontSize: 13, color: '#999', marginTop: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#2563EB', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 15, color: '#111', padding: 0 },
  searchCount: { color: '#2563EB', fontSize: 13, fontWeight: '500', marginBottom: 8 },
  patientItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12 },
  patientAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(37,99,235,0.1)', alignItems: 'center', justifyContent: 'center' },
  patientAvatarText: { fontSize: 13, fontWeight: 'bold', color: '#2563EB' },
  patientName: { fontSize: 15, fontWeight: '600', color: '#111' },
  patientSub: { fontSize: 12, color: '#999', marginTop: 2 },
  modalFooter: { alignItems: 'center', paddingTop: 20, paddingBottom: 8 },
  modalFooterText: { fontSize: 13, color: '#999' },
  modalFooterLink: { color: '#2563EB', fontWeight: '600', fontSize: 13, marginTop: 4 },
});

export default RegistrationDesk;
