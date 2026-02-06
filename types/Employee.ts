export interface Employee {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  branch_name?: string;
  branch_id?: number | null;
  assigned_branch_name?: string | null;
  position?: string;
  today_status?: string;
  time_in?: string | null;
  time_out?: string | null;
  is_time_running?: boolean;
  total_ot_hrs?: string | null;
  is_auto_absent?: boolean;
  can_mark_present?: boolean;
  isPresent?: boolean;
  isDisabled?: boolean;
  isSynced?: boolean;
}

export interface AvailableEmployeesResponse {
  available_employees: Employee[];
}
