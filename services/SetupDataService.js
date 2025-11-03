// services/SetupDataService.js
class SetupDataService {
  constructor() {
    this.data = {
      productList: { headers: [], rows: [] },
      discountStructure: { headers: [], rows: [] },
      distributorList: { headers: [], rows: [] }
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
          distributorList: this.data.distributorList.rows.length + ' rows'
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

  isLoaded() {
    return this.loaded;
  }
}

export default new SetupDataService();
