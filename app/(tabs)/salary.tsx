import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PayPeriodType = 'daily' | 'weekly' | 'monthly';

type EmployeeOption = {
  id: number;
  name: string;
  branch: string;
  dailyRate: number;
};

type PayslipLine = {
  label: string;
  amount: number;
};

type Payslip = {
  id: string;
  employeeId: number;
  employeeName: string;
  branchName: string;
  periodType: PayPeriodType;
  periodLabel: string;
  createdAtLabel: string;
  earnings: PayslipLine[];
  deductions: PayslipLine[];
  notes?: string;
};

const PERIOD_TYPE_LABEL: Record<PayPeriodType, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const MOCK_EMPLOYEES: EmployeeOption[] = [
  { id: 12, name: 'Cesar Abubo', branch: 'Sto. Rosario', dailyRate: 600 },
  { id: 61, name: 'Carl Jhunell Acas', branch: 'Sto. Rosario', dailyRate: 600 },
  { id: 6, name: 'Super Admin', branch: 'Sto. Rosario', dailyRate: 600 },
];

const MOCK_PAYSLIPS: Payslip[] = [
  {
    id: 'PS-2026-02-01-0001',
    employeeId: 12,
    employeeName: 'Cesar Abubo',
    branchName: 'Sto. Rosario',
    periodType: 'weekly',
    periodLabel: 'Jan 27 - Feb 02, 2026',
    createdAtLabel: 'Feb 02, 2026',
    earnings: [
      { label: 'Basic Pay (6 days)', amount: 3600 },
      { label: 'Overtime Pay', amount: 450 },
      { label: 'Performance Bonus', amount: 750 },
    ],
    deductions: [
      { label: 'Late / Absences', amount: 0 },
      { label: 'Cash Advance', amount: 300 },
      { label: 'Other Deduction', amount: 0 },
    ],
    notes: 'UI only. Figures are sample values.',
  },
  {
    id: 'PS-2026-01-31-0007',
    employeeId: 61,
    employeeName: 'Carl Jhunell Acas',
    branchName: 'Sto. Rosario',
    periodType: 'monthly',
    periodLabel: 'Jan 01 - Jan 31, 2026',
    createdAtLabel: 'Feb 01, 2026',
    earnings: [
      { label: 'Basic Pay (26 days)', amount: 15600 },
      { label: 'Allowances', amount: 1000 },
      { label: 'Performance Bonus', amount: 500 },
    ],
    deductions: [
      { label: 'SSS', amount: 500 },
      { label: 'PhilHealth', amount: 300 },
      { label: 'Pag-IBIG', amount: 200 },
    ],
    notes: 'UI only. Deductions are placeholders.',
  },
  {
    id: 'PS-2026-01-31-0012',
    employeeId: 6,
    employeeName: 'Super Admin',
    branchName: 'Sto. Rosario',
    periodType: 'daily',
    periodLabel: 'Jan 31, 2026',
    createdAtLabel: 'Jan 31, 2026',
    earnings: [
      { label: 'Daily Rate', amount: 600 },
      { label: 'Performance Bonus', amount: 250 },
    ],
    deductions: [{ label: 'Other Deduction', amount: 0 }],
    notes: 'UI only.',
  },
];

