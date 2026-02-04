import { BranchList, EmployeeTimeLogsModal, EmptyState, LoadingState, LogoutModal, SyncStatus } from '@/components';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { ApiService } from '@/services/api';
import { Branch, Employee } from '@/types';
import { ErrorHandler, SessionManager } from '@/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';

const HomeScreen: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeInBranchMap, setTimeInBranchMap] = useState<Map<number, string>>(new Map());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState('');
  const [logoutVisible, setLogoutVisible] = useState(false);

  const [timeLogsVisible, setTimeLogsVisible] = useState(false);
  const [timeLogsEmployeeName, setTimeLogsEmployeeName] = useState('');
  const [timeLogs, setTimeLogs] = useState<Array<{ id?: number; time_in: string | null; time_out: string | null }>>([]);
  const [timeLogsLoading, setTimeLogsLoading] = useState(false);
  
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'dark'];

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
      // Mock branch data - replace with actual API call
      const mockBranches: Branch[] = [
        { branchName: 'Sto. Rosario', isExpanded: false, isLoading: false },
        { branchName: 'Testing', isExpanded: false, isLoading: false },
      ];
      setBranches(mockBranches);
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error);
      Alert.alert('Error', 'Failed to load branches: ' + ErrorHandler.getDisplayMessage(errorInfo));
    }
  };

  const handleBranchPress = useCallback(async (branch: Branch, index: number) => {
    // Close other branches
    const updatedBranches = branches.map((b, i) => ({
      ...b,
      isExpanded: i === index ? !b.isExpanded : false,
    }));
    setBranches(updatedBranches);

    // Load employees if expanding and no employees loaded
    if (!branch.isExpanded && (!branch.employees || branch.employees.length === 0)) {
      // Set loading state
      updatedBranches[index].isLoading = true;
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

        // Only include employees whose latest attendance branch matches this branch (or has no attendance yet)
        const filteredEmployees = dedupedEmployees.filter(emp => {
          const logBranchName = (emp as any).branch_name ?? null;
          // Show if no attendance yet, or if attendance branch matches
          return !logBranchName || String(logBranchName) === branch.branchName;
        });

        // Update employees with time-in/out status
        const updatedEmployees = filteredEmployees.map(emp => {
          const timeIn = (emp as any).time_in ?? null;
          const timeOut = (emp as any).time_out ?? null;
          const logBranchName = (emp as any).branch_name ?? null;
          const isTimeRunning = (emp as any).is_time_running === true || (emp as any).is_time_running === 1;
          const isTimedIn = isTimeRunning || (Boolean(timeIn) && !timeOut);

          const disabledByMap = timeInBranchMap.has(emp.id) && timeInBranchMap.get(emp.id) !== branch.branchName;
          const disabledByLog = isTimedIn && !!logBranchName && String(logBranchName) !== branch.branchName;

          return {
            ...emp,
            time_in: timeIn,
            time_out: timeOut,
            is_time_running: isTimeRunning,
            isDisabled: disabledByMap || disabledByLog,
          };
        });

        updatedBranches[index].employees = updatedEmployees;
        updatedBranches[index].isLoading = false;
        setBranches([...updatedBranches]);
      } catch (error) {
        updatedBranches[index].isLoading = false;
        setBranches([...updatedBranches]);
        
        const errorInfo = ErrorHandler.handle(error);
        Alert.alert('Error', 'Failed to load employees: ' + ErrorHandler.getDisplayMessage(errorInfo));
      }
    }
  }, [branches, timeInBranchMap]);

  const handleEmployeeTimeIn = useCallback(async (employee: Employee, branch: Branch) => {
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
      } else {
        Alert.alert('Time In Failed', response?.message || 'Failed to time in');
      }
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error);
      Alert.alert('Error', ErrorHandler.getDisplayMessage(errorInfo));
    }
  }, [branches, timeInBranchMap]);

  const handleEmployeeTimeOut = useCallback(async (employee: Employee, branch: Branch) => {
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
      const logs = Array.isArray((res as any)?.logs) ? (res as any).logs : [];

      if ((res as any)?.success && logs.length > 0) {
        setTimeLogs(logs);
        return;
      }

      // Fallback: show current session fields from employee object
      const fallback = employee.time_in
        ? [{ id: 0, time_in: employee.time_in ?? null, time_out: employee.time_out ?? null }]
        : [];
      setTimeLogs(fallback);
    } catch {
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
      return loadedEmployees.filter(e => e.is_time_running === true || (!!e.time_in && !e.time_out)).length;
    }
    return Array.from(timeInBranchMap.values()).length;
  };

  if (isLoading) {
    return <LoadingState message="Loading attendance system..." />;
  }

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
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{getTotalPresentCount()}</Text>
            <Text style={styles.statLabel}>Total Timed In</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{branches.length}</Text>
            <Text style={styles.statLabel}>Branches</Text>
          </View>
        </View>
      </View>

      {/* Branch List */}
      {branches.length > 0 ? (
        <BranchList
          branches={branches}
          onBranchPress={handleBranchPress}
          onEmployeeTimeIn={handleEmployeeTimeIn}
          onEmployeeTimeOut={handleEmployeeTimeOut}
          onEmployeeLongPress={(employee) => handleEmployeeLongPress(employee)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          style={styles.branchList}
        />
      ) : (
        <EmptyState
          title="No Branches Available"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    backgroundColor: Colors.dark.tint,
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
    color: Colors.dark.buttonPrimaryText,
    marginBottom: Spacing.xs,
  },
  dateText: {
    ...Typography.body,
    color: Colors.dark.buttonPrimaryText,
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
    color: Colors.dark.buttonPrimaryText,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.dark.buttonPrimaryText,
    opacity: 0.9,
  },
  branchList: {
    flex: 1,
    marginTop: Spacing.sm,
  },
});

export default HomeScreen;
