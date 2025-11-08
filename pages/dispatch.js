import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import styles from '../styles/Dispatch.module.css';
import EditOrderForm from '../components/EditOrderForm';
import SetupDataService from '../services/SetupDataService';



// Add this after the imports, before DISPLAY_FIELDS
// Payment date validation helper
const validatePaymentDate = (dateString) => {
  if (!dateString) return { valid: true }; // Empty is allowed
  
  const selectedDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  selectedDate.setHours(0, 0, 0, 0);
  
  // Calculate differences in days
  const diffTime = selectedDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Check if date is more than 7 days in the past
  if (diffDays < -7) {
    return { 
      valid: false, 
      message: 'Payment date cannot be more than 7 days in the past' 
    };
  }
  
  // Check if date is more than 45 days in the future
  if (diffDays > 45) {
    return { 
      valid: false, 
      message: 'Payment date cannot be more than 45 days in the future' 
    };
  }
  
  return { valid: true };
};

// Helper to get min and max date for date inputs
const getPaymentDateLimits = () => {
  const today = new Date();
  
  // Min date: 7 days ago
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() - 7);
  
  // Max date: 45 days from today
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 45);
  
  return {
    min: minDate.toISOString().split('T')[0],
    max: maxDate.toISOString().split('T')[0]
  };
};

// Non-editable display fields for order cards
const DISPLAY_FIELDS = [
  { name: 'Oder ID', type: 'text' },
  { name: 'Dispatch Status', type: 'status' },
  { name: 'Name of Client', type: 'text' },
  { name: 'Client Type', type: 'text' },
  { name: 'Client Contact', type: 'text' },
  { name: 'Order Taken By', type: 'text' },
  { name: 'Invoice Amount', type: 'currency' },
  { name: 'Delivery Party From', type: 'text' },
  { name: 'Order Confirmed Doer Remarks', type: 'text' },
  { name: 'PI URL', type: 'url' },
];

// All non-editable fields for detail view
const NON_EDITABLE_FIELDS = [
  { name: 'Timestamp', type: 'datetime' },
  { name: 'Buyer ID', type: 'text' },
  { name: 'Oder ID', type: 'text' },
  { name: 'Name of Client', type: 'text' },
  { name: 'Client Contact', type: 'text' },
  { name: 'Client Type', type: 'text' },
  { name: 'Invoice Amount', type: 'currency' },
  { name: 'PI URL', type: 'url' },
  { name: 'Order Taken By', type: 'text' },
  { name: 'Expected Date and time of the Dispatch', type: 'date' },
  { name: 'Delivery Party Contact No', type: 'text' },
  { name: 'Payment Confirmation Type', type: 'text' },
  { name: 'Planned', type: 'datetime' },
  { name: 'Actual', type: 'datetime' },
  { name: 'Dispatch Status', type: 'status' },
  { name: 'Tracking URL*', type: 'url' },
  { name: 'Dispatch Through *', type: 'text' },
  { name: 'Dispatch Remarks*', type: 'text' },
  { name: 'Cost of Delivery (if any)', type: 'text' },
  { name: 'Actual Delivered Date - To Client', type: 'date' },
  { name: 'Is order in Full-Yes/No *', type: 'text' },
  { name: 'Reason (If No)', type: 'text' },
  { name: 'Remarks', type: 'text' },
  { name: 'CAPA Link', type: 'url' },
  { name: 'Feedback Collection Link', type: 'url' },
];

// Order Status options
const ORDER_STATUS_OPTIONS = [
  'Dispatch Confirmed',
  'Cancel Order',
  'False Order',
  'Hold',
  'Edit Order',
  'Edit and Split',
];

