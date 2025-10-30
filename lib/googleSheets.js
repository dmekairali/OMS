/**
 * Google Sheets Service
 * Client-side wrapper for Google Sheets API calls
 * All actual API calls go through /api/sheets.js endpoint
 */

class GoogleSheetsService {
  constructor() {
    // Use environment variable or fallback to relative URL
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  }

  /**
   * Read data from a specific sheet
   * @param {string} sheetName - Name of the sheet
   * @param {string} range - Range to read (e.g., 'A1:Z100')
   * @returns {Promise<Array>} Array of rows
   */
  async readSheet(sheetName, range = 'A:Z') {
    try {
      const url = `${this.apiBaseUrl}/api/sheets?sheetId=${this.spreadsheetId}&sheetName=${encodeURIComponent(sheetName)}&range=${encodeURIComponent(range)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error reading sheet:', error);
      throw new Error(`Failed to read sheet: ${error.message}`);
    }
  }

  /**
   * Append data to a sheet
   * @param {string} sheetName - Name of the sheet
   * @param {Array} values - 2D array of values to append
   * @returns {Promise<Object>} Append response
   */
  async appendSheet(sheetName, values) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/sheets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId: this.spreadsheetId,
          sheetName: sheetName,
          values: values,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error appending to sheet:', error);
      throw new Error(`Failed to append to sheet: ${error.message}`);
    }
  }

  /**
   * Update data in a sheet
   * @param {string} sheetName - Name of the sheet
   * @param {string} range - Range to update (e.g., 'A1:B2')
   * @param {Array} values - 2D array of values to update
   * @returns {Promise<Object>} Update response
   */
  async updateSheet(sheetName, range, values) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/sheets`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId: this.spreadsheetId,
          range: `${sheetName}!${range}`,
          values: values,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating sheet:', error);
      throw new Error(`Failed to update sheet: ${error.message}`);
    }
  }

  /**
   * Batch update multiple ranges in a sheet
   * @param {Array} data - Array of update objects with range and values
   * @returns {Promise<Object>} Batch update response
   */
  async batchUpdate(data) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/sheets`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spreadsheetId: this.spreadsheetId,
          data: data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error batch updating sheet:', error);
      throw new Error(`Failed to batch update sheet: ${error.message}`);
    }
  }

  /**
   * Update a specific cell
   * @param {string} sheetName - Name of the sheet
   * @param {string} cell - Cell reference (e.g., 'A1')
   * @param {any} value - Value to write
   * @returns {Promise<Object>} Update response
   */
  async updateCell(sheetName, cell, value) {
    return this.updateSheet(sheetName, cell, [[value]]);
  }

  /**
   * Convert sheet data to objects with headers
   * @param {Array} data - Raw sheet data
   * @returns {Array} Array of objects
   */
  convertToObjects(data) {
    if (!data || data.length === 0) return [];
    
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
  }

  /**
   * Convert objects to sheet data format
   * @param {Array} objects - Array of objects
   * @returns {Array} 2D array for sheets
   */
  convertToSheetData(objects) {
    if (!objects || objects.length === 0) return [];
    
    const headers = Object.keys(objects[0]);
    const rows = objects.map(obj => headers.map(header => obj[header] || ''));
    
    return [headers, ...rows];
  }

  /**
   * Find row index by column value
   * @param {Array} data - Sheet data
   * @param {string} columnName - Column header name
   * @param {any} value - Value to search for
   * @returns {number} Row index (0-based, excluding header) or -1 if not found
   */
  findRowIndex(data, columnName, value) {
    if (!data || data.length === 0) return -1;
    
    const headers = data[0];
    const columnIndex = headers.indexOf(columnName);
    
    if (columnIndex === -1) return -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][columnIndex] === value) {
        return i - 1; // Return 0-based index excluding header
      }
    }
    
    return -1;
  }

  /**
   * Get current timestamp in ISO format
   * @returns {string} ISO timestamp
   */
  getCurrentTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format timestamp for display
   * @param {string} isoTimestamp - ISO format timestamp
   * @returns {string} Formatted timestamp
   */
  formatTimestamp(isoTimestamp) {
    if (!isoTimestamp) return '';
    const date = new Date(isoTimestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// Export singleton instance
const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService;
