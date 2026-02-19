import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

const SETTINGS_KEY = '@notification_settings';

const defaultSettings: NotificationSetting[] = [
  { id: 'pr_created', title: 'PR Created', description: 'When a new purchase request is created', enabled: true },
  { id: 'pr_approved', title: 'PR Approved', description: 'When your purchase request is approved', enabled: true },
  { id: 'pr_rejected', title: 'PR Rejected', description: 'When your purchase request is rejected', enabled: true },
  { id: 'pr_on_hold', title: 'PR On Hold', description: 'When your purchase request is put on hold', enabled: true },
  { id: 'pr_modified', title: 'PR Modified', description: 'When a purchase request is modified', enabled: false },
  { id: 'po_created', title: 'PO Created', description: 'When a purchase order is created', enabled: true },
  { id: 'item_received', title: 'Item Received', description: 'When items are marked as received', enabled: true },
  { id: 'system', title: 'System Notifications', description: 'System updates and announcements', enabled: true },
];

export default function NotificationsSettingsScreen() {
  const router = useRouter();
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [settings, setSettings] = useState<NotificationSetting[]>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(SETTINGS_KEY);
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSetting[]) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.log('Failed to save settings:', error);
    }
  };

  const toggleSetting = (id: string) => {
    setSettings(prev => {
      const newSettings = prev.map(setting =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      );
      saveSettings(newSettings);
      return newSettings;
    });
  };

  const masterEnabled = settings.some(s => s.enabled);

  const toggleMaster = () => {
    const newState = !masterEnabled;
    setSettings(prev => {
      const newSettings = prev.map(s => ({ ...s, enabled: newState }));
      saveSettings(newSettings);
      return newSettings;
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Master Toggle */}
        <View style={styles.masterCard}>
          <View style={styles.masterIconContainer}>
            <Ionicons name="notifications" size={28} color={colors.tint} />
          </View>
          <View style={styles.masterTextContainer}>
            <Text style={styles.masterTitle}>Enable Notifications</Text>
            <Text style={styles.masterDescription}>Receive push notifications</Text>
          </View>
          <Switch
            value={masterEnabled}
            onValueChange={toggleMaster}
            trackColor={{ false: colors.border, true: colors.tint }}
            thumbColor="#fff"
          />
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Notification Types</Text>

        {/* Individual Settings */}
        {settings.map(setting => (
          <View key={setting.id} style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{setting.title}</Text>
              <Text style={styles.settingDescription}>{setting.description}</Text>
            </View>
            <Switch
              value={setting.enabled}
              onValueChange={() => toggleSetting(setting.id)}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor="#fff"
              disabled={!masterEnabled}
            />
          </View>
        ))}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            You can view your notification history from the bell icon on the procurement screen.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: (typeof Colors)[keyof typeof Colors]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.background,
    },
    backButton: {
      padding: Spacing.sm,
      width: 40,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold' as const,
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    headerRight: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.xl,
    },
    masterCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    masterIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.tint + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    masterTextContainer: {
      flex: 1,
    },
    masterTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text,
      marginBottom: 2,
    },
    masterDescription: {
      fontSize: 13,
      fontWeight: 'normal' as const,
      color: colors.textSecondary,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
      marginLeft: Spacing.sm,
      textTransform: 'uppercase',
    },
    settingCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
    },
    settingInfo: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 15,
      fontWeight: '500' as const,
      color: colors.text,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: 12,
      fontWeight: 'normal' as const,
      color: colors.textSecondary,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginTop: Spacing.md,
    },
    infoText: {
      fontSize: 13,
      fontWeight: 'normal' as const,
      color: colors.textSecondary,
      marginLeft: Spacing.sm,
      flex: 1,
      lineHeight: 18,
    },
  });
}
