// frontend/src/components/AttendanceScreen.tsx
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { RootStackParamList } from '../../App';
import { BatchAttendanceResult } from '../types';
import { COLORS, STRINGS } from '../utils/constants';
import CameraComponent from './CameraComponent';

type AttendanceScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Attendance'
>;

interface RecognizedStudent {
  student_id: string;
  name: string;
  confidence: number;
  timestamp: string;
  attendance_id: string;
}

const AttendanceScreen: React.FC = () => {
  const navigation = useNavigation<AttendanceScreenNavigationProp>();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [recognizedStudents, setRecognizedStudents] = useState<RecognizedStudent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAttendanceMarked = async (result: BatchAttendanceResult) => {
    if (!result.success || !result.attendance_marked) {
      if (result.message) {
        Alert.alert('Recognition Result', result.message);
      }
      return;
    }

    // Add recognized students to the list
    const newStudents: RecognizedStudent[] = result.recognized_students.map(student => ({
      student_id: student.student.student_id,
      name: student.student.name,
      confidence: student.confidence,
      timestamp: new Date().toLocaleTimeString(),
      attendance_id: student.attendance_id,
    }));

    setRecognizedStudents(prev => [...newStudents, ...prev]);
  };

  const handleStartCamera = () => {
    setIsCameraActive(true);
  };

  const handleStopCamera = () => {
    setIsCameraActive(false);
  };

  const handleViewRecords = () => {
    navigation.navigate('AttendanceSheet');
  };

  const clearRecords = () => {
    setRecognizedStudents([]);
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return COLORS.SUCCESS;
    if (confidence >= 0.6) return COLORS.WARNING;
    return COLORS.ERROR;
  };

  const getConfidenceText = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  if (isCameraActive) {
    return (
      <CameraComponent
        mode="attendance"
        onAttendanceMarked={handleAttendanceMarked}
        onCancel={handleStopCamera}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{STRINGS.ATTENDANCE.TITLE}</Text>
        <Text style={styles.subtitle}>
          Capture faces to automatically mark attendance
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleStartCamera}
        >
          <Text style={styles.primaryButtonText}>Start Camera</Text>
          <Text style={styles.buttonSubtext}>Auto-detect and recognize faces</Text>
        </TouchableOpacity>

        <View style={styles.secondaryButtons}>
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleViewRecords}
          >
            <Text style={styles.secondaryButtonText}>View All Records</Text>
          </TouchableOpacity>

          {recognizedStudents.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearRecords}
            >
              <Text style={styles.clearButtonText}>Clear List</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Recent Recognitions */}
      <View style={styles.recognitionsSection}>
        <Text style={styles.sectionTitle}>
          Recent Recognitions ({recognizedStudents.length})
        </Text>
        
        {recognizedStudents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No attendance marked yet
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Start the camera to begin recognizing students
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.recognitionsList}>
            {recognizedStudents.map((student, index) => (
              <View key={`${student.student_id}-${index}`} style={styles.studentCard}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentId}>ID: {student.student_id}</Text>
                  <Text style={styles.timestamp}>{student.timestamp}</Text>
                </View>
                <View style={styles.confidenceContainer}>
                  <View 
                    style={[
                      styles.confidenceBadge,
                      { backgroundColor: getConfidenceColor(student.confidence) }
                    ]}
                  >
                    <Text style={styles.confidenceText}>
                      {getConfidenceText(student.confidence)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Quick Stats */}
      {recognizedStudents.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {recognizedStudents.length} attendance{recognizedStudents.length !== 1 ? 's' : ''} marked
          </Text>
          <Text style={styles.statsSubtext}>
            Last updated: {new Date().toLocaleTimeString()}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
  controls: {
    padding: 20,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  buttonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.CARD,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.TEXT,
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    flex: 1,
    backgroundColor: COLORS.CARD,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
  },
  clearButtonText: {
    color: COLORS.ERROR,
    fontSize: 16,
    fontWeight: '600',
  },
  recognitionsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
  recognitionsList: {
    flex: 1,
  },
  studentCard: {
    backgroundColor: COLORS.CARD,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.SUCCESS,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 2,
  },
  studentId: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  confidenceContainer: {
    marginLeft: 12,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  confidenceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    padding: 20,
    backgroundColor: COLORS.CARD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT,
    textAlign: 'center',
  },
  statsSubtext: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default AttendanceScreen;