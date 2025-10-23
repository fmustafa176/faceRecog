// frontend/src/types/index.ts

import { RootStackParamList } from "@/frontend/App";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Student {
  id: string;
  name: string;
  student_id: string;
  image_count: number;
  is_active: boolean;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  check_in: string;
  date: string;
  confidence?: number;
  image_path?: string;
}

export interface FaceRecognitionResult {
  success: boolean;
  matched: boolean;
  student?: {
    student_id: string;
    name: string;
    distance: number;
  };
  confidence: number;
  distance?: number;
  all_matches?: Array<{
    student_id: string;
    name: string;
    distance: number;
  }>;
  message?: string;
}

export interface BatchAttendanceResult {
  success: boolean;
  attendance_marked: boolean;
  recognized_students: Array<{
    student: {
      student_id: string;
      name: string;
    };
    confidence: number;
    attendance_id: string;
  }>;
  message?: string;
}

export interface RegistrationResult {
  success: boolean;
  student_id: string;
  name: string;
  db_id: string;
  total_images: number;
  successful_embeddings: number;
  failed_images: Array<{
    path: string;
    error: string;
  }>;
  message: string;
}

// Camera Types
export interface CameraProps {
  mode: 'registration' | 'attendance';
  onImagesCaptured?: (images: string[]) => void;
  onAttendanceMarked?: (results: BatchAttendanceResult) => void;
  studentInfo?: {
    name: string;
    student_id: string;
  };
}

export interface CaptureInstruction {
  text: string;
  duration: number;
}

// Navigation Types
export type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

export type RegisterStudentScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'RegisterStudent'
>;

export type AttendanceScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Attendance'
>;

export type AttendanceSheetScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AttendanceSheet'
>;