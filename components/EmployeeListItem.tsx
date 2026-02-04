import { Colors } from '@/constants/theme';
import { Employee } from '@/types';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface EmployeeListItemProps {
  employee: Employee;
  onTimeInPress: () => void;
  onTimeOutPress: () => void;
  onLongPress?: () => void;
  isExpanded?: boolean;
}

const EmployeeListItem: React.FC<EmployeeListItemProps> = ({
  employee,
  onTimeInPress,
  onTimeOutPress,
  onLongPress,
  isExpanded = false,
}) => {
  const colors = Colors.dark;

  const isTimeRunning =
    (employee.is_time_running === true || (!!employee.time_in && !employee.time_out)) && !employee.time_out;

  const handlePress = () => {
    if (employee.isDisabled) return;
    if (!isTimeRunning) {
      onTimeInPress();
      return;
    }
    if (isTimeRunning) {
      onTimeOutPress();
      return;
    }
  };

  const getStatusColor = () => {
    if (employee.time_in && employee.time_out) return '#4CAF50';
    if (isTimeRunning) return '#FF9500';
    if (employee.isDisabled) return colors.textDisabled || '#9E9E9E';
    return colors.tint;
  };

  const getStatusTextColor = () => {
    if (employee.time_in) return '#fff';
    if (employee.isDisabled) return colors.buttonPrimaryText || '#000';
    return colors.buttonPrimaryText || '#000';
  };

  const formatTime = (value?: string | null) => {
    if (!value) return '';
    const s = String(value);
    const parts = s.split(' ');
    return parts.length > 1 ? parts[1] : s;
  };

  const getStatusText = () => {
    if (employee.time_in && employee.time_out) return `OUT ${formatTime(employee.time_out)}`;
    if (isTimeRunning) return `IN ${formatTime(employee.time_in)}`;
    if (employee.isDisabled) return 'MARKED ELSEWHERE';
    return 'TIME IN';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card, borderBottomColor: colors.border },
        { opacity: employee.isDisabled ? 0.6 : 1 }
      ]}
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={350}
      disabled={!isExpanded}
    >
      <View style={styles.employeeInfo}>
        <Text style={[styles.employeeName, { color: colors.text }]}>
          {employee.first_name} {employee.last_name}
        </Text>
        <Text style={[styles.employeeCode, { color: colors.textSecondary || colors.icon }]}>
          {employee.employee_code}
        </Text>
        {employee.isSynced && (
          <Text style={styles.syncedText}>✓ Synced</Text>
        )}
      </View>
      
      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={[styles.statusText, { color: getStatusTextColor() }]}>{getStatusText()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 8,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  employeeCode: {
    fontSize: 14,
    marginBottom: 2,
  },
  syncedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    minWidth: 100,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default EmployeeListItem;
