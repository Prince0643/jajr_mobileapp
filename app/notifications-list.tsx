import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { procurementService } from '@/services/procurementService';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Notification {
  id: number;
  recipient_id: number;
  title: string;
  message: string;
  type: 'PR Created' | 'PR Approved' | 'PR Rejected' | 'PR On Hold' | 'PR Modified' | 'PO Created' | 'Item Received' | 'System';
  related_id: number;
  related_type: 'purchase_request' | 'purchase_order' | string;
  is_read: boolean;
  created_at: string;
}

const NOTIFICATION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'PR Created': 'document-text-outline',
  'PR Approved': 'checkmark-circle-outline',
  'PR Rejected': 'close-circle-outline',
  'PR On Hold': 'pause-circle-outline',
  'PR Modified': 'create-outline',
  'PO Created': 'cart-outline',
  'Item Received': 'cube-outline',
  'System': 'information-circle-outline',
};

const NOTIFICATION_COLORS: Record<string, string> = {
  'PR Created': '#2196F3',
  'PR Approved': '#4CAF50',
  'PR Rejected': '#F44336',
  'PR On Hold': '#FF9800',
  'PR Modified': '#9C27B0',
  'PO Created': '#2196F3',
  'Item Received': '#4CAF50',
  'System': '#757575',
};

export default function NotificationsListScreen() {
  const router = useRouter();
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const playNotificationSound = async () => {
    try {
      // Configure audio mode for iOS
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      
      // Use a short notification beep sound (local asset)
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/notification.wav'),
        { shouldPlay: true, volume: 1.0 }
      );
      
      // Vibrate as well
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Auto-unload after playing
      setTimeout(() => {
        sound.unloadAsync().catch(() => {});
      }, 1000);
      
      console.log('[Sound] Played notification sound');
    } catch (error) {
      console.log('[Sound] Error playing sound:', error);
      // Fallback to just vibration if sound fails
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const prevNotificationsRef = useRef<Set<number>>(new Set());

  const fetchNotifications = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const baseURL = 'https://procurement-api.xandree.com';
      const token = await procurementService.getToken();
      
      const response = await fetch(`${baseURL}/api/notifications`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const newNotifications = data.notifications || [];
        const newUnreadCount = data.unreadCount || 0;
        
        // Check if there are new unread notifications since last fetch
        const prevIds = prevNotificationsRef.current;
        const hasNewUnread = newNotifications.some((n: Notification) => !n.is_read && !prevIds.has(n.id));
        
        if (hasNewUnread && prevIds.size > 0) {
          // Play notification sound + vibration
          console.log('[Notification] New unread detected, playing sound...');
          playNotificationSound();
        }
        
        // Update ref with new notification IDs
        prevNotificationsRef.current = new Set(newNotifications.map((n: Notification) => n.id));
        
        setNotifications(newNotifications);
        setUnreadCount(newUnreadCount);
      } else {
        console.log('Failed to fetch notifications:', response.status);
      }
    } catch (error) {
      console.log('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const markAsRead = async (notificationId: number) => {
    try {
      const baseURL = 'https://procurement-api.xandree.com';
      const token = await procurementService.getToken();
      
      const response = await fetch(`${baseURL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.log('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    console.log('[MarkAllRead] Starting, unreadCount:', unreadCount);
    if (unreadCount === 0) {
      console.log('[MarkAllRead] No unread notifications, returning');
      return;
    }
    
    setIsMarkingAll(true);
    try {
      const baseURL = 'https://procurement-api.xandree.com';
      const token = await procurementService.getToken();
      
      // Get unread notifications
      const unreadNotifications = notifications.filter(n => !n.is_read);
      console.log('[MarkAllRead] Marking', unreadNotifications.length, 'notifications as read individually');
      
      // Mark each notification as read individually (backend doesn't have bulk endpoint)
      await Promise.all(
        unreadNotifications.map(async (notification) => {
          try {
            await fetch(`${baseURL}/api/notifications/${notification.id}/read`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
            });
          } catch (e) {
            console.log('[MarkAllRead] Failed to mark notification', notification.id, e);
          }
        })
      );
      
      console.log('[MarkAllRead] Success - updating UI');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.log('[MarkAllRead] Error:', error);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.related_type === 'purchase_request') {
      router.push({
        pathname: '/(tabs)/procurement',
        params: { prId: notification.related_id, view: 'pr-detail' }
      });
    } else if (notification.related_type === 'purchase_order') {
      router.back();
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchNotifications(false);
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const iconName = NOTIFICATION_ICONS[item.type] || 'information-circle-outline';
    const iconColor = NOTIFICATION_COLORS[item.type] || colors.tint;
    
    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationIconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={iconName} size={24} color={iconColor} />
          </View>
          {!item.is_read && <View style={styles.unreadDot} />}
        </View>
        
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, !item.is_read && styles.unreadText]}>
              {item.title}
            </Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          
          {item.related_type === 'purchase_request' && (
            <View style={styles.actionRow}>
              <Text style={styles.actionText}>View PR</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.tint} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <TouchableOpacity 
              style={styles.markAllButton}
              onPress={markAllAsRead}
              disabled={isMarkingAll}
            >
              {isMarkingAll ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <Text style={styles.markAllText}>Mark all read</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{unreadCount}</Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{notifications.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Notifications List */}
      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyText}>
                You don't have any notifications yet.{'\n'}They'll appear here when you do.
              </Text>
            </View>
          }
        />
      )}
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
      width: 80,
      alignItems: 'flex-end',
    },
    markAllButton: {
      padding: Spacing.sm,
    },
    markAllText: {
      fontSize: 12,
      fontWeight: '500' as const,
      color: colors.tint,
    },
    statsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      backgroundColor: colors.surface,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      borderRadius: BorderRadius.md,
    },
    statItem: {
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      color: colors.text,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: 'normal' as const,
      color: colors.textSecondary,
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 30,
      backgroundColor: colors.border,
    },
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContainer: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.xl,
    },
    notificationCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    unreadCard: {
      backgroundColor: colors.tint + '08',
      borderLeftWidth: 3,
      borderLeftColor: colors.tint,
    },
    notificationIconContainer: {
      position: 'relative',
      marginRight: Spacing.md,
    },
    iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    unreadDot: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.tint,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    notificationContent: {
      flex: 1,
    },
    notificationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    notificationTitle: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: colors.text,
      flex: 1,
      marginRight: Spacing.sm,
    },
    unreadText: {
      fontWeight: 'bold' as const,
    },
    timeAgo: {
      fontSize: 12,
      fontWeight: 'normal' as const,
      color: colors.textSecondary,
    },
    notificationMessage: {
      fontSize: 13,
      fontWeight: 'normal' as const,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    actionText: {
      fontSize: 12,
      fontWeight: '500' as const,
      color: colors.tint,
      marginRight: 2,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 100,
      paddingHorizontal: Spacing.xl,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.text,
      marginTop: Spacing.md,
      marginBottom: Spacing.sm,
    },
    emptyText: {
      fontSize: 14,
      fontWeight: 'normal' as const,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });
}
