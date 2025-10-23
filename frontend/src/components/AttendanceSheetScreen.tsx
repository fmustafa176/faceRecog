// frontend/src/components/AttendanceSheetScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { apiService } from '../services/api';
import { AttendanceRecord } from '../types';
import { COLORS, STRINGS } from '../utils/constants';

const AttendanceSheetScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadAttendanceRecords();
  }, [selectedDate]);

  const loadAttendanceRecords = async () => {
    try {
      setIsLoading(true);
      const dateString = selectedDate.toISOString().split('T')[0];
      const result = await apiService.getAttendanceRecords(dateString);
      
      if (result.success && result.data) {
        setAttendanceRecords(result.data.attendance);
      } else {
        Alert.alert('Error', result.error || 'Failed to load attendance records');
        setAttendanceRecords([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load attendance records');
      setAttendanceRecords([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAttendanceRecords();
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    // Don't allow future dates
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateShort = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const exportToCSV = async () => {
  if (attendanceRecords.length === 0) {
    Alert.alert('No Data', 'No attendance records to export');
    return;
  }

  try {
    // Create CSV content
    let csvContent = 'Name,Student ID,Time,Date,Confidence\n';
    
    attendanceRecords.forEach(record => {
      const time = formatTime(record.check_in);
      const date = record.date;
      const confidence = record.confidence ? `${Math.round(record.confidence * 100)}%` : 'N/A';
      
      csvContent += `"${record.student_name}","${record.student_id}","${time}","${date}","${confidence}"\n`;
    });

    // For now, just show the CSV content in an alert
    // Users can copy it manually
    Alert.alert(
      'Attendance Data (CSV)',
      `Total records: ${attendanceRecords.length}\n\nCopy this data to a .csv file:`,
      [
        {
          text: 'Copy Data',
          onPress: () => {
            // In a real app, you'd use Clipboard API here
            Alert.alert('Info', 'In a production app, this would copy to clipboard');
          }
        },
        {
          text: 'OK',
          style: 'cancel'
        }
      ]
    );

    // Show first few records in the alert for preview
    const preview = attendanceRecords.slice(0, 3).map(record => 
      `${record.student_name} (${record.student_id}) - ${formatTime(record.check_in)}`
    ).join('\n');

    if (attendanceRecords.length > 3) {
      Alert.alert(
        'Attendance Preview',
        `${preview}\n\n... and ${attendanceRecords.length - 3} more records`
      );
    }

  } catch (error) {
    Alert.alert('Export Failed', 'Failed to generate attendance data');
  }
};

  const getStats = () => {
    const total = attendanceRecords.length;
    const uniqueStudents = new Set(attendanceRecords.map(record => record.student_id)).size;
    
    return { total, uniqueStudents };
  };

  const stats = getStats();
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{STRINGS.ATTENDANCE_SHEET.TITLE}</Text>
        
        {/* Date Navigation */}
        <View style={styles.dateNavigation}>
          <TouchableOpacity onPress={goToPreviousDay} style={styles.dateNavButton}>
            <Text style={styles.dateNavText}>←</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.dateDisplay}
            onPress={goToToday}
          >
            <Text style={styles.dateText}>
              {formatDateForDisplay(selectedDate)}
            </Text>
            <Text style={styles.dateSubtext}>
              {isToday ? 'Today' : 'Tap for today'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={goToNextDay} 
            style={[
              styles.dateNavButton,
              isToday && styles.dateNavButtonDisabled
            ]}
            disabled={isToday}
          >
            <Text style={styles.dateNavText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      {attendanceRecords.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Records</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.uniqueStudents}</Text>
            <Text style={styles.statLabel}>Unique Students</Text>
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.PRIMARY]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Loading attendance records...</Text>
          </View>
        ) : attendanceRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Records Found</Text>
            <Text style={styles.emptyStateText}>
              {STRINGS.ATTENDANCE_SHEET.NO_RECORDS}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Try selecting a different date or check if attendance was marked for this day.
            </Text>
          </View>
        ) : (
          <View style={styles.recordsList}>
            {attendanceRecords.map((record, index) => (
              <View key={`${record.id}-${index}`} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.studentName}>{record.student_name}</Text>
                  {record.confidence && (
                    <View style={styles.confidenceBadge}>
                      <Text style={styles.confidenceText}>
                        {Math.round(record.confidence * 100)}%
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.recordDetails}>
                  <Text style={styles.studentId}>ID: {record.student_id}</Text>
                  <Text style={styles.time}>
                    {formatTime(record.check_in)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Export Button */}
      {attendanceRecords.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={exportToCSV}
          >
            <Text style={styles.exportButtonText}>
              {STRINGS.ATTENDANCE_SHEET.EXPORT}
            </Text>
          </TouchableOpacity>
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
    backgroundColor: COLORS.CARD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 16,
    textAlign: 'center',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateNavButton: {
    padding: 16,
    backgroundColor: COLORS.CARD,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    minWidth: 50,
    alignItems: 'center',
  },
  dateNavButtonDisabled: {
    opacity: 0.5,
  },
  dateNavText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  dateDisplay: {
    flex: 1,
    marginHorizontal: 12,
    padding: 16,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT,
    textAlign: 'center',
  },
  dateSubtext: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: COLORS.CARD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
  recordsList: {
    padding: 20,
    gap: 12,
  },
  recordCard: {
    backgroundColor: COLORS.CARD,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  confidenceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentId: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT,
  },
  footer: {
    padding: 20,
    backgroundColor: COLORS.CARD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  exportButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AttendanceSheetScreen;