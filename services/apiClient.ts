import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = `${process.env.EXPO_PUBLIC_API_URL || 'https://jajr.xandree.com/'}`) {
    console.log('🔵 ApiClient baseURL:', baseURL);
    this.client = axios.create({
      baseURL,
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Skip auth header for login endpoint
        if (config.url && config.url.includes('login')) {
          return config;
        }
        
        // Add auth token if available for other endpoints
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: any) => {
        const { response } = error;
        const config = error?.config;
        const baseURL = config?.baseURL || '';
        const reqUrl = config?.url || '';
        const fullUrl = `${baseURL}${reqUrl}`;
        const method = config?.method;
        const timeout = config?.timeout;
        
        if (response) {
          const message = response.data?.message || 'Server error occurred';
          throw new ApiError(message, response.status, response.data);
        } else if (error.request) {
          console.log('🔴 Axios Network Error (no response):');
          console.log('Message:', error?.message);
          console.log('Code:', error?.code);
          console.log('Method:', method);
          console.log('URL:', fullUrl);
          console.log('Timeout:', timeout);
          if (config?.headers) {
            console.log('Headers:', JSON.stringify(config.headers, null, 2));
          }
          throw new ApiError('Network error. Please check your connection.');
        } else {
          throw new ApiError('An unexpected error occurred.');
        }
      }
    );
  }

  private async getAuthToken(): Promise<string | null> {
    const { SessionManager } = await import('@/utils/sessionManager');
    return SessionManager.getAuthToken();
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Use this for login - x-www-form-urlencoded like Postman
  public async postForm<T>(url: string, data: Record<string, any>): Promise<T> {
    // Convert data to URL-encoded format (like Postman)
    const params = new URLSearchParams();
    
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        params.append(key, String(data[key]));
      }
    });

    // Debug: Log what's being sent
    console.log('🔵 API Request Details:');
    console.log('URL:', url);
    console.log('Full Data Object:', JSON.stringify(data, null, 2));
    console.log('URLSearchParams string:', params.toString());
    
    // Log individual parameters for clarity
    console.log('Individual parameters:');
    Object.keys(data).forEach(key => {
      console.log(`  ${key}: "${data[key]}"`);
    });

    // IMPORTANT FIX: Send the params object, not params.toString()
    // axios will automatically serialize URLSearchParams
    const response = await this.client.post<T>(url, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
    });
    
    console.log('🟢 API Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  }

  // Alternative: Try multipart/form-data if x-www-form-urlencoded doesn't work
  public async postFormData<T>(url: string, data: Record<string, any>): Promise<T> {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, String(data[key]));
      }
    });

    console.log('🔵 API Request (multipart/form-data):');
    console.log('URL:', url);
    console.log('Data:', JSON.stringify(data, null, 2));
    console.log('FormData fields:');
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        console.log(`  ${key}: "${String(data[key])}"`);
      }
    });

    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('🟢 API Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  }
}

export const apiClient = new ApiClient();