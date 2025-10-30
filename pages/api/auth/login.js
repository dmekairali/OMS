/**
 * Login API Endpoint
 * Handles user authentication against Users sheet in Google Sheets
 */

export default async function handler(req, res) {
  // CORS headers
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

    // Get spreadsheet ID from environment
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      return res.status(500).json({ error: 'Spreadsheet configuration missing' });
    }

    // Read Users sheet using the sheets API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const sheetsResponse = await fetch(
      `${apiUrl}/api/sheets?sheetId=${spreadsheetId}&sheetName=Users&range=A:H`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!sheetsResponse.ok) {
      const errorData = await sheetsResponse.json();
      console.error('Failed to read Users sheet:', errorData);
      return res.status(500).json({ 
        error: 'Failed to authenticate',
        details: 'Could not connect to user database'
      });
    }

    const sheetsData = await sheetsResponse.json();
    const usersData = sheetsData.values;
    
    if (!usersData || usersData.length === 0) {
      return res.status(500).json({ error: 'No users found in system' });
    }

    // Convert to objects
    const headers = usersData[0];
    const rows = usersData.slice(1);
    
    const users = rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    // Find user
    const user = users.find(u => u.Username === username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if user is active
    if (user.Active !== 'TRUE') {
      return res.status(403).json({ error: 'Account is deactivated. Please contact administrator.' });
    }

    // Verify password (in production, use bcrypt.compare)
    // For demo: simple comparison
    if (user['Password Hash'] !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Parse visible columns JSON
    let visibleColumns = {};
    try {
      visibleColumns = JSON.parse(user['Visible Columns'] || '{}');
    } catch (e) {
      console.error('Error parsing visible columns:', e);
      visibleColumns = {};
    }

    // Update last login time
    const userIndex = users.findIndex(u => u.Username === username);
    const now = new Date().toISOString();
    
    // Update last login (optional - can be done asynchronously)
    try {
      await fetch(`${apiUrl}/api/sheets`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId: spreadsheetId,
          range: `Users!G${userIndex + 2}`, // +2 because of header row and 0-based index
          values: [[now]]
        }),
      });
    } catch (updateError) {
      console.error('Failed to update last login:', updateError);
      // Don't fail login if timestamp update fails
    }

    // Return user session data (without password)
    const userSession = {
      userId: user['User ID'],
      username: user.Username,
      role: user.Role,
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
