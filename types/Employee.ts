export interface Employee {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  branch_name: string;
  position?: string;
  today_status?: string;
  is_auto_absent?: boolean;
  can_mark_present?: boolean;
  isPresent?: boolean;
  isDisabled?: boolean;
  isSynced?: boolean;
}

export interface AvailableEmployeesResponse {
  available_employees: Employee[];
}
