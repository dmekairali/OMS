import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/NewOrders.module.css';
import EditOrderForm from '../components/EditOrderForm';

// Non-editable display fields for order cards
const DISPLAY_FIELDS = [
  { name: 'Oder ID', type: 'text' },
  { name: 'Order Status', type: 'status' },
  { name: 'Name of Client', type: 'text' },
  { name: 'Client Type', type: 'text' },
  { name: 'Mobile', type: 'text' },
  { name: 'Email', type: 'text' },
  { name: 'Invoice Amount', type: 'currency' },
  { name: 'Dispatch Party From*', type: 'text' },
  { name: 'Remarks*', type: 'text' },
];

// All non-editable fields for detail view
const NON_EDITABLE_FIELDS = [
  { name: 'Timestamp', type: 'datetime' },
  { name: 'Buyer ID', type: 'text' },
  { name: 'Oder ID', type: 'text' },
  { name: 'Name of Client', type: 'text' },
  { name: 'Mobile', type: 'text' },
  { name: 'Email', type: 'text' },
  { name: 'Client Category', type: 'text' },
  { name: 'Client Type', type: 'text' },
  { name: 'Billing Address', type: 'text' },
  { name: 'Shipping Address', type: 'text' },
  { name: 'Pin code', type: 'text' },
  { name: 'Invoice Amount', type: 'currency' },
  { name: 'Order Taken By', type: 'text' },
  { name: 'Delivery Required Date', type: 'date' },
  { name: 'Delivery Party From', type: 'text' },
  { name: 'Payment Terms', type: 'text' },
  { name: 'Payment Date (to be paid)', type: 'date' },
  { name: 'Preffered Call time', type: 'text' },
  { name: 'Discount %', type: 'text' },
  { name: 'Planned', type: 'datetime' },
  { name: 'Actual', type: 'datetime' },
  { name: 'POB No*', type: 'text' },
  { name: 'POB URL*', type: 'url' },
  { name: 'Doer Name', type: 'text' },
  { name: 'CAPA Link', type: 'url' },
  { name: 'Feedback Collection Link', type: 'url' },
  { name: 'Order Status', type: 'status' },
  { name: 'Dispatch Party From*', type: 'text' },
  { name: 'Remarks*', type: 'text' },
];

// Order Status options - UPDATED with Edit Order options
const ORDER_STATUS_OPTIONS = [
  'Order Confirmed',
  'Cancel Order',
  'False Order',
  'Hold',
  'Stock Transfer',
  'Edit Order',
  'Edit and Split',
];

// Status categories for filtering - UPDATED
const STATUS_CATEGORIES = [
  { value: 'All', label: 'All', icon: '📋' },
  { value: 'Pending', label: 'Pending', icon: '⏳' },
  { value: 'Order Confirmed', label: 'Confirmed', icon: '✅' },
  { value: 'Cancel Order', label: 'Cancelled', icon: '❌' },
  { value: 'False Order', label: 'False', icon: '⚠️' },
  { value: 'Hold', label: 'On Hold', icon: '⏸️' },
  { value: 'Stock Transfer', label: 'Transfer', icon: '🔄' },
  { value: 'Edit Order', label: 'Edit', icon: '✏️' },
  { value: 'Edit and Split', label: 'Split', icon: '✂️' },
];

// Dispatch Party options
const DISPATCH_PARTY_OPTIONS = [
  'Kairali Ayurvedic Products-642001-Stockist-1234567890',
  'Mumbai Warehouse-400001-Main-9876543210',
  'Delhi Distribution-110001-Branch-8765432109',
  'Chennai Hub-600001-Regional-7654321098',
  'Bangalore Center-560001-Main-6543210987'
];

// Payment Confirmation Type options
const PAYMENT_TYPE_OPTIONS = [
  'UPI',
  'Cash',
  'Card',
  'Net Banking',
  'Cheque',
  'COD',
  'Credit'
];

