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
  onPresentPress: () => void;
  onUndoPress: () => void;
  isExpanded?: boolean;
}

const EmployeeListItem: React.FC<EmployeeListItemProps> = ({
  employee,
  onPresentPress,
  onUndoPress,
  isExpanded = false,
}) => {
  const colors = Colors.dark;

  const handlePress = () => {
    if (employee.isPresent) {
      onUndoPress();
    } else if (!employee.isDisabled) {
      onPresentPress();
    }
  };

  const getStatusColor = () => {
    if (employee.isPresent) return '#4CAF50';
    if (employee.isDisabled) return colors.textDisabled || '#9E9E9E';
    return colors.tint;
  };

  const getStatusTextColor = () => {
    if (employee.isPresent) return '#fff';
    if (employee.isDisabled) return colors.buttonPrimaryText || '#000';
    return colors.buttonPrimaryText || '#000';
  };

  const getStatusText = () => {
    if (employee.isPresent) return 'PRESENT';
    if (employee.isDisabled) return 'MARKED ELSEWHERE';
    return 'MARK PRESENT';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card, borderBottomColor: colors.border },
        { opacity: employee.isDisabled ? 0.6 : 1 }
      ]}
      onPress={handlePress}
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
