import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { SessionManager } from '@/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type QuickAction = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

const DashboardScreen: React.FC = () => {
  const router = useRouter();
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    (async () => {
      const user = await SessionManager.getUser();
      setCurrentUser(user);
    })();
  }, []);

  useEffect(() => {
    const today = new Date();
    const formatted = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setCurrentDate(formatted);
  }, []);

  const summary = useMemo(() => {
    return {
      timedIn: 0,
      branches: 0,
      pendingPayslips: 0,
      pendingRequests: 0,
    };
  }, []);

  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        title: 'Attendance',
        subtitle: 'Time in / out employees',
        icon: 'time-outline',
        onPress: () => router.push('/(tabs)/home'),
      },
      {
        title: 'Payslip',
        subtitle: 'Preview earnings & net pay',
        icon: 'card-outline',
        onPress: () => router.push('/(tabs)/salary'),
      },
      {
        title: 'Procurement',
        subtitle: 'Requests & approvals',
        icon: 'cart-outline',
        onPress: () => router.push('/(tabs)/procurement'),
      },
      {
        title: 'Cash Advance',
        subtitle: 'Request & view balance',
        icon: 'cash-outline',
        onPress: () => router.push('/cash-advance'),
      },
    ],
    [router]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text style={styles.title}>Welcome, {currentUser?.firstName || 'User'}!</Text>
            <Text style={styles.subtitle}>{currentDate}</Text>
          </View>

          <Pressable style={styles.headerIconButton} onPress={() => router.push('/(tabs)/settings')}>
            <Ionicons name="person-circle-outline" size={30} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroLabel}>Today</Text>
              <Text style={styles.heroValue}>{summary.timedIn}</Text>
              <Text style={styles.heroMeta}>Employees timed in</Text>
            </View>
            <View style={styles.heroRight}>
              <View style={styles.heroPill}>
                <Ionicons name="business-outline" size={16} color={colors.buttonPrimaryText} />
                <Text style={styles.heroPillText}>{summary.branches} branches</Text>
              </View>
              <View style={[styles.heroPill, { marginTop: Spacing.sm }]}
              >
                <Ionicons name="cloud-done-outline" size={16} color={colors.buttonPrimaryText} />
                <Text style={styles.heroPillText}>Sync ready</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroBottomRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Payslips</Text>
              <Text style={styles.heroStatValue}>{summary.pendingPayslips}</Text>
              <Text style={styles.heroStatHint}>Pending generation</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Procurement</Text>
              <Text style={styles.heroStatValue}>{summary.pendingRequests}</Text>
              <Text style={styles.heroStatHint}>Awaiting approval</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionMeta}>Shortcuts</Text>
        </View>

        <View style={styles.grid}>
          {quickActions.map((a) => (
            <Pressable key={a.title} style={styles.actionCard} onPress={a.onPress}>
              <View style={styles.actionIconWrap}>
                <Ionicons name={a.icon} size={22} color={colors.buttonPrimaryText} />
              </View>
              <Text style={styles.actionTitle}>{a.title}</Text>
              <Text style={styles.actionSubtitle}>{a.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.sectionMeta}>This week</Text>
        </View>

        <View style={styles.listCard}>
          {[
            {
              label: 'Employee attendance',
              value: '—',
              icon: 'clipboard-outline' as const,
            },
            {
              label: 'Payroll releases',
              value: '—',
              icon: 'cash-outline' as const,
            },
            {
              label: 'Open purchase requests',
              value: '—',
              icon: 'document-text-outline' as const,
            },
          ].map((row, idx, arr) => (
            <View key={row.label} style={[styles.listRow, idx === arr.length - 1 ? styles.listRowLast : null]}>
              <View style={styles.listRowLeft}>
                <Ionicons name={row.icon} size={18} color={colors.tint} />
                <Text style={styles.listRowLabel}>{row.label}</Text>
              </View>
              <Text style={styles.listRowValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: (typeof Colors)[keyof typeof Colors]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xxl,
      paddingTop: Spacing.lg,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    headerTextCol: {
      flex: 1,
      paddingRight: Spacing.md,
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
    headerIconButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 22,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    heroCard: {
      backgroundColor: colors.tint,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      ...Shadows.md,
      marginBottom: Spacing.lg,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    heroLeft: {
      flex: 1,
      paddingRight: Spacing.md,
    },
    heroLabel: {
      ...Typography.caption,
      color: colors.buttonPrimaryText,
      opacity: 0.9,
    },
    heroValue: {
      ...Typography.h1,
      color: colors.buttonPrimaryText,
      marginTop: Spacing.xs,
    },
    heroMeta: {
      ...Typography.body,
      color: colors.buttonPrimaryText,
      opacity: 0.9,
      marginTop: Spacing.xs,
    },
    heroRight: {
      alignItems: 'flex-end',
    },
    heroPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.18)',
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    heroPillText: {
      ...Typography.caption,
      color: colors.buttonPrimaryText,
      marginLeft: 8,
      fontWeight: '600',
    },
    heroDivider: {
      height: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.18)',
      marginVertical: Spacing.lg,
    },
    heroBottomRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    heroStat: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.12)',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
    },
    heroStatLabel: {
      ...Typography.caption,
      color: colors.buttonPrimaryText,
      opacity: 0.9,
    },
    heroStatValue: {
      ...Typography.h3,
      color: colors.buttonPrimaryText,
      marginTop: Spacing.xs,
    },
    heroStatHint: {
      ...Typography.caption,
      color: colors.buttonPrimaryText,
      opacity: 0.9,
      marginTop: 2,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginTop: Spacing.md,
      marginBottom: Spacing.sm,
    },
    sectionTitle: {
      ...Typography.h3,
      color: colors.text,
    },
    sectionMeta: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    actionCard: {
      width: '48%',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: Spacing.md,
    },
    actionIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.tint,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    actionTitle: {
      ...Typography.body,
      fontWeight: '700',
      color: colors.text,
    },
    actionSubtitle: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    listCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    listRowLast: {
      borderBottomWidth: 0,
    },
    listRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingRight: Spacing.md,
      gap: Spacing.sm,
    },
    listRowLabel: {
      ...Typography.body,
      color: colors.text,
    },
    listRowValue: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
  });

export default DashboardScreen;
