import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0
  });

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

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders');
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        
        // Calculate stats
        const total = data.orders?.length || 0;
        const pending = data.orders?.filter(o => o.Status === 'Pending').length || 0;
        const processing = data.orders?.filter(o => o.Status === 'Processing').length || 0;
        const completed = data.orders?.filter(o => o.Status === 'Completed' || o.Status === 'Delivered').length || 0;
        
        setStats({ total, pending, processing, completed });
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    router.push('/login');
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
          <span className={styles.logo}>📦</span>
          <h1>OrderFlow</h1>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user.username}</span>
            <span className={styles.userRole}>{user.role}</span>
          </div>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Welcome Section */}
        <div className={styles.welcomeSection}>
          <h2>Welcome back, {user.username}! 👋</h2>
          <p>Here's what's happening with your orders today.</p>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statInfo}>
              <h3>Total Orders</h3>
              <p className={styles.statNumber}>{stats.total}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏳</div>
            <div className={styles.statInfo}>
              <h3>Pending</h3>
              <p className={styles.statNumber}>{stats.pending}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔄</div>
            <div className={styles.statInfo}>
              <h3>Processing</h3>
              <p className={styles.statNumber}>{stats.processing}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statInfo}>
              <h3>Completed</h3>
              <p className={styles.statNumber}>{stats.completed}</p>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className={styles.ordersSection}>
          <div className={styles.sectionHeader}>
            <h3>Recent Orders</h3>
            <button className={styles.refreshButton} onClick={loadOrders}>
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <div className={styles.loadingOrders}>
              <div className="spinner"></div>
              <p>Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className={styles.emptyState}>
              <p>📦 No orders yet</p>
              <p className={styles.emptyStateSubtext}>Orders will appear here once they are created</p>
            </div>
          ) : (
            <div className={styles.ordersTable}>
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map((order, index) => (
                    <tr key={index}>
                      <td>
                        <span className={styles.orderId}>{order['Order ID']}</span>
                      </td>
                      <td>{order['Customer Name'] || order.Customer}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[`status${order.Status}`]}`}>
                          {order.Status}
                        </span>
                      </td>
                      <td>{order['Order Date'] ? new Date(order['Order Date']).toLocaleDateString() : '-'}</td>
                      <td>₹{order['Total Amount'] || order.Total || '0'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <h3>Quick Actions</h3>
          <div className={styles.actionsGrid}>
            <button className={styles.actionButton}>
              <span className={styles.actionIcon}>➕</span>
              <span>New Order</span>
            </button>
            <button className={styles.actionButton}>
              <span className={styles.actionIcon}>📦</span>
              <span>View All Orders</span>
            </button>
            <button className={styles.actionButton}>
              <span className={styles.actionIcon}>🚚</span>
              <span>Dispatch</span>
            </button>
            <button className={styles.actionButton}>
              <span className={styles.actionIcon}>💰</span>
              <span>Payments</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