// Action field configurations based on Order Status
const ACTION_FIELDS = {
  'Order Confirmed': [
    { name: 'Order Status', type: 'dropdown', defaultValue: 'Order Confirmed', readOnly: true, required: true, options: ORDER_STATUS_OPTIONS, columnNumber: 45 },
    { name: 'Dispatch Party From*', type: 'dropdown', required: true, options: DISPATCH_PARTY_OPTIONS, columnNumber: 46 },
    { name: 'Remarks*', type: 'textarea', required: true, fullWidth: true, columnNumber: 47 },
    { name: 'Inform to Client by call', type: 'checkbox', columnNumber: 48 },
    { name: 'Inform to Dispatch Party From by call', type: 'checkbox', columnNumber: 49 },
    { name: 'Payment Date', type: 'date', columnNumber: 51 },
    { name: 'Payment Confirmation Type', type: 'dropdown', options: PAYMENT_TYPE_OPTIONS, columnNumber: 52 },
    { name: 'Expected Date and time of the Dispatch', type: 'datetime-local', columnNumber: 53 },
    { name: 'Enter Actual Invoice Amount of Dispatch Party', type: 'number', step: '0.01', columnNumber: 74 },
  ],
  'Cancel Order': [
    { name: 'Order Status', type: 'dropdown', defaultValue: 'Cancel Order', readOnly: true, required: true, options: ORDER_STATUS_OPTIONS, columnNumber: 45 },
    { name: 'Remarks*', type: 'textarea', required: true, fullWidth: true, columnNumber: 47 },
    { name: 'Is order in full-Yes/No', type: 'dropdown', options: ['Yes', 'No'], columnNumber: 54 },
    { name: 'Reason(If No)', type: 'textarea', fullWidth: true, columnNumber: 55 },
    { name: 'Inform to Client by call', type: 'checkbox', columnNumber: 48 },
    { name: 'Inform to Dispatch Party From by call', type: 'checkbox', columnNumber: 49 },
  ],
  'False Order': [
    { name: 'Order Status', type: 'dropdown', defaultValue: 'False Order', readOnly: true, required: true, options: ORDER_STATUS_OPTIONS, columnNumber: 45 },
    { name: 'Remarks*', type: 'textarea', required: true, fullWidth: true, columnNumber: 47 },
    { name: 'Is order in full-Yes/No', type: 'dropdown', options: ['Yes', 'No'], columnNumber: 54 },
    { name: 'Reason(If No)', type: 'textarea', fullWidth: true, columnNumber: 55 },
    { name: 'Inform to Client by call', type: 'checkbox', columnNumber: 48 },
    { name: 'Inform to Dispatch Party From by call', type: 'checkbox', columnNumber: 49 },
  ],
  'Hold': [
    { name: 'Order Status', type: 'dropdown', defaultValue: 'Hold', readOnly: true, required: true, options: ORDER_STATUS_OPTIONS, columnNumber: 45 },
    { name: 'Remarks*', type: 'textarea', required: true, fullWidth: true, columnNumber: 47 },
  ],
  'Stock Transfer': [
    { name: 'Order Status', type: 'dropdown', defaultValue: 'Stock Transfer', readOnly: true, required: true, options: ORDER_STATUS_OPTIONS, columnNumber: 45 },
    { name: 'Dispatch Party From*', type: 'dropdown', required: true, options: DISPATCH_PARTY_OPTIONS, columnNumber: 46 },
    { name: 'Remarks*', type: 'textarea', required: true, fullWidth: true, columnNumber: 47 },
    { name: 'Inform to Client by call', type: 'checkbox', columnNumber: 48 },
    { name: 'Inform to Dispatch Party From by call', type: 'checkbox', columnNumber: 49 },
    { name: 'Payment Date', type: 'date', columnNumber: 51 },
    { name: 'Payment Confirmation Type', type: 'dropdown', options: PAYMENT_TYPE_OPTIONS, columnNumber: 52 },
    { name: 'Expected Date and time of the Dispatch', type: 'datetime-local', columnNumber: 53 },
    { name: 'Enter Actual Invoice Amount of Dispatch Party', type: 'number', step: '0.01', columnNumber: 74 },
  ],
};

