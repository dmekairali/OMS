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
    
    // Fetch all five datasets in parallel
    const [
      productListResponse, 
      discountResponse, 
      distributorResponse, 
      employeeResponse,
      clientListResponse
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

    return res.status(200).json({
      success: true,
      data: {
        productList: parseData(productListResponse.data.values),
        discountStructure: parseData(discountResponse.data.values),
        distributorList: parseData(distributorResponse.data.values),
        employeeList: parseData(employeeResponse.data.values),
        clientList: parseData(clientListResponse.data.values)
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
