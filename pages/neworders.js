import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/NewOrders.module.css';

// Non-editable display fields for order cards
const DISPLAY_FIELDS = [
  { name: 'Oder ID', type: 'text' },
  { name: 'Name of Client', type: 'text' },
  { name: 'Mobile', type: 'text' },
  { name: 'Email', type: 'text' },
  { name: 'Invoice Amount', type: 'currency' },
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
  { name: 'POB No', type: 'text' },
  { name: 'POB URL', type: 'url' },
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
  // 'Edit Order', // Disabled for now
  // 'Edit and Split', // Disabled for now
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
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(userSession);
      
      // Check if moduleAccess exists, if not, clear and force re-login
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
      loadOrders();
    } catch (error) {
      console.error('Error parsing user session:', error);
      localStorage.removeItem('userSession');
      router.push('/login');
    }
  }, [router]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        const ordersList = data.orders || [];
        setOrders(ordersList);
        setFilteredOrders(ordersList);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orders.length) {
      setFilteredOrders([]);
      return;
    }

    let filtered = [...orders];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        return DISPLAY_FIELDS.some(field => {
          const value = order[field.name];
          return value && value.toString().toLowerCase().includes(term);
        });
      });
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm]);

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowDetailView(true);
    setSelectedStatus('');
  };

  const handleBackToDashboard = () => {
    setSelectedOrder(null);
    setShowDetailView(false);
    setSelectedStatus('');
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
        await loadOrders();
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

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const now = new Date();
    const orderTime = new Date(timestamp);
    const diffMs = now - orderTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const renderField = (field, value) => {
    switch (field.type) {
      case 'currency':
        return `₹${value || '0'}`;
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '-';
      case 'datetime':
        return value ? new Date(value).toLocaleString() : '-';
      case 'url':
        return value ? <a href={value} target="_blank" rel="noopener noreferrer" style={{color: '#3b82f6', textDecoration: 'underline'}}>View Link</a> : '-';
      default:
        return value || '-';
    }
  };

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

  return (
    <div className={styles.pageContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logoSection}>
          <span className={styles.logoIcon}>📦</span>
          <span className={styles.logoText}>OrderFlow</span>
        </div>

        <nav className={styles.navMenu}>
          {user.moduleAccess?.dashboard && (
            <div className={styles.navItem} onClick={() => navigateToModule('dashboard')}>
              <span className={styles.navIcon}>📊</span>
              <span className={styles.navText}>Dashboard</span>
            </div>
          )}
          
          <div className={`${styles.navItem} ${styles.active}`}>
            <span className={styles.navIcon}>📋</span>
            <span className={styles.navText}>New Orders</span>
            <span className={styles.badge}>{filteredOrders.length}</span>
          </div>
          
          {user.moduleAccess?.dispatch && (
            <div className={styles.navItem} onClick={() => navigateToModule('dispatch')}>
              <span className={styles.navIcon}>🚚</span>
              <span className={styles.navText}>Dispatch</span>
            </div>
          )}
          
          {user.moduleAccess?.delivery && (
            <div className={styles.navItem} onClick={() => navigateToModule('delivery')}>
              <span className={styles.navIcon}>📦</span>
              <span className={styles.navText}>Delivery</span>
            </div>
          )}
          
          {user.moduleAccess?.payment && (
            <div className={styles.navItem} onClick={() => navigateToModule('payment')}>
              <span className={styles.navIcon}>💰</span>
              <span className={styles.navText}>Payment</span>
            </div>
          )}
        </nav>
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
              {/* Section Header */}
              <div className={styles.sectionHeader}>
                <h2>🔍 Pending Review ({filteredOrders.length})</h2>
                <button onClick={loadOrders} className={styles.refreshBtn}>
                  🔄 Refresh
                </button>
              </div>

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyIcon}>📦</p>
                  <p className={styles.emptyText}>No orders found</p>
                  <button onClick={loadOrders} className={styles.refreshBtn}>Refresh</button>
                </div>
              ) : (
                <div className={styles.ordersList}>
                  {filteredOrders.map((order, index) => (
                    <div 
                      key={index} 
                      className={styles.orderCard}
                      onClick={() => handleOrderClick(order)}
                    >
                      <div className={styles.orderCardHeader}>
                        <span className={styles.orderId}>
                          {order[DISPLAY_FIELDS[0].name]}
                        </span>
                        <span className={styles.orderTime}>
                          🕐 {getTimeAgo(order['Timestamp'])}
                        </span>
                      </div>
                      <div className={styles.orderCardBody}>
                        <div className={styles.orderInfo}>
                          {DISPLAY_FIELDS.slice(1, 3).map((field, idx) => (
                            <div key={idx} className={styles.infoItem}>
                              <strong>{field.name}:</strong> {renderField(field, order[field.name])}
                            </div>
                          ))}
                        </div>
                        <div className={styles.orderMeta}>
                          {DISPLAY_FIELDS.slice(3).map((field, idx) => (
                            <div key={idx} className={styles.metaItem}>
                              <strong>{field.name}</strong>
                              {renderField(field, order[field.name])}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={styles.orderCardFooter}>
                        <button className={styles.reviewBtn}>Review Now →</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Order Detail View */
            <div className={styles.detailView}>
              <button onClick={handleBackToDashboard} className={styles.backBtn}>
                ← Back to Orders
              </button>

              {/* Order Details Card - Non Editable Fields */}
              <div className={styles.detailCard}>
                <h3 className={styles.cardTitle}>Order Information</h3>
                <div className={styles.detailGrid}>
                  {NON_EDITABLE_FIELDS.map((field, idx) => (
                    <div key={idx} className={styles.detailItem}>
                      <span className={styles.detailLabel}>{field.name}</span>
                      <span className={styles.detailValue}>
                        {renderField(field, selectedOrder[field.name])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Status Selection */}
              {!selectedStatus && (
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
                        disabled={status === 'Edit Order' || status === 'Edit and Split'}
                      >
                        {status === 'Order Confirmed' && '✓ '}
                        {status === 'Cancel Order' && '✕ '}
                        {status === 'False Order' && '⚠️ '}
                        {status === 'Hold' && '⏸ '}
                        {status === 'Stock Transfer' && '🔄 '}
                        {status}
                        {(status === 'Edit Order' || status === 'Edit and Split') && ' (Coming Soon)'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Editable Fields Card */}
              {selectedStatus && actionFieldsConfig.length > 0 && (
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