export default function NewOrders() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [newOrderIds, setNewOrderIds] = useState(new Set());
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showUpdateSummary, setShowUpdateSummary] = useState(false);
  const [updateSummaryData, setUpdateSummaryData] = useState(null);
  const pollingIntervalRef = useRef(null);
  
  // NEW: Edit Order states
  const [showEditView, setShowEditView] = useState(false);
  const [editOrderData, setEditOrderData] = useState(null);
  const [editProducts, setEditProducts] = useState([]);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [editRemark, setEditRemark] = useState('');
  const [editMode, setEditMode] = useState('');

  useEffect(() => {
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(userSession);
      
      if (!userData.moduleAccess) {
        console.log('Invalid session detected, clearing...');
        localStorage.removeItem('userSession');
        router.push('/login');
        return;
      }
      
      if (!userData.moduleAccess?.newOrders) {
        alert('You do not have access to New Orders module');
        router.push('/dashboard');
        return;
      }

      setUser(userData);
      loadOrders(true);
      
      pollingIntervalRef.current = setInterval(() => {
        loadOrders(false);
      }, 300000);
    } catch (error) {
      console.error('Error parsing user session:', error);
      localStorage.removeItem('userSession');
      router.push('/login');
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [router]);

  const loadOrders = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        let ordersList = data.orders || [];
        
        ordersList = ordersList.reverse();
        
        if (orders.length > 0 && !showLoading) {
          const existingOrderIds = new Set(orders.map(o => o['Oder ID']));
          const newOrders = ordersList.filter(o => !existingOrderIds.has(o['Oder ID']));
          
          if (newOrders.length > 0) {
            const newIds = new Set(newOrders.map(o => o['Oder ID']));
            setNewOrderIds(prev => new Set([...prev, ...newIds]));
            
            const mergedOrders = [...newOrders, ...orders];
            setOrders(mergedOrders);
            setLastUpdated(new Date());
            filterOrders(mergedOrders, activeFilter, searchTerm);
          } else {
            setLastUpdated(new Date());
          }
        } else {
          setOrders(ordersList);
          setLastUpdated(new Date());
          filterOrders(ordersList, activeFilter, searchTerm);
        }
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const filterOrders = (ordersList, statusFilter, search) => {
    let filtered = [...ordersList];

    if (statusFilter !== 'All') {
      if (statusFilter === 'Pending') {
        filtered = filtered.filter(order => 
          !order['Order Status'] || order['Order Status'].trim() === ''
        );
      } else {
        filtered = filtered.filter(order => order['Order Status'] === statusFilter);
      }
    }

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(order => {
        return DISPLAY_FIELDS.some(field => {
          const value = order[field.name];
          return value && value.toString().toLowerCase().includes(term);
        });
      });
    }

    setFilteredOrders(filtered);
  };

  useEffect(() => {
    filterOrders(orders, activeFilter, searchTerm);
  }, [orders, activeFilter, searchTerm]);

  const handleFilterChange = (filterValue) => {
    setActiveFilter(filterValue);
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowDetailView(true);
    setSelectedStatus('');
    setShowEditView(false);
    setEditRemark('');
    
    if (newOrderIds.has(order['Oder ID'])) {
      setNewOrderIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(order['Oder ID']);
        return newSet;
      });
    }
    
    closeSidebar();
  };

  const handleBackToDashboard = () => {
    setSelectedOrder(null);
    setShowDetailView(false);
    setSelectedStatus('');
    setShowEditView(false);
    setEditRemark('');
    loadOrders(false);
  };

  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
    setShowEditView(false);
    if (status !== 'Edit Order' && status !== 'Edit and Split') {
      setEditRemark('');
    }
  };

  // NEW: Handle Edit Order button click
  const handleEditOrderClick = async (mode) => {
    if (!editRemark || editRemark.trim() === '') {
      alert('Please enter remarks before editing');
      return;
    }

    setLoadingEdit(true);
    setEditMode(mode);

    try {
      const response = await fetch(`/api/orders/load-edit?orderId=${selectedOrder['Oder ID']}`);
      
      if (response.ok) {
        const data = await response.json();
        setEditOrderData(data.order);
        setEditProducts(data.products || []);
        setShowEditView(true);
      } else {
        alert('Failed to load order details');
      }
    } catch (error) {
      console.error('Error loading edit data:', error);
      alert('Error loading order data');
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleCancelEdit = () => {
  setShowEditView(false);
  setEditRemark('');
  setSelectedStatus('');
};

  const handleSaveEditOrder = async (formData) => {
  // Send to /api/orders/save-edit with doPost format
}

  // NEW: Handle product quantity change
  const handleProductQtyChange = (productIndex, newQty) => {
    const updatedProducts = [...editProducts];
    const product = updatedProducts[productIndex];
    const originalQty = parseFloat(product['Quantity'] || product['QNT'] || 0);
    
    updatedProducts[productIndex] = {
      ...product,
      'New Quantity': newQty,
      'Split Quantity': editMode === 'split' ? originalQty - newQty : 0
    };
    
    setEditProducts(updatedProducts);
  };

  // NEW: Save edited order
  const handleSaveEditedOrder = async () => {
    try {
      setLoadingEdit(true);

      const saveData = {
        orderId: selectedOrder['Oder ID'],
        rowIndex: selectedOrder._rowIndex,
        editStatus: editMode === 'split' ? 'Edit and Split' : 'Edit Order',
        remarks: editRemark,
        username: user.username,
        products: editProducts,
        editMode: editMode
      };

      const response = await fetch('/api/orders/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      if (response.ok) {
        const result = await response.json();
        
        alert(`Order ${editMode === 'split' ? 'split' : 'edited'} successfully!\n\nNote: Status and remarks updated in NewOrders sheet. Product changes saved for processing.`);
        
        const updatedOrders = orders.map(order => {
          if (order['Oder ID'] === selectedOrder['Oder ID']) {
            return {
              ...order,
              'Order Status': result.updatedFields['Order Status'],
              'Remarks*': result.updatedFields['Remarks*'],
              'Last Edited By': result.updatedFields['Last Edited By'],
              'Last Edited At': result.updatedFields['Last Edited At']
            };
          }
          return order;
        });
        
        setOrders(updatedOrders);
        setShowEditView(false);
        setEditRemark('');
        handleBackToDashboard();
        
        setTimeout(() => {
          loadOrders(false);
        }, 500);
      } else {
        const error = await response.json();
        alert('Failed to update order: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving edited order:', error);
      alert('Error saving changes');
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const updates = {};
    const columnUpdates = {};
    
    const fieldConfigs = ACTION_FIELDS[selectedStatus] || [];
    
    for (let [key, value] of formData.entries()) {
      const fieldConfig = fieldConfigs.find(f => f.name === key);
      
      if (e.target.elements[key].type === 'checkbox') {
        updates[key] = e.target.elements[key].checked ? 'TRUE' : 'FALSE';
      } else {
        updates[key] = value;
      }
      
      if (fieldConfig && fieldConfig.columnNumber) {
        columnUpdates[fieldConfig.columnNumber] = updates[key];
      }
    }
    
    const orderStatusField = fieldConfigs.find(f => f.name === 'Order Status');
    if (orderStatusField) {
      const orderStatusValue = orderStatusField.defaultValue || selectedStatus;
      updates['Order Status'] = orderStatusValue;
      if (orderStatusField.columnNumber) {
        columnUpdates[orderStatusField.columnNumber] = orderStatusValue;
      }
    }

    updates['Last Edited By'] = user.username;
    updates['Last Edited At'] = new Date().toISOString();
    columnUpdates[78] = user.username;
    columnUpdates[79] = new Date().toISOString();

    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: selectedOrder['Oder ID'],
          rowIndex: selectedOrder._rowIndex,
          updates: updates,
          columnUpdates: columnUpdates
        }),
      });

      if (response.ok) {
        const updatedOrders = orders.map(order => {
          if (order['Oder ID'] === selectedOrder['Oder ID']) {
            return { ...order, ...updates };
          }
          return order;
        });
        
        setOrders(updatedOrders);
        
        const newStatus = updates['Order Status'];
        let targetFilter = 'All';
        
        if (newStatus && newStatus.trim() !== '') {
          targetFilter = newStatus;
        } else {
          targetFilter = 'Pending';
        }
        
        setActiveFilter(targetFilter);
        filterOrders(updatedOrders, targetFilter, searchTerm);
        
        const summary = {
          orderId: selectedOrder['Oder ID'],
          status: selectedStatus,
          newFilter: targetFilter,
          fields: Object.keys(updates).filter(key => key !== 'Last Edited By' && key !== 'Last Edited At'),
          updates: updates,
          timestamp: new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        };
        
        setUpdateSummaryData(summary);
        setShowUpdateSummary(true);
        
        setTimeout(() => {
          setShowUpdateSummary(false);
          handleBackToDashboard();
        }, 5000);
        
        setTimeout(() => {
          loadOrders(false);
        }, 1000);
      } else {
        const errorData = await response.json();
        alert('Failed to update order: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    router.push('/login');
  };

  const navigateToModule = (module) => {
    const routes = {
      dashboard: '/dashboard',
      dispatch: '/dispatch',
      delivery: '/delivery',
      payment: '/payment'
    };
    
    if (routes[module]) {
      router.push(routes[module]);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const parseSheetDate = (dateValue) => {
    if (!dateValue || dateValue === '' || dateValue === ' ') return null;
    
    try {
      const value = dateValue.toString().trim();
      
      if (value.includes('/')) {
        const parts = value.split(' ');
        const datePart = parts[0];
        const timePart = parts[1];
        
        const datePieces = datePart.split('/');
        if (datePieces.length === 3) {
          const day = parseInt(datePieces[0]);
          const month = parseInt(datePieces[1]) - 1;
          const year = parseInt(datePieces[2]);
          
          if (timePart) {
            const timePieces = timePart.split(':');
            const hours = parseInt(timePieces[0]);
            const minutes = parseInt(timePieces[1]);
            const seconds = timePieces[2] ? parseInt(timePieces[2]) : 0;
            
            return new Date(year, month, day, hours, minutes, seconds);
          } else {
            return new Date(year, month, day);
          }
        }
      }
      
      if (value.includes('-')) {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
      
      if (!isNaN(value)) {
        const excelEpoch = new Date(1899, 11, 30);
        const msPerDay = 86400000;
        return new Date(excelEpoch.getTime() + (parseFloat(value) * msPerDay));
      }
      
      return null;
    } catch (e) {
      console.error('Date parsing error:', e, 'Value:', dateValue);
      return null;
    }
  };

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'Order Confirmed':
        return '#10b981';
      case 'Cancel Order':
        return '#ef4444';
      case 'False Order':
        return '#f59e0b';
      case 'Hold':
        return '#6366f1';
      case 'Stock Transfer':
        return '#8b5cf6';
      case 'Edit Order':
        return '#3b82f6';
      case 'Edit and Split':
        return '#f97316';
      default:
        return '#64748b';
    }
  };

  const renderField = (field, value, order) => {
    if (!value || value === '' || value === 'undefined' || value === 'null' || value === ' ') {
      return '-';
    }

    switch (field.type) {
      case 'status':
        return (
          <span 
            className={styles.statusBadge} 
            style={{ 
              backgroundColor: getStatusBadgeColor(value),
              color: 'white',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '700',
              display: 'inline-block'
            }}
          >
            {value}
          </span>
        );
        
      case 'currency':
        const amount = parseFloat(value);
        return isNaN(amount) ? '₹0' : `₹${amount.toLocaleString('en-IN')}`;
        
      case 'date':
        const date = parseSheetDate(value);
        if (!date || isNaN(date.getTime())) {
          return '-';
        }
        return date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        
      case 'datetime':
        const datetime = parseSheetDate(value);
        if (!datetime || isNaN(datetime.getTime())) {
          return '-';
        }
        return datetime.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
        
      case 'url':
        return value ? (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{color: '#7a8450', textDecoration: 'underline'}}
            onClick={(e) => e.stopPropagation()}
          >
            View Link
          </a>
        ) : '-';
        
      default:
        return value.toString();
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp || timestamp === '' || timestamp === 'undefined' || timestamp === ' ') {
      return '';
    }
    
    const orderTime = parseSheetDate(timestamp);
    if (!orderTime || isNaN(orderTime.getTime())) {
      return '';
    }
    
    const now = new Date();
    const diffMs = now - orderTime;
    
    if (diffMs < 0) {
      const futureDiffMs = Math.abs(diffMs);
      const futureDays = Math.floor(futureDiffMs / (1000 * 60 * 60 * 24));
      if (futureDays > 0) return `in ${futureDays} day${futureDays > 1 ? 's' : ''}`;
      return 'soon';
    }
    
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  };

  const getLastUpdatedText = () => {
    if (!lastUpdated) return '';
    
    const now = new Date();
    const diffMs = now - lastUpdated;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Updated just now';
    if (diffMins < 60) return `Updated ${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Updated ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Updated ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const isOrderCompleted = (order) => {
    return order['Actual'] && order['Actual'].trim() !== '';
  };

  const getStatusCounts = () => {
    const counts = {};
    STATUS_CATEGORIES.forEach(cat => {
      if (cat.value === 'All') {
        counts[cat.value] = orders.length;
      } else if (cat.value === 'Pending') {
        counts[cat.value] = orders.filter(o => 
          !o['Order Status'] || o['Order Status'].trim() === ''
        ).length;
      } else {
        counts[cat.value] = orders.filter(o => o['Order Status'] === cat.value).length;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  const renderFormField = (field, index) => {
    const isFullWidth = field.fullWidth || field.type === 'textarea';
    
    return (
      <div key={index} className={`${styles.formField} ${isFullWidth ? styles.fullWidth : ''}`}>
        <label>
          {field.name}
          {field.required && <span className={styles.required}>*</span>}
        </label>
        
        {field.type === 'text' && (
          <input
            type="text"
            name={field.name}
            defaultValue={field.defaultValue || ''}
            required={field.required}
            readOnly={field.readOnly}
          />
        )}
        
        {field.type === 'number' && (
          <input
            type="number"
            name={field.name}
            defaultValue={field.defaultValue || ''}
            step={field.step || '1'}
            required={field.required}
            readOnly={field.readOnly}
          />
        )}
        
        {field.type === 'date' && (
          <input
            type="date"
            name={field.name}
            defaultValue={field.defaultValue || ''}
            required={field.required}
            readOnly={field.readOnly}
          />
        )}
        
        {field.type === 'datetime-local' && (
          <input
            type="datetime-local"
            name={field.name}
            defaultValue={field.defaultValue || ''}
            required={field.required}
            readOnly={field.readOnly}
          />
        )}
        
        {field.type === 'dropdown' && field.options && (
          <select
            name={field.name}
            defaultValue={field.defaultValue || ''}
            required={field.required}
            disabled={field.readOnly}
          >
            <option value="">Select {field.name}</option>
            {field.options.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        )}
        
        {field.type === 'textarea' && (
          <textarea
            name={field.name}
            defaultValue={field.defaultValue || ''}
            required={field.required}
            readOnly={field.readOnly}
            rows="3"
          />
        )}
        
        {field.type === 'checkbox' && (
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name={field.name}
              defaultChecked={field.defaultValue === true}
              disabled={field.readOnly}
            />
            <span>{field.name}</span>
          </label>
        )}
      </div>
    );
  };

  // NEW: Render Edit Order View
  const renderEditOrderView = () => {
    if (!editOrderData) return null;

    return (
      <div className={styles.editOrderView}>
        <div className={styles.editHeader}>
          <button onClick={() => setShowEditView(false)} className={styles.backBtn}>
            ← Back
          </button>
          <h2>
            {editMode === 'split' ? '✂️ Edit and Split Order' : '✏️ Edit Order'} - {selectedOrder['Oder ID']}
          </h2>
        </div>

        <div className={styles.detailCard}>
          <div className={`${styles.infoBox} ${styles.infoconfirm}`}>
            <span className={styles.infoIcon}>ℹ️</span>
            <div className={styles.infoText}>
              <p><strong>Current Implementation:</strong></p>
              <ul style={{marginTop: '8px', paddingLeft: '20px'}}>
                <li>✅ Status and remarks updated in NewOrders sheet</li>
                <li>✅ Product quantities can be edited here for review</li>
                <li>⏳ Actual product updates will be saved to separate sheet (implement later)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.detailCard}>
          <h3 className={styles.cardTitle}>📋 Order Summary</h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Order ID</span>
              <span className={styles.detailValue}>{editOrderData['Oder ID']}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Customer Name</span>
              <span className={styles.detailValue}>{editOrderData['Name of Client']}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Mobile</span>
              <span className={styles.detailValue}>{editOrderData['Mobile']}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Current Status</span>
              <span className={styles.detailValue}>{editOrderData['Order Status'] || 'Pending'}</span>
            </div>
          </div>
        </div>

        <div className={styles.detailCard}>
          <h3 className={styles.cardTitle}>
            📦 Products {editMode === 'split' ? '(Adjust quantities to split)' : '(Review and modify)'}
          </h3>
          
          <div className={styles.productsTable}>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead>
                <tr style={{background: '#f9faf7', borderBottom: '2px solid #e5e9d8'}}>
                  <th style={{padding: '12px', textAlign: 'left', width: '35%'}}>Product Name</th>
                  <th style={{padding: '12px', textAlign: 'center', width: '8%'}}>SKU</th>
                  <th style={{padding: '12px', textAlign: 'center', width: '10%'}}>Original Qty</th>
                  <th style={{padding: '12px', textAlign: 'right', width: '10%'}}>Price</th>
                  <th style={{padding: '12px', textAlign: 'center', width: '12%'}}>New Qty</th>
                  {editMode === 'split' && <th style={{padding: '12px', textAlign: 'center', width: '12%'}}>Split Qty</th>}
                  <th style={{padding: '12px', textAlign: 'right', width: '13%'}}>Total</th>
                </tr>
              </thead>
              <tbody>
                {editProducts.length === 0 ? (
                  <tr>
                    <td colSpan={editMode === 'split' ? "7" : "6"} style={{padding: '20px', textAlign: 'center', color: '#7a8450'}}>
                      No products found. SKUWise-Orders sheet may not be set up yet.
                    </td>
                  </tr>
                ) : (
                  editProducts.map((product, idx) => {
                    const originalQty = parseFloat(product['Quantity'] || product['QNT'] || 0);
                    const price = parseFloat(product['MRP'] || product['Price'] || product['Unit Price'] || 0);
                    const newQty = product['New Quantity'] !== undefined ? product['New Quantity'] : originalQty;
                    const splitQty = product['Split Quantity'] || 0;
                    const sku = product['SKU'] || product['Product Code'] || '-';
                    
                    return (
                      <tr key={idx} style={{borderBottom: '1px solid #e5e9d8'}}>
                        <td style={{padding: '12px', fontWeight: 500}}>{product['Product Name'] || product['Product'] || 'Unknown'}</td>
                        <td style={{padding: '12px', textAlign: 'center'}}>{sku}</td>
                        <td style={{padding: '12px', textAlign: 'center'}}>{originalQty}</td>
                        <td style={{padding: '12px', textAlign: 'right'}}>₹{price.toFixed(2)}</td>
                        <td style={{padding: '12px', textAlign: 'center'}}>
                          <input
                            type="number"
                            min="0"
                            max={originalQty}
                            step="1"
                            value={newQty}
                            onChange={(e) => handleProductQtyChange(idx, parseFloat(e.target.value) || 0)}
                            style={{
                              width: '70px',
                              padding: '6px',
                              border: '1px solid #e5e9d8',
                              borderRadius: '4px',
                              textAlign: 'center'
                            }}
                          />
                        </td>
                        {editMode === 'split' && (
                          <td style={{padding: '12px', textAlign: 'center', fontWeight: 600, color: '#f97316'}}>
                            {splitQty}
                          </td>
                        )}
                        <td style={{padding: '12px', textAlign: 'right', fontWeight: 600}}>₹{(newQty * price).toFixed(2)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {editProducts.length > 0 && (
                <tfoot>
                  <tr style={{background: '#f9faf7', borderTop: '2px solid #e5e9d8'}}>
                    <td colSpan={editMode === 'split' ? "6" : "5"} style={{padding: '12px', textAlign: 'right'}}>
                      <strong>Total Amount:</strong>
                    </td>
                    <td style={{padding: '12px', textAlign: 'right'}}>
                      <strong>
                        ₹{editProducts.reduce((sum, p) => {
                          const price = parseFloat(p['MRP'] || p['Price'] || p['Unit Price'] || 0);
                          const qty = p['New Quantity'] !== undefined ? p['New Quantity'] : parseFloat(p['Quantity'] || p['QNT'] || 0);
                          return sum + (qty * price);
                        }, 0).toFixed(2)}
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {editMode === 'split' && editProducts.length > 0 && (
            <div style={{marginTop: '16px'}}>
              <div className={`${styles.infoBox}`} style={{backgroundColor: '#fff3cd', borderColor: '#ffc107'}}>
                <span className={styles.infoIcon}>ℹ️</span>
                <span className={styles.infoText}>
                  Split quantities will be recorded. Adjust "New Qty" to keep in current order.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className={styles.detailCard}>
          <h3 className={styles.cardTitle}>📝 Edit Remarks</h3>
          <div style={{padding: '12px', background: '#f9faf7', borderRadius: '6px', marginTop: '8px'}}>
            <p style={{margin: 0}}>{editRemark}</p>
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => setShowEditView(false)}
            className={styles.btnSecondary}
            disabled={loadingEdit}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveEditedOrder}
            className={styles.btnSuccess}
            disabled={loadingEdit}
          >
            {loadingEdit ? 'Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    );
  };

  if (!user || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const actionFieldsConfig = ACTION_FIELDS[selectedStatus] || [];
  const isCompleted = selectedOrder && isOrderCompleted(selectedOrder);

  return (
    <div className={styles.pageContainer}>
      <button className={styles.menuToggle} onClick={toggleSidebar}>
        ☰
      </button>

      <div 
        className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.show : ''}`}
        onClick={closeSidebar}
      ></div>

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.logoSection}>
          <img 
            src="/kairali-logo.png" 
            alt="Kairali Products" 
            className={styles.logoImage}
          />
        </div>

        <div className={styles.appName}>
          <span className={styles.appIcon}>📦</span>
          <span className={styles.appText}>OrderFlow</span>
        </div>

        <nav className={styles.navMenu}>
          {user.moduleAccess?.dashboard && (
            <div className={styles.navItem} onClick={() => { navigateToModule('dashboard'); closeSidebar(); }}>
              <span className={styles.navIcon}>📊</span>
              <span className={styles.navText}>Dashboard</span>
            </div>
          )}
          
          <div className={`${styles.navItem} ${styles.active}`} onClick={closeSidebar}>
            <span className={styles.navIcon}>📋</span>
            <span className={styles.navText}>New Orders</span>
            {orders.length > 0 && (
              <span className={styles.badge}>{orders.length}</span>
            )}
          </div>
          
          {user.moduleAccess?.dispatch && (
            <div className={styles.navItem} onClick={() => { navigateToModule('dispatch'); closeSidebar(); }}>
              <span className={styles.navIcon}>🚚</span>
              <span className={styles.navText}>Dispatch</span>
            </div>
          )}
          
          {user.moduleAccess?.delivery && (
            <div className={styles.navItem} onClick={() => { navigateToModule('delivery'); closeSidebar(); }}>
              <span className={styles.navIcon}>📦</span>
              <span className={styles.navText}>Delivery</span>
            </div>
          )}
          
          {user.moduleAccess?.payment && (
            <div className={styles.navItem} onClick={() => { navigateToModule('payment'); closeSidebar(); }}>
              <span className={styles.navIcon}>💰</span>
              <span className={styles.navText}>Payment</span>
            </div>
          )}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarWatermark}>
            <span>Design & Developed by</span>
            <strong>Ambuj</strong>
          </div>
        </div>
      </aside>

      <div className={styles.mainContent}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>
            {showDetailView ? (showEditView ? 'Edit Order' : 'Order Details') : 'New Orders'}
          </h1>
          <div className={styles.headerActions}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <button className={styles.notificationBtn}>
              <span>🔔</span>
              <span className={styles.notificationDot}></span>
            </button>
            <div className={styles.userProfile}>
              <div className={styles.userAvatar}>{user.username.charAt(0).toUpperCase()}</div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{user.username}</div>
                <div className={styles.userRole}>{user.role}</div>
              </div>
            </div>
            <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
          </div>
        </header>

        <div className={styles.content}>
          {!showDetailView ? (
            <>
              <div className={styles.statusFilters}>
                {STATUS_CATEGORIES.map((category) => {
                  const count = statusCounts[category.value];
                  if (count === 0 && category.value !== 'All') return null;
                  
                  return (
                    <button
                      key={category.value}
                      className={`${styles.filterPill} ${activeFilter === category.value ? styles.active : ''}`}
                      onClick={() => handleFilterChange(category.value)}
                    >
                      <span className={styles.filterIcon}>{category.icon}</span>
                      <span className={styles.filterLabel}>{category.label}</span>
                      <span className={styles.filterCount}>{count}</span>
                    </button>
                  );
                })}
              </div>

              <div className={styles.sectionHeader}>
                <h2>
                  {activeFilter === 'All' ? '📋 All Orders' : `${STATUS_CATEGORIES.find(c => c.value === activeFilter)?.icon} ${activeFilter}`} ({filteredOrders.length})
                </h2>
                <div className={styles.headerRight}>
                  {lastUpdated && (
                    <span className={styles.lastUpdated}>
                      🕐 {getLastUpdatedText()}
                    </span>
                  )}
                  <button onClick={() => loadOrders(true)} className={styles.refreshBtn}>
                    🔄 Refresh
                  </button>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyIcon}>📦</p>
                  <p className={styles.emptyText}>No orders found</p>
                  <button onClick={() => loadOrders(true)} className={styles.refreshBtn}>Refresh</button>
                </div>
              ) : (
                <div className={styles.ordersList}>
                  {filteredOrders.map((order, index) => {
                    const completed = isOrderCompleted(order);
                    const isNew = newOrderIds.has(order['Oder ID']);
                    
                    return (
                      <div 
                        key={index} 
                        className={`${styles.orderCard} ${completed ? styles.completed : ''}`}
                        onClick={() => handleOrderClick(order)}
                      >
                        <div className={styles.orderCardHeader}>
                          <div className={styles.orderIdContainer}>
                            <span className={styles.orderId}>
                              {order[DISPLAY_FIELDS[0].name]}
                            </span>
                            {isNew && (
                              <span className={styles.newBadge}>NEW</span>
                            )}
                          </div>
                          <span className={styles.orderTime}>
                            🕐 {getTimeAgo(order['Timestamp'])}
                          </span>
                        </div>
                        <div className={styles.orderCardBody}>
                          <div className={styles.orderInfoGrid}>
                            {DISPLAY_FIELDS.slice(1).map((field, idx) => (
                              <div key={idx} className={styles.infoGridItem}>
                                <span className={styles.infoLabel}>{field.name}:</span>
                                <span className={styles.infoValue}>{renderField(field, order[field.name], order)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className={styles.orderCardFooter}>
                          <button className={styles.reviewBtn}>
                            {completed ? 'View Details →' : 'Review Now →'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : showEditView ? 
           (
  <div className={styles.editOrderView}>
    <EditOrderForm
      order={editOrderData}
      products={editProducts}
      onSave={handleSaveEditOrder}
      onCancel={handleCancelEdit}
    />
  </div>
          ) : (
            <div className={styles.detailView}>
              <button onClick={handleBackToDashboard} className={styles.backBtn}>
                ← Back to Orders
              </button>

              {isCompleted && (
                <div className={styles.completedAlert}>
                  <span className={styles.alertIcon}>✅</span>
                  <span className={styles.alertText}>This order has been completed and locked for editing.</span>
                </div>
              )}

              <div className={styles.detailCard}>
                <h3 className={styles.cardTitle}>Order Information</h3>
                <div className={styles.detailGrid}>
                  {NON_EDITABLE_FIELDS.map((field, idx) => (
                    <div key={idx} className={styles.detailItem}>
                      <span className={styles.detailLabel}>{field.name}</span>
                      <span className={styles.detailValue}>
                        {renderField(field, selectedOrder[field.name], selectedOrder)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {!selectedStatus && !isCompleted && (
                <div className={styles.detailCard}>
                  <h3 className={styles.cardTitle}>Select Action</h3>
                  <p className={styles.actionDescription}>Choose an action to update this order:</p>
                  <div className={styles.statusButtonsGrid}>
                    {ORDER_STATUS_OPTIONS.map((status, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleStatusSelect(status)}
                        className={`${styles.statusButton} ${
                          status === 'Order Confirmed' || status === 'Stock Transfer' ? styles.statusSuccess :
                          status === 'Cancel Order' ? styles.statusDanger :
                          status === 'False Order' ? styles.statusWarning :
                          status === 'Hold' ? styles.statusInfo :
                          status === 'Edit Order' || status === 'Edit and Split' ? styles.statusInfo :
                          styles.statusDisabled
                        }`}
                      >
                        {status === 'Order Confirmed' && '✓ '}
                        {status === 'Cancel Order' && '✕ '}
                        {status === 'False Order' && '⚠️ '}
                        {status === 'Hold' && '⏸ '}
                        {status === 'Stock Transfer' && '🔄 '}
                        {status === 'Edit Order' && '✏️ '}
                        {status === 'Edit and Split' && '✂️ '}
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(selectedStatus === 'Edit Order' || selectedStatus === 'Edit and Split') && !isCompleted && (
                <div className={styles.detailCard}>
                  <h3 className={styles.cardTitle}>
                    {selectedStatus === 'Edit and Split' ? '✂️ Edit and Split Order' : '✏️ Edit Order'}
                  </h3>
                  
                  <div className={`${styles.infoBox} ${styles.infoconfirm}`}>
                    <span className={styles.infoIcon}>ℹ️</span>
                    <div className={styles.infoText}>
                      <p>Please provide remarks before editing the order</p>
                      <p style={{fontSize: '12px', marginTop: '8px', opacity: 0.8}}>
                        Note: Status and remarks will be updated. Product edits prepared for separate sheet.
                      </p>
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <div className={`${styles.formField} ${styles.fullWidth}`}>
                      <label>
                        Remarks* <span className={styles.required}>*</span>
                      </label>
                      <textarea
                        value={editRemark}
                        onChange={(e) => setEditRemark(e.target.value)}
                        required
                        rows="3"
                        placeholder="Enter reason for editing this order..."
                      />
                    </div>
                  </div>

                  <div className={styles.formActions}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStatus('');
                        setEditRemark('');
                      }}
                      className={styles.btnSecondary}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditOrderClick(selectedStatus === 'Edit and Split' ? 'split' : 'edit')}
                      className={styles.btnSuccess}
                      disabled={!editRemark || editRemark.trim() === '' || loadingEdit}
                    >
                      {loadingEdit ? 'Loading...' : '✏️ Edit Order Details'}
                    </button>
                  </div>
                </div>
              )}

              {selectedStatus && actionFieldsConfig.length > 0 && !isCompleted && selectedStatus !== 'Edit Order' && selectedStatus !== 'Edit and Split' && (
                <div className={styles.detailCard}>
                  <h3 className={styles.cardTitle}>✏️ Update Order - {selectedStatus}</h3>
                  <div className={`${styles.infoBox} ${
                    selectedStatus === 'Order Confirmed' || selectedStatus === 'Stock Transfer' ? styles.infoconfirm :
                    selectedStatus === 'Cancel Order' ? styles.infocancel :
                    selectedStatus === 'False Order' ? styles.infofalse :
                    styles.infohold
                  }`}>
                    <span className={styles.infoIcon}>
                      {selectedStatus === 'Order Confirmed' || selectedStatus === 'Stock Transfer' ? 'ℹ️' : '⚠️'}
                    </span>
                    <span className={styles.infoText}>
                      {selectedStatus === 'Order Confirmed' && 'Fill in the required information to confirm this order'}
                      {selectedStatus === 'Cancel Order' && 'Please provide cancellation details'}
                      {selectedStatus === 'False Order' && 'Mark this order as false/fraudulent'}
                      {selectedStatus === 'Hold' && 'Put this order on hold'}
                      {selectedStatus === 'Stock Transfer' && 'Process stock transfer for this order'}
                    </span>
                  </div>
                  
                  <form className={styles.editableForm} onSubmit={handleFormSubmit}>
                    <div className={styles.formGrid}>
                      {actionFieldsConfig.map((field, idx) => renderFormField(field, idx))}
                    </div>
                    <div className={styles.formActions}>
                      <button type="button" onClick={() => setSelectedStatus('')} className={styles.btnSecondary}>
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className={
                          selectedStatus === 'Order Confirmed' || selectedStatus === 'Stock Transfer' ? styles.btnSuccess :
                          selectedStatus === 'Cancel Order' ? styles.btnDanger :
                          selectedStatus === 'False Order' ? styles.btnWarning :
                          styles.btnInfo
                        }
                      >
                        {selectedStatus === 'Order Confirmed' && '✓ Confirm Order'}
                        {selectedStatus === 'Cancel Order' && '✕ Cancel Order'}
                        {selectedStatus === 'False Order' && '⚠️ Mark as False Order'}
                        {selectedStatus === 'Hold' && '⏸ Put on Hold'}
                        {selectedStatus === 'Stock Transfer' && '🔄 Process Stock Transfer'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showUpdateSummary && updateSummaryData && (
        <div className={styles.modalOverlay}>
          <div className={styles.updateSummaryModal}>
            <div className={styles.summaryHeader}>
              <div className={styles.summaryIcon}>✓</div>
              <h3>Order Updated Successfully</h3>
            </div>
            
            <div className={styles.summaryBody}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Order ID:</span>
                <span className={styles.summaryValue}>{updateSummaryData.orderId}</span>
              </div>
              
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Status:</span>
                <span className={styles.summaryValue} style={{
                  color: getStatusBadgeColor(updateSummaryData.status),
                  fontWeight: 700
                }}>
                  {updateSummaryData.status}
                </span>
              </div>
              
              {updateSummaryData.newFilter && (
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Moved to:</span>
                  <span className={styles.summaryValue} style={{
                    color: getStatusBadgeColor(updateSummaryData.newFilter),
                    fontWeight: 600
                  }}>
                    {STATUS_CATEGORIES.find(c => c.value === updateSummaryData.newFilter)?.icon} {updateSummaryData.newFilter}
                  </span>
                </div>
              )}
              
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Updated At:</span>
                <span className={styles.summaryValue}>{updateSummaryData.timestamp}</span>
              </div>
              
              <div className={styles.summaryDivider}></div>
              
              <div className={styles.summaryFields}>
                <h4>Updated Fields ({updateSummaryData.fields.length})</h4>
                {updateSummaryData.fields.map((fieldName, idx) => (
                  <div key={idx} className={styles.summaryFieldRow}>
                    <span className={styles.fieldName}>{fieldName}:</span>
                    <span className={styles.fieldValue}>
                      {updateSummaryData.updates[fieldName] === 'TRUE' ? '✓ Yes' : 
                       updateSummaryData.updates[fieldName] === 'FALSE' ? '✗ No' :
                       updateSummaryData.updates[fieldName] || '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className={styles.summaryFooter}>
              <button 
                onClick={() => {
                  setShowUpdateSummary(false);
                  handleBackToDashboard();
                }} 
                className={styles.summaryCloseBtn}
              >
                Close & View in {updateSummaryData.newFilter || 'All Orders'}
              </button>
            </div>
            
            <div className={styles.autoCloseNote}>
              Auto-closing in 5 seconds...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
