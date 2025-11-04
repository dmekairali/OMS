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
  const [isShippingSameAsBilling, setIsShippingSameAsBilling] = useState(false);
  
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
  const [paymentDate, setPaymentDate] = useState('');
  
  // Products
  const [productList, setProductList] = useState([]);
  
  // Repeat Order
  const [reoccurance, setReoccurance] = useState('');
  const [nextOrderDate, setNextOrderDate] = useState('');
  const [endOrderDate, setEndOrderDate] = useState('');
  const [priority, setPriority] = useState('');

  // Discounts
  const [discountTier, setDiscountTier] = useState('');
  const [discounts, setDiscounts] = useState([{ category: '', percentage: '' }]);

  // Additional Details
  const [shippingCharges, setShippingCharges] = useState('');
  const [shippingChargesRemark, setShippingChargesRemark] = useState('');
  const [shippingTaxPercent, setShippingTaxPercent] = useState('');
  const [shippingTaxPercentRemark, setShippingTaxPercentRemark] = useState('');
  const [totalShippingCharge, setTotalShippingCharge] = useState('');
  const [totalShippingChargeRemark, setTotalShippingChargeRemark] = useState('');

  // Payment, Delivery, and Remarks
  const [preferredCallTime1, setPreferredCallTime1] = useState('');
  const [preferredCallTime2, setPreferredCallTime2] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [dispatchTime, setDispatchTime] = useState('');
  const [saleTermRemark, setSaleTermRemark] = useState('');
  const [invoiceRemark, setInvoiceRemark] = useState('');
  const [warehouseRemark, setWarehouseRemark] = useState('');

  // File Upload, Order By, and Otif
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [orderBy, setOrderBy] = useState('');
  const [orderInFull, setOrderInFull] = useState('');
  const [orderInFullReason, setOrderInFullReason] = useState('');

  // New state for API data and validation
  const [setupData, setSetupData] = useState(null);
  const [deliveryParties, setDeliveryParties] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [clientNotFound, setClientNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load order data first
  useEffect(() => {
    if (order) {
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
      setOrderBy(order['Order Taken By'] || '');
      
      setReoccurance(order['Reoccurance'] || '');
      setNextOrderDate(order['Next Order Date'] || '');
      setEndOrderDate(order['End Order Date'] || '');
      setPriority(order['Priority'] || '');

      // Parse products if available
      if (products && Array.isArray(products)) {
        const parsedProducts = products.map(p => ({
          productName: p.productName || '',
          sku: p.sku || '',
          mrp: p.mrp || '0',
          packingSize: p.packingSize || '',
          quantity: p.quantity || '0',
          discountPer: p.discountPer || '0',
          discountAmt: p.discountAmt || '0',
          beforeTax: p.beforeTax || '0',
          afterDiscount: p.afterDiscount || '0',
          cgst: p.cgst || '0',
          cgstAmt: p.cgstAmt || '0',
          sgst: p.sgst || '0',
          sgstAmt: p.sgstAmt || '0',
          igst: p.igst || '0',
          igstAmt: p.igstAmt || '0',
          total: p.total || '0',
          splitQty: p.splitQty || '0'
        }));
        setProductList(parsedProducts);
      }
    }
  }, [order, products]);

  // Fetch setup data after order is loaded
  useEffect(() => {
    if (order && mobile) {
      fetchSetupData();
    }
  }, [order, mobile, clientType]);

  const fetchSetupData = async () => {
    setLoading(true);
    setClientNotFound(false);
    setErrorMessage('');

    try {
      const response = await fetch('/api/setup-data');
      const data = await response.json();

      if (data.success) {
        setSetupData(data.data);

        // Process Client List data
        const clientData = processClientList(data.data.clientList, mobile);
        
        // Process Employee List
        const employees = processEmployeeList(data.data.employeeList);
        setEmployeeList(employees);

        // Process Delivery Parties
        const parties = processDeliveryParties(data.data.clientList);
        setDeliveryParties(parties);

        if (clientData.found) {
          // Set discount tier
          setDiscountTier(clientData.discountTier);

          // Fetch and set discounts from Discount Module
          const discountData = processDiscountModule(
            data.data.discountStructure,
            clientData.discountTier,
            clientType
          );
          
          if (discountData.length > 0) {
            setDiscounts(discountData);
          }
        } else {
          // Client not found
          setClientNotFound(true);
          setErrorMessage('Client mobile number not found in Client List. This order cannot be edited.');
        }
      }
    } catch (error) {
      console.error('Error fetching setup data:', error);
      setErrorMessage('Failed to load required data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processClientList = (clientList, mobileNumber) => {
    if (!clientList || !clientList.rows) {
      return { found: false };
    }

    // Find client by Company Contact No (mobile)
    const client = clientList.rows.find(row => 
      row['Company Contact No'] === mobileNumber || 
      row['Company Contact No'] === String(mobileNumber)
    );

    if (client) {
      return {
        found: true,
        discountTier: client['Discount Tier'] || ''
      };
    }

    return { found: false };
  };

  const processDiscountModule = (discountStructure, tier, type) => {
    if (!discountStructure || !discountStructure.rows || !tier || !type) {
      return [];
    }

    // Find ALL matching rows with same Client Type and Tier
    const matchingDiscounts = discountStructure.rows.filter(row => {
      const rowClientType = row['Client Type'] || '';
      const rowTier = row['Tier'] || '';
      
      return rowClientType === type && rowTier === tier;
    });

    // Map to discount format
    return matchingDiscounts.map(row => ({
      category: row['Category'] || '',
      percentage: row['TD'] || ''
    }));
  };

  const processEmployeeList = (employeeList) => {
    if (!employeeList || !employeeList.rows) {
      return [];
    }

    // Get all unique users from ALL USERS column
    const users = employeeList.rows
      .map(row => row['ALL USERS'])
      .filter(user => user && user.trim() !== '');

    // Remove duplicates
    return [...new Set(users)];
  };

  const processDeliveryParties = (clientList) => {
    if (!clientList || !clientList.rows) {
      return [];
    }

    // Get unique delivery party names with their states
    const partiesMap = new Map();

    clientList.rows.forEach(row => {
      const partyName = row['Delivery Party Name'];
      const state = row['State'];
      
      if (partyName && partyName.trim() !== '') {
        // Store party name with its state (in case party appears multiple times, keep first occurrence)
        if (!partiesMap.has(partyName)) {
          partiesMap.set(partyName, state || '');
        }
      }
    });

    // Convert to array of objects
    return Array.from(partiesMap.entries()).map(([name, state]) => ({
      name,
      state
    }));
  };

  const handlePartyNameChange = (selectedPartyName) => {
    setPartyName(selectedPartyName);

    // Auto-fill party state based on selected party name
    const selectedParty = deliveryParties.find(p => p.name === selectedPartyName);
    if (selectedParty) {
      setPartyState(selectedParty.state);
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
    
    // Validation: Check if client was found
    if (clientNotFound) {
      alert('Cannot save order. Client mobile number not found in Client List.');
      return;
    }

    const formData = {
      clientname: clientName,
      mobile: mobile,
      email: email,
      clienttypename: clientType,
      clientcategory1: clientCategory,
      GSTNO: gstNo,
      
      Baddress: billingAddress,
      saddress: shippingAddress,
      BPINCODE: billingPincode,
      talukname: taluk,
      districtname: district,
      state: state,
      
      ordertype: orderType,
      partyname: partyName,
      partystatename: partyState,
      mrname_name: mrName,
      
      Deliverydate: deliveryDate,
      Deliverytime: deliveryTime,
      deliverydatebyname: deliveryParty,
      paymentterm: paymentTerms,
      paymentmodename: paymentMode,
      paymentdate: [paymentDate, '', '', '', ''],
      
      calltime1: null,
      calltime2: null,
      
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
      
      discounttiername: discountTier,
      discountcategory: discounts.map(d => d.category),
      discount: discounts.map(d => d.percentage),

      scharge: shippingCharges,
      sremark: shippingChargesRemark,
      Stax: totalShippingCharge,
      Staxremark: totalShippingChargeRemark,
      staxper: shippingTaxPercent,
      staxperrem: shippingTaxPercentRemark,
      
      saletermremark: saleTermRemark,
      invoiceremark: invoiceRemark,
      warehouseremark: warehouseRemark,
      
      reoccurance: reoccurance,
      NextOrderDate: nextOrderDate,
      EndOrderDate: endOrderDate,
      Priority: priority,
      
      data: fileData,
      filename: file ? file.name : null,
      mimetype: file ? file.type : null,
      orderby: orderBy,
      otifyesno: orderInFull,
      otifreason: orderInFullReason,
      
      taxbeforetotal: productList.reduce((sum, p) => sum + parseFloat(p.beforeTax || 0), 0).toFixed(2),
      distotal: productList.reduce((sum, p) => sum + parseFloat(p.discountAmt || 0), 0).toFixed(2),
      Beforeamt: productList.reduce((sum, p) => sum + parseFloat(p.beforeTax || 0), 0).toFixed(2),
      Afteramt: productList.reduce((sum, p) => sum + parseFloat(p.total || 0), 0).toFixed(2)
    };
    
    onSave(formData);
  };

  if (loading) {
    return (
      <div className={styles.editForm}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading order data...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.editForm}>
      {/* Error Message */}
      {errorMessage && (
        <div style={{ 
          background: '#fee', 
          border: '1px solid #fcc', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px',
          color: '#c00'
        }}>
          {errorMessage}
        </div>
      )}

      {/* Client Information */}
      <div className={styles.section}>
        <h3>Client Information</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Client Name *</label>
            <input type="text" value={clientName} readOnly className={styles.readonly} />
          </div>
          <div className={styles.field}>
            <label>Mobile *</label>
            <input type="tel" value={mobile} readOnly className={styles.readonly} />
          </div>
          <div className={styles.field}>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Client Type *</label>
            <input type="text" value={clientType} readOnly className={styles.readonly} />
          </div>
          <div className={styles.field}>
            <label>Client Category</label>
            <input type="text" value={clientCategory} readOnly className={styles.readonly} />
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
            <div>
              <input
                type="checkbox"
                checked={isShippingSameAsBilling}
                onChange={() => {
                  setIsShippingSameAsBilling(!isShippingSameAsBilling);
                  if (!isShippingSameAsBilling) {
                    setShippingAddress(billingAddress);
                  }
                }}
              />
              <label style={{ marginLeft: '8px' }}>Same as Billing Address</label>
            </div>
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
            <select 
              value={partyName} 
              onChange={(e) => handlePartyNameChange(e.target.value)}
            >
              <option value="">-- Select Party --</option>
              {deliveryParties.map((party, idx) => (
                <option key={idx} value={party.name}>
                  {party.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>Party State</label>
            <input type="text" value={partyState} readOnly className={styles.readonly} />
          </div>
          <div className={styles.field}>
            <label>MR Name</label>
            <input type="text" value={mrName} onChange={(e) => setMrName(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Discounts */}
      <div className={styles.section}>
        <h3>Discounts</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Discount Tier *</label>
            <input 
              type="text" 
              value={discountTier} 
              readOnly 
              className={styles.readonly}
            />
          </div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Discount Category</th>
              <th>Discount %</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((d, i) => (
              <tr key={i}>
                <td>
                  <input
                    type="text"
                    value={d.category}
                    readOnly
                    className={styles.readonly}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={d.percentage}
                    readOnly
                    className={styles.readonly}
                  />
                </td>
                <td>
                  {/* Remove button disabled for auto-fetched discounts */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delivery & Payment */}
      <div className={styles.section}>
        <h3>Delivery & Payment</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Delivery Date</label>
            <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Delivery Time</label>
            <input type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Payment Terms</label>
            <input type="text" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Payment Mode</label>
            <input type="text" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Order Place by</label>
            <select 
              value={orderBy} 
              onChange={(e) => setOrderBy(e.target.value)}
              required
            >
              <option value="">-- Select Employee --</option>
              {employeeList.map((employee, idx) => (
                <option key={idx} value={employee}>
                  {employee}
                </option>
              ))}
            </select>
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
                <th>Product</th>
                <th>SKU</th>
                <th>MRP</th>
                <th>Packing Size</th>
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
                <th></th>
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
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={product.sku}
                      onChange={(e) => updateProduct(index, 'sku', e.target.value)}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={product.mrp}
                      onChange={(e) => updateProduct(index, 'mrp', e.target.value)}
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={product.packingSize}
                      onChange={(e) => updateProduct(index, 'packingSize', e.target.value)}
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
                    />
                  </td>
                  <td><input type="text" value={product.discountAmt} readOnly /></td>
                  <td><input type="text" value={product.beforeTax} readOnly /></td>
                  <td><input type="text" value={product.afterDiscount} readOnly /></td>
                  <td>
                    <input 
                      type="number" 
                      value={product.cgst}
                      onChange={(e) => updateProduct(index, 'cgst', e.target.value)}
                    />
                  </td>
                  <td><input type="text" value={product.cgstAmt} readOnly /></td>
                  <td>
                    <input 
                      type="number" 
                      value={product.sgst}
                      onChange={(e) => updateProduct(index, 'sgst', e.target.value)}
                    />
                  </td>
                  <td><input type="text" value={product.sgstAmt} readOnly /></td>
                  <td>
                    <input 
                      type="number" 
                      value={product.igst}
                      onChange={(e) => updateProduct(index, 'igst', e.target.value)}
                    />
                  </td>
                  <td><input type="text" value={product.igstAmt} readOnly /></td>
                  <td><input type="text" value={product.total} readOnly /></td>
                  <td>
                    <input 
                      type="number" 
                      value={product.splitQty}
                      onChange={(e) => updateProduct(index, 'splitQty', e.target.value)}
                    />
                  </td>
                  <td>
                    <button type="button" onClick={() => removeProduct(index)} className={styles.btnRemove}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remarks */}
      <div className={styles.section}>
        <h3>Remarks</h3>
        <div className={styles.grid2}>
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

      {/* Form Actions */}
      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} className={styles.btnCancel}>
          Cancel
        </button>
        <button 
          type="submit" 
          className={styles.btnSubmit}
          disabled={clientNotFound}
          style={clientNotFound ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          Save Changes
        </button>
      </div>

      {/* Validation message at bottom */}
      {clientNotFound && (
        <div style={{ 
          background: '#fee', 
          border: '1px solid #fcc', 
          padding: '15px', 
          borderRadius: '8px',
          marginTop: '20px',
          color: '#c00',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          ⚠️ This order cannot be edited because the mobile number was not found in the Client List.
        </div>
      )}
    </form>
  );
}
