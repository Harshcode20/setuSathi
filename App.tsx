/**
 * Setu Sathi React Native App
 *
 * @format
 */

import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PatientProvider } from './src/lib/PatientStore';
import { ToastProvider } from './src/components/Toast';
import { AuthProvider, useAuth } from './src/lib/AuthContext';
import { PreferencesProvider, usePreferences } from './src/lib/PreferencesContext';
import LoginScreen from './src/pages/Login';
import DashboardScreen from './src/pages/Dashboard';
import RegisterPatientScreen from './src/pages/RegisterPatient';
import StartOPDScreen from './src/pages/StartOPD';
import OPDStartedScreen from './src/pages/OPDStarted';
import RegistrationDeskScreen from './src/pages/RegistrationDesk';
import StartPatientVisitScreen from './src/pages/StartPatientVisit';
import VitalsDeskScreen from './src/pages/VitalsDesk';
import DoctorAssistantScreen from './src/pages/DoctorAssistant';
import MedicineCounterScreen from './src/pages/MedicineCounter';
import PatientRecordScreen from './src/pages/PatientRecord';
import NotFoundScreen from './src/pages/NotFound';
import RegisterScreen from './src/pages/Register';
import DoctorDashboardScreen from './src/pages/DoctorDashboard';
import DoctorOPDSessionScreen from './src/pages/DoctorOPDSession';
import ConsultingPatientScreen from './src/pages/ConsultingPatient';
import SettingsScreen from './src/pages/Settings';

const Stack = createStackNavigator();

/** Auth-aware navigator: session/profile state drives which screens are shown */
function RootNavigator() {
  const { user, loading, userProfile } = useAuth();

  if (loading) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { flex: 1 } }}>
      {!user ? (
        // Not logged in — show auth screens
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : userProfile?.role === 'doctor' ? (
        // Logged in as Doctor — show doctor stack
        <>
          <Stack.Screen name="DoctorDashboard" component={DoctorDashboardScreen} />
          <Stack.Screen name="DoctorOPDSession" component={DoctorOPDSessionScreen} />
          <Stack.Screen name="ConsultingPatient" component={ConsultingPatientScreen} />
          <Stack.Screen name="PatientRecord" component={PatientRecordScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="NotFound" component={NotFoundScreen} />
        </>
      ) : (
        // Logged in as Volunteer — show volunteer stack
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="RegisterPatient" component={RegisterPatientScreen} />
          <Stack.Screen name="StartOPD" component={StartOPDScreen} />
          <Stack.Screen name="OPDStarted" component={OPDStartedScreen} />
          <Stack.Screen name="RegistrationDesk" component={RegistrationDeskScreen} />
          <Stack.Screen name="StartPatientVisit" component={StartPatientVisitScreen} />
          <Stack.Screen name="VitalsDesk" component={VitalsDeskScreen} />
          <Stack.Screen name="DoctorAssistant" component={DoctorAssistantScreen} />
          <Stack.Screen name="MedicineCounter" component={MedicineCounterScreen} />
          <Stack.Screen name="PatientRecord" component={PatientRecordScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="NotFound" component={NotFoundScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const loadingStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
});

function AppShell() {
  const { theme } = usePreferences();

  return (
    <>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <AuthProvider>
        <PreferencesProvider>
          <PatientProvider>
            <ToastProvider>
              <AppShell />
            </ToastProvider>
          </PatientProvider>
        </PreferencesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
