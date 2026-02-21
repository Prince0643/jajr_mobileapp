import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { ApiService } from '@/services/api';
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

type PayPeriodType = 'weekly' | 'monthly';

type WeekNumber = 1 | 2 | 3 | 4;

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
  weekly: 'Weekly',
  monthly: 'Monthly',
};

const DEFAULT_EMPLOYEES: EmployeeOption[] = [
  { id: 12, name: 'CESAR ABUBO', branch: 'Sto. Rosario', dailyRate: 600 },
  { id: 61, name: 'CARL JHUNELL ACAS', branch: 'Sto. Rosario', dailyRate: 600 },
  { id: 6, name: 'Super Admin', branch: 'Sto. Rosario', dailyRate: 600 },
];

const FIXED_DEDUCTIONS = {
  sss: 450,
  philhealth: 250,
  pagibig: 200,
  withholdingTax: 150,
} as const;

const formatMoney = (value: number) => {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatPhp = (value: number) => {
  const sign = value < 0 ? '-' : '';
  return `${sign}₱ ${formatMoney(Math.abs(value))}`;
};

const parsePhpInput = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const monthLabel = (d: Date) =>
  d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

const getMonthRange = (d: Date) => {
  const year = d.getFullYear();
  const month = d.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start, end, year, month, daysInMonth: end.getDate() };
};

const getWeekRange = (year: number, month: number, week: WeekNumber) => {
  const weekStartDay = (week - 1) * 7 + 1;
  const weekEndDay = week === 4 ? new Date(year, month + 1, 0).getDate() : week * 7;
  return { startDay: weekStartDay, endDay: weekEndDay };
};

const getCurrentWeekOfMonth = (date: Date): WeekNumber => {
  const day = date.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
};

const isWorkingDay = (date: Date) => {
  const day = date.getDay();
  return day >= 1 && day <= 6;
};

const countWorkingDaysInRange = (year: number, month: number, startDay: number, endDay: number) => {
  let count = 0;
  for (let d = startDay; d <= endDay; d++) {
    const date = new Date(year, month, d);
    if (isWorkingDay(date)) count++;
  }
  return count;
};

