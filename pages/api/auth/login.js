export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const setupSheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID_SETUPSHEET;
    
    if (!setupSheetId) {
      return res.status(500).json({ error: 'Setup spreadsheet configuration missing' });
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
    
    const sheetsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: setupSheetId,
      range: 'Users!A:I',
    });

    const usersData = sheetsResponse.data.values;
    
    if (!usersData || usersData.length === 0) {
      return res.status(500).json({ error: 'No users found in system' });
    }

    const headers = usersData[0];
    const rows = usersData.slice(1);
    
    const users = rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    const user = users.find(u => u.Username === username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (user.Active !== 'TRUE') {
      return res.status(403).json({ error: 'Account is deactivated. Please contact administrator.' });
    }

    if (user['Password Hash'] !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Parse module access
    let moduleAccess = {};
    try {
      moduleAccess = JSON.parse(user['Module Access'] || '{}');
    } catch (e) {
      console.error('Error parsing module access:', e);
      // Default access for backward compatibility
      moduleAccess = {
        dashboard: true,
        newOrders: true,
        dispatch: true,
        delivery: true,
        payment: true
      };
    }

    // Parse visible columns
    let visibleColumns = {};
    try {
      visibleColumns = JSON.parse(user['Visible Columns'] || '{}');
    } catch (e) {
      console.error('Error parsing visible columns:', e);
      visibleColumns = {};
    }

    // Update last login
    const userIndex = users.findIndex(u => u.Username === username);
    const now = new Date().toISOString();
    
    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId: setupSheetId,
        range: `Users!H${userIndex + 2}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[now]]
        }
      });
    } catch (updateError) {
      console.error('Failed to update last login:', updateError);
    }

    const userSession = {
      userId: user['User ID'],
      username: user.Username,
      role: user.Role,
      moduleAccess: moduleAccess,
      visibleColumns: visibleColumns,
      showAllData: user['Show All Data'] === 'TRUE',
      lastLogin: now,
    };

    return res.status(200).json({
      success: true,
      user: userSession,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
