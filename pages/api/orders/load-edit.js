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

    // Load main order
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

    // Load products from SKUWise-Orders
    let products = [];
    try {
      const productSheetId = '14cRB5X8pT5ehb-kjRGOQ7qZfA-Sx1XzLCibwptU_DPQ';
      const productResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: productSheetId,
        range: 'SKUWise-Orders!A1:BF',
      });

      const productData = productResponse.data.values;
      if (productData && productData.length > 0) {
        const productHeaders = productData[0];
        const orderProducts = productData.slice(1).filter(row => {
          const orderIdCol = productHeaders.indexOf('Order ID') !== -1 ? 
            productHeaders.indexOf('Order ID') : 
            productHeaders.indexOf('Oder ID');
          return row[orderIdCol] === orderId;
        });

        products = orderProducts.map(row => {
          const product = {};
          productHeaders.forEach((header, index) => {
            product[header] = row[index] || '';
          });
          return product;
        });
      }
    } catch (error) {
      console.log('SKUWise-Orders sheet not available');
    }

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
