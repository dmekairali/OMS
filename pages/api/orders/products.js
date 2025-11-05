// pages/api/orders/products.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId } = req.query;
  
  if (!orderId) {
    return res.status(400).json({ error: 'orderId required' });
  }

  // Only fetch products - NOT the order
  const productSheetId = '14cRB5X8pT5ehb-kjRGOQ7qZfA-Sx1XzLCibwptU_DPQ';
  
  const productResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: productSheetId,
    range: 'SKUWise-Orders!B2:BZ',
  });

  const productData = productResponse.data.values;
  
  // Filter products for this order
  const orderProducts = productData.filter(row => row[1] === orderId);
  
  // Map products (same logic as load-edit.js)
  const products = orderProducts.map(row => {
    // ... product mapping logic ...
  });

  return res.status(200).json({
    success: true,
    products
  });
}
