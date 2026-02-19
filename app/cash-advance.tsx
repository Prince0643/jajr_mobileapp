import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { CashAdvanceService } from '@/services/cashAdvanceService';
import { CashAdvance, CashAdvanceBalance } from '@/types';
import { ErrorHandler, SessionManager } from '@/utils';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const CashAdvanceScreen: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [transactions, setTransactions] = useState<CashAdvance[]>([]);
    const [balance, setBalance] = useState<CashAdvanceBalance>({
        currentBalance: 0,
        totalRequested: 0,
        totalApproved: 0,
        totalPaid: 0,
        pendingRequests: 0,
    });
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');

    const router = useRouter();
    const { resolvedTheme } = useThemeMode();
    const colors = Colors[resolvedTheme];
    const styles = useMemo(() => createStyles(colors), [colors]);

    useEffect(() => {
        initializeData();
    }, []);

    const initializeData = async () => {
        try {
            const user = await SessionManager.getUser();
            setCurrentUser(user);
            if (user) {
                await loadCashAdvanceData(user.userId);
            }
        } catch (error) {
            console.error('Initialization error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadCashAdvanceData = async (employeeId: number) => {
        try {
            const [historyResponse, summaryResponse] = await Promise.all([
                CashAdvanceService.getCashAdvanceHistory(employeeId),
                CashAdvanceService.getCashAdvanceSummary(employeeId),
            ]);

            if (historyResponse.success) {
                setTransactions(historyResponse.transactions);
            }

            if (summaryResponse.success) {
                const summary = summaryResponse.summary;
                setBalance({
                    currentBalance: summary.outstanding_balance,
                    totalRequested: summary.total_requested,
                    totalApproved: summary.total_approved,
                    totalPaid: summary.total_paid,
                    pendingRequests: summary.pending_requests,
                });
            }
        } catch (error) {
            const errorInfo = ErrorHandler.handle(error);
            console.error('Error loading cash advance data:', ErrorHandler.getDisplayMessage(errorInfo));
        }
    };

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        if (currentUser) {
            await loadCashAdvanceData(currentUser.userId);
        }
        setIsRefreshing(false);
    }, [currentUser]);

    const handleSubmitRequest = async () => {
        if (!currentUser) return;

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
            return;
        }

        if (!reason.trim()) {
            Alert.alert('Missing Reason', 'Please provide a reason for the cash advance');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await CashAdvanceService.submitCashAdvanceRequest({
                employee_id: currentUser.userId,
                employee_code: currentUser.employeeCode,
                amount: amountNum,
                particular: 'Cash Advance',
                reason: reason.trim(),
            });

            if (response.success) {
                Alert.alert('Success', 'Cash advance request submitted successfully');
                setAmount('');
                setReason('');
                setShowRequestForm(false);
                await loadCashAdvanceData(currentUser.userId);
            } else {
                Alert.alert('Request Failed', response.message || 'Failed to submit request');
            }
        } catch (error) {
            const errorInfo = ErrorHandler.handle(error);
            Alert.alert('Error', ErrorHandler.getDisplayMessage(errorInfo));
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return '#FFA500'; // Orange
            case 'approved':
                return '#4CAF50'; // Green
            case 'rejected':
                return '#F44336'; // Red
            case 'paid':
                return '#2196F3'; // Blue
            default:
                return colors.textSecondary;
        }
    };

    const renderTransactionItem = ({ item }: { item: CashAdvance }) => {
        const amount = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount as any) || 0;
        const runningBalance = item.running_balance !== undefined 
            ? (typeof item.running_balance === 'number' ? item.running_balance : parseFloat(item.running_balance as any) || 0)
            : undefined;
        
        return (
        <View style={styles.transactionCard}>
            <View style={styles.transactionHeader}>
                <View>
                    <Text style={styles.transactionAmount}>₱{amount.toFixed(2)}</Text>
                    <Text style={styles.transactionParticular}>{item.particular}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>
            {item.reason && (
                <Text style={styles.transactionReason}>{item.reason}</Text>
            )}
            <View style={styles.transactionFooter}>
                <Text style={styles.transactionDate}>
                    {new Date(item.request_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                </Text>
                {runningBalance !== undefined && (
                    <Text style={styles.transactionBalance}>
                        Balance: ₱{runningBalance.toFixed(2)}
                    </Text>
                )}
            </View>
            {item.approved_by && (
                <Text style={styles.approvedBy}>Approved by: {item.approved_by}</Text>
            )}
        </View>
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={colors.tint} />
                <Text style={styles.loadingText}>Loading cash advance data...</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.buttonPrimaryText} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Cash Advance</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Balance Card */}
                <View style={styles.balanceCard}>
                    <Text style={styles.balanceLabel}>Outstanding Balance</Text>
                    <Text style={styles.balanceAmount}>₱{balance.currentBalance.toFixed(2)}</Text>
                    <View style={styles.balanceStats}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{balance.pendingRequests}</Text>
                            <Text style={styles.statLabel}>Pending</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>₱{balance.totalApproved.toFixed(0)}</Text>
                            <Text style={styles.statLabel}>Approved</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>₱{balance.totalPaid.toFixed(0)}</Text>
                            <Text style={styles.statLabel}>Paid</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Request Button */}
            {!showRequestForm && (
                <TouchableOpacity
                    style={styles.requestButton}
                    onPress={() => setShowRequestForm(true)}
                >
                    <Ionicons name="add-circle" size={24} color={colors.buttonPrimaryText} />
                    <Text style={styles.requestButtonText}>Request Cash Advance</Text>
                </TouchableOpacity>
            )}

            {/* Request Form */}
            {showRequestForm && (
                <View style={styles.requestForm}>
                    <View style={styles.formHeader}>
                        <Text style={styles.formTitle}>New Cash Advance Request</Text>
                        <TouchableOpacity onPress={() => setShowRequestForm(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.inputLabel}>Amount (₱)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter amount"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="decimal-pad"
                        value={amount}
                        onChangeText={setAmount}
                    />

                    <Text style={styles.inputLabel}>Reason</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Enter reason for cash advance"
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        numberOfLines={3}
                        value={reason}
                        onChangeText={setReason}
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                        onPress={handleSubmitRequest}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator size="small" color={colors.buttonPrimaryText} />
                        ) : (
                            <Text style={styles.submitButtonText}>Submit Request</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Transaction History */}
            <View style={styles.historyContainer}>
                <Text style={styles.historyTitle}>Transaction History</Text>
                {transactions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="wallet-outline" size={48} color={colors.textSecondary} />
                        <Text style={styles.emptyText}>No cash advance transactions</Text>
                    </View>
                ) : (
                    <FlatList
                        data={transactions}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderTransactionItem}
                        refreshControl={
                            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                        }
                        contentContainerStyle={styles.transactionList}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </View>
        </>
    );
};

