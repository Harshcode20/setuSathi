import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';
import { usePatientStore } from '../lib/PatientStore';

const colors = [
  { bg: 'rgba(37,99,235,0.15)', text: '#2563EB' },
  { bg: 'rgba(13,148,136,0.15)', text: '#0D9488' },
  { bg: 'rgba(249,115,22,0.15)', text: '#F97316' },
  { bg: 'rgba(245,158,11,0.15)', text: '#D97706' },
  { bg: 'rgba(101,163,13,0.15)', text: '#65A30D' },
];

const PatientRecord = () => {
  const navigation = useNavigation();
  const { patients: allPatients } = usePatientStore();
  const [search, setSearch] = useState('');

  const filtered = search.trim().length > 0
    ? allPatients.filter((p) =>
        p.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        p.id.toLowerCase().includes(search.trim().toLowerCase())
      )
    : allPatients;

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Patient Records</Text>
        <Text style={styles.headerSub}>{allPatients.length} patients registered</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or ID..."
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
      </View>

      {/* Results count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {search.trim() ? `${filtered.length} results found` : 'All patients'}
        </Text>
      </View>

      {/* Patient List */}
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.listCard}>
          {filtered.map((patient, i) => {
            const color = colors[i % colors.length];
            return (
              <TouchableOpacity key={patient.id} style={styles.listItem} activeOpacity={0.7}>
                <View style={[styles.avatar, { backgroundColor: color.bg }]}>
                  <Text style={[styles.avatarText, { color: color.text }]}>{getInitials(patient.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{patient.name}</Text>
                  <Text style={styles.itemSub}>{patient.id} • {patient.gender} • {patient.age} Yrs</Text>
                  <Text style={styles.itemSub}>{patient.village} • Last: {patient.lastVisit}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#999" />
              </TouchableOpacity>
            );
          })}
        </View>

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No patients found</Text>
            <Text style={styles.emptySub}>Try a different search term</Text>
          </View>
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5', overflow: 'hidden' as any },
  header: { backgroundColor: '#2563EB', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 24 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  searchContainer: { paddingHorizontal: 20, marginTop: -14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, fontSize: 14, color: '#111', padding: 0 },
  countRow: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  countText: { fontSize: 13, color: '#999' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  listCard: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: 'bold' },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111' },
  itemSub: { fontSize: 11, color: '#999', marginTop: 1 },
  emptyState: { alignItems: 'center', paddingTop: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#999' },
  emptySub: { fontSize: 13, color: '#999', marginTop: 4 },
});

export default PatientRecord;
