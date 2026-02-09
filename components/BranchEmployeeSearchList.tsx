import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { Branch, Employee } from '@/types';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import EmployeeListItem from './EmployeeListItem';

interface BranchEmployeeSearchListProps {
  employees: Employee[];
  branch: Branch;
  onEmployeeTimeIn: (employee: Employee, branch: Branch) => void;
  onEmployeeTimeOut: (employee: Employee, branch: Branch) => void;
  onEmployeeTransfer?: (employee: Employee, branch: Branch) => void;
  onEmployeeLongPress?: (employee: Employee, branch: Branch) => void;
  onEmployeeSetOtHours?: (employee: Employee, otHours: string) => Promise<void> | void;
  onEmployeeMarkAbsent?: (employee: Employee, branch: Branch) => Promise<void> | void;
}

const BranchEmployeeSearchList: React.FC<BranchEmployeeSearchListProps> = ({
  employees,
  branch,
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
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'present' | 'absent' | 'ot'>('all');
  const [filterPickerOpen, setFilterPickerOpen] = useState(false);

  const hasOtForToday = (emp: Employee) => {
    const overtimeRaw = (emp as any).is_overtime_running;
    if (overtimeRaw === true || overtimeRaw === false) return overtimeRaw;
    if (overtimeRaw === 1 || overtimeRaw === 0) return overtimeRaw === 1;
    if (typeof overtimeRaw === 'string' && (overtimeRaw === '1' || overtimeRaw === '0')) return overtimeRaw === '1';
    const raw = String((emp as any).total_ot_hrs ?? '').trim();
    if (!raw) return false;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0;
  };

  const hasTimeLogToday = (emp: Employee) => {
    const timeIn = (emp as any).time_in ?? null;
    const timeOut = (emp as any).time_out ?? null;
    return Boolean(timeIn) || Boolean(timeOut);
  };

  const getStatusToday = (emp: Employee) => {
    const raw = (emp as any).today_status;
    return String(raw ?? '').trim();
  };

  const filtered = useMemo(() => {
    const byAttendance = employees.filter((emp) => {
      if (filterMode === 'present') return getStatusToday(emp).toLowerCase() === 'present';
      if (filterMode === 'absent') return getStatusToday(emp).toLowerCase() === 'absent';
      if (filterMode === 'ot') return hasOtForToday(emp);
      return true;
    });

    if (!search.trim()) return byAttendance;
    const s = search.trim().toLowerCase();
    return byAttendance.filter((emp) =>
      (`${emp.first_name} ${emp.last_name}`.toLowerCase().includes(s) || emp.employee_code.toLowerCase().includes(s))
    );
  }, [employees, filterMode, search]);

  const presentCount = useMemo(
    () => employees.filter((e) => getStatusToday(e).toLowerCase() === 'present').length,
    [employees]
  );
  const absentCount = useMemo(
    () => employees.filter((e) => getStatusToday(e).toLowerCase() === 'absent').length,
    [employees]
  );
  const otCount = useMemo(() => employees.filter((e) => hasOtForToday(e)).length, [employees]);

  const filterLabel = useMemo(() => {
    if (filterMode === 'present') return `Present (${presentCount})`;
    if (filterMode === 'absent') return `Absent (${absentCount})`;
    if (filterMode === 'ot') return `OT (${otCount})`;
    return `All (${employees.length})`;
  }, [absentCount, employees.length, filterMode, otCount, presentCount]);

  return (
    <View>
      <Pressable style={styles.filterDropdown} onPress={() => setFilterPickerOpen(true)}>
        <Text style={styles.filterDropdownText}>{filterLabel}</Text>
        <Text style={styles.filterDropdownChevron}>▼</Text>
      </Pressable>
      <TextInput
        style={styles.searchInput}
        placeholder="Search employee name or code..."
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
        autoCapitalize="none"
      />

      <Modal
        visible={filterPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterPickerOpen(false)}
      >
        <Pressable style={styles.pickerOverlay} onPress={() => setFilterPickerOpen(false)}>
          <Pressable style={styles.pickerCard} onPress={() => undefined}>
            <Pressable
              style={[styles.pickerItem, filterMode === 'all' ? styles.pickerItemActive : undefined]}
              onPress={() => {
                setFilterMode('all');
                setFilterPickerOpen(false);
              }}
            >
              <Text style={[styles.pickerItemText, filterMode === 'all' ? styles.pickerItemTextActive : undefined]}>
                All ({employees.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.pickerItem, filterMode === 'present' ? styles.pickerItemActive : undefined]}
              onPress={() => {
                setFilterMode('present');
                setFilterPickerOpen(false);
              }}
            >
              <Text style={[styles.pickerItemText, filterMode === 'present' ? styles.pickerItemTextActive : undefined]}>
                Present ({presentCount})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.pickerItem, filterMode === 'absent' ? styles.pickerItemActive : undefined]}
              onPress={() => {
                setFilterMode('absent');
                setFilterPickerOpen(false);
              }}
            >
              <Text style={[styles.pickerItemText, filterMode === 'absent' ? styles.pickerItemTextActive : undefined]}>
                Absent ({absentCount})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.pickerItem, styles.pickerItemLast, filterMode === 'ot' ? styles.pickerItemActive : undefined]}
              onPress={() => {
                setFilterMode('ot');
                setFilterPickerOpen(false);
              }}
            >
              <Text style={[styles.pickerItemText, filterMode === 'ot' ? styles.pickerItemTextActive : undefined]}>
                OT ({otCount})
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

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
            onMarkAbsent={onEmployeeMarkAbsent ? () => onEmployeeMarkAbsent(employee, branch) : undefined}
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
    filterDropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginHorizontal: 10,
      marginTop: 10,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: borderLight,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: colors.card,
    },
    filterDropdownText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
    },
    filterDropdownChevron: {
      color: colors.textSecondary,
      fontSize: 12,
      marginLeft: 10,
    },
    pickerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    pickerCard: {
      width: '100%',
      maxWidth: 320,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: borderLight,
      overflow: 'hidden',
    },
    pickerItem: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: borderLight,
    },
    pickerItemLast: {
      borderBottomWidth: 0,
    },
    pickerItemActive: {
      backgroundColor: colors.tint,
      borderBottomColor: colors.tint,
    },
    pickerItemText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    pickerItemTextActive: {
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
