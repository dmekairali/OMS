/**
 * Products Only API Endpoint
 * Fetches products from TWO sheets with fallback logic using COLUMN NUMBERS:
 * 1. First try: MROrdersSKU sheet
 * 2. Second try: All Form Data sheet (if not found in first)
 * 
 * SAVE THIS FILE AS: pages/api/orders/products.js
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
    const { orderId } = req.query;
    
    if (!orderId) {
      return res.status(400).json({ error: 'orderId required' });
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

    // ============================================
    // Sheet 1: MROrdersSKU - Column Number Mapping
    // ============================================
    let products = [];
    let sheetSource = 'none';
    
    console.log('🔍 Searching for order:', orderId);
    
    // Sheet 1 Configuration
    const sheet1Id = '1Ht-S_T5aZCvXLVriud5Vdr4R562RNKlxh6kCJTjQ5QU';
    
    console.log('📋 Trying Sheet 1: MROrdersSKU');
    
    try {
      const sheet1Response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheet1Id,
        range: 'MROrdersSKU!A1:V', // Columns A to V
      });

      const sheet1Data = sheet1Response.data.values;
      
      if (sheet1Data && sheet1Data.length > 0) {
        console.log(`📊 Found ${sheet1Data.length} total rows in MROrdersSKU`);
        
        // COLUMN NUMBER MAPPING (0-based index from column A)
        // A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, M=12, N=13, O=14, P=15, Q=16, R=17, S=18, T=19, U=20, V=21
        const columnMap1 = {
          orderId: 2,        // Column C (Oder ID)
          productName: 18,   // Column S
          skuCode: 17,       // Column R
          mrp: 12,           // Column M
          packingSize: 21,   // Column V
          quantity: 11,      // Column L
          discountPercent: 13, // Column N
          discountAmount: 14,  // Column O
          total: 15          // Column P (assuming Total is in P)
        };

        console.log('🔍 Sheet 1 column mapping:', columnMap1);

        // Filter rows where Column C (Oder ID) matches (skip header row)
        const orderProducts = sheet1Data.filter((row, index) => {
          if (index === 0) return false; // Skip header
          return row[columnMap1.orderId] === orderId;
        });

        if (orderProducts.length > 0) {
          console.log(`✅ Found ${orderProducts.length} products in Sheet 1`);
          sheetSource = 'MROrdersSKU';
          
          products = orderProducts.map((row, idx) => {
            // Parse discount % - remove % sign and convert to number
            let discountPercent = 0;
            const discountValue = row[columnMap1.discountPercent];
            
            if (discountValue && discountValue !== '') {
              // Remove % sign and any non-numeric characters except decimal point
              const cleanValue = String(discountValue).replace(/[^0-9.]/g, '').trim();
              const parsed = parseFloat(cleanValue);
              
              if (!isNaN(parsed) && isFinite(parsed)) {
                discountPercent = parsed;
              } else {
                console.log(`⚠️ Invalid discount value in Sheet 1: "${discountValue}", setting to 0`);
                discountPercent = 0;
              }
            }

            return {
              // Core Product Info
              'Product Name': row[columnMap1.productName] || '',
              'SKU Code': row[columnMap1.skuCode] || '',
              'MRP': parseFloat(row[columnMap1.mrp]) || 0,
              'Packing Size': row[columnMap1.packingSize] || '',
              
              // QUANTITY - EDITABLE
              'Quantity': parseFloat(row[columnMap1.quantity]) || 0,
              'QNT': parseFloat(row[columnMap1.quantity]) || 0,
              'Order QTY': parseFloat(row[columnMap1.quantity]) || 0,
              
              // Pricing & Discounts
              'Discount %': discountPercent,
              'Discount Amount': parseFloat(row[columnMap1.discountAmount]) || 0,
              
              // Line Total - READONLY
              'Total': parseFloat(row[columnMap1.total]) || 0,
              
              // Additional fields for edit/split - READONLY
              'Split Quantity': 0,
              
              
  // Tax fields - CALCULATED VALUES
  'CGST %': 0,
  'SGST %': 0,
  'IGST %': 5, // Fixed 5% as requested
  
  // Calculate Before Tax (MRP × Quantity)
  'Before Tax': (parseFloat(row[columnMap1.mrp]) || 0) * (parseFloat(row[columnMap1.quantity]) || 0),
  
  // Calculate After Discount (Before Tax - Discount Amount)
  'After Discount': ((parseFloat(row[columnMap1.mrp]) || 0) * (parseFloat(row[columnMap1.quantity]) || 0)) - (parseFloat(row[columnMap1.discountAmount]) || 0),
  
  // Tax amounts (CGST/SGST = 0, IGST = After Discount × 5%)
  'CGST Amount': 0,
  'SGST Amount': 0,
  'IGST Amount': (((parseFloat(row[columnMap1.mrp]) || 0) * (parseFloat(row[columnMap1.quantity]) || 0)) - (parseFloat(row[columnMap1.discountAmount]) || 0)) * 0.05
            };
          });
        }
      }
    } catch (sheet1Error) {
      console.log('❌ Sheet 1 error:', sheet1Error.message);
    }

    // ============================================
    // Sheet 2: All Form Data - Column Number Mapping
    // ============================================
    if (products.length === 0) {
      console.log('📋 Trying Sheet 2: All Form Data');
      
      const sheet2Id = '1txzdGy1A7SYNkVH6mLVaGgmdR_o3Prfc91KeAsivrNQ';
      
      try {
        const sheet2Response = await sheets.spreadsheets.values.get({
          spreadsheetId: sheet2Id,
          range: 'All Form Data!A1:BJ', // Columns A to BJ
        });

        const sheet2Data = sheet2Response.data.values;
        
        if (sheet2Data && sheet2Data.length > 0) {
          console.log(`📊 Found ${sheet2Data.length} total rows in All Form Data`);
          
          // COLUMN NUMBER MAPPING (0-based index from column A)
          // A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, M=12, N=13, O=14, P=15, Q=16, R=17, S=18, T=19, U=20, V=21, W=22, X=23, Y=24, Z=25, AA=26, AB=27, AC=28, AD=29, AE=30, AF=31, AG=32, AH=33, AI=34, AJ=35, AK=36, AL=37, AM=38, AN=39, AO=40, AP=41, AQ=42, AR=43, AS=44, AT=45, AU=46, AV=47, AW=48, AX=49, AY=50, AZ=51, BA=52, BB=53, BC=54, BD=55, BE=56, BF=57, BG=58, BH=59, BI=60, BJ=61
          const columnMap2 = {
            orderId: 2,        // Column C (Oder ID)
            productName: 14,   // Column O
            skuCode: 61,       // Column BJ
            mrp: 15,           // Column P
            packingSize: 16,   // Column Q
            quantity: 17,      // Column R
            discountPercent: 18, // Column S
            discountAmount: 19,  // Column T
            total: 20          // Column U (assuming Total is in U)
          };

          console.log('🔍 Sheet 2 column mapping:', columnMap2);

          // Filter rows where Column C (Oder ID) matches (skip header row)
          const orderProducts = sheet2Data.filter((row, index) => {
            if (index === 0) return false; // Skip header
            return row[columnMap2.orderId] === orderId;
          });

          if (orderProducts.length > 0) {
            console.log(`✅ Found ${orderProducts.length} products in Sheet 2`);
            sheetSource = 'All Form Data';
            
            products = orderProducts.map((row, idx) => {
              // Parse discount % - remove % sign and convert to number
              let discountPercent = 0;
              const discountValue = row[columnMap2.discountPercent];
              
              if (discountValue && discountValue !== '') {
                // Remove % sign and any non-numeric characters except decimal point
                const cleanValue = String(discountValue).replace(/[^0-9.]/g, '').trim();
                const parsed = parseFloat(cleanValue);
                
                if (!isNaN(parsed) && isFinite(parsed)) {
                  discountPercent = parsed;
                } else {
                  console.log(`⚠️ Invalid discount value in Sheet 2: "${discountValue}", setting to 0`);
                  discountPercent = 0;
                }
              }

              return {
                // Core Product Info
                'Product Name': row[columnMap2.productName] || '',
                'SKU Code': row[columnMap2.skuCode] || '',
                'MRP': parseFloat(row[columnMap2.mrp]) || 0,
                'Packing Size': row[columnMap2.packingSize] || '',
                
                // QUANTITY - EDITABLE
                'Quantity': parseFloat(row[columnMap2.quantity]) || 0,
                'QNT': parseFloat(row[columnMap2.quantity]) || 0,
                'Order QTY': parseFloat(row[columnMap2.quantity]) || 0,
                
                // Pricing & Discounts
                'Discount %': discountPercent,
                'Discount Amount': parseFloat(row[columnMap2.discountAmount]) || 0,
                
                // Line Total - READONLY
                'Total': parseFloat(row[columnMap2.total]) || 0,
                
                // Additional fields for edit/split - READONLY
                'Split Quantity': 0,
                
                
  // Tax fields - CALCULATED VALUES
  'CGST %': 0,
  'SGST %': 0,
  'IGST %': 5, // Fixed 5% as requested
  
  // Calculate Before Tax (MRP × Quantity)
  'Before Tax': (parseFloat(row[columnMap2.mrp]) || 0) * (parseFloat(row[columnMap2.quantity]) || 0),
  
  // Calculate After Discount (Before Tax - Discount Amount)
  'After Discount': ((parseFloat(row[columnMap2.mrp]) || 0) * (parseFloat(row[columnMap2.quantity]) || 0)) - (parseFloat(row[columnMap2.discountAmount]) || 0),
  
  // Tax amounts (CGST/SGST = 0, IGST = After Discount × 5%)
  'CGST Amount': 0,
  'SGST Amount': 0,
  'IGST Amount': (((parseFloat(row[columnMap2.mrp]) || 0) * (parseFloat(row[columnMap2.quantity]) || 0)) - (parseFloat(row[columnMap2.discountAmount]) || 0)) * 0.05
              };
            });
          }
        }
      } catch (sheet2Error) {
        console.log('❌ Sheet 2 error:', sheet2Error.message);
      }
    }

    // ============================================
    // Final Response
    // ============================================
    if (products.length === 0) {
      console.log('❌ No products found in either sheet for order:', orderId);
      return res.status(200).json({
        success: true,
        products: [],
        source: 'none',
        message: 'No products found for this order'
      });
    }

    console.log(`✅ Successfully mapped ${products.length} products from ${sheetSource}`);

    return res.status(200).json({
      success: true,
      products,
      source: sheetSource,
      message: `Found ${products.length} products from ${sheetSource}`
    });

  } catch (error) {
    console.error('❌ Error loading products:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({ 
      success: false,
      error: 'Failed to load products',
      details: error.message 
    });
  }
}
