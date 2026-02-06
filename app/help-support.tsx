import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HelpSupportScreen: React.FC = () => {
  const router = useRouter();
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ title: 'Help & Support', headerShown: true }} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Help & Support</Text>
        <Text style={styles.subtitle}>Quick guides and step-by-step instructions</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Instructions</Text>

          <Pressable
            style={styles.row}
            onPress={() => router.push({ pathname: '/(tabs)/home', params: { help: 'attendance' } })}
          >
            <View style={styles.rowLeft}>
              <View style={styles.rowIconWrap}>
                <Ionicons name="time-outline" size={20} color={colors.tint} />
              </View>
              <View style={styles.rowTextCol}>
                <Text style={styles.rowTitle}>How to use Attendance</Text>
                <Text style={styles.rowSubtitle}>Time in/out, logs, OT, filters</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />
          </Pressable>
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
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.xxl,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    backText: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    title: {
      ...Typography.h2,
      color: colors.text,
      marginBottom: Spacing.xs,
    },
    subtitle: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.lg,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    sectionTitle: {
      ...Typography.body,
      fontWeight: '700',
      color: colors.text,
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    rowIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowTextCol: {
      marginLeft: Spacing.md,
      flex: 1,
    },
    rowTitle: {
      ...Typography.body,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    rowSubtitle: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
  });

export default HelpSupportScreen;
