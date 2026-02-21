import { Colors, Spacing, Typography } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { Branch, Employee } from '@/types';
import React, { useState } from 'react';
import {
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    RefreshControl,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import AttendanceConfirmDialog from './AttendanceConfirmDialog';
import BranchListItem from './BranchListItem';

interface BranchListProps {
  branches: Branch[];
  onBranchPress: (branch: Branch, index: number) => void;
  onEmployeeTimeIn: (employee: Employee, branch: Branch) => void;
  onEmployeeTimeOut: (employee: Employee, branch: Branch) => void;
  onEmployeeTransfer?: (employee: Employee, branch: Branch) => void;
  onEmployeeLongPress?: (employee: Employee, branch: Branch) => void;
  onEmployeeSetOtHours?: (employee: Employee, otHours: string) => Promise<void> | void;
  onEmployeeMarkAbsent?: (employee: Employee, branch: Branch) => Promise<void> | void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  style?: ViewStyle;
  headerComponent?: React.ReactElement | null;
  searchComponent?: React.ReactNode;
  stickySearch?: boolean;
  emptyComponent?: React.ReactElement | null;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollEventThrottle?: number;
}

type SearchRow = { __type: 'search' };
type BranchListRow = Branch | SearchRow;

const BranchList: React.FC<BranchListProps> = ({
  branches,
  onBranchPress,
  onEmployeeTimeIn,
  onEmployeeTimeOut,
  onEmployeeTransfer,
  onEmployeeLongPress,
  onEmployeeSetOtHours,
  onEmployeeMarkAbsent,
  onRefresh,
  isRefreshing = false,
  style,
  headerComponent,
  searchComponent,
  stickySearch = false,
  emptyComponent,
  onScroll,
  scrollEventThrottle,
}) => {
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];
  
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
  const [selectedNoBranchTarget, setSelectedNoBranchTarget] = useState<Branch | null>(null);

  const handleEmployeeTimeIn = (employee: Employee, branch: Branch) => {
    setSelectedNoBranchTarget(null);
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

    const targetBranch =
      branch.branchName === 'Pool' && selectedNoBranchTarget
        ? selectedNoBranchTarget
        : branch;

    setIsSubmitting(true);
    try {
      await onEmployeeTimeIn(employee, targetBranch);

      setConfirmDialog({
        visible: false,
        employee: null,
        branch: null,
        mode: 'time_in',
      });
      setSelectedNoBranchTarget(null);
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
      onEmployeeTransfer={onEmployeeTransfer}
      onEmployeeLongPress={onEmployeeLongPress}
      onEmployeeSetOtHours={onEmployeeSetOtHours}
      onEmployeeMarkAbsent={onEmployeeMarkAbsent}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No Projects Found</Text>
      <Text style={[styles.emptyMessage, { color: colors.textSecondary || colors.icon }]}>
        Pull down to refresh or check your connection.
      </Text>
    </View>
  );

  const data: BranchListRow[] = searchComponent
    ? ([{ __type: 'search' } as SearchRow, ...branches] as BranchListRow[])
    : (branches as BranchListRow[]);

  const effectiveStickyHeaderIndices =
    stickySearch && searchComponent
      ? [headerComponent ? 1 : 0]
      : undefined;

  const effectiveEmptyComponent = emptyComponent ?? renderEmptyState();

  const renderItem = ({ item, index }: { item: BranchListRow; index: number }) => {
    if ((item as SearchRow).__type === 'search') {
      return <View style={styles.searchRowContainer}>{searchComponent}</View>;
    }
    const branch = item as Branch;
    const branchIndex = searchComponent ? index - 1 : index;
    return renderBranchItem({ item: branch, index: branchIndex });
  };

  const keyExtractor = (item: BranchListRow) => {
    if ((item as SearchRow).__type === 'search') return 'search';
    return (item as Branch).branchName;
  };

  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={headerComponent ?? undefined}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        stickyHeaderIndices={effectiveStickyHeaderIndices}
        ListFooterComponent={branches.length === 0 ? effectiveEmptyComponent : undefined}
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
        branchOptions={branches.filter((b) => b.branchName !== 'Pool')}
        selectedBranch={selectedNoBranchTarget}
        onSelectBranch={setSelectedNoBranchTarget}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchRowContainer: {
    backgroundColor: 'transparent',
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
