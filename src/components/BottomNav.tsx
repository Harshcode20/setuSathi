import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/AuthContext';
import { usePreferences } from '../lib/PreferencesContext';

const BottomNav = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userProfile } = useAuth();
  const { t, colors } = usePreferences();

  const homeRoute = userProfile?.role === 'doctor' ? 'DoctorDashboard' : 'Dashboard';

  const tabs = [
    { name: t('nav.home'), icon: 'home-outline' as const, activeIcon: 'home' as const, route: homeRoute },
    { name: t('nav.records'), icon: 'people-outline' as const, activeIcon: 'people' as const, route: 'PatientRecord' },
    { name: t('nav.settings'), icon: 'settings-outline' as const, activeIcon: 'settings' as const, route: 'Settings' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {tabs.map((tab) => {
        const isActive = route.name === tab.route;
        return (
          <TouchableOpacity key={tab.name} style={styles.tab} onPress={() => navigation.navigate(tab.route as never)} activeOpacity={0.7}>
            <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={24} color={isActive ? '#2563EB' : '#888'} />
            <Text style={[styles.tabText, { color: colors.mutedText }, isActive && styles.tabTextActive]}>{tab.name}</Text>
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
