export interface CashAdvance {
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
  running_balance?: number;
}

export interface CashAdvanceRequest {
  amount: number;
  reason: string;
  particular?: string;
}

export interface CashAdvanceBalance {
  currentBalance: number;
  totalRequested: number;
  totalApproved: number;
  totalPaid: number;
  pendingRequests: number;
}