// Status categories for filtering
const STATUS_CATEGORIES = [
  { value: 'All', label: 'All', icon: '📋' },
  { value: 'Pending', label: 'Pending', icon: '⏳' },
  { value: 'Dispatch Confirmed', label: 'Confirmed', icon: '✅' },
  { value: 'Cancel Order', label: 'Cancelled', icon: '❌' },
  { value: 'False Order', label: 'False', icon: '⚠️' },
  { value: 'Hold', label: 'On Hold', icon: '⏸️' },
  { value: 'Edit Order', label: 'Edit', icon: '✏️' },
  { value: 'Edit and Split', label: 'Split', icon: '✂️' },
];

// Dispatch tracking options
const TRACKING_OPTIONS = [
 'MR',
'Runner',
'Own Vehicle',
'Courier',
'Transport',
  'Other'
];

// Action field configurations based on Dispatch Status
const ACTION_FIELDS = {
  'Dispatch Confirmed': [
    { 
      name: 'Dispatch Status', 
      type: 'dropdown', 
      defaultValue: 'Dispatch Confirmed', 
      readOnly: true, 
      required: true, 
      options: ORDER_STATUS_OPTIONS, 
      columnNumber: 22 
    },
    { 
      name: 'Tracking URL*', 
      type: 'dropdown', 
      required: true, 
      options: TRACKING_OPTIONS, 
      columnNumber: 23 
    },
    { 
      name: 'Dispatch Through *', 
      type: 'dropdown', 
      required: true, 
      options: TRACKING_OPTIONS, 
      columnNumber: 27 
    },
    { 
      name: 'Dispatch Remarks*', 
      type: 'textarea', 
      required: true, 
      fullWidth: true, 
      columnNumber: 24 
    },
    { 
      name: 'Tracking information update to Client by call', 
      type: 'checkbox', 
      columnNumber: 25 
    },
    { 
      name: 'Cost of Delivery (if any)', 
      type: 'number', 
      step: '0.01',
      columnNumber: 26 
    },
    { 
      name: 'Actual Delivered Date - To Client', 
      type: 'date', 
      columnNumber: 28 
    },
  ],
  
  'Cancel Order': [
    { 
      name: 'Dispatch Status', 
      type: 'dropdown', 
      defaultValue: 'Cancel Order', 
      readOnly: true, 
      required: true, 
      options: ORDER_STATUS_OPTIONS, 
      columnNumber: 22 
    },
    { 
      name: 'Dispatch Remarks*', 
      type: 'textarea', 
      required: true, 
      fullWidth: true, 
      columnNumber: 24 
    },
    { 
      name: 'Is order in Full-Yes/No *', 
      type: 'dropdown', 
      required: true,
      options: ['Yes', 'No'], 
      columnNumber: 32 
    },
    { 
      name: 'Reason (If No)', 
      type: 'textarea', 
      fullWidth: true,
      columnNumber: 33 
    },
    { 
      name: 'Remarks', 
      type: 'textarea', 
      fullWidth: true,
      columnNumber: 34 
    },
    { 
      name: 'Tracking information update to Client by call', 
      type: 'checkbox', 
      columnNumber: 25 
    },
  ],
  
  'False Order': [
    { 
      name: 'Dispatch Status', 
      type: 'dropdown', 
      defaultValue: 'False Order', 
      readOnly: true, 
      required: true, 
      options: ORDER_STATUS_OPTIONS, 
      columnNumber: 22 
    },
    { 
      name: 'Dispatch Remarks*', 
      type: 'textarea', 
      required: true, 
      fullWidth: true, 
      columnNumber: 24 
    },
    { 
      name: 'Is order in Full-Yes/No *', 
      type: 'dropdown', 
      required: true,
      options: ['Yes', 'No'], 
      columnNumber: 32 
    },
    { 
      name: 'Reason (If No)', 
      type: 'textarea', 
      fullWidth: true,
      columnNumber: 33 
    },
    { 
      name: 'Remarks', 
      type: 'textarea', 
      fullWidth: true,
      columnNumber: 34 
    },
    { 
      name: 'Tracking information update to Client by call', 
      type: 'checkbox', 
      columnNumber: 25 
    },
  ],
  
  'Hold': [
    { 
      name: 'Dispatch Status', 
      type: 'dropdown', 
      defaultValue: 'Hold', 
      readOnly: true, 
      required: true, 
      options: ORDER_STATUS_OPTIONS, 
      columnNumber: 22 
    },
    { 
      name: 'Dispatch Remarks*', 
      type: 'textarea', 
      required: true, 
      fullWidth: true, 
      columnNumber: 24 
    },
  ],
};

