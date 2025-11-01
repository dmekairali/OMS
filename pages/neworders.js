import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/NewOrders.module.css';
import configService from '../lib/configService';

export default function NewOrders() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [displayFields, setDisplayFields] = useState([]);
  const [actionFields, setActionFields] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [activeAction, setActiveAction] = useState(null);

  useEffect(() => {
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(userSession);
      
      // Check module access
      if (!userData.moduleAccess?.newOrders) {
        alert('You do not have access to New Orders module');
        router.push('/dashboard');
        return;
      }

      setUser(userData);
      initializeModule();
    } catch (error) {
      console.error('Error parsing user session:', error);
      router.push('/login');
    }
  }, [router]);

  const initializeModule = async () => {
    try {
      setLoading(true);
      
      // Get display fields from configuration
      const fields = configService.getDisplayFieldsForStage('New Orders');
      setDisplayFields(fields);
      
      // Get action fields
      setActionFields({
        confirm: configService.getEditableFieldsForStatus('NewOrders', 'confirm'),
        cancel: configService.getEditableFieldsForStatus('NewOrders', 'cancel'),
        false: configService.getEditableFieldsForStatus('NewOrders', 'false')
      });
      
      await loadOrders();
    } catch (error) {
      console.error('Error initializing module:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        const ordersList = data.orders || [];
        setOrders(ordersList);
        setFilteredOrders(ordersList);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
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
        return displayFields.some(field => {
          const value = order[field.fieldName];
          return value && value.toString().toLowerCase().includes(term);
        });
      });
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, displayFields]);

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowDetailView(true);
    setActiveAction(null);
  };

  const handleBackToDashboard = () => {
    setSelectedOrder(null);
    setShowDetailView(false);
    setActiveAction(null);
  };

  const handleActionClick = (action) => {
    setActiveAction(action);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const updates = {};
    
    for (let [key, value] of formData.entries()) {
      updates[key] = value;
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
    switch (field.fieldType) {
      case 'currency':
        return `₹${value || '0'}`;
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '-';
      case 'datetime':
        return value ? new Date(value).toLocaleString() : '-';
      default:
        return value || '-';
    }
  };

  const renderFormField = (field, index) => {
    const isFullWidth = field.fieldType === 'textarea';
    
    return (
      <div key={index} className={`${styles.formField} ${isFullWidth ? styles.fullWidth : ''}`}>
        <label>
          {field.fieldName}
          {field.required && <span className={styles.required}>*</span>}
        </label>
        
        {field.fieldType === 'text' && (
          <input
            type="text"
            name={field.fieldName}
            defaultValue={field.defaultValue}
            required={field.required}
            readOnly={!field.editable}
          />
        )}
        
        {field.fieldType === 'dropdown' && field.options && (
          <select
            name={field.fieldName}
            defaultValue={field.defaultValue}
            required={field.required}
            disabled={!field.editable}
          >
            <option value="">Select {field.fieldName}</option>
            {field.options.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        )}
        
        {field.fieldType === 'textarea' && (
          <textarea
            name={field.fieldName}
            defaultValue={field.defaultValue}
            required={field.required}
            readOnly={!field.editable}
            rows="3"
          />
        )}
        
        {field.fieldType === 'checkbox' && (
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name={field.fieldName}
              defaultChecked={field.defaultValue === 'TRUE'}
              disabled={!field.editable}
            />
            <span>{field.fieldName}</span>
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

  const actionFieldsConfig = actionFields[activeAction] || [];

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
                          {order[displayFields[0]?.fieldName] || order['Oder ID']}
                        </span>
                        <span className={styles.orderTime}>
                          🕐 {getTimeAgo(order['Timestamp'])}
                        </span>
                      </div>
                      <div className={styles.orderCardBody}>
                        <div className={styles.orderInfo}>
                          {displayFields.slice(1, 4).map((field, idx) => (
                            <div key={idx} className={styles.infoItem}>
                              <strong>{field.fieldName}:</strong> {renderField(field, order[field.fieldName])}
                            </div>
                          ))}
                        </div>
                        <div className={styles.orderMeta}>
                          {displayFields.slice(4, 7).map((field, idx) => (
                            <div key={idx} className={styles.metaItem}>
                              <strong>{field.fieldName}</strong>
                              {renderField(field, order[field.fieldName])}
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

              {/* Order Details Card */}
              <div className={styles.detailCard}>
                <h3 className={styles.cardTitle}>Order Details</h3>
                <div className={styles.detailGrid}>
                  {displayFields.map((field, idx) => (
                    <div key={idx} className={styles.detailItem}>
                      <span className={styles.detailLabel}>{field.fieldName}</span>
                      <span className={styles.detailValue}>
                        {renderField(field, selectedOrder[field.fieldName])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editable Fields Card */}
              {activeAction && actionFieldsConfig.length > 0 && (
                <div className={styles.detailCard}>
                  <h3 className={styles.cardTitle}>✏️ Update Order Information</h3>
                  <div className={`${styles.infoBox} ${styles[`info${activeAction}`]}`}>
                    <span className={styles.infoIcon}>
                      {activeAction === 'confirm' ? 'ℹ️' : '⚠️'}
                    </span>
                    <span className={styles.infoText}>
                      {activeAction === 'confirm' && 'Fill in the required information to confirm this order'}
                      {activeAction === 'cancel' && 'Please provide cancellation details'}
                      {activeAction === 'false' && 'Mark this order as false/fraudulent'}
                    </span>
                  </div>
                  
                  <form className={styles.editableForm} onSubmit={handleFormSubmit}>
                    <div className={styles.formGrid}>
                      {actionFieldsConfig.map((field, idx) => renderFormField(field, idx))}
                    </div>
                    <div className={styles.formActions}>
                      <button type="button" onClick={() => setActiveAction(null)} className={styles.btnSecondary}>
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className={
                          activeAction === 'confirm' ? styles.btnSuccess :
                          activeAction === 'cancel' ? styles.btnDanger :
                          styles.btnGray
                        }
                      >
                        {activeAction === 'confirm' && '✓ Confirm Order'}
                        {activeAction === 'cancel' && '✕ Cancel Order'}
                        {activeAction === 'false' && '⚠️ Mark as False Order'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Action Buttons */}
              {!activeAction && (
                <div className={styles.actionButtons}>
                  <button 
                    onClick={() => handleActionClick('cancel')} 
                    className={`${styles.actionBtn} ${styles.btnDanger}`}
                  >
                    ✕ Cancel Order
                  </button>
                  <button 
                    onClick={() => handleActionClick('false')} 
                    className={`${styles.actionBtn} ${styles.btnGray}`}
                  >
                    ⚠️ False Order
                  </button>
                  <button 
                    onClick={() => handleActionClick('confirm')} 
                    className={`${styles.actionBtn} ${styles.btnSuccess}`}
                  >
                    ✓ Confirm Order
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
