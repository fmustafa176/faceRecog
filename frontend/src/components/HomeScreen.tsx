// frontend/src/components/HomeScreen.tsx
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { RootStackParamList } from '../../App';
import { apiService } from '../services/api';
import { COLORS, STRINGS } from '../utils/constants';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList, 
  'Home'
>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleHealthCheck = async () => {
    try {
      const result = await apiService.checkHealth();
      if (result.success) {
        Alert.alert('Server Status', '✅ Backend server is connected and healthy');
      } else {
        Alert.alert('Server Status', '❌ Backend server is not responding');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to server');
    }
  };

  const handleMarkAttendance = () => {
    navigation.navigate('Attendance');
  };

  const handleRegisterStudent = () => {
    navigation.navigate('RegisterStudent');
  };

  const handleViewRecords = () => {
    navigation.navigate('AttendanceSheet');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{STRINGS.HOME.TITLE}</Text>
        <Text style={styles.subtitle}>
          Face recognition attendance system
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {/* Mark Attendance Button */}
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={handleMarkAttendance}
        >
          <Text style={styles.buttonText}>
            {STRINGS.HOME.ATTENDANCE_BUTTON}
          </Text>
          <Text style={styles.buttonSubtext}>
            Real-time face recognition for attendance
          </Text>
        </TouchableOpacity>

        {/* Register Student Button */}
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={handleRegisterStudent}
        >
          <Text style={styles.buttonText}>
            {STRINGS.HOME.REGISTER_BUTTON}
          </Text>
          <Text style={styles.buttonSubtext}>
            Add new students to the system
          </Text>
        </TouchableOpacity>

        {/* View Records Button */}
        <TouchableOpacity 
          style={[styles.button, styles.tertiaryButton]}
          onPress={handleViewRecords}
        >
          <Text style={styles.buttonText}>
            {STRINGS.HOME.RECORDS_BUTTON}
          </Text>
          <Text style={styles.buttonSubtext}>
            Check attendance history and records
          </Text>
        </TouchableOpacity>

        {/* Health Check Button */}
        <TouchableOpacity 
          style={[styles.button, styles.infoButton]}
          onPress={handleHealthCheck}
        >
          <Text style={styles.buttonText}>
            Check Server Status
          </Text>
          <Text style={styles.buttonSubtext}>
            Verify backend connection
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    backgroundColor: COLORS.CARD,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  primaryButton: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  secondaryButton: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.SECONDARY,
  },
  tertiaryButton: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.WARNING,
  },
  infoButton: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.TEXT_SECONDARY,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
});

export default HomeScreen;