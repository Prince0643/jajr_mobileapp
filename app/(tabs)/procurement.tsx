import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import { ApiService } from '@/services/api';
import { Category, Item, MyPurchaseRequest, PurchaseRequestItem as PRItem, procurementService } from '@/services/procurementService';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SelectedItem extends Item {
  quantity: number;
}

// Local type definition for ProcurementUser
type ProcurementUserLocal = {
  id: number;
  employee_no: string;
  first_name: string;
  middle_initial: string;
  last_name: string;
  role: 'engineer' | 'procurement' | 'admin' | 'super_admin';
  is_active: number;
};

const ProcurementScreen: React.FC = () => {
  const router = useRouter();
  const { resolvedTheme } = useThemeMode();
  const colors = Colors[resolvedTheme];
  const borderLight = ('borderLight' in colors ? (colors as any).borderLight : undefined) ?? colors.border;
  const styles = useMemo(() => createStyles(colors, borderLight), [borderLight, colors]);

  // User role state
  const [userRole, setUserRole] = useState<'engineer' | 'procurement' | 'admin' | 'super_admin' | null>(null);
  const [currentUser, setCurrentUser] = useState<ProcurementUserLocal | null>(null);

  // State
  const [activeTab, setActiveTab] = useState<'items' | 'my-prs' | 'rejected-prs' | 'all-prs' | 'review-prs' | 'approve-prs' | 'approve-pos' | 'employees'>('items');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<number, SelectedItem>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [myPRs, setMyPRs] = useState<MyPurchaseRequest[]>([]);
  
  // Form state
  const [purpose, setPurpose] = useState('');
  const [remarks, setRemarks] = useState('');
  const [dateNeeded, setDateNeeded] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [project, setProject] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Branches for project dropdown
  const [branches, setBranches] = useState<Array<{ id: number; branch_name: string }>>([]);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  // Super Admin states
  const [pendingPRs, setPendingPRs] = useState<MyPurchaseRequest[]>([]);
  const [pendingPOs, setPendingPOs] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [selectedPRForApproval, setSelectedPRForApproval] = useState<MyPurchaseRequest | null>(null);
  const [showPRDetailModal, setShowPRDetailModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showCategoryFilterDropdown, setShowCategoryFilterDropdown] = useState(false);
  const [selectedPRDetails, setSelectedPRDetails] = useState<any>(null);
  const [isLoadingPRDetails, setIsLoadingPRDetails] = useState(false);

  // Procurement Review states
  const [procurementReviewPRs, setProcurementReviewPRs] = useState<MyPurchaseRequest[]>([]);
  const [showProcurementReviewModal, setShowProcurementReviewModal] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [reviewItems, setReviewItems] = useState<any[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  // Add Item form state
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<number | null>(null);

  // Add Employee form state
  const [newEmployeeNo, setNewEmployeeNo] = useState('');
  const [newEmployeeFirstName, setNewEmployeeFirstName] = useState('');
  const [newEmployeeLastName, setNewEmployeeLastName] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState<'engineer' | 'procurement' | 'admin' | 'super_admin'>('engineer');

  // Notification badge count
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);

  // Edit/Resubmit states
  const [showEditPRModal, setShowEditPRModal] = useState(false);
  const [editingPR, setEditingPR] = useState<MyPurchaseRequest | null>(null);
  const [editPRDetails, setEditPRDetails] = useState<any>(null);
  const [isLoadingEditDetails, setIsLoadingEditDetails] = useState(false);
  const [editFormData, setEditFormData] = useState({
    purpose: '',
    remarks: '',
    date_needed: '',
    project: '',
    project_address: '',
  });
  const [editItems, setEditItems] = useState<any[]>([]);
  const [rejectedPRs, setRejectedPRs] = useState<MyPurchaseRequest[]>([]);
  const [allPRs, setAllPRs] = useState<MyPurchaseRequest[]>([]);

  // Fetch notification count - defined before useEffect
  const fetchNotificationCount = useCallback(async () => {
    try {
      const baseURL = 'https://procurement-api.xandree.com';
      const token = await procurementService.getToken();
      
      const response = await fetch(`${baseURL}/api/notifications`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const count = data.unreadCount || 0;
        console.log('[Notification Badge] Fetched count:', count);
        setNotificationUnreadCount(count);
      }
    } catch (error) {
      console.log('[Notification Badge] Failed to fetch:', error);
    }
  }, []);

  // Load data
  useEffect(() => {
    loadUser();
    loadCategories();
    loadItems();
    loadMyPRs();
    loadBranches();
    loadPendingPOs();
    fetchNotificationCount();
    
    // Poll every 30 seconds for real-time notification badge updates
    const interval = setInterval(() => {
      console.log('[Notification Badge] Polling...');
      fetchNotificationCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchNotificationCount]);

  // Load current user and role
  const loadUser = async () => {
    try {
      const user = await procurementService.getUser();
      if (user) {
        setCurrentUser(user);
        setUserRole(user.role);
        // Set initial tab based on role
        if (user.role === 'super_admin') {
          setActiveTab('approve-prs');
          // Auto-load pending PRs for Super Admin
          setTimeout(() => loadPendingPRs(), 100);
        }
      }
    } catch (error) {
      console.log('Failed to load user:', error);
    }
  };

  // Filter items when search or category changes
  useEffect(() => {
    let filtered = items;
    
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category_id === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.item_name.toLowerCase().includes(query) ||
        item.item_code.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }
    
    setFilteredItems(filtered);
  }, [items, selectedCategory, searchQuery]);

  // Reload My PRs when currentUser is set (to filter properly)
  useEffect(() => {
    if (currentUser) {
      loadMyPRs();
    }
  }, [currentUser]);

  const loadCategories = async () => {
    try {
      const data = await procurementService.getCategories();
      setCategories(data);
    } catch (error) {
      console.log('Failed to load categories:', error);
    }
  };

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const data = await procurementService.getItems();
      setItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.log('Failed to load items:', error);
      Alert.alert('Error', 'Failed to load items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMyPRs = async () => {
    try {
      const data = await procurementService.getMyPurchaseRequests();
      // Filter to only show PRs created by the current user
      if (currentUser) {
        const myPRsOnly = data.filter((pr: MyPurchaseRequest) => 
          (pr as any).requested_by === currentUser.id ||
          (pr as any).requester_id === currentUser.id ||
          (pr as any).created_by === currentUser.id
        );
        setMyPRs(myPRsOnly);
      } else {
        setMyPRs(data);
      }
    } catch (error) {
      console.log('Failed to load PRs:', error);
    }
  };

  // Load rejected PRs for engineers (PRs rejected by procurement that need to be edited and resubmitted)
  const loadRejectedPRs = async () => {
    setIsLoading(true);
    try {
      const data = await procurementService.getMyPurchaseRequests();
      // Filter to only show PRs created by the current user that are rejected
      if (currentUser) {
        const myRejectedPRs = data.filter((pr: MyPurchaseRequest) => 
          ((pr as any).requested_by === currentUser.id ||
           (pr as any).requester_id === currentUser.id ||
           (pr as any).created_by === currentUser.id) &&
          pr.status?.toLowerCase() === 'rejected'
        );
        setRejectedPRs(myRejectedPRs);
      } else {
        setRejectedPRs(data.filter((pr: MyPurchaseRequest) => pr.status?.toLowerCase() === 'rejected'));
      }
    } catch (error) {
      console.log('Failed to load rejected PRs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Super Admin data loading functions
  const loadPendingPRs = async () => {
    setIsLoading(true);
    try {
      const baseURL = 'https://procurement-api.xandree.com';
      
      // Try multiple endpoint patterns
      const endpoints = [
        `${baseURL}/api/purchase-requests`,
        `${baseURL}/api/purchase-requests/all`,
        `${baseURL}/api/purchase-requests/super-admin`,
        `${baseURL}/api/purchase-requests/pending`,
      ];
      
      for (const url of endpoints) {
        try {
          console.log('🔵 Trying to load PRs from:', url);
          const token = await procurementService.getToken();
          const response = await fetch(url, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('🟢 PRs loaded from', url, ':', data);
            const prs = data.data || data.purchaseRequests || data.requests || data.purchase_requests || [];
            
            // For now, show all PRs to Super Admin (filtering can be added once we know the status format)
            console.log('📋 All PRs count:', prs.length);
            setPendingPRs(prs);
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.log('🔴 Failed to load PRs from:', url, e);
        }
      }
      
      // If all endpoints fail, try the existing getMyPurchaseRequests as fallback
      console.log('⚠️ Trying fallback: getMyPurchaseRequests');
      const allPRs = await procurementService.getMyPurchaseRequests();
      const pendingPRs = allPRs.filter((pr: MyPurchaseRequest) => 
        pr.status?.toLowerCase() === 'pending' || 
        pr.status?.toLowerCase() === 'for super admin final approval'
      );
      setPendingPRs(pendingPRs);
    } catch (error) {
      console.log('🔴 Failed to load pending PRs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProcurementReviewPRs = async () => {
    setIsLoading(true);
    try {
      const baseURL = 'https://procurement-api.xandree.com';
      const token = await procurementService.getToken();
      
      // Fetch PRs with status 'For Procurement Review'
      const response = await fetch(`${baseURL}/api/purchase-requests?status=For Procurement Review`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const prs = data.purchaseRequests || data.data || [];
        setProcurementReviewPRs(prs);
      } else {
        console.log('Failed to load procurement review PRs:', response.status);
      }
    } catch (error) {
      console.log('Failed to load procurement review PRs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const baseURL = 'https://procurement-api.xandree.com';
      const token = await procurementService.getToken();
      
      const response = await fetch(`${baseURL}/api/suppliers`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.suppliers || data.data || []);
      }
    } catch (error) {
      console.log('Failed to load suppliers:', error);
    }
  };

  const handleProcurementApprove = async () => {
    if (!selectedPRForApproval || !selectedSupplier) return;
    
    // Validate all items have unit prices
    const itemsWithPricing = reviewItems.filter(item => item.unit_price > 0);
    if (itemsWithPricing.length !== selectedPRDetails?.items?.length) {
      Alert.alert('Error', 'Please set unit cost for all items');
      return;
    }

    setIsProcessing(true);
    try {
      const baseURL = 'https://procurement-api.xandree.com';
      const token = await procurementService.getToken();
      
      const approvalData = {
        status: 'approved',
        supplier_id: selectedSupplier.id,
        supplier_address: selectedSupplier.address,
        items: reviewItems.map(item => ({
          id: item.id,
          item_id: item.item_id,
          item_name: item.item_name,
          item_code: item.item_code,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price
        }))
      };
      
      const response = await fetch(`${baseURL}/api/purchase-requests/${selectedPRForApproval.id}/procurement-approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(approvalData)
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Purchase request approved and forwarded to Super Admin');
        setShowProcurementReviewModal(false);
        loadProcurementReviewPRs();
        setSelectedPRForApproval(null);
        setSelectedSupplier(null);
        setReviewItems([]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Error', errorData.message || 'Failed to approve PR');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to approve PR');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcurementReject = async () => {
    if (!selectedPRForApproval || !rejectionReason.trim()) return;

    setIsProcessing(true);
    try {
      const baseURL = 'https://procurement-api.xandree.com';
      const token = await procurementService.getToken();
      
      const rejectionData = {
        status: 'rejected',
        rejection_reason: rejectionReason,
        item_remarks: reviewItems
          .filter(item => item.remark)
          .map(item => ({
            item_id: item.item_id,
            remark: item.remark
          }))
      };
      
      const response = await fetch(`${baseURL}/api/purchase-requests/${selectedPRForApproval.id}/procurement-approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(rejectionData)
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Purchase request rejected');
        setShowRejectionModal(false);
        loadProcurementReviewPRs();
        setSelectedPRForApproval(null);
        setRejectionReason('');
        setReviewItems([]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Error', errorData.message || 'Failed to reject PR');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reject PR');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await fetch(`${procurementService['baseURL'] || 'https://procurement-api.xandree.com'}/api/employees`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await procurementService.getToken()}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.data || data.employees || []);
      }
    } catch (error) {
      console.log('Failed to load employees:', error);
    }
  };

  // Load pending POs for Super Admin approval
  const loadPendingPOs = async () => {
    setIsLoading(true);
    try {
      const baseURL = 'https://procurement-api.xandree.com';
      const token = await procurementService.getToken();
      
      // Try different status filters
      const endpoints = [
        `${baseURL}/api/purchase-orders?status=pending_approval`,
        `${baseURL}/api/purchase-orders?status=pending`,
        `${baseURL}/api/purchase-orders?status=Pending`,
        `${baseURL}/api/purchase-orders`, // All POs
      ];
      
      for (const url of endpoints) {
        console.log('[PO] Trying endpoint:', url);
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[PO] Response:', JSON.stringify(data, null, 2));
          
          const allPOs = data.purchaseOrders || data.data || [];
          // Filter for POs needing Super Admin approval (Draft or On Hold)
          const pendingPOs = allPOs.filter((po: any) => 
            po.status?.toLowerCase() === 'draft' ||
            po.status?.toLowerCase().includes('hold')
          );
          
          console.log('[PO] Found', pendingPOs.length, 'pending POs');
          setPendingPOs(pendingPOs);
          break;
        }
      }
    } catch (error) {
      console.log('Failed to load pending POs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle PO approve/hold for Super Admin
  const handleApprovePO = async (poId: number, action: 'approve' | 'hold') => {
    setIsProcessing(true);
    try {
      const baseURL = 'https://procurement-api.xandree.com';
      const token = await procurementService.getToken();
      
      const endpoint = `${baseURL}/api/purchase-orders/${poId}/super-admin-approve`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: action === 'approve' ? 'approved' : 'hold' }),
      });
      
      if (response.ok) {
        Alert.alert('Success', `Purchase order ${action === 'approve' ? 'approved' : 'held'} successfully`);
        loadPendingPOs();
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Error', errorData.message || `Failed to ${action} purchase order`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${action} purchase order`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprovePR = async (prId: number, action: 'approve' | 'reject' | 'hold', rejectionReason?: string) => {
    setIsProcessing(true);
    const baseURL = 'https://procurement-api.xandree.com';
    
    // Find the PR to determine which endpoint to use based on status
    const pr = pendingPRs.find(p => p.id === prId);
    if (!pr) {
      Alert.alert('Error', 'Purchase request not found');
      setIsProcessing(false);
      return;
    }
    
    // Determine endpoint based on current status and user role
    let endpoint = '';
    const status = pr.status?.toLowerCase();
    
    if (userRole === 'super_admin') {
      // Super Admin uses same endpoint for approve/hold/reject
      endpoint = `${baseURL}/api/purchase-requests/${prId}/super-admin-first-approve`;
    } else if (userRole === 'procurement') {
      // Procurement approves: For Procurement Review → For Super Admin Final Approval
      endpoint = `${baseURL}/api/purchase-requests/${prId}/procurement-approve`;
    } else {
      // Fallback to legacy endpoint
      endpoint = `${baseURL}/api/purchase-requests/${prId}/approve`;
    }
    
    try {
      const token = await procurementService.getToken();
      
      const body: any = {};
      if (action === 'approve') {
        body.status = 'approved';
      } else if (action === 'reject') {
        body.status = 'rejected';
        if (rejectionReason) {
          body.remarks = rejectionReason;
          body.rejection_reason = rejectionReason;
        }
      }
      if (action === 'hold') {
        body.status = 'On Hold';
      }
      
      console.log(`🔵 ${userRole} trying to ${action} PR ${prId} (current status: ${pr.status}) at:`, endpoint);
      console.log(`🔵 Request body:`, JSON.stringify(body));
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      
      if (response.ok) {
        console.log(`🟢 PR ${action} success`);
        Alert.alert('Success', `Purchase request ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'held'} successfully`);
        loadPendingPRs();
        setShowPRDetailModal(false);
        setSelectedPRForApproval(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log(`🔴 ${action} failed:`, JSON.stringify(errorData));
        const errorMsg = errorData.message || errorData.error || `Failed to ${action} (${response.status})`;
        Alert.alert('Error', errorMsg);
      }
    } catch (error: any) {
      console.log(`🔴 ${action} error:`, error.message);
      Alert.alert('Error', error.message || `Failed to ${action} purchase request`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemCode.trim()) {
      Alert.alert('Required', 'Please enter an item code');
      return;
    }
    
    if (!newItemName.trim()) {
      Alert.alert('Required', 'Please enter an item name');
      return;
    }

    setIsSubmitting(true);
    try {
      const baseURL = 'https://procurement-api.xandree.com';
      const token = await procurementService.getToken();
      
      const response = await fetch(`${baseURL}/api/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          item_code: newItemCode.trim(),
          item_name: newItemName.trim(),
          description: newItemDescription.trim() || undefined,
          unit: newItemUnit.trim() || undefined,
          category_id: newItemCategory,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Item added successfully');
        setShowAddItemModal(false);
        // Reset form
        setNewItemCode('');
        setNewItemName('');
        setNewItemDescription('');
        setNewItemUnit('');
        setNewItemCategory(null);
        // Reload items
        loadItems();
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Error', errorData.message || 'Failed to add item');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadPRDetails = async (prId: number) => {
    setIsLoadingPRDetails(true);
    try {
      const baseURL = 'https://procurement-api.xandree.com';
      const token = await procurementService.getToken();
      
      const response = await fetch(`${baseURL}/api/purchase-requests/${prId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const prDetails = data.data || data.purchaseRequest || data;
        setSelectedPRDetails(prDetails);
      } else {
        console.log('Failed to load PR details:', response.status);
      }
    } catch (error) {
      console.log('Error loading PR details:', error);
    } finally {
      setIsLoadingPRDetails(false);
    }
  };

  const loadBranches = async () => {
    try {
      const branches = await ApiService.getBranches();
      setBranches(branches);
    } catch (error) {
      console.log('Failed to load branches:', error);
    }
  };

  // Load all PRs for engineers (view all purchase requests in the system)
  const loadAllPRs = async () => {
    setIsLoading(true);
    try {
      const baseURL = 'https://procurement-api.xandree.com';
      const token = await procurementService.getToken();
      
      // Fetch all PRs without status filter
      const response = await fetch(`${baseURL}/api/purchase-requests`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const prs = data.purchaseRequests || data.data || [];
        setAllPRs(prs);
      } else {
        console.log('Failed to load all PRs:', response.status);
      }
    } catch (error) {
      console.log('Failed to load all PRs:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const loadEditPRDetails = async (prId: number) => {
    setIsLoadingEditDetails(true);
    try {
      const baseURL = 'https://procurement-api.xandree.com';
      const token = await procurementService.getToken();
      
      const response = await fetch(`${baseURL}/api/purchase-requests/${prId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const prDetails = data.data || data.purchaseRequest || data;
        setEditPRDetails(prDetails);
        
        // Initialize form data with current PR values
        setEditFormData({
          purpose: prDetails.purpose || '',
          remarks: prDetails.remarks || '',
          date_needed: prDetails.date_needed ? prDetails.date_needed.split('T')[0] : '',
          project: prDetails.project || '',
          project_address: prDetails.project_address || '',
        });
        
        // Initialize edit items with current items
        setEditItems(prDetails.items?.map((item: any) => ({
          ...item,
          quantity: item.quantity,
          remarks: item.remarks || '',
        })) || []);
      } else {
        console.log('Failed to load PR details for edit:', response.status);
        Alert.alert('Error', 'Failed to load PR details');
      }
    } catch (error) {
      console.log('Error loading PR details for edit:', error);
      Alert.alert('Error', 'Failed to load PR details');
    } finally {
      setIsLoadingEditDetails(false);
    }
  };

  // Handle opening edit modal for a PR
  const handleEditPR = (pr: MyPurchaseRequest) => {
    setEditingPR(pr);
    loadEditPRDetails(pr.id);
    setShowEditPRModal(true);
  };

  // Handle resubmitting a PR after edits
  const handleResubmitPR = async () => {
    if (!editingPR) return;
    
    // Validate required fields
    if (!editFormData.purpose.trim()) {
      Alert.alert('Required', 'Please enter the purpose of this purchase request');
      return;
    }
    
    if (!editFormData.date_needed) {
      Alert.alert('Required', 'Please select a date needed');
      return;
    }

    if (!editFormData.project.trim()) {
      Alert.alert('Required', 'Please select a project');
      return;
    }
    
    if (editItems.length === 0) {
      Alert.alert('Required', 'PR must have at least one item');
      return;
    }

    setIsSubmitting(true);
    try {
      const prItems = editItems.map(item => ({
        item_id: item.item_id,
        quantity: parseInt(item.quantity) || 1,
        remarks: item.remarks || '',
      }));

      const response = await procurementService.resubmitPurchaseRequest(editingPR.id, {
        purpose: editFormData.purpose.trim(),
        remarks: editFormData.remarks.trim() || undefined,
        date_needed: editFormData.date_needed ? editFormData.date_needed.split('T')[0] : '',
        project: editFormData.project.trim(),
        project_address: editFormData.project_address.trim() || undefined,
        items: prItems,
      });

      // Close modal and reset form immediately
      setShowEditPRModal(false);
      setEditingPR(null);
      setEditFormData({
        purpose: '',
        remarks: '',
        date_needed: '',
        project: '',
        project_address: '',
      });
      setEditItems([]);
      
      // Refresh PR lists
      loadMyPRs();
      loadRejectedPRs();
      loadProcurementReviewPRs();
      
      // Show success message
      Alert.alert(
        'Success',
        `Purchase Request ${response.pr_number} resubmitted successfully!`
      );
    } catch (error: any) {
      console.log('🔴 PR Resubmit Error:', error);
      Alert.alert('Error', error.message || 'Failed to resubmit purchase request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update quantity for edit items
  const updateEditItemQuantity = (index: number, quantity: string) => {
    const num = parseInt(quantity, 10);
    if (isNaN(num) || num < 1) return;
    
    setEditItems(prev => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], quantity: num };
      return newItems;
    });
  };

  const toggleItemSelection = useCallback((item: Item) => {
    setSelectedItems(prev => {
      if (prev[item.id]) {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [item.id]: { ...item, quantity: 1 } };
    });
  }, []);

  const updateQuantity = useCallback((itemId: number, quantity: string) => {
    // Allow empty string temporarily so user can clear the field
    if (quantity === '') {
      setSelectedItems(prev => ({
        ...prev,
        [itemId]: { ...prev[itemId], quantity: 1 }
      }));
      return;
    }
    
    const num = parseInt(quantity, 10);
    if (isNaN(num)) return;
    
    // Allow values >= 1
    const validNum = num < 1 ? 1 : num;
    
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: validNum }
    }));
  }, []);

  const selectedCount = Object.keys(selectedItems).length;

  const handleCreatePR = async () => {
    if (!purpose.trim()) {
      Alert.alert('Required', 'Please enter the purpose of this purchase request');
      return;
    }
    
    if (!dateNeeded) {
      Alert.alert('Required', 'Please select a date needed');
      return;
    }

    if (!project.trim()) {
      Alert.alert('Required', 'Please select a project');
      return;
    }
    
    if (selectedCount === 0) {
      Alert.alert('Required', 'Please select at least one item');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('🔵 Submitting PR with data:', { purpose, dateNeeded, project, items: selectedItems });
      
      const prItems: PRItem[] = Object.values(selectedItems).map(item => ({
        item_id: item.id,
        quantity: item.quantity,
        remarks: ''
      }));

      const response = await procurementService.createPurchaseRequest({
        purpose: purpose.trim(),
        remarks: remarks.trim() || undefined,
        date_needed: dateNeeded.toISOString().split('T')[0],
        project: project.trim(),
        project_address: projectAddress.trim() || undefined,
        items: prItems
      });

      console.log('🟢 PR Response:', response);

      if (response.prId) {
        // Close modal and reset form immediately
        setShowCreateModal(false);
        setSelectedItems({});
        setPurpose('');
        setRemarks('');
        setDateNeeded(null);
        setProject('');
        setProjectAddress('');
        loadMyPRs();
        setActiveTab('my-prs');
        
        // Delay alert slightly to let modal close
        setTimeout(() => {
          Alert.alert(
            'Success',
            `Purchase Request ${response.pr_number} created successfully!`
          );
        }, 300);
      } else {
        Alert.alert('Error', response.message || 'Failed to create purchase request');
      }
    } catch (error: any) {
      console.log('🔴 PR Submit Error:', error);
      Alert.alert('Error', error.message || 'Failed to create purchase request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return 'All Categories';
    const cat = categories.find(c => c.id === categoryId);
    return cat?.category_name || 'Unknown';
  };

  const renderItem = ({ item }: { item: Item }) => {
    const isSelected = !!selectedItems[item.id];
    const selectedItem = selectedItems[item.id];

    return (
      <TouchableOpacity
        style={[styles.itemCard, isSelected && styles.itemCardSelected]}
        onPress={() => toggleItemSelection(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          <Text style={[styles.itemCode, isSelected && styles.itemCodeSelected]}>{item.item_code}</Text>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
        </View>
        
        <Text style={[styles.itemName, isSelected && styles.itemNameSelected]} numberOfLines={2}>{item.item_name}</Text>
        {item.description ? (
          <Text style={[styles.itemDescription, isSelected && styles.itemDescriptionSelected]} numberOfLines={2}>{item.description}</Text>
        ) : null}
        
        <View style={styles.itemFooter}>
          <View style={[styles.categoryBadge, isSelected && styles.categoryBadgeSelected]}>
            <Text style={[styles.categoryBadgeText, isSelected && styles.categoryBadgeTextSelected]}>{item.category_name}</Text>
          </View>
          <Text style={[styles.unitText, isSelected && styles.unitTextSelected]}>{item.unit}</Text>
        </View>

        {isSelected && (
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Qty:</Text>
            <TextInput
              style={styles.quantityInput}
              value={selectedItem.quantity === 0 ? '' : String(selectedItem.quantity)}
              onChangeText={(text) => updateQuantity(item.id, text)}
              keyboardType="number-pad"
              maxLength={4}
              selectTextOnFocus
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const openPRPreview = (pr: MyPurchaseRequest) => {
    setSelectedPRForApproval(pr);
    loadPRDetails(pr.id);
    setShowPRDetailModal(true);
  };

  const renderMyPR = ({ item }: { item: MyPurchaseRequest }) => {
    const status = item.status?.toLowerCase() || '';
    const canEditFromMyPRs = userRole === 'procurement' && status === 'rejected';

    return (
      <TouchableOpacity
        style={styles.prCard}
        activeOpacity={0.7}
        onPress={() => openPRPreview(item)}
      >
        <View style={styles.prHeader}>
          <Text style={styles.prNumber}>{item.pr_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.prPurpose} numberOfLines={2}>{item.purpose}</Text>
        <View style={styles.prFooter}>
          <Text style={styles.prDate}>{formatDate(item.created_at)}</Text>
          <Text style={styles.prAmount}>₱{item.total_amount?.toLocaleString() || '0'}</Text>
        </View>
        {canEditFromMyPRs && (
          <View style={[styles.approvalCardFooter, { marginTop: Spacing.md }]}>
            <View />
            <TouchableOpacity
              style={[styles.approvalButton, { backgroundColor: '#D4A853', width: 'auto', paddingHorizontal: 12 }]}
              onPress={() => handleEditPR(item)}
            >
              <Ionicons name="create" size={18} color="#fff" />
              <Text style={{ color: '#fff', marginLeft: 6, fontWeight: '600', fontSize: 12 }}>Edit & Resubmit</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#FFC107';
      case 'for procurement review': return '#2196F3';
      case 'for super admin final approval': return '#9C27B0';
      case 'for purchase': return '#FF9800';
      case 'po created': return '#4CAF50';
      case 'completed': return '#2E7D32';
      case 'rejected': return '#F44336';
      case 'cancelled': return '#9E9E9E';
      case 'on hold': return '#FF9800';
      default: return '#757575';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return '#D32F2F';
      case 'admin': return '#1976D2';
      case 'procurement': return '#388E3C';
      case 'engineer': return '#FBC02D';
      default: return '#757575';
    }
  };

  // Check if current user can approve/reject/hold a PR based on role and status
  const canActOnPR = (prStatus: string): boolean => {
    const status = prStatus.toLowerCase();
    
    if (userRole === 'super_admin') {
      // Super Admin can act on: Pending (first approval), For Super Admin Final Approval (final approval), or On Hold
      return status === 'pending' || status === 'for super admin final approval' || status.includes('hold');
    } else if (userRole === 'procurement') {
      // Procurement can act on: For Procurement Review
      return status === 'for procurement review';
    }
    
    return false;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Procurement</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/notifications-list')}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            {notificationUnreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notificationUnreadCount > 99 ? '99+' : notificationUnreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Switcher - Role Based */}
      <View style={styles.tabContainer}>
        {userRole === 'super_admin' ? (
          // Super Admin Tabs
          <>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'approve-prs' && styles.tabActive]}
              onPress={() => {
                setActiveTab('approve-prs');
                loadPendingPRs();
              }}
            >
              <Text style={[styles.tabText, activeTab === 'approve-prs' && styles.tabTextActive]}>Approve PRs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'approve-pos' && styles.tabActive]}
              onPress={() => {
                setActiveTab('approve-pos');
                loadPendingPOs();
              }}
            >
              <Text style={[styles.tabText, activeTab === 'approve-pos' && styles.tabTextActive]}>Approve POs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'items' && styles.tabActive]}
              onPress={() => setActiveTab('items')}
            >
              <Text style={[styles.tabText, activeTab === 'items' && styles.tabTextActive]}>Items</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'employees' && styles.tabActive]}
              onPress={() => {
                setActiveTab('employees');
                loadEmployees();
              }}
            >
              <Text style={[styles.tabText, activeTab === 'employees' && styles.tabTextActive]}>Employees</Text>
            </TouchableOpacity>
          </>
        ) : userRole === 'procurement' ? (
          // Procurement Tabs
          <>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'items' && styles.tabActive]}
              onPress={() => setActiveTab('items')}
            >
              <Text style={[styles.tabText, activeTab === 'items' && styles.tabTextActive]}>Items</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'my-prs' && styles.tabActive]}
              onPress={() => setActiveTab('my-prs')}
            >
              <Text style={[styles.tabText, activeTab === 'my-prs' && styles.tabTextActive]}>My PRs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'review-prs' && styles.tabActive]}
              onPress={() => {
                setActiveTab('review-prs');
                loadProcurementReviewPRs();
              }}
            >
              <Text style={[styles.tabText, activeTab === 'review-prs' && styles.tabTextActive]}>Review PRs</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Engineer Tabs (default)
          <>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'items' && styles.tabActive]}
              onPress={() => setActiveTab('items')}
            >
              <Text style={[styles.tabText, activeTab === 'items' && styles.tabTextActive]}>Items</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'all-prs' && styles.tabActive]}
              onPress={() => {
                setActiveTab('all-prs');
                loadAllPRs();
              }}
            >
              <Text style={[styles.tabText, activeTab === 'all-prs' && styles.tabTextActive]}>All PRs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'my-prs' && styles.tabActive]}
              onPress={() => setActiveTab('my-prs')}
            >
              <Text style={[styles.tabText, activeTab === 'my-prs' && styles.tabTextActive]}>My PRs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'rejected-prs' && styles.tabActive]}
              onPress={() => {
                setActiveTab('rejected-prs');
                loadRejectedPRs();
              }}
            >
              <Text style={[styles.tabText, activeTab === 'rejected-prs' && styles.tabTextActive]}>Rejected PRs</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {activeTab === 'items' ? (
        <>
          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search items by name or code..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Category Filter */}
          <TouchableOpacity style={styles.categoryDropdown} onPress={() => setShowCategoryFilterDropdown(true)}>
            <Text style={styles.categoryDropdownText}>
              {getCategoryName(selectedCategory)}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.text} />
          </TouchableOpacity>

          {/* Item Action Button - Role based */}
          {userRole === 'super_admin' ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddItemModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Item</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.prButton, selectedCount > 0 && styles.prButtonActive]}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={20} color={selectedCount > 0 ? '#fff' : colors.text} />
              <Text style={[styles.prButtonText, selectedCount > 0 && styles.prButtonTextActive]}>
                PR ({selectedCount})
              </Text>
            </TouchableOpacity>
          )}

          {/* Items Grid */}
          {isLoading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={colors.tint} />
            </View>
          ) : (
            <FlatList
              data={filteredItems}
              renderItem={renderItem}
              keyExtractor={(item) => String(item.id)}
              numColumns={2}
              columnWrapperStyle={styles.itemRow}
              contentContainerStyle={styles.itemsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="cube-outline" size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyText}>No items found</Text>
                </View>
              }
            />
          )}
        </>
      ) : activeTab === 'approve-prs' ? (
        /* Super Admin - Approve PRs */
        <View style={{ flex: 1 }}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Super Admin Approval</Text>
            <Text style={styles.infoCardSubtitle}>First approval: Pending → For Procurement Review | Final approval: For Super Admin Final Approval → For Purchase</Text>
          </View>
          <FlatList
            data={pendingPRs}
            renderItem={({ item }: { item: MyPurchaseRequest }) => (
              <TouchableOpacity
                style={styles.approvalCard}
                onPress={() => {
                  setSelectedPRForApproval(item);
                  loadPRDetails(item.id);
                  setShowPRDetailModal(true);
                }}
              >
                <View style={styles.approvalCardHeader}>
                  <View>
                    <Text style={styles.approvalCardId}>{item.pr_number}</Text>
                    <Text style={styles.approvalCardPurpose}>{item.purpose}</Text>
                    <Text style={styles.approvalCardRequester}>
                      By: {(item as any).requester_first_name && (item as any).requester_last_name 
                           ? `${(item as any).requester_first_name} ${(item as any).requester_last_name}`
                           : (item as any).requester_name || 
                             (item as any).requester || 
                             (item as any).employee_name || 
                             (item as any).created_by_name || 
                             'Unknown'}
                    </Text>
                  </View>
                  <View style={[styles.approvalCardBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.approvalCardBadgeText}>{item.status}</Text>
                  </View>
                </View>
                <View style={styles.approvalCardFooter}>
                  <Text style={styles.approvalCardDate}>{formatDate(item.created_at)}</Text>
                  {canActOnPR(item.status) ? (
                    <View style={styles.approvalButtons}>
                      <TouchableOpacity
                        style={[styles.approvalButton, styles.rejectButton]}
                        onPress={() => handleApprovePR(item.id, 'reject')}
                        disabled={isProcessing}
                      >
                        <Ionicons name="close-circle" size={24} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.approvalButton, { backgroundColor: '#FF9800' }]}
                        onPress={() => handleApprovePR(item.id, 'hold')}
                        disabled={isProcessing}
                      >
                        <Ionicons name="pause" size={20} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.approvalButton, styles.approveButton]}
                        onPress={() => handleApprovePR(item.id, 'approve')}
                        disabled={isProcessing}
                      >
                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.waitingBadge}>
                      <Text style={styles.waitingBadgeText}>
                        {item.status?.toLowerCase() === 'for procurement review' ? 'Awaiting Procurement' : 'In Progress'}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.prList}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={loadPendingPRs}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No pending PRs for approval</Text>
              </View>
            }
          />
        </View>
      ) : activeTab === 'approve-pos' ? (
        // Load pending POs for Super Admin approval
        <View style={{ flex: 1 }}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Purchase Orders Pending Approval</Text>
            <Text style={styles.infoCardSubtitle}>Review and approve/reject purchase orders placed by Admin</Text>
          </View>
          <FlatList
            data={pendingPOs}
            renderItem={({ item }: { item: any }) => (
              <View style={styles.approvalCard}>
                <View style={styles.approvalCardHeader}>
                  <View>
                    <Text style={styles.approvalCardId}>{item.po_number || `PO-${item.id}`}</Text>
                    <Text style={styles.approvalCardPurpose}>{item.supplier_name || 'Unknown Supplier'}</Text>
                    <Text style={styles.approvalCardRequester}>
                      Total: ₱{(item.total_amount || 0).toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.approvalCardBadge, { backgroundColor: item.status?.toLowerCase().includes('hold') ? '#FF9800' : '#FFC107' }]}>
                    <Text style={styles.approvalCardBadgeText}>{item.status?.toLowerCase().includes('hold') ? 'On Hold' : 'Pending'}</Text>
                  </View>
                </View>
                <View style={styles.approvalCardFooter}>
                  <Text style={styles.approvalCardDate}>{formatDate(item.created_at)}</Text>
                  <View style={styles.approvalButtons}>
                    <TouchableOpacity
                      style={[styles.approvalButton, styles.rejectButton]}
                      onPress={() => handleApprovePO(item.id, 'hold')}
                      disabled={isProcessing}
                    >
                      <Ionicons name="pause" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.approvalButton, styles.approveButton]}
                      onPress={() => handleApprovePO(item.id, 'approve')}
                      disabled={isProcessing}
                    >
                      <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.prList}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={loadPendingPOs}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="cart-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No pending purchase orders</Text>
              </View>
            }
          />
        </View>
      ) : activeTab === 'review-prs' ? (
        /* Procurement - Review PRs */
        <View style={{ flex: 1 }}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Procurement Review</Text>
            <Text style={styles.infoCardSubtitle}>Review PRs from Super Admin, set unit costs, select suppliers, and approve/reject. PRs rejected by Super Admin need to be edited and resubmitted.</Text>
          </View>
          <FlatList
            data={procurementReviewPRs}
            renderItem={({ item }: { item: MyPurchaseRequest }) => {
              // Check if this is a rejected PR (has rejection_reason from Super Admin)
              const isRejectedBySuperAdmin = !!(item as any).rejection_reason || (item as any).was_rejected === true;
              
              return (
                <TouchableOpacity
                  style={[styles.approvalCard, isRejectedBySuperAdmin && { borderLeftWidth: 4, borderLeftColor: '#F44336' }]}
                  onPress={() => {
                    if (isRejectedBySuperAdmin) {
                      // For rejected PRs, open edit modal
                      handleEditPR(item);
                    } else {
                      // For new PRs, open review modal
                      setSelectedPRForApproval(item);
                      loadPRDetails(item.id);
                      loadSuppliers();
                      setSelectedSupplier(null);
                      setReviewItems([]);
                      setShowProcurementReviewModal(true);
                    }
                  }}
                >
                  <View style={styles.approvalCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.approvalCardId}>{item.pr_number}</Text>
                      <Text style={styles.approvalCardPurpose}>{item.purpose}</Text>
                      <Text style={styles.approvalCardRequester}>
                        By: {(item as any).requester_first_name && (item as any).requester_last_name 
                             ? `${(item as any).requester_first_name} ${(item as any).requester_last_name}`
                             : (item as any).requester_name || 
                               (item as any).requester || 
                               (item as any).employee_name || 
                               (item as any).created_by_name || 
                               'Unknown'}
                      </Text>
                      {isRejectedBySuperAdmin && (item as any).rejection_reason && (
                        <Text style={[styles.approvalCardRequester, { color: '#F44336', marginTop: 4 }]}>
                          <Ionicons name="warning" size={12} color="#F44336" /> Rejected: {(item as any).rejection_reason}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.approvalCardBadge, { backgroundColor: getStatusColor(item.status) }]}>
                      <Text style={styles.approvalCardBadgeText}>{item.status}</Text>
                    </View>
                  </View>
                  <View style={styles.approvalCardFooter}>
                    <Text style={styles.approvalCardDate}>{formatDate(item.created_at)}</Text>
                    {isRejectedBySuperAdmin ? (
                      // Show Edit & Resubmit button for rejected PRs
                      <TouchableOpacity
                        style={styles.editResubmitButton}
                        onPress={() => handleEditPR(item)}
                      >
                        <Ionicons name="refresh" size={16} color="#fff" />
                        <Text style={styles.editResubmitButtonText} numberOfLines={1}>
                          Edit & Resubmit
                        </Text>
                      </TouchableOpacity>
                    ) : canActOnPR(item.status) ? (
                      // Show approve/reject buttons for new PRs
                      <View style={styles.approvalButtons}>
                        <TouchableOpacity
                          style={[styles.approvalButton, styles.rejectButton]}
                          onPress={() => {
                            setSelectedPRForApproval(item);
                            loadPRDetails(item.id);
                            setRejectionReason('');
                            setShowRejectionModal(true);
                          }}
                          disabled={isProcessing}
                        >
                          <Ionicons name="close-circle" size={24} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.approvalButton, styles.approveButton]}
                          onPress={() => {
                            setSelectedPRForApproval(item);
                            loadPRDetails(item.id);
                            loadSuppliers();
                            setSelectedSupplier(null);
                            setReviewItems([]);
                            setShowProcurementReviewModal(true);
                          }}
                          disabled={isProcessing}
                        >
                          <Ionicons name="checkmark-circle" size={24} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.waitingBadge}>
                        <Text style={styles.waitingBadgeText}>
                          {item.status?.toLowerCase() === 'for super admin final approval' ? 'Awaiting Super Admin' : 'In Progress'}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.prList}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={loadProcurementReviewPRs}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No PRs awaiting procurement review</Text>
              </View>
            }
          />
        </View>
      ) : activeTab === 'employees' ? (
        /* Super Admin - Employees */
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddEmployeeModal(true)}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Employee</Text>
          </TouchableOpacity>
          <FlatList
            data={employees}
            renderItem={({ item }: { item: any }) => (
              <View style={styles.employeeCard}>
                <View style={styles.employeeCardContent}>
                  <View>
                    <Text style={styles.employeeCode}>{item.employee_no}</Text>
                    <Text style={styles.employeeName}>{item.first_name} {item.last_name}</Text>
                    <View style={styles.employeeBadges}>
                      <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
                        <Text style={styles.roleBadgeText}>{item.role}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: item.is_active ? '#4CAF50' : '#F44336' }]}>
                        <Text style={styles.statusBadgeText}>{item.is_active ? 'Active' : 'Inactive'}</Text>
                      </View>
                    </View>
                    <Text style={styles.employeeDept}>Dept: {item.department || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.employeeActions}>
                  <TouchableOpacity style={styles.employeeActionButton}>
                    <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.employeeActionButton}>
                    <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.prList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No employees found</Text>
              </View>
            }
          />
        </View>
      ) : activeTab === 'all-prs' ? (
        /* All PRs List - for Engineers to view all purchase requests */
        <View style={{ flex: 1 }}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>All Purchase Requests</Text>
            <Text style={styles.infoCardSubtitle}>View all PRs in the system across all users and statuses.</Text>
          </View>
          <FlatList
            data={allPRs}
            renderItem={({ item }: { item: MyPurchaseRequest }) => (
              <TouchableOpacity
                style={styles.approvalCard}
                onPress={() => openPRPreview(item)}
              >
                <View style={styles.approvalCardHeader}>
                  <View>
                    <Text style={styles.approvalCardId}>{item.pr_number}</Text>
                    <Text style={styles.approvalCardPurpose}>{item.purpose}</Text>
                    <Text style={styles.approvalCardRequester}>
                      By: {(item as any).requester_first_name && (item as any).requester_last_name 
                        ? `${(item as any).requester_first_name} ${(item as any).requester_last_name}`
                        : (item as any).requester_name || 
                          (item as any).requester || 
                          (item as any).employee_name || 
                          (item as any).created_by_name || 
                          'Unknown'}
                    </Text>
                  </View>
                  <View style={[styles.approvalCardBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.approvalCardBadgeText}>{item.status}</Text>
                  </View>
                </View>
                <View style={styles.approvalCardFooter}>
                  <Text style={styles.approvalCardDate}>{formatDate(item.created_at)}</Text>
                  <Text style={styles.prAmount}>₱{item.total_amount?.toLocaleString() || '0'}</Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.prList}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={loadAllPRs}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No purchase requests found</Text>
              </View>
            }
          />
        </View>
      ) : activeTab === 'rejected-prs' ? (
        /* Rejected PRs List - for Engineers to edit and resubmit */
        <View style={{ flex: 1 }}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Rejected Purchase Requests</Text>
            <Text style={styles.infoCardSubtitle}>These PRs were rejected by Procurement. Edit and resubmit them.</Text>
          </View>
          <FlatList
            data={rejectedPRs}
            renderItem={({ item }: { item: MyPurchaseRequest }) => (
              <TouchableOpacity
                style={[styles.approvalCard, { borderLeftWidth: 4, borderLeftColor: '#F44336' }]}
                onPress={() => handleEditPR(item)}
              >
                <View style={styles.approvalCardHeader}>
                  <View>
                    <Text style={styles.approvalCardId}>{item.pr_number}</Text>
                    <Text style={styles.approvalCardPurpose}>{item.purpose}</Text>
                    {(item as any).rejection_reason && (
                      <Text style={[styles.approvalCardRequester, { color: '#F44336', marginTop: 4 }]}>
                        Reason: {(item as any).rejection_reason}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.approvalCardBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.approvalCardBadgeText}>{item.status}</Text>
                  </View>
                </View>
                <View style={styles.approvalCardFooter}>
                  <Text style={styles.approvalCardDate}>{formatDate(item.created_at)}</Text>
                  <TouchableOpacity
                    style={styles.editResubmitButton}
                    onPress={() => handleEditPR(item)}
                  >
                    <Ionicons name="create" size={16} color="#fff" />
                    <Text style={styles.editResubmitButtonText} numberOfLines={1}>
                      Edit & Resubmit
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.prList}
            showsVerticalScrollIndicator={false}
            refreshing={isLoading}
            onRefresh={loadRejectedPRs}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No rejected PRs to fix</Text>
                <Text style={[styles.emptyText, { fontSize: 12, marginTop: 8 }]}>Great job! All your PRs are in good standing.</Text>
              </View>
            }
          />
        </View>
      ) : (
        /* My PRs List */
        <FlatList
          data={myPRs}
          renderItem={renderMyPR}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.prList}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={loadMyPRs}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No purchase requests yet</Text>
            </View>
          }
        />
      )}

      {/* Create PR Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Purchase Request</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Purpose */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Purpose *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter the purpose of this purchase request"
                  placeholderTextColor={colors.textSecondary}
                  value={purpose}
                  onChangeText={setPurpose}
                  multiline
                />
              </View>

              {/* Date Needed & Project */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Date Needed *</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={dateNeeded ? styles.datePickerText : styles.datePickerPlaceholder}>
                      {dateNeeded ? dateNeeded.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={dateNeeded || new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(_event: any, selectedDate?: Date) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          setDateNeeded(selectedDate);
                        }
                      }}
                      minimumDate={new Date()}
                    />
                  )}
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Project *</Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowProjectDropdown(true)}
                  >
                    <Text style={project ? styles.dropdownButtonText : styles.dropdownPlaceholder}>
                      {project || 'Select project'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Project Address */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Project Address</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter project address"
                  placeholderTextColor={colors.textSecondary}
                  value={projectAddress}
                  onChangeText={setProjectAddress}
                />
              </View>

              {/* Remarks */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Remarks (Optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Additional notes..."
                  placeholderTextColor={colors.textSecondary}
                  value={remarks}
                  onChangeText={setRemarks}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Selected Items */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Selected Items</Text>
                <View style={styles.selectedItemsList}>
                  {Object.values(selectedItems).map((item) => (
                    <View key={item.id} style={styles.selectedItemRow}>
                      <View style={styles.selectedItemInfo}>
                        <Text style={styles.selectedItemName} numberOfLines={1}>{item.item_name}</Text>
                        <Text style={styles.selectedItemCode}>{item.item_code}</Text>
                      </View>
                      <Text style={styles.selectedItemQty}>Qty: {item.quantity}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleCreatePR}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        visible={showAddItemModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddItemModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Item</Text>
              <TouchableOpacity onPress={() => setShowAddItemModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Item Code */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Item Code *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., ITM008"
                  placeholderTextColor={colors.textSecondary}
                  value={newItemCode}
                  onChangeText={setNewItemCode}
                  autoCapitalize="characters"
                />
              </View>

              {/* Item Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Item Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter item name"
                  placeholderTextColor={colors.textSecondary}
                  value={newItemName}
                  onChangeText={setNewItemName}
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Enter description"
                  placeholderTextColor={colors.textSecondary}
                  value={newItemDescription}
                  onChangeText={setNewItemDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Unit & Category Row */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Unit</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., pc, kg, box"
                    placeholderTextColor={colors.textSecondary}
                    value={newItemUnit}
                    onChangeText={setNewItemUnit}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Category</Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowCategoryDropdown(true)}
                  >
                    <Text style={newItemCategory ? styles.dropdownButtonText : styles.dropdownPlaceholder}>
                      {newItemCategory ? getCategoryName(newItemCategory) : 'Select category'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddItemModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleAddItem}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Item</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Dropdown Modal */}
      <Modal
        visible={showCategoryDropdown}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategoryDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dropdownCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryDropdown(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setNewItemCategory(item.id);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item.category_name}</Text>
                  {newItemCategory === item.id && (
                    <Ionicons name="checkmark" size={20} color={colors.tint} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
      {/* Category Filter Dropdown Modal */}
      <Modal
        visible={showCategoryFilterDropdown}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategoryFilterDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dropdownCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryFilterDropdown(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ id: null as any, category_name: 'All Categories' }, ...categories]}
              keyExtractor={(item) => String(item.id ?? 'all')}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedCategory(item.id);
                    setShowCategoryFilterDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item.category_name}</Text>
                  {(selectedCategory === item.id || (item.id === null && selectedCategory === null)) && (
                    <Ionicons name="checkmark" size={20} color={colors.tint} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Project Dropdown Modal */}
      <Modal
        visible={showProjectDropdown}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProjectDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dropdownCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Project</Text>
              <TouchableOpacity onPress={() => setShowProjectDropdown(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={branches}
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setProject(item.branch_name);
                    if (showEditPRModal) {
                      setEditFormData(prev => ({ ...prev, project: item.branch_name }));
                    }
                    setShowProjectDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item.branch_name}</Text>
                  {project === item.branch_name && (
                    <Ionicons name="checkmark" size={20} color={colors.tint} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ padding: Spacing.md, alignItems: 'center' }}>
                  <Text style={{ color: colors.textSecondary }}>No projects available</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* PR Detail Preview Modal */}
      <Modal
        visible={showPRDetailModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPRDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>PR Details</Text>
              <TouchableOpacity onPress={() => setShowPRDetailModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedPRForApproval && (
                <>
                  {/* PR Number & Status */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>PR Number</Text>
                    <Text style={styles.detailValue}>{selectedPRForApproval.pr_number}</Text>
                  </View>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedPRForApproval.status) }]}>
                      <Text style={styles.statusBadgeText}>{selectedPRForApproval.status}</Text>
                    </View>
                  </View>

                  {/* Purpose */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Purpose</Text>
                    <Text style={styles.detailValue}>{selectedPRForApproval.purpose}</Text>
                  </View>

                  {/* Requester */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Requested By</Text>
                    <Text style={styles.detailValue}>
                      {(selectedPRForApproval as any).requester_first_name && (selectedPRForApproval as any).requester_last_name 
                        ? `${(selectedPRForApproval as any).requester_first_name} ${(selectedPRForApproval as any).requester_last_name}`
                        : (selectedPRForApproval as any).requester_name || 
                          (selectedPRForApproval as any).requester || 
                          (selectedPRForApproval as any).employee_name || 
                          (selectedPRForApproval as any).created_by_name || 
                          'Unknown'}
                    </Text>
                  </View>

                  {/* Date */}
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Date Created</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedPRForApproval.created_at)}</Text>
                  </View>

                  {/* Items List */}
                  {isLoadingPRDetails ? (
                    <View style={styles.detailSection}>
                      <ActivityIndicator size="small" color={colors.tint} />
                      <Text style={[styles.detailLabel, { marginTop: Spacing.sm }]}>Loading items...</Text>
                    </View>
                  ) : selectedPRDetails?.items && selectedPRDetails.items.length > 0 ? (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Items ({selectedPRDetails.items.length})</Text>
                      <View style={styles.detailItemsList}>
                        {selectedPRDetails.items.map((item: any, index: number) => (
                          <View key={index} style={[styles.detailItemRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                              <View style={styles.detailItemInfo}>
                                <Text style={styles.detailItemName}>{item.item_name}</Text>
                                <Text style={styles.detailItemCode}>{item.item_code}</Text>
                              </View>
                              <Text style={styles.detailItemQty}>Qty: {item.quantity}</Text>
                            </View>
                            {Array.isArray(item.rejection_remarks) && item.rejection_remarks.length > 0 && (
                              <View style={[styles.detailSection, { backgroundColor: '#FFEBEE', padding: Spacing.md, borderRadius: BorderRadius.md, borderLeftWidth: 4, borderLeftColor: '#F44336', marginTop: Spacing.sm, width: '100%' }]}>
                                <Text style={[styles.detailLabel, { color: '#F44336' }]}>Item Remark(s)</Text>
                                {item.rejection_remarks.map((r: any, i: number) => (
                                  <Text key={i} style={[styles.detailValue, { color: '#D32F2F', marginTop: i === 0 ? 0 : 6 }]}>
                                    {r.remark}
                                  </Text>
                                ))}
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {/* Total Amount */}
                  {(selectedPRForApproval as any).total_amount !== undefined && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Total Amount</Text>
                      <Text style={styles.detailAmount}>
                        ₱{(selectedPRForApproval as any).total_amount?.toLocaleString() || '0'}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {/* Action Buttons */}
            {selectedPRForApproval && canActOnPR(selectedPRForApproval.status) && (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.approvalButton, styles.rejectButton, { flex: 1, height: 48 }]}
                  onPress={() => {
                    handleApprovePR(selectedPRForApproval.id, 'reject');
                    setShowPRDetailModal(false);
                  }}
                  disabled={isProcessing}
                >
                  <Ionicons name="close-circle" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.approvalButton, styles.approveButton, { flex: 1, height: 48 }]}
                  onPress={() => {
                    handleApprovePR(selectedPRForApproval.id, 'approve');
                    setShowPRDetailModal(false);
                  }}
                  disabled={isProcessing}
                >
                  <Ionicons name="checkmark-circle" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Procurement Review Modal */}
      <Modal
        visible={showProcurementReviewModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowProcurementReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review PR - {selectedPRForApproval?.pr_number}</Text>
              <TouchableOpacity onPress={() => setShowProcurementReviewModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* PR Info */}
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Purpose</Text>
                <Text style={styles.detailValue}>{selectedPRForApproval?.purpose}</Text>
              </View>

              {/* Items for Review */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Items</Text>
                {isLoadingPRDetails ? (
                  <ActivityIndicator size="small" color={colors.tint} />
                ) : selectedPRDetails?.items?.map((item: any, index: number) => (
                  <View key={index} style={[styles.reviewItemCard, { backgroundColor: colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md }]}>
                    <Text style={styles.detailItemName}>{item.item_name}</Text>
                    <Text style={styles.detailItemCode}>{item.item_code}</Text>
                    
                    {/* Quantity and Unit */}
                    <View style={[styles.formRow, { marginTop: Spacing.sm }]}>
                      <View style={[styles.formGroup, { flex: 1, marginBottom: 0 }]}>
                        <Text style={styles.formLabel}>Qty</Text>
                        <TextInput
                          style={[styles.formInput, { paddingVertical: Spacing.sm }]}
                          value={String(reviewItems[index]?.quantity || item.quantity)}
                          onChangeText={(text) => {
                            const newItems = [...reviewItems];
                            newItems[index] = { ...newItems[index], quantity: parseInt(text) || 1, item_id: item.item_id, id: item.id };
                            setReviewItems(newItems);
                          }}
                          keyboardType="number-pad"
                        />
                      </View>
                      <View style={[styles.formGroup, { flex: 1, marginBottom: 0 }]}>
                        <Text style={styles.formLabel}>Unit</Text>
                        <TextInput
                          style={[styles.formInput, { paddingVertical: Spacing.sm }]}
                          value={reviewItems[index]?.unit || item.unit}
                          onChangeText={(text) => {
                            const newItems = [...reviewItems];
                            newItems[index] = { ...newItems[index], unit: text, item_id: item.item_id, id: item.id };
                            setReviewItems(newItems);
                          }}
                        />
                      </View>
                    </View>

                    {/* Unit Price */}
                    <View style={[styles.formGroup, { marginTop: Spacing.sm, marginBottom: 0 }]}>
                      <Text style={styles.formLabel}>Unit Cost (PHP)</Text>
                      <TextInput
                        style={[styles.formInput, { paddingVertical: Spacing.sm }]}
                        value={reviewItems[index]?.unit_price ? String(reviewItems[index].unit_price) : ''}
                        onChangeText={(text) => {
                          const newItems = [...reviewItems];
                          newItems[index] = { 
                            ...newItems[index], 
                            unit_price: parseFloat(text) || 0, 
                            item_id: item.item_id, 
                            id: item.id,
                            item_name: item.item_name,
                            item_code: item.item_code,
                            quantity: reviewItems[index]?.quantity || item.quantity,
                            unit: reviewItems[index]?.unit || item.unit
                          };
                          setReviewItems(newItems);
                        }}
                        keyboardType="decimal-pad"
                        placeholder="Enter unit cost"
                      />
                    </View>

                    {/* Item Total */}
                    <Text style={[styles.itemTotalText, { marginTop: Spacing.sm, textAlign: 'right' }]}>
                      Total: ₱{((reviewItems[index]?.quantity || item.quantity) * (reviewItems[index]?.unit_price || 0)).toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Supplier Selection */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Supplier *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowSupplierDropdown(!showSupplierDropdown)}
                >
                  <Text style={selectedSupplier ? styles.dropdownButtonText : styles.dropdownPlaceholder}>
                    {selectedSupplier?.supplier_name || 'Select supplier'}
                  </Text>
                  <Ionicons name={showSupplierDropdown ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                {selectedSupplier && !showSupplierDropdown && (
                  <Text style={[styles.supplierAddress, { marginTop: Spacing.xs, color: colors.textSecondary }]}>
                    {selectedSupplier.address}
                  </Text>
                )}
                
                {/* Inline Supplier Dropdown */}
                {showSupplierDropdown && (
                  <View style={[styles.inlineDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={true}>
                      {suppliers.map((item) => (
                        <TouchableOpacity
                          key={String(item.id)}
                          style={styles.inlineDropdownItem}
                          onPress={() => {
                            setSelectedSupplier(item);
                            setShowSupplierDropdown(false);
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.dropdownItemText}>{item.supplier_name}</Text>
                            <Text style={[styles.supplierAddress, { marginTop: 2 }]}>{item.address}</Text>
                          </View>
                          {selectedSupplier?.id === item.id && (
                            <Ionicons name="checkmark" size={20} color={colors.tint} />
                          )}
                        </TouchableOpacity>
                      ))}
                      {suppliers.length === 0 && (
                        <View style={{ padding: Spacing.md, alignItems: 'center' }}>
                          <Text style={{ color: colors.textSecondary }}>No suppliers available</Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Total Amount */}
              <View style={[styles.detailSection, { backgroundColor: colors.surface, padding: Spacing.md, borderRadius: BorderRadius.md }]}>
                <Text style={styles.detailLabel}>Total Amount</Text>
                <Text style={[styles.detailAmount, { fontSize: 24 }]}>
                  ₱{reviewItems.reduce((sum, item) => sum + ((item?.quantity || 0) * (item?.unit_price || 0)), 0).toLocaleString()}
                </Text>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowProcurementReviewModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, (!selectedSupplier || isProcessing) && styles.submitButtonDisabled]}
                onPress={handleProcurementApprove}
                disabled={!selectedSupplier || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Approve & Forward</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        visible={showRejectionModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRejectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject PR - {selectedPRForApproval?.pr_number}</Text>
              <TouchableOpacity onPress={() => setShowRejectionModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Rejection Reason */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Rejection Reason *</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Enter reason for rejection..."
                  placeholderTextColor={colors.textSecondary}
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Per-Item Remarks */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Per-Item Remarks (Optional)</Text>
                {selectedPRDetails?.items?.map((item: any, index: number) => (
                  <View key={index} style={[styles.formGroup, { backgroundColor: colors.surface, padding: Spacing.md, borderRadius: BorderRadius.md }]}>
                    <Text style={[styles.detailItemName, { marginBottom: Spacing.xs }]}>{item.item_name}</Text>
                    <TextInput
                      style={[styles.formInput, styles.textArea, { marginBottom: 0 }]}
                      placeholder={`Remarks for ${item.item_name}...`}
                      placeholderTextColor={colors.textSecondary}
                      value={reviewItems[index]?.remark || ''}
                      onChangeText={(text) => {
                        const newItems = [...reviewItems];
                        newItems[index] = { ...newItems[index], remark: text, item_id: item.id };
                        setReviewItems(newItems);
                      }}
                      multiline
                      numberOfLines={2}
                    />
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowRejectionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rejectButton, (!rejectionReason.trim() || isProcessing) && { opacity: 0.5 }]}
                onPress={handleProcurementReject}
                disabled={!rejectionReason.trim() || isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.submitButtonText, { color: '#fff' }]}>Reject PR</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Supplier Dropdown Modal */}
      {/* Removed Supplier Dropdown Modal */}

      {/* Edit/Resubmit PR Modal */}
      <Modal
        visible={showEditPRModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditPRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit & Resubmit PR - {editingPR?.pr_number}</Text>
              <TouchableOpacity onPress={() => setShowEditPRModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {isLoadingEditDetails ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color={colors.tint} />
                <Text style={{ marginTop: Spacing.md, color: colors.textSecondary }}>Loading PR details...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Purpose */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Purpose *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Enter the purpose of this purchase request"
                    placeholderTextColor={colors.textSecondary}
                    value={editFormData.purpose}
                    onChangeText={(text) => setEditFormData(prev => ({ ...prev, purpose: text }))}
                    multiline
                  />
                </View>

                {/* Date Needed & Project */}
                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Date Needed *</Text>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={editFormData.date_needed ? styles.datePickerText : styles.datePickerPlaceholder}>
                        {editFormData.date_needed ? editFormData.date_needed.split('T')[0] : 'Select date'}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={editFormData.date_needed ? new Date(editFormData.date_needed) : new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(_event: any, selectedDate?: Date) => {
                          setShowDatePicker(false);
                          if (selectedDate) {
                            const yyyyMmDd = selectedDate.toISOString().split('T')[0];
                            setEditFormData(prev => ({ ...prev, date_needed: yyyyMmDd }));
                          }
                        }}
                        minimumDate={new Date()}
                      />
                    )}
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Project *</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowProjectDropdown(true)}
                    >
                      <Text style={editFormData.project ? styles.dropdownButtonText : styles.dropdownPlaceholder}>
                        {editFormData.project || 'Select project'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Project Address */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Project Address</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Enter project address"
                    placeholderTextColor={colors.textSecondary}
                    value={editFormData.project_address}
                    onChangeText={(text) => setEditFormData(prev => ({ ...prev, project_address: text }))}
                  />
                </View>

                {/* Remarks */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Remarks (Optional)</Text>
                  <TextInput
                    style={[styles.formInput, styles.textArea]}
                    placeholder="Additional notes..."
                    placeholderTextColor={colors.textSecondary}
                    value={editFormData.remarks}
                    onChangeText={(text) => setEditFormData(prev => ({ ...prev, remarks: text }))}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Items List (editable) */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Items</Text>
                  {editItems.map((item, index) => (
                    <View key={index} style={[styles.reviewItemCard, { backgroundColor: colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md }]}> 
                      <Text style={styles.detailItemName}>{item.item_name}</Text>
                      <Text style={styles.detailItemCode}>{item.item_code}</Text>
                      
                      <View style={[styles.formRow, { marginTop: Spacing.sm }]}>
                        <View style={[styles.formGroup, { flex: 1, marginBottom: 0 }]}>
                          <Text style={styles.formLabel}>Qty</Text>
                          <TextInput
                            style={[styles.formInput, { paddingVertical: Spacing.sm }]}
                            value={String(item.quantity)}
                            onChangeText={(text) => updateEditItemQuantity(index, text)}
                            keyboardType="number-pad"
                          />
                        </View>
                        <View style={[styles.formGroup, { flex: 1, marginBottom: 0 }]}>
                          <Text style={styles.formLabel}>Unit</Text>
                          <TextInput
                            style={[styles.formInput, { paddingVertical: Spacing.sm }]}
                            value={item.unit}
                            editable={false}
                          />
                        </View>
                      </View>

                      {Array.isArray((item as any).rejection_remarks) && (item as any).rejection_remarks.length > 0 && (
                        <View style={[styles.detailSection, { backgroundColor: '#FFEBEE', padding: Spacing.md, borderRadius: BorderRadius.md, borderLeftWidth: 4, borderLeftColor: '#F44336', marginTop: Spacing.sm, marginBottom: 0 }]}> 
                          <Text style={[styles.detailLabel, { color: '#F44336' }]}>Item Remark(s)</Text>
                          {(item as any).rejection_remarks.map((r: any, i: number) => (
                            <Text key={i} style={[styles.detailValue, { color: '#D32F2F', marginTop: i === 0 ? 0 : 6 }]}> 
                              {r.remark}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                {/* Rejection Reason Display */}
                {editPRDetails?.rejection_reason && (
                  <View style={[styles.detailSection, { backgroundColor: '#FFEBEE', padding: Spacing.md, borderRadius: BorderRadius.md, borderLeftWidth: 4, borderLeftColor: '#F44336' }]}>
                    <Text style={[styles.detailLabel, { color: '#F44336' }]}>Rejection Reason</Text>
                    <Text style={[styles.detailValue, { color: '#D32F2F' }]}>{editPRDetails.rejection_reason}</Text>
                  </View>
                )}
              </ScrollView>
            )}

            {/* Modal Actions */}
            {!isLoadingEditDetails && (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowEditPRModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                  onPress={handleResubmitPR}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Resubmit PR</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const createStyles = (colors: (typeof Colors)[keyof typeof Colors], borderLight: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    menuButton: {
      padding: Spacing.xs,
    },
    headerTitle: {
      ...Typography.h3,
      color: colors.text,
      fontWeight: '600',
    },
    iconButton: {
      padding: Spacing.xs,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#D4A853',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    tabContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      gap: Spacing.sm,
    },
    tab: {
      width: '48%',
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.surface,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: colors.tint,
    },
    tabText: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '500',
    },
    tabTextActive: {
      color: colors.buttonPrimaryText,
      fontWeight: '600',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      paddingHorizontal: Spacing.md,
    },
    searchIcon: {
      marginRight: Spacing.sm,
    },
    searchInput: {
      flex: 1,
      paddingVertical: Spacing.md,
      color: colors.text,
      fontSize: Typography.body.fontSize,
    },
    categoryDropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.inputBackground,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    categoryDropdownText: {
      ...Typography.body,
      color: colors.text,
    },
    prButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F5D78E',
      borderRadius: BorderRadius.lg,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      paddingVertical: Spacing.md,
      gap: Spacing.sm,
    },
    prButtonActive: {
      backgroundColor: '#D4A853',
    },
    prButtonText: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    prButtonTextActive: {
      color: '#fff',
    },
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    itemsList: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.xxl,
    },
    itemRow: {
      justifyContent: 'space-between',
      gap: Spacing.md,
    },
    itemCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      minWidth: '47%',
    },
    itemCardSelected: {
      borderColor: '#D4A853',
      backgroundColor: '#FFFBF0',
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    itemCode: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontSize: 12,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxSelected: {
      backgroundColor: '#D4A853',
      borderColor: '#D4A853',
    },
    itemName: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    itemDescription: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    itemFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    categoryBadge: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    categoryBadgeText: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontSize: 11,
    },
    unitText: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontSize: 12,
    },
    quantityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.sm,
      gap: Spacing.sm,
    },
    quantityLabel: {
      ...Typography.caption,
      color: '#000',
    },
    itemCodeSelected: {
      ...Typography.caption,
      color: '#000',
      fontSize: 12,
    },
    itemNameSelected: {
      ...Typography.body,
      color: '#000',
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    itemDescriptionSelected: {
      ...Typography.caption,
      color: '#333',
      marginBottom: Spacing.sm,
    },
    categoryBadgeSelected: {
      backgroundColor: '#E8DCC8',
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    categoryBadgeTextSelected: {
      ...Typography.caption,
      color: '#000',
      fontSize: 11,
    },
    unitTextSelected: {
      ...Typography.caption,
      color: '#000',
      fontSize: 12,
    },
    quantityInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      width: 50,
      textAlign: 'center',
      color: colors.text,
      backgroundColor: colors.inputBackground,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing.xxl,
    },
    emptyText: {
      ...Typography.body,
      color: colors.textSecondary,
      marginTop: Spacing.md,
    },
    // PR List styles
    prList: {
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.xxl,
    },
    prCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    prHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.sm,
    },
    prNumber: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '700',
      flex: 1,
    },
    statusBadge: {
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    statusText: {
      ...Typography.caption,
      color: '#fff',
      fontSize: 10,
      fontWeight: '600',
    },
    statusBadgeText: {
      ...Typography.caption,
      color: '#fff',
      fontSize: 10,
      fontWeight: '600',
    },
    prPurpose: {
      ...Typography.body,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    prFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    prDate: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    prAmount: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '700',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: colors.card,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      maxHeight: '90%',
      padding: Spacing.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      ...Typography.h3,
      color: colors.text,
      fontWeight: '700',
    },
    formGroup: {
      marginBottom: Spacing.md,
    },
    formRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    formLabel: {
      ...Typography.caption,
      color: colors.text,
      marginBottom: Spacing.xs,
      fontWeight: '500',
    },
    formInput: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      color: colors.text,
      backgroundColor: colors.inputBackground,
      fontSize: Typography.body.fontSize,
    },
    textArea: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    selectedItemsList: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
    },
    selectedItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    selectedItemInfo: {
      flex: 1,
    },
    selectedItemName: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '500',
    },
    selectedItemCode: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    selectedItemQty: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: Spacing.md,
      marginTop: Spacing.lg,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cancelButton: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.surface,
    },
    cancelButtonText: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '500',
    },
    submitButton: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.md,
      backgroundColor: '#D4A853',
    },
    submitButtonDisabled: {
      backgroundColor: colors.textDisabled,
    },
    submitButtonText: {
      ...Typography.body,
      color: '#fff',
      fontWeight: '600',
    },
    // Date Picker & Dropdown styles
    datePickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: colors.inputBackground,
    },
    datePickerText: {
      ...Typography.body,
      color: colors.text,
    },
    datePickerPlaceholder: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    dropdownButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: colors.inputBackground,
    },
    dropdownButtonText: {
      ...Typography.body,
      color: colors.text,
    },
    dropdownPlaceholder: {
      ...Typography.body,
      color: colors.textSecondary,
    },
    // Category Dropdown Modal
    categoryModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    categoryDropdownCard: {
      backgroundColor: colors.card,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      maxHeight: '70%',
      padding: Spacing.lg,
    },
    categoryModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    categoryModalTitle: {
      ...Typography.h3,
      color: colors.text,
      fontWeight: '700',
    },
    categoryDropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    categoryDropdownItemText: {
      ...Typography.body,
      color: colors.text,
      flex: 1,
    },
    // Project Dropdown Modal styles
    dropdownCard: {
      backgroundColor: colors.card,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      maxHeight: '70%',
      padding: Spacing.lg,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      minHeight: 60,
      backgroundColor: colors.card,
    },
    dropdownItemText: {
      ...Typography.body,
      color: colors.text,
      flex: 1,
    },
    // Super Admin styles
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.md,
    },
    infoCardTitle: {
      ...Typography.h3,
      color: colors.text,
      fontWeight: '700',
      marginBottom: Spacing.xs,
    },
    infoCardSubtitle: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    approvalCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.md,
    },
    approvalCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing.sm,
    },
    approvalCardId: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '700',
    },
    approvalCardPurpose: {
      ...Typography.body,
      color: colors.text,
      marginTop: Spacing.xs,
    },
    approvalCardRequester: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    approvalCardBadge: {
      backgroundColor: '#FFC107',
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    approvalCardBadgeText: {
      ...Typography.caption,
      color: '#000',
      fontSize: 10,
      fontWeight: '600',
    },
    approvalCardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.sm,
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    approvalCardDate: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    approvalButtons: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    approvalButton: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editResubmitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#D4A853',
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      minHeight: 36,
      maxWidth: 160,
    },
    editResubmitButtonText: {
      ...Typography.caption,
      color: '#fff',
      marginLeft: Spacing.xs,
      fontWeight: '600',
    },
    approveButton: {
      backgroundColor: '#4CAF50',
    },
    rejectButton: {
      backgroundColor: '#F44336',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#D4A853',
      borderRadius: BorderRadius.md,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      paddingVertical: Spacing.md,
      gap: Spacing.sm,
    },
    addButtonText: {
      ...Typography.body,
      color: '#fff',
      fontWeight: '600',
    },
    employeeCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    employeeCardContent: {
      flex: 1,
    },
    employeeCode: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontSize: 12,
    },
    employeeName: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
      marginTop: Spacing.xs,
    },
    employeeBadges: {
      flexDirection: 'row',
      gap: Spacing.xs,
      marginTop: Spacing.xs,
    },
    roleBadge: {
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    roleBadgeText: {
      ...Typography.caption,
      color: '#fff',
      fontSize: 10,
      fontWeight: '600',
    },
    employeeDept: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    employeeActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    employeeActionButton: {
      padding: Spacing.xs,
    },
    waitingBadge: {
      backgroundColor: '#6C757D',
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
    },
    waitingBadgeText: {
      ...Typography.caption,
      color: '#fff',
      fontSize: 10,
      fontWeight: '600',
    },
    // PR Detail Modal styles
    detailSection: {
      marginBottom: Spacing.md,
    },
    detailLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
      fontWeight: '500',
    },
    detailValue: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    detailAmount: {
      ...Typography.h3,
      color: '#D4A853',
      fontWeight: '700',
    },
    detailItemsList: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginTop: Spacing.sm,
    },
    detailItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    detailItemInfo: {
      flex: 1,
    },
    detailItemName: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '500',
    },
    detailItemCode: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    detailItemQty: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    approvalButtonText: {
      ...Typography.body,
      color: '#fff',
      fontWeight: '600',
      marginLeft: Spacing.sm,
    },
    detailModalButton: {
      height: 48,
      borderRadius: BorderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Procurement Review styles
    reviewItemCard: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemTotalText: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    supplierAddress: {
      ...Typography.caption,
    },
    inlineDropdown: {
      marginTop: Spacing.sm,
      borderWidth: 1,
      borderRadius: BorderRadius.md,
      maxHeight: 200,
    },
    inlineDropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      minHeight: 60,
    },
    // Notification badge styles
    notificationBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: '#F44336',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    notificationBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: 'bold',
    },
  });

export default ProcurementScreen;
