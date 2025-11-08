/**
 * Orders API Endpoint
 * Handles CRUD operations for NewOrders sheet
 * Uses ORDERSHEET spreadsheet
 * 
 * IMPORTANT: NewOrders sheet has:
 * - Header row at row 8
 * - Data starts at row 9
 * - 84 columns total (A to CF)
 * - Order Status in column 45 (AS)
 * 
 * OPTIMIZED: Now uses direct column numbers instead of header lookup
 */

import { requireAuth } from '../../lib/auth-middleware';

export default async function handler(req, res) {
  const session = await requireAuth(req, res);
  if (!session) return;
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

      // NewOrders has header at row 8, data starts at row 9
      // 84 columns total (A to CF)
      const sheetsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: orderSheetId,
        range: 'NewOrders!A8:CF1000', // Header at row 8, read up to row 1000
      });

      const ordersData = sheetsResponse.data.values;
      
      if (!ordersData || ordersData.length === 0) {
        return res.status(200).json({ 
          success: true,
          orders: [],
          count: 0,
          headers: []
        });
      }

      // First row (index 0) is the header from row 8
      const headers = ordersData[0];
      // Data rows start from index 1 (which is row 9 in the sheet)
      const rows = ordersData.slice(1);
      
      const orders = rows.map((row, index) => {
        const obj = { 
          _rowIndex: index + 9, // Actual row number in sheet (data starts at row 9)
          _arrayIndex: index  // Index in the data array
        };
        headers.forEach((header, colIndex) => {
          obj[header] = row[colIndex] || '';
        });
        return obj;
      }).filter(order => order['Oder ID'] && order['Oder ID'].toString().trim() !== ''); // Filter out empty rows

      // If specific order requested, filter
      if (orderId) {
        const order = orders.find(o => o['Oder ID'] === orderId);
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

      if (!orderData || !Array.isArray(orderData)) {
        return res.status(400).json({ error: 'Order data must be an array' });
      }

      // Append to sheet (will add after last row with data)
      const result = await sheets.spreadsheets.values.append({
        spreadsheetId: orderSheetId,
        range: 'NewOrders!A9', // Start appending from row 9 (data row)
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
      const { orderId, rowIndex, updates, columnUpdates } = req.body;

      if (!rowIndex) {
        return res.status(400).json({ error: 'rowIndex required' });
      }

      // OPTIMIZED: If columnUpdates is provided, use direct column mapping (NO header lookup)
      if (columnUpdates && Object.keys(columnUpdates).length > 0) {
        const updateData = [];
        
        console.log('Column Updates Received:', columnUpdates);
        
        Object.keys(columnUpdates).forEach(columnNumber => {
          const colLetter = columnIndexToLetter(parseInt(columnNumber) - 1); // -1 because columns are 1-based
          console.log(`Column ${columnNumber} -> Letter ${colLetter} -> Value: ${columnUpdates[columnNumber]}`);
          updateData.push({
            range: `NewOrders!${colLetter}${rowIndex}`,
            values: [[columnUpdates[columnNumber]]]
          });
        });

        console.log('Update Data:', JSON.stringify(updateData, null, 2));

        if (updateData.length === 0) {
          return res.status(400).json({ error: 'No valid columns to update' });
        }

        // Batch update
        const result = await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: orderSheetId,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: updateData
          }
        });

        console.log('Update Result:', result.data);

        return res.status(200).json({
          success: true,
          message: 'Order updated successfully',
          updatedCells: result.data.totalUpdatedCells,
          updatedColumns: Object.keys(columnUpdates).length
        });
      }

      // Fallback: Legacy method using field names (kept for backward compatibility)
      if (updates && Object.keys(updates).length > 0) {
        // Get headers from row 8
        const headersResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: orderSheetId,
          range: 'NewOrders!A8:CF8',
        });

        const headers = headersResponse.data.values[0];

        // Build update requests for each field
        const updateData = [];
        Object.keys(updates).forEach(fieldName => {
          const colIndex = headers.indexOf(fieldName);
          if (colIndex !== -1) {
            // Convert column index to letter (0=A, 1=B, etc.)
            const colLetter = columnIndexToLetter(colIndex);
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

      return res.status(400).json({ error: 'No updates provided' });
    }

    // DELETE - Soft delete (mark as cancelled/deleted)
    if (req.method === 'DELETE') {
      const { orderId, rowIndex } = req.body;

      if (!rowIndex) {
        return res.status(400).json({ error: 'rowIndex required' });
      }

      // Get the column index for "Order Status" (column 45 = AS)
      const result = await sheets.spreadsheets.values.update({
        spreadsheetId: orderSheetId,
        range: `NewOrders!AS${rowIndex}`, // Order Status column
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Cancelled']]
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Order marked as cancelled',
        updatedCells: result.data.updatedCells
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

/**
 * Convert column index (0-based) to Excel-style letter
 * 0 = A, 1 = B, ..., 25 = Z, 26 = AA, etc.
 */
function columnIndexToLetter(index) {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode(65 + (index % 26)) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

// Increase timeout for this function
export const config = {
  api: {
    responseLimit: false,
  },
};
