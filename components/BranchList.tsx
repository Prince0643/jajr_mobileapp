import { Colors, Spacing, Typography } from '@/constants/theme';
import { Branch, Employee } from '@/types';
import React, { useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
    ViewStyle,
    useColorScheme
} from 'react-native';
import AttendanceConfirmDialog from './AttendanceConfirmDialog';
import BranchListItem from './BranchListItem';

interface BranchListProps {
  branches: Branch[];
  onBranchPress: (branch: Branch, index: number) => void;
  onEmployeeTimeIn: (employee: Employee, branch: Branch) => void;
  onEmployeeTimeOut: (employee: Employee, branch: Branch) => void;
  onEmployeeLongPress?: (employee: Employee, branch: Branch) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  style?: ViewStyle;
}

const BranchList: React.FC<BranchListProps> = ({
  branches,
  onBranchPress,
  onEmployeeTimeIn,
  onEmployeeTimeOut,
  onEmployeeLongPress,
  onRefresh,
  isRefreshing = false,
  style,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'dark'];
  
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    employee: Employee | null;
    branch: Branch | null;
    mode: 'time_in' | 'time_out';
  }>({
    visible: false,
    employee: null,
    branch: null,
    mode: 'time_in',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmployeeTimeIn = (employee: Employee, branch: Branch) => {
    setConfirmDialog({
      visible: true,
      employee,
      branch,
      mode: 'time_in',
    });
  };

  const handleEmployeeTimeOut = (employee: Employee, branch: Branch) => {
    setConfirmDialog({
      visible: true,
      employee,
      branch,
      mode: 'time_out',
    });
  };

  const handleConfirmTimeIn = async () => {
    const { employee, branch } = confirmDialog;
    if (!employee || !branch) return;

    setIsSubmitting(true);
    try {
      await onEmployeeTimeIn(employee, branch);

      setConfirmDialog({
        visible: false,
        employee: null,
        branch: null,
        mode: 'time_in',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmTimeOut = async () => {
    const { employee, branch } = confirmDialog;
    if (!employee || !branch) return;

    setIsSubmitting(true);
    try {
      await onEmployeeTimeOut(employee, branch);
      setConfirmDialog({
        visible: false,
        employee: null,
        branch: null,
        mode: 'time_out',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = () => {
    if (confirmDialog.mode === 'time_in') {
      handleConfirmTimeIn();
      return;
    }
    handleConfirmTimeOut();
  };

  const renderBranchItem = ({ item, index }: { item: Branch; index: number }) => (
    <BranchListItem
      branch={item}
      onBranchPress={() => onBranchPress(item, index)}
      onEmployeeTimeIn={handleEmployeeTimeIn}
      onEmployeeTimeOut={handleEmployeeTimeOut}
      onEmployeeLongPress={onEmployeeLongPress}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Branches Found</Text>
      <Text style={[styles.emptyMessage, { color: colors.textSecondary || colors.icon }]}>
        Pull down to refresh or check your connection.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={branches}
        renderItem={renderBranchItem}
        keyExtractor={(item) => item.branchName}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={branches.length === 0 ? styles.emptyListContainer : undefined}
      />

      <AttendanceConfirmDialog
        visible={confirmDialog.visible}
        employee={confirmDialog.employee}
        branch={confirmDialog.branch}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, visible: false })}
        isLoading={isSubmitting}
        mode={confirmDialog.mode}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    marginBottom: Spacing.sm,
  },
  emptyMessage: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
});

export default BranchList;
