import AsyncStorage from '@react-native-async-storage/async-storage';

const PROCUREMENT_API_URL = process.env.EXPO_PUBLIC_PROCUREMENT_API_URL || 'https://procurement-api.xandree.com';

export interface ProcurementUser {
  id: number;
  employee_no: string;
  first_name: string;
  middle_initial: string;
  last_name: string;
  role: 'engineer' | 'procurement' | 'admin' | 'super_admin';
  is_active: number;
}

export interface ProcurementLoginResponse {
  message: string;
  token: string;
  user: ProcurementUser;
}

export interface Category {
  id: number;
  category_name: string;
  items_count: number;
}

export interface Item {
  id: number;
  item_code: string;
  item_name: string;
  description: string;
  category_name: string;
  unit: string;
  category_id?: number;
}

export interface PurchaseRequestItem {
  item_id: number;
  quantity: number;
  remarks?: string;
}

export interface CreatePurchaseRequestPayload {
  purpose: string;
  remarks?: string;
  date_needed?: string;
  project?: string;
  project_address?: string;
  items: PurchaseRequestItem[];
}

export interface MyPurchaseRequest {
  id: number;
  pr_number: string;
  purpose: string;
  status: string;
  created_at: string;
  item_count: number;
  total_amount: number;
}

export interface PurchaseRequestDetail extends MyPurchaseRequest {
  remarks?: string;
  date_needed?: string;
  project?: string;
  project_address?: string;
  items: Array<{
    id: number;
    item_id: number;
    item_name: string;
    item_code: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total_price: number;
    remarks?: string;
    status: string;
  }>;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  unread_count: number;
}

class ProcurementService {
  private baseURL: string;

  constructor() {
    this.baseURL = PROCUREMENT_API_URL.endsWith('/') 
      ? PROCUREMENT_API_URL.slice(0, -1) 
      : PROCUREMENT_API_URL;
  }

