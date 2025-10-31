/**
 * Google Sheets API Endpoint
 * Handles read, write, and update operations for Google Sheets
 */

import { google } from 'googleapis';

// Initialize Google Sheets API
function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const sheets = getGoogleSheetsClient();

    // GET - Read from sheet
    if (req.method === 'GET') {
      const { sheetId, sheetName, range } = req.query;

      if (!sheetId || !sheetName) {
        return res.status(400).json({ error: 'sheetId and sheetName are required' });
      }

      const fullRange = `${sheetName}!${range || 'A:Z'}`;

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: fullRange,
      });

      return res.status(200).json({
        success: true,
        values: response.data.values || [],
      });
    }

    // POST - Append to sheet
    if (req.method === 'POST') {
      const { spreadsheetId, sheetName, values } = req.body;

      if (!spreadsheetId || !sheetName || !values) {
        return res.status(400).json({ error: 'spreadsheetId, sheetName, and values are required' });
      }

      const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });

      return res.status(200).json({
        success: true,
        updatedRange: response.data.updates.updatedRange,
        updatedRows: response.data.updates.updatedRows,
      });
    }

    // PUT - Update sheet
    if (req.method === 'PUT') {
      const { spreadsheetId, range, values, data } = req.body;

      // Batch update
      if (data && Array.isArray(data)) {
        const batchUpdateRequest = {
          spreadsheetId,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: data.map(item => ({
              range: item.range,
              values: item.values,
            })),
          },
        };

        const response = await sheets.spreadsheets.values.batchUpdate(batchUpdateRequest);

        return res.status(200).json({
          success: true,
          totalUpdatedRows: response.data.totalUpdatedRows,
          totalUpdatedCells: response.data.totalUpdatedCells,
        });
      }

      // Single update
      if (!spreadsheetId || !range || !values) {
        return res.status(400).json({ error: 'spreadsheetId, range, and values are required' });
      }

      const response = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });

      return res.status(200).json({
        success: true,
        updatedRange: response.data.updatedRange,
        updatedRows: response.data.updatedRows,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Sheets API error:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      details: error.message,
    });
  }
}

// Increase timeout for this function
export const config = {
  api: {
    responseLimit: false,
  },
};