const dateToYmd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const countDaysPresentForMonth = async (employeeId: number, monthDate: Date) => {
  const { start, daysInMonth } = getMonthRange(monthDate);
  const dates: string[] = [];
  for (let i = 0; i < daysInMonth; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (isWorkingDay(d)) {
      dates.push(dateToYmd(d));
    }
  }

  const presentDays = new Set<string>();
  let cursor = 0;
  const concurrency = 5;

  const worker = async () => {
    while (cursor < dates.length) {
      const idx = cursor;
      cursor += 1;
      const ymd = dates[idx];
      try {
        const res = await ApiService.getShiftLogsToday({ employee_id: employeeId, date: ymd, limit: 200 });
        if (!res?.success) continue;
        const logs = Array.isArray((res as any)?.logs) ? (res as any).logs : [];
        const hasPresence = logs.some((l: any) => Boolean(l?.time_in) || String(l?.status ?? '').toLowerCase() === 'present' || String(l?.status ?? '').toLowerCase() === 'late');
        if (hasPresence) presentDays.add(ymd);
      } catch {
        // ignore per-day failure; we show aggregate error only if all fail
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return Array.from(presentDays);
};

const computeTotals = (p: Payslip | null) => {
  const earningsTotal = (p?.earnings ?? []).reduce((sum, l) => sum + l.amount, 0);
  const deductionsTotal = (p?.deductions ?? []).reduce((sum, l) => sum + Math.abs(l.amount), 0);
  const netPay = earningsTotal - deductionsTotal;
  return { earningsTotal, deductionsTotal, netPay };
};

const SalaryScreen: React.FC = () => {
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];
  const borderLight = ('borderLight' in colors ? (colors as any).borderLight : undefined) ?? colors.border;
  const styles = useMemo(() => createStyles(colors, borderLight), [borderLight, colors]);

  const [employeeQuery, setEmployeeQuery] = useState('');
  const [periodType, setPeriodType] = useState<PayPeriodType>('weekly');
  const [activeEmployee, setActiveEmployee] = useState<EmployeeOption>(DEFAULT_EMPLOYEES[0]);
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [bonusInput, setBonusInput] = useState('0');
  const performanceBonus = useMemo(() => parsePhpInput(bonusInput), [bonusInput]);

  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedWeek, setSelectedWeek] = useState<WeekNumber>(() => getCurrentWeekOfMonth(new Date()));

  const [presentDates, setPresentDates] = useState<string[]>([]);
  const [daysPresentLoading, setDaysPresentLoading] = useState(false);
  const [daysPresentError, setDaysPresentError] = useState<string>('');

  const [allEmployees, setAllEmployees] = useState<EmployeeOption[]>(DEFAULT_EMPLOYEES);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState<string>('');

  const employeeOptions = useMemo(() => {
    const q = employeeQuery.trim().toLowerCase();
    if (!q) return allEmployees;
    return allEmployees.filter((e) => e.name.toLowerCase().includes(q) || String(e.id).includes(q));
  }, [employeeQuery, allEmployees]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setEmployeesError('');
        setEmployeesLoading(true);
        const employees = await ApiService.getAllEmployees();
        if (!alive) return;

        const mapped = employees.map((emp: any) => ({
          id: emp.id || emp.employee_id || 0,
          name: emp.full_name || emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Unknown',
          branch: emp.branch_name || emp.branch || 'Unknown',
          dailyRate: Number(emp.daily_rate || emp.rate || 600),
        }));

        setAllEmployees(mapped.length > 0 ? mapped : DEFAULT_EMPLOYEES);
      } catch (e: any) {
        if (!alive) return;
        console.error('Failed to load employees:', e);
        setEmployeesError(String(e?.message || 'Failed to load employees'));
      } finally {
        if (!alive) return;
        setEmployeesLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setDaysPresentError('');
        setDaysPresentLoading(true);
        const dates = await countDaysPresentForMonth(activeEmployee.id, monthCursor);
        if (!alive) return;
        setPresentDates(dates);
      } catch (e: any) {
        if (!alive) return;
        setDaysPresentError(String(e?.message || 'Failed to load attendance for this month'));
      } finally {
        if (!alive) return;
        setDaysPresentLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [activeEmployee.id, monthCursor]);

  const currentPayslip = useMemo(() => {
    const { start, end, year, month, daysInMonth } = getMonthRange(monthCursor);
    let periodLabel: string;
    let daysInPeriod: number;
    let deductionMultiplier: number;

    if (periodType === 'weekly') {
      const { startDay, endDay } = getWeekRange(year, month, selectedWeek);
      const expectedWorkingDays = countWorkingDaysInRange(year, month, startDay, endDay);
      const weekDates: string[] = [];
      for (let d = startDay; d <= endDay; d++) {
        const date = new Date(year, month, d);
        if (isWorkingDay(date)) {
          weekDates.push(dateToYmd(date));
        }
      }
      daysInPeriod = weekDates.filter(d => presentDates.includes(d)).length;
      periodLabel = `Week ${selectedWeek}: ${monthLabel(monthCursor)} ${startDay}-${endDay} (${daysInPeriod}/${expectedWorkingDays} days)`;
      deductionMultiplier = selectedWeek === 4 ? 0 : 1 / 3;
    } else {
      const expectedWorkingDays = countWorkingDaysInRange(year, month, 1, daysInMonth);
      daysInPeriod = presentDates.length;
      periodLabel = `${start.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} (${daysInPeriod}/${expectedWorkingDays} days)`;
      deductionMultiplier = 1;
    }

    const basePay = daysInPeriod * (activeEmployee.dailyRate || 0);
    const earnings: PayslipLine[] = [
      { label: `Basic Pay (${daysInPeriod} days)`, amount: basePay },
      { label: 'Performance Bonus', amount: performanceBonus },
    ];

    const totalDeductions = FIXED_DEDUCTIONS.sss + FIXED_DEDUCTIONS.philhealth + FIXED_DEDUCTIONS.pagibig;
    const appliedDeductions = totalDeductions * deductionMultiplier;

    const deductions: PayslipLine[] = [
      { label: 'SSS', amount: -(FIXED_DEDUCTIONS.sss * deductionMultiplier) },
      { label: 'PhilHealth', amount: -(FIXED_DEDUCTIONS.philhealth * deductionMultiplier) },
      { label: 'Pag-IBIG', amount: -(FIXED_DEDUCTIONS.pagibig * deductionMultiplier) },
    ];

    if (periodType === 'weekly' && selectedWeek === 4) {
      deductions.push({ label: 'Note: No deductions in Week 4', amount: 0 });
    }

    return {
      id: `PS-${dateToYmd(monthCursor)}-${String(activeEmployee.id).padStart(4, '0')}`,
      employeeId: activeEmployee.id,
      employeeName: activeEmployee.name,
      branchName: activeEmployee.branch,
      periodType,
      periodLabel,
      createdAtLabel: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      earnings,
      deductions,
      notes: daysPresentLoading ? 'Loading attendance…' : daysPresentError ? `Attendance: ${daysPresentError}` : undefined,
    };
  }, [activeEmployee, presentDates, daysPresentError, daysPresentLoading, monthCursor, performanceBonus, periodType, selectedWeek]);

  const payslipHistory = useMemo(() => {
    return [] as Payslip[];
  }, []);

  const totals = useMemo(() => {
    return computeTotals(currentPayslip);
  }, [currentPayslip]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.title}>Payslip</Text>
            <Text style={styles.subtitle}>Earnings, deductions, and net pay preview</Text>
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
            <Pressable
              style={styles.placeholderPill}
              onPress={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            >
              <Text style={styles.placeholderPillText}>Prev</Text>
            </Pressable>
            <View style={styles.placeholderPill}>
              <Text style={styles.placeholderPillText}>{monthLabel(monthCursor)}</Text>
            </View>
            <Pressable
              style={styles.placeholderPill}
              onPress={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            >
              <Text style={styles.placeholderPillText}>Next</Text>
            </Pressable>
          </View>

          {periodType === 'weekly' && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>Current Week</Text>
              <View style={styles.weekRow}>
                <View style={[styles.weekChip, styles.weekChipActive]}>
                  <Text style={[styles.weekChipText, styles.weekChipTextActive]}>
                    Week {selectedWeek}
                  </Text>
                  {selectedWeek === 4 && (
                    <Text style={styles.noDeductionBadge}>No Deduction</Text>
                  )}
                </View>
              </View>
            </>
          )}

          <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>Performance Bonus (PHP)</Text>
          <TextInput
            value={bonusInput}
            onChangeText={setBonusInput}
            placeholder="0"
            keyboardType="decimal-pad"
            placeholderTextColor={colors.textDisabled}
            style={styles.searchInput}
          />
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
            <View style={styles.kvRow}>
              <Text style={styles.kvLabel}>Days Present</Text>
              <Text style={styles.kvValue}>{daysPresentLoading ? 'Loading…' : String(presentDates.length)}</Text>
            </View>

            <View style={styles.sectionDivider} />

            <Text style={styles.subsectionTitle}>Earnings</Text>
            {currentPayslip.earnings.map((l) => (
              <View key={l.label} style={styles.lineRow}>
                <Text style={styles.lineLabel}>{l.label}</Text>
                <Text style={styles.lineAmount}>{formatPhp(l.amount)}</Text>
              </View>
            ))}

            <View style={styles.sectionDivider} />

            <Text style={styles.subsectionTitle}>Deductions</Text>
            {currentPayslip.deductions.map((l) => (
              <View key={l.label} style={styles.lineRow}>
                <Text style={styles.lineLabel}>{l.label}</Text>
                <Text style={styles.lineAmount}>{formatPhp(l.amount)}</Text>
              </View>
            ))}

            <View style={styles.sectionDivider} />

            <View style={styles.netRow}>
              <Text style={styles.netLabel}>Total Deductions</Text>
              <Text style={styles.netAmount}>{formatPhp(-totals.deductionsTotal)}</Text>
            </View>
            <View style={[styles.netRow, { marginTop: Spacing.sm }]}>
              <Text style={styles.netLabel}>Net Pay</Text>
              <Text style={styles.netAmount}>{formatPhp(totals.netPay)}</Text>
            </View>

            {!!currentPayslip.notes ? <Text style={styles.noteText}>{currentPayslip.notes}</Text> : null}

            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setPreviewOpen(true)}>
                <Text style={styles.secondaryButtonText}>Preview</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={() => setSelectedPayslip(currentPayslip)}>
                <Text style={styles.primaryButtonText}>View Details</Text>
              </Pressable>
            </View>
          </View>
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
              placeholderTextColor={colors.textDisabled}
              style={styles.searchInput}
            />

            <View style={styles.modalList}>
              {employeesLoading ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptySubtitle}>Loading employees...</Text>
                </View>
              ) : employeesError ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptySubtitle}>{employeesError}</Text>
                </View>
              ) : (
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
              )}
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
        <View style={styles.modalOverlay}>
          <Pressable style={[StyleSheet.absoluteFill, { zIndex: 0 }]} onPress={() => setSelectedPayslip(null)} />
          <View style={styles.modalCard}>
            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
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
                  <Text style={styles.lineAmount}>{formatPhp(l.amount)}</Text>
                </View>
              ))}

              <View style={styles.sectionDivider} />

              <Text style={styles.subsectionTitle}>Deductions</Text>
              {(selectedPayslip?.deductions ?? []).map((l) => (
                <View key={l.label} style={styles.lineRow}>
                  <Text style={styles.lineLabel}>{l.label}</Text>
                  <Text style={styles.lineAmount}>{formatPhp(l.amount)}</Text>
                </View>
              ))}

              <View style={styles.sectionDivider} />

              <View style={styles.netRow}>
                <Text style={styles.netLabel}>Total Deductions</Text>
                <Text style={styles.netAmount}>{formatPhp(-computeTotals(selectedPayslip).deductionsTotal)}</Text>
              </View>

              <View style={styles.netRow}>
                <Text style={styles.netLabel}>Net Pay</Text>
                <Text style={styles.netAmount}>{formatPhp(computeTotals(selectedPayslip).netPay)}</Text>
              </View>

              <View style={styles.modalActions}>
                <Pressable style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Print</Text>
                </Pressable>
                <Pressable style={styles.primaryButton} onPress={() => setSelectedPayslip(null)}>
                  <Text style={styles.primaryButtonText}>Close</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={previewOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={[StyleSheet.absoluteFill, { zIndex: 0 }]} onPress={() => setPreviewOpen(false)} />
          <View style={styles.modalCard}>
            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              <Text style={styles.modalTitle}>Payslip Preview</Text>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Employee</Text>
                <Text style={styles.modalValue}>{currentPayslip.employeeName}</Text>
                <Text style={styles.modalHint}>ID: {currentPayslip.employeeId} • {currentPayslip.branchName}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Month</Text>
                <Text style={styles.modalValue}>{monthLabel(monthCursor)}</Text>
                <Text style={styles.modalHint}>Days present: {daysPresentLoading ? 'Loading…' : presentDates.length}</Text>
              </View>

              <View style={styles.sectionDivider} />

              <View style={styles.netRow}>
                <Text style={styles.netLabel}>Gross Earnings</Text>
                <Text style={styles.netAmount}>{formatPhp(totals.earningsTotal)}</Text>
              </View>
              <View style={[styles.netRow, { marginTop: Spacing.sm }]}>
                <Text style={styles.netLabel}>Total Deductions</Text>
                <Text style={styles.netAmount}>{formatPhp(-totals.deductionsTotal)}</Text>
              </View>
              <View style={[styles.netRow, { marginTop: Spacing.sm }]}>
                <Text style={styles.netLabel}>Net Pay</Text>
                <Text style={styles.netAmount}>{formatPhp(totals.netPay)}</Text>
              </View>

              <View style={styles.modalActions}>
                <Pressable style={styles.secondaryButton} onPress={() => setPreviewOpen(false)}>
                  <Text style={styles.secondaryButtonText}>Close</Text>
                </Pressable>
                <Pressable style={styles.primaryButton} onPress={() => setSelectedPayslip(currentPayslip)}>
                  <Text style={styles.primaryButtonText}>View Details</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: (typeof Colors)[keyof typeof Colors], borderLight: string) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.text,
  },
  subtitle: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
  },
  searchCard: {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadows.sm,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    backgroundColor: colors.inputBackground,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  selectRowLeft: {
    flex: 1,
  },
  selectValue: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  selectHint: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
  },
  selectChevron: {
    ...Typography.caption,
    color: colors.tint,
    fontWeight: '700',
  },
  sectionLabel: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: colors.text,
    marginBottom: Spacing.md,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  weekChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
  },
  weekChipActive: {
    backgroundColor: colors.tint,
    borderColor: colors.tint,
  },
  weekChipInactive: {
    backgroundColor: colors.surface,
    borderColor: borderLight,
  },
  weekChipText: {
    ...Typography.caption,
  },
  weekChipTextActive: {
    color: colors.buttonPrimaryText,
    fontWeight: '600',
  },
  weekChipTextInactive: {
    color: colors.text,
  },
  noDeductionBadge: {
    ...Typography.caption,
    fontSize: 10,
    color: colors.tint,
    marginTop: 2,
  },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: colors.tint,
    borderColor: colors.tint,
  },
  chipInactive: {
    backgroundColor: colors.surface,
    borderColor: borderLight,
  },
  chipText: {
    ...Typography.caption,
  },
  chipTextActive: {
    color: colors.buttonPrimaryText,
    fontWeight: '600',
  },
  chipTextInactive: {
    color: colors.text,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: borderLight,
  },
  placeholderPillText: {
    ...Typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  summaryLabel: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...Typography.h3,
    color: colors.text,
    marginTop: Spacing.xs,
  },
  listCard: {
    marginTop: Spacing.lg,
    backgroundColor: colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  listHeaderRow: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: Spacing.xs,
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
    color: colors.textSecondary,
  },
  kvValue: {
    ...Typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: Spacing.md,
  },
  subsectionTitle: {
    ...Typography.body,
    color: colors.text,
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
    color: colors.text,
    flex: 1,
  },
  lineAmount: {
    ...Typography.caption,
    color: colors.text,
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
    color: colors.textSecondary,
    fontWeight: '700',
  },
  netAmount: {
    ...Typography.body,
    color: colors.tint,
    fontWeight: '800',
  },
  noteText: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h3,
    color: colors.text,
  },
  sectionMeta: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  row: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
    color: colors.text,
    fontWeight: '600',
  },
  rowSubtitle: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
  },
  bonus: {
    ...Typography.body,
    color: colors.tint,
    fontWeight: '700',
  },
  score: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
  },
  rowNote: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: Spacing.sm,
  },
  emptyState: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyTitle: {
    ...Typography.h3,
    color: colors.text,
  },
  emptySubtitle: {
    ...Typography.caption,
    color: colors.textSecondary,
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
    backgroundColor: colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '80%',
    width: '100%',
    zIndex: 1,
    elevation: 6,
    padding: Spacing.lg,
    flexDirection: 'column',
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalScrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h3,
    color: colors.text,
    marginBottom: Spacing.lg,
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
    color: colors.textSecondary,
  },
  modalValue: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  modalHint: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  modalList: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    flex: 1,
    minHeight: 200,
  },
  modalListRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  modalListRowActive: {
    backgroundColor: colors.card,
  },
  modalListRowLeft: {
    flex: 1,
  },
  modalListRowTitle: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  modalListRowSubtitle: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
  },
  modalListRowTag: {
    ...Typography.caption,
    color: colors.tint,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    ...Typography.caption,
    color: colors.buttonPrimaryText,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.buttonSecondary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: borderLight,
  },
  secondaryButtonText: {
    ...Typography.caption,
    color: colors.buttonSecondaryText,
    fontWeight: '700',
  },
  });

export default SalaryScreen;
