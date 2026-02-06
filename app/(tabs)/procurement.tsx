import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RequestStatus = 'draft' | 'pending' | 'approved' | 'ordered' | 'received' | 'cancelled';

type RequestLine = {
  id: string;
  itemName: string;
  qty: number;
  unit: string;
  unitCost: number;
};

type ProcurementRequest = {
  id: string;
  createdAtLabel: string;
  branchName: string;
  requestedBy: string;
  supplierName?: string;
  status: RequestStatus;
  notes?: string;
  lines: RequestLine[];
};

const STATUS_LABEL: Record<RequestStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  ordered: 'Ordered',
  received: 'Received',
  cancelled: 'Cancelled',
};

const MOCK_REQUESTS: ProcurementRequest[] = [
  {
    id: 'PR-2026-02-02-0008',
    createdAtLabel: 'Feb 02, 2026 • 10:15 AM',
    branchName: 'Sto. Rosario',
    requestedBy: 'Warehouse',
    supplierName: 'ABC Trading',
    status: 'pending',
    notes: 'Urgent replenishment for ongoing works.',
    lines: [
      { id: '1', itemName: 'Cement (40kg)', qty: 50, unit: 'bag', unitCost: 265 },
      { id: '2', itemName: 'GI Wire', qty: 10, unit: 'roll', unitCost: 120 },
      { id: '3', itemName: 'Nails (2")', qty: 20, unit: 'kg', unitCost: 85 },
    ],
  },
  {
    id: 'PR-2026-01-31-0011',
    createdAtLabel: 'Jan 31, 2026 • 04:40 PM',
    branchName: 'Main Branch',
    requestedBy: 'Site Engineer',
    supplierName: 'Metro Hardware',
    status: 'approved',
    notes: 'Approved by Admin. Waiting for PO.',
    lines: [
      { id: '1', itemName: 'Rebar 10mm', qty: 120, unit: 'pc', unitCost: 165 },
      { id: '2', itemName: 'Rebar 12mm', qty: 80, unit: 'pc', unitCost: 240 },
    ],
  },
  {
    id: 'PR-2026-01-29-0004',
    createdAtLabel: 'Jan 29, 2026 • 09:05 AM',
    branchName: 'BCDA',
    requestedBy: 'Procurement',
    supplierName: 'ABC Trading',
    status: 'received',
    notes: 'Delivered complete. Check and file invoice.',
    lines: [
      { id: '1', itemName: 'Plywood 1/2"', qty: 30, unit: 'sheet', unitCost: 780 },
      { id: '2', itemName: 'Common Lumber 2x2', qty: 60, unit: 'pc', unitCost: 95 },
    ],
  },
];

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const computeTotal = (r: ProcurementRequest) => r.lines.reduce((sum, l) => sum + l.qty * l.unitCost, 0);

const ProcurementScreen: React.FC = () => {
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];
  const borderLight = ('borderLight' in colors ? (colors as any).borderLight : undefined) ?? colors.border;
  const styles = useMemo(() => createStyles(colors, borderLight), [borderLight, colors]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.comingSoonWrap}>
        <View style={styles.comingSoonCard}>
          <View style={styles.comingSoonIcon}>
            <Text style={styles.comingSoonIconText}>🛒</Text>
          </View>
          <Text style={styles.comingSoonTitle}>Procurement</Text>
          <Text style={styles.comingSoonSubtitle}>Coming soon</Text>
          <Text style={styles.comingSoonHint}>We’re working on requests, approvals, and receiving.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: (typeof Colors)[keyof typeof Colors], borderLight: string) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  comingSoonWrap: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  comingSoonCard: {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.md,
  },
  comingSoonIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  comingSoonIconText: {
    fontSize: 30,
    color: colors.buttonPrimaryText,
  },
  comingSoonTitle: {
    ...Typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    ...Typography.body,
    color: colors.tint,
    fontWeight: '800',
    marginTop: Spacing.xs,
  },
  comingSoonHint: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
    lineHeight: 18,
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
  card: {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadows.sm,
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
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
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
    gap: Spacing.xs,
  },
  rowTitle: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  rowSubtitle: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
  },
  rowAmount: {
    ...Typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  rowNote: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: Spacing.sm,
  },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusPillText: {
    ...Typography.caption,
    fontWeight: '700',
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
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  modalTitle: {
    ...Typography.h3,
    color: colors.text,
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
    color: colors.textSecondary,
  },
  modalValue: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  modalHint: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
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
  modalList: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    maxHeight: 260,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lineLeft: {
    flex: 1,
  },
  lineTitle: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  lineSub: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: Spacing.xs,
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
    paddingVertical: Spacing.md,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
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

export default ProcurementScreen;
