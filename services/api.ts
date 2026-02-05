import {
  AttendanceRequest,
  AttendanceResponse,
  Employee,
  LoginRequest,
  LoginResponse,
} from '@/types';
import { apiClient } from './apiClient';

export class ApiService {
  // Authentication
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    const payload: LoginRequest = {
      ...credentials,
      Key: credentials.Key || credentials.identifier,
    };

    console.log('🔵 ApiService.login payload:', JSON.stringify(payload, null, 2));

    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://jajr.xandree.com/';
    const url = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}login_api_simple.php`;

    const formData = new FormData();
    Object.keys(payload).forEach((key) => {
      const value = (payload as any)[key];
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    console.log('🔵 Fetch Request (multipart/form-data):');
    console.log('URL:', url);
    console.log('FormData fields:');
    Object.keys(payload).forEach((key) => {
      const value = (payload as any)[key];
      if (value !== undefined && value !== null) {
        console.log(`  ${key}: "${String(value)}"`);
      }
    });

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
    });

    const text = await response.text();
    console.log('🟢 Fetch Response:');
    console.log('Status:', response.status);
    console.log('Body:', text);

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    if (!response.ok) {
      const message = data?.message || `Request failed (${response.status})`;
      throw new Error(message);
    }

    if (!data) {
      throw new Error('Invalid JSON response from server.');
    }

    return data as LoginResponse;
  }

  // Attendance Management
  static async timeIn(request: { employee_id: number; branch_name: string }): Promise<any> {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://jajr.xandree.com/';
    const url = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}time_in_api.php`;
    return apiClient.postForm<any>(url, request);
  }

  static async timeOut(request: { employee_id: number; branch_name: string }): Promise<any> {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://jajr.xandree.com/';
    const url = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}time_out_api.php`;
    return apiClient.postForm<any>(url, request);
  }

  static async saveAttendance(request: AttendanceRequest): Promise<AttendanceResponse> {
    const baseUrl = process.env.EXPO_PUBLIC_ATTENDANCE_API_URL || 'https://jajr.xandree.com/';
    const url = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}submit_attendance_api.php`;
    return apiClient.postForm<AttendanceResponse>(url, request);
  }

  static async getAvailableEmployees(branchName: string): Promise<Employee[]> {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://jajr.xandree.com/';
    const url = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}employees_today_status_api.php`;
    const raw = await apiClient.postForm<any>(url, { branch_name: branchName });

    if (typeof raw === 'string' && raw.toLowerCase().includes('<!doctype html')) {
      console.log('🔴 getAvailableEmployees received HTML instead of JSON. URL:', url);
      throw new Error('Employees endpoint returned HTML (wrong base URL/path).');
    }

    console.log('🔵 getAvailableEmployees raw response:', JSON.stringify(raw, null, 2));

    if (Array.isArray(raw)) {
      return raw as Employee[];
    }

    if (raw && Array.isArray(raw.available_employees)) {
      return raw.available_employees as Employee[];
    }

    if (raw && Array.isArray(raw.employees)) {
      return raw.employees as Employee[];
    }

    return [];
  }

  static async getShiftLogsToday(payload: {
    employee_id: number;
    date?: string;
    limit?: number;
  }): Promise<{ success: boolean; logs?: Array<{ id?: number; time_in: string | null; time_out: string | null }>; message?: string }> {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://jajr.xandree.com/';
    const url = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}get_shift_logs_api.php`;
    return apiClient.postForm(url, {
      employee_id: payload.employee_id,
      date: payload.date,
      limit: payload.limit ?? 50,
    } as any);
  }

  // Password Reset (if needed)
  static async resetPassword(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return apiClient.postForm<{ success: boolean; message: string }>('reset_password_api', {
      email,
      new_password: newPassword,
    });
  }

  // Check if email exists
  static async checkEmailExists(email: string): Promise<{ exists: boolean }> {
    return apiClient.post<{ exists: boolean }>('check_email_api', { email });
  }

  static async updateProfile(payload: {
    employee_id: number;
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    email?: string;
    current_password?: string;
    new_password?: string;
    use_password_hash?: 0 | 1;
  }): Promise<any> {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://jajr.xandree.com/';
    const url = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}update_profile_api.php`;
    return apiClient.postForm<any>(url, payload as any);
  }
}

export default ApiService;