  // Token Management
  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem('procurement_token', token);
  }

  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem('procurement_token');
  }

  async removeToken(): Promise<void> {
    await AsyncStorage.removeItem('procurement_token');
  }

  async setUser(user: ProcurementUser): Promise<void> {
    await AsyncStorage.setItem('procurement_user', JSON.stringify(user));
  }

  async getUser(): Promise<ProcurementUser | null> {
    const userStr = await AsyncStorage.getItem('procurement_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as ProcurementUser;
    } catch {
      return null;
    }
  }

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem('procurement_user');
  }

  async isLoggedIn(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  // Auth Headers
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // API Methods
  async login(employee_no: string, password: string): Promise<ProcurementLoginResponse> {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_no, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Login failed (${response.status})`);
    }

    const data: ProcurementLoginResponse = await response.json();
    
    if (data.token) {
      await this.setToken(data.token);
      await this.setUser(data.user);
    }

    return data;
  }

  async logout(): Promise<void> {
    await this.removeToken();
    await this.removeUser();
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const endpoints = [
      `${this.baseURL}/api/categories`,
      `${this.baseURL}/categories`
    ];
    
    for (const url of endpoints) {
      try {
        console.log('🔵 Fetching categories from:', url);
        const response = await fetch(url, {
          headers: await this.getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('� Categories response:', JSON.stringify(data, null, 2));
          return data.categories || data.data || [];
        }
        console.log('🔴 Categories fetch failed:', url, response.status);
      } catch (e) {
        console.log('� Categories endpoint error:', url, e);
      }
    }
    
    throw new Error('Failed to fetch categories from all endpoints');
  }

  // Items
  async getItems(): Promise<Item[]> {
    const endpoints = [
      `${this.baseURL}/api/items`,
      `${this.baseURL}/items`
    ];
    
    for (const url of endpoints) {
      try {
        console.log('🔵 Fetching items from:', url);
        const response = await fetch(url, {
          headers: await this.getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('🟢 Items response:', JSON.stringify(data, null, 2));
          const items = data.data || data.items || [];
          return items.map((item: any) => ({
            ...item,
            category_name: item.category_name || 'Uncategorized',
            category_id: item.category_id || null,
          }));
        }
        console.log('🔴 Items fetch failed:', url, response.status);
      } catch (e) {
        console.log('🔴 Items endpoint error:', url, e);
      }
    }
    
    throw new Error('Failed to fetch items from all endpoints');
  }

  async getItemsByCategory(categoryId: number): Promise<Item[]> {
    const response = await fetch(`${this.baseURL}/api/items?category_id=${categoryId}`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch items (${response.status})`);
    }

    const data = await response.json();
    return data.data || [];
  }

  // Purchase Requests
  async createPurchaseRequest(payload: CreatePurchaseRequestPayload): Promise<{ message: string; prId: number; pr_number: string }> {
    // Try various endpoint patterns
    const endpoints = [
      `${this.baseURL}/api/purchase-requests`,
      `${this.baseURL}/purchase-requests`,
      `${this.baseURL}/api/pr`,
      `${this.baseURL}/pr`
    ];
    
    let lastError = '';
    
    for (const url of endpoints) {
      try {
        console.log('🔵 Trying create PR endpoint:', url);
        const response = await fetch(url, {
          method: 'POST',
          headers: await this.getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          console.log('🟢 Create PR success at:', url);
          return response.json();
        }
        
        const errorData = await response.json().catch(() => ({}));
        lastError = errorData.message || `Failed (${response.status})`;
        console.log('🔴 Create PR endpoint failed:', url, response.status, lastError);
      } catch (e: any) {
        console.log('🔴 Create PR endpoint error:', url, e.message);
        lastError = e.message;
      }
    }
    
    throw new Error(lastError || 'Failed to create purchase request - all endpoints failed');
  }

  async getMyPurchaseRequests(): Promise<MyPurchaseRequest[]> {
    // Try various endpoint patterns - including role-based paths
    const endpoints = [
      `${this.baseURL}/api/purchase-requests/engineer`,
      `${this.baseURL}/api/purchase-requests/my-requests`,
      `${this.baseURL}/api/engineer/purchase-requests`,
      `${this.baseURL}/api/purchase-requests`,
      `${this.baseURL}/purchase-requests/engineer`,
      `${this.baseURL}/purchase-requests/my-requests`,
      `${this.baseURL}/engineer/purchase-requests`,
      `${this.baseURL}/purchase-requests`,
      `${this.baseURL}/api/pr`,
      `${this.baseURL}/pr`
    ];
    
    for (const url of endpoints) {
      try {
        console.log('🔵 Trying PR endpoint:', url);
        const response = await fetch(url, {
          headers: await this.getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('🟢 PRs response from', url, ':', JSON.stringify(data, null, 2));
          return data.data || data.purchaseRequests || data.requests || data.purchase_requests || [];
        }
        console.log('🔴 PR endpoint failed:', url, response.status);
      } catch (e) {
        console.log('🔴 PR endpoint error:', url, e);
      }
    }
    
    console.log('⚠️ All PR endpoints failed, returning empty array');
    return [];
  }

  async getPurchaseRequestDetail(id: number): Promise<PurchaseRequestDetail> {
    const response = await fetch(`${this.baseURL}/api/purchase-requests/${id}`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch purchase request details (${response.status})`);
    }

    const data = await response.json();
    return data.data;
  }

  async markItemsReceived(prId: number, items: { purchase_request_item_id: number; received: true }[]): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseURL}/api/purchase-requests/${prId}/receive`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to mark items received (${response.status})`);
    }

    return response.json();
  }

  // Notifications
  async getNotifications(): Promise<NotificationsResponse> {
    const response = await fetch(`${this.baseURL}/api/notifications`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch notifications (${response.status})`);
    }

    return response.json();
  }

  async markNotificationRead(id: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseURL}/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to mark notification as read (${response.status})`);
    }

    return response.json();
  }

  async markAllNotificationsRead(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseURL}/api/notifications/mark-all-read`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to mark all notifications as read (${response.status})`);
    }

    return response.json();
  }

  // Resubmit a rejected PR (for Engineer or Procurement)
  async resubmitPurchaseRequest(prId: number, payload: Partial<CreatePurchaseRequestPayload>): Promise<{ message: string; prId: number; pr_number: string }> {
    const response = await fetch(`${this.baseURL}/api/purchase-requests/${prId}/resubmit`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to resubmit purchase request (${response.status})`);
    }

    return response.json();
  }

  // Update a rejected PR without resubmitting (for editing before resubmit)
  async updatePurchaseRequest(prId: number, payload: Partial<CreatePurchaseRequestPayload>): Promise<{ message: string; prId: number }> {
    const response = await fetch(`${this.baseURL}/api/purchase-requests/${prId}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update purchase request (${response.status})`);
    }

    return response.json();
  }
}

export const procurementService = new ProcurementService();
export default procurementService;
