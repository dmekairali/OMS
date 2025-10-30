/**
 * Configuration API Endpoint
 * Reads and returns configuration from Configuration sheet
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
    // Get spreadsheet ID from environment
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      return res.status(500).json({ error: 'Spreadsheet configuration missing' });
    }

    // Read Configuration sheet using the sheets API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const sheetsResponse = await fetch(
      `${apiUrl}/api/sheets?sheetId=${spreadsheetId}&sheetName=Configuration&range=A:H`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!sheetsResponse.ok) {
      const errorData = await sheetsResponse.json();
      console.error('Failed to read Configuration sheet:', errorData);
      return res.status(500).json({ 
        error: 'Failed to load configuration',
        details: 'Could not connect to configuration database'
      });
    }

    const sheetsData = await sheetsResponse.json();
    const configData = sheetsData.values;
    
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
