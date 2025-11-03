// services/SetupDataService.js

// CONFIGURE YOUR ACTUAL SHEET NAMES HERE
// Open your Google Sheet and check the exact tab names at the bottom
const SHEET_CONFIG = {
  productList: {
    sheetName: 'Product List',  // Change if different
    range: 'A1:H'
  },
  discountStructure: {
    sheetName: 'Discount Module',  // Change if different
    range: 'A1:N'
  },
  distributorList: {
    sheetName: 'Distributor List',  // Change if different
    range: 'A1:H'
  }
};

class SetupDataService {
  constructor() {
    this.data = {
      productList: { headers: [], rows: [] },
      discountStructure: { headers: [], rows: [] },
      distributorList: { headers: [], rows: [] }
    };
    this.loaded = false;
  }

  async fetchSheetData(sheetName, range) {
    const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_SETUPSHEET;
    const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
    
    if (!spreadsheetId || !apiKey) {
      console.error('Missing environment variables');
      return [];
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!${range}?key=${apiKey}`;
    
    console.log(`Fetching: ${sheetName}`);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch "${sheetName}":`, response.status, errorText);
        return [];
      }
      
      const data = await response.json();
      console.log(`✓ Successfully fetched "${sheetName}": ${data.values?.length || 0} rows`);
      return data.values || [];
    } catch (error) {
      console.error(`Error fetching "${sheetName}":`, error);
      return [];
    }
  }

  async loadAllData() {
    if (this.loaded) {
      console.log('Data already loaded');
      return this.data;
    }

    console.log('Loading setup data...');
    
    try {
      const [productList, discountStructure, distributorList] = await Promise.all([
        this.fetchSheetData(SHEET_CONFIG.productList.sheetName, SHEET_CONFIG.productList.range),
        this.fetchSheetData(SHEET_CONFIG.discountStructure.sheetName, SHEET_CONFIG.discountStructure.range),
        this.fetchSheetData(SHEET_CONFIG.distributorList.sheetName, SHEET_CONFIG.distributorList.range)
      ]);

      this.data = {
        productList: this.parseData(productList),
        discountStructure: this.parseData(discountStructure),
        distributorList: this.parseData(distributorList)
      };

      this.loaded = true;
      console.log('✓ Setup data loaded:', {
        productList: this.data.productList.rows.length + ' rows',
        discountStructure: this.data.discountStructure.rows.length + ' rows',
        distributorList: this.data.distributorList.rows.length + ' rows'
      });
    } catch (error) {
      console.error('Error in loadAllData:', error);
      this.loaded = true;
    }

    return this.data;
  }

  parseData(rawData) {
    if (!rawData || rawData.length === 0) return { headers: [], rows: [] };
    
    const headers = rawData[0];
    const rows = rawData.slice(1);
    
    return {
      headers,
      rows: rows.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      })
    };
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

  // Debug helper - call this to see available sheets
  async listAvailableSheets() {
    const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_SETUPSHEET;
    const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      const sheets = data.sheets.map(s => s.properties.title);
      console.log('📋 Available sheets in your spreadsheet:', sheets);
      return sheets;
    } catch (error) {
      console.error('Error listing sheets:', error);
      return [];
    }
  }
}

export default new SetupDataService();
