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
  onEmployeePresent: (employee: Employee, branch: Branch) => void;
  onEmployeeUndo: (employee: Employee) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  style?: ViewStyle;
}

const BranchList: React.FC<BranchListProps> = ({
  branches,
  onBranchPress,
  onEmployeePresent,
  onEmployeeUndo,
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
    mode: 'present' | 'undo';
  }>({
    visible: false,
    employee: null,
    branch: null,
    mode: 'present',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmployeePresent = (employee: Employee, branch: Branch) => {
    setConfirmDialog({
      visible: true,
      employee,
      branch,
      mode: 'present',
    });
  };

  const handleEmployeeUndo = (employee: Employee) => {
    // Find which branch this employee belongs to
    const employeeBranch = branches.find(branch => 
      branch.employees?.some(emp => emp.id === employee.id)
    );
    
    if (employeeBranch) {
      setConfirmDialog({
        visible: true,
        employee,
        branch: employeeBranch,
        mode: 'undo',
      });
    }
  };

  const handleConfirmPresent = async () => {
    const { employee, branch } = confirmDialog;
    if (!employee || !branch) return;

    setIsSubmitting(true);
    try {
      await onEmployeePresent(employee, branch);

      setConfirmDialog({
        visible: false,
        employee: null,
        branch: null,
        mode: 'present',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmUndo = () => {
    const { employee } = confirmDialog;
    if (employee) {
      onEmployeeUndo(employee);
    }

    setConfirmDialog({
      visible: false,
      employee: null,
      branch: null,
      mode: 'undo',
    });
  };

  const handleConfirm = () => {
    if (confirmDialog.mode === 'present') {
      handleConfirmPresent();
    } else {
      handleConfirmUndo();
    }
  };

  const renderBranchItem = ({ item, index }: { item: Branch; index: number }) => (
    <BranchListItem
      branch={item}
      onBranchPress={() => onBranchPress(item, index)}
      onEmployeePresent={handleEmployeePresent}
      onEmployeeUndo={handleEmployeeUndo}
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
