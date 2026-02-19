import { apiClient } from './apiClient';

export interface CashAdvanceTransaction {
  id: number;
  employee_id: number;
  amount: number;
  particular: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  request_date: string;
  approved_date: string | null;
  paid_date: string | null;
  approved_by: string | null;
  running_balance: number;
}

export interface CashAdvanceHistoryResponse {
  success: boolean;
  employee?: {
    id: number;
    first_name: string;
    last_name: string;
    employee_code: string;
    position: string;
  };
  transactions: CashAdvanceTransaction[];
  balance: number;
}

export interface CashAdvanceSummary {
  total_requested: number;
  total_approved: number;
  total_paid: number;
  outstanding_balance: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
}

export interface CashAdvanceSummaryResponse {
  success: boolean;
  summary: CashAdvanceSummary;
}

export interface CashAdvanceRequestPayload {
  employee_id: number;
  employee_code: string;
  amount: number;
  particular: string;
  reason: string;
}

export class CashAdvanceService {
  private static readonly BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://jajr.xandree.com/';

  /**
   * Get cash advance history for an employee
   * @param employeeId - Employee ID
   */
  static async getCashAdvanceHistory(employeeId: number): Promise<CashAdvanceHistoryResponse> {
    const baseUrl = this.BASE_URL;
    const url = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}cash_advance_history.php?emp_id=${employeeId}`;
    
    try {
      const response = await apiClient.get<CashAdvanceHistoryResponse>(url);
      return response;
    } catch (error: any) {
      // If endpoint doesn't exist (404) or server error, return empty data gracefully
      if (error?.response?.status === 404 || error?.response?.status === 500) {
        console.log('Cash advance history endpoint not available yet');
        return {
          success: true,
          transactions: [],
          balance: 0,
        };
      }
      console.error('Error fetching cash advance history:', error);
      return {
        success: true,
        transactions: [],
        balance: 0,
      };
    }
  }

  /**
   * Submit a new cash advance request
   * @param payload - Cash advance request data
   */
  static async submitCashAdvanceRequest(payload: CashAdvanceRequestPayload): Promise<{
    success: boolean;
    message: string;
    request_id?: number;
  }> {
    const baseUrl = this.BASE_URL;
    const url = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}cash_advance_request.php`;

    const formData = new FormData();
    formData.append('employee_id', String(payload.employee_id));
    formData.append('employee_code', payload.employee_code);
    formData.append('amount', String(payload.amount));
    formData.append('particular', payload.particular);
    formData.append('reason', payload.reason);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting cash advance request:', error);
      return {
        success: false,
        message: 'Failed to submit cash advance request',
      };
    }
  }

  /**
   * Get cash advance summary for an employee
   * @param employeeId - Employee ID
   * @param month - Optional month filter (1-12)
   * @param year - Optional year filter
   */
  static async getCashAdvanceSummary(
    employeeId: number,
    month?: number,
    year?: number
  ): Promise<CashAdvanceSummaryResponse> {
    const baseUrl = this.BASE_URL;
    let url = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}cash_advance_summary.php?employee_id=${employeeId}`;
    
    if (month !== undefined) {
      url += `&month=${month}`;
    }
    if (year !== undefined) {
      url += `&year=${year}`;
    }

    try {
      const response = await apiClient.get<CashAdvanceSummaryResponse>(url);
      return response;
    } catch (error: any) {
      // If endpoint doesn't exist (404) or server error, return empty summary gracefully
      if (error?.response?.status === 404 || error?.response?.status === 500) {
        console.log('Cash advance summary endpoint not available yet');
        return {
          success: true, // Return success to prevent UI errors
          summary: {
            total_requested: 0,
            total_approved: 0,
            total_paid: 0,
            outstanding_balance: 0,
            pending_requests: 0,
            approved_requests: 0,
            rejected_requests: 0,
          },
        };
      }
      console.error('Error fetching cash advance summary:', error);
      return {
        success: true, // Return success to prevent UI errors
        summary: {
          total_requested: 0,
          total_approved: 0,
          total_paid: 0,
          outstanding_balance: 0,
          pending_requests: 0,
          approved_requests: 0,
          rejected_requests: 0,
        },
      };
    }
  }
}

export default CashAdvanceService;
