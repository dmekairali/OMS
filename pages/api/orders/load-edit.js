/**
 * Load Edit Order API Endpoint
 * Loads order details and products from SKUWise-Orders sheet
 * Uses COLUMN INDEX mapping for accurate data extraction
 */

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId } = req.query;
    
    if (!orderId) {
      return res.status(400).json({ error: 'orderId required' });
    }

    const orderSheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID_ORDERSHEET;
    const { google } = require('googleapis');
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // ============================================
    // STEP 1: Load main order from NewOrders sheet
    // ============================================
    const orderResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: orderSheetId,
      range: 'NewOrders!A8:CF1000',
    });

    const orderData = orderResponse.data.values;
    const headers = orderData[0];
    
    const orderRow = orderData.slice(1).find(row => {
      const orderIdCol = headers.indexOf('Oder ID');
      return row[orderIdCol] === orderId;
    });

    if (!orderRow) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = {};
    headers.forEach((header, index) => {
      order[header] = orderRow[index] || '';
    });

    // ============================================
    // STEP 2: Load products from SKUWise-Orders sheet
    // Using COLUMN INDEX mapping (not header names)
    // ============================================
    let products = [];
    
    try {
      const productSheetId = '14cRB5X8pT5ehb-kjRGOQ7qZfA-Sx1XzLCibwptU_DPQ';
      
      console.log('Loading products for order:', orderId);
      
      // Load entire data range (B2:BZ to cover all columns)
      const productResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: productSheetId,
        range: 'SKUWise-Orders!B2:BZ', // Start from B2 (skip row 1 header)
      });

      const productData = productResponse.data.values;
      
      if (!productData || productData.length === 0) {
        console.log('No data found in SKUWise-Orders sheet');
        return res.status(200).json({
          success: true,
          order,
          products: []
        });
      }

      console.log(`Found ${productData.length} total rows in SKUWise-Orders`);

      // Filter rows where Column C (index [1] in B-based array) matches orderId
      // Note: Since we start from column B, indices shift by 1
      // Column C (Order ID) = index 1 in our B-based array
      const orderProducts = productData.filter(row => {
        return row[1] === orderId; // Column C (Order ID)
      });

      console.log(`Found ${orderProducts.length} products for order ${orderId}`);

      if (orderProducts.length === 0) {
        console.log('No products found for this order');
        return res.status(200).json({
          success: true,
          order,
          products: []
        });
      }

      // ============================================
      // STEP 3: Map products using COLUMN INDICES
      // Since we start from column B (index 0), adjust all indices by -1
      // ============================================
      products = orderProducts.map((row, idx) => {
        console.log(`Mapping product ${idx + 1}:`, {
          orderId: row[1],
          productName: row[14], // Column Q - 1
          quantity: row[9],     // Column L - 1
          sku: row[52]          // Column BG - 1
        });

        return {
          // Core Product Info
          'Product Name': row[14] || '',           // Column Q (index 15 - 1 = 14)
          'SKU Code': row[52] || '',               // Column BG (index 53 - 1 = 52)
          'MRP': parseFloat(row[10]) || 0,         // Column M (index 11 - 1 = 10)
          'Packing Size': row[26] || '',           // Column AC (index 27 - 1 = 26)
          
          // QUANTITY - Most Important Field
          'Quantity': parseFloat(row[9]) || 0,     // Column L (index 10 - 1 = 9) ← KEY
          'QNT': parseFloat(row[9]) || 0,          // Also map as QNT for compatibility
          'Order QTY': parseFloat(row[9]) || 0,    // Original quantity for reference
          
          // Pricing & Discounts
          'Discount %': parseFloat(row[25]) || 0,  // Column AA (index 26 - 1 = 25)
          'Discount Amount': parseFloat(row[12]) || 0,  // Column N (index 13 - 1 = 12)
          
          // Tax Calculations
          'Before Tax': parseFloat(row[27]) || 0,  // Column AD (index 28 - 1 = 27)
          'After Discount': parseFloat(row[28]) || 0,  // Column AE (index 29 - 1 = 28)
          
          // Line Total
          'Total': parseFloat(row[13]) || 0,       // Column O (index 14 - 1 = 13)
          
          // Additional fields for edit/split
          'Split Quantity': 0  // Default to 0 for split orders
        };
      });

      console.log('Successfully mapped products:', products.length);
      console.log('Sample product:', products[0]);

    } catch (error) {
      console.error('Error loading products from SKUWise-Orders:', error);
      // Don't fail the entire request if products can't be loaded
      console.log('Continuing without products');
    }

    // ============================================
    // STEP 4: Return complete order data
    // ============================================
    return res.status(200).json({
      success: true,
      order,
      products
    });

  } catch (error) {
    console.error('Load edit error:', error);
    return res.status(500).json({ 
      error: 'Failed to load order',
      details: error.message 
    });
  }
}