const formatMoney = (value: number) => {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const SalaryScreen: React.FC = () => {
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [periodType, setPeriodType] = useState<PayPeriodType>('weekly');
  const [activeEmployee, setActiveEmployee] = useState<EmployeeOption>(MOCK_EMPLOYEES[0]);
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  const employeeOptions = useMemo(() => {
    const q = employeeQuery.trim().toLowerCase();
    if (!q) return MOCK_EMPLOYEES;
    return MOCK_EMPLOYEES.filter((e) => e.name.toLowerCase().includes(q) || String(e.id).includes(q));
  }, [employeeQuery]);

  const payslipHistory = useMemo(() => {
    return MOCK_PAYSLIPS.filter((p) => p.employeeId === activeEmployee.id && p.periodType === periodType);
  }, [activeEmployee.id, periodType]);

  const currentPayslip = useMemo(() => {
    return payslipHistory[0] ?? null;
  }, [payslipHistory]);

  const totals = useMemo(() => {
    const earningsTotal = (currentPayslip?.earnings ?? []).reduce((sum, l) => sum + l.amount, 0);
    const deductionsTotal = (currentPayslip?.deductions ?? []).reduce((sum, l) => sum + l.amount, 0);
    const netPay = earningsTotal - deductionsTotal;
    return { earningsTotal, deductionsTotal, netPay };
  }, [currentPayslip]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.title}>Payslip</Text>
            <Text style={styles.subtitle}>UI only • Earnings, deductions, and net pay preview</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Export</Text>
            </Pressable>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Generate</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.searchCard}>
          <Text style={styles.sectionLabel}>Employee</Text>
          <Pressable style={styles.selectRow} onPress={() => setEmployeePickerOpen(true)}>
            <View style={styles.selectRowLeft}>
              <Text style={styles.selectValue}>{activeEmployee.name}</Text>
              <Text style={styles.selectHint}>ID: {activeEmployee.id} • {activeEmployee.branch} • ₱ {formatMoney(activeEmployee.dailyRate)}/day</Text>
            </View>
            <Text style={styles.selectChevron}>Change</Text>
          </Pressable>

          <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>Pay Period</Text>
          <View style={styles.filtersRow}>
            {(Object.keys(PERIOD_TYPE_LABEL) as PayPeriodType[]).map((type) => {
              const active = type === periodType;
              return (
                <Pressable
                  key={type}
                  onPress={() => setPeriodType(type)}
                  style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}>
                  <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                    {PERIOD_TYPE_LABEL[type]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.placeholderRow}>
            <View style={styles.placeholderPill}>
              <Text style={styles.placeholderPillText}>Cutoff dates (soon)</Text>
            </View>
            <View style={styles.placeholderPill}>
              <Text style={styles.placeholderPillText}>Include adjustments (soon)</Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Gross Earnings</Text>
            <Text style={styles.summaryValue}>₱ {formatMoney(totals.earningsTotal)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Deductions</Text>
            <Text style={styles.summaryValue}>₱ {formatMoney(totals.deductionsTotal)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Net Pay</Text>
            <Text style={styles.summaryValue}>₱ {formatMoney(totals.netPay)}</Text>
          </View>
        </View>

        <View style={styles.listCard}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.sectionTitle}>Current Payslip</Text>
            <Text style={styles.sectionMeta}>{currentPayslip ? currentPayslip.periodLabel : '—'}</Text>
          </View>

          {!currentPayslip ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No payslip yet</Text>
              <Text style={styles.emptySubtitle}>Generate a payslip for this employee and cutoff.</Text>
            </View>
          ) : (
            <View style={styles.payslipBody}>
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Payslip No.</Text>
                <Text style={styles.kvValue}>{currentPayslip.id}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Employee</Text>
                <Text style={styles.kvValue}>{currentPayslip.employeeName}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Branch</Text>
                <Text style={styles.kvValue}>{currentPayslip.branchName}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kvLabel}>Period</Text>
                <Text style={styles.kvValue}>{currentPayslip.periodLabel}</Text>
              </View>

              <View style={styles.sectionDivider} />

              <Text style={styles.subsectionTitle}>Earnings</Text>
              {currentPayslip.earnings.map((l) => (
                <View key={l.label} style={styles.lineRow}>
                  <Text style={styles.lineLabel}>{l.label}</Text>
                  <Text style={styles.lineAmount}>₱ {formatMoney(l.amount)}</Text>
                </View>
              ))}

              <View style={styles.sectionDivider} />

              <Text style={styles.subsectionTitle}>Deductions</Text>
              {currentPayslip.deductions.map((l) => (
                <View key={l.label} style={styles.lineRow}>
                  <Text style={styles.lineLabel}>{l.label}</Text>
                  <Text style={styles.lineAmount}>₱ {formatMoney(l.amount)}</Text>
                </View>
              ))}

              <View style={styles.sectionDivider} />

              <View style={styles.netRow}>
                <Text style={styles.netLabel}>Net Pay</Text>
                <Text style={styles.netAmount}>₱ {formatMoney(totals.netPay)}</Text>
              </View>

              <Text style={styles.noteText}>{currentPayslip.notes || ''}</Text>

              <View style={styles.modalActions}>
                <Pressable style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Preview</Text>
                </Pressable>
                <Pressable style={styles.primaryButton} onPress={() => setSelectedPayslip(currentPayslip)}>
                  <Text style={styles.primaryButtonText}>View</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View style={styles.listCard}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.sectionTitle}>Payslip History</Text>
            <Text style={styles.sectionMeta}>{PERIOD_TYPE_LABEL[periodType]}</Text>
          </View>

          {payslipHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No history</Text>
              <Text style={styles.emptySubtitle}>Payslips will appear here after generation.</Text>
            </View>
          ) : (
            payslipHistory.map((p) => (
              <Pressable key={p.id} style={styles.row} onPress={() => setSelectedPayslip(p)}>
                <View style={styles.rowTop}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.rowTitle}>{p.periodLabel}</Text>
                    <Text style={styles.rowSubtitle}>{p.id} • {p.createdAtLabel}</Text>
                  </View>
                  <View style={styles.rowRight}>
                    <Text style={styles.bonus}>₱ {formatMoney(p.earnings.reduce((s, l) => s + l.amount, 0) - p.deductions.reduce((s, l) => s + l.amount, 0))}</Text>
                    <Text style={styles.score}>{PERIOD_TYPE_LABEL[p.periodType]}</Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={employeePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEmployeePickerOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEmployeePickerOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>Select Employee</Text>

            <TextInput
              value={employeeQuery}
              onChangeText={setEmployeeQuery}
              placeholder="Search name or ID"
              placeholderTextColor={Colors.dark.textDisabled}
              style={styles.searchInput}
            />

            <View style={styles.modalList}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {employeeOptions.map((e) => {
                  const active = e.id === activeEmployee.id;
                  return (
                    <Pressable
                      key={e.id}
                      style={[styles.modalListRow, active ? styles.modalListRowActive : undefined]}
                      onPress={() => {
                        setActiveEmployee(e);
                        setEmployeePickerOpen(false);
                        setEmployeeQuery('');
                      }}>
                      <View style={styles.modalListRowLeft}>
                        <Text style={styles.modalListRowTitle}>{e.name}</Text>
                        <Text style={styles.modalListRowSubtitle}>ID: {e.id} • {e.branch} • ₱ {formatMoney(e.dailyRate)}/day</Text>
                      </View>
                      <Text style={styles.modalListRowTag}>{active ? 'Selected' : ''}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.primaryButton} onPress={() => setEmployeePickerOpen(false)}>
                <Text style={styles.primaryButtonText}>Close</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={!!selectedPayslip}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPayslip(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedPayslip(null)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>Payslip Details</Text>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Payslip No.</Text>
              <Text style={styles.modalValue}>{selectedPayslip?.id}</Text>
              <Text style={styles.modalHint}>{selectedPayslip?.createdAtLabel}</Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Employee</Text>
              <Text style={styles.modalValue}>{selectedPayslip?.employeeName}</Text>
              <Text style={styles.modalHint}>ID: {selectedPayslip?.employeeId} • {selectedPayslip?.branchName}</Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Period</Text>
              <Text style={styles.modalValue}>{selectedPayslip?.periodLabel}</Text>
              <Text style={styles.modalHint}>{selectedPayslip ? PERIOD_TYPE_LABEL[selectedPayslip.periodType] : ''}</Text>
            </View>

            <View style={styles.sectionDivider} />

            <Text style={styles.subsectionTitle}>Earnings</Text>
            {(selectedPayslip?.earnings ?? []).map((l) => (
              <View key={l.label} style={styles.lineRow}>
                <Text style={styles.lineLabel}>{l.label}</Text>
                <Text style={styles.lineAmount}>₱ {formatMoney(l.amount)}</Text>
              </View>
            ))}

            <View style={styles.sectionDivider} />

            <Text style={styles.subsectionTitle}>Deductions</Text>
            {(selectedPayslip?.deductions ?? []).map((l) => (
              <View key={l.label} style={styles.lineRow}>
                <Text style={styles.lineLabel}>{l.label}</Text>
                <Text style={styles.lineAmount}>₱ {formatMoney(l.amount)}</Text>
              </View>
            ))}

            <View style={styles.sectionDivider} />

            <View style={styles.netRow}>
              <Text style={styles.netLabel}>Net Pay</Text>
              <Text style={styles.netAmount}>
                ₱ {formatMoney(
                  (selectedPayslip?.earnings ?? []).reduce((s, l) => s + l.amount, 0) -
                    (selectedPayslip?.deductions ?? []).reduce((s, l) => s + l.amount, 0)
                )}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Print</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={() => setSelectedPayslip(null)}>
                <Text style={styles.primaryButtonText}>Close</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  headerTextCol: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  title: {
    ...Typography.h2,
    color: Colors.dark.text,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  searchCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    ...Shadows.sm,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    backgroundColor: Colors.dark.inputBackground,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.inputBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  selectRowLeft: {
    flex: 1,
  },
  selectValue: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: '700',
  },
  selectHint: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  selectChevron: {
    ...Typography.caption,
    color: Colors.dark.tint,
    fontWeight: '700',
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    backgroundColor: Colors.dark.inputBackground,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.inputBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.dark.text,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: Colors.dark.tint,
    borderColor: Colors.dark.tint,
  },
  chipInactive: {
    backgroundColor: Colors.dark.surface,
    borderColor: Colors.dark.borderLight,
  },
  chipText: {
    ...Typography.caption,
  },
  chipTextActive: {
    color: Colors.dark.buttonPrimaryText,
    fontWeight: '600',
  },
  chipTextInactive: {
    color: Colors.dark.text,
  },
  placeholderRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  placeholderPill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  placeholderPillText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
  },
  summaryValue: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginTop: Spacing.xs,
  },
  listCard: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  listHeaderRow: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  payslipBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  kvLabel: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
  },
  kvValue: {
    ...Typography.caption,
    color: Colors.dark.text,
    fontWeight: '700',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: Spacing.md,
  },
  subsectionTitle: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  lineLabel: {
    ...Typography.caption,
    color: Colors.dark.text,
    flex: 1,
  },
  lineAmount: {
    ...Typography.caption,
    color: Colors.dark.text,
    fontWeight: '700',
  },
  netRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  netLabel: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    fontWeight: '700',
  },
  netAmount: {
    ...Typography.body,
    color: Colors.dark.tint,
    fontWeight: '800',
  },
  noteText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
  },
  sectionMeta: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
  },
  row: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  rowLeft: {
    flex: 1,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowTitle: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: '600',
  },
  rowSubtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  bonus: {
    ...Typography.body,
    color: Colors.dark.tint,
    fontWeight: '700',
  },
  score: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  rowNote: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.sm,
  },
  emptyState: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
  },
  emptySubtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  modalSection: {
    marginBottom: Spacing.md,
  },
  modalSectionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  modalHalf: {
    flex: 1,
  },
  modalLabel: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
  },
  modalValue: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  modalHint: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalList: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
    backgroundColor: Colors.dark.surface,
  },
  modalListRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  modalListRowActive: {
    backgroundColor: Colors.dark.card,
  },
  modalListRowLeft: {
    flex: 1,
  },
  modalListRowTitle: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: '700',
  },
  modalListRowSubtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  modalListRowTag: {
    ...Typography.caption,
    color: Colors.dark.tint,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: Colors.dark.buttonPrimary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    ...Typography.caption,
    color: Colors.dark.buttonPrimaryText,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: Colors.dark.buttonSecondary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  secondaryButtonText: {
    ...Typography.caption,
    color: Colors.dark.buttonSecondaryText,
    fontWeight: '700',
  },
});

export default SalaryScreen;
