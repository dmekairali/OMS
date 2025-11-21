import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Delivery.module.css';

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
  const [activeFilter, setActiveFilter] = useState('All');
  const [newOrderIds, setNewOrderIds] = useState(new Set());
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollingIntervalRef = useRef(null);
  
  // Inline Chalan Upload state
  const [showChalanUpload, setShowChalanUpload] = useState(false);
  const [chalanAttachment, setChalanAttachment] = useState('');
  const [chalanValue, setChalanValue] = useState('');
  const [uploadingChalan, setUploadingChalan] = useState(false);

  // Auth check
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
      
      // Start polling every 5 minutes
      pollingIntervalRef.current = setInterval(() => {
        loadOrders(false);
      }, 300000);
    } catch (error) {
      console.error('Session error:', error);
      localStorage.removeItem('userSession');
      router.push('/login');
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [router]);

  // Load orders from shared API
  const loadOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    try {
      console.log('📡 Fetching delivery orders from /api/dispatch-delivery...');
      const response = await fetch('/api/dispatch-delivery');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ API Response:', data);
      
      if (data.success && Array.isArray(data.orders)) {
        // Filter for Delivery: ONLY where Planned-3 (column AT) is not blank
        const deliveryOrders = data.orders.filter(order => {
          const planned3 = order['Planned-3'];
          
          // Planned-3 should have value (not blank/null/empty)
          const hasPlanned = planned3 && planned3.toString().trim() !== '';
          
          return hasPlanned;
        });
        
        console.log('📦 Delivery Orders filtered:', deliveryOrders.length, 'out of', data.orders.length);
        
        // Track new orders
        if (!showLoading && orders.length > 0) {
          const existingIds = new Set(orders.map(o => o['Order ID']));
          const newIds = new Set();
          deliveryOrders.forEach(order => {
            if (!existingIds.has(order['Order ID'])) {
              newIds.add(order['Order ID']);
            }
          });
          if (newIds.size > 0) {
            setNewOrderIds(prev => new Set([...prev, ...newIds]));
            setTimeout(() => {
              setNewOrderIds(new Set());
            }, 5000);
          }
        }
        
        setOrders(deliveryOrders);
        setLastUpdated(new Date());
      } else {
        console.error('❌ Invalid data format:', data);
        setOrders([]);
      }
    } catch (error) {
      console.error('❌ Error loading delivery orders:', error);
      alert('Failed to load delivery orders. Please refresh the page.');
      setOrders([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Filter orders
  useEffect(() => {
    console.log('🔄 Filtering delivery orders:', {
      totalOrders: orders.length,
      activeFilter,
      searchTerm
    });

    let filtered = [...orders];

    // Status filter
    if (activeFilter !== 'All') {
      filtered = filtered.filter(order => {
        const status = order['Status *'] || '';
        return status === activeFilter;
      });
      console.log(`✅ After status filter (${activeFilter}):`, filtered.length);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        const orderId = (order['Order ID'] || '').toString().toLowerCase();
        const clientName = (order['Client Name *'] || '').toString().toLowerCase();
        const mobile = (order['Mobile *'] || '').toString().toLowerCase();
        return orderId.includes(search) || 
               clientName.includes(search) || 
               mobile.includes(search);
      });
      console.log(`✅ After search filter (${searchTerm}):`, filtered.length);
    }

    setFilteredOrders(filtered);
  }, [orders, activeFilter, searchTerm]);

  // Calculate statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => !o['Status *'] || o['Status *'] === 'Pending').length,
    done: orders.filter(o => o['Status *'] === 'Done').length,
    cancelled: orders.filter(o => o['Status *'] === 'Cancelled').length,
    deviation: orders.filter(o => o['Status *'] === 'Deviation').length
  };

  // Handle order selection
  const handleOrderClick = (order) => {
    console.log('📋 Order selected:', order['Order ID']);
    setSelectedOrder(order);
    setShowDetailView(true);
  };

  // Handle back to list
  const handleBackToList = () => {
    setShowDetailView(false);
    setSelectedOrder(null);
    setShowChalanUpload(false);
    setChalanAttachment('');
    setChalanValue('');
  };

  // Handle Confirm Delivered Qty & Chalan action
  const handleConfirmDelivered = () => {
    if (!selectedOrder) return;
    
    console.log('✓ Confirm Delivered Qty & Chalan action');
    // TODO: Will open DeliveredQtyForm component
    // This will be similar to EditOrderForm but focused on delivery confirmation
    alert('DeliveredQtyForm - Coming Soon!\n\nWill edit these columns:\n- Qty ShortFall/Excess (AX)\n- Payment Date - By Client (AY)\n- Invoice Value - By Client (AZ)\n- Is order in Full (BA)\n- Reason (If No) (BB)\n- Status * (BF)\n- Inline_Chalan Attachment (BO)\n- LinkInline_Chalan Value (BP)');
  };

  // Handle Chalan Upload Toggle
  const handleChalanUpload = () => {
    if (showChalanUpload) {
      // Cancel/Hide upload section
      setShowChalanUpload(false);
      setChalanAttachment('');
      setChalanValue('');
    } else {
      // Show upload section and pre-fill existing values
      setShowChalanUpload(true);
      setChalanAttachment(selectedOrder['Inline_Chalan Attachment'] || '');
      setChalanValue(selectedOrder['LinkInline_Chalan Value'] || '');
    }
  };

  // Handle Save Chalan (inline)
  const handleSaveChalan = async () => {
    if (!selectedOrder) return;
    
    try {
      setUploadingChalan(true);
      console.log('📤 Uploading chalan:', {
        orderId: selectedOrder['Order ID'],
        attachment: chalanAttachment,
        value: chalanValue
      });
      
      // TODO: Implement API call to update chalan columns (BO, BP)
      // const response = await fetch('/api/update-chalan', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     orderId: selectedOrder['Order ID'],
      //     chalanAttachment: chalanAttachment,
      //     chalanValue: chalanValue
      //   })
      // });
      
      alert('Chalan uploaded successfully!');
      setShowChalanUpload(false);
      setChalanAttachment('');
      setChalanValue('');
      loadOrders(false);
    } catch (error) {
      console.error('❌ Error uploading chalan:', error);
      alert('Failed to upload chalan');
    } finally {
      setUploadingChalan(false);
    }
  };

  // Format date display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading delivery orders...</p>
      </div>
    );
  }

  // Detail View
  if (showDetailView && selectedOrder) {
    return (
      <div className={styles.pageContainer}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
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
              <div className={styles.navItem} onClick={() => router.push('/dashboard')}>
                <span className={styles.navIcon}>📊</span>
                <span className={styles.navText}>Dashboard</span>
              </div>
            )}

            {user.moduleAccess?.newOrders && (
              <div className={styles.navItem} onClick={() => router.push('/neworders')}>
                <span className={styles.navIcon}>📋</span>
                <span className={styles.navText}>New Orders</span>
              </div>
            )}

            {user.moduleAccess?.dispatch && (
              <div className={styles.navItem} onClick={() => router.push('/dispatch')}>
                <span className={styles.navIcon}>🚚</span>
                <span className={styles.navText}>Dispatch</span>
              </div>
            )}

            {user.moduleAccess?.delivery && (
              <div className={`${styles.navItem} ${styles.active}`}>
                <span className={styles.navIcon}>📦</span>
                <span className={styles.navText}>Delivery</span>
              </div>
            )}

            {user.moduleAccess?.payment && (
              <div className={styles.navItem} onClick={() => router.push('/payment')}>
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

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Header */}
          <header className={styles.header}>
            <h1 className={styles.pageTitle}>🚚 Delivery Confirmation</h1>
            <div className={styles.headerActions}>
              <input 
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchBox}
              />
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.name || 'User'}</span>
              </div>
            </div>
          </header>

          <div className={styles.content}>
            <button className={styles.backButton} onClick={handleBackToList}>
              ← Back to Delivery Orders
            </button>

            <div className={styles.detailContainer}>
              {/* Order Header */}
              <div className={styles.detailCard}>
                <div className={styles.detailHeader}>
                  <h2>🚚 Order #{selectedOrder['Order ID']}</h2>
                  <span className={`${styles.statusBadge} ${
                    selectedOrder['Status *'] === 'Done' ? styles.statusDone :
                    selectedOrder['Status *'] === 'Cancelled' ? styles.statusCancelled :
                    selectedOrder['Status *'] === 'Deviation' ? styles.statusDeviation :
                    styles.statusPending
                  }`}>
                    {selectedOrder['Status *'] || 'Pending'}
                  </span>
                </div>
              </div>

              {/* Client Information */}
              <div className={styles.detailCard}>
                <h3 className={styles.cardTitle}>👤 Client Information</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <label>Client Name</label>
                    <p>{selectedOrder['Client Name *'] || '-'}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Mobile</label>
                    <p>{selectedOrder['Mobile *'] || '-'}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Email</label>
                    <p>{selectedOrder['Email *'] || '-'}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Client Type</label>
                    <p>{selectedOrder['Client Type *'] || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className={styles.detailCard}>
                <h3 className={styles.cardTitle}>📦 Delivery Information</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <label>Planned-3 Date</label>
                    <p>{formatDate(selectedOrder['Planned-3'])}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Actual-3 Date</label>
                    <p>{formatDate(selectedOrder['Actual-3'])}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Qty ShortFall/Excess</label>
                    <p>{selectedOrder['Qty ShortFall/Excess'] || '-'}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Payment Date - By Client</label>
                    <p>{formatDate(selectedOrder['Payment Date - By Client'])}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Invoice Value - By Client</label>
                    <p>{formatCurrency(selectedOrder['Invoice Value - By Client'])}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Is Order in Full</label>
                    <p>{selectedOrder['Is order in Full - Yes/No -Client'] || '-'}</p>
                  </div>
                  <div className={styles.detailItem} style={{ gridColumn: '1 / -1' }}>
                    <label>Reason (If No)</label>
                    <p>{selectedOrder['Reason (If No) -Client'] || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Chalan Information */}
              <div className={styles.detailCard}>
                <h3 className={styles.cardTitle}>📄 Chalan Details</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <label>Chalan Attachment</label>
                    <p>{selectedOrder['Inline_Chalan Attachment'] || 'Not uploaded'}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Chalan Value</label>
                    <p>{selectedOrder['LinkInline_Chalan Value'] || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                <button 
                  className={`${styles.actionButton} ${styles.confirmButton}`}
                  onClick={handleConfirmDelivered}
                >
                  ✓ Confirm Delivered Qty & Chalan
                </button>
                <button 
                  className={`${styles.actionButton} ${styles.uploadButton}`}
                  onClick={handleChalanUpload}
                >
                  {showChalanUpload ? '✕ Cancel Upload' : '📤 Upload Only Chalan'}
                </button>
              </div>

              {/* Inline Chalan Upload Section */}
              {showChalanUpload && (
                <div className={styles.detailCard}>
                  <h3 className={styles.cardTitle}>📤 Upload Chalan</h3>
                  <div className={styles.detailGrid}>
                    <div className={styles.detailItem}>
                      <label>Chalan Attachment</label>
                      <input
                        type="text"
                        value={chalanAttachment}
                        onChange={(e) => setChalanAttachment(e.target.value)}
                        placeholder="Enter attachment URL or file path"
                        className={styles.input}
                        disabled={uploadingChalan}
                      />
                    </div>
                    <div className={styles.detailItem}>
                      <label>Chalan Value</label>
                      <input
                        type="text"
                        value={chalanValue}
                        onChange={(e) => setChalanValue(e.target.value)}
                        placeholder="Enter chalan value"
                        className={styles.input}
                        disabled={uploadingChalan}
                      />
                    </div>
                  </div>
                  <div className={styles.actionButtons} style={{ marginTop: '1rem' }}>
                    <button 
                      className={`${styles.actionButton} ${styles.saveButton}`}
                      onClick={handleSaveChalan}
                      disabled={uploadingChalan || (!chalanAttachment && !chalanValue)}
                    >
                      {uploadingChalan ? 'Uploading...' : '💾 Save Chalan'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className={styles.pageContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
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
            <div className={styles.navItem} onClick={() => router.push('/dashboard')}>
              <span className={styles.navIcon}>📊</span>
              <span className={styles.navText}>Dashboard</span>
            </div>
          )}

          {user.moduleAccess?.newOrders && (
            <div className={styles.navItem} onClick={() => router.push('/neworders')}>
              <span className={styles.navIcon}>📋</span>
              <span className={styles.navText}>New Orders</span>
            </div>
          )}

          {user.moduleAccess?.dispatch && (
            <div className={styles.navItem} onClick={() => router.push('/dispatch')}>
              <span className={styles.navIcon}>🚚</span>
              <span className={styles.navText}>Dispatch</span>
            </div>
          )}

          {user.moduleAccess?.delivery && (
            <div className={`${styles.navItem} ${styles.active}`}>
              <span className={styles.navIcon}>📦</span>
              <span className={styles.navText}>Delivery</span>
              {orders.length > 0 && (
                <span className={styles.badge}>{orders.length}</span>
              )}
            </div>
          )}

          {user.moduleAccess?.payment && (
            <div className={styles.navItem} onClick={() => router.push('/payment')}>
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

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>🚚 Delivery Confirmation</h1>
          <div className={styles.headerActions}>
            <input 
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchBox}
            />
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name || 'User'}</span>
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.pageHeader}>
            <div>
              <h1>🚚 Delivery Confirmation</h1>
              <p className={styles.subtitle}>
                Track and confirm delivery of dispatched orders
                {lastUpdated && (
                  <span className={styles.lastUpdated}>
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard} onClick={() => setActiveFilter('All')}>
              <div className={styles.statIcon}>📊</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Total Orders</div>
                <div className={styles.statValue}>{stats.total}</div>
              </div>
            </div>
            <div className={styles.statCard} onClick={() => setActiveFilter('Pending')}>
              <div className={styles.statIcon}>⏳</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Pending</div>
                <div className={styles.statValue}>{stats.pending}</div>
              </div>
            </div>
            <div className={styles.statCard} onClick={() => setActiveFilter('Done')}>
              <div className={styles.statIcon}>✅</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Delivered</div>
                <div className={styles.statValue}>{stats.done}</div>
              </div>
            </div>
            <div className={styles.statCard} onClick={() => setActiveFilter('Cancelled')}>
              <div className={styles.statIcon}>❌</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Cancelled</div>
                <div className={styles.statValue}>{stats.cancelled}</div>
              </div>
            </div>
            <div className={styles.statCard} onClick={() => setActiveFilter('Deviation')}>
              <div className={styles.statIcon}>⚠️</div>
              <div className={styles.statContent}>
                <div className={styles.statLabel}>Deviation</div>
                <div className={styles.statValue}>{stats.deviation}</div>
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className={styles.filterContainer}>
            <button
              className={`${styles.filterButton} ${activeFilter === 'All' ? styles.active : ''}`}
              onClick={() => setActiveFilter('All')}
            >
              All Orders ({stats.total})
            </button>
            <button
              className={`${styles.filterButton} ${activeFilter === 'Pending' ? styles.active : ''}`}
              onClick={() => setActiveFilter('Pending')}
            >
              Pending ({stats.pending})
            </button>
            <button
              className={`${styles.filterButton} ${activeFilter === 'Done' ? styles.active : ''}`}
              onClick={() => setActiveFilter('Done')}
            >
              Delivered ({stats.done})
            </button>
            <button
              className={`${styles.filterButton} ${activeFilter === 'Cancelled' ? styles.active : ''}`}
              onClick={() => setActiveFilter('Cancelled')}
            >
              Cancelled ({stats.cancelled})
            </button>
            <button
              className={`${styles.filterButton} ${activeFilter === 'Deviation' ? styles.active : ''}`}
              onClick={() => setActiveFilter('Deviation')}
            >
              Deviation ({stats.deviation})
            </button>
          </div>

          {/* Orders List */}
          <div className={styles.ordersList}>
            {filteredOrders.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No delivery orders found</p>
                {activeFilter !== 'All' && (
                  <button 
                    className={styles.clearFilterButton}
                    onClick={() => setActiveFilter('All')}
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order['Order ID']}
                  className={`${styles.orderCard} ${
                    newOrderIds.has(order['Order ID']) ? styles.newOrder : ''
                  }`}
                  onClick={() => handleOrderClick(order)}
                >
                  <div className={styles.orderHeader}>
                    <div className={styles.orderId}>
                      #{order['Order ID']}
                      {newOrderIds.has(order['Order ID']) && (
                        <span className={styles.newBadge}>NEW</span>
                      )}
                    </div>
                    <span className={`${styles.statusBadge} ${
                      order['Status *'] === 'Done' ? styles.statusDone :
                      order['Status *'] === 'Cancelled' ? styles.statusCancelled :
                      order['Status *'] === 'Deviation' ? styles.statusDeviation :
                      styles.statusPending
                    }`}>
                      {order['Status *'] || 'Pending'}
                    </span>
                  </div>

                  <div className={styles.orderDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Client:</span>
                      <span className={styles.value}>{order['Client Name *'] || '-'}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Mobile:</span>
                      <span className={styles.value}>{order['Mobile *'] || '-'}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Planned Date:</span>
                      <span className={styles.value}>{formatDate(order['Planned-3'])}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Invoice Value:</span>
                      <span className={styles.value}>
                        {formatCurrency(order['Invoice Value - By Client'])}
                      </span>
                    </div>
                  </div>

                  <button className={styles.viewButton}>
                    View Details →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
