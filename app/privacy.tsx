import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PrivacyScreen: React.FC = () => {
  const [faceIdEnabled, setFaceIdEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];
  const styles = createStyles(colors);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy & Security</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="shield-checkmark" size={22} color={colors.buttonPrimaryText} />
          </View>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle}>Protect your account</Text>
            <Text style={styles.heroSubtitle}>
              Turn on extra safeguards to keep your data safe.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Unlock & Access</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingLeft}>
            <View style={styles.settingIconWrap}>
              <Ionicons name="scan" size={18} color={colors.text} />
            </View>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingTitle}>Enable Face ID</Text>
              <Text style={styles.settingSubtitle}>Use Face ID to unlock the app faster.</Text>
            </View>
          </View>
          <Switch
            value={faceIdEnabled}
            onValueChange={setFaceIdEnabled}
            thumbColor={faceIdEnabled ? colors.tint : colors.textDisabled}
            trackColor={{ false: colors.border, true: colors.tint }}
          />
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingLeft}>
            <View style={styles.settingIconWrap}>
              <Ionicons name="finger-print" size={18} color={colors.text} />
            </View>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingTitle}>Enable Biometrics</Text>
              <Text style={styles.settingSubtitle}>Allow fingerprint or device biometrics.</Text>
            </View>
          </View>
          <Switch
            value={biometricsEnabled}
            onValueChange={setBiometricsEnabled}
            thumbColor={biometricsEnabled ? colors.tint : colors.textDisabled}
            trackColor={{ false: colors.border, true: colors.tint }}
          />
        </View>

        <Text style={styles.sectionTitle}>Sign-in Protection</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingLeft}>
            <View style={styles.settingIconWrap}>
              <Ionicons name="key" size={18} color={colors.text} />
            </View>
            <View style={styles.settingTextCol}>
              <View style={styles.settingTitleRow}>
                <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Recommended</Text>
                </View>
              </View>
              <Text style={styles.settingSubtitle}>Add a verification step when signing in.</Text>
            </View>
          </View>
          <Switch
            value={twoFactorEnabled}
            onValueChange={setTwoFactorEnabled}
            thumbColor={twoFactorEnabled ? colors.tint : colors.textDisabled}
            trackColor={{ false: colors.border, true: colors.tint }}
          />
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

function createStyles(colors: (typeof Colors)[keyof typeof Colors]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: Spacing.lg,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: Spacing.xl,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    backButton: {
      padding: Spacing.sm,
      marginLeft: -Spacing.sm,
    },
    headerSpacer: {
      width: 40,
    },
    title: {
      ...Typography.h2,
      color: colors.text,
      fontWeight: 'bold',
      flex: 1,
      textAlign: 'center',
    },
    heroCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: Spacing.xl,
      ...Shadows.sm,
    },
    heroIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.tint,
      marginRight: Spacing.md,
    },
    heroTextCol: {
      flex: 1,
    },
    heroTitle: {
      ...Typography.h3,
      color: colors.text,
    },
    heroSubtitle: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
      lineHeight: 18,
    },
    sectionTitle: {
      ...Typography.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: Spacing.sm,
    },
    settingCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingRight: Spacing.md,
    },
    settingIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      marginRight: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingTextCol: {
      flex: 1,
    },
    settingTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginRight: Spacing.sm,
    },
    settingTitle: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    settingSubtitle: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
      lineHeight: 18,
    },
    badge: {
      marginLeft: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    badgeText: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontSize: 12,
    },
    footerSpacer: {
      height: Spacing.sm,
    },
  });
}

export default PrivacyScreen;
