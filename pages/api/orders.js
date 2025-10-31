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

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

    // GET - Read all orders
    if (req.method === 'GET') {
      const { orderId } = req.query;

      const sheetsResponse = await fetch(
        `${apiUrl}/api/sheets?sheetId=${orderSheetId}&sheetName=NewOrders&range=A:Z`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!sheetsResponse.ok) {
        const errorData = await sheetsResponse.json();
        console.error('Failed to read NewOrders sheet:', errorData);
        return res.status(500).json({ 
          error: 'Failed to fetch orders',
          details: 'Could not connect to orders database'
        });
      }

      const sheetsData = await sheetsResponse.json();
      const ordersData = sheetsData.values;
      
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
      const sheetsResponse = await fetch(`${apiUrl}/api/sheets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId: orderSheetId,
          sheetName: 'NewOrders',
          values: [orderData] // Array of row values
        }),
      });

      if (!sheetsResponse.ok) {
        const errorData = await sheetsResponse.json();
        console.error('Failed to create order:', errorData);
        return res.status(500).json({ 
          error: 'Failed to create order',
          details: errorData.error
        });
      }

      const result = await sheetsResponse.json();

      return res.status(201).json({
        success: true,
        message: 'Order created successfully',
        updatedRange: result.updatedRange,
        updatedRows: result.updatedRows
      });
    }

    // PUT - Update existing order
    if (req.method === 'PUT') {
      const { orderId, rowIndex, updates } = req.body;

      if (!rowIndex || !updates) {
        return res.status(400).json({ error: 'rowIndex and updates required' });
      }

      // First, get current data to find column indices
      const getResponse = await fetch(
        `${apiUrl}/api/sheets?sheetId=${orderSheetId}&sheetName=NewOrders&range=A1:Z1`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!getResponse.ok) {
        return res.status(500).json({ error: 'Failed to fetch headers' });
      }

      const headersData = await getResponse.json();
      const headers = headersData.values[0];

      // Build update requests for each field
      const updateRequests = [];
      Object.keys(updates).forEach(fieldName => {
        const colIndex = headers.indexOf(fieldName);
        if (colIndex !== -1) {
          const colLetter = String.fromCharCode(65 + colIndex); // A=65
          updateRequests.push({
            range: `NewOrders!${colLetter}${rowIndex}`,
            values: [[updates[fieldName]]]
          });
        }
      });

      if (updateRequests.length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      // Batch update
      const sheetsResponse = await fetch(`${apiUrl}/api/sheets`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId: orderSheetId,
          data: updateRequests
        }),
      });

      if (!sheetsResponse.ok) {
        const errorData = await sheetsResponse.json();
        console.error('Failed to update order:', errorData);
        return res.status(500).json({ 
          error: 'Failed to update order',
          details: errorData.error
        });
      }

      const result = await sheetsResponse.json();

      return res.status(200).json({
        success: true,
        message: 'Order updated successfully',
        updatedCells: result.totalUpdatedCells
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
