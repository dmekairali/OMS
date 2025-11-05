/**
 * Purchase Orders API
 * Fetches data from purchase orders spreadsheet
 * Sheet ID: 1Ht-S_T5aZCvXLVriud5Vdr4R562RNKlxh6kCJTjQ5QU
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId } = req.query;
    const startTime = Date.now();
    
    const { google } = require('googleapis');
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const purchaseSheetId = '1Ht-S_T5aZCvXLVriud5Vdr4R562RNKlxh6kCJTjQ5QU';
    
    const fetchStart = Date.now();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: purchaseSheetId,
      range: 'MROrdersSKU!A1:Z', // Adjust sheet name if different
    });
    const fetchTime = Date.now() - fetchStart;

    const data = response.data.values;
    
    if (!data || data.length === 0) {
      return res.status(200).json({
        success: true,
        orders: [],
        timing: {
          total: Date.now() - startTime,
          fetch: fetchTime,
          processing: 0
        }
      });
    }

    const processStart = Date.now();
    const headers = data[0];
    const rows = data.slice(1);
    
    const orders = rows.map(row => {
      const order = {};
      headers.forEach((header, index) => {
        order[header] = row[index] || '';
      });
      return order;
    });

    // Filter by orderId if provided
    let filteredOrders = orders;
    if (orderId) {
      filteredOrders = orders.filter(order => order['Oder ID'] === orderId);
      
      if (filteredOrders.length === 0) {
        const processTime = Date.now() - processStart;
        const totalTime = Date.now() - startTime;
        return res.status(404).json({
          success: false,
          error: 'Order not found',
          orderId: orderId,
          timing: {
            total: totalTime,
            fetch: fetchTime,
            processing: processTime
          }
        });
      }
    }
    
    const processTime = Date.now() - processStart;
    const totalTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      count: filteredOrders.length,
      orders: filteredOrders,
      timing: {
        total: totalTime,
        fetch: fetchTime,
        processing: processTime
      }
    });

  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch purchase orders',
      details: error.message 
    });
  }
}
