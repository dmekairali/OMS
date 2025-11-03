import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SetupDataService from '../services/SetupDataService';
import styles from '../styles/PartnershipTerms.module.css';

export default function PartnershipTerms() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState({
    productList: { headers: [], rows: [] },
    discountStructure: { headers: [], rows: [] },
    distributorList: { headers: [], rows: [] }
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
      
      // Get pre-loaded data
      if (SetupDataService.isLoaded()) {
        setData({
          productList: SetupDataService.getProductList(),
          discountStructure: SetupDataService.getDiscountStructure(),
          distributorList: SetupDataService.getDistributorList()
        });
      }
    } catch (error) {
      console.error('Error parsing user session:', error);
      localStorage.removeItem('userSession');
      router.push('/login');
    }
  }, [router]);

  const getFilteredData = () => {
    if (!activeView) return [];
    const currentData = data[activeView];
    if (!searchTerm) return currentData.rows;
    return SetupDataService.searchData(currentData, searchTerm);
  };

  const renderTable = (headers, rows) => {
    return (
      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              {headers.map((header, idx) => (
                <th key={idx}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className={styles.noData}>
                  No data found
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx}>
                  {headers.map((header, colIdx) => (
                    <td key={colIdx}>{row[header]}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  if (!user) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const currentData = activeView ? data[activeView] : null;
  const filteredRows = getFilteredData();

  return (
    <div className={styles.pageContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.logoSection}>
          <img src="/kairali-logo.png" alt="Kairali Products" className={styles.logoImage} />
        </div>

        <div className={styles.appName}>
          <span className={styles.appIcon}>📦</span>
          <span className={styles.appText}>OrderFlow</span>
        </div>

        <nav className={styles.navMenu}>
          <div className={styles.navItem} onClick={() => router.push('/dashboard')}>
            <span className={styles.navIcon}>📊</span>
            <span className={styles.navText}>Dashboard</span>
          </div>
          
          <div className={styles.navItem} onClick={() => router.push('/neworders')}>
            <span className={styles.navIcon}>📋</span>
            <span className={styles.navText}>New Orders</span>
          </div>

          <div className={`${styles.navItem} ${styles.active}`}>
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
            {!activeView && '🤝 Partnership & Terms'}
            {activeView === 'productList' && '📦 Product List'}
            {activeView === 'discountStructure' && '💰 Discount Structure'}
            {activeView === 'distributorList' && '🤝 Distributor List'}
          </h1>
          <div className={styles.headerActions}>
            {activeView && (
              <>
                <input
                  type="text"
                  placeholder="Search..."
                  className={styles.searchBox}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button 
                  className={styles.backButton}
                  onClick={() => {
                    setActiveView(null);
                    setSearchTerm('');
                  }}
                >
                  ← Back
                </button>
              </>
            )}
          </div>
        </header>

        <div className={styles.content}>
          {!activeView ? (
            <div className={styles.menuList}>
              <h2 className={styles.menuTitle}>Select an option:</h2>
              <ul className={styles.bulletList}>
                <li 
                  className={styles.bulletItem}
                  onClick={() => setActiveView('productList')}
                >
                  <span className={styles.bulletIcon}>📦</span>
                  <div className={styles.bulletContent}>
                    <h3>Product List</h3>
                    <p>View all products with details</p>
                  </div>
                  <span className={styles.arrow}>→</span>
                </li>

                <li 
                  className={styles.bulletItem}
                  onClick={() => setActiveView('discountStructure')}
                >
                  <span className={styles.bulletIcon}>💰</span>
                  <div className={styles.bulletContent}>
                    <h3>Discount Structure</h3>
                    <p>View discount rates and tiers</p>
                  </div>
                  <span className={styles.arrow}>→</span>
                </li>

                <li 
                  className={styles.bulletItem}
                  onClick={() => setActiveView('distributorList')}
                >
                  <span className={styles.bulletIcon}>🤝</span>
                  <div className={styles.bulletContent}>
                    <h3>Distributor List</h3>
                    <p>View all distributors and partners</p>
                  </div>
                  <span className={styles.arrow}>→</span>
                </li>
              </ul>
            </div>
          ) : (
            renderTable(currentData.headers, filteredRows)
          )}
        </div>
      </div>
    </div>
  );
}