// Dispatch Party options
// Dispatch Party options - will be populated from SetupDataService
let DISPATCH_PARTY_OPTIONS = [];

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



// Process delivery parties from distributor list
const processDeliveryParties = (distributorList) => {
  if (!distributorList || !distributorList.rows) {
    return [];
  }
  const partiesMap = new Map();
  distributorList.rows.forEach(row => {
    const partyName = row['Delivery Party Name'];
    const state = row['State'];
    
    if (partyName && partyName.trim() !== '') {
      if (!partiesMap.has(partyName)) {
        partiesMap.set(partyName, state || '');
      }
    }
  });
  return Array.from(partiesMap.entries()).map(([name]) => name);
};

export default function Dispatch() {
  const { data: session, status } = useSession();
  const router = useRouter();
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

  const [clientOrderHistory, setClientOrderHistory] = useState([]);

 // Load dispatch parties from SetupDataService
  useEffect(() => {
    const loadDispatchParties = async () => {
      try {
        const data = await SetupDataService.loadAllData();
        const parties = processDeliveryParties(data.distributorList);
        DISPATCH_PARTY_OPTIONS.length = 0; // Clear array
        DISPATCH_PARTY_OPTIONS.push(...parties); // Add new values
      } catch (error) {
        console.error('Error loading dispatch parties:', error);
      }
    };

    loadDispatchParties();
  }, []);

//--------------------

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (status === 'authenticated') {
      loadOrders(true);
      pollingIntervalRef.current = setInterval(() => {
        loadOrders(false);
      }, 300000);
    }
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [status, router]);

  const loadOrders = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await fetch('/api/dispatch-delivery');
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
  // SAFETY: Filter out null/undefined orders first
  let filtered = ordersList.filter(order => 
    order != null && order['Oder ID'] != null
  );

  if (statusFilter !== 'All') {
    if (statusFilter === 'Pending') {
      filtered = filtered.filter(order => 
        !order['Dispatch Status'] || order['Dispatch Status'].trim() === ''
      );
    } else {
      filtered = filtered.filter(order => order['Dispatch Status'] === statusFilter);
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
    
    // Get client order history from pre-loaded archive data
    const history = SetupDataService.getClientOrderHistory(
      order['Client Contact'], 
      order['Oder ID'],
      3  // Last 3 orders
    );
    
    setClientOrderHistory(history);
    
    console.log('📋 Found order history:', history);

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

  // Render order history section in order detail view
const renderOrderHistory = () => {
  if (!selectedOrder) return null;

  return (
    <div className={styles.detailCard}>
      <div className={styles.cardHeader}>
        <h3>📋 Recent Order History</h3>
        <span className={styles.badge}>
          {clientOrderHistory.length} confirmed order{clientOrderHistory.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      {clientOrderHistory.length > 0 ? (
        <div className={styles.historyList}>
          {clientOrderHistory.map((histOrder, index) => (
            <div key={index} className={styles.historyItem}>
              <div className={styles.historyHeader}>
                <span className={styles.historyNumber}>#{index + 1}</span>
                <span className={styles.historyOrderId}>{histOrder.orderId}</span>
              </div>
              <div className={styles.historyGrid}>
                <div className={styles.historyField}>
                  <span className={styles.historyLabel}>Order Date</span>
                  <span className={styles.historyValue}>
                    {formatDate(histOrder.orderDate)}
                  </span>
                </div>

                    <div className={styles.historyField}>
  <span className={styles.historyLabel}>Invoice Amount</span>
  <span className={`${styles.historyValue} ${styles.amount}`}>
    ₹{parseFloat(histOrder.invoiceAmount || 0).toLocaleString('en-IN')}
    {histOrder.pobUrl && (
      <>
        {' - '}
        <a 
          href={histOrder.pobUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.invoiceLink}
        >
          View Invoice
        </a>
      </>
    )}
  </span>
</div>
      
                <div className={styles.historyField}>
                  <span className={styles.historyLabel}>Order Taken By</span>
                  <span className={styles.historyValue}>
                    {histOrder.orderTakenBy || 'N/A'}
                  </span>
                </div>
                <div className={styles.historyField}>
  <span className={styles.historyLabel}>Dispatch Party</span>
  <span className={styles.historyValue}>
    {histOrder.dispatchPartyFrom 
      ? histOrder.dispatchPartyFrom.split('-')[0].trim() 
      : 'N/A'
    }
  </span>
</div>
                {/* ADDED: Dispatch Status Field */}
                <div className={styles.historyField}>
                  <span className={styles.historyLabel}>Dispatch Status</span>
                  <span className={`${styles.historyValue} ${
                    (!histOrder.dispatchStatus || histOrder.dispatchStatus.trim() === '' || 
                     histOrder.dispatchStatus === 'Dispatch Pending') 
                      ? styles.dispatchPending 
                      : ''
                  }`}>
                    {histOrder.dispatchStatus && histOrder.dispatchStatus.trim() !== '' 
                      ? histOrder.dispatchStatus 
                      : 'Dispatch Pending'
                    }
                  </span>
                </div>
                    
    
                    
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noHistory}>
          <div className={styles.noHistoryIcon}>📭</div>
          <p>No previous confirmed orders found for this client</p>
        </div>
      )}
    </div>
  );
};

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
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
    // ✅ OPTIMIZED: Only fetch products, use existing order data
    const response = await fetch(`/api/orders/purchase-orders?orderId=${selectedOrder['Oder ID']}`);
    
    if (response.ok) {
      const data = await response.json();
      
      // ✅ Use already-loaded order from selectedOrder
      setEditOrderData(selectedOrder);  // No need to fetch again!
      setEditProducts(data.products || []);
      setShowEditView(true);
    } else {
      alert('Failed to load product details');
    }
  } catch (error) {
    console.error('Error loading products:', error);
    alert('Error loading product data');
  } finally {
    setLoadingEdit(false);
  }
};

  const handleCancelEdit = () => {
  setShowEditView(false);
  setEditRemark('');
  setSelectedStatus('');
};

  //edit orders
const handleSaveEditOrder = async (result) => {
  console.log('✅ Edit form saved successfully:', result);
  
  try {
    // Determine the correct status for NewOrders sheet
    const newOrderStatus = editMode === 'split' ? 'Edit and Split' : 'Edit Order';
    
    // Prepare updates for NewOrders Google Sheet
    const updates = {
      'Dispatch Status': newOrderStatus,
      'Dispatch Remarks*': editRemark,
      'Last Edited By': session.user.name,
      'Last Edited At': new Date().toISOString(),
       'Actual': new Date().toISOString()  // 🔥 Set Actual field on client side
    };

    const columnUpdates = {
      22: newOrderStatus,
      25: editRemark,
      65: session.user.name,
      66: new Date().toISOString()
    };

    console.log('🔄 Updating NewOrders sheet with:', { updates, columnUpdates });

    const response = await fetch('/api/dispatch-delivery', {
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
      console.log('✅ NewOrders sheet updated successfully');
      
      // Update local state
      const updatedOrders = orders.map(order => {
        if (order['Oder ID'] === selectedOrder['Oder ID']) {
          return {
            ...order,
            ...updates
          };
        }
        return order;
      });

      setOrders(updatedOrders);
      
      // Show success summary
      const targetFilter = newOrderStatus;
      
      setActiveFilter(targetFilter);
      filterOrders(updatedOrders, targetFilter, searchTerm);

      const summary = {
        orderId: selectedOrder['Oder ID'],
        status: newOrderStatus,
        newFilter: targetFilter,
        fields: Object.keys(updates),
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

      // FIRST: Close the edit view but keep selectedOrder for the summary
      setShowEditView(false);
      setEditRemark('');
      setEditMode('');

      // SECOND: Show the success summary
      setUpdateSummaryData(summary);
      setShowUpdateSummary(true);

      // THIRD: After summary is shown and auto-closes, THEN clear selectedOrder and go back
      setTimeout(() => {
        setShowUpdateSummary(false);
        // NOW clear selectedOrder and go back to dashboard
        setSelectedOrder(null);
        handleBackToDashboard();
      }, 5000);

      // Refresh data after delay
      setTimeout(() => {
        loadOrders(false);
      }, 1000);

    } else {
      const errorData = await response.json();
      console.error('❌ Failed to update NewOrders sheet:', errorData);
      alert('Edit form saved but failed to update order status: ' + (errorData.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('❌ Error updating NewOrders sheet:', error);
    alert('Edit form saved but failed to update order status. Please try again.');
  }
};

//other orders
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
    
    const orderStatusField = fieldConfigs.find(f => f.name === 'Dispatch Status');
    if (orderStatusField) {
      const orderStatusValue = orderStatusField.defaultValue || selectedStatus;
      updates['Dispatch Status'] = orderStatusValue;
      if (orderStatusField.columnNumber) {
        columnUpdates[orderStatusField.columnNumber] = orderStatusValue;
      }
    }

    updates['Last Edited By'] = session.user.name;
    updates['Last Edited At'] = new Date().toISOString();
    columnUpdates[65] = session.user.name;
    columnUpdates[66] = new Date().toISOString();

    try {
      const response = await fetch('/api/dispatch-delivery', {
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
        
        const newStatus = updates['Dispatch Status'];
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
    signOut({ callbackUrl: '/login' });
  };

  const navigateToModule = (module) => {
    const routes = {
      dashboard: '/dashboard',
      neworders: '/neworders',
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
      case 'Dispatch Confirmed':
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
  if (!timestamp || timestamp === '' || timestamp === 'undefined' || timestamp === ' ' || timestamp === null) {
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
          !o['Dispatch Status'] || o['Dispatch Status'].trim() === ''
        ).length;
      } else {
        counts[cat.value] = orders.filter(o => o['Dispatch Status'] === cat.value).length;
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
    defaultValue={
      field.defaultValue === 'invoiceAmount' && selectedOrder 
        ? selectedOrder['Invoice Amount'] 
        : (field.defaultValue || '')
    }
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
    min={field.name === 'Payment Date' ? getPaymentDateLimits().min : undefined}
    max={field.name === 'Payment Date' ? getPaymentDateLimits().max : undefined}
    onChange={(e) => {
      if (field.name === 'Payment Date') {
        const validation = validatePaymentDate(e.target.value);
        if (!validation.valid) {
          alert(validation.message);
          e.target.value = '';
        }
      }
    }}
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

  

  if (status === 'loading' || !session) {
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
          <div className={styles.navItem} onClick={() => { navigateToModule('dashboard'); closeSidebar(); }}>
            <span className={styles.navIcon}>📊</span>
            <span className={styles.navText}>Dashboard</span>
          </div>
            
<div className={styles.navItem} onClick={() => { navigateToModule('neworders'); closeSidebar(); }}>
  <span className={styles.navIcon}>📋</span>
  <span className={styles.navText}>New Orders</span>
</div>


  <div className={`${styles.navItem} ${styles.active}`} onClick={closeSidebar}>
    <span className={styles.navIcon}>🚚</span>
    <span className={styles.navText}>Dispatch</span>
    {orders.length > 0 && (
      <span className={styles.badge}>{orders.length}</span>
    )}
  </div>


          <div className={styles.navItem} onClick={() => { navigateToModule('delivery'); closeSidebar(); }}>
            <span className={styles.navIcon}>📦</span>
            <span className={styles.navText}>Delivery</span>
          </div>
          
          <div className={styles.navItem} onClick={() => { navigateToModule('payment'); closeSidebar(); }}>
            <span className={styles.navIcon}>💰</span>
            <span className={styles.navText}>Payment</span>
          </div>

            <div className={styles.navItem} onClick={() => router.push('/partnership-terms')}>
  <span className={styles.navIcon}>🤝</span>
  <span className={styles.navText}>Partnership & Terms</span>
</div>
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
            {showDetailView ? (showEditView ? 'Edit Order' : 'Order Details') : 'Dispatch Orders'}
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
              <div className={styles.userAvatar}>{session.user.name.charAt(0).toUpperCase()}</div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{session.user.name}</div>
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
                  {activeFilter === 'All' ? '🚚 All Dispatch Orders' : `${STATUS_CATEGORIES.find(c => c.value === activeFilter)?.icon} ${activeFilter}`} ({filteredOrders.length})
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
    onSave={handleSaveEditOrder}  // This should be the FIXED function above
    onCancel={handleCancelEdit}
    editMode={editMode}
    loading={loadingEdit}
  />
</div>
          ) : (
            <div className={styles.detailView}>
              <button onClick={handleBackToDashboard} className={styles.backBtn}>
                ← Back to Orders
              </button>

              
          {/* Render order history right after the back button */}
          {renderOrderHistory()}

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
                          status === 'Dispatch Confirmed' || status === 'Stock Transfer' ? styles.statusSuccess :
                          status === 'Cancel Order' ? styles.statusDanger :
                          status === 'False Order' ? styles.statusWarning :
                          status === 'Hold' ? styles.statusInfo :
                          status === 'Edit Order' || status === 'Edit and Split' ? styles.statusInfo :
                          styles.statusDisabled
                        }`}
                      >
                        {status === 'Dispatch Confirmed' && '✓ '}
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
                    selectedStatus === 'Dispatch Confirmed' || selectedStatus === 'Stock Transfer' ? styles.infoconfirm :
                    selectedStatus === 'Cancel Order' ? styles.infocancel :
                    selectedStatus === 'False Order' ? styles.infofalse :
                    styles.infohold
                  }`}>
                    <span className={styles.infoIcon}>
                      {selectedStatus === 'Dispatch Confirmed' || selectedStatus === 'Stock Transfer' ? 'ℹ️' : '⚠️'}
                    </span>
                    <span className={styles.infoText}>
                      {selectedStatus === 'Dispatch Confirmed' && 'Fill in the required information to confirm this order'}
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
                          selectedStatus === 'Dispatch Confirmed' || selectedStatus === 'Stock Transfer' ? styles.btnSuccess :
                          selectedStatus === 'Cancel Order' ? styles.btnDanger :
                          selectedStatus === 'False Order' ? styles.btnWarning :
                          styles.btnInfo
                        }
                      >
                        {selectedStatus === 'Dispatch Confirmed' && '✓ Confirm Order'}
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
                <h4>Updated Fields ({updateSummaryData.fields?.length || 0})</h4>
                {updateSummaryData.fields?.map((fieldName, idx) => (
                  <div key={idx} className={styles.summaryFieldRow}>
                    <span className={styles.fieldName}>{fieldName}:</span>
                    <span className={styles.fieldValue}>
                      {updateSummaryData.updates?.[fieldName] === 'TRUE' ? '✓ Yes' : 
                       updateSummaryData.updates?.[fieldName] === 'FALSE' ? '✗ No' :
                       updateSummaryData.updates?.[fieldName] || '-'}
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
