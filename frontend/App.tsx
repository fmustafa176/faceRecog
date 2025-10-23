// frontend/App.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

// Screens
import AttendanceScreen from './src/components/AttendanceScreen';
import AttendanceSheetScreen from './src/components/AttendanceSheetScreen';
import HomeScreen from './src/components/HomeScreen';
import RegisterStudentScreen from './src/components/RegisterStudentScreen';

// Types
export type RootStackParamList = {
  Home: undefined;
  RegisterStudent: undefined;
  Attendance: undefined;
  AttendanceSheet: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2f95dc',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ title: 'Face Attendance' }}
        />
        <Stack.Screen 
          name="RegisterStudent" 
          component={RegisterStudentScreen}
          options={{ title: 'Register Student' }}
        />
        <Stack.Screen 
          name="Attendance" 
          component={AttendanceScreen}
          options={{ title: 'Mark Attendance' }}
        />
        <Stack.Screen 
          name="AttendanceSheet" 
          component={AttendanceSheetScreen}
          options={{ title: 'Attendance Records' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}