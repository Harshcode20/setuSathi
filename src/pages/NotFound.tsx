import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const NotFound = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.root}>
      <Text style={styles.code}>404</Text>
      <Text style={styles.title}>Page not found</Text>
      <Text style={styles.sub}>Sorry, we couldn't find the page you're looking for.</Text>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Dashboard' as never)} activeOpacity={0.85}>
        <Ionicons name="arrow-back" size={18} color="#fff" />
        <Text style={styles.btnText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingHorizontal: 32 },
  code: { fontSize: 64, fontWeight: 'bold', color: '#2563EB', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  sub: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 24 },
  btn: { backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

export default NotFound;
