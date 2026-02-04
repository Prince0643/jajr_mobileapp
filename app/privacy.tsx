import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';

const PrivacyScreen: React.FC = () => {
  const [faceIdEnabled, setFaceIdEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const colors = Colors.dark;
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Privacy & Security</Text>
      <View style={styles.settingRow}>
        <Text style={styles.label}>Enable Face ID</Text>
        <Switch
          value={faceIdEnabled}
          onValueChange={setFaceIdEnabled}
          thumbColor={faceIdEnabled ? colors.tint : colors.textDisabled}
          trackColor={{ false: colors.border, true: colors.tint }}
        />
      </View>
      <View style={styles.settingRow}>
        <Text style={styles.label}>Enable Biometrics</Text>
        <Switch
          value={biometricsEnabled}
          onValueChange={setBiometricsEnabled}
          thumbColor={biometricsEnabled ? colors.tint : colors.textDisabled}
          trackColor={{ false: colors.border, true: colors.tint }}
        />
      </View>
      <View style={styles.settingRow}>
        <Text style={styles.label}>Two-Factor Authentication</Text>
        <Switch
          value={twoFactorEnabled}
          onValueChange={setTwoFactorEnabled}
          thumbColor={twoFactorEnabled ? colors.tint : colors.textDisabled}
          trackColor={{ false: colors.border, true: colors.tint }}
        />
      </View>
    </SafeAreaView>
  );
};

function createStyles(colors: typeof Colors.dark) {
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

export default PrivacyScreen;
