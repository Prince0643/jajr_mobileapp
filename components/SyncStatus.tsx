import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { syncManager, SyncResult } from '@/utils/syncManager';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';

interface SyncStatusProps {
  onSyncComplete?: (result: SyncResult) => void;
}

const SyncStatus: React.FC<SyncStatusProps> = ({ onSyncComplete }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'dark'];
  
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let isMounted = true;

    const run = async () => {
      try {
        await syncManager.initialize();

        const online = await syncManager.isOnlineStatus();
        if (isMounted) setIsOnline(online);

        const pending = await syncManager.getPendingSyncCount();
        if (isMounted) setPendingCount(pending);

        interval = setInterval(async () => {
          const currentOnline = await syncManager.isOnlineStatus();
          if (isMounted) setIsOnline(currentOnline);

          const currentPending = await syncManager.getPendingSyncCount();
          if (isMounted) setPendingCount(currentPending);
        }, 30000);
      } catch (error) {
        console.error('Error initializing sync status:', error);
      }
    };

    run();

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleSyncNow = async () => {
    if (isSyncing || !isOnline) return;
    
    setIsSyncing(true);
    try {
      const result = await syncManager.forceSyncNow();
      setLastSyncTime(new Date());
      setPendingCount(await syncManager.getPendingSyncCount());
      
      if (onSyncComplete) {
        onSyncComplete(result);
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return '#FF3B30';
    if (pendingCount > 0) return '#FF9500';
    return '#34C759';
  };

  const getSyncButtonColor = () => {
    return Colors.dark.tint;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (pendingCount > 0) return `${pendingCount} pending`;
    return '';
  };

  const getStatusIcon = () => {
    if (!isOnline) return 'wifi-off';
    if (isSyncing) return 'sync';
    if (pendingCount > 0) return 'time';
    return null; // Hide icon when synced
  };

  const shouldShowSyncStatus = () => {
    return !isOnline || isSyncing || pendingCount > 0 || lastSyncTime;
  };

  return (
    shouldShowSyncStatus() && (
      <View style={styles.container}>
        {(getStatusText() || getStatusIcon()) && (
          <View style={styles.statusContainer}>
            {getStatusIcon() && (
              <>
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
                <Ionicons 
                  name={getStatusIcon() as any} 
                  size={16} 
                  color={getStatusColor()} 
                />
              </>
            )}
            {getStatusText() && (
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            )}
          </View>
        )}
        
        {isOnline && pendingCount > 0 && (
          <TouchableOpacity
            style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
            onPress={handleSyncNow}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color={getSyncButtonColor()} />
            ) : (
              <>
                <Ionicons name="sync" size={16} color={getSyncButtonColor()} />
                <Text style={styles.syncButtonText}>Sync Now</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        
        {lastSyncTime && (
          <Text style={styles.lastSyncText}>
            Last sync: {lastSyncTime.toLocaleTimeString()}
          </Text>
        )}
      </View>
    )
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.dark.card,
    borderRadius: BorderRadius.sm,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '500',
    marginLeft: Spacing.xs,
    color: Colors.dark.text,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.dark.surface,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.dark.tint,
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  syncButtonText: {
    ...Typography.caption,
    color: Colors.dark.tint,
    fontWeight: '500',
    marginLeft: Spacing.xs,
  },
  lastSyncText: {
    ...Typography.caption,
    color: Colors.dark.textDisabled,
    fontStyle: 'italic',
    position: 'absolute',
    bottom: -15,
    right: Spacing.md,
  },
});

export default SyncStatus;
