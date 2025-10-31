/**
 * Configuration API Endpoint
 * Reads and returns configuration from Configuration sheet
 * Uses SETUPSHEET for Configuration data
 */

export default async function handler(req, res) {
  // CORS headers
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
    // Get SETUPSHEET spreadsheet ID from environment (contains Users & Configuration)
    const setupSheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID_SETUPSHEET;
    
    if (!setupSheetId) {
      return res.status(500).json({ error: 'Setup spreadsheet configuration missing' });
    }

    // Read Configuration sheet directly using Google Sheets API
    const { google } = require('googleapis');
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    const sheetsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: setupSheetId,
      range: 'Configuration!A:H',
    });

    const configData = sheetsResponse.data.values;
    
    if (!configData || configData.length === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }

    // Convert to objects
    const headers = configData[0];
    const rows = configData.slice(1);
    
    const configRows = rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    // Group by sheet name
    const configuration = {};
    
    configRows.forEach(row => {
      const sheetName = row['Sheet Name'];
      
      if (!sheetName) return; // Skip rows without sheet name
      
      if (!configuration[sheetName]) {
        configuration[sheetName] = {
          sheetName: sheetName,
          fields: []
        };
      }

      // Parse options if it's JSON
      let options = null;
      if (row.Options) {
        try {
          options = JSON.parse(row.Options);
        } catch (e) {
          options = null;
        }
      }

      configuration[sheetName].fields.push({
        fieldName: row['Field Name'],
        fieldType: row['Field Type'],
        required: row.Required === 'TRUE',
        defaultValue: row['Default Value'] || '',
        editable: row.Editable === 'TRUE',
        showWhenStatus: row['Show When Status'] || '',
        options: options
      });
    });

    return res.status(200).json({
      success: true,
      configuration: configuration,
      sheetNames: Object.keys(configuration),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Configuration error:', error);
    return res.status(500).json({ 
      error: 'Failed to load configuration',
      details: error.message 
    });
  }
}
