/**
 * Orders API Endpoint
 * Handles CRUD operations for NewOrders sheet
 * Uses ORDERSHEET spreadsheet
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get ORDERSHEET spreadsheet ID from environment (contains NewOrders)
    const orderSheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID_ORDERSHEET;
    
    if (!orderSheetId) {
      return res.status(500).json({ error: 'Order spreadsheet configuration missing' });
    }

    const { google } = require('googleapis');
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // GET - Read all orders
    if (req.method === 'GET') {
      const { orderId } = req.query;

      const sheetsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: orderSheetId,
        range: 'NewOrders!A:Z',
      });

      const ordersData = sheetsResponse.data.values;
      
      if (!ordersData || ordersData.length === 0) {
        return res.status(200).json({ 
          success: true,
          orders: [],
          count: 0
        });
      }

      // Convert to objects
      const headers = ordersData[0];
      const rows = ordersData.slice(1);
      
      const orders = rows.map((row, index) => {
        const obj = { _rowIndex: index + 2 }; // +2 for header and 1-based index
        headers.forEach((header, colIndex) => {
          obj[header] = row[colIndex] || '';
        });
        return obj;
      });

      // If specific order requested, filter
      if (orderId) {
        const order = orders.find(o => o['Order ID'] === orderId);
        if (!order) {
          return res.status(404).json({ error: 'Order not found' });
        }
        return res.status(200).json({
          success: true,
          order: order
        });
      }

      return res.status(200).json({
        success: true,
        orders: orders,
        count: orders.length,
        headers: headers
      });
    }

    // POST - Create new order
    if (req.method === 'POST') {
      const orderData = req.body;

      if (!orderData) {
        return res.status(400).json({ error: 'Order data required' });
      }

      // Append to sheet
      const result = await sheets.spreadsheets.values.append({
        spreadsheetId: orderSheetId,
        range: 'NewOrders!A:Z',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [orderData]
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Order created successfully',
        updatedRange: result.data.updates.updatedRange,
        updatedRows: result.data.updates.updatedRows
      });
    }

    // PUT - Update existing order
    if (req.method === 'PUT') {
      const { orderId, rowIndex, updates } = req.body;

      if (!rowIndex || !updates) {
        return res.status(400).json({ error: 'rowIndex and updates required' });
      }

      // First, get current data to find column indices
      const headersResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: orderSheetId,
        range: 'NewOrders!A1:Z1',
      });

      const headers = headersResponse.data.values[0];

      // Build update requests for each field
      const updateData = [];
      Object.keys(updates).forEach(fieldName => {
        const colIndex = headers.indexOf(fieldName);
        if (colIndex !== -1) {
          const colLetter = String.fromCharCode(65 + colIndex); // A=65
          updateData.push({
            range: `NewOrders!${colLetter}${rowIndex}`,
            values: [[updates[fieldName]]]
          });
        }
      });

      if (updateData.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      // Batch update
      const result = await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: orderSheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: updateData
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Order updated successfully',
        updatedCells: result.data.totalUpdatedCells
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Orders API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message 
    });
  }
}
