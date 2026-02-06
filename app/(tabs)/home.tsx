import { BranchList, EmployeeTimeLogsModal, EmptyState, LoadingState, LogoutModal, SyncStatus } from '@/components';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { ApiService } from '@/services/api';
import { Branch, Employee } from '@/types';
import { ErrorHandler, SessionManager } from '@/utils';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const HomeScreen: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeInBranchMap, setTimeInBranchMap] = useState<Map<number, string>>(new Map());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState('');
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [branchSearch, setBranchSearch] = useState('');
  const [attendanceHelpVisible, setAttendanceHelpVisible] = useState(false);
  const helpOpenedRef = useRef(false);

  // Transfer modal state
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferEmployee, setTransferEmployee] = useState<Employee | null>(null);
  const [transferFromBranch, setTransferFromBranch] = useState<Branch | null>(null);

  const [timeLogsVisible, setTimeLogsVisible] = useState(false);
  const [timeLogsEmployeeName, setTimeLogsEmployeeName] = useState('');
  const [timeLogs, setTimeLogs] = useState<Array<{ id?: number; time_in: string | null; time_out: string | null }>>([]);
  const [timeLogsLoading, setTimeLogsLoading] = useState(false);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Initialize data
  useEffect(() => {
    initializeData();
  }, []);

  // Set current date
  useEffect(() => {
    const today = new Date();
    const formatted = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setCurrentDate(formatted);
  }, []);

  useEffect(() => {
    const helpParam = String((params as any)?.help ?? '');
    if (helpOpenedRef.current) return;
    if (helpParam === 'attendance') {
      helpOpenedRef.current = true;
      setAttendanceHelpVisible(true);
    }
  }, [params]);

  const initializeData = async () => {
    try {
      // Get current user
      const user = await SessionManager.getUser();
      setCurrentUser(user);

      // Load initial branches (mock data for now)
      await loadBranches();
    } catch (error) {
      console.error('Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const [activeBranches, allEmployees] = await Promise.all([
        ApiService.getBranches(),
        ApiService.getAvailableEmployees('ALL'),
      ]);

      // Group employees by branch_id (assigned), and also collect no-branch
      const employeesByBranchId = new Map<number, Employee[]>();
      const noBranchEmployees: Employee[] = [];
      for (const emp of allEmployees) {
        const bid = (emp as any).branch_id as number | null | undefined;
        if (bid === null || bid === undefined) {
          noBranchEmployees.push(emp);
          continue;
        }
        if (!employeesByBranchId.has(bid)) employeesByBranchId.set(bid, []);
        employeesByBranchId.get(bid)!.push(emp);
      }

      const branchesArr: Branch[] = [
        {
          id: null,
          branchName: 'Pool',
          employees: noBranchEmployees,
          isExpanded: false,
          isLoading: false,
        },
        ...activeBranches.map((b) => ({
          id: b.id,
          branchName: b.branch_name,
          employees: employeesByBranchId.get(b.id) || [],
          isExpanded: false,
          isLoading: false,
        })),
      ];

      setBranches(branchesArr);
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error);
      Alert.alert('Error', 'Failed to load branches: ' + ErrorHandler.getDisplayMessage(errorInfo));
    }
  };


  const handleBranchPress = useCallback(async (branch: Branch, index: number) => {
    const realIndex = branches.findIndex((b) => b.branchName === branch.branchName);
    if (realIndex < 0) return;

    // Close other branches
    const updatedBranches = branches.map((b, i) => ({
      ...b,
      isExpanded: i === realIndex ? !b.isExpanded : false,
    }));
    setBranches(updatedBranches);

    // Load employees only if expanding and employees were never loaded.
    // NOTE: An empty array means the branch truly has no employees; do not fetch.
    if (!branch.isExpanded && (branch.employees === undefined || branch.employees === null)) {
      // Set loading state
      updatedBranches[realIndex].isLoading = true;
      setBranches([...updatedBranches]);

      try {
        const employees = await ApiService.getAvailableEmployees(branch.branchName);

        if (!Array.isArray(employees)) {
          console.log('🔴 Unexpected employees shape:', JSON.stringify(employees, null, 2));
        }
        const safeEmployees = Array.isArray(employees) ? employees : [];

        // Deduplicate by employee id (API might contain duplicates)
        const uniqueById = new Map<number, any>();
        for (const emp of safeEmployees) {
          const id = Number((emp as any)?.id);
          if (!Number.isFinite(id)) continue;
          uniqueById.set(id, emp);
        }
        const dedupedEmployees = Array.from(uniqueById.values());

        // Disable 'Time In' for employees only if they have an open session at a different branch today
        const updatedEmployees = dedupedEmployees.map(emp => {
          const timeIn = (emp as any).time_in ?? null;
          const timeOut = (emp as any).time_out ?? null;
          const isTimeRunning = (emp as any).is_time_running === true || (emp as any).is_time_running === 1;
          const empBranch = (emp as any).branch_name ?? null;
          // Only disable if open session and branch does not match
          const isDisabled = !!timeIn && !timeOut && empBranch && empBranch !== branch.branchName;
          return {
            ...emp,
            time_in: timeIn,
            time_out: timeOut,
            is_time_running: isTimeRunning,
            isDisabled,
          };
        });

        updatedBranches[realIndex].employees = updatedEmployees;
        updatedBranches[realIndex].isLoading = false;
        setBranches([...updatedBranches]);
      } catch (error) {
        updatedBranches[realIndex].isLoading = false;
        setBranches([...updatedBranches]);
        
        const errorInfo = ErrorHandler.handle(error);
        Alert.alert('Error', 'Failed to load employees: ' + ErrorHandler.getDisplayMessage(errorInfo));
      }
    }
  }, [branches, timeInBranchMap]);

  const handleEmployeeSetOtHours = useCallback(async (employee: Employee, otHours: string) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await ApiService.setAttendanceOtHours({ employee_id: employee.id, ot_hours: otHours, date: today });
      if (!res?.success) {
        Alert.alert('Set OT Failed', res?.message || 'Failed to set OT hours');
        return;
      }

      const saved = String((res as any)?.total_ot_hrs ?? otHours);
      setBranches((prev) =>
        prev.map((b) => ({
          ...b,
          employees: (b.employees || []).map((e) =>
            e.id === employee.id ? { ...e, total_ot_hrs: saved } : e
          ),
        }))
      );

      await loadBranches();
    } catch (err) {
      Alert.alert('Set OT Failed', String(err));
    }
  }, [loadBranches]);

  const handleEmployeeTimeIn = useCallback(async (employee: Employee, branch: Branch) => {
    if (branch.branchName === 'Pool') {
      Alert.alert('No Branch Assigned', 'Assign this employee to a branch before timing in.');
      return;
    }

    const hasAssignedBranch = employee.branch_id !== null && employee.branch_id !== undefined;
    const targetBranchId = branch.id;
    const shouldAssignBranch = !hasAssignedBranch && typeof targetBranchId === 'number';

    if (shouldAssignBranch) {
      try {
        const assignRes = await ApiService.setEmployeeBranch({ employee_id: employee.id, branch_id: targetBranchId });
        if (!assignRes?.success) {
          Alert.alert('Assign Branch Failed', assignRes?.message || 'Failed to assign branch');
          return;
        }
      } catch (e) {
        Alert.alert('Assign Branch Failed', String(e));
        return;
      }
    }

    // Optimistic: set time_in now and disable employee in other branches
    const now = new Date();
    const nowIso = now.toISOString().replace('T', ' ').slice(0, 19);

    const newMap = new Map(timeInBranchMap);
    newMap.set(employee.id, branch.branchName);
    setTimeInBranchMap(newMap);

    const optimisticBranches = branches.map(b => ({
      ...b,
      employees: b.employees?.map(emp => {
        if (emp.id !== employee.id) {
          return {
            ...emp,
            isDisabled: newMap.has(emp.id) && newMap.get(emp.id) !== b.branchName,
          };
        }
        return {
          ...emp,
          time_in: nowIso,
          time_out: null,
          is_time_running: true,
          isSynced: false,
          isDisabled: false,
        };
      }) || [],
    }));
    setBranches(optimisticBranches);

    try {
      const response = await ApiService.timeIn({
        employee_id: employee.id,
        branch_name: branch.branchName,
      });

      if (response?.success) {
        const serverTimeIn = response?.time_in ? String(response.time_in) : nowIso;
        const finalBranches = optimisticBranches.map(b => ({
          ...b,
          employees: b.employees?.map(emp =>
            emp.id === employee.id ? { ...emp, time_in: serverTimeIn, is_time_running: true, isSynced: true } : emp
          ) || [],
        }));
        setBranches(finalBranches);

        if (shouldAssignBranch) {
          await loadBranches();
        }
      } else {
        Alert.alert('Time In Failed', response?.message || 'Failed to time in');
      }
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error);
      Alert.alert('Error', ErrorHandler.getDisplayMessage(errorInfo));
    }
  }, [branches, timeInBranchMap]);

  const handleEmployeeTimeOut = useCallback(async (employee: Employee, branch: Branch) => {
    if (branch.branchName === 'Pool') {
      Alert.alert('No Branch Assigned', 'This employee is not assigned to a branch.');
      return;
    }
    if (!employee.time_in) {
      Alert.alert('Not Timed In', 'Employee has no time in for today.');
      return;
    }
    if (employee.time_out) {
      Alert.alert('Already Timed Out', 'Employee already has a time out for today.');
      return;
    }

    const now = new Date();
    const nowIso = now.toISOString().replace('T', ' ').slice(0, 19);

    // Optimistic: set time_out now
    const optimisticBranches = branches.map(b => ({
      ...b,
      employees: b.employees?.map(emp =>
        emp.id === employee.id ? { ...emp, time_out: nowIso, is_time_running: false, isSynced: false } : emp
      ) || [],
    }));
    setBranches(optimisticBranches);

    try {
      const response = await ApiService.timeOut({
        employee_id: employee.id,
        branch_name: branch.branchName,
      });

      if (response?.success) {
        const serverTimeOut = response?.time_out ? String(response.time_out) : nowIso;

        // Once timed out, allow employee in other branches again
        const newMap = new Map(timeInBranchMap);
        newMap.delete(employee.id);
        setTimeInBranchMap(newMap);

        const finalBranches = optimisticBranches.map(b => ({
          ...b,
          employees: b.employees?.map(emp => {
            if (emp.id === employee.id) return { ...emp, time_out: serverTimeOut, is_time_running: false, isSynced: true };
            return {
              ...emp,
              isDisabled: newMap.has(emp.id) && newMap.get(emp.id) !== b.branchName,
            };
          }) || [],
        }));
        setBranches(finalBranches);
      } else {
        Alert.alert('Time Out Failed', response?.message || 'Failed to time out');
      }
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error);
      Alert.alert('Error', ErrorHandler.getDisplayMessage(errorInfo));
    }
  }, [branches, timeInBranchMap]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadBranches();
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleEmployeeLongPress = useCallback(async (employee: Employee) => {
    const name = `${employee.first_name} ${employee.last_name}`.trim();
    setTimeLogsEmployeeName(name || 'Employee');
    setTimeLogsVisible(true);
    setTimeLogsLoading(true);

    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await ApiService.getShiftLogsToday({ employee_id: employee.id, date: today, limit: 50 });
      console.log('🔍 Time logs API response:', JSON.stringify(res, null, 2));
      
      const logs = Array.isArray((res as any)?.logs) ? (res as any).logs : [];
      console.log('🔍 Extracted logs:', logs);

      if ((res as any)?.success && logs.length > 0) {
        setTimeLogs(logs);
        return;
      }

      // Fallback: show current session fields from employee object
      console.log('🔍 Using fallback - API returned no logs');
      const fallback = employee.time_in
        ? [{ id: 0, time_in: employee.time_in ?? null, time_out: employee.time_out ?? null }]
        : [];
      setTimeLogs(fallback);
    } catch (error) {
      console.log('🔍 Error fetching logs, using fallback:', error);
      const fallback = employee.time_in
        ? [{ id: 0, time_in: employee.time_in ?? null, time_out: employee.time_out ?? null }]
        : [];
      setTimeLogs(fallback);
    } finally {
      setTimeLogsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    setLogoutVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutVisible(false);
    await SessionManager.clearSession();
    router.replace('/login');
  };

  const getTotalPresentCount = () => {
    const loadedEmployees = branches.flatMap(b => b.employees || []);
    if (loadedEmployees.length > 0) {
      // Count unique employee IDs who are currently timed in (is_time_running or time_in and no time_out)
      const timedInIds = new Set<number>();
      loadedEmployees.forEach(e => {
        if (e.is_time_running === true || (!!e.time_in && !e.time_out)) {
          timedInIds.add(e.id);
        }
      });
      return timedInIds.size;
    }
    return Array.from(timeInBranchMap.keys()).length;
  };

  const getBranchCount = () => {
    return branches.filter((b) => b.branchName !== 'Pool').length;
  };

  // Transfer handler: prompts for target branch and calls transfer API
  const handleEmployeeTransfer = useCallback((employee: Employee, fromBranch: Branch) => {
    // List all branches except the current one
    const otherBranches = branches.filter(b => b.branchName !== 'Pool' && b.branchName !== fromBranch.branchName);
    if (otherBranches.length === 0) {
      Alert.alert('No other branches', 'There are no other branches to transfer to.');
      return;
    }
    setTransferEmployee(employee);
    setTransferFromBranch(fromBranch);
    setTransferModalVisible(true);
  }, [branches]);

  const handleSelectTransferBranch = async (toBranchName: string) => {
    if (!transferEmployee || !transferFromBranch) return;
    setTransferModalVisible(false);
    try {
      const res = await ApiService.transferBranch({
        employee_id: transferEmployee.id,
        from_branch: transferFromBranch.branchName,
        to_branch: toBranchName,
      });
      if (res?.success) {
        Alert.alert('Transferred', `Employee transferred to ${toBranchName}.`);
        await loadBranches();
      } else {
        Alert.alert('Transfer failed', res?.message || 'Transfer failed.');
      }
    } catch (err) {
      Alert.alert('Transfer failed', String(err));
    }
    setTransferEmployee(null);
    setTransferFromBranch(null);
  };

  if (isLoading) {
    return <LoadingState message="Loading attendance system..." />;
  }

  const baseBranches = branches.filter((b) => b.branchName !== 'Pool');
  const branchSearchTerm = branchSearch.trim().toLowerCase();
  const visibleBranches = !branchSearchTerm
    ? baseBranches
    : baseBranches.filter((b) => String(b.branchName ?? '').toLowerCase().includes(branchSearchTerm));

  return (
    <View style={styles.container}>
      <LogoutModal
        visible={logoutVisible}
        onCancel={() => setLogoutVisible(false)}
        onConfirm={confirmLogout}
      />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>
              Welcome, {currentUser?.firstName || 'User'}!
            </Text>
            <Text style={styles.dateText}>{currentDate}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color={colors.buttonPrimaryText} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{getTotalPresentCount()}</Text>
            <Text style={styles.statLabel}>Total Timed In</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{getBranchCount()}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
        </View>
      </View>

      <View style={styles.branchSearchWrap}>
        <TextInput
          style={styles.branchSearchInput}
          placeholder="Search project..."
          placeholderTextColor={colors.textSecondary}
          value={branchSearch}
          onChangeText={setBranchSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {/* Branch List */}
      {visibleBranches.length > 0 ? (
        <BranchList
          branches={visibleBranches}
          onBranchPress={handleBranchPress}
          onEmployeeTimeIn={handleEmployeeTimeIn}
          onEmployeeTimeOut={handleEmployeeTimeOut}
          onEmployeeTransfer={handleEmployeeTransfer}
          onEmployeeLongPress={(employee) => handleEmployeeLongPress(employee)}
          onEmployeeSetOtHours={handleEmployeeSetOtHours}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          style={styles.branchList}
        />
      ) : (
        <EmptyState
          title="No Projects Available"
          message="Pull down to refresh or check your connection."
          actionText="Refresh"
          onAction={handleRefresh}
          icon="🏢"
        />
      )}

      {/* Sync Status */}
      <SyncStatus
        onSyncComplete={(result: any) => {
          if (result.success) {
            Alert.alert('Sync Complete', `Synced ${result.syncedCount} records successfully.`);
          } else {
            Alert.alert('Sync Issues', `Failed to sync ${result.failedCount} records.`);
          }
        }}
      />

      <Modal
        visible={attendanceHelpVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAttendanceHelpVisible(false)}
      >
        <Pressable style={styles.helpOverlay} onPress={() => setAttendanceHelpVisible(false)}>
          <Pressable style={styles.helpCard} onPress={() => undefined}>
            <View style={styles.helpHeaderRow}>
              <Text style={styles.helpTitle}>How to use Attendance</Text>
              <Pressable onPress={() => setAttendanceHelpVisible(false)} style={styles.helpCloseButton}>
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.helpScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.helpSectionTitle}>Step-by-step</Text>
              <View style={styles.helpStepList}>
                <Text style={styles.helpStepText}>1. Tap any project name to open it (expand the project)</Text>
                <Text style={styles.helpStepText}>2. Find an employee, then tap the employee card to Time In / Time Out</Text>
                <Text style={styles.helpStepText}>3. Long-press an employee card to open Log Details (time in/out history)</Text>
                <Text style={styles.helpStepText}>4. Tap the 3 dots (⋯) on the employee card for actions:</Text>
                <Text style={styles.helpStepText}>   - Set OT: enter total OT hours for today, then Save</Text>
                <Text style={styles.helpStepText}>   - Copy OT: copies the employee’s OT hours to clipboard</Text>
                <Text style={styles.helpStepText}>   - Paste OT: pastes OT hours from clipboard into Set OT</Text>
                <Text style={styles.helpStepText}>   - View Notes: view attendance/absent notes (if available)</Text>
              </View>

              <View style={styles.helpDivider} />

              <Text style={styles.helpSectionTitle}>Filters</Text>
              <View style={styles.helpStepList}>
                <Text style={styles.helpStepText}>All: shows all employees in the project</Text>
                <Text style={styles.helpStepText}>Present: shows employees who have timed in today (currently timed in)</Text>
                <Text style={styles.helpStepText}>Absent: shows employees who have NOT timed in today</Text>
                <Text style={styles.helpStepText}>OT: shows employees with OT hours saved for today</Text>
              </View>
            </ScrollView>

            <Pressable style={styles.helpOkButton} onPress={() => setAttendanceHelpVisible(false)}>
              <Text style={styles.helpOkText}>OK</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Transfer Modal */}
      {transferModalVisible && transferEmployee && transferFromBranch && (
        <View style={{
          position: 'absolute',
          left: 0, right: 0, top: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 24, width: 320, maxWidth: '90%' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 16, color: colors.text }}>
              Transfer {transferEmployee.first_name} {transferEmployee.last_name} to project:
            </Text>
            {branches.filter(b => b.branchName !== 'Pool' && b.branchName !== transferFromBranch.branchName).map(b => (
              <TouchableOpacity
                key={b.branchName}
                style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border }}
                onPress={() => handleSelectTransferBranch(b.branchName)}
              >
                <Text style={{ color: colors.text, fontSize: 15 }}>{b.branchName}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={{ marginTop: 18, alignSelf: 'flex-end' }}
              onPress={() => setTransferModalVisible(false)}
            >
              <Text style={{ color: colors.tint, fontWeight: 'bold', fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <EmployeeTimeLogsModal
        visible={timeLogsVisible}
        employeeName={timeLogsEmployeeName}
        logs={timeLogs}
        isLoading={timeLogsLoading}
        onClose={() => setTimeLogsVisible(false)}
      />
    </View>
  );
};

const createStyles = (colors: (typeof Colors)[keyof typeof Colors]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    helpOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    helpCard: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.lg,
    },
    helpHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    helpTitle: {
      ...Typography.body,
      fontWeight: '800',
      color: colors.text,
      flex: 1,
      paddingRight: Spacing.sm,
    },
    helpCloseButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    helpScroll: {
      maxHeight: 320,
    },
    helpSectionTitle: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontWeight: '700',
      marginTop: Spacing.sm,
      marginBottom: Spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    helpStepList: {
      gap: 8,
    },
    helpStepText: {
      ...Typography.body,
      color: colors.text,
      lineHeight: 20,
    },
    helpDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: Spacing.lg,
    },
    helpOkButton: {
      marginTop: Spacing.lg,
      backgroundColor: colors.tint,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
    },
    helpOkText: {
      ...Typography.body,
      color: colors.buttonPrimaryText,
      fontWeight: '800',
    },
    header: {
      backgroundColor: colors.tint,
      paddingTop: 60,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    welcomeText: {
      ...Typography.h2,
      color: colors.buttonPrimaryText,
      marginBottom: Spacing.xs,
    },
    dateText: {
      ...Typography.body,
      color: colors.buttonPrimaryText,
      opacity: 0.9,
    },
    logoutButton: {
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: 20,
      padding: Spacing.sm,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      ...Typography.h2,
      color: colors.buttonPrimaryText,
      marginBottom: Spacing.xs,
    },
    statLabel: {
      ...Typography.caption,
      color: colors.buttonPrimaryText,
      opacity: 0.9,
    },
    branchList: {
      flex: 1,
      marginTop: Spacing.sm,
    },
    branchSearchWrap: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      backgroundColor: colors.background,
    },
    branchSearchInput: {
      backgroundColor: colors.surface,
      color: colors.text,
      borderRadius: BorderRadius.md,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });

export default HomeScreen;
