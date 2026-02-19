
export interface OvertimeRequest {
  id: number;
  employee_id: number;
  employee_code?: string;
  employee_name?: string;
  branch_name: string;
  request_date: string;
  requested_hours: number;
  overtime_reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by?: string;
  requested_by_user_id?: number;
  requested_at?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  attendance_id?: number;
}

export interface SubmitOvertimeRequest {
  employee_id: number;
  employee_code: string;
  branch_name: string;
  requested_hours: number;
  overtime_reason: string;
}

export interface ApproveOvertimeRequest {
  request_id: number;
  action: 'approve' | 'reject';
  rejection_reason?: string;
  approved_by?: string;
}

export class OvertimeService {
  private static getBaseUrl(): string {
    return process.env.EXPO_PUBLIC_API_URL || 'https://jajr.xandree.com/';
  }

  /**
   * Submit a new overtime request
   */
  static async submitOvertime(request: SubmitOvertimeRequest): Promise<{ success: boolean; message: string; request_id?: number }> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}overtime_request.php`;
    
    const formData = new FormData();
    formData.append('employee_id', String(request.employee_id));
    formData.append('employee_code', request.employee_code);
    formData.append('branch_name', request.branch_name);
    formData.append('requested_hours', String(request.requested_hours));
    formData.append('overtime_reason', request.overtime_reason);

    console.log('🔵 Submitting overtime request:', JSON.stringify(request, null, 2));

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const text = await response.text();
      console.log('🟢 Overtime submit response:', text);

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: false, message: text || 'Invalid JSON response' };
      }

      return data;
    } catch (error: any) {
      console.log('🔴 Overtime submit error:', error);
      return { success: false, message: error.message || 'Failed to submit overtime request' };
    }
  }

  /**
   * Get overtime requests for an employee or all (for admins)
   */
  static async getOvertimeRequests(params?: {
    employee_id?: number;
    status?: 'pending' | 'approved' | 'rejected';
    start_date?: string;
    end_date?: string;
  }): Promise<{ success: boolean; data?: OvertimeRequest[]; message?: string }> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}get_overtime_requests.php`;

    const formData = new FormData();
    if (params?.employee_id) {
      formData.append('employee_id', String(params.employee_id));
    }
    if (params?.status) {
      formData.append('status', params.status);
    }
    if (params?.start_date) {
      formData.append('start_date', params.start_date);
    }
    if (params?.end_date) {
      formData.append('end_date', params.end_date);
    }

    console.log('🔵 Fetching overtime requests:', JSON.stringify(params, null, 2));

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const text = await response.text();
      console.log('🟢 Overtime list response:', text);

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: false, message: text || 'Invalid JSON response' };
      }

      return data;
    } catch (error: any) {
      console.log('🔴 Overtime list error:', error);
      return { success: false, message: error.message || 'Failed to fetch overtime requests' };
    }
  }

  /**
   * Approve or reject an overtime request (admin only)
   */
  static async approveOvertime(request: ApproveOvertimeRequest): Promise<{ success: boolean; message: string }> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}approve_overtime.php`;

    const formData = new FormData();
    formData.append('request_id', String(request.request_id));
    formData.append('action', request.action);
    if (request.rejection_reason) {
      formData.append('rejection_reason', request.rejection_reason);
    }
    if (request.approved_by) {
      formData.append('approved_by', request.approved_by);
    }

    console.log('🔵 Approving/rejecting overtime:', JSON.stringify(request, null, 2));

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const text = await response.text();
      console.log('🟢 Overtime approval response:', text);

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: false, message: text || 'Invalid JSON response' };
      }

      return data;
    } catch (error: any) {
      console.log('🔴 Overtime approval error:', error);
      return { success: false, message: error.message || 'Failed to process overtime request' };
    }
  }
}

export default OvertimeService;
