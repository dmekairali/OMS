/**
 * Load Edit Order API Endpoint
 * Loads order details and products from SKUWise-Orders sheet
 * Uses COLUMN INDEX mapping for accurate data extraction
 * 
 * FINAL VERIFIED COLUMN MAPPINGS (Reading from B2:BZ):
 * - Order ID (filter) = Column C = index 1
 * - Quantity = Column L = index 10
 * - MRP = Column M = index 11
 * - Discount Amount = Column O = index 13 (CORRECTED)
 * - Total = Column P = index 14
 * - Product Name = Column Q = index 15
 * - Discount % = Column AB = index 26
 * - Packing Size = Column AC = index 27
 * - Before Tax = Column AD = index 28
 * - After Discount = Column AE = index 29
 * - SKU Code = Column AJ = index 34
 * - CGST % = Column AF = index 30 (CORRECTED)
 * - SGST % = Column AG = index 31 (CORRECTED)
 * - IGST % = Column AH = index 32 (CORRECTED)
 * 
 * TAX CALCULATIONS:
 * - CGST Amount = (After Discount * CGST%) / 100
 * - SGST Amount = (After Discount * SGST%) / 100
 * - IGST Amount = (After Discount * IGST%) / 100
 * 
 * EDITABLE FIELDS: Product Name (dropdown), Quantity, Discount %
 * READONLY FIELDS: All others (auto-calculated)
 */

import { requireAuth } from '@/lib/auth-middleware';

