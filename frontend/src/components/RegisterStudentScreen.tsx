// frontend/src/components/RegisterStudentScreen.tsx
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RootStackParamList } from '../../App';
import { apiService } from '../services/api';
import { COLORS } from '../utils/constants';
import CameraComponent from './CameraComponent';
import StudentForm from './StudentForm';

type RegisterStudentScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'RegisterStudent'
>;

type ScreenState = 'form' | 'camera' | 'processing' | 'success' | 'error';

const RegisterStudentScreen: React.FC = () => {
  const navigation = useNavigation<RegisterStudentScreenNavigationProp>();
  const [screenState, setScreenState] = useState<ScreenState>('form');
  const [studentInfo, setStudentInfo] = useState<{ name: string; studentId: string } | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);

  const handleFormSubmit = (name: string, studentId: string) => {
    setStudentInfo({ name, studentId });
    setScreenState('camera');
  };

  const handleImagesCaptured = async (images: string[]) => {
    if (!studentInfo) return;

    setCapturedImages(images);
    setScreenState('processing');

    try {
      const result = await apiService.registerStudent(
        studentInfo.name,
        studentInfo.studentId,
        images
      );

      if (result.success && result.data) {
        setScreenState('success');
        
        Alert.alert(
          'Registration Successful',
          `Student ${studentInfo.name} registered with ${result.data.successful_embeddings} face embeddings.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        setScreenState('error');
        Alert.alert(
          'Registration Failed',
          result.error || 'Unknown error occurred'
        );
      }
    } catch (error) {
      setScreenState('error');
      Alert.alert(
        'Registration Failed',
        'An error occurred while registering the student'
      );
    }
  };

  const handleCameraCancel = () => {
    setScreenState('form');
    setStudentInfo(null);
  };

  const renderContent = () => {
    switch (screenState) {
      case 'form':
        return (
          <StudentForm
            onSubmit={handleFormSubmit}
            isLoading={false}
          />
        );

case 'camera':
  return (
    <CameraComponent
      {...({
        mode: "registration",
        onImagesCaptured: handleImagesCaptured,
        onCancel: handleCameraCancel,
        studentInfo: {
          name: studentInfo!.name,
          student_id: studentInfo!.studentId  // Change studentId to student_id
        }
      } as any)}
    />
  );

      case 'processing':
        return (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.processingText}>
              Processing {capturedImages.length} images...
            </Text>
            <Text style={styles.processingSubtext}>
              This may take a few moments
            </Text>
          </View>
        );

      case 'success':
        return (
          <View style={styles.centerContainer}>
            <Text style={styles.successText}>✅</Text>
            <Text style={styles.successTitle}>Registration Complete!</Text>
            <Text style={styles.successSubtext}>
              Student {studentInfo?.name} has been successfully registered.
            </Text>
          </View>
        );

      case 'error':
        return (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>❌</Text>
            <Text style={styles.errorTitle}>Registration Failed</Text>
            <Text style={styles.errorSubtext}>
              Please try again or check your connection.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginTop: 20,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 64,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtext: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 64,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.ERROR,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default RegisterStudentScreen;