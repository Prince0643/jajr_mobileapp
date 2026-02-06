import { Employee } from './Employee';

export interface Branch {
  id?: number | null;
  branchName: string;
  employees?: Employee[];
  isExpanded?: boolean;
  isLoading?: boolean;
}
