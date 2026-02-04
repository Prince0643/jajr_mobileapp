import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { Branch, Employee } from '@/types';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import BranchEmployeeSearchList from './BranchEmployeeSearchList';

interface BranchListItemProps {
  branch: Branch;
  onBranchPress: () => void;
  onEmployeeTimeIn: (employee: Employee, branch: Branch) => void;
  onEmployeeTimeOut: (employee: Employee, branch: Branch) => void;
  onEmployeeLongPress?: (employee: Employee, branch: Branch) => void;
}

const BranchListItem: React.FC<BranchListItemProps> = ({
  branch,
  onBranchPress,
  onEmployeeTimeIn,
  onEmployeeTimeOut,
  onEmployeeLongPress,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'dark'];

  const employeesLoaded = Array.isArray(branch.employees);
  const employees = Array.isArray(branch.employees) ? branch.employees : [];
  const timedInCount = employeesLoaded ? employees.filter(emp => !!emp.time_in && !emp.time_out).length : 0;
  const totalCount = employeesLoaded ? employees.length : 0;

  const headerLabel = branch.isLoading
    ? 'Loading...'
    : !employeesLoaded
      ? 'Tap to view employees'
      : totalCount > 0
        ? `${timedInCount}/${totalCount} Timed In`
        : 'No employees';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.branchHeader} onPress={onBranchPress}>
        <View style={styles.branchInfo}>
          <Text style={styles.branchName}>{branch.branchName}</Text>
          <Text style={styles.employeeCount}>
            {headerLabel}
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          {branch.isLoading ? (
            <ActivityIndicator size="small" color={Colors.dark.tint} />
          ) : (
            <View style={styles.expandIcon}>
              <Text style={styles.expandIconText}>
                {branch.isExpanded ? '▼' : '▶'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {branch.isExpanded && (
        <BranchEmployeeSearchList
          employees={branch.employees || []}
          branch={branch}
          onEmployeeTimeIn={onEmployeeTimeIn}
          onEmployeeTimeOut={onEmployeeTimeOut}
          onEmployeeLongPress={onEmployeeLongPress}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.card,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    ...Shadows.md,
  },
  branchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  employeeCount: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
  },
  headerRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.dark.tint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIconText: {
    color: Colors.dark.buttonPrimaryText,
    fontSize: 14,
    fontWeight: 'bold',
  },
  employeesContainer: {
    paddingHorizontal: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.sm,
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.dark.textDisabled,
    fontStyle: 'italic',
  },
});

export default BranchListItem;
