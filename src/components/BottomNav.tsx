import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const tabs = [
  { name: 'Dashboard', icon: 'home-outline' as const, activeIcon: 'home' as const, route: 'Dashboard' },
  { name: 'Records', icon: 'people-outline' as const, activeIcon: 'people' as const, route: 'PatientRecord' },
];

const BottomNav = () => {
  const navigation = useNavigation();
  const route = useRoute();

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = route.name === tab.route;
        return (
          <TouchableOpacity key={tab.name} style={styles.tab} onPress={() => navigation.navigate(tab.route as never)} activeOpacity={0.7}>
            <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={24} color={isActive ? '#2563EB' : '#888'} />
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e5e5', paddingBottom: 20, paddingTop: 10 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 11, color: '#888', marginTop: 2 },
  tabTextActive: { color: '#2563EB', fontWeight: '600' },
});

export default BottomNav;
