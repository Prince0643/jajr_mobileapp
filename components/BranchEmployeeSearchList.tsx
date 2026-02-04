import { Colors } from '@/constants/theme';
import { Branch, Employee } from '@/types';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import EmployeeListItem from './EmployeeListItem';

interface BranchEmployeeSearchListProps {
  employees: Employee[];
  branch: Branch;
  onEmployeeTimeIn: (employee: Employee, branch: Branch) => void;
  onEmployeeTimeOut: (employee: Employee, branch: Branch) => void;
  onEmployeeLongPress?: (employee: Employee, branch: Branch) => void;
}

const BranchEmployeeSearchList: React.FC<BranchEmployeeSearchListProps> = ({
  employees,
  branch,
  onEmployeeTimeIn,
  onEmployeeTimeOut,
  onEmployeeLongPress,
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const s = search.trim().toLowerCase();
    return employees.filter(emp =>
      (`${emp.first_name} ${emp.last_name}`.toLowerCase().includes(s) ||
        emp.employee_code.toLowerCase().includes(s))
    );
  }, [employees, search]);

  return (
    <View>
      <TextInput
        style={styles.searchInput}
        placeholder="Search employee name or code..."
        placeholderTextColor={Colors.dark.textSecondary}
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
            onLongPress={onEmployeeLongPress ? () => onEmployeeLongPress(employee, branch) : undefined}
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

const styles = StyleSheet.create({
  searchInput: {
    backgroundColor: Colors.dark.surface,
    color: Colors.dark.text,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 10,
    marginTop: 8,
    marginBottom: 8,
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default BranchEmployeeSearchList;
