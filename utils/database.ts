import { AttendanceRecord, Employee } from '@/types';
import * as SQLite from 'expo-sqlite';

export interface BranchRecord {
  id?: number;
  branch_name: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeRecord {
  id?: number;
  employee_id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  branch_name: string;
  created_at: string;
  updated_at: string;
}

class DatabaseHelper {
  private db: SQLite.SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private async ensureDb(): Promise<SQLite.SQLiteDatabase> {
    if (this.db) return this.db;

    if (!this.initPromise) {
      this.initPromise = this.initDatabase().finally(() => {
        this.initPromise = null;
      });
    }

    await this.initPromise;

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return this.db;
  }

  async initDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('attendance.db');
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create branches table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        branch_name TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // Create employees table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER UNIQUE NOT NULL,
        employee_code TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        branch_name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (branch_name) REFERENCES branches (branch_name)
      );
    `);

    // Create attendance table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        branch_name TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        action TEXT NOT NULL CHECK (action IN ('present', 'absent')),
        FOREIGN KEY (employee_id) REFERENCES employees (employee_id)
      );
    `);

    // Create indexes for better performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_branch_name ON attendance(branch_name);
      CREATE INDEX IF NOT EXISTS idx_attendance_synced ON attendance(synced);
      CREATE INDEX IF NOT EXISTS idx_employees_branch_name ON employees(branch_name);
    `);
  }

  // Branch operations
  async getAllBranches(): Promise<string[]> {
    const db = await this.ensureDb();
    
    try {
      const result = await db.getAllAsync<{ branch_name: string }>(
        'SELECT DISTINCT branch_name FROM branches ORDER BY branch_name'
      );
      return result.map(row => row.branch_name);
    } catch (error) {
      console.error('Error getting branches:', error);
      return [];
    }
  }

  async addBranch(branchName: string): Promise<void> {
    const db = await this.ensureDb();
    
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT OR IGNORE INTO branches (branch_name, created_at, updated_at) VALUES (?, ?, ?)',
      [branchName, now, now]
    );
  }

  // Employee operations
  async getEmployeesByBranch(branchName: string): Promise<Employee[]> {
    const db = await this.ensureDb();
    
    try {
      const result = await db.getAllAsync<EmployeeRecord>(
        'SELECT * FROM employees WHERE branch_name = ? ORDER BY first_name, last_name',
        [branchName]
      );
      
      return result.map(emp => ({
        id: emp.employee_id,
        employee_code: emp.employee_code,
        first_name: emp.first_name,
        last_name: emp.last_name,
        branch_name: emp.branch_name,
      }));
    } catch (error) {
      console.error('Error getting employees:', error);
      return [];
    }
  }

  async addOrUpdateEmployee(employee: Employee): Promise<void> {
    const db = await this.ensureDb();
    
    const now = new Date().toISOString();
    await db.runAsync(`
      INSERT OR REPLACE INTO employees 
      (employee_id, employee_code, first_name, last_name, branch_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 
        COALESCE((SELECT created_at FROM employees WHERE employee_id = ?), ?), ?
      )
    `, [
      employee.id,
      employee.employee_code,
      employee.first_name,
      employee.last_name,
      employee.branch_name,
      employee.id,
      now,
      now
    ]);
  }

  // Attendance operations
  async saveAttendanceRecord(record: Omit<AttendanceRecord, 'id'>): Promise<number> {
    const db = await this.ensureDb();
    
    try {
      const result = await db.runAsync(
        `INSERT INTO attendance (employee_id, branch_name, timestamp, synced, action)
         VALUES (?, ?, ?, ?, ?)`,
        [record.employee_id, record.branch_name, record.timestamp, record.synced ? 1 : 0, record.action]
      );
      return result.lastInsertRowId || 0;
    } catch (error) {
      console.error('Error saving attendance record:', error);
      throw error;
    }
  }

  async getUnsyncedAttendanceRecords(): Promise<AttendanceRecord[]> {
    const db = await this.ensureDb();
    
    try {
      const result = await db.getAllAsync<AttendanceRecord>(
        'SELECT * FROM attendance WHERE synced = 0 ORDER BY timestamp'
      );
      return result.map(record => ({
        ...record,
        synced: Boolean(record.synced),
      }));
    } catch (error) {
      console.error('Error getting unsynced records:', error);
      return [];
    }
  }

  async markAttendanceAsSynced(recordId: number): Promise<void> {
    const db = await this.ensureDb();
    
    await db.runAsync(
      'UPDATE attendance SET synced = 1 WHERE id = ?',
      [recordId]
    );
  }

  async getTodayAttendance(employeeId: number): Promise<AttendanceRecord | null> {
    const db = await this.ensureDb();
    
    const today = new Date().toISOString().split('T')[0];
    try {
      const result = await db.getFirstAsync<AttendanceRecord>(
        `SELECT * FROM attendance 
         WHERE employee_id = ? AND date(timestamp) = ? 
         ORDER BY timestamp DESC LIMIT 1`,
        [employeeId, today]
      );
      return result ? { ...result, synced: Boolean(result.synced) } : null;
    } catch (error) {
      console.error('Error getting today attendance:', error);
      return null;
    }
  }

  async deleteAttendanceRecord(recordId: number): Promise<void> {
    const db = await this.ensureDb();
    
    await db.runAsync(
      'DELETE FROM attendance WHERE id = ?',
      [recordId]
    );
  }

  // Sync operations
  async getPendingSyncCount(): Promise<number> {
    const db = await this.ensureDb();
    
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM attendance WHERE synced = 0'
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Error getting sync count:', error);
      return 0;
    }
  }

  // Utility operations
  async clearAllData(): Promise<void> {
    const db = await this.ensureDb();
    
    await db.execAsync(`
      DELETE FROM attendance;
      DELETE FROM employees;
      DELETE FROM branches;
    `);
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

export const dbHelper = new DatabaseHelper();
export default dbHelper;
