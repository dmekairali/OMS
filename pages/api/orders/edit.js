/**
 * Edit Order API Endpoint
 * Handles loading order details with products and updating order status for Edit/Split actions
 */

import { requireAuth } from '../../../lib/auth-middleware';

export default async function handler(req, res) {
  const session = await requireAuth(req, res);
  if (!session) return;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
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

    // GET - Load order with products
    if (req.method === 'GET') {
      const { orderId } = req.query;

      if (!orderId) {
        return res.status(400).json({ error: 'orderId is required' });
      }

      // Read order from NewOrders sheet
      const ordersResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: orderSheetId,
        range: 'NewOrders!A8:CF1000',
      });

      const ordersData = ordersResponse.data.values;
      
      if (!ordersData || ordersData.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const headers = ordersData[0];
      const rows = ordersData.slice(1);
      
      // Find the order
      const orderRow = rows.find(row => row[headers.indexOf('Oder ID')] === orderId);
      
      if (!orderRow) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = {};
      headers.forEach((header, index) => {
        order[header] = orderRow[index] || '';
      });

      // Try to read products from SKUWise-Orders sheet
      let products = [];
      
      try {
        const productsResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: orderSheetId,
          range: 'SKUWise-Orders!A1:Z1000', // Adjust range as needed
        });

        const productsData = productsResponse.data.values;
        
        if (productsData && productsData.length > 0) {
          const productHeaders = productsData[0];
          const productRows = productsData.slice(1);
          
          // Filter products for this order ID
          const orderProducts = productRows.filter(row => {
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
        console.log('SKUWise-Orders sheet not found or error reading:', error.message);
        // Continue without products - not a critical error
      }

      return res.status(200).json({
        success: true,
        order: order,
        products: products
      });
    }

    // POST - Save edited order (only updates NewOrders: status, remarks, audit fields)
    if (req.method === 'POST') {
      const { orderId, rowIndex, editStatus, remarks, username, products, editMode } = req.body;

      if (!orderId || !rowIndex || !editStatus || !remarks) {
        return res.status(400).json({ error: 'orderId, rowIndex, editStatus, and remarks are required' });
      }

      // Prepare column updates
      const columnUpdates = {};
      
      // Update Order Status (column 45 = AS)
      columnUpdates[45] = editStatus;
      
      // Update Remarks (column 47 = AU)
      columnUpdates[47] = remarks;
      
      // Update Last Edited By (column 78 = BZ)
      columnUpdates[78] = username;
      
      // Update Last Edited At (column 79 = CA)
      columnUpdates[79] = new Date().toISOString();

      // Build update requests
      const updateData = [];
      Object.keys(columnUpdates).forEach(columnNumber => {
        const colLetter = columnIndexToLetter(parseInt(columnNumber) - 1);
        updateData.push({
          range: `NewOrders!${colLetter}${rowIndex}`,
          values: [[columnUpdates[columnNumber]]]
        });
      });

      // Batch update NewOrders sheet
      const result = await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: orderSheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: updateData
        }
      });

      // TODO: In future, save products to separate "Order Edits" sheet
      // For now, just acknowledge product data was received
      console.log('Products data received for future processing:', {
        orderId: orderId,
        editMode: editMode,
        productCount: products ? products.length : 0
      });

      return res.status(200).json({
        success: true,
        message: 'Order updated successfully',
        updatedCells: result.data.totalUpdatedCells,
        updatedFields: {
          'Order Status': editStatus,
          'Remarks*': remarks,
          'Last Edited By': username,
          'Last Edited At': columnUpdates[79]
        }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Edit Order API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message 
    });
  }
}

/**
 * Convert column index (0-based) to Excel-style letter
 */
function columnIndexToLetter(index) {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode(65 + (index % 26)) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

export const config = {
  api: {
    responseLimit: false,
  },
};
