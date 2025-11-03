import { useState, useEffect } from 'react';
import styles from '../styles/EditOrderForm.module.css';

export default function EditOrderForm({ order, products, onSave, onCancel }) {
  // Client Information
  const [clientName, setClientName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [clientType, setClientType] = useState('');
  const [clientCategory, setClientCategory] = useState('');
  const [gstNo, setGstNo] = useState('');
  
  // Addresses
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [billingPincode, setBillingPincode] = useState('');
  const [shippingPincode, setShippingPincode] = useState('');
  const [taluk, setTaluk] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  
  // Order Details
  const [orderType, setOrderType] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partyState, setPartyState] = useState('');
  const [mrName, setMrName] = useState('');
  
  // Delivery & Payment
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [deliveryParty, setDeliveryParty] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [paymentDates, setPaymentDates] = useState(['', '', '', '', '']);
  
  // Call Times
  const [callTime1, setCallTime1] = useState('');
  const [callTime2, setCallTime2] = useState('');
  
  // Products
  const [productList, setProductList] = useState([]);
  
  // Charges & Taxes
  const [shippingCharge, setShippingCharge] = useState('0');
  const [shippingRemark, setShippingRemark] = useState('');
  const [shippingTax, setShippingTax] = useState('0');
  const [shippingTaxRemark, setShippingTaxRemark] = useState('');
  const [shippingTaxPer, setShippingTaxPer] = useState('0');
  const [shippingTaxPerRem, setShippingTaxPerRem] = useState('');
  
  // Remarks
  const [saleTermRemark, setSaleTermRemark] = useState('');
  const [invoiceRemark, setInvoiceRemark] = useState('');
  const [warehouseRemark, setWarehouseRemark] = useState('');
  
  // Repeat Order
  const [reoccurance, setReoccurance] = useState('');
  const [nextOrderDate, setNextOrderDate] = useState('');
  const [endOrderDate, setEndOrderDate] = useState('');
  const [priority, setPriority] = useState('');
  
  // File Upload
  const [fileData, setFileData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileMimeType, setFileMimeType] = useState('');

  useEffect(() => {
    if (order) {
      // Load order data
      setClientName(order['Name of Client'] || '');
      setMobile(order['Mobile'] || '');
      setEmail(order['Email'] || '');
      setClientType(order['Client Type'] || '');
      setClientCategory(order['Client Category'] || '');
      setGstNo(order['GST No'] || '');
      
      setBillingAddress(order['Billing Address'] || '');
      setShippingAddress(order['Shipping Address'] || '');
      setBillingPincode(order['Pin code'] || '');
      setShippingPincode(order['Shipping Pin code'] || '');
      
      setOrderType(order['Order Type'] || '');
      setPartyName(order['Delivery Party From'] || '');
      
      setDeliveryDate(order['Delivery Required Date']?.split(' ')[0] || '');
      setDeliveryTime(order['Delivery Required Date']?.split(' ')[1] || '');
      setDeliveryParty(order['Delivery Party From'] || '');
      
      setPaymentTerms(order['Payment Terms'] || '');
      setPaymentMode(order['Payment Mode'] || '');
      
      const payDates = (order['Payment Date (to be paid)'] || '').split(',').map(d => d.trim());
      setPaymentDates([
        payDates[0] || '',
        payDates[1] || '',
        payDates[2] || '',
        payDates[3] || '',
        payDates[4] || ''
      ]);
      
      const callTimes = (order['Preffered Call time'] || '').split('-').map(t => t.trim());
      setCallTime1(callTimes[0] || '');
      setCallTime2(callTimes[1] || '');
    }
    
    if (products && products.length > 0) {
      setProductList(products.map(p => ({
        productName: p['Product Name'] || '',
        sku: p['SKU Code'] || '',
        mrp: p['MRP'] || '0',
        packingSize: p['Packing Size'] || '',
        quantity: p['Quantity'] || p['QNT'] || '0',
        discountPer: p['Discount %'] || '0',
        discountAmt: p['Discount Amount'] || '0',
        beforeTax: p['Before Tax'] || '0',
        afterDiscount: p['After Discount'] || '0',
        cgst: p['CGST %'] || '0',
        cgstAmt: p['CGST Amount'] || '0',
        sgst: p['SGST %'] || '0',
        sgstAmt: p['SGST Amount'] || '0',
        igst: p['IGST %'] || '0',
        igstAmt: p['IGST Amount'] || '0',
        total: p['Total'] || '0',
        splitQty: '0'
      })));
    }
  }, [order, products]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        setFileData(base64);
        setFileName(file.name);
        setFileMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const addProduct = () => {
    setProductList([...productList, {
      productName: '',
      sku: '',
      mrp: '0',
      packingSize: '',
      quantity: '0',
      discountPer: '0',
      discountAmt: '0',
      beforeTax: '0',
      afterDiscount: '0',
      cgst: '0',
      cgstAmt: '0',
      sgst: '0',
      sgstAmt: '0',
      igst: '0',
      igstAmt: '0',
      total: '0',
      splitQty: '0'
    }]);
  };

  const removeProduct = (index) => {
    setProductList(productList.filter((_, i) => i !== index));
  };

  const updateProduct = (index, field, value) => {
    const updated = [...productList];
    updated[index][field] = value;
    
    // Auto-calculate amounts
    if (field === 'quantity' || field === 'mrp' || field === 'discountPer') {
      const qty = parseFloat(updated[index].quantity) || 0;
      const mrp = parseFloat(updated[index].mrp) || 0;
      const discPer = parseFloat(updated[index].discountPer) || 0;
      
      const beforeTax = qty * mrp;
      const discAmt = (beforeTax * discPer) / 100;
      const afterDisc = beforeTax - discAmt;
      
      updated[index].beforeTax = beforeTax.toFixed(2);
      updated[index].discountAmt = discAmt.toFixed(2);
      updated[index].afterDiscount = afterDisc.toFixed(2);
      
      // Calculate GST
      const cgst = parseFloat(updated[index].cgst) || 0;
      const sgst = parseFloat(updated[index].sgst) || 0;
      const igst = parseFloat(updated[index].igst) || 0;
      
      const cgstAmt = (afterDisc * cgst) / 100;
      const sgstAmt = (afterDisc * sgst) / 100;
      const igstAmt = (afterDisc * igst) / 100;
      
      updated[index].cgstAmt = cgstAmt.toFixed(2);
      updated[index].sgstAmt = sgstAmt.toFixed(2);
      updated[index].igstAmt = igstAmt.toFixed(2);
      updated[index].total = (afterDisc + cgstAmt + sgstAmt + igstAmt).toFixed(2);
    }
    
    setProductList(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = {
      // Client Info
      clientname: clientName,
      mobile: mobile,
      email: email,
      clienttypename: clientType,
      clientcategory1: clientCategory,
      GSTNO: gstNo,
      
      // Addresses
      Baddress: billingAddress,
      saddress: shippingAddress,
      BPINCODE: billingPincode,
      talukname: taluk,
      districtname: district,
      state: state,
      
      // Order
      ordertype: orderType,
      partyname: partyName,
      partystatename: partyState,
      mrname_name: mrName,
      
      // Delivery & Payment
      Deliverydate: deliveryDate,
      Deliverytime: deliveryTime,
      deliverydatebyname: deliveryParty,
      paymentterm: paymentTerms,
      paymentmodename: paymentMode,
      paymentdate: paymentDates,
      
      // Call Times
      calltime1: callTime1,
      calltime2: callTime2,
      
      // Products
      productname: productList.map(p => p.productName),
      MRP: productList.map(p => p.mrp),
      PACKINGSIZE: productList.map(p => p.packingSize),
      QNT: productList.map(p => p.quantity),
      DISPER: productList.map(p => p.discountPer),
      DISOUCNT: productList.map(p => ''),
      DISAMT: productList.map(p => p.discountAmt),
      BEFORE: productList.map(p => p.beforeTax),
      AFTER: productList.map(p => p.afterDiscount),
      CGST: productList.map(p => p.cgst),
      CGSTAMT: productList.map(p => p.cgstAmt),
      SGST: productList.map(p => p.sgst),
      SGSTAMT: productList.map(p => p.sgstAmt),
      IGST: productList.map(p => p.igst),
      IGSTAMT: productList.map(p => p.igstAmt),
      TOTAL: productList.map(p => p.total),
      SplitQTY: productList.map(p => p.splitQty),
      
      // Charges
      scharge: shippingCharge,
      sremark: shippingRemark,
      Stax: shippingTax,
      Staxremark: shippingTaxRemark,
      staxper: shippingTaxPer,
      staxperrem: shippingTaxPerRem,
      
      // Remarks
      saletermremark: saleTermRemark,
      invoiceremark: invoiceRemark,
      warehouseremark: warehouseRemark,
      
      // Repeat
      reoccurance: reoccurance,
      NextOrderDate: nextOrderDate,
      EndOrderDate: endOrderDate,
      Priority: priority,
      
      // File
      data: fileData,
      filename: fileName,
      mimetype: fileMimeType,
      
      // Totals
      taxbeforetotal: productList.reduce((sum, p) => sum + parseFloat(p.beforeTax || 0), 0).toFixed(2),
      distotal: productList.reduce((sum, p) => sum + parseFloat(p.discountAmt || 0), 0).toFixed(2),
      Beforeamt: productList.reduce((sum, p) => sum + parseFloat(p.beforeTax || 0), 0).toFixed(2),
      Afteramt: (productList.reduce((sum, p) => sum + parseFloat(p.total || 0), 0) + 
                 parseFloat(shippingCharge || 0) + 
                 parseFloat(shippingTax || 0)).toFixed(2)
    };
    
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.editForm}>
      {/* Client Information */}
      <div className={styles.section}>
        <h3>Client Information</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Client Name *</label>
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label>Mobile *</label>
            <input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Client Type *</label>
            <select value={clientType} onChange={(e) => setClientType(e.target.value)} required>
              <option value="">Select</option>
              <option value="Super Stockist">Super Stockist</option>
              <option value="Stockist">Stockist</option>
              <option value="Distributor">Distributor</option>
              <option value="PCD">PCD</option>
              <option value="Retailer">Retailer</option>
              <option value="Doctor">Doctor</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Client Category</label>
            <input type="text" value={clientCategory} onChange={(e) => setClientCategory(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>GST No</label>
            <input type="text" value={gstNo} onChange={(e) => setGstNo(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className={styles.section}>
        <h3>Address Details</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Billing Address *</label>
            <textarea value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} required rows="2" />
          </div>
          <div className={styles.field}>
            <label>Shipping Address *</label>
            <textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} required rows="2" />
          </div>
          <div className={styles.field}>
            <label>Billing Pincode *</label>
            <input type="text" value={billingPincode} onChange={(e) => setBillingPincode(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label>Shipping Pincode</label>
            <input type="text" value={shippingPincode} onChange={(e) => setShippingPincode(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Taluk</label>
            <input type="text" value={taluk} onChange={(e) => setTaluk(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>District</label>
            <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>State</label>
            <input type="text" value={state} onChange={(e) => setState(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className={styles.section}>
        <h3>Order Details</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Order Type</label>
            <input type="text" value={orderType} onChange={(e) => setOrderType(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Party Name</label>
            <input type="text" value={partyName} onChange={(e) => setPartyName(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Party State</label>
            <input type="text" value={partyState} onChange={(e) => setPartyState(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>MR Name</label>
            <input type="text" value={mrName} onChange={(e) => setMrName(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Products */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Products</h3>
          <button type="button" onClick={addProduct} className={styles.btnAdd}>+ Add Product</button>
        </div>
        
        <div className={styles.productsTable}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>SKU</th>
                <th>MRP</th>
                <th>Pack Size</th>
                <th>Qty</th>
                <th>Disc %</th>
                <th>Disc Amt</th>
                <th>Before Tax</th>
                <th>After Disc</th>
                <th>CGST %</th>
                <th>CGST Amt</th>
                <th>SGST %</th>
                <th>SGST Amt</th>
                <th>IGST %</th>
                <th>IGST Amt</th>
                <th>Total</th>
                <th>Split Qty</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {productList.map((product, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <input 
                      type="text" 
                      value={product.productName} 
                      onChange={(e) => updateProduct(index, 'productName', e.target.value)}
                      placeholder="Product name"
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={product.sku} 
                      onChange={(e) => updateProduct(index, 'sku', e.target.value)}
                      placeholder="SKU"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={product.mrp} 
                      onChange={(e) => updateProduct(index, 'mrp', e.target.value)}
                      step="0.01"
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={product.packingSize} 
                      onChange={(e) => updateProduct(index, 'packingSize', e.target.value)}
                      placeholder="Size"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={product.quantity} 
                      onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={product.discountPer} 
                      onChange={(e) => updateProduct(index, 'discountPer', e.target.value)}
                      step="0.01"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={product.discountAmt} 
                      readOnly
                      className={styles.readonly}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={product.beforeTax} 
                      readOnly
                      className={styles.readonly}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={product.afterDiscount} 
                      readOnly
                      className={styles.readonly}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={product.cgst} 
                      onChange={(e) => updateProduct(index, 'cgst', e.target.value)}
                      step="0.01"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={product.cgstAmt} 
                      readOnly
                      className={styles.readonly}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={product.sgst} 
                      onChange={(e) => updateProduct(index, 'sgst', e.target.value)}
                      step="0.01"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={product.sgstAmt} 
                      readOnly
                      className={styles.readonly}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={product.igst} 
                      onChange={(e) => updateProduct(index, 'igst', e.target.value)}
                      step="0.01"
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={product.igstAmt} 
                      readOnly
                      className={styles.readonly}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={product.total} 
                      readOnly
                      className={styles.readonly}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={product.splitQty} 
                      onChange={(e) => updateProduct(index, 'splitQty', e.target.value)}
                    />
                  </td>
                  <td>
                    <button 
                      type="button" 
                      onClick={() => removeProduct(index)}
                      className={styles.btnRemove}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charges & Taxes */}
      <div className={styles.section}>
        <h3>Additional Charges</h3>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label>Shipping Charge</label>
            <input type="number" value={shippingCharge} onChange={(e) => setShippingCharge(e.target.value)} step="0.01" />
          </div>
          <div className={styles.field}>
            <label>Shipping Remark</label>
            <input type="text" value={shippingRemark} onChange={(e) => setShippingRemark(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Shipping Tax</label>
            <input type="number" value={shippingTax} onChange={(e) => setShippingTax(e.target.value)} step="0.01" />
          </div>
          <div className={styles.field}>
            <label>Shipping Tax Remark</label>
            <input type="text" value={shippingTaxRemark} onChange={(e) => setShippingTaxRemark(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Shipping Tax %</label>
            <input type="number" value={shippingTaxPer} onChange={(e) => setShippingTaxPer(e.target.value)} step="0.01" />
          </div>
          <div className={styles.field}>
            <label>Shipping Tax % Remark</label>
            <input type="text" value={shippingTaxPerRem} onChange={(e) => setShippingTaxPerRem(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Delivery & Payment */}
      <div className={styles.section}>
        <h3>Delivery & Payment</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Delivery Date *</label>
            <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label>Delivery Time</label>
            <input type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Delivery Party</label>
            <input type="text" value={deliveryParty} onChange={(e) => setDeliveryParty(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Payment Terms *</label>
            <input type="text" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label>Payment Mode</label>
            <input type="text" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} />
          </div>
        </div>
        
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label>Payment Date 1 *</label>
            <input type="date" value={paymentDates[0]} onChange={(e) => {
              const updated = [...paymentDates];
              updated[0] = e.target.value;
              setPaymentDates(updated);
            }} required />
          </div>
          <div className={styles.field}>
            <label>Payment Date 2</label>
            <input type="date" value={paymentDates[1]} onChange={(e) => {
              const updated = [...paymentDates];
              updated[1] = e.target.value;
              setPaymentDates(updated);
            }} />
          </div>
          <div className={styles.field}>
            <label>Payment Date 3</label>
            <input type="date" value={paymentDates[2]} onChange={(e) => {
              const updated = [...paymentDates];
              updated[2] = e.target.value;
              setPaymentDates(updated);
            }} />
          </div>
          <div className={styles.field}>
            <label>Payment Date 4</label>
            <input type="date" value={paymentDates[3]} onChange={(e) => {
              const updated = [...paymentDates];
              updated[3] = e.target.value;
              setPaymentDates(updated);
            }} />
          </div>
          <div className={styles.field}>
            <label>Payment Date 5</label>
            <input type="date" value={paymentDates[4]} onChange={(e) => {
              const updated = [...paymentDates];
              updated[4] = e.target.value;
              setPaymentDates(updated);
            }} />
          </div>
        </div>
      </div>

      {/* Call Time */}
      <div className={styles.section}>
        <h3>Preferred Call Time</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>From</label>
            <input type="time" value={callTime1} onChange={(e) => setCallTime1(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>To</label>
            <input type="time" value={callTime2} onChange={(e) => setCallTime2(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Remarks */}
      <div className={styles.section}>
        <h3>Remarks</h3>
        <div className={styles.grid1}>
          <div className={styles.field}>
            <label>Sale Term Remark</label>
            <textarea value={saleTermRemark} onChange={(e) => setSaleTermRemark(e.target.value)} rows="2" />
          </div>
          <div className={styles.field}>
            <label>Invoice Remark</label>
            <textarea value={invoiceRemark} onChange={(e) => setInvoiceRemark(e.target.value)} rows="2" />
          </div>
          <div className={styles.field}>
            <label>Warehouse Remark</label>
            <textarea value={warehouseRemark} onChange={(e) => setWarehouseRemark(e.target.value)} rows="2" />
          </div>
        </div>
      </div>

      {/* Repeat Order */}
      <div className={styles.section}>
        <h3>Repeat Order</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Reoccurance</label>
            <select value={reoccurance} onChange={(e) => setReoccurance(e.target.value)}>
              <option value="">None</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Next Order Date</label>
            <input type="date" value={nextOrderDate} onChange={(e) => setNextOrderDate(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>End Order Date</label>
            <input type="date" value={endOrderDate} onChange={(e) => setEndOrderDate(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Priority</label>
            <input type="text" value={priority} onChange={(e) => setPriority(e.target.value)} />
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className={styles.section}>
        <h3>Attachment</h3>
        <div className={styles.field}>
          <label>Upload File</label>
          <input type="file" onChange={handleFileUpload} />
          {fileName && <span className={styles.fileName}>📎 {fileName}</span>}
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button type="button" onClick={onCancel} className={styles.btnCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.btnSave}>
          Save Changes
        </button>
      </div>
    </form>
  );
}
