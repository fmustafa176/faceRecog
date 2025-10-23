// frontend/src/utils/constants.ts

export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://localhost:8000' 
    : 'https://your-production-url.com', // Change for production
  ENDPOINTS: {
    HEALTH: '/health',
    REGISTER: '/register',
    ATTENDANCE: '/attendance',
    ATTENDANCE_BATCH: '/attendance/batch', // For multiple faces
    STUDENTS: '/students',
    ATTENDANCE_RECORDS: '/attendance', // /attendance/{date}
    STATS: '/stats',
    IMPROVE_RECOGNITION: '/improve-recognition',
  },
  TIMEOUT: 30000, // 30 seconds
};

export const CAMERA_CONFIG = {
  REGISTRATION: {
    TOTAL_IMAGES: 20,
    CAPTURE_INTERVAL: 2000, // 2 seconds between captures
    INSTRUCTIONS: [
      { text: 'Look straight ahead', duration: 4000 },
      { text: 'Turn head slightly left', duration: 4000 },
      { text: 'Turn head slightly right', duration: 4000 },
      { text: 'Look up slightly', duration: 4000 },
      { text: 'Look down slightly', duration: 4000 },
      { text: 'Neutral expression', duration: 4000 },
      { text: 'Slight smile', duration: 4000 },
      { text: 'Turn left 45 degrees', duration: 4000 },
      { text: 'Turn right 45 degrees', duration: 4000 },
      { text: 'Final straight look', duration: 4000 },
    ],
  },
  ATTENDANCE: {
    DETECTION_INTERVAL: 3000, // Check for faces every 3 seconds
    CONFIRMATION_DELAY: 2000, // Show confirmation for 2 seconds
    DUPLICATE_TIMEOUT: 300000, // 5 minutes before same person can be detected again
  },
};

export const UI_CONSTANTS = {
  CONFIDENCE_THRESHOLD: 0.6, // Minimum confidence to accept recognition
  MIN_FACE_SIZE: 100, // Minimum face size for detection
  MAX_FACES: 5, // Maximum number of faces to process in one frame
};

export const COLORS = {
  PRIMARY: '#2f95dc',
  SECONDARY: '#34c759',
  ERROR: '#ff3b30',
  WARNING: '#ff9500',
  SUCCESS: '#34c759',
  BACKGROUND: '#f2f2f7',
  CARD: '#ffffff',
  TEXT: '#000000',
  TEXT_SECONDARY: '#8e8e93',
  BORDER: '#c6c6c8',
};

export const STRINGS = {
  HOME: {
    TITLE: 'Face Recognition Attendance',
    ATTENDANCE_BUTTON: 'Mark Attendance',
    REGISTER_BUTTON: 'Register New Student',
    RECORDS_BUTTON: 'View Attendance Records',
  },
  REGISTRATION: {
    TITLE: 'Register Student',
    NAME_PLACEHOLDER: 'Enter full name',
    ID_PLACEHOLDER: 'Enter student ID',
    START_CAPTURE: 'Start Face Capture',
    CAPTURING: 'Capturing Images...',
    INSTRUCTION: 'Follow the instructions below',
    PROGRESS: 'Image {current} of {total}',
    PROCESSING: 'Processing images...',
    SUCCESS: 'Student registered successfully!',
    ERROR: 'Registration failed',
  },
  ATTENDANCE: {
    TITLE: 'Mark Attendance',
    DETECTING: 'Detecting faces...',
    RECOGNIZING: 'Recognizing...',
    MULTIPLE_FACES: '{count} faces detected',
    CONFIRMATION: '✅ {name} - Attendance marked',
    NO_MATCH: 'No match found',
    ERROR: 'Recognition failed',
  },
  ATTENDANCE_SHEET: {
    TITLE: 'Attendance Records',
    DATE_PICKER: 'Select Date',
    NO_RECORDS: 'No attendance records for selected date',
    EXPORT: 'Export to CSV',
  },
};

export const ERRORS = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again.',
  CAMERA_PERMISSION: 'Camera permission is required to use this feature.',
  FACE_DETECTION: 'No faces detected. Please try again.',
  MULTIPLE_FACES: 'Multiple faces detected. Please ensure only one person is in frame for registration.',
};