const createStyles = (colors: (typeof Colors)[keyof typeof Colors]) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        centerContent: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        loadingText: {
            ...Typography.body,
            color: colors.textSecondary,
            marginTop: Spacing.md,
        },
        header: {
            backgroundColor: colors.tint,
            paddingTop: 60,
            paddingHorizontal: Spacing.lg,
            paddingBottom: Spacing.lg,
        },
        headerTop: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: Spacing.md,
        },
        backButton: {
            padding: Spacing.sm,
        },
        headerTitle: {
            ...Typography.h3,
            color: colors.buttonPrimaryText,
            fontWeight: '700',
        },
        placeholder: {
            width: 40,
        },
        balanceCard: {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: BorderRadius.md,
            padding: Spacing.lg,
            alignItems: 'center',
        },
        balanceLabel: {
            ...Typography.caption,
            color: colors.buttonPrimaryText,
            opacity: 0.9,
            marginBottom: Spacing.xs,
        },
        balanceAmount: {
            ...Typography.h1,
            color: colors.buttonPrimaryText,
            fontWeight: '800',
            marginBottom: Spacing.md,
        },
        balanceStats: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            width: '100%',
        },
        statItem: {
            alignItems: 'center',
        },
        statValue: {
            ...Typography.body,
            color: colors.buttonPrimaryText,
            fontWeight: '700',
        },
        statLabel: {
            ...Typography.caption,
            color: colors.buttonPrimaryText,
            opacity: 0.8,
            fontSize: 12,
        },
        statDivider: {
            width: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
        },
        requestButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.tint,
            marginHorizontal: Spacing.lg,
            marginTop: Spacing.md,
            padding: Spacing.md,
            borderRadius: BorderRadius.md,
            ...Shadows.md,
        },
        requestButtonText: {
            ...Typography.body,
            color: colors.buttonPrimaryText,
            fontWeight: '700',
            marginLeft: Spacing.sm,
        },
        requestForm: {
            backgroundColor: colors.card,
            marginHorizontal: Spacing.lg,
            marginTop: Spacing.md,
            padding: Spacing.lg,
            borderRadius: BorderRadius.md,
            ...Shadows.md,
        },
        formHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: Spacing.md,
        },
        formTitle: {
            ...Typography.h3,
            color: colors.text,
            fontWeight: '700',
        },
        inputLabel: {
            ...Typography.caption,
            color: colors.textSecondary,
            marginBottom: Spacing.xs,
            fontWeight: '600',
        },
        input: {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: BorderRadius.md,
            padding: Spacing.md,
            color: colors.text,
            fontSize: 16,
            marginBottom: Spacing.md,
        },
        textArea: {
            height: 80,
            textAlignVertical: 'top',
        },
        submitButton: {
            backgroundColor: colors.tint,
            padding: Spacing.md,
            borderRadius: BorderRadius.md,
            alignItems: 'center',
            marginTop: Spacing.sm,
        },
        submitButtonDisabled: {
            opacity: 0.6,
        },
        submitButtonText: {
            ...Typography.body,
            color: colors.buttonPrimaryText,
            fontWeight: '700',
        },
        historyContainer: {
            flex: 1,
            padding: Spacing.lg,
        },
        historyTitle: {
            ...Typography.h3,
            color: colors.text,
            fontWeight: '700',
            marginBottom: Spacing.md,
        },
        transactionList: {
            paddingBottom: Spacing.xl,
        },
        transactionCard: {
            backgroundColor: colors.card,
            borderRadius: BorderRadius.md,
            padding: Spacing.md,
            marginBottom: Spacing.md,
            ...Shadows.sm,
        },
        transactionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: Spacing.sm,
        },
        transactionAmount: {
            ...Typography.h3,
            color: colors.text,
            fontWeight: '700',
        },
        transactionParticular: {
            ...Typography.caption,
            color: colors.textSecondary,
        },
        statusBadge: {
            paddingHorizontal: Spacing.sm,
            paddingVertical: 4,
            borderRadius: BorderRadius.sm,
        },
        statusText: {
            ...Typography.caption,
            fontWeight: '700',
            fontSize: 11,
        },
        transactionReason: {
            ...Typography.body,
            color: colors.textSecondary,
            marginBottom: Spacing.sm,
            fontStyle: 'italic',
        },
        transactionFooter: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: Spacing.sm,
        },
        transactionDate: {
            ...Typography.caption,
            color: colors.textSecondary,
        },
        transactionBalance: {
            ...Typography.caption,
            color: colors.tint,
            fontWeight: '600',
        },
        approvedBy: {
            ...Typography.caption,
            color: colors.textSecondary,
            marginTop: Spacing.xs,
            fontStyle: 'italic',
        },
        emptyState: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: Spacing.xl * 2,
        },
        emptyText: {
            ...Typography.body,
            color: colors.textSecondary,
            marginTop: Spacing.md,
        },
    });

export default CashAdvanceScreen;
