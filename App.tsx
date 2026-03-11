/**
 * Setu Sathi React Native App
 *
 * @format
 */

import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PatientProvider } from './src/lib/PatientStore';
import { ToastProvider } from './src/components/Toast';
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
import IndexScreen from './src/pages/Index';
import NotFoundScreen from './src/pages/NotFound';

const Stack = createStackNavigator();

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <PatientProvider>
      <ToastProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false, cardStyle: { flex: 1 } }}>
          <Stack.Screen name="Login" component={LoginScreen} />
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
          <Stack.Screen name="Index" component={IndexScreen} />
          <Stack.Screen name="NotFound" component={NotFoundScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      </ToastProvider>
      </PatientProvider>
    </SafeAreaProvider>
  );
}

export default App;
