export interface LoginRequest {
  Key: string;
  identifier: string;
  password: string;
  branch_name: string;
}

export interface UserData {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user_data?: UserData;
}

export interface AttendanceRequest {
  employee_id: number;
  branch_name: string;
}

export interface AttendanceResponse {
  success: boolean;
  message: string;
}

export interface AttendanceRecord {
  id?: number;
  employee_id: number;
  branch_name: string;
  timestamp: string;
  synced: boolean;
  action: 'present' | 'absent';
}
