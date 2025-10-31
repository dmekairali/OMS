import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/NewOrders.module.css';

export default function NewOrders() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Key columns to display (updated to include Planned and Actual columns)
  const displayColumns = [
    'Oder ID',
    'Name of Client',
    'Mobile',
    'Email',
    'Invoice Amount',
    'Order Status',
    'Planned',
    'Actual',
    'Delivery Required Date',
    'Order Taken By',
    'Timestamp'
  ];

  useEffect(() => {
    // Check if user is logged in
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(userSession);
      setUser(userData);
      loadOrders();
    } catch (error) {
      console.error('Error parsing user session:', error);
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    // Apply filters
    if (!orders.length) {
      setFilteredOrders([]);
      return;
    }

    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        (order['Oder ID'] && order['Oder ID'].toLowerCase().includes(term)) ||
        (order['Name of Client'] && order['Name of Client'].toLowerCase().includes(term)) ||
        (order['Mobile'] && order['Mobile'].toLowerCase().includes(term)) ||
        (order['Email'] && order['Email'].toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      if (statusFilter === 'Pending') {
        // Pending: Planned is not blank AND Actual is blank
        filtered = filtered.filter(order => 
          order['Planned'] && order['Planned'].trim() !== '' && 
          (!order['Actual'] || order['Actual'].trim() === '')
        );
      } else {
        filtered = filtered.filter(order => order['Order Status'] === statusFilter);
      }
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  // Function to determine if an order is pending based on Planned/Actual
  const isOrderPending = (order) => {
    return order['Planned'] && order['Planned'].trim() !== '' && 
           (!order['Actual'] || order['Actual'].trim() === '');
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/orders');
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setHeaders(data.headers || []);
        setFilteredOrders(data.orders || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load orders');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditOrder = (order) => {
    setSelectedOrder({...order});
    setShowEditModal(true);
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder) return;

    try {
      setSaving(true);
      setError('');

      // Prepare updates object with only changed fields
      const updates = {};
      displayColumns.forEach(col => {
        if (selectedOrder[col] !== undefined) {
          updates[col] = selectedOrder[col];
        }
      });

      // Add audit fields
      updates['Last Edited By'] = user.username;
      updates['Last Edited At'] = new Date().toISOString();

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
        // Reload orders
        await loadOrders();
        setShowEditModal(false);
        setSelectedOrder(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save order');
      }
    } catch (error) {
      console.error('Error saving order:', error);
      setError('Failed to save order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadgeClass = (order) => {
    // Use the new pending logic
    if (isOrderPending(order)) {
      return styles.statusPending;
    }
    
    // Fall back to Order Status for other cases
    switch (order['Order Status']) {
      case 'Order Confirmed':
        return styles.statusConfirmed;
      case 'Cancelled':
        return styles.statusCancelled;
      case 'False Order':
        return styles.statusFalse;
      default:
        return styles.statusDefault;
    }
  };

  const getStatusDisplayText = (order) => {
    // Use the new pending logic
    if (isOrderPending(order)) {
      return 'Pending';
    }
    
    // Fall back to Order Status for other cases
    return order['Order Status'] || 'Unknown';
  };

  const getStatusOptions = () => {
    return ['All', 'Pending', 'Order Confirmed', 'Cancelled', 'False Order'];
  };

  // Count pending orders based on new logic
  const countPendingOrders = (ordersList) => {
    return ordersList.filter(order => isOrderPending(order)).length;
  };

  if (!user) {
    return (
      <div className={styles.loadingContainer}>
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => router.push('/dashboard')} className={styles.backButton}>
            ← Back
          </button>
          <h1>New Orders Management</h1>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.userName}>{user.username}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Filters and Actions */}
        <div className={styles.controlsSection}>
          <div className={styles.filters}>
            <input
              type="text"
              placeholder="Search by Order ID, Name, Mobile, Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.statusFilter}
            >
              {getStatusOptions().map((status, idx) => (
                <option key={idx} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className={styles.actions}>
            <button onClick={loadOrders} className={styles.refreshButton} disabled={loading}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            <span>⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError('')}>×</button>
          </div>
        )}

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total Orders:</span>
            <span className={styles.statValue}>{filteredOrders.length}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Pending:</span>
            <span className={styles.statValue}>
              {countPendingOrders(filteredOrders)}
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Confirmed:</span>
            <span className={styles.statValue}>
              {filteredOrders.filter(o => o['Order Status'] === 'Order Confirmed').length}
            </span>
          </div>
        </div>

        {/* Orders Table */}
        <div className={styles.tableSection}>
          {loading ? (
            <div className={styles.loadingOrders}>
              <div className="spinner"></div>
              <p>Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className={styles.emptyState}>
              <p>📦</p>
              <p>No orders found</p>
              {searchTerm || statusFilter !== 'All' ? (
                <button onClick={() => { setSearchTerm(''); setStatusFilter('All'); }} className={styles.clearButton}>
                  Clear Filters
                </button>
              ) : null}
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {displayColumns.map((col, index) => (
                      <th key={index}>{col}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => (
                    <tr key={index} onClick={() => handleEditOrder(order)}>
                      {displayColumns.map((col, colIndex) => (
                        <td key={colIndex}>
                          {col === 'Order Status' ? (
                            <span className={`${styles.statusBadge} ${getStatusBadgeClass(order)}`}>
                              {getStatusDisplayText(order)}
                            </span>
                          ) : col === 'Invoice Amount' ? (
                            `₹${order[col] || '0'}`
                          ) : (
                            order[col] || '-'
                          )}
                        </td>
                      ))}
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditOrder(order);
                          }}
                          className={styles.editButton}
                        >
                          ✏️ Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      {showEditModal && selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => !saving && setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Edit Order - {selectedOrder['Oder ID']}</h2>
              <button
                onClick={() => !saving && setShowEditModal(false)}
                className={styles.closeButton}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Oder ID</label>
                  <input
                    type="text"
                    value={selectedOrder['Oder ID'] || ''}
                    disabled
                    className={styles.inputDisabled}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Name of Client *</label>
                  <input
                    type="text"
                    value={selectedOrder['Name of Client'] || ''}
                    onChange={(e) => setSelectedOrder({...selectedOrder, 'Name of Client': e.target.value})}
                    disabled={saving}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Mobile *</label>
                  <input
                    type="text"
                    value={selectedOrder['Mobile'] || ''}
                    onChange={(e) => setSelectedOrder({...selectedOrder, 'Mobile': e.target.value})}
                    disabled={saving}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={selectedOrder['Email'] || ''}
                    onChange={(e) => setSelectedOrder({...selectedOrder, 'Email': e.target.value})}
                    disabled={saving}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Invoice Amount *</label>
                  <input
                    type="number"
                    value={selectedOrder['Invoice Amount'] || ''}
                    onChange={(e) => setSelectedOrder({...selectedOrder, 'Invoice Amount': e.target.value})}
                    disabled={saving}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Planned</label>
                  <input
                    type="text"
                    value={selectedOrder['Planned'] || ''}
                    onChange={(e) => setSelectedOrder({...selectedOrder, 'Planned': e.target.value})}
                    disabled={saving}
                    placeholder="Enter planned details"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Actual</label>
                  <input
                    type="text"
                    value={selectedOrder['Actual'] || ''}
                    onChange={(e) => setSelectedOrder({...selectedOrder, 'Actual': e.target.value})}
                    disabled={saving}
                    placeholder="Enter actual details"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Order Status</label>
                  <select
                    value={selectedOrder['Order Status'] || ''}
                    onChange={(e) => setSelectedOrder({...selectedOrder, 'Order Status': e.target.value})}
                    disabled={saving}
                  >
                    <option value="">Select Status</option>
                    <option value="Order Confirmed">Order Confirmed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="False Order">False Order</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Delivery Required Date</label>
                  <input
                    type="date"
                    value={selectedOrder['Delivery Required Date'] || ''}
                    onChange={(e) => setSelectedOrder({...selectedOrder, 'Delivery Required Date': e.target.value})}
                    disabled={saving}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Order Taken By</label>
                  <input
                    type="text"
                    value={selectedOrder['Order Taken By'] || ''}
                    onChange={(e) => setSelectedOrder({...selectedOrder, 'Order Taken By': e.target.value})}
                    disabled={saving}
                  />
                </div>
              </div>

              {error && (
                <div className={styles.modalError}>
                  ⚠️ {error}
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowEditModal(false)}
                className={styles.cancelButton}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrder}
                className={styles.saveButton}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
