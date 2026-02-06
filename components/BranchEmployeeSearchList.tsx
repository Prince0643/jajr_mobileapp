import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { Branch, Employee } from '@/types';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import EmployeeListItem from './EmployeeListItem';

interface BranchEmployeeSearchListProps {
  employees: Employee[];
  branch: Branch;
  onEmployeeTimeIn: (employee: Employee, branch: Branch) => void;
  onEmployeeTimeOut: (employee: Employee, branch: Branch) => void;
  onEmployeeTransfer?: (employee: Employee, branch: Branch) => void;
  onEmployeeLongPress?: (employee: Employee, branch: Branch) => void;
  onEmployeeSetOtHours?: (employee: Employee, otHours: string) => Promise<void> | void;
}

const BranchEmployeeSearchList: React.FC<BranchEmployeeSearchListProps> = ({
  employees,
  branch,
  onEmployeeTimeIn,
  onEmployeeTimeOut,
  onEmployeeTransfer,
  onEmployeeLongPress,
  onEmployeeSetOtHours,
}) => {
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];
  const borderLight = ('borderLight' in colors ? (colors as any).borderLight : undefined) ?? colors.border;
  const styles = useMemo(() => createStyles(colors, borderLight), [borderLight, colors]);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'present' | 'absent' | 'ot'>('all');

  const hasOtForToday = (emp: Employee) => {
    const raw = String((emp as any).total_ot_hrs ?? '').trim();
    if (!raw) return false;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0;
  };

  const filtered = useMemo(() => {
    const byAttendance = employees.filter((emp) => {
      const isTimeRunning = !!emp.is_time_running;
      if (filterMode === 'present') return isTimeRunning;
      if (filterMode === 'absent') return !isTimeRunning && !hasOtForToday(emp);
      if (filterMode === 'ot') return hasOtForToday(emp);
      return true;
    });

    if (!search.trim()) return byAttendance;
    const s = search.trim().toLowerCase();
    return byAttendance.filter((emp) =>
      (`${emp.first_name} ${emp.last_name}`.toLowerCase().includes(s) || emp.employee_code.toLowerCase().includes(s))
    );
  }, [employees, filterMode, search]);

  const presentCount = useMemo(() => employees.filter((e) => !!e.is_time_running).length, [employees]);
  const absentCount = useMemo(() => employees.filter((e) => !e.is_time_running && !hasOtForToday(e)).length, [employees]);
  const otCount = useMemo(() => employees.filter((e) => hasOtForToday(e)).length, [employees]);

  return (
    <View>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterPill, filterMode === 'all' ? styles.filterPillActive : undefined]}
          onPress={() => setFilterMode('all')}
        >
          <Text style={[styles.filterText, filterMode === 'all' ? styles.filterTextActive : undefined]}>All ({employees.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, filterMode === 'present' ? styles.filterPillActive : undefined]}
          onPress={() => setFilterMode('present')}
        >
          <Text style={[styles.filterText, filterMode === 'present' ? styles.filterTextActive : undefined]}>Present ({presentCount})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, filterMode === 'absent' ? styles.filterPillActive : undefined]}
          onPress={() => setFilterMode('absent')}
        >
          <Text style={[styles.filterText, filterMode === 'absent' ? styles.filterTextActive : undefined]}>Absent ({absentCount})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, filterMode === 'ot' ? styles.filterPillActive : undefined]}
          onPress={() => setFilterMode('ot')}
        >
          <Text style={[styles.filterText, filterMode === 'ot' ? styles.filterTextActive : undefined]}>OT ({otCount})</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search employee name or code..."
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {filtered.length > 0 ? (
        filtered.map((employee, index) => (
          <EmployeeListItem
            key={employee.id ? `emp_${employee.id}_${index}` : `idx_${index}`}
            employee={employee}
            onTimeInPress={() => onEmployeeTimeIn(employee, branch)}
            onTimeOutPress={() => onEmployeeTimeOut(employee, branch)}
            onTransfer={undefined}
            onLongPress={onEmployeeLongPress ? () => onEmployeeLongPress(employee, branch) : undefined}
            onSetOtHours={onEmployeeSetOtHours ? (emp, hrs) => onEmployeeSetOtHours(emp, hrs) : undefined}
            isExpanded={branch.isExpanded}
          />
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No employees match your search</Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: (typeof Colors)[keyof typeof Colors], borderLight: string) =>
  StyleSheet.create({
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      marginHorizontal: 10,
      marginTop: 10,
      marginBottom: 6,
    },
    filterPill: {
      flex: 1,
      borderWidth: 1,
      borderColor: borderLight,
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterPillActive: {
      borderColor: colors.tint,
      backgroundColor: colors.tint,
    },
    filterText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '700',
    },
    filterTextActive: {
      color: colors.buttonPrimaryText,
    },
    searchInput: {
      backgroundColor: colors.surface,
      color: colors.text,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 8,
      marginHorizontal: 10,
      marginTop: 6,
      marginBottom: 8,
      fontSize: 15,
      borderWidth: 1,
      borderColor: borderLight,
    },
    emptyContainer: {
      alignItems: 'center',
      padding: 24,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontStyle: 'italic',
    },
  });

export default BranchEmployeeSearchList;
