import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const NotificationsScreen: React.FC = () => {
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Notification Settings</Text>
      <View style={styles.settingRow}>
        <Text style={styles.label}>Alerts</Text>
        <Switch
          value={alertsEnabled}
          onValueChange={setAlertsEnabled}
          thumbColor={alertsEnabled ? colors.tint : colors.textDisabled}
          trackColor={{ false: colors.border, true: colors.tint }}
        />
      </View>
      <View style={styles.settingRow}>
        <Text style={styles.label}>Sound Notifications</Text>
        <Switch
          value={soundEnabled}
          onValueChange={setSoundEnabled}
          thumbColor={soundEnabled ? colors.tint : colors.textDisabled}
          trackColor={{ false: colors.border, true: colors.tint }}
        />
      </View>
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
    title: {
      ...Typography.h2,
      marginBottom: Spacing.xl,
      color: colors.text,
      fontWeight: 'bold',
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    label: {
      ...Typography.body,
      color: colors.text,
    },
  });
}

export default NotificationsScreen;
