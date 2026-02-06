import { Colors } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { Employee } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface EmployeeListItemProps {
  employee: Employee;
  onTimeInPress: () => void;
  onTimeOutPress: () => void;
  onTransfer?: () => void;
  onLongPress?: () => void;
  onSetOtHours?: (employee: Employee, otHours: string) => Promise<void> | void;
  isExpanded?: boolean;
}

const EmployeeListItem: React.FC<EmployeeListItemProps> = ({
  employee,
  onTimeInPress,
  onTimeOutPress,
  onTransfer,
  onLongPress,
  onSetOtHours,
  isExpanded = false,
}) => {
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];
  const [menuVisible, setMenuVisible] = useState(false);
  const [otModalVisible, setOtModalVisible] = useState(false);
  const [otHours, setOtHours] = useState('');
  const [otSaving, setOtSaving] = useState(false);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [notes, setNotes] = useState('');

  const hasOt = !!String(employee.total_ot_hrs ?? '').trim();

  const isTimeRunning =
    (employee.is_time_running === true || (!!employee.time_in && !employee.time_out)) && !employee.time_out;

  const handlePress = () => {
    if (employee.isDisabled) return;
    if (!isTimeRunning) {
      onTimeInPress();
      return;
    }
    if (isTimeRunning) {
      onTimeOutPress();
      return;
    }
  };

  const getStatusColor = () => {
    if (hasOt) return '#8E44AD';
    if (employee.time_in && employee.time_out) return '#34C759';
    if (isTimeRunning) return '#FF9500';
    if (employee.isDisabled) return colors.textDisabled || '#9E9E9E';
    return colors.tint;
  };

  const getStatusTextColor = () => {
    if (hasOt) return '#fff';
    if (employee.time_in && employee.time_out) return '#fff';
    if (employee.time_in) return '#fff';
    if (employee.isDisabled) return colors.buttonPrimaryText || '#000';
    return colors.buttonPrimaryText || '#000';
  };

  const getStatusText = () => {
    if (hasOt) return 'OT';
    if (employee.time_in && employee.time_out) return 'TIME IN';
    if (isTimeRunning) return 'PRESENT';
    if (employee.isDisabled) return 'MARKED ELSEWHERE';
    return 'TIME IN';
  };

  const closeMenu = () => setMenuVisible(false);

  const handleViewTimeLogs = () => {
    closeMenu();
    if (typeof onLongPress === 'function') {
      onLongPress();
    }
  };

  const handleSetAsOt = () => {
    closeMenu();
    setOtHours('');
    setOtModalVisible(true);
  };

  const handleNotes = () => {
    closeMenu();
    setNotes('');
    setNotesModalVisible(true);
  };

  const handleCopyOt = async () => {
    closeMenu();
    const value = String(employee.total_ot_hrs ?? '').trim();
    if (!value) return;
    try {
      await Clipboard.setStringAsync(value);
      Alert.alert('Copied', `OT hours copied: ${value}`);
    } catch (e) {
      Alert.alert('Copy Failed', String(e));
    }
  };

  const handlePasteOt = async () => {
    closeMenu();
    try {
      const text = await Clipboard.getStringAsync();
      const digitsOnly = String(text ?? '').replace(/[^0-9]/g, '');
      if (!digitsOnly) {
        Alert.alert('Paste OT', 'Clipboard is empty or has no numbers to paste.');
        return;
      }
      setOtHours(digitsOnly);
      setOtModalVisible(true);
    } catch (e) {
      Alert.alert('Paste Failed', String(e));
    }
  };

  const handleCloseOtModal = () => {
    if (otSaving) return;
    setOtModalVisible(false);
    setOtHours('');
  };

  const handleSaveOtHours = async () => {
    if (!otHours.trim()) return;
    if (typeof onSetOtHours !== 'function') {
      handleCloseOtModal();
      return;
    }

    try {
      setOtSaving(true);
      await onSetOtHours(employee, otHours.trim());
      setOtModalVisible(false);
      setOtHours('');
    } finally {
      setOtSaving(false);
    }
  };

  const handleCloseNotesModal = () => {
    setNotesModalVisible(false);
    setNotes('');
  };

  const handleOtHoursChange = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, '');
    setOtHours(digitsOnly);
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card, borderBottomColor: colors.border },
        { opacity: employee.isDisabled ? 0.6 : 1 }
      ]}
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={350}
      disabled={!isExpanded}
    >
      <View style={styles.employeeInfo}>
        <Text style={[styles.employeeName, { color: colors.text }]}>
          {employee.first_name} {employee.last_name}
        </Text>
        <Text style={[styles.employeeCode, { color: colors.textSecondary || colors.icon }]}>
          {employee.employee_code}
        </Text>
        {employee.isSynced && (
          <Text style={styles.syncedText}>✓ Synced</Text>
        )}
      </View>
      
      <View style={styles.statusContainer}>
        <View style={styles.topRightRow}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}> 
            <Text style={[styles.statusText, { color: getStatusTextColor() }]}>{getStatusText()}</Text>
          </View>
          <TouchableOpacity
            style={styles.moreBtn}
            onPress={() => setMenuVisible(true)}
            disabled={!isExpanded}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary || colors.icon} />
          </TouchableOpacity>
        </View>
        {isTimeRunning && typeof onTransfer === 'function' && (
          <TouchableOpacity style={styles.transferBtn} onPress={onTransfer}>
            <Text style={styles.transferBtnText}>Transfer</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.menuOverlay} onPress={closeMenu}>
          <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleViewTimeLogs}>
              <Text style={[styles.menuItemText, { color: colors.text }]}>View Time Logs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleSetAsOt}>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Set as OT</Text>
            </TouchableOpacity>
            {hasOt ? (
              <TouchableOpacity style={styles.menuItem} onPress={handleCopyOt}>
                <Text style={[styles.menuItemText, { color: colors.text }]}>Copy OT</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.menuItem} onPress={handlePasteOt}>
                <Text style={[styles.menuItemText, { color: colors.text }]}>Paste OT</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleNotes}>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Notes</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={otModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseOtModal}
      >
        <Pressable style={styles.menuOverlay} onPress={handleCloseOtModal}>
          <Pressable style={[styles.otCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <Text style={[styles.otTitle, { color: colors.text }]}>Set OT Hours</Text>
            <Text style={[styles.otSub, { color: colors.textSecondary || colors.icon }]}>Numbers only (how many hrs)</Text>

            <TextInput
              value={otHours}
              onChangeText={handleOtHoursChange}
              keyboardType="numeric"
              placeholder="e.g. 2"
              placeholderTextColor={colors.textSecondary || colors.icon}
              style={[styles.otInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface || colors.background }]}
            />

            <View style={styles.otButtonsRow}>
              <TouchableOpacity
                style={[styles.otBtn, { backgroundColor: colors.surface || colors.background, borderColor: colors.border }]}
                onPress={handleCloseOtModal}
                disabled={otSaving}
              >
                <Text style={[styles.otBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.otBtn,
                  { backgroundColor: colors.tint, borderColor: colors.tint, opacity: otHours.trim() && !otSaving ? 1 : 0.5 },
                ]}
                onPress={handleSaveOtHours}
                disabled={!otHours.trim() || otSaving}
              >
                <Text style={[styles.otBtnText, { color: colors.buttonPrimaryText || '#000' }]}>{otSaving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={notesModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseNotesModal}
      >
        <Pressable style={styles.menuOverlay} onPress={handleCloseNotesModal}>
          <Pressable style={[styles.otCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <Text style={[styles.otTitle, { color: colors.text }]}>Notes</Text>
            <Text style={[styles.otSub, { color: colors.textSecondary || colors.icon }]}>Add notes for this attendance (UI only)</Text>

            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              placeholder="Type notes..."
              placeholderTextColor={colors.textSecondary || colors.icon}
              style={[styles.notesInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface || colors.background }]}
              textAlignVertical="top"
            />

            <View style={styles.otButtonsRow}>
              <TouchableOpacity
                style={[styles.otBtn, { backgroundColor: colors.surface || colors.background, borderColor: colors.border }]}
                onPress={handleCloseNotesModal}
              >
                <Text style={[styles.otBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.otBtn,
                  { backgroundColor: colors.tint, borderColor: colors.tint, opacity: notes.trim() ? 1 : 0.5 },
                ]}
                onPress={handleCloseNotesModal}
                disabled={!notes.trim()}
              >
                <Text style={[styles.otBtnText, { color: colors.buttonPrimaryText || '#000' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 8,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  employeeCode: {
    fontSize: 14,
    marginBottom: 2,
  },
  syncedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  moreBtn: {
    width: 34,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    minWidth: 100,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  transferBtn: {
    marginTop: 8,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-end',
  },
  transferBtnText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 12,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menuCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  otCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
  },
  otTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  otSub: {
    fontSize: 13,
    marginBottom: 12,
  },
  otInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 14,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 14,
    minHeight: 100,
  },
  otButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  otBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 90,
    alignItems: 'center',
  },
  otBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default EmployeeListItem;
