import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Dispatch.module.css';
import SetupDataService from '../services/SetupDataService';

// NON_EDITABLE_FIELDS - Delivery-specific fields
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
  { name: 'Delivery Party From', type: 'text' },
  { name: 'Delivery Party Contact No', type: 'text' },
  { name: 'Payment Confirmation Type', type: 'text' },
  { name: 'Planned-3', type: 'datetime' },
  { name: 'Actual-3', type: 'datetime' },
  { name: 'Qty ShortFall/Excess', type: 'number' },
  { name: 'Payment Date - By Client', type: 'date' },
  { name: 'Invoice Value - By Client', type: 'currency' },
  { name: 'Is order in Full - Yes/No -Client', type: 'text' },
  { name: 'Reason (If No) -Client', type: 'text' },
  { name: 'Status *', type: 'text' },
  { name: 'Chalan Attachment Link', type: 'url' },
  { name: 'Chalan Value', type: 'currency' },

  	
];

// DISPLAY_FIELDS for order cards
const DISPLAY_FIELDS = [
  { name: 'Oder ID', type: 'text' },
  { name: 'Name of Client', type: 'text' },
  { name: 'Client Type', type: 'text' },
  { name: 'Chalan Attachment Link', type: 'url' },
  { name: 'Delivery Party From', type: 'text' },
  { name: 'Planned-3', type: 'datetime' },
  { name: 'Chalan Value', type: 'currency' },
];

// Status categories for filtering - Delivery specific
const STATUS_CATEGORIES = [
  { value: 'All', label: 'All', icon: '📋' },
  { value: 'Pending', label: 'Pending Delivery', icon: '⏳' },
  { value: 'Delivered', label: 'Delivered', icon: '✅' },
  { value: 'Cancel Order', label: 'Cancelled', icon: '❌' },
];

