/**
 * Order Edit API Endpoint
 * Handles edit operations for orders including product details
 * Pre-loads all necessary data for faster editing
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
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

    // GET - Load order details with product information
    if (req.method === 'GET') {
      const { orderId } = req.query;

      if (!orderId) {
        return res.status(400).json({ error: 'orderId is required' });
      }

      // Get main order from NewOrders sheet
      const orderResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: orderSheetId,
        range: 'NewOrders!A8:CF1000',
      });

      const orderData = orderResponse.data.values;
      
      if (!orderData || orderData.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const headers = orderData[0];
      const rows = orderData.slice(1);
      
      // Find the specific order
      const orderRow = rows.find(row => row[2] === orderId); // Oder ID is column C (index 2)
      
      if (!orderRow) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Convert to object
      const order = {};
      headers.forEach((header, index) => {
        order[header] = orderRow[index] || '';
      });

      // Get SKU-wise order details from SKUWise-Orders sheet
      const skuSheetId = '14cRB5X8pT5ehb-kjRGOQ7qZfA-Sx1XzLCibwptU_DPQ';
      const skuResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: skuSheetId,
        range: 'SKUWise-Orders!B2:BA1000',
      });

      const skuData = skuResponse.data.values;
      const skuHeaders = skuData[0];
      const skuRows = skuData.slice(1);

      // Filter products for this order
      const products = skuRows
        .filter(row => row[1] === orderId) // Column C in SKU sheet
        .map(row => {
          const product = {};
          skuHeaders.forEach((header, index) => {
            product[header] = row[index] || '';
          });
          return product;
        });

      return res.status(200).json({
        success: true,
        order: order,
        products: products,
        rowIndex: rows.indexOf(orderRow) + 9 // Actual row in sheet
      });
    }

    // POST - Save edited order
    if (req.method === 'POST') {
      const { orderId, rowIndex, orderUpdates, products, splitProducts } = req.body;

      if (!orderId || !rowIndex) {
        return res.status(400).json({ error: 'orderId and rowIndex are required' });
      }

      // Update main order details
      if (orderUpdates && Object.keys(orderUpdates).length > 0) {
        // Get headers to find column positions
        const headersResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: orderSheetId,
          range: 'NewOrders!A8:CF8',
        });

        const headers = headersResponse.data.values[0];
        const updateData = [];

        Object.keys(orderUpdates).forEach(fieldName => {
          const colIndex = headers.indexOf(fieldName);
          if (colIndex !== -1) {
            const colLetter = columnIndexToLetter(colIndex);
            updateData.push({
              range: `NewOrders!${colLetter}${rowIndex}`,
              values: [[orderUpdates[fieldName]]]
            });
          }
        });

        if (updateData.length > 0) {
          await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: orderSheetId,
            requestBody: {
              valueInputOption: 'USER_ENTERED',
              data: updateData
            }
          });
        }
      }

      // Handle product updates (if needed in SKUWise-Orders sheet)
      // This would require additional logic based on your requirements

      return res.status(200).json({
        success: true,
        message: 'Order updated successfully'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Order Edit API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process request',
      details: error.message 
    });
  }
}

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
