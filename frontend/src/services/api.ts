// frontend/src/services/api.ts
import {
    ApiResponse,
    AttendanceRecord,
    BatchAttendanceResult,
    FaceRecognitionResult,
    RegistrationResult,
    Student
} from '../types';
import {
    API_CONFIG,
    ERRORS
} from '../utils/constants';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        timeout: API_CONFIG.TIMEOUT,
      } as RequestInit);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: ERRORS.NETWORK_ERROR,
      };
    }
  }

  // Health check
  async checkHealth(): Promise<ApiResponse<{ status: string; database: string }>> {
    return this.request(API_CONFIG.ENDPOINTS.HEALTH);
  }

  // Register new student with multiple images
  async registerStudent(
    name: string, 
    studentId: string, 
    images: string[] // Array of image URIs
  ): Promise<ApiResponse<RegistrationResult>> {
    const formData = new FormData();

    formData.append('name', name);
    formData.append('student_id', studentId);

    // Add each image to form data
    images.forEach((imageUri, index) => {
      formData.append('images', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `face_${index}.jpg`,
      } as any);
    });

    return this.request(API_CONFIG.ENDPOINTS.REGISTER, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Mark attendance with single image (single face)
  async markAttendance(imageUri: string): Promise<ApiResponse<FaceRecognitionResult>> {
    const formData = new FormData();

    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'attendance.jpg',
    } as any);

    return this.request(API_CONFIG.ENDPOINTS.ATTENDANCE, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Mark attendance with multiple faces in one image
  async markBatchAttendance(imageUri: string): Promise<ApiResponse<BatchAttendanceResult>> {
    const formData = new FormData();

    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'batch_attendance.jpg',
    } as any);

    return this.request(API_CONFIG.ENDPOINTS.ATTENDANCE_BATCH, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // Get all registered students
  async getStudents(): Promise<ApiResponse<{ students: Student[] }>> {
    return this.request(API_CONFIG.ENDPOINTS.STUDENTS);
  }

  // Get attendance records for a specific date
  async getAttendanceRecords(date: string): Promise<ApiResponse<{ attendance: AttendanceRecord[] }>> {
    return this.request(`${API_CONFIG.ENDPOINTS.ATTENDANCE_RECORDS}/${date}`);
  }

  // Get system statistics
  async getStats(): Promise<ApiResponse<{ 
    total_students: number; 
    total_embeddings: number; 
    model_name: string; 
  }>> {
    return this.request(API_CONFIG.ENDPOINTS.STATS);
  }

  // Improve recognition for existing student
  async improveRecognition(
    studentId: string, 
    images: string[]
  ): Promise<ApiResponse<{ message: string }>> {
    const formData = new FormData();

    formData.append('student_id', studentId);
    images.forEach((imageUri, index) => {
      formData.append('images', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `improve_${index}.jpg`,
      } as any);
    });

    return this.request(API_CONFIG.ENDPOINTS.IMPROVE_RECOGNITION, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}

export const apiService = new ApiService();