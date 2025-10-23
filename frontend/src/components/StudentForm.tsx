// frontend/src/components/StudentForm.tsx
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS, STRINGS } from '../utils/constants';

interface StudentFormProps {
  onSubmit: (name: string, studentId: string) => void;
  isLoading?: boolean;
}

const StudentForm: React.FC<StudentFormProps> = ({ onSubmit, isLoading = false }) => {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');

  const handleSubmit = () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter student name');
      return;
    }

    if (!studentId.trim()) {
      Alert.alert('Error', 'Please enter student ID');
      return;
    }

    // Basic name validation
    if (name.trim().length < 2) {
      Alert.alert('Error', 'Please enter a valid name');
      return;
    }

    // Basic ID validation
    if (studentId.trim().length < 2) {
      Alert.alert('Error', 'Please enter a valid student ID');
      return;
    }

    onSubmit(name.trim(), studentId.trim());
  };

  const isFormValid = name.trim().length >= 2 && studentId.trim().length >= 2;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Student Information</Text>
          <Text style={styles.subtitle}>
            Enter the student's details before starting face capture
          </Text>
        </View>

        <View style={styles.form}>
          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder={STRINGS.REGISTRATION.NAME_PLACEHOLDER}
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Student ID Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Student ID</Text>
            <TextInput
              style={styles.input}
              placeholder={STRINGS.REGISTRATION.ID_PLACEHOLDER}
              placeholderTextColor={COLORS.TEXT_SECONDARY}
              value={studentId}
              onChangeText={setStudentId}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Requirements Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Face Capture Requirements:</Text>
            <Text style={styles.infoText}>• 20 images will be captured</Text>
            <Text style={styles.infoText}>• Follow on-screen instructions</Text>
            <Text style={styles.infoText}>• Ensure good lighting</Text>
            <Text style={styles.infoText}>• Remove sunglasses/hats</Text>
            <Text style={styles.infoText}>• Look directly at camera</Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              !isFormValid || isLoading ? styles.submitButtonDisabled : {}
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid || isLoading}
          >
            <Text style={styles.submitButtonText}>
              {isLoading ? 'Loading...' : STRINGS.REGISTRATION.START_CAPTURE}
            </Text>
          </TouchableOpacity>

          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>
                Preparing camera...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.CARD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: COLORS.TEXT,
  },
  infoBox: {
    backgroundColor: '#e8f4fd',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
    padding: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.TEXT_SECONDARY,
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  loadingText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 14,
  },
});

export default StudentForm;