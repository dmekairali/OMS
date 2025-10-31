import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const [stats, setStats] = useState({
    newOrders: 0,
    confirmed: 0,
    dispatched: 0,
    delivered: 0,
    paid: 0
  });

  useEffect(() => {
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
    if (!orders.length) {
      setFilteredOrders([]);
      return;
    }

    let filtered = [...orders];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        (order['Oder ID'] && order['Oder ID'].toLowerCase().includes(term)) ||
        (order['Name of Client'] && order['Name of Client'].toLowerCase().includes(term)) ||
        (order['Mobile'] && order['Mobile'].toLowerCase().includes(term))
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders');
      
      if (response.ok) {
        const data = await response.json();
        const ordersList = data.orders || [];
        setOrders(ordersList);
        setFilteredOrders(ordersList);
        
        calculateStats(ordersList);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersList) => {
    const pending = ordersList.filter(o => 
      o['Planned'] && o['Planned'].trim() !== '' && 
      (!o['Actual'] || o['Actual'].trim() === '')
    ).length;
    
    const confirmed = ordersList.filter(o => o['Order Status'] === 'Order Confirmed').length;
    
    setStats({
      newOrders: pending,
      confirmed: confirmed,
      dispatched: 0,
      delivered: 0,
      paid: 0
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    router.push('/login');
  };

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

  if (!user) {
    return (
      <div className={styles.loadingContainer}>
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logoSection}>
          <span className={styles.logoIcon}>📦</span>
          <span className={styles.logoText}>OrderFlow</span>
        </div>

        <nav className={styles.navMenu}>
          <div className={`${styles.navItem} ${styles.active}`}>
            <span className={styles.navIcon}>📊</span>
            <span className={styles.navText}>Dashboard</span>
            <span className={styles.badge}>{stats.newOrders}</span>
          </div>
          <div className={styles.navItem}>
            <span className={styles.navIcon}>🚚</span>
            <span className={styles.navText}>Dispatch</span>
            <span className={styles.badge}>{stats.dispatched}</span>
          </div>
          <div className={styles.navItem}>
            <span className={styles.navIcon}>📦</span>
            <span className={styles.navText}>Delivery</span>
            <span className={styles.badge}>{stats.delivered}</span>
          </div>
          <div className={styles.navItem}>
            <span className={styles.navIcon}>💰</span>
            <span className={styles.navText}>Payment</span>
            <span className={styles.badge}>{stats.paid}</span>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>
            {showDetailView ? 'Order Details' : 'Dashboard'}
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
              {/* Stats Grid */}
              <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.statYellow}`}>
                  <div className={styles.statIcon}>📋</div>
                  <div className={styles.statInfo}>
                    <div className={styles.statLabel}>New Orders</div>
                    <div className={styles.statValue}>{stats.newOrders}</div>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statBlue}`}>
                  <div className={styles.statIcon}>✅</div>
                  <div className={styles.statInfo}>
                    <div className={styles.statLabel}>Confirmed</div>
                    <div className={styles.statValue}>{stats.confirmed}</div>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statPurple}`}>
                  <div className={styles.statIcon}>🚚</div>
                  <div className={styles.statInfo}>
                    <div className={styles.statLabel}>Dispatched</div>
                    <div className={styles.statValue}>{stats.dispatched}</div>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statGreen}`}>
                  <div className={styles.statIcon}>📦</div>
                  <div className={styles.statInfo}>
                    <div className={styles.statLabel}>Delivered</div>
                    <div className={styles.statValue}>{stats.delivered}</div>
                  </div>
                </div>
                <div className={`${styles.statCard} ${styles.statCyan}`}>
                  <div className={styles.statIcon}>💰</div>
                  <div className={styles.statInfo}>
                    <div className={styles.statLabel}>Paid</div>
                    <div className={styles.statValue}>{stats.paid}</div>
                  </div>
                </div>
              </div>

              {/* Section Header */}
              <div className={styles.sectionHeader}>
                <h2>🔍 Stage 1: Pending Review ({stats.newOrders})</h2>
              </div>

              {/* Orders List */}
              {loading ? (
                <div className={styles.loadingOrders}>
                  <div className="spinner"></div>
                  <p>Loading orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
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
                        <span className={styles.orderId}>{order['Oder ID']}</span>
                        <span className={styles.orderTime}>
                          🕐 {getTimeAgo(order['Timestamp'])}
                        </span>
                      </div>
                      <div className={styles.orderCardBody}>
                        <div className={styles.orderInfo}>
                          <div className={styles.infoItem}>
                            <strong>Customer:</strong> {order['Name of Client'] || '-'}
                          </div>
                          <div className={styles.infoItem}>
                            📍 {order['Address'] || 'No address provided'}
                          </div>
                        </div>
                        <div className={styles.orderMeta}>
                          <div className={styles.metaItem}>
                            <strong>Phone:</strong> {order['Mobile'] || '-'}
                          </div>
                          <div className={styles.metaItem}>
                            <strong>Items:</strong> {order['Items'] || '-'}
                          </div>
                          <div className={styles.metaItem}>
                            <strong>Amount:</strong> ₹{order['Invoice Amount'] || '0'}
                          </div>
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
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Order ID</span>
                    <span className={styles.detailValue}>{selectedOrder['Oder ID']}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Status</span>
                    <span className={styles.detailValue}>{selectedOrder['Order Status'] || 'Pending'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Source</span>
                    <span className={styles.detailValue}>{selectedOrder['Source'] || 'Website'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Received</span>
                    <span className={styles.detailValue}>{selectedOrder['Timestamp'] || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Customer Information Card */}
              <div className={styles.detailCard}>
                <h3 className={styles.cardTitle}>Customer Information</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Customer Name</span>
                    <span className={styles.detailValue}>{selectedOrder['Name of Client']}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Email</span>
                    <span className={styles.detailValue}>{selectedOrder['Email'] || '-'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Phone Number</span>
                    <span className={styles.detailValue}>{selectedOrder['Mobile']}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Delivery Address</span>
                    <span className={styles.detailValue}>{selectedOrder['Address'] || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Order Items Card */}
              <div className={styles.detailCard}>
                <h3 className={styles.cardTitle}>Order Items</h3>
                <div className={styles.itemsTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div>{selectedOrder['Product Name'] || 'Product'}</div>
                          <small>{selectedOrder['SKU'] || '-'}</small>
                        </td>
                        <td>{selectedOrder['Quantity'] || '1'}</td>
                        <td>₹{selectedOrder['Price'] || '0'}</td>
                        <td>₹{selectedOrder['Invoice Amount'] || '0'}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className={styles.priceSummary}>
                    <div className={styles.summaryRow}>
                      <span>Subtotal:</span>
                      <span>₹{selectedOrder['Invoice Amount'] || '0'}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Tax (10%):</span>
                      <span>₹{(parseFloat(selectedOrder['Invoice Amount'] || 0) * 0.1).toFixed(2)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Delivery:</span>
                      <span>₹50</span>
                    </div>
                    <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                      <span>Total:</span>
                      <span>₹{(parseFloat(selectedOrder['Invoice Amount'] || 0) * 1.1 + 50).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editable Fields Card */}
              {activeAction && (
                <div className={styles.detailCard}>
                  <h3 className={styles.cardTitle}>✏️ Update Order Information</h3>
                  <div className={`${styles.infoBox} ${styles[`info${activeAction}`]}`}>
                    <span className={styles.infoIcon}>
                      {activeAction === 'confirm' ? 'ℹ️' : activeAction === 'cancel' ? '⚠️' : '⚠️'}
                    </span>
                    <span className={styles.infoText}>
                      {activeAction === 'confirm' && 'Fill in the required information to confirm this order'}
                      {activeAction === 'cancel' && 'Please provide cancellation details'}
                      {activeAction === 'false' && 'Mark this order as false/fraudulent'}
                    </span>
                  </div>
                  
                  <form className={styles.editableForm}>
                    {activeAction === 'confirm' && (
                      <>
                        <div className={styles.formGrid}>
                          <div className={styles.formField}>
                            <label>Order Status</label>
                            <input type="text" value="Order Confirmed" readOnly />
                          </div>
                          <div className={styles.formField}>
                            <label>Dispatch Party From <span className={styles.required}>*</span></label>
                            <select required>
                              <option value="">Select Dispatch Party</option>
                              <option>Kairali Ayurvedic Products-642001-Stockist-1234567890</option>
                              <option>Mumbai Warehouse-400001-Main-9876543210</option>
                              <option>Delhi Distribution-110001-Branch-8765432109</option>
                            </select>
                          </div>
                          <div className={`${styles.formField} ${styles.fullWidth}`}>
                            <label>Remarks <span className={styles.required}>*</span></label>
                            <textarea required rows="3"></textarea>
                          </div>
                          <div className={styles.formField}>
                            <label className={styles.checkboxLabel}>
                              <input type="checkbox" />
                              <span>Inform to Client by call</span>
                            </label>
                          </div>
                          <div className={styles.formField}>
                            <label className={styles.checkboxLabel}>
                              <input type="checkbox" />
                              <span>Inform to Dispatch Party by call</span>
                            </label>
                          </div>
                        </div>
                        <div className={styles.formActions}>
                          <button type="button" onClick={() => setActiveAction(null)} className={styles.btnSecondary}>
                            Cancel
                          </button>
                          <button type="submit" className={styles.btnSuccess}>
                            ✓ Confirm Order
                          </button>
                        </div>
                      </>
                    )}

                    {activeAction === 'cancel' && (
                      <>
                        <div className={styles.formGrid}>
                          <div className={styles.formField}>
                            <label>Order Status</label>
                            <input type="text" value="Cancelled" readOnly />
                          </div>
                          <div className={styles.formField}>
                            <label>Cancellation Reason <span className={styles.required}>*</span></label>
                            <select required>
                              <option value="">Select Reason</option>
                              <option>Customer Request</option>
                              <option>Out of Stock</option>
                              <option>Payment Issue</option>
                              <option>Delivery Issue</option>
                              <option>Duplicate Order</option>
                              <option>Other</option>
                            </select>
                          </div>
                          <div className={`${styles.formField} ${styles.fullWidth}`}>
                            <label>Cancellation Notes <span className={styles.required}>*</span></label>
                            <textarea required rows="3"></textarea>
                          </div>
                        </div>
                        <div className={styles.formActions}>
                          <button type="button" onClick={() => setActiveAction(null)} className={styles.btnSecondary}>
                            Cancel
                          </button>
                          <button type="submit" className={styles.btnDanger}>
                            ✕ Cancel Order
                          </button>
                        </div>
                      </>
                    )}

                    {activeAction === 'false' && (
                      <>
                        <div className={styles.formGrid}>
                          <div className={styles.formField}>
                            <label>Order Status</label>
                            <input type="text" value="False Order" readOnly />
                          </div>
                          <div className={styles.formField}>
                            <label>False Order Reason <span className={styles.required}>*</span></label>
                            <select required>
                              <option value="">Select Reason</option>
                              <option>Fake Contact Details</option>
                              <option>Fraudulent Payment</option>
                              <option>Test Order</option>
                              <option>Spam</option>
                              <option>Invalid Address</option>
                              <option>Other</option>
                            </select>
                          </div>
                          <div className={`${styles.formField} ${styles.fullWidth}`}>
                            <label>Additional Details <span className={styles.required}>*</span></label>
                            <textarea required rows="3"></textarea>
                          </div>
                        </div>
                        <div className={styles.formActions}>
                          <button type="button" onClick={() => setActiveAction(null)} className={styles.btnSecondary}>
                            Cancel
                          </button>
                          <button type="submit" className={styles.btnGray}>
                            ⚠️ Mark as False Order
                          </button>
                        </div>
                      </>
                    )}
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
