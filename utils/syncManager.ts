import { ApiService } from '@/services/api';
import { AttendanceRecord, Employee } from '@/types';
import NetInfo from '@react-native-community/netinfo';
import { dbHelper } from './database';
import ErrorHandler from './errorHandler';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

export interface ConflictResolution {
  localRecord: AttendanceRecord;
  serverData: any;
  resolution: 'local' | 'server' | 'merge';
}

class SyncManager {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private initializePromise: Promise<void> | null = null;
  private netInfoUnsubscribe: (() => void) | null = null;

  private isIdempotentSuccessMessage(message: unknown): boolean {
    if (typeof message !== 'string') return false;
    const m = message.toLowerCase();
    return m.includes('already timed-in') || m.includes('already timed in');
  }

  async initialize(): Promise<void> {
    if (this.initializePromise) {
      return this.initializePromise;
    }

    this.initializePromise = (async () => {
      // Initialize database
      await dbHelper.initDatabase();

      // Monitor network status (subscribe only once)
      if (!this.netInfoUnsubscribe) {
        this.netInfoUnsubscribe = NetInfo.addEventListener((state: any) => {
          this.isOnline = state.isConnected ?? false;
          if (this.isOnline) {
            this.autoSync();
          }
        });
      }

      // Check initial network status
      const state = await NetInfo.fetch();
      this.isOnline = state.isConnected ?? false;

      // If already online on startup, attempt to sync right away
      if (this.isOnline) {
        this.autoSync();
      }
    })();

    try {
      await this.initializePromise;
    } finally {
      // keep promise so subsequent calls don't reinitialize
    }
  }

  async saveAttendanceOffline(
    employeeId: number,
    branchName: string,
    action: 'present' | 'absent' = 'present'
  ): Promise<number> {
    const record: Omit<AttendanceRecord, 'id'> = {
      employee_id: employeeId,
      branch_name: branchName,
      timestamp: new Date().toISOString(),
      synced: false,
      action,
    };

    return await dbHelper.saveAttendanceRecord(record);
  }

  async syncPendingAttendance(): Promise<SyncResult> {
    if (this.syncInProgress || !this.isOnline) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: this.syncInProgress ? ['Sync already in progress'] : ['Device offline'],
      };
    }

    this.syncInProgress = true;

    try {
      const pendingRecords = await dbHelper.getUnsyncedAttendanceRecords();
      
      if (pendingRecords.length === 0) {
        return {
          success: true,
          syncedCount: 0,
          failedCount: 0,
          errors: [],
        };
      }

      let syncedCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (const record of pendingRecords) {
        try {
          // Check for conflicts before syncing
          const conflict = await this.detectConflict(record);
          
          if (conflict) {
            const resolution = await this.resolveConflict(conflict);
            if (resolution === 'server') {
              // Skip this record, keep server version
              await dbHelper.deleteAttendanceRecord(record.id!);
              continue;
            }
          }

          // Attempt to sync with server
          const response = await ApiService.saveAttendance({
            employee_id: record.employee_id,
            branch_name: record.branch_name,
          });

          const idempotentSuccess = this.isIdempotentSuccessMessage((response as any)?.message);

          if (response.success || idempotentSuccess) {
            // Mark as synced
            await dbHelper.markAttendanceAsSynced(record.id!);
            syncedCount++;
          } else {
            failedCount++;
            errors.push(`Failed to sync employee ${record.employee_id}: ${response.message}`);
          }
        } catch (error) {
          failedCount++;
          const errorInfo = ErrorHandler.handle(error);
          errors.push(`Error syncing employee ${record.employee_id}: ${errorInfo.message}`);
        }
      }

      return {
        success: failedCount === 0,
        syncedCount,
        failedCount,
        errors,
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  private async detectConflict(record: AttendanceRecord): Promise<ConflictResolution | null> {
    try {
      // Check if there's already attendance for this employee today on the server
      // This is a simplified conflict detection - you might need to enhance this
      // based on your specific API endpoints
      
      // For now, we'll assume no conflicts unless you have a specific endpoint
      // to check existing attendance
      return null;
    } catch (error) {
      console.error('Error detecting conflict:', error);
      return null;
    }
  }

  private async resolveConflict(conflict: ConflictResolution): Promise<'local' | 'server'> {
    // Default conflict resolution strategy
    // You can enhance this based on your business logic
    
    // For now, we'll prefer the most recent record
    const localTime = new Date(conflict.localRecord.timestamp).getTime();
    const serverTime = new Date(conflict.serverData.timestamp || 0).getTime();
    
    return localTime > serverTime ? 'local' : 'server';
  }

  async cacheEmployees(employees: Employee[], branchName: string): Promise<void> {
    try {
      // Cache employees locally for offline access
      for (const employee of employees) {
        await dbHelper.addOrUpdateEmployee(employee);
      }
      
      // Ensure branch exists
      await dbHelper.addBranch(branchName);
    } catch (error) {
      console.error('Error caching employees:', error);
    }
  }

  async getCachedEmployees(branchName: string): Promise<Employee[]> {
    try {
      return await dbHelper.getEmployeesByBranch(branchName);
    } catch (error) {
      console.error('Error getting cached employees:', error);
      return [];
    }
  }

  async getCachedBranches(): Promise<string[]> {
    try {
      return await dbHelper.getAllBranches();
    } catch (error) {
      console.error('Error getting cached branches:', error);
      return [];
    }
  }

  async getPendingSyncCount(): Promise<number> {
    try {
      return await dbHelper.getPendingSyncCount();
    } catch (error) {
      console.error('Error getting sync count:', error);
      return 0;
    }
  }

  async isOnlineStatus(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected ?? false;
    } catch (error) {
      console.error('Error checking online status:', error);
      return false;
    }
  }

  private async autoSync(): Promise<void> {
    // Auto-sync when coming back online
    if (this.isOnline && !this.syncInProgress) {
      try {
        await this.syncPendingAttendance();
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }
  }

  async forceSyncNow(): Promise<SyncResult> {
    return await this.syncPendingAttendance();
  }

  async clearOfflineData(): Promise<void> {
    try {
      await dbHelper.clearAllData();
    } catch (error) {
      console.error('Error clearing offline data:', error);
      throw error;
    }
  }

  // Get offline attendance for today
  async getTodayAttendance(employeeId: number): Promise<AttendanceRecord | null> {
    try {
      return await dbHelper.getTodayAttendance(employeeId);
    } catch (error) {
      console.error('Error getting today attendance:', error);
      return null;
    }
  }

  // Get all offline attendance records
  async getAllOfflineAttendance(): Promise<AttendanceRecord[]> {
    try {
      return await dbHelper.getUnsyncedAttendanceRecords();
    } catch (error) {
      console.error('Error getting offline attendance:', error);
      return [];
    }
  }
}

export const syncManager = new SyncManager();
export default syncManager;
