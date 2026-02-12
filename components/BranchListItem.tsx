import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { Branch, Employee } from '@/types';
import React, { useMemo } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import BranchEmployeeSearchList from './BranchEmployeeSearchList';

interface BranchListItemProps {
  branch: Branch;
  onBranchPress: () => void;
  onEmployeeTimeIn: (employee: Employee, branch: Branch) => void;
  onEmployeeTimeOut: (employee: Employee, branch: Branch) => void;
  onEmployeeTransfer?: (employee: Employee, branch: Branch) => void;
  onEmployeeLongPress?: (employee: Employee, branch: Branch) => void;
  onEmployeeSetOtHours?: (employee: Employee, otHours: string) => Promise<void> | void;
  onEmployeeMarkAbsent?: (employee: Employee, branch: Branch) => Promise<void> | void;
}

const BranchListItem: React.FC<BranchListItemProps> = ({
  branch,
  onBranchPress,
  onEmployeeTimeIn,
  onEmployeeTimeOut,
  onEmployeeTransfer,
  onEmployeeLongPress,
  onEmployeeSetOtHours,
  onEmployeeMarkAbsent,
}) => {
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];
  const borderLight = ('borderLight' in colors ? (colors as any).borderLight : undefined) ?? colors.border;
  const styles = useMemo(() => createStyles(colors, borderLight), [borderLight, colors]);

  const employeesLoaded = Array.isArray(branch.employees);
  const employees = Array.isArray(branch.employees) ? branch.employees : [];
  const timedInCount = employeesLoaded ? employees.filter(emp => emp.today_status === 'Present').length : 0;
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
            <ActivityIndicator size="small" color={colors.tint} />
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
          onEmployeeTransfer={onEmployeeTransfer}
          onEmployeeLongPress={onEmployeeLongPress}
          onEmployeeSetOtHours={onEmployeeSetOtHours}
          onEmployeeMarkAbsent={onEmployeeMarkAbsent}
        />
      )}
    </View>
  );
};

const createStyles = (colors: (typeof Colors)[keyof typeof Colors], borderLight: string) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      marginHorizontal: Spacing.md,
      marginVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...Shadows.md,
    },
    branchHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
    },
    branchInfo: {
      flex: 1,
    },
    branchName: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    employeeCount: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    headerRight: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    expandIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.tint,
      justifyContent: 'center',
      alignItems: 'center',
    },
    expandIconText: {
      color: colors.buttonPrimaryText,
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
      color: colors.textSecondary,
    },
    emptyContainer: {
      alignItems: 'center',
      padding: Spacing.xl,
    },
    emptyText: {
      ...Typography.body,
      color: colors.textDisabled,
      fontStyle: 'italic',
    },
  });

export default BranchListItem;
