import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    newOrders: 0,
    confirmed: 0,
    dispatched: 0,
    delivered: 0,
    paid: 0,
    totalRevenue: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

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
      
      if (!userData.moduleAccess?.dashboard) {
        alert('You do not have access to Dashboard');
        localStorage.removeItem('userSession');
        router.push('/login');
        return;
      }

      setUser(userData);
      loadDashboardData();
    } catch (error) {
      console.error('Error parsing user session:', error);
      localStorage.removeItem('userSession');
      router.push('/login');
    }
  }, [router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        const orders = data.orders || [];
        
        calculateStats(orders);
        setRecentActivity(orders.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orders) => {
    const pending = orders.filter(o => 
      o['Planned'] && o['Planned'].trim() !== '' && 
      (!o['Actual'] || o['Actual'].trim() === '')
    ).length;
    
    const confirmed = orders.filter(o => o['Order Status'] === 'Order Confirmed').length;
    
    const totalRevenue = orders.reduce((sum, o) => {
      const amount = parseFloat(o['Invoice Amount']) || 0;
      return sum + amount;
    }, 0);

    setStats({
      newOrders: pending,
      confirmed: confirmed,
      dispatched: 0,
      delivered: 0,
      paid: 0,
      totalRevenue: totalRevenue,
      pendingPayments: pending * 1000
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    router.push('/login');
  };

  const navigateToModule = (module) => {
    if (!user.moduleAccess?.[module]) {
      alert(`You do not have access to ${module}`);
      return;
    }
    
    const routes = {
      newOrders: '/neworders',
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

  if (!user || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const parseSheetDate = (dateValue) => {
  if (!dateValue || dateValue === '' || dateValue === ' ') return null;
  
  try {
    const value = dateValue.toString().trim();
    
    // Format: DD/MM/YYYY HH:MM:SS or DD/MM/YYYY
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
    
    return null;
  } catch (e) {
    return null;
  }
};

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

        <nav className={styles.navMenu}>
          <div className={`${styles.navItem} ${styles.active}`} onClick={closeSidebar}>
            <span className={styles.navIcon}>📊</span>
            <span className={styles.navText}>Dashboard</span>
          </div>
          
          {user.moduleAccess?.newOrders && (
            <div className={styles.navItem} onClick={() => { navigateToModule('newOrders'); closeSidebar(); }}>
              <span className={styles.navIcon}>📋</span>
              <span className={styles.navText}>New Orders</span>
              {stats.newOrders > 0 && (
                <span className={styles.badge}>{stats.newOrders}</span>
              )}
            </div>
          )}
          
          {user.moduleAccess?.dispatch && (
            <div className={styles.navItem} onClick={() => { navigateToModule('dispatch'); closeSidebar(); }}>
              <span className={styles.navIcon}>🚚</span>
              <span className={styles.navText}>Dispatch</span>
              {stats.dispatched > 0 && (
                <span className={styles.badge}>{stats.dispatched}</span>
              )}
            </div>
          )}
          
          {user.moduleAccess?.delivery && (
            <div className={styles.navItem} onClick={() => { navigateToModule('delivery'); closeSidebar(); }}>
              <span className={styles.navIcon}>📦</span>
              <span className={styles.navText}>Delivery</span>
              {stats.delivered > 0 && (
                <span className={styles.badge}>{stats.delivered}</span>
              )}
            </div>
          )}
          
          {user.moduleAccess?.payment && (
            <div className={styles.navItem} onClick={() => { navigateToModule('payment'); closeSidebar(); }}>
              <span className={styles.navIcon}>💰</span>
              <span className={styles.navText}>Payment</span>
              {stats.paid > 0 && (
                <span className={styles.badge}>{stats.paid}</span>
              )}
            </div>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <div className={styles.headerActions}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search..."
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
          {/* Welcome Section */}
          <div className={styles.welcomeSection}>
            <h2>Welcome back, {user.username}! 🌿</h2>
            <p>Here's what's happening with your orders today.</p>
          </div>

          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.statYellow}`} onClick={() => navigateToModule('newOrders')}>
              <div className={styles.statIcon}>📋</div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>New Orders</div>
                <div className={styles.statValue}>{stats.newOrders}</div>
                <div className={styles.statTrend}>↑ View Orders</div>
              </div>
            </div>
            
            <div className={`${styles.statCard} ${styles.statBlue}`}>
              <div className={styles.statIcon}>✅</div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Confirmed</div>
                <div className={styles.statValue}>{stats.confirmed}</div>
                <div className={styles.statTrend}>+12% from last week</div>
              </div>
            </div>
            
            <div className={`${styles.statCard} ${styles.statPurple}`} onClick={() => navigateToModule('dispatch')}>
              <div className={styles.statIcon}>🚚</div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Dispatched</div>
                <div className={styles.statValue}>{stats.dispatched}</div>
                <div className={styles.statTrend}>↑ View Dispatch</div>
              </div>
            </div>
            
            <div className={`${styles.statCard} ${styles.statGreen}`} onClick={() => navigateToModule('delivery')}>
              <div className={styles.statIcon}>📦</div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Delivered</div>
                <div className={styles.statValue}>{stats.delivered}</div>
                <div className={styles.statTrend}>↑ View Deliveries</div>
              </div>
            </div>
            
            <div className={`${styles.statCard} ${styles.statCyan}`} onClick={() => navigateToModule('payment')}>
              <div className={styles.statIcon}>💰</div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Total Revenue</div>
                <div className={styles.statValue}>₹{stats.totalRevenue.toLocaleString()}</div>
                <div className={styles.statTrend}>+8% from last month</div>
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statOrange}`}>
              <div className={styles.statIcon}>⏳</div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Pending Payments</div>
                <div className={styles.statValue}>₹{stats.pendingPayments.toLocaleString()}</div>
                <div className={styles.statTrend}>Follow-up required</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActionsSection}>
            <h3>Quick Actions</h3>
            <div className={styles.quickActionsGrid}>
              {user.moduleAccess?.newOrders && (
                <div className={styles.actionCard} onClick={() => navigateToModule('newOrders')}>
                  <div className={styles.actionIcon}>➕</div>
                  <div className={styles.actionTitle}>New Order</div>
                  <div className={styles.actionDesc}>Create a new order</div>
                </div>
              )}
              
              {user.moduleAccess?.newOrders && (
                <div className={styles.actionCard} onClick={() => navigateToModule('newOrders')}>
                  <div className={styles.actionIcon}>📋</div>
                  <div className={styles.actionTitle}>View Orders</div>
                  <div className={styles.actionDesc}>Manage all orders</div>
                </div>
              )}
              
              {user.moduleAccess?.dispatch && (
                <div className={styles.actionCard} onClick={() => navigateToModule('dispatch')}>
                  <div className={styles.actionIcon}>🚚</div>
                  <div className={styles.actionTitle}>Dispatch</div>
                  <div className={styles.actionDesc}>Manage dispatches</div>
                </div>
              )}
              
              {user.moduleAccess?.payment && (
                <div className={styles.actionCard} onClick={() => navigateToModule('payment')}>
                  <div className={styles.actionIcon}>💰</div>
                  <div className={styles.actionTitle}>Payments</div>
                  <div className={styles.actionDesc}>Track payments</div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className={styles.recentActivitySection}>
            <h3>Recent Activity</h3>
            <div className={styles.activityList}>
              {recentActivity.length === 0 ? (
                <div className={styles.emptyActivity}>No recent activity</div>
              ) : (
                recentActivity.map((order, idx) => (
                  <div key={idx} className={styles.activityItem}>
                    <div className={styles.activityIcon}>📦</div>
                    <div className={styles.activityContent}>
                      <div className={styles.activityTitle}>
                        Order {order['Oder ID']} - {order['Name of Client']}
                      </div>
  <div className={styles.activityTime}>
  {order['Timestamp'] ? (() => {
    const date = parseSheetDate(order['Timestamp']);
    return date ? date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }) : 'Recently';
  })() : 'Recently'}
</div>
                    </div>
                    <div className={styles.activityAmount}>
                      ₹{order['Invoice Amount'] || '0'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
