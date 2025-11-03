// services/SetupDataService.js
class SetupDataService {
  constructor() {
    this.data = {
      productList: { headers: [], rows: [] },
      discountStructure: { headers: [], rows: [] },
      distributorList: { headers: [], rows: [] },
      employeeList: { headers: [], rows: [] },
      clientList: { headers: [], rows: [] }
    };
    this.loaded = false;
  }

  async loadData() {
    try {
      const response = await fetch('/api/setup-data');
      const result = await response.json();
      
      if (result.success) {
        this.data = result.data;
        this.loaded = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading setup data:', error);
      return false;
    }
  }

  isLoaded() {
    return this.loaded;
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

  searchData(dataObj, searchTerm) {
    if (!searchTerm) return dataObj.rows;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return dataObj.rows.filter(row => {
      return Object.values(row).some(value => 
        String(value).toLowerCase().includes(lowerSearchTerm)
      );
    });
  }
}

// Export a singleton instance
const setupDataServiceInstance = new SetupDataService();
export default setupDataServiceInstance;
