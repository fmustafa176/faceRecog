// frontend/src/components/CameraComponent.tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { CameraProps } from '../types';
import { CAMERA_CONFIG, COLORS } from '../utils/constants';

const CameraComponent: React.FC<CameraProps> = ({
  mode,
  onImagesCaptured,
  onAttendanceMarked,
  onCancel,
  studentInfo,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isActive, setIsActive] = useState(false);
  const [capturedCount, setCapturedCount] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Registration mode states
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  
  // Attendance mode states
  const [lastProcessedTime, setLastProcessedTime] = useState(0);

  useEffect(() => {
    if (mode === 'registration' && isActive) {
      startRegistrationCapture();
    }
  }, [mode, isActive]);

  const startRegistrationCapture = async () => {
    if (mode !== 'registration') return;

    for (let i = 0; i < CAMERA_CONFIG.REGISTRATION.TOTAL_IMAGES; i++) {
      if (!isActive) break;

      setCurrentInstruction(i % CAMERA_CONFIG.REGISTRATION.INSTRUCTIONS.length);
      
      // Wait for instruction duration
      await new Promise(resolve => 
        setTimeout(resolve, CAMERA_CONFIG.REGISTRATION.INSTRUCTIONS[0].duration)
      );

      if (!isActive) break;

      // Capture image
      await captureImage();
      
      // Wait between captures
      if (i < CAMERA_CONFIG.REGISTRATION.TOTAL_IMAGES - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, CAMERA_CONFIG.REGISTRATION.CAPTURE_INTERVAL)
        );
      }
    }

    if (isActive && capturedImages.length > 0) {
      onImagesCaptured?.(capturedImages);
    }
  };

  const captureImage = async (): Promise<string | null> => {
    if (!cameraRef.current) return null;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: true,
      });

      if (photo?.uri) {
        if (mode === 'registration') {
          setCapturedImages(prev => [...prev, photo.uri]);
          setCapturedCount(prev => prev + 1);
        }
        return photo.uri;
      }
    } catch (error) {
      console.error('Error capturing image:', error);
    }
    
    return null;
  };

  const handleAttendanceCapture = async () => {
    if (mode !== 'attendance' || isProcessing) return;

    const now = Date.now();
    if (now - lastProcessedTime < CAMERA_CONFIG.ATTENDANCE.DETECTION_INTERVAL) {
      return;
    }

    setIsProcessing(true);
    setLastProcessedTime(now);

    try {
      const imageUri = await captureImage();
      if (imageUri && onAttendanceMarked) {
        // For now, we'll use single face recognition
        // Later we'll implement batch recognition
        onAttendanceMarked({
          success: true,
          attendance_marked: true,
          recognized_students: [], // Will be populated by API
          message: 'Processing...'
        });
      }
    } catch (error) {
      console.error('Attendance capture error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const startCamera = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to use this feature.');
        return;
      }
    }
    setIsActive(true);
  };

  const stopCamera = () => {
    setIsActive(false);
    onCancel?.();
  };

  const getCurrentInstruction = (): string => {
    if (mode === 'registration') {
      const instruction = CAMERA_CONFIG.REGISTRATION.INSTRUCTIONS[
        currentInstruction % CAMERA_CONFIG.REGISTRATION.INSTRUCTIONS.length
      ];
      return instruction.text;
    }
    return 'Look at the camera for attendance';
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission is required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isActive) {
    return (
      <View style={styles.container}>
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>
            {mode === 'registration' ? 'Register Student' : 'Mark Attendance'}
          </Text>
          {mode === 'registration' && studentInfo && (
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{studentInfo.name}</Text>
              <Text style={styles.studentId}>ID: {studentInfo.studentId}</Text>
            </View>
          )}
          <Text style={styles.previewText}>
            {mode === 'registration' 
              ? 'Ready to capture 20 face images with different angles'
              : 'Camera will automatically detect and recognize faces'
            }
          </Text>
          <TouchableOpacity style={styles.startButton} onPress={startCamera}>
            <Text style={styles.startButtonText}>Start Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        mode="picture"
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.modeText}>
              {mode === 'registration' ? 'Registering Student' : 'Marking Attendance'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={stopCamera}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Instruction Overlay */}
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>
              {getCurrentInstruction()}
            </Text>
            {mode === 'registration' && (
              <Text style={styles.progressText}>
                {capturedCount} / {CAMERA_CONFIG.REGISTRATION.TOTAL_IMAGES}
              </Text>
            )}
          </View>

          {/* Face Guide Frame */}
          <View style={styles.faceFrame}>

          {/* Footer */}
          <View style={styles.footer}>
            {mode === 'attendance' && (
              <TouchableOpacity 
                style={[
                  styles.captureButton,
                  isProcessing && styles.captureButtonDisabled
                ]}
                onPress={handleAttendanceCapture}
                disabled={isProcessing}
              >
                <Text style={styles.captureButtonText}>
                  {isProcessing ? 'Processing...' : 'Capture'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  instructionContainer: {
    position: 'absolute',
    top: '20%',
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 8,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    opacity: 0.8,
  },
  faceFrame: {
    position: 'absolute',
    top: '35%',
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: 100,
    backgroundColor: 'transparent',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  captureButtonDisabled: {
    backgroundColor: COLORS.TEXT_SECONDARY,
    opacity: 0.6,
  },
  captureButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 16,
    color: COLORS.TEXT,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    padding: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 20,
    textAlign: 'center',
  },
  previewText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  studentInfo: {
    backgroundColor: COLORS.CARD,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    textAlign: 'center',
  },
  studentId: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 4,
  },
  startButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 16,
  },
  cancelButtonText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 16,
  },
});

export default CameraComponent;