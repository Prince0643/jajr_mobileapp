import { BranchList, EmptyState, LoadingState, LogoutModal, SyncStatus } from '@/components';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { ApiService } from '@/services/api';
import { Branch, Employee } from '@/types';
import { ErrorHandler, SessionManager, syncManager } from '@/utils';
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
  const [presentMap, setPresentMap] = useState<Map<number, string>>(new Map());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState('');
  const [logoutVisible, setLogoutVisible] = useState(false);
  
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
        
        // Update employees with present status
        const updatedEmployees = safeEmployees.map(emp => ({
          ...emp,
          isPresent:
            (typeof emp.today_status === 'string' && emp.today_status.toLowerCase() === 'present') ||
            presentMap.get(emp.id) === branch.branchName,
          isDisabled:
            (presentMap.has(emp.id) && presentMap.get(emp.id) !== branch.branchName),
        }));

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
  }, [branches, presentMap]);

  const handleEmployeePresent = useCallback(async (employee: Employee, branch: Branch) => {
    // Save offline first
    try {
      await syncManager.saveAttendanceOffline(employee.id, branch.branchName, 'present');
    } catch (error) {
      console.error('Error saving offline attendance:', error);
    }

    // Update local state immediately (optimistic update)
    const newPresentMap = new Map(presentMap);
    newPresentMap.set(employee.id, branch.branchName);
    setPresentMap(newPresentMap);

    // Update all branches and employees
    const updatedBranches = branches.map(b => ({
      ...b,
      employees: b.employees?.map(emp => ({
        ...emp,
        isPresent: newPresentMap.get(emp.id) === b.branchName,
        isDisabled: newPresentMap.has(emp.id) && newPresentMap.get(emp.id) !== b.branchName,
        isSynced: false, // Mark as unsynced until confirmed
      })) || [],
    }));
    setBranches(updatedBranches);

    // Try to sync with server if online
    try {
      const response = await ApiService.saveAttendance({
        employee_id: employee.id,
        branch_name: branch.branchName,
      });

      const message = (response as any)?.message || '';
      const alreadyTimedInToday = typeof message === 'string' && message.toLowerCase().includes('already timed-in');

      if (response.success || alreadyTimedInToday) {
        // Treat "already timed-in today" as present and synced (server already has it)
        const finalBranches = updatedBranches.map(b => ({
          ...b,
          employees: b.employees?.map(emp =>
            emp.id === employee.id ? { ...emp, isSynced: true, isPresent: true } : emp
          ) || [],
        }));
        setBranches(finalBranches);
      } else {
        // Keep as unsynced - will sync later
        Alert.alert('Sync Failed', message || 'Attendance saved locally, will sync when online');
      }
    } catch (error) {
      // Keep as unsynced - will sync later
      const errorInfo = ErrorHandler.handle(error);
      console.log('Attendance saved locally, will sync when online:', errorInfo.message);
    }
  }, [branches, presentMap]);

  const handleEmployeeUndo = useCallback((employee: Employee) => {
    if (employee.isSynced) {
      Alert.alert('Cannot Undo', 'This attendance has already been synced with the server.');
      return;
    }

    // Update local state
    const newPresentMap = new Map(presentMap);
    newPresentMap.delete(employee.id);
    setPresentMap(newPresentMap);

    // Update all branches and employees
    const updatedBranches = branches.map(b => ({
      ...b,
      employees: b.employees?.map(emp => ({
        ...emp,
        isPresent: newPresentMap.get(emp.id) === b.branchName,
        isDisabled: newPresentMap.has(emp.id) && newPresentMap.get(emp.id) !== b.branchName,
      })) || [],
    }));
    setBranches(updatedBranches);
  }, [branches, presentMap]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadBranches();
    } finally {
      setIsRefreshing(false);
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
      return loadedEmployees.filter(e => e.isPresent).length;
    }
    return Array.from(presentMap.values()).length;
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
            <Text style={styles.statLabel}>Total Present</Text>
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
          onEmployeePresent={handleEmployeePresent}
          onEmployeeUndo={handleEmployeeUndo}
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
