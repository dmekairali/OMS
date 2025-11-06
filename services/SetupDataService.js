// services/SetupDataService.js
class SetupDataService {
  constructor() {
    this.data = {
      productList: { headers: [], rows: [] },
      discountStructure: { headers: [], rows: [] },
      distributorList: { headers: [], rows: [] },
      employeeList: { headers: [], rows: [] },
      clientList: { headers: [], rows: [] },
      orderArchive: { headers: [], rows: [] }
    };
    this.loaded = false;
  }

  async loadAllData() {
    if (this.loaded) {
      console.log('Data already loaded');
      return this.data;
    }

    console.log('Loading setup data from API...');
    
    try {
      const response = await fetch('/api/setup-data');
      
      if (!response.ok) {
        throw new Error('Failed to fetch setup data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        this.data = result.data;
        this.loaded = true;
        
        console.log('✓ Setup data loaded:', {
          productList: this.data.productList.rows.length + ' rows',
          discountStructure: this.data.discountStructure.rows.length + ' rows',
          distributorList: this.data.distributorList.rows.length + ' rows',
          employeeList: this.data.employeeList.rows.length + ' rows',
          clientList: this.data.clientList.rows.length + ' rows',
          orderArchive: this.data.orderArchive.rows.length + ' rows'
        });
      }
    } catch (error) {
      console.error('Error loading setup data:', error);
      this.loaded = true; // Mark as loaded to prevent retry loops
    }

    return this.data;
  }

  searchData(dataset, searchTerm) {
    if (!searchTerm) return dataset.rows;
    
    const term = searchTerm.toLowerCase();
    return dataset.rows.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(term)
      )
    );
  }

  getProductList() {
    return this.data.productList;
  }

  getDiscountStructure() {
    return this.data.discountStructure;
  }

  getDistributorList() {
    return this.data.distributorList;
  }

  getEmployeeList() {
    return this.data.employeeList;
  }

  getClientList() {
    return this.data.clientList;
  }

  getOrderArchive() {
    return this.data.orderArchive;
  }

  /**
   * Get client order history by mobile number
   * Returns last N confirmed orders with specific fields
   * 
   * @param {string} mobile - Client mobile number
   * @param {string} currentOrderId - Current order ID to exclude (optional)
   * @param {number} limit - Number of orders to return (default: 3)
   * @returns {Array} Array of order history objects
   */
  getClientOrderHistory(mobile, currentOrderId = null, limit = 3) {
    if (!this.data.orderArchive || !this.data.orderArchive.rows) {
      console.warn('⚠️ Order archive not loaded');
      return [];
    }

    const confirmedOrders = this.data.orderArchive.rows
      .filter(order => {
        const orderMobile = order['Mobile'];
        const orderStatus = order['Order Status'];
        const orderId = order['Oder ID'];
        
        // Filter criteria:
        // 1. Same mobile number
        // 2. Order Confirmed status
        // 3. Not the current order (if provided)
        const matchesMobile = orderMobile === mobile || orderMobile === String(mobile);
        const isConfirmed = orderStatus === 'Order Confirmed';
        const isNotCurrent = !currentOrderId || orderId !== currentOrderId;
        
        return matchesMobile && isConfirmed && isNotCurrent;
      })
      .sort((a, b) => {
        // Sort by Timestamp descending (newest first)
        const dateA = new Date(a['Timestamp'] || 0);
        const dateB = new Date(b['Timestamp'] || 0);
        return dateB - dateA;
      })
      .slice(0, limit)
      .map(order => ({
        // Core fields
        orderId: order['Oder ID'],
        orderDate: order['Timestamp'],
        invoiceAmount: order['Invoice Amount'],
        orderTakenBy: order['Order Taken By'],
        dispatchPartyFrom: order['Dispatch Party From*'],
        
        // Additional fields from your requirements
        buyerId: order['Buyer ID'],
        clientName: order['Name of Client'],
        mobile: order['Mobile'],
        clientCategory: order['Client Category'],
        clientType: order['Client Type'],
        billingAddress: order['Billing Address'],
        shippingAddress: order['Shipping Address'],
        pinCode: order['Pin code'],
        otherAddress: order['Other Address'],
        deliveryRequiredDate: order['Delivery Required Date'],
        deliveryPartyFrom: order['Delivery Party From'],
        paymentTerms: order['Payment Terms'],
        paymentDateToBePaid: order['Payment Date (to be paid)'],
        planned: order['Planned'],
        actual: order['Actual'],
        timeDelay: order['Time Delay'],
        pobNo: order['POB No*'],
        pobUrl: order['POB URL*'],
        doerName: order['Doer Name'],
        orderStatus: order['Order Status'],
        remarks: order['Remarks*'],
        paymentDate: order['Payment Date'],
        paymentConfirmationType: order['Payment Confirmation Type'],
        expectedDispatchDateTime: order['Expected Date and time of the Dispatch'],
        dispatchStatus: order['Dispatch Status']
      }));

    console.log(`📋 Found ${confirmedOrders.length} order(s) for mobile: ${mobile}`);
    return confirmedOrders;
  }

  /**
   * Get statistics for order archive
   * @returns {Object} Statistics object
   */
  getOrderArchiveStats() {
    if (!this.data.orderArchive || !this.data.orderArchive.rows) {
      return {
        total: 0,
        confirmed: 0,
        uniqueClients: 0
      };
    }

    const rows = this.data.orderArchive.rows;
    const confirmed = rows.filter(order => order['Order Status'] === 'Order Confirmed');
    const uniqueMobiles = new Set(rows.map(order => order['Mobile']).filter(Boolean));

    return {
      total: rows.length,
      confirmed: confirmed.length,
      uniqueClients: uniqueMobiles.size
    };
  }

  isLoaded() {
    return this.loaded;
  }
}

export default new SetupDataService();
