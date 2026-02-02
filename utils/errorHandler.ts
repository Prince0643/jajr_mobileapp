import { ApiError } from '@/services/apiClient';

export interface ErrorInfo {
  message: string;
  type: 'network' | 'server' | 'validation' | 'unknown';
  statusCode?: number;
}

export class ErrorHandler {
  static handle(error: any): ErrorInfo {
    if (error instanceof ApiError) {
      return {
        message: error.message,
        type: error.status ? 'server' : 'network',
        statusCode: error.status,
      };
    }

    if (error?.response?.status) {
      const status = error.response.status;
      switch (status) {
        case 400:
          return {
            message: 'Invalid request. Please check your input.',
            type: 'validation',
            statusCode: status,
          };
        case 401:
          return {
            message: 'Authentication failed. Please login again.',
            type: 'server',
            statusCode: status,
          };
        case 403:
          return {
            message: 'Access denied. You don\'t have permission to perform this action.',
            type: 'server',
            statusCode: status,
          };
        case 404:
          return {
            message: 'The requested resource was not found.',
            type: 'server',
            statusCode: status,
          };
        case 500:
          return {
            message: 'Server error. Please try again later.',
            type: 'server',
            statusCode: status,
          };
        default:
          return {
            message: `Server error (${status}). Please try again.`,
            type: 'server',
            statusCode: status,
          };
      }
    }

    if (error?.request) {
      return {
        message: 'Network error. Please check your internet connection.',
        type: 'network',
      };
    }

    return {
      message: error?.message || 'An unexpected error occurred.',
      type: 'unknown',
    };
  }

  static getDisplayMessage(error: ErrorInfo): string {
    return error.message;
  }

  static shouldRetry(error: ErrorInfo): boolean {
    return error.type === 'network' || (error.statusCode !== undefined && error.statusCode >= 500);
  }
}

export default ErrorHandler;
