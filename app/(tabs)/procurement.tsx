import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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

const STATUS_TONE: Record<RequestStatus, { bg: string; text: string; border: string }> = {
  draft: { bg: Colors.dark.surface, text: Colors.dark.text, border: Colors.dark.borderLight },
  pending: { bg: 'rgba(255, 215, 0, 0.15)', text: Colors.dark.tint, border: 'rgba(255, 215, 0, 0.35)' },
  approved: { bg: 'rgba(76, 175, 80, 0.18)', text: '#7CFF84', border: 'rgba(76, 175, 80, 0.35)' },
  ordered: { bg: 'rgba(33, 150, 243, 0.18)', text: '#8EC7FF', border: 'rgba(33, 150, 243, 0.35)' },
  received: { bg: 'rgba(156, 39, 176, 0.18)', text: '#E2A6FF', border: 'rgba(156, 39, 176, 0.35)' },
  cancelled: { bg: 'rgba(244, 67, 54, 0.18)', text: '#FF9E9E', border: 'rgba(244, 67, 54, 0.35)' },
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
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<RequestStatus | 'all'>('all');
  const [selected, setSelected] = useState<ProcurementRequest | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_REQUESTS.filter((r) => {
      if (status !== 'all' && r.status !== status) return false;
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        r.branchName.toLowerCase().includes(q) ||
        r.requestedBy.toLowerCase().includes(q) ||
        (r.supplierName ?? '').toLowerCase().includes(q)
      );
    });
  }, [query, status]);

  const summary = useMemo(() => {
    const total = filtered.reduce((sum, r) => sum + computeTotal(r), 0);
    const pending = filtered.filter((r) => r.status === 'pending').length;
    const approved = filtered.filter((r) => r.status === 'approved').length;
    return { count: filtered.length, total, pending, approved };
  }, [filtered]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.title}>Procurement</Text>
            <Text style={styles.subtitle}>UI only • Requests, approvals, and receiving</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Suppliers</Text>
            </Pressable>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>New</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Search</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="PR no., branch, requester, supplier"
            placeholderTextColor={Colors.dark.textDisabled}
            style={styles.searchInput}
          />

          <View style={styles.filtersRow}>
            {(['all', 'pending', 'approved', 'ordered', 'received'] as const).map((s) => {
              const active = s === status;
              return (
                <Pressable
                  key={s}
                  onPress={() => setStatus(s)}
                  style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}>
                  <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                    {s === 'all' ? 'All' : STATUS_LABEL[s]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Requests</Text>
            <Text style={styles.summaryValue}>{summary.count}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryValue}>{summary.pending}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Est. Total</Text>
            <Text style={styles.summaryValue}>₱ {money(summary.total)}</Text>
          </View>
        </View>

        <View style={styles.listCard}>
          <View style={styles.listHeaderRow}>
            <Text style={styles.sectionTitle}>Purchase Requests</Text>
            <Text style={styles.sectionMeta}>{status === 'all' ? 'All' : STATUS_LABEL[status]}</Text>
          </View>

          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No requests</Text>
              <Text style={styles.emptySubtitle}>Try changing the filter or search keywords.</Text>
            </View>
          ) : (
            filtered.map((r) => {
              const tone = STATUS_TONE[r.status];
              return (
                <Pressable key={r.id} style={styles.row} onPress={() => setSelected(r)}>
                  <View style={styles.rowTop}>
                    <View style={styles.rowLeft}>
                      <Text style={styles.rowTitle}>{r.id}</Text>
                      <Text style={styles.rowSubtitle}>
                        {r.branchName} • {r.requestedBy} • {r.createdAtLabel}
                      </Text>
                    </View>
                    <View style={styles.rowRight}>
                      <View style={[styles.statusPill, { backgroundColor: tone.bg, borderColor: tone.border }]}
                      >
                        <Text style={[styles.statusPillText, { color: tone.text }]}>{STATUS_LABEL[r.status]}</Text>
                      </View>
                      <Text style={styles.rowAmount}>₱ {money(computeTotal(r))}</Text>
                    </View>
                  </View>

                  <Text numberOfLines={1} style={styles.rowNote}>
                    Supplier: {r.supplierName || '—'} • Items: {r.lines.length}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelected(null)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitle}>Request Details</Text>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Request</Text>
              <Text style={styles.modalValue}>{selected?.id}</Text>
              <Text style={styles.modalHint}>{selected?.createdAtLabel}</Text>
            </View>

            <View style={styles.modalSectionRow}>
              <View style={styles.modalHalf}>
                <Text style={styles.modalLabel}>Branch</Text>
                <Text style={styles.modalValue}>{selected?.branchName}</Text>
              </View>
              <View style={styles.modalHalf}>
                <Text style={styles.modalLabel}>Status</Text>
                <Text style={styles.modalValue}>{selected ? STATUS_LABEL[selected.status] : ''}</Text>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Supplier</Text>
              <Text style={styles.modalValue}>{selected?.supplierName || '—'}</Text>
            </View>

            <View style={styles.sectionDivider} />

            <Text style={styles.subsectionTitle}>Items</Text>
            <View style={styles.modalList}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {(selected?.lines ?? []).map((l) => (
                  <View key={l.id} style={styles.lineRow}>
                    <View style={styles.lineLeft}>
                      <Text style={styles.lineTitle}>{l.itemName}</Text>
                      <Text style={styles.lineSub}>{l.qty} {l.unit} • ₱ {money(l.unitCost)} / {l.unit}</Text>
                    </View>
                    <Text style={styles.lineAmount}>₱ {money(l.qty * l.unitCost)}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.netRow}>
              <Text style={styles.netLabel}>Estimated Total</Text>
              <Text style={styles.netAmount}>₱ {money(selected ? computeTotal(selected) : 0)}</Text>
            </View>

            <Text style={styles.noteText}>{selected?.notes || ''}</Text>

            <View style={styles.modalActions}>
              <Pressable style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Approve</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Receive</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={() => setSelected(null)}>
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
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    ...Shadows.sm,
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
    gap: Spacing.xs,
  },
  rowTitle: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: '700',
  },
  rowSubtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  rowAmount: {
    ...Typography.caption,
    color: Colors.dark.text,
    fontWeight: '700',
  },
  rowNote: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
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
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  modalHint: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
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
  modalList: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
    backgroundColor: Colors.dark.surface,
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
    borderBottomColor: Colors.dark.border,
  },
  lineLeft: {
    flex: 1,
  },
  lineTitle: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: '700',
  },
  lineSub: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
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
    paddingVertical: Spacing.md,
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    flexWrap: 'wrap',
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

export default ProcurementScreen;