export default function Delivery() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Pending');
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollingIntervalRef = useRef(null);
  
  // Delivery-specific states
  const [showChalanUpload, setShowChalanUpload] = useState(false);
  const [chalanFile, setChalanFile] = useState(null);
  const [uploadingChalan, setUploadingChalan] = useState(false);
  const [clientOrderHistory, setClientOrderHistory] = useState([]);

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
      
      if (!userData.moduleAccess?.delivery) {
        alert('You do not have access to Delivery module');
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
      const response = await fetch('/api/dispatch-delivery');
      if (response.ok) {
        const data = await response.json();
        let ordersList = data.orders || [];
        
        // Filter for delivery: Planned-3 is not null
        ordersList = ordersList.filter(order => 
          order['Planned-3'] && order['Planned-3'].trim() !== ''
        );
        
        ordersList = ordersList.reverse();
        
        setOrders(ordersList);
        setLastUpdated(new Date());
        filterOrders(ordersList, activeFilter, searchTerm);
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
        // Pending = Planned-3 exists AND Actual-3 is null/blank
        filtered = filtered.filter(order => 
          (!order['Actual-3'] || order['Actual-3'].trim() === '')
        );
      } else if (statusFilter === 'Delivered') {
        // Delivered = Actual-3 has value
        filtered = filtered.filter(order => 
          order['Actual-3'] && order['Actual-3'].trim() !== ''
        );
      } else {
        filtered = filtered.filter(order => order['Status *'] === statusFilter);
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
    setShowChalanUpload(false);
    
    // Get client order history from pre-loaded archive data
    const history = SetupDataService.getClientOrderHistory(
      order['Client Contact'], 
      order['Oder ID'],
      3  // Last 3 orders
    );
    
    setClientOrderHistory(history);
    closeSidebar();
  };

  const handleBackToDashboard = () => {
    setSelectedOrder(null);
    setShowDetailView(false);
    setShowChalanUpload(false);
    loadOrders(false);
  };

  // Upload Chalan Handler
  const handleChalanUpload = async () => {
    if (!chalanFile || !selectedOrder) {
      alert('Please select a file to upload');
      return;
    }

    setUploadingChalan(true);
    try {
      const formData = new FormData();
      formData.append('file', chalanFile);
      formData.append('orderId', selectedOrder['Oder ID']);
      formData.append('rowIndex', selectedOrder._rowIndex);

      const response = await fetch('/api/upload-chalan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      
      alert('Chalan uploaded successfully!');
      setShowChalanUpload(false);
      setChalanFile(null);
      loadOrders(false); // Refresh data
    } catch (error) {
      console.error('Error uploading chalan:', error);
      alert('Failed to upload chalan. Please try again.');
    } finally {
      setUploadingChalan(false);
    }
  };

  // Render order history section
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
                    </span>
                  </div>
                  <div className={styles.historyField}>
                    <span className={styles.historyLabel}>Order Taken By</span>
                    <span className={styles.historyValue}>
                      {histOrder.orderTakenBy || 'N/A'}
                    </span>
                  </div>
                  <div className={styles.historyField}>
                    <span className={styles.historyLabel}>Delivery Party</span>
                    <span className={styles.historyValue}>
                      {histOrder.dispatchPartyFrom 
                        ? histOrder.dispatchPartyFrom.split('-')[0].trim() 
                        : 'N/A'
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

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    router.push('/login');
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
      case 'Delivered':
        return '#10b981';
      case 'Cancel Order':
        return '#ef4444';
      case 'Pending':
        return '#f59e0b';
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

  const getStatusCounts = () => {
    const counts = {};
    STATUS_CATEGORIES.forEach(cat => {
      if (cat.value === 'All') {
        counts[cat.value] = orders.length;
      } else if (cat.value === 'Pending') {
        counts[cat.value] = orders.filter(o => 
          !o['Actual-3'] || o['Actual-3'].trim() === ''
        ).length;
      } else if (cat.value === 'Delivered') {
        counts[cat.value] = orders.filter(o => 
          o['Actual-3'] && o['Actual-3'].trim() !== ''
        ).length;
      } else {
        counts[cat.value] = orders.filter(o => o['Status *'] === cat.value).length;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (!user || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

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
            
          <div className={styles.navItem} onClick={() => { navigateToModule('neworders'); closeSidebar(); }}>
            <span className={styles.navIcon}>📋</span>
            <span className={styles.navText}>New Orders</span>
          </div>

          {user.moduleAccess?.dispatch && (
            <div className={styles.navItem} onClick={() => { navigateToModule('dispatch'); closeSidebar(); }}>
              <span className={styles.navIcon}>🚚</span>
              <span className={styles.navText}>Dispatch</span>
            </div>
          )}

          {user.moduleAccess?.delivery && (
            <div className={`${styles.navItem} ${styles.active}`} onClick={closeSidebar}>
              <span className={styles.navIcon}>📦</span>
              <span className={styles.navText}>Delivery</span>
              {statusCounts['Pending'] > 0 && (
                <span className={styles.badge}>{statusCounts['Pending']}</span>
              )}
            </div>
          )}
          
          {user.moduleAccess?.payment && (
            <div className={styles.navItem} onClick={() => { navigateToModule('payment'); closeSidebar(); }}>
              <span className={styles.navIcon}>💰</span>
              <span className={styles.navText}>Payment</span>
            </div>
          )}

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
            {showDetailView ? 'Delivery Details' : 'Delivery Management'}
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
                  if (count === 0 && category.value !== 'All' && category.value !== 'Pending') return null;
                  
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
                  {activeFilter === 'All' ? '📦 All Delivery Orders' : `${STATUS_CATEGORIES.find(c => c.value === activeFilter)?.icon} ${activeFilter}`} ({filteredOrders.length})
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
                  <p className={styles.emptyText}>No delivery orders found</p>
                  <button onClick={() => loadOrders(true)} className={styles.refreshBtn}>Refresh</button>
                </div>
              ) : (
                <div className={styles.ordersList}>
                  {filteredOrders.map((order, index) => {
                    const isDelivered = order['Actual-3'] && order['Actual-3'].trim() !== '';
                    
                    return (
                      <div 
                        key={index} 
                        className={`${styles.orderCard} ${isDelivered ? styles.completed : ''}`}
                        onClick={() => handleOrderClick(order)}
                      >
                        <div className={styles.orderCardHeader}>
                          <div className={styles.orderIdContainer}>
                            <span className={styles.orderId}>
                              {order['Oder ID']}
                            </span>
                          </div>
                          <span className={styles.orderTime}>
                            🕐 {getTimeAgo(order['Planned-3'])}
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
                            {isDelivered ? 'View Details →' : 'Process Delivery →'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className={styles.detailView}>
              <button onClick={handleBackToDashboard} className={styles.backBtn}>
                ← Back to Orders
              </button>

              {renderOrderHistory()}

              <div className={styles.detailCard}>
                <h3 className={styles.cardTitle}>📦 Delivery Information</h3>
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

              {/* Action Buttons Section */}
              <div className={styles.detailCard}>
                <h3 className={styles.cardTitle}>✏️ Delivery Actions</h3>
                <div className={styles.statusButtonsGrid}>
                  <button
                    onClick={() => alert('Edit form will be implemented later')}
                    className={`${styles.statusButton} ${styles.statusSuccess}`}
                  >
                    ✓ Confirm Delivered Qty & Chalan
                  </button>
                  <button
                    onClick={() => setShowChalanUpload(!showChalanUpload)}
                    className={`${styles.statusButton} ${styles.statusInfo}`}
                  >
                    📎 Upload Only Chalan
                  </button>
                </div>
              </div>

              {/* Chalan Upload Section */}
              {showChalanUpload && (
                <div className={styles.detailCard}>
                  <h3 className={styles.cardTitle}>📎 Upload Chalan</h3>
                  <div className={styles.formGrid}>
                    <div className={`${styles.formField} ${styles.fullWidth}`}>
                      <label>Select Chalan File</label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setChalanFile(e.target.files[0])}
                        className={styles.fileInput}
                      />
                      {chalanFile && (
                        <div className={styles.fileInfo}>
                          <span>Selected: {chalanFile.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.formActions}>
                    <button
                      onClick={() => {
                        setShowChalanUpload(false);
                        setChalanFile(null);
                      }}
                      className={styles.btnSecondary}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChalanUpload}
                      disabled={!chalanFile || uploadingChalan}
                      className={styles.btnSuccess}
                    >
                      {uploadingChalan ? 'Uploading...' : '📤 Upload Chalan'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