export default async function handler(req, res) {
  const session = await requireAuth(req, res);
  if (!session) return;
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId } = req.query;
    
    if (!orderId) {
      return res.status(400).json({ error: 'orderId required' });
    }

    const orderSheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID_ORDERSHEET;
    const { google } = require('googleapis');
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // ============================================
    // STEP 1: Load main order from NewOrders sheet
    // ============================================
    const orderResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: orderSheetId,
      range: 'NewOrders!A8:CF1000',
    });

    const orderData = orderResponse.data.values;
    const headers = orderData[0];
    
    const orderRow = orderData.slice(1).find(row => {
      const orderIdCol = headers.indexOf('Oder ID');
      return row[orderIdCol] === orderId;
    });

    if (!orderRow) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = {};
    headers.forEach((header, index) => {
      order[header] = orderRow[index] || '';
    });

    // ============================================
    // STEP 2: Load products from SKUWise-Orders sheet
    // Using COLUMN INDEX mapping (not header names)
    // IMPORTANT: Multiple rows can have the same Order ID
    // ============================================
    let products = [];
    
    try {
      const productSheetId = '14cRB5X8pT5ehb-kjRGOQ7qZfA-Sx1XzLCibwptU_DPQ';
      
      console.log('Loading products for order:', orderId);
      
      // Load entire data range starting from B2
      const productResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: productSheetId,
        range: 'SKUWise-Orders!B2:BZ', // Start from B2 (skip row 1 header)
      });

      const productData = productResponse.data.values;
      
      if (!productData || productData.length === 0) {
        console.log('No data found in SKUWise-Orders sheet');
        return res.status(200).json({
          success: true,
          order,
          products: []
        });
      }

      console.log(`Found ${productData.length} total rows in SKUWise-Orders`);

      // Filter ALL rows where Column C (index 1) matches orderId
      // NOTE: There can be MULTIPLE product rows per order
      const orderProducts = productData.filter(row => {
        return row[1] === orderId; // Column C (Order ID)
      });

      console.log(`Found ${orderProducts.length} product rows for order ${orderId}`);

      if (orderProducts.length === 0) {
        console.log('No products found for this order');
        return res.status(200).json({
          success: true,
          order,
          products: []
        });
      }

      // ============================================
      // STEP 3: Map EACH product row using VERIFIED COLUMN INDICES
      // 
      // Column mapping from B (index 0):
      // B=0, C=1, D=2, E=3, F=4, G=5, H=6, I=7, J=8, K=9, 
      // L=10, M=11, N=12, O=13, P=14, Q=15, R=16, S=17, T=18, U=19,
      // V=20, W=21, X=22, Y=23, Z=24, AA=25, AB=26, AC=27, AD=28, AE=29,
      // AF=30, AG=31, AH=32, AI=33, AJ=34, AK=35...
      // ============================================
      
      products = orderProducts.map((row, idx) => {
        // Parse discount % - handle non-numeric values
        let discountPercent = 0;
        const discountValue = row[26]; // Column AB (index 26)
        
        if (discountValue && discountValue !== '') {
          // Remove % sign if present and any other non-numeric characters
          const cleanValue = String(discountValue).replace(/[^0-9.-]/g, '').trim();
          const parsed = parseFloat(cleanValue);
          
          // Only use if it's a valid number
          if (!isNaN(parsed) && isFinite(parsed)) {
            discountPercent = parsed;
          } else {
            console.log(`Invalid discount value for product ${idx + 1}: "${discountValue}", setting to 0`);
            discountPercent = 0;
          }
        }

        // Parse tax percentages (full numbers like 2.5, not 0.025)
        const cgstPercent = parseFloat(row[30]) || 0;  // Column AF (index 30)
        const sgstPercent = parseFloat(row[31]) || 0;  // Column AG (index 31)
        const igstPercent = parseFloat(row[32]) || 0;  // Column AH (index 32)

        // Get After Discount amount for tax calculation
        const afterDiscount = parseFloat(row[29]) || 0; // Column AE (index 29)

        // Calculate tax amounts
        // Formula: (After Discount * Tax%) / 100
        const cgstAmount = (afterDiscount * cgstPercent) / 100;
        const sgstAmount = (afterDiscount * sgstPercent) / 100;
        const igstAmount = (afterDiscount * igstPercent) / 100;

        console.log(`Mapping product ${idx + 1}:`, {
          orderId: row[1],                // Column C
          productName: row[15],           // Column Q
          quantity: row[10],              // Column L
          mrp: row[11],                   // Column M
          sku: row[34],                   // Column AJ
          discountPer: discountPercent,   // Column AB
          discountAmt: row[13],           // Column O (CORRECTED)
          afterDiscount: afterDiscount,   // Column AE
          cgst: cgstPercent,              // Column AF
          sgst: sgstPercent,              // Column AG
          igst: igstPercent,              // Column AH
          cgstAmt: cgstAmount.toFixed(2),
          sgstAmt: sgstAmount.toFixed(2),
          igstAmt: igstAmount.toFixed(2),
          total: row[14]                  // Column P
        });

        return {
          // Core Product Info
          'Product Name': row[15] || '',           // Column Q (index 15) - EDITABLE (dropdown)
          'SKU Code': row[34] || '',               // Column AJ (index 34) - READONLY
          'MRP': parseFloat(row[11]) || 0,         // Column M (index 11) - READONLY
          'Packing Size': row[27] || '',           // Column AC (index 27) - READONLY
          
          // QUANTITY - EDITABLE
          'Quantity': parseFloat(row[10]) || 0,    // Column L (index 10) - EDITABLE ⭐
          'QNT': parseFloat(row[10]) || 0,         // Also map as QNT for compatibility
          'Order QTY': parseFloat(row[10]) || 0,   // Original quantity for reference - READONLY
          
          // Pricing & Discounts
          'Discount %': discountPercent,           // Column AB (index 26) - EDITABLE ⭐
          'Discount Amount': parseFloat(row[13]) || 0,  // Column O (index 13) - READONLY (CORRECTED)
          
          // Tax Calculations - READONLY
          'Before Tax': parseFloat(row[28]) || 0,  // Column AD (index 28) - READONLY
          'After Discount': afterDiscount,         // Column AE (index 29) - READONLY
          
          // Tax Percentages (from sheet) - READONLY
          'CGST %': cgstPercent,                   // Column AF (index 30) - READONLY (CORRECTED)
          'SGST %': sgstPercent,                   // Column AG (index 31) - READONLY (CORRECTED)
          'IGST %': igstPercent,                   // Column AH (index 32) - READONLY (CORRECTED)
          
          // Tax Amounts (calculated) - READONLY
          'CGST Amount': parseFloat(cgstAmount.toFixed(2)),  // CALCULATED - READONLY
          'SGST Amount': parseFloat(sgstAmount.toFixed(2)),  // CALCULATED - READONLY
          'IGST Amount': parseFloat(igstAmount.toFixed(2)),  // CALCULATED - READONLY
          
          // Line Total - READONLY
          'Total': parseFloat(row[14]) || 0,       // Column P (index 14) - READONLY
          
          // Additional fields for edit/split - READONLY
          'Split Quantity': 0  // Default to 0 for split orders
        };
      });

      console.log(`Successfully mapped ${products.length} products`);
      if (products.length > 0) {
        console.log('Sample product with tax calculations:', products[0]);
      }

    } catch (error) {
      console.error('Error loading products from SKUWise-Orders:', error);
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
      // Don't fail the entire request if products can't be loaded
      console.log('Continuing without products');
    }

    // ============================================
    // STEP 4: Return complete order data with ALL products
    // ============================================
    return res.status(200).json({
      success: true,
      order,
      products
    });

  } catch (error) {
    console.error('Load edit error:', error);
    return res.status(500).json({ 
      error: 'Failed to load order',
      details: error.message 
    });
  }
}
