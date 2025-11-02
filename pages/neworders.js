import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/NewOrders.module.css';

// Non-editable display fields for order cards
const DISPLAY_FIELDS = [
  { name: 'Oder ID', type: 'text' },
  { name: 'Name of Client', type: 'text' },
  { name: 'Client Type', type: 'text' },
  { name: 'Mobile', type: 'text' },
  { name: 'Invoice Amount', type: 'currency' },
  { name: 'Order Status', type: 'status' },
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
];

// Order Status options
const ORDER_STATUS_OPTIONS = [
  'Order Confirmed',
  'Cancel Order',
  'False Order',
  'Hold',
  'Stock Transfer',
];

// Status categories for filtering
const STATUS_CATEGORIES = [
  { value: 'All', label: 'All', icon: '📋' },
  { value: 'Pending', label: 'Pending', icon: '⏳' },
  { value: 'Order Confirmed', label: 'Confirmed', icon: '✅' },
  { value: 'Cancel Order', label: 'Cancelled', icon: '❌' },
  { value: 'False Order', label: 'False', icon: '⚠️' },
  { value: 'Hold', label: 'On Hold', icon: '⏸️' },
  { value: 'Stock Transfer', label: 'Transfer', icon: '🔄' },
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
    { name: 'Order Status', type: 'dropdown', defaultValue: 'Order Confirmed', readOnly: true, required: true, options: ORDER_STATUS_OPTIONS },
    { name: 'Dispatch Party From', type: 'dropdown', required: true, options: DISPATCH_PARTY_OPTIONS },
    { name: 'Remarks', type: 'textarea', required: true, fullWidth: true },
    { name: 'Inform to Client by call', type: 'checkbox' },
    { name: 'Inform to Dispatch Party From by call', type: 'checkbox' },
    { name: 'Payment Date', type: 'date' },
    { name: 'Payment Confirmation Type', type: 'dropdown', options: PAYMENT_TYPE_OPTIONS },
    { name: 'Expected Date and time of the Dispatch', type: 'datetime-local' },
    { name: 'Enter Actual Invoice Amount of Dispatch Party', type: 'number', step: '0.01' },
  ],
  'Cancel Order': [
    { name: 'Order Status', type: 'dropdown', defaultValue: 'Cancel Order', readOnly: true, required: true, options: ORDER_STATUS_OPTIONS },
    { name: 'Remarks', type: 'textarea', required: true, fullWidth: true },
    { name: 'Is order in full-Yes/No', type: 'dropdown', options: ['Yes', 'No'] },
    { name: 'Reason(If No)', type: 'textarea', fullWidth: true },
    { name: 'Inform to Client by call', type: 'checkbox' },
    { name: 'Inform to Dispatch Party From by call', type: 'checkbox' },
  ],
  'False Order': [
    { name: 'Order Status', type: 'dropdown', defaultValue: 'False Order', readOnly: true, required: true, options: ORDER_STATUS_OPTIONS },
    { name: 'Remarks', type: 'textarea', required: true, fullWidth: true },
    { name: 'Is order in full-Yes/No', type: 'dropdown', options: ['Yes', 'No'] },
    { name: 'Reason(If No)', type: 'textarea', fullWidth: true },
    { name: 'Inform to Client by call', type: 'checkbox' },
    { name: 'Inform to Dispatch Party From by call', type: 'checkbox' },
  ],
  'Hold': [
    { name: 'Order Status', type: 'dropdown', defaultValue: 'Hold', readOnly: true, required: true, options: ORDER_STATUS_OPTIONS },
    { name: 'Remarks', type: 'textarea', required: true, fullWidth: true },
  ],
  'Stock Transfer': [
    { name: 'Order Status', type: 'dropdown', defaultValue: 'Stock Transfer', readOnly: true, required: true, options: ORDER_STATUS_OPTIONS },
    { name: 'Dispatch Party From', type: 'dropdown', required: true, options: DISPATCH_PARTY_OPTIONS },
    { name: 'Remarks', type: 'textarea', required: true, fullWidth: true },
    { name: 'Inform to Client by call', type: 'checkbox' },
    { name: 'Inform to Dispatch Party From by call', type: 'checkbox' },
    { name: 'Payment Date', type: 'date' },
    { name: 'Payment Confirmation Type', type: 'dropdown', options: PAYMENT_TYPE_OPTIONS },
    { name: 'Expected Date and time of the Dispatch', type: 'datetime-local' },
    { name: 'Enter Actual Invoice Amount of Dispatch Party', type: 'number', step: '0.01' },
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
  const pollingIntervalRef = useRef(null);

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
      loadOrders(true); // Initial load with loading state
      
      // Start polling for new orders every 5 minutes (300000ms)
      pollingIntervalRef.current = setInterval(() => {
        loadOrders(false); // Silent updates without loading state
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
        
        // Reverse order so latest is at top
        ordersList = ordersList.reverse();
        
        // If we have existing orders, only add new ones at the top
        if (orders.length > 0 && !showLoading) {
          const existingOrderIds = new Set(orders.map(o => o['Oder ID']));
          const newOrders = ordersList.filter(o => !existingOrderIds.has(o['Oder ID']));
          
          if (newOrders.length > 0) {
            // Add new orders to the top and mark them as new
            const newIds = new Set(newOrders.map(o => o['Oder ID']));
            setNewOrderIds(prev => new Set([...prev, ...newIds]));
            
            // Merge: new orders at top + existing orders
            const mergedOrders = [...newOrders, ...orders];
            setOrders(mergedOrders);
            setLastUpdated(new Date());
            filterOrders(mergedOrders, activeFilter, searchTerm);
          } else {
            // No new orders, just update timestamp
            setLastUpdated(new Date());
          }
        } else {
          // First load or manual refresh - replace all data
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

    // Filter by status
    if (statusFilter !== 'All') {
      if (statusFilter === 'Pending') {
        // Pending means Order Status is blank or null
        filtered = filtered.filter(order => 
          !order['Order Status'] || order['Order Status'].trim() === ''
        );
      } else {
        filtered = filtered.filter(order => order['Order Status'] === statusFilter);
      }
    }

    // Filter by search term
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
    
    // Remove 'new' badge when order is viewed
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
    // Silent reload to ensure fresh data without showing loading
    loadOrders(false);
  };

  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const updates = {};
    
    for (let [key, value] of formData.entries()) {
      if (e.target.elements[key].type === 'checkbox') {
        updates[key] = e.target.elements[key].checked ? 'TRUE' : 'FALSE';
      } else {
        updates[key] = value;
      }
    }

    updates['Last Edited By'] = user.username;
    updates['Last Edited At'] = new Date().toISOString();

    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: selectedOrder['Oder ID'],
          rowIndex: selectedOrder._rowIndex,
          updates: updates
        }),
      });

      if (response.ok) {
        alert('Order updated successfully!');
        await loadOrders(false); // Silent reload without loading state
        handleBackToDashboard();
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
        return '#10b981'; // green
      case 'Cancel Order':
        return '#ef4444'; // red
      case 'False Order':
        return '#f59e0b'; // orange
      case 'Hold':
        return '#6366f1'; // indigo
      case 'Stock Transfer':
        return '#8b5cf6'; // purple
      default:
        return '#64748b'; // gray
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
        // Count orders with blank or null status
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
      {/* Mobile Menu Toggle */}
      <button className={styles.menuToggle} onClick={toggleSidebar}>
        ☰
      </button>

      {/* Sidebar Overlay */}
      <div 
        className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.show : ''}`}
        onClick={closeSidebar}
      ></div>

      {/* Sidebar */}
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

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>
            {showDetailView ? 'Order Details' : 'New Orders'}
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

        {/* Content */}
        <div className={styles.content}>
          {!showDetailView ? (
            <>
              {/* Status Filter Pills */}
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

              {/* Section Header */}
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

              {/* Orders List */}
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
          ) : (
            /* Order Detail View */
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

              {/* Order Details Card - Non Editable Fields */}
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

              {/* Order Status Selection */}
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
                          styles.statusDisabled
                        }`}
                      >
                        {status === 'Order Confirmed' && '✓ '}
                        {status === 'Cancel Order' && '✕ '}
                        {status === 'False Order' && '⚠️ '}
                        {status === 'Hold' && '⏸ '}
                        {status === 'Stock Transfer' && '🔄 '}
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Editable Fields Card */}
              {selectedStatus && actionFieldsConfig.length > 0 && !isCompleted && (
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
    </div>
  );
}
