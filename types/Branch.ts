import { Employee } from './Employee';

export interface Branch {
  branchName: string;
  employees?: Employee[];
  isExpanded?: boolean;
  isLoading?: boolean;
}
