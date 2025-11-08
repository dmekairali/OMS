// pages/api/setup-data.js
import { requireAuth } from '@/lib/auth-middleware';

export default async function handler(req, res) {
  const session = await requireAuth(req, res);
  if (!session) return;
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
    
    // New client list sheets to merge
    const newClientListSheets = [
      '1L9TyneFeicERASbgyzZVCNNjPqi93hNYD4VJUG_dMK4',
      '1KjAiqLGKEMh9FNvrHKTJAvzjxpBh3xKhv36OgcHsZNc',
      '1lVpuJJp9XxYlR545zUYyLNjzHbsVrxtnypOg-a8NtsA',
      '1n9eumh7u3At4FPR7vjCLUUfgNSujClKQheYyst0tqDE',
      '15wsT3TugkTjLrIqVg9Kq26kb96HdNawX5ikPSz0hHgU'
    ];
    
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
    
    // Function to fetch all client lists in parallel and merge
    const fetchAndMergeClientLists = async (sheetIds) => {
      // Create all fetch promises
      const fetchPromises = sheetIds.map(sheetId => 
        sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: 'Sheet1!A1:AK',
        }).catch(error => {
          console.warn(`Failed to fetch from sheet ${sheetId}:`, error.message);
          return { data: { values: [] } }; // Return empty data if sheet fails
        })
      );

      // Execute all fetches in parallel
      const responses = await Promise.all(fetchPromises);
      
      // Process all responses
      const allData = responses.map((response, index) => ({
        sheetId: sheetIds[index],
        values: response.data.values || []
      }));

      return mergeClientData(allData);
    };

    // Function to merge client data from multiple sheets
    const mergeClientData = (allData) => {
      let allHeaders = new Set();
      let allRows = [];

      allData.forEach((sheetData, sheetIndex) => {
        const { values, sheetId } = sheetData;
        
        if (!values || values.length === 0) {
          console.log(`Sheet ${sheetId} has no data`);
          return;
        }

        const headers = values[0];
        const rows = values.slice(1);

        // Add all headers to the set
        headers.forEach(header => allHeaders.add(header));

        // Process each row
        rows.forEach((row, rowIndex) => {
          const rowObj = {
            __source: `sheet_${sheetIndex + 1}`,
            __sheetId: sheetId
          };
          
          headers.forEach((header, colIndex) => {
            if (row[colIndex] !== undefined && row[colIndex] !== '') {
              rowObj[header] = row[colIndex];
            }
          });
          
          allRows.push(rowObj);
        });
      });

      // Convert Set to array for headers (excluding metadata)
      const mergedHeaders = Array.from(allHeaders).filter(header => !header.startsWith('__'));

      return {
        headers: mergedHeaders,
        rows: allRows,
        mergeStats: {
          totalSheets: allData.length,
          sheetsWithData: allData.filter(d => d.values.length > 0).length,
          totalClients: allRows.length,
          uniqueHeaders: mergedHeaders.length
        }
      };
    };

    // Create all API calls for parallel execution
    const apiCalls = [
      // Setup data calls
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
      // Client list merge (this handles its own parallel fetching)
      fetchAndMergeClientLists(newClientListSheets),
      // Archive data
      sheets.spreadsheets.values.get({
        spreadsheetId: archiveSheetId,
        range: 'Sheet1!A1:CZ',
      })
    ];

    // Execute ALL API calls in parallel
    const [
      productListResponse, 
      discountResponse, 
      distributorResponse, 
      employeeResponse,
      mergedClientList,
      orderArchiveResponse
    ] = await Promise.all(apiCalls);

    // Data parsing functions
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

    // Special parser for Order Archive
    const parseOrderArchiveData = (values) => {
      if (!values || values.length === 0) return { headers: [], rows: [] };
      
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
        clientList: mergedClientList,
        orderArchive: parseOrderArchiveData(orderArchiveResponse.data.values)
      },
      mergeInfo: mergedClientList.mergeStats
    });

  } catch (error) {
    console.error('Setup data error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch setup data',
      details: error.message 
    });
  }
}
