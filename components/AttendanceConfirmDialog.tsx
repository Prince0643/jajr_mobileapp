import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { Branch, Employee } from '@/types';
import React from 'react';
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface AttendanceConfirmDialogProps {
  visible: boolean;
  employee: Employee | null;
  branch: Branch | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode: 'time_in' | 'time_out';
  branchOptions?: Branch[];
  selectedBranch?: Branch | null;
  onSelectBranch?: (branch: Branch) => void;
}

const AttendanceConfirmDialog: React.FC<AttendanceConfirmDialogProps> = ({
  visible,
  employee,
  branch,
  onConfirm,
  onCancel,
  isLoading = false,
  mode,
  branchOptions,
  selectedBranch,
  onSelectBranch,
}) => {
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];

  if (!employee || !branch) return null;

  const isTimeInMode = mode === 'time_in';
  const isNoBranchTimeIn = isTimeInMode && branch.branchName === 'Pool';
  const needsBranchSelection = isNoBranchTimeIn;
  const hasSelectedBranch = !!selectedBranch && selectedBranch.branchName !== 'Pool';
  
  const title = isTimeInMode ? 'Confirm Time In' : 'Confirm Time Out';
  const displayBranchName = isNoBranchTimeIn
    ? (hasSelectedBranch ? selectedBranch!.branchName : 'Select a branch')
    : branch.branchName;
  const message = isTimeInMode
    ? `Time in ${employee.first_name} ${employee.last_name} in ${displayBranchName}?`
    : `Time out ${employee.first_name} ${employee.last_name} in ${branch.branchName}?`;
  const confirmText = 'YES';
  const confirmColor = isTimeInMode ? '#4CAF50' : '#FF9500';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary || colors.icon }]}>{message}</Text>

          {needsBranchSelection && Array.isArray(branchOptions) && branchOptions.length > 0 && typeof onSelectBranch === 'function' && (
            <View style={styles.branchPickerContainer}>
              <Text style={[styles.branchPickerLabel, { color: colors.text }]}>Select project (required)</Text>
              {branchOptions.map((b) => {
                const isSelected = !!selectedBranch && selectedBranch.branchName === b.branchName;
                return (
                  <TouchableOpacity
                    key={b.branchName}
                    style={[
                      styles.branchOption,
                      { borderColor: colors.border, backgroundColor: isSelected ? (colors.surface || colors.background) : 'transparent' },
                    ]}
                    onPress={() => onSelectBranch(b)}
                    disabled={isLoading}
                  >
                    <Text style={[styles.branchOptionText, { color: colors.text }]}>{b.branchName}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { backgroundColor: colors.buttonSecondary || colors.surface }]}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.buttonSecondaryText || colors.text }]}>CANCEL</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: confirmColor, opacity: needsBranchSelection && !hasSelectedBranch ? 0.5 : 1 },
              ]}
              onPress={onConfirm}
              disabled={isLoading || (needsBranchSelection && !hasSelectedBranch)}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    borderRadius: 12,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  branchPickerContainer: {
    marginBottom: 18,
  },
  branchPickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  branchOption: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelButton: {
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AttendanceConfirmDialog;
