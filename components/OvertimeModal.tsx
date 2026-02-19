import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { OvertimeRequest, OvertimeService } from '@/services/overtimeService';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface OvertimeModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: {
    userId: number;
    employeeCode?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    branchName?: string;
  } | null;
}

const OvertimeModal: React.FC<OvertimeModalProps> = ({ visible, onClose, currentUser }) => {
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState<'request' | 'history' | 'approve'>('request');
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for new request
  const [requestedHours, setRequestedHours] = useState('');
  const [overtimeReason, setOvertimeReason] = useState('');

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const loadOvertimeRequests = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const params: any = {};
      
      // If not admin, only show own requests
      if (!isAdmin) {
        params.employee_id = currentUser.userId;
      }
      
      // If on approve tab, only show pending
      if (activeTab === 'approve') {
        params.status = 'pending';
      }

      const response = await OvertimeService.getOvertimeRequests(params);
      
      if (response.success && response.data) {
        setOvertimeRequests(response.data);
      } else {
        setOvertimeRequests([]);
      }
    } catch (error) {
      console.log('Error loading overtime requests:', error);
      setOvertimeRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, activeTab, isAdmin]);

  useEffect(() => {
    if (visible) {
      loadOvertimeRequests();
    }
  }, [visible, loadOvertimeRequests]);

  const handleSubmitRequest = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to request overtime');
      return;
    }

    const hours = parseFloat(requestedHours);
    if (isNaN(hours) || hours <= 0 || hours > 4) {
      Alert.alert('Invalid Hours', 'Please enter valid overtime hours (0.5 - 4 hours)');
      return;
    }

    if (!overtimeReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for overtime');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await OvertimeService.submitOvertime({
        employee_id: currentUser.userId,
        employee_code: currentUser.employeeCode || '',
        branch_name: currentUser.branchName || 'Unknown',
        requested_hours: hours,
        overtime_reason: overtimeReason.trim(),
      });

      if (response.success) {
        Alert.alert('Success', 'Overtime request submitted successfully');
        setRequestedHours('');
        setOvertimeReason('');
        setActiveTab('history');
        loadOvertimeRequests();
      } else {
        Alert.alert('Failed', response.message || 'Failed to submit overtime request');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while submitting the request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveReject = async (request: OvertimeRequest, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      Alert.prompt(
        'Rejection Reason',
        'Please provide a reason for rejection:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: async (reason?: string) => {
              if (!reason?.trim()) {
                Alert.alert('Required', 'Please provide a rejection reason');
                return;
              }
              await processApproval(request.id, action, reason.trim());
            },
          },
        ],
        'plain-text'
      );
    } else {
      await processApproval(request.id, action);
    }
  };

  const processApproval = async (requestId: number, action: 'approve' | 'reject', rejectionReason?: string) => {
    setIsSubmitting(true);
    try {
      const response = await OvertimeService.approveOvertime({
        request_id: requestId,
        action,
        rejection_reason: rejectionReason,
        approved_by: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim(),
      });

      if (response.success) {
        Alert.alert('Success', `Overtime request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        loadOvertimeRequests();
      } else {
        Alert.alert('Failed', response.message || 'Failed to process request');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while processing the request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'pending': return '#FFC107';
      default: return '#757575';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderRequestItem = ({ item }: { item: OvertimeRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View>
          <Text style={styles.requestDate}>{formatDate(item.request_date)}</Text>
          <Text style={styles.requestEmployee}>{item.employee_name || `Employee #${item.employee_id}`}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.requestDetails}>
        <Text style={styles.requestHours}>⏱ {item.requested_hours} hours</Text>
        <Text style={styles.requestBranch}>📍 {item.branch_name}</Text>
      </View>
      
      <Text style={styles.requestReason}>"{item.overtime_reason}"</Text>
      
      {item.status === 'pending' && isAdmin && activeTab === 'approve' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApproveReject(item, 'approve')}
            disabled={isSubmitting}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleApproveReject(item, 'reject')}
            disabled={isSubmitting}
          >
            <Ionicons name="close" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {item.status === 'rejected' && item.rejection_reason && (
        <Text style={styles.rejectionReason}>Reason: {item.rejection_reason}</Text>
      )}
    </View>
  );

  const renderRequestForm = () => (
    <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.formTitle}>Request Overtime</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Overtime Hours (max 4)</Text>
        <TextInput
          style={styles.formInput}
          placeholder="e.g., 2.5"
          placeholderTextColor={colors.textSecondary}
          value={requestedHours}
          onChangeText={setRequestedHours}
          keyboardType="decimal-pad"
          maxLength={3}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Reason for Overtime</Text>
        <TextInput
          style={[styles.formInput, styles.textArea]}
          placeholder="e.g., Project deadline, urgent work..."
          placeholderTextColor={colors.textSecondary}
          value={overtimeReason}
          onChangeText={setOvertimeReason}
          multiline
          numberOfLines={4}
          maxLength={500}
        />
        <Text style={styles.charCount}>{overtimeReason.length}/500</Text>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmitRequest}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.buttonPrimaryText} />
        ) : (
          <>
            <Ionicons name="send" size={18} color={colors.buttonPrimaryText} />
            <Text style={styles.submitButtonText}>Submit Request</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Overtime Management</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'request' && styles.tabActive]}
                onPress={() => setActiveTab('request')}
              >
                <Text style={[styles.tabText, activeTab === 'request' && styles.tabTextActive]}>
                  Request
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'history' && styles.tabActive]}
                onPress={() => setActiveTab('history')}
              >
                <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                  My Requests
                </Text>
              </TouchableOpacity>
              {isAdmin && (
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'approve' && styles.tabActive]}
                  onPress={() => setActiveTab('approve')}
                >
                  <Text style={[styles.tabText, activeTab === 'approve' && styles.tabTextActive]}>
                    Approve
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {activeTab === 'request' ? (
              renderRequestForm()
            ) : isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.tint} />
                <Text style={styles.loadingText}>Loading requests...</Text>
              </View>
            ) : overtimeRequests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>
                  {activeTab === 'approve' 
                    ? 'No pending overtime requests' 
                    : 'No overtime requests found'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={overtimeRequests}
                renderItem={renderRequestItem}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshing={isLoading}
                onRefresh={loadOvertimeRequests}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: (typeof Colors)[keyof typeof Colors]) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.background,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      maxHeight: '85%',
      minHeight: '50%',
    },
    header: {
      backgroundColor: colors.card,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      paddingTop: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    headerTitle: {
      ...Typography.h3,
      color: colors.text,
      fontWeight: '700',
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabContainer: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    tab: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: {
      borderBottomColor: colors.tint,
    },
    tabText: {
      ...Typography.body,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    tabTextActive: {
      color: colors.tint,
    },
    content: {
      flex: 1,
      padding: Spacing.lg,
    },
    formContainer: {
      flex: 1,
    },
    formTitle: {
      ...Typography.h3,
      color: colors.text,
      marginBottom: Spacing.lg,
      fontWeight: '600',
    },
    formGroup: {
      marginBottom: Spacing.lg,
    },
    formLabel: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    formInput: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      fontSize: 16,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    charCount: {
      ...Typography.caption,
      color: colors.textSecondary,
      textAlign: 'right',
      marginTop: Spacing.xs,
    },
    submitButton: {
      backgroundColor: colors.tint,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.md,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: colors.buttonPrimaryText,
      fontWeight: '700',
      fontSize: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing.xl,
    },
    loadingText: {
      ...Typography.body,
      color: colors.textSecondary,
      marginTop: Spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing.xl,
    },
    emptyText: {
      ...Typography.body,
      color: colors.textSecondary,
      marginTop: Spacing.md,
      textAlign: 'center',
    },
    listContent: {
      gap: Spacing.md,
      paddingBottom: Spacing.lg,
    },
    requestCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    requestHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.sm,
    },
    requestDate: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '700',
    },
    requestEmployee: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
    },
    statusText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 12,
      textTransform: 'uppercase',
    },
    requestDetails: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.sm,
    },
    requestHours: {
      ...Typography.body,
      color: colors.tint,
      fontWeight: '600',
    },
    requestBranch: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    requestReason: {
      ...Typography.body,
      color: colors.text,
      fontStyle: 'italic',
      backgroundColor: colors.surface,
      padding: Spacing.sm,
      borderRadius: BorderRadius.sm,
      marginTop: Spacing.xs,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.md,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.xs,
      padding: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    approveButton: {
      backgroundColor: '#4CAF50',
    },
    rejectButton: {
      backgroundColor: '#F44336',
    },
    actionButtonText: {
      color: '#fff',
      fontWeight: '700',
    },
    rejectionReason: {
      ...Typography.caption,
      color: '#F44336',
      marginTop: Spacing.sm,
      fontStyle: 'italic',
    },
  });

export default OvertimeModal;
