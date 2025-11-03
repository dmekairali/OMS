import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SetupDataService from '../services/SetupDataService';
import styles from '../styles/PartnershipTerms.module.css';

export default function PartnershipTerms() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // 50 items per page for Client List
  const [data, setData] = useState({
    productList: { headers: [], rows: [] },
    discountStructure: { headers: [], rows: [] },
    distributorList: { headers: [], rows: [] },
    employeeList: { headers: [], rows: [] },
    clientList: { headers: [], rows: [] }
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
          distributorList: SetupDataService.getDistributorList(),
          employeeList: SetupDataService.getEmployeeList(),
          clientList: SetupDataService.getClientList()
        });
      }
    } catch (error) {
      console.error('Error parsing user session:', error);
      localStorage.removeItem('userSession');
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    // Reset to page 1 when view changes
    setCurrentPage(1);
    setSearchTerm('');
  }, [activeView]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const getFilteredData = () => {
    if (!activeView) return [];
    const currentData = data[activeView];
    if (!searchTerm) return currentData.rows;
    return SetupDataService.searchData(currentData, searchTerm);
  };

  const getPaginatedData = () => {
    const filteredRows = getFilteredData();
    
    // Only apply pagination for clientList
    if (activeView === 'clientList') {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredRows.slice(startIndex, endIndex);
    }
    
    return filteredRows;
  };

  const getTotalPages = () => {
    if (activeView !== 'clientList') return 1;
    const filteredRows = getFilteredData();
    return Math.ceil(filteredRows.length / itemsPerPage);
  };

  const handleNextPage = () => {
    const totalPages = getTotalPages();
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const renderPagination = () => {
    if (activeView !== 'clientList') return null;
    
    const totalPages = getTotalPages();
    const filteredRows = getFilteredData();
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredRows.length);
    
    return (
      <div className={styles.paginationContainer}>
        <div className={styles.paginationInfo}>
          Showing {startIndex} to {endIndex} of {filteredRows.length} entries
        </div>
        <div className={styles.paginationButtons}>
          <button 
            className={styles.paginationButton}
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button 
            className={styles.paginationButton}
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      </div>
    );
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
        {renderPagination()}
      </div>
    );
  };

  if (!user) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const currentData = activeView ? data[activeView] : null;
  const paginatedRows = getPaginatedData();

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

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.logoSection}>
          <img src="/kairali-logo.png" alt="Kairali Products" className={styles.logoImage} />
        </div>

        <div className={styles.appName}>
          <span className={styles.appIcon}>📦</span>
          <span className={styles.appText}>OrderFlow</span>
        </div>

        <nav className={styles.navMenu}>
          <div className={styles.navItem} onClick={() => { router.push('/dashboard'); closeSidebar(); }}>
            <span className={styles.navIcon}>📊</span>
            <span className={styles.navText}>Dashboard</span>
          </div>
          
          {user.moduleAccess?.newOrders && (
            <div className={styles.navItem} onClick={() => { router.push('/neworders'); closeSidebar(); }}>
              <span className={styles.navIcon}>📋</span>
              <span className={styles.navText}>New Orders</span>
            </div>
          )}

          {user.moduleAccess?.dispatch && (
            <div className={styles.navItem} onClick={() => { router.push('/dispatch'); closeSidebar(); }}>
              <span className={styles.navIcon}>🚚</span>
              <span className={styles.navText}>Dispatch</span>
            </div>
          )}

          {user.moduleAccess?.delivery && (
            <div className={styles.navItem} onClick={() => { router.push('/delivery'); closeSidebar(); }}>
              <span className={styles.navIcon}>📦</span>
              <span className={styles.navText}>Delivery</span>
            </div>
          )}

          {user.moduleAccess?.payment && (
            <div className={styles.navItem} onClick={() => { router.push('/payment'); closeSidebar(); }}>
              <span className={styles.navIcon}>💰</span>
              <span className={styles.navText}>Payment</span>
            </div>
          )}

          <div className={`${styles.navItem} ${styles.active}`} onClick={closeSidebar}>
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
            {activeView === 'employeeList' && '👥 Employee List'}
            {activeView === 'clientList' && '👤 Client List'}
          </h1>
          <div className={styles.headerActions}>
            {activeView && (
              <>
                <input
                  type="text"
                  placeholder="Search..."
                  className={styles.searchBox}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to page 1 on search
                  }}
                />
                <button 
                  className={styles.backButton}
                  onClick={() => {
                    setActiveView(null);
                    setSearchTerm('');
                    setCurrentPage(1);
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

                <li 
                  className={styles.bulletItem}
                  onClick={() => setActiveView('employeeList')}
                >
                  <span className={styles.bulletIcon}>👥</span>
                  <div className={styles.bulletContent}>
                    <h3>Employee List</h3>
                    <p>View all employees and staff</p>
                  </div>
                  <span className={styles.arrow}>→</span>
                </li>

                <li 
                  className={styles.bulletItem}
                  onClick={() => setActiveView('clientList')}
                >
                  <span className={styles.bulletIcon}>👤</span>
                  <div className={styles.bulletContent}>
                    <h3>Client List</h3>
                    <p>View all clients with pagination</p>
                  </div>
                  <span className={styles.arrow}>→</span>
                </li>
              </ul>
            </div>
          ) : (
            renderTable(currentData.headers, paginatedRows)
          )}
        </div>
      </div>
    </div>
  );
}
