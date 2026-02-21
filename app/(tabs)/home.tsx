import { BranchList, EmployeeTimeLogsModal, EmptyState, LoadingState, OvertimeModal, SyncStatus } from '@/components';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { ApiService } from '@/services/api';
import { Branch, Employee } from '@/types';
import { ErrorHandler, SessionManager, UserAttendanceState } from '@/utils';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HomeScreen: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeInBranchMap, setTimeInBranchMap] = useState<Map<number, string>>(new Map());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState('');
  const [attendanceHelpVisible, setAttendanceHelpVisible] = useState(false);
  const helpOpenedRef = useRef(false);

  const [branchSearch, setBranchSearch] = useState('');
  // Transfer modal state
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferEmployee, setTransferEmployee] = useState<Employee | null>(null);
  const [transferFromBranch, setTransferFromBranch] = useState<Branch | null>(null);

  const [timeLogsVisible, setTimeLogsVisible] = useState(false);
  const [timeLogsEmployeeName, setTimeLogsEmployeeName] = useState('');
  const [timeLogs, setTimeLogs] = useState<Array<{ id?: number; time_in: string | null; time_out: string | null }>>([]);
  const [timeLogsLoading, setTimeLogsLoading] = useState(false);

  // Self time-in state for logged-in user
  const [userAttendance, setUserAttendance] = useState<UserAttendanceState | null>(null);
  const [isUserTimeLoading, setIsUserTimeLoading] = useState(false);
  const [selfBranchPickerVisible, setSelfBranchPickerVisible] = useState(false);
  const [overtimeModalVisible, setOvertimeModalVisible] = useState(false);
  const [selectedSelfBranch, setSelectedSelfBranch] = useState<Branch | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

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

      // Load user's attendance status
      if (user) {
        await loadUserAttendance(user.userId);
      }

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

  const loadUserAttendance = async (employeeId: number) => {
    try {
      // Fetch current user's attendance from API
      const today = new Date().toISOString().slice(0, 10);
      const response = await ApiService.getShiftLogsToday({ employee_id: employeeId, date: today, limit: 10 });
      
      if (response.success && response.logs && response.logs.length > 0) {
        // Find the most recent log without a time_out (active session)
        const activeLog = response.logs.find(log => log.time_in && !log.time_out);
        const latestLog = response.logs[0];
        
        if (activeLog) {
          // User is currently timed in
          const isTimedIn = true;
          
          // Try to get branch name from the log or find in branches
          let branchName = (activeLog as any).branch_name || (activeLog as any).branchName || null;
          
          // If no branch name in log, try to find from branches list
          if (!branchName) {
            const userBranch = branches.find(b => 
              b.employees?.some(e => e.id === employeeId)
            );
            branchName = userBranch?.branchName || null;
          }

          const state: UserAttendanceState = {
            employeeId,
            branchName,
            timeIn: activeLog.time_in || null,
            timeOut: null,
            isTimedIn,
          };
          
          setUserAttendance(state);
          await SessionManager.saveUserAttendanceState(state);
        } else if (latestLog.time_out) {
          // User has timed out today
          const state: UserAttendanceState = {
            employeeId,
            branchName: (latestLog as any).branch_name || (latestLog as any).branchName || null,
            timeIn: latestLog.time_in || null,
            timeOut: latestLog.time_out || null,
            isTimedIn: false,
          };
          setUserAttendance(state);
          await SessionManager.saveUserAttendanceState(state);
        }
      } else {
        // User has not timed in today
        const state: UserAttendanceState = {
          employeeId,
          branchName: null,
          timeIn: null,
          timeOut: null,
          isTimedIn: false,
        };
        setUserAttendance(state);
        await SessionManager.saveUserAttendanceState(state);
      }
    } catch (error) {
      console.error('Error loading user attendance:', error);
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

  const handleEmployeeMarkAbsent = useCallback(async (employee: Employee, branch: Branch) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await ApiService.markAttendanceAbsent({ employee_id: employee.id, branch_name: branch.branchName, date: today });
      if (!res?.success) {
        Alert.alert('Mark Absent Failed', res?.message || 'Failed to mark absent');
        return;
      }

      setBranches((prev) =>
        prev.map((b) => ({
          ...b,
          employees: (b.employees || []).map((e) =>
            e.id === employee.id
              ? {
                  ...e,
                  today_status: 'Absent',
                  is_time_running: false,
                  total_ot_hrs: '',
                  is_overtime_running: 0 as any,
                }
              : e
          ),
        }))
      );

      await loadBranches();
    } catch (e: any) {
      Alert.alert('Mark Absent Failed', String(e?.message || e || 'Failed to mark absent'));
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
          today_status: 'Present',
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
            emp.id === employee.id
              ? {
                  ...emp,
                  time_in: serverTimeIn,
                  is_time_running: true,
                  today_status: 'Present',
                  isSynced: true,
                }
              : emp
          ) || [],
        }));
        setBranches(finalBranches);

        // Update self attendance if this is the current user
        if (currentUser && employee.id === currentUser.userId) {
          const updatedState: UserAttendanceState = {
            employeeId: employee.id,
            branchName: branch.branchName,
            timeIn: serverTimeIn,
            timeOut: null,
            isTimedIn: true,
          };
          setUserAttendance(updatedState);
          await SessionManager.saveUserAttendanceState(updatedState);
        }

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
  }, [branches, timeInBranchMap, currentUser]);

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
        emp.id === employee.id
          ? { ...emp, time_out: nowIso, is_time_running: false, today_status: 'Present', isSynced: false }
          : emp
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
            if (emp.id === employee.id) {
              return {
                ...emp,
                time_out: serverTimeOut,
                is_time_running: false,
                today_status: 'Present',
                isSynced: true,
              };
            }
            return {
              ...emp,
              isDisabled: newMap.has(emp.id) && newMap.get(emp.id) !== b.branchName,
            };
          }) || [],
        }));
        setBranches(finalBranches);

        // Update self attendance if this is the current user
        if (currentUser && employee.id === currentUser.userId) {
          const updatedState: UserAttendanceState = {
            employeeId: employee.id,
            branchName: branch.branchName,
            timeIn: employee.time_in || null,
            timeOut: serverTimeOut,
            isTimedIn: false,
          };
          setUserAttendance(updatedState);
          await SessionManager.saveUserAttendanceState(updatedState);
        }
      } else {
        Alert.alert('Time Out Failed', response?.message || 'Failed to time out');
      }
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error);
      Alert.alert('Error', ErrorHandler.getDisplayMessage(errorInfo));
    }
  }, [branches, timeInBranchMap, currentUser]);

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

  const getTotalPresentCount = () => {
    const loadedEmployees = branches.flatMap(b => b.employees || []);
    if (loadedEmployees.length > 0) {
      // Count unique employee IDs who are currently Present
      const timedInIds = new Set<number>();
      loadedEmployees.forEach(e => {
        if (e.today_status === 'Present') {
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

  // Self time-in/time-out handlers for logged-in user
  const handleSelfTimeIn = useCallback(async () => {
    if (!currentUser) return;

    // Find user's branch from the branches list
    const userBranch = branches.find(b => 
      b.employees?.some(e => e.id === currentUser.userId)
    );

    // If no branch assigned, show branch picker
    if (!userBranch || userBranch.branchName === 'Pool') {
      const availableBranches = branches.filter(b => b.branchName !== 'Pool');
      if (availableBranches.length === 0) {
        Alert.alert('No Branches', 'No branches are available. Please contact your administrator.');
        return;
      }
      setSelfBranchPickerVisible(true);
      return;
    }

    // User has a branch, proceed with time-in
    await performSelfTimeIn(userBranch);
  }, [currentUser, branches]);

  const performSelfTimeIn = async (branch: Branch) => {
    if (!currentUser) return;

    setIsUserTimeLoading(true);
    const now = new Date();
    const nowIso = now.toISOString().replace('T', ' ').slice(0, 19);

    try {
      // First assign the employee to the branch if needed
      const hasAssignedBranch = branches.some(b => 
        b.employees?.some(e => e.id === currentUser.userId && b.branchName !== 'Pool')
      );
      
      if (!hasAssignedBranch && typeof branch.id === 'number') {
        try {
          const assignRes = await ApiService.setEmployeeBranch({ 
            employee_id: currentUser.userId, 
            branch_id: branch.id 
          });
          if (!assignRes?.success) {
            console.log('Branch assignment note:', assignRes?.message || 'Could not assign branch');
          }
        } catch (e) {
          console.log('Branch assignment failed (non-critical):', e);
        }
      }

      const response = await ApiService.timeIn({
        employee_id: currentUser.userId,
        branch_name: branch.branchName,
      });

      if (response?.success) {
        const serverTimeIn = response?.time_in ? String(response.time_in) : nowIso;
        
        const state: UserAttendanceState = {
          employeeId: currentUser.userId,
          branchName: branch.branchName,
          timeIn: serverTimeIn,
          timeOut: null,
          isTimedIn: true,
        };
        
        setUserAttendance(state);
        await SessionManager.saveUserAttendanceState(state);
        
        // Refresh branches to show updated status
        await loadBranches();
      } else {
        Alert.alert('Time In Failed', response?.message || 'Failed to time in');
      }
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error);
      Alert.alert('Error', ErrorHandler.getDisplayMessage(errorInfo));
    } finally {
      setIsUserTimeLoading(false);
    }
  };

  const handleSelectSelfBranch = async (branch: Branch) => {
    setSelfBranchPickerVisible(false);
    setSelectedSelfBranch(branch);
    await performSelfTimeIn(branch);
  };

  const handleSelfTimeOut = useCallback(async () => {
    if (!currentUser || !userAttendance?.branchName) return;

    setIsUserTimeLoading(true);
    const now = new Date();
    const nowIso = now.toISOString().replace('T', ' ').slice(0, 19);

    try {
      const response = await ApiService.timeOut({
        employee_id: currentUser.userId,
        branch_name: userAttendance.branchName,
      });

      if (response?.success) {
        const serverTimeOut = response?.time_out ? String(response.time_out) : nowIso;
        
        const state: UserAttendanceState = {
          employeeId: currentUser.userId,
          branchName: userAttendance.branchName,
          timeIn: userAttendance.timeIn,
          timeOut: serverTimeOut,
          isTimedIn: false,
        };
        
        setUserAttendance(state);
        await SessionManager.saveUserAttendanceState(state);
        
        // Refresh branches to show updated status
        await loadBranches();
      } else {
        Alert.alert('Time Out Failed', response?.message || 'Failed to time out');
      }
    } catch (error) {
      const errorInfo = ErrorHandler.handle(error);
      Alert.alert('Error', ErrorHandler.getDisplayMessage(errorInfo));
    } finally {
      setIsUserTimeLoading(false);
    }
  }, [currentUser, userAttendance]);

  const handleListScroll = useCallback(
    (e: any) => {
      const y = Number(e?.nativeEvent?.contentOffset?.y ?? 0);
      if (!Number.isFinite(y) || headerHeight <= 0) return;
      const nextSticky = y >= headerHeight;
      setIsSearchSticky((prev) => (prev === nextSticky ? prev : nextSticky));
    },
    [headerHeight]
  );

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
      <BranchList
        branches={visibleBranches}
        onBranchPress={handleBranchPress}
        onEmployeeTimeIn={handleEmployeeTimeIn}
        onEmployeeTimeOut={handleEmployeeTimeOut}
        onEmployeeTransfer={handleEmployeeTransfer}
        onEmployeeLongPress={(employee) => handleEmployeeLongPress(employee)}
        onEmployeeSetOtHours={handleEmployeeSetOtHours}
        onEmployeeMarkAbsent={handleEmployeeMarkAbsent}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onScroll={handleListScroll}
        scrollEventThrottle={16}
        headerComponent={
          <View
            style={styles.headerContent}
            onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
          >
            <View style={styles.headerTop}>
              <Text style={styles.welcomeText}>Attendance</Text>
              <Text style={styles.dateText}>{currentDate}</Text>
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

            <TouchableOpacity style={styles.overtimeButton} onPress={() => setOvertimeModalVisible(true)}>
              <Ionicons name="time-outline" size={20} color={colors.buttonPrimaryText} />
              <Text style={styles.overtimeButtonText}>Overtime</Text>
            </TouchableOpacity>

            <View style={[
              styles.selfTimeCard,
              userAttendance?.isTimedIn && styles.selfTimeCardActive
            ]}>
              <View style={styles.selfTimeInfo}>
                <View style={[
                  styles.selfTimeIconContainer,
                  userAttendance?.isTimedIn && styles.selfTimeIconContainerActive
                ]}>
                  <Ionicons 
                    name={userAttendance?.isTimedIn ? "time" : "timer-outline"} 
                    size={24} 
                    color={userAttendance?.isTimedIn ? '#4CAF50' : colors.buttonPrimaryText} 
                  />
                </View>
                <View style={styles.selfTimeTextContainer}>
                  <Text style={[
                    styles.selfTimeStatus,
                    userAttendance?.isTimedIn && styles.selfTimeStatusActive
                  ]}>
                    {userAttendance?.isTimedIn ? 'Currently Timed In' : 'Not Timed In'}
                  </Text>
                  {userAttendance?.branchName && (
                    <Text style={[
                      styles.selfTimeBranch,
                      userAttendance?.isTimedIn && styles.selfTimeBranchActive
                    ]}>
                      📍 {userAttendance.branchName}
                    </Text>
                  )}
                  {userAttendance?.timeIn && (
                    <Text style={[
                      styles.selfTimeDetail,
                      userAttendance?.isTimedIn && styles.selfTimeDetailActive
                    ]}>
                      In: {new Date(userAttendance.timeIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.selfTimeButton,
                  userAttendance?.isTimedIn ? styles.selfTimeOutButton : styles.selfTimeInButton,
                  isUserTimeLoading && styles.selfTimeButtonDisabled,
                ]}
                onPress={userAttendance?.isTimedIn ? handleSelfTimeOut : handleSelfTimeIn}
                disabled={isUserTimeLoading}
              >
                {isUserTimeLoading ? (
                  <Text style={styles.selfTimeButtonText}>...</Text>
                ) : (
                  <Text style={styles.selfTimeButtonText}>
                    {userAttendance?.isTimedIn ? 'Time Out' : 'Time In'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        }
        searchComponent={
          <View
            style={[
              styles.branchSearchWrap,
              isSearchSticky && { paddingTop: Spacing.md + insets.top },
            ]}
          >
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
        }
        stickySearch
        emptyComponent={
          <EmptyState
            title="No Projects Available"
            message="Pull down to refresh or check your connection."
            actionText="Refresh"
            onAction={handleRefresh}
            icon="🏢"
          />
        }
      />

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
                <Text style={styles.helpStepText}>4. Tap the header "Overtime" button to request/approve overtime hours</Text>
              </View>

              <View style={styles.helpDivider} />

              <Text style={styles.helpSectionTitle}>Overtime Requests</Text>
              <View style={styles.helpStepList}>
                <Text style={styles.helpStepText}>• Employees can submit overtime requests (max 4 hours)</Text>
                <Text style={styles.helpStepText}>• Admins can approve or reject pending requests</Text>
                <Text style={styles.helpStepText}>• Approved OT hours are automatically added to attendance</Text>
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

      {/* Self Branch Picker Modal */}
      {selfBranchPickerVisible && (
        <View style={{
          position: 'absolute',
          left: 0, right: 0, top: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <View style={{ 
            backgroundColor: colors.card, 
            borderRadius: 12, 
            padding: 24, 
            width: 320, 
            maxWidth: '90%',
            maxHeight: '70%'
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 16, color: colors.text }}>
              Select a Project to Time In:
            </Text>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={true}>
              {branches.filter(b => b.branchName !== 'Pool').map(b => (
                <TouchableOpacity
                  key={b.branchName}
                  style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border }}
                  onPress={() => handleSelectSelfBranch(b)}
                >
                  <Text style={{ color: colors.text, fontSize: 15 }}>{b.branchName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={{ marginTop: 18, alignSelf: 'flex-end' }}
              onPress={() => setSelfBranchPickerVisible(false)}
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

      <OvertimeModal
        visible={overtimeModalVisible}
        onClose={() => setOvertimeModalVisible(false)}
        currentUser={currentUser}
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
    headerContent: {
      backgroundColor: colors.tint,
      paddingTop: 60,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
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
    headerTop: {
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
    overtimeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      marginTop: Spacing.md,
      gap: 8,
    },
    overtimeButtonText: {
      ...Typography.body,
      color: colors.buttonPrimaryText,
      fontWeight: '600',
    },
    branchSearchWrap: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
    // Self Time In styles
    selfTimeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginTop: Spacing.md,
    },
    selfTimeCardActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    selfTimeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    selfTimeIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    selfTimeIconContainerActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    selfTimeTextContainer: {
      marginLeft: Spacing.md,
    },
    selfTimeStatus: {
      ...Typography.body,
      fontWeight: '700',
      color: colors.buttonPrimaryText,
    },
    selfTimeStatusActive: {
      color: colors.buttonPrimaryText,
    },
    selfTimeBranch: {
      ...Typography.caption,
      color: colors.buttonPrimaryText,
      opacity: 0.9,
      marginTop: 2,
    },
    selfTimeBranchActive: {
      color: colors.buttonPrimaryText,
      opacity: 1,
      fontWeight: '600',
    },
    selfTimeDetail: {
      ...Typography.caption,
      color: colors.buttonPrimaryText,
      opacity: 0.8,
      marginTop: 2,
      fontSize: 12,
    },
    selfTimeDetailActive: {
      color: colors.buttonPrimaryText,
      opacity: 0.9,
    },
    selfTimeButton: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      minWidth: 80,
      alignItems: 'center',
    },
    selfTimeInButton: {
      backgroundColor: '#4CAF50',
    },
    selfTimeOutButton: {
      backgroundColor: '#F44336',
    },
    selfTimeButtonDisabled: {
      opacity: 0.6,
    },
    selfTimeButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 14,
    },
  });

export default HomeScreen;
