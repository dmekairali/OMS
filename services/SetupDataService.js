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

  async fetchSheetData(sheetName, range) {
    const spreadsheetId = process.env.REACT_APP_GOOGLE_SHEETS_SPREADSHEET_ID_SETUPSHEET;
    const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!${range}?key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${sheetName}`);
    
    const data = await response.json();
    return data.values || [];
  }

  async loadAllData() {
    if (this.loaded) return this.data;

    const [productList, discountStructure, distributorList] = await Promise.all([
      this.fetchSheetData('Product List', 'A1:H'),
      this.fetchSheetData('Discount Module', 'A1:N'),
      this.fetchSheetData('Distributor List', 'A1:H')
    ]);

    this.data = {
      productList: this.parseData(productList),
      discountStructure: this.parseData(discountStructure),
      distributorList: this.parseData(distributorList)
    };

    this.loaded = true;
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
}

export default new SetupDataService();
