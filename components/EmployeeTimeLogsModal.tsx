import { Colors } from '@/constants/theme';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export type TimeLog = {
  id?: number | string;
  time_in: string | null;
  time_out: string | null;
};

interface EmployeeTimeLogsModalProps {
  visible: boolean;
  employeeName: string;
  logs: TimeLog[];
  isLoading?: boolean;
  onClose: () => void;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
}

function parseToDate(value: string | null): Date | null {
  if (!value) return null;

  const v = String(value).trim();
  if (!v) return null;

  // Common backend formats:
  // - "YYYY-MM-DD HH:mm:ss"
  // - "HH:mm:ss" (not enough info; treat as today local)
  // - ISO
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(v)) {
    const iso = v.replace(' ', 'T');
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (/^\d{2}:\d{2}(:\d{2})?$/.test(v)) {
    const today = new Date();
    const [hh, mm, ss] = v.split(':');
    const d = new Date(today);
    d.setHours(Number(hh), Number(mm), Number(ss ?? '0'), 0);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatTime12h(value: string | null): string {
  const d = parseToDate(value);
  if (!d) return '--';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

const EmployeeTimeLogsModal: React.FC<EmployeeTimeLogsModalProps> = ({
  visible,
  employeeName,
  logs,
  isLoading = false,
  onClose,
}) => {
  const colors = Colors.dark;

  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [visible]);

  const { rows, overallTotal } = useMemo(() => {
    const now = new Date();
    let overallTotalSec = 0;

    const src = Array.isArray(logs) ? logs : [];
    const ordered = [...src].sort((a, b) => {
      const da = parseToDate(a.time_in)?.getTime() ?? Number.POSITIVE_INFINITY;
      const db = parseToDate(b.time_in)?.getTime() ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;

      const oa = parseToDate(a.time_out)?.getTime() ?? Number.POSITIVE_INFINITY;
      const ob = parseToDate(b.time_out)?.getTime() ?? Number.POSITIVE_INFINITY;
      if (oa !== ob) return oa - ob;
      return 0;
    });

    const processedRows = ordered.map((l, idx) => {
      const start = parseToDate(l.time_in);
      const end = parseToDate(l.time_out) ?? (start ? now : null);

      let sessionSec = 0;
      if (start && end) {
        sessionSec = Math.max(0, (end.getTime() - start.getTime()) / 1000);
      }
      overallTotalSec += sessionSec;

      return {
        key: String(l.id ?? idx),
        timeInLabel: formatTime12h(l.time_in),
        timeOutLabel: l.time_out ? formatTime12h(l.time_out) : '--',
        totalLabel: formatDuration(sessionSec),
        isOpen: !!l.time_in && !l.time_out,
      };
    });

    return {
      rows: processedRows,
      overallTotal: formatDuration(overallTotalSec),
    };
  }, [logs, tick]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                Time Logs — {employeeName}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary || colors.icon }]}>
                Long press employee to view today’s total time
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { borderColor: colors.border }]}>
              <Text style={[styles.closeBtnText, { color: colors.text }]}>Close</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.tint} />
              <Text style={[styles.loadingText, { color: colors.textSecondary || colors.icon }]}>
                Loading logs...
              </Text>
            </View>
          ) : rows.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: colors.textSecondary || colors.icon }]}>
                No logs found for today.
              </Text>
            </View>
          ) : (
            <View style={styles.tableWrap}>
              <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.th, { color: colors.textSecondary || colors.icon }]}>Time In</Text>
                <Text style={[styles.th, { color: colors.textSecondary || colors.icon }]}>Time Out</Text>
                <Text style={[styles.th, { color: colors.textSecondary || colors.icon, textAlign: 'right' }]}>
                  Total Time
                </Text>
              </View>

              <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                {rows.map((r) => (
                  <View key={r.key} style={[styles.tr, { borderBottomColor: colors.border }]}> 
                    <Text style={[styles.td, { color: colors.text }]}>{r.timeInLabel}</Text>
                    <Text style={[styles.td, { color: colors.text }]}>{r.timeOutLabel}</Text>
                    <Text
                      style={[
                        styles.td,
                        {
                          color: r.isOpen ? '#FF9500' : colors.text,
                          textAlign: 'right',
                          fontVariant: ['tabular-nums'],
                        },
                      ]}
                    >
                      {r.totalLabel}
                    </Text>
                  </View>
                ))}
              </ScrollView>
              
              <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Overall Total:</Text>
                <Text style={[styles.totalValue, { color: colors.tint, fontVariant: ['tabular-nums'] }]}>
                  {overallTotal}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    flex: 1,
    width: '94%',
    maxWidth: 520,
    margin: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingWrap: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyWrap: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  tableWrap: {
    flex: 1,
    minHeight: 300,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  th: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  tr: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  td: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderTopWidth: 2,
    marginTop: 4,
  },
  totalLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  totalValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
});

export default EmployeeTimeLogsModal;
