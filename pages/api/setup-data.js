// pages/api/setup-data.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const setupSheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID_SETUPSHEET;
    const clientListSheetId = '1h-isMnQYpfEAfX_W-TvuP7pN50dBLMbltVFYh5_qFMc';
    const archiveSheetId = '1l54Xee6M_gLRwQQYhwU34qxLIM6PQLOX6F58cr6VUjU';
    
    if (!setupSheetId) {
      return res.status(500).json({ error: 'Setup spreadsheet configuration missing' });
    }

    const { google } = require('googleapis');
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Fetch all six datasets in parallel
    const [
      productListResponse, 
      discountResponse, 
      distributorResponse, 
      employeeResponse,
      clientListResponse,
      orderArchiveResponse
    ] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: setupSheetId,
        range: 'Product List!A1:H',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: setupSheetId,
        range: 'Discount Module!A1:N',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: setupSheetId,
        range: 'Distributor List!A1:H',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: setupSheetId,
        range: 'Employee List!A1:C',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: clientListSheetId,
        range: 'Sheet1!A1:AK',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: archiveSheetId,
        range: 'Sheet1!A1:CZ',
      })
    ]);

    const parseData = (values) => {
      if (!values || values.length === 0) return { headers: [], rows: [] };
      
      const headers = values[0];
      const rows = values.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });
      
      return { headers, rows };
    };

    // Special parser for Order Archive with specific columns
    const parseOrderArchiveData = (values) => {
      if (!values || values.length === 0) return { headers: [], rows: [] };
      
      // Column mapping: New Name -> Column Number (0-based index)
      const columnMapping = {
        'Timestamp': 0,
        'Buyer ID': 1,
        'Oder ID': 2,
        'Name of Client': 3,
        'Mobile': 4,
        'Client Category': 6,
        'Client Type': 7,
        'Billing Address': 8,
        'Shipping Address': 9,
        'Pin code': 10,
        'Other Address': 11,
        'Invoice Amount': 12,
        'Order Taken By': 14,
        'Delivery Required Date': 15,
        'Delivery Party From': 16,
        'Payment Terms': 17,
        'Payment Date (to be paid)': 18,
        'Planned': 38,
        'Actual': 39,
        'Time Delay': 40,
        'POB No*': 41,
        'POB URL*': 42,
        'Doer Name': 43,
        'Order Status': 44,
        'Dispatch Party From*': 45,
        'Remarks*': 46,
        'Payment Date': 50,
        'Payment Confirmation Type': 51,
        'Expected Date and time of the Dispatch': 52,
        'Dispatch Status': 74
      };

      const headers = Object.keys(columnMapping);
      const dataRows = values.slice(1);
      
      const rows = dataRows.map(row => {
        const obj = {};
        headers.forEach(header => {
          const columnIndex = columnMapping[header];
          obj[header] = row[columnIndex] || '';
        });
        return obj;
      });
      
      return { headers, rows };
    };

    return res.status(200).json({
      success: true,
      data: {
        productList: parseData(productListResponse.data.values),
        discountStructure: parseData(discountResponse.data.values),
        distributorList: parseData(distributorResponse.data.values),
        employeeList: parseData(employeeResponse.data.values),
        clientList: parseData(clientListResponse.data.values),
        orderArchive: parseOrderArchiveData(orderArchiveResponse.data.values)
      }
    });

  } catch (error) {
    console.error('Setup data error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch setup data',
      details: error.message 
    });
  }
}
