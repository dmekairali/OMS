import React, { useState, useEffect } from 'react';
import styles from '../styles/EditOrderForm.module.css';
import SetupDataService from '../services/SetupDataService';

const EditOrderForm = ({ orderId, onClose, onSave }) => {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Setup Data
  const [setupData, setSetupData] = useState(null);
  const [productListOptions, setProductListOptions] = useState([]);
  const [discountStructure, setDiscountStructure] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [deliveryParties, setDeliveryParties] = useState([]);
  
  // Form State
  const [editOrderStatus, setEditOrderStatus] = useState('');
  const [clientName, setClientName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [clientType, setClientType] = useState('');
  const [clientCategory, setClientCategory] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [orderType, setOrderType] = useState('');
  const [deliveryParty, setDeliveryParty] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [taluk, setTaluk] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [partyState, setPartyState] = useState('');
  const [mrName, setMrName] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [orderBy, setOrderBy] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [reoccurance, setReoccurance] = useState('');
  const [nextOrderDate, setNextOrderDate] = useState('');
  const [endOrderDate, setEndOrderDate] = useState('');
  const [priority, setPriority] = useState('');
  const [discountTier, setDiscountTier] = useState('');
  
  // Products
  const [productList, setProductList] = useState([{
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
    orderQty: '0',
    splitQty: '0',
    productCategory: '',
    taxRate: '0'
  }]);
  
  // Shipping
  const [shippingCharges, setShippingCharges] = useState('');
  const [shippingChargesRemark, setShippingChargesRemark] = useState('');
  const [shippingTaxPercent, setShippingTaxPercent] = useState('');
  const [shippingTaxPercentRemark, setShippingTaxPercentRemark] = useState('');
  const [totalShippingCharge, setTotalShippingCharge] = useState('');
  const [totalShippingChargeRemark, setTotalShippingChargeRemark] = useState('');
  
  // Other Fields
  const [preferredCallTime1, setPreferredCallTime1] = useState('');
  const [preferredCallTime2, setPreferredCallTime2] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [dispatchTime, setDispatchTime] = useState('');
  const [saleTermRemark, setSaleTermRemark] = useState('');
  const [invoiceRemark, setInvoiceRemark] = useState('');
  const [warehouseRemark, setWarehouseRemark] = useState('');
  const [orderInFull, setOrderInFull] = useState('');
  const [orderInFullReason, setOrderInFullReason] = useState('');
  const [file, setFile] = useState(null);

  // Process Employee List
  const processEmployeeList = (employeeData) => {
    if (!employeeData || !Array.isArray(employeeData)) return [];
    return employeeData.map(emp => emp['Name'] || '').filter(Boolean);
  };

  // Process Delivery Parties
  const processDeliveryParties = (distributorData) => {
    if (!distributorData || !Array.isArray(distributorData)) return [];
    return distributorData.map(dist => dist['Dispatch Party'] || '').filter(Boolean);
  };

  // Process Product List
  const processProductList = (productData) => {
    if (!productData || !Array.isArray(productData)) return [];
    
    return productData.map(p => ({
      combinedName: p['Combined Name'] || '',
      productSKU: p['ProductSKU'] || '',
      pack: p['Pack'] || '',
      price: p['Price As Per Factory'] || '0',
      status: p['Status'] || '',
      productCategory: p['Products Category'] || '',
      taxRate: p['TAX RATE'] || '0'
    })).filter(p => p.combinedName); // Filter out empty entries
  };

  // Process Discount Structure
  const processDiscountStructure = (discountData) => {
    if (!discountData || !Array.isArray(discountData)) return [];
    
    return discountData.map(d => ({
      'Discount Category': d['Discount Category'] || '',
      'Discount %': d['Discount %'] || '0',
      'Max Discount %': d['Max Discount %'] || d['Discount %'] || '100'
    })).filter(d => d['Discount Category']); // Filter out empty entries
  };

  // Load Setup Data
  useEffect(() => {
    const loadSetupData = async () => {
      try {
        const data = await SetupDataService.loadAllData();
        setSetupData(data);
        
        // Process Employee List
        const employees = processEmployeeList(data.employeeList);
        setEmployeeList(employees);
        
        // Process Delivery Parties from Distributor List
        const parties = processDeliveryParties(data.distributorList);
        setDeliveryParties(parties);
        
        // Process Product List
        const products = processProductList(data.productList);
        setProductListOptions(products);
        
        // Process Discount Structure
        const discounts = processDiscountStructure(data.discountList);
        setDiscountStructure(discounts);
        
      } catch (error) {
        console.error('Error loading setup data:', error);
        setErrorMessage('Failed to load setup data');
      }
    };
    
    loadSetupData();
  }, []);

  // Load Order Data
  useEffect(() => {
    const loadOrderData = async () => {
      if (!setupData || productListOptions.length === 0) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/orders/load-edit?orderId=${orderId}`);
        const data = await response.json();
        
        if (data.success) {
          const order = data.order;
          const products = data.products;
          
          // Set all form fields
          setEditOrderStatus(order['Edit Order Status'] || '');
          setClientName(order['Client Name'] || '');
          setMobile(order['Mobile'] || '');
          setEmail(order['Email ID'] || '');
          setClientType(order['Client Type'] || '');
          setClientCategory(order['Client Category'] || '');
          setGstNumber(order['GST Number'] || '');
          setOrderType(order['Order Type'] || '');
          setDeliveryParty(order['Delivery Party'] || '');
          setBillingAddress(order['Bill Address'] || '');
          setShippingAddress(order['Shipping Address'] || '');
          setPincode(order['Pin Code'] || '');
          setTaluk(order['Taluk'] || '');
          setDistrict(order['District'] || '');
          setState(order['State'] || '');
          setPartyState(order['Party State'] || '');
          setMrName(order['MR Name'] || '');
          setDeliveryDate(order['Delivery Required Date']?.split(' ')[0] || '');
          setDeliveryTime(order['Delivery Required Date']?.split(' ')[1] || '');
          setPaymentTerms(order['Payment Terms'] || '');
          setPaymentMode(order['Payment Mode'] || '');
          setOrderBy(order['Order Taken By'] || '');
          
          const payDates = (order['Payment Date (to be paid)'] || '').split(',').map(d => d.trim());
          setPaymentDate(payDates[0] || '');
          
          setReoccurance(order['Reoccurance'] || '');
          setNextOrderDate(order['Next Order Date'] || '');
          setEndOrderDate(order['End Order Date'] || '');
          setPriority(order['Priority'] || '');
          setDiscountTier(order['Discount Tier'] || '');
          setShippingCharges(order['Shipping Charges'] || '');
          setShippingChargesRemark(order['Shipping Charges Remark'] || '');
          setShippingTaxPercent(order['Shipping Tax Percent'] || '');
          setShippingTaxPercentRemark(order['Shipping Tax Percent Remark'] || '');
          setTotalShippingCharge(order['Total Shipping Charge'] || '');
          setTotalShippingChargeRemark(order['Total Shipping Charge Remark'] || '');
          setPreferredCallTime1(order['Preferred Call Time 1'] || '');
          setPreferredCallTime2(order['Preferred Call Time 2'] || '');
          setDispatchDate(order['Dispatch Date'] || '');
          setDispatchTime(order['Dispatch Time'] || '');
          setSaleTermRemark(order['Sale Term Remark'] || '');
          setInvoiceRemark(order['Invoice Remark'] || '');
          setWarehouseRemark(order['Warehouse Remark'] || '');
          setOrderInFull(order['Order In Full'] || '');
          setOrderInFullReason(order['Order In Full Reason'] || '');
          
          // Map products
          if (products && products.length > 0) {
            const mappedProducts = products.map(p => {
              // Find matching product from product list
              const productFromList = productListOptions.find(pl => 
                pl.combinedName === p['Product Name'] || 
                pl.productSKU === p['SKU Code']
              );
              
              const productCategory = productFromList?.productCategory || '';
              
              // Get preset discount based on category
              const presetDiscount = getPresetDiscountForCategory(productCategory);
              const discountPer = p['Discount %'] || presetDiscount;
              
              return {
                productName: p['Product Name'] || '',
                sku: p['SKU Code'] || '',
                mrp: p['MRP'] || '0',
                packingSize: p['Packing Size'] || '',
                quantity: p['Quantity'] || p['QNT'] || '0',
                discountPer: discountPer,
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
                orderQty: p['Order QTY'] || p['Quantity'] || '0',
                splitQty: p['Split Quantity'] || '0',
                productCategory: productCategory,
                taxRate: productFromList?.taxRate || p['CGST %'] || '0'
              };
            });
            setProductList(mappedProducts);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading order:', error);
        setErrorMessage('Failed to load order data');
        setLoading(false);
      }
    };
    
    if (orderId && setupData && productListOptions.length > 0) {
      loadOrderData();
    }
  }, [orderId, setupData, productListOptions]);

  // Get preset discount for a product category
  const getPresetDiscountForCategory = (productCategory) => {
    if (!productCategory || discountStructure.length === 0) return '0';
    
    const discount = discountStructure.find(d => 
      d['Discount Category'] === productCategory
    );
    
    return discount ? (discount['Discount %'] || '0') : '0';
  };

  // Get maximum allowed discount for a product category
  const getMaxDiscountForCategory = (productCategory) => {
    if (!productCategory || discountStructure.length === 0) return 100;
    
    const discount = discountStructure.find(d => 
      d['Discount Category'] === productCategory
    );
    
    return discount ? (parseFloat(discount['Max Discount %'] || discount['Discount %'] || 100)) : 100;
  };

  // Add Product
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
      orderQty: '0',
      splitQty: '0',
      productCategory: '',
      taxRate: '0'
    }]);
  };

  // Remove Product
  const removeProduct = (index) => {
    const updated = productList.filter((_, i) => i !== index);
    setProductList(updated);
  };

  // Update Product
  const updateProduct = (index, field, value) => {
    const updated = [...productList];
    const product = updated[index];
    
    // Handle product selection from dropdown
    if (field === 'productName') {
      const selectedProduct = productListOptions.find(p => p.combinedName === value);
      
      if (selectedProduct) {
        product.productName = selectedProduct.combinedName;
        product.sku = selectedProduct.productSKU;
        product.mrp = selectedProduct.price;
        product.packingSize = selectedProduct.pack;
        product.productCategory = selectedProduct.productCategory;
        product.taxRate = selectedProduct.taxRate;
        
        // Preset discount based on category
        const presetDiscount = getPresetDiscountForCategory(selectedProduct.productCategory);
        product.discountPer = presetDiscount;
        
        // Split tax rate for CGST/SGST or set as IGST
        const taxRate = parseFloat(selectedProduct.taxRate || '0');
        if (state && partyState && state === partyState) {
          product.cgst = (taxRate / 2).toString();
          product.sgst = (taxRate / 2).toString();
          product.igst = '0';
        } else {
          product.cgst = '0';
          product.sgst = '0';
          product.igst = taxRate.toString();
        }
      } else {
        product[field] = value;
      }
    } else if (field === 'discountPer') {
      // Enforce discount cap
      const maxDiscount = getMaxDiscountForCategory(product.productCategory);
      const enteredDiscount = parseFloat(value) || 0;
      
      if (enteredDiscount > maxDiscount) {
        product.discountPer = maxDiscount.toString();
      } else if (enteredDiscount < 0) {
        product.discountPer = '0';
      } else {
        product.discountPer = value;
      }
    } else {
      product[field] = value;
    }
    
    // Recalculate amounts
    recalculateProduct(product);
    
    setProductList(updated);
  };

  // Recalculate Product Amounts
  const recalculateProduct = (product) => {
    const mrp = parseFloat(product.mrp) || 0;
    const qty = parseFloat(product.quantity) || 0;
    const discPer = parseFloat(product.discountPer) || 0;
    const cgstPer = parseFloat(product.cgst) || 0;
    const sgstPer = parseFloat(product.sgst) || 0;
    const igstPer = parseFloat(product.igst) || 0;
    
    // Before Tax = MRP * Quantity
    const beforeTax = mrp * qty;
    product.beforeTax = beforeTax.toFixed(2);
    
    // Discount Amount = Before Tax * (Discount % / 100)
    const discountAmt = beforeTax * (discPer / 100);
    product.discountAmt = discountAmt.toFixed(2);
    
    // After Discount = Before Tax - Discount Amount
    const afterDiscount = beforeTax - discountAmt;
    product.afterDiscount = afterDiscount.toFixed(2);
    
    // Tax Amounts = After Discount * (Tax % / 100)
    const cgstAmt = afterDiscount * (cgstPer / 100);
    const sgstAmt = afterDiscount * (sgstPer / 100);
    const igstAmt = afterDiscount * (igstPer / 100);
    
    product.cgstAmt = cgstAmt.toFixed(2);
    product.sgstAmt = sgstAmt.toFixed(2);
    product.igstAmt = igstAmt.toFixed(2);
    
    // Total = After Discount + CGST + SGST + IGST
    const total = afterDiscount + cgstAmt + sgstAmt + igstAmt;
    product.total = total.toFixed(2);
    
    // Set Order Qty same as Quantity if not set
    if (!product.orderQty || product.orderQty === '0') {
      product.orderQty = product.quantity;
    }
    
    // Calculate Split Qty
    const orderQty = parseFloat(product.orderQty) || 0;
    const currentQty = parseFloat(product.quantity) || 0;
    if (currentQty < orderQty) {
      product.splitQty = (orderQty - currentQty).toString();
    } else {
      product.splitQty = '0';
    }
  };

  // Recalculate all products when state/party state changes
  useEffect(() => {
    if (productList.length > 0 && productList[0].productName) {
      const updated = productList.map(product => {
        const taxRate = parseFloat(product.taxRate || '0');
        
        if (state && partyState && state === partyState) {
          product.cgst = (taxRate / 2).toString();
          product.sgst = (taxRate / 2).toString();
          product.igst = '0';
        } else {
          product.cgst = '0';
          product.sgst = '0';
          product.igst = taxRate.toString();
        }
        
        recalculateProduct(product);
        return product;
      });
      
      setProductList(updated);
    }
  }, [state, partyState]);

  // Calculate Totals
  const calculateTotals = () => {
    const mrpTotal = productList.reduce((sum, p) => sum + (parseFloat(p.mrp) * parseFloat(p.quantity)), 0);
    const qtyTotal = productList.reduce((sum, p) => sum + parseFloat(p.quantity || 0), 0);
    const discountTotal = productList.reduce((sum, p) => sum + parseFloat(p.discountAmt || 0), 0);
    const beforeTaxTotal = productList.reduce((sum, p) => sum + parseFloat(p.beforeTax || 0), 0);
    const taxTotal = productList.reduce((sum, p) => 
      sum + parseFloat(p.cgstAmt || 0) + parseFloat(p.sgstAmt || 0) + parseFloat(p.igstAmt || 0), 0
    );
    const afterDiscountTotal = productList.reduce((sum, p) => sum + parseFloat(p.afterDiscount || 0), 0);
    const grandTotal = productList.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);
    
    return {
      mrpTotal: mrpTotal.toFixed(2),
      qtyTotal: qtyTotal.toFixed(0),
      discountTotal: discountTotal.toFixed(2),
      beforeTaxTotal: beforeTaxTotal.toFixed(2),
      taxTotal: taxTotal.toFixed(2),
      afterDiscountTotal: afterDiscountTotal.toFixed(2),
      grandTotal: grandTotal.toFixed(2)
    };
  };

  const totals = calculateTotals();

  // Handle Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = {
      orderId: orderId,
      editOrderStatus: editOrderStatus,
      clientName: clientName,
      mobile: mobile,
      email: email,
      clientType: clientType,
      clientCategory: clientCategory,
      gstNumber: gstNumber,
      orderType: orderType,
      deliveryParty: deliveryParty,
      billingAddress: billingAddress,
      shippingAddress: shippingAddress,
      pincode: pincode,
      taluk: taluk,
      district: district,
      state: state,
      partyState: partyState,
      mrName: mrName,
      deliveryDate: deliveryDate,
      deliveryTime: deliveryTime,
      paymentTerms: paymentTerms,
      paymentMode: paymentMode,
      orderBy: orderBy,
      paymentDate: paymentDate,
      reoccurance: reoccurance,
      nextOrderDate: nextOrderDate,
      endOrderDate: endOrderDate,
      priority: priority,
      discountTier: discountTier,
      products: productList,
      shippingCharges: shippingCharges,
      shippingChargesRemark: shippingChargesRemark,
      shippingTaxPercent: shippingTaxPercent,
      shippingTaxPercentRemark: shippingTaxPercentRemark,
      totalShippingCharge: totalShippingCharge,
      totalShippingChargeRemark: totalShippingChargeRemark,
      preferredCallTime1: preferredCallTime1,
      preferredCallTime2: preferredCallTime2,
      dispatchDate: dispatchDate,
      dispatchTime: dispatchTime,
      saleTermRemark: saleTermRemark,
      invoiceRemark: invoiceRemark,
      warehouseRemark: warehouseRemark,
      orderInFull: orderInFull,
      orderInFullReason: orderInFullReason,
      filename: file ? file.name : null,
      mimetype: file ? file.type : null,
      
      mrpTotal: totals.mrpTotal,
      qtyTotal: totals.qtyTotal,
      discountTotal: totals.discountTotal,
      beforeTaxTotal: totals.beforeTaxTotal,
      taxTotal: totals.taxTotal,
      afterDiscountTotal: totals.afterDiscountTotal,
      grandTotal: totals.grandTotal
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

      {/* Edit Order Status */}
      <div className={styles.section}>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Edit Order Status</label>
            <input 
              type="text" 
              value={editOrderStatus} 
              readOnly 
              className={styles.readonly}
            />
          </div>
        </div>
      </div>

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
            <input type="text" value={clientCategory} onChange={(e) => setClientCategory(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>GST Number</label>
            <input type="text" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Order Type</label>
            <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
              <option value="">-- Select --</option>
              <option value="Regular">Regular</option>
              <option value="Urgent">Urgent</option>
              <option value="Sample">Sample</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Delivery Party</label>
            <select value={deliveryParty} onChange={(e) => setDeliveryParty(e.target.value)}>
              <option value="">-- Select --</option>
              {deliveryParties.map((party, index) => (
                <option key={index} value={party}>{party}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className={styles.section}>
        <h3>Address Information</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Billing Address</label>
            <textarea value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} rows="3" />
          </div>
          <div className={styles.field}>
            <label>Shipping Address</label>
            <textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} rows="3" />
          </div>
          <div className={styles.field}>
            <label>Pin Code</label>
            <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} />
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
          <div className={styles.field}>
            <label>Party State</label>
            <input type="text" value={partyState} readOnly className={styles.readonly} />
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className={styles.section}>
        <h3>Order Details</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>MR Name</label>
            <select value={mrName} onChange={(e) => setMrName(e.target.value)}>
              <option value="">-- Select --</option>
              {employeeList.map((emp, index) => (
                <option key={index} value={emp}>{emp}</option>
              ))}
            </select>
          </div>
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
            <label>Order Taken By</label>
            <select value={orderBy} onChange={(e) => setOrderBy(e.target.value)}>
              <option value="">-- Select --</option>
              {employeeList.map((emp, index) => (
                <option key={index} value={emp}>{emp}</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label>Payment Date</label>
            <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Reoccurance</label>
            <input type="text" value={reoccurance} onChange={(e) => setReoccurance(e.target.value)} />
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
          <div className={styles.field}>
            <label>Discount Tier</label>
            <input type="text" value={discountTier} readOnly className={styles.readonly} />
          </div>
        </div>
      </div>

      {/* Discount Structure */}
      <div className={styles.section}>
        <h3>Discount Structure</h3>
        <div className={styles.productsTable}>
          <table>
            <thead>
              <tr>
                <th style={{width: '92%'}}>Discount Category</th>
                <th style={{width: '8%'}}>Discount %</th>
              </tr>
            </thead>
            <tbody>
              {discountStructure.map((discount, index) => (
                <tr key={index}>
                  <td>
                    <input 
                      type="text" 
                      value={discount['Discount Category'] || ''} 
                      readOnly 
                      className={styles.readonly}
                      style={{width: '100%'}}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={discount['Discount %'] || '0'} 
                      readOnly 
                      className={styles.readonly}
                      style={{width: '100%'}}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                <th>Order QTY</th>
                <th>Split Qty</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {productList.map((product, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <select 
                      value={product.productName}
                      onChange={(e) => updateProduct(index, 'productName', e.target.value)}
                      className={styles.productDropdown}
                    >
                      <option value="">-- Select Product --</option>
                      {productListOptions.map((p, i) => (
                        <option key={i} value={p.combinedName}>
                          {p.combinedName}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={product.sku}
                      readOnly
                      className={styles.readonly}
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={product.mrp}
                      readOnly
                      className={styles.readonly}
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={product.packingSize}
                      readOnly
                      className={styles.readonly}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={product.quantity}
                      onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                      className={styles.editableInput}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.1"
                      value={product.discountPer}
                      onChange={(e) => updateProduct(index, 'discountPer', e.target.value)}
                      className={styles.editableInput}
                      title={`Max: ${getMaxDiscountForCategory(product.productCategory)}%`}
                    />
                  </td>
                  <td><input type="text" value={product.discountAmt} readOnly className={styles.readonly} /></td>
                  <td><input type="text" value={product.beforeTax} readOnly className={styles.readonly} /></td>
                  <td><input type="text" value={product.afterDiscount} readOnly className={styles.readonly} /></td>
                  <td><input type="text" value={product.cgst} readOnly className={styles.readonly} /></td>
                  <td><input type="text" value={product.cgstAmt} readOnly className={styles.readonly} /></td>
                  <td><input type="text" value={product.sgst} readOnly className={styles.readonly} /></td>
                  <td><input type="text" value={product.sgstAmt} readOnly className={styles.readonly} /></td>
                  <td><input type="text" value={product.igst} readOnly className={styles.readonly} /></td>
                  <td><input type="text" value={product.igstAmt} readOnly className={styles.readonly} /></td>
                  <td><input type="text" value={product.total} readOnly className={styles.readonly} /></td>
                  <td><input type="text" value={product.orderQty} readOnly className={styles.readonly} /></td>
                  <td><input type="text" value={product.splitQty} readOnly className={styles.readonly} /></td>
                  <td>
                    <button type="button" onClick={() => removeProduct(index)} className={styles.btnRemove}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3"><strong>Totals:</strong></td>
                <td><strong>{totals.mrpTotal}</strong></td>
                <td></td>
                <td><strong>{totals.qtyTotal}</strong></td>
                <td></td>
                <td><strong>{totals.discountTotal}</strong></td>
                <td><strong>{totals.beforeTaxTotal}</strong></td>
                <td><strong>{totals.afterDiscountTotal}</strong></td>
                <td colSpan="6"><strong>Tax Total: {totals.taxTotal}</strong></td>
                <td><strong>{totals.grandTotal}</strong></td>
                <td colSpan="3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Shipping Charges */}
      <div className={styles.section}>
        <h3>Shipping Charges</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Shipping Charges</label>
            <input type="text" value={shippingCharges} onChange={(e) => setShippingCharges(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Shipping Charges Remark</label>
            <input type="text" value={shippingChargesRemark} onChange={(e) => setShippingChargesRemark(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Shipping Tax Percent</label>
            <input type="text" value={shippingTaxPercent} onChange={(e) => setShippingTaxPercent(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Shipping Tax Percent Remark</label>
            <input type="text" value={shippingTaxPercentRemark} onChange={(e) => setShippingTaxPercentRemark(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Total Shipping Charge</label>
            <input type="text" value={totalShippingCharge} onChange={(e) => setTotalShippingCharge(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Total Shipping Charge Remark</label>
            <input type="text" value={totalShippingChargeRemark} onChange={(e) => setTotalShippingChargeRemark(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className={styles.section}>
        <h3>Additional Information</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Preferred Call Time 1</label>
            <input type="time" value={preferredCallTime1} onChange={(e) => setPreferredCallTime1(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Preferred Call Time 2</label>
            <input type="time" value={preferredCallTime2} onChange={(e) => setPreferredCallTime2(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Dispatch Date</label>
            <input type="date" value={dispatchDate} onChange={(e) => setDispatchDate(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Dispatch Time</label>
            <input type="time" value={dispatchTime} onChange={(e) => setDispatchTime(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Sale Term Remark</label>
            <textarea value={saleTermRemark} onChange={(e) => setSaleTermRemark(e.target.value)} rows="3" />
          </div>
          <div className={styles.field}>
            <label>Invoice Remark</label>
            <textarea value={invoiceRemark} onChange={(e) => setInvoiceRemark(e.target.value)} rows="3" />
          </div>
          <div className={styles.field}>
            <label>Warehouse Remark</label>
            <textarea value={warehouseRemark} onChange={(e) => setWarehouseRemark(e.target.value)} rows="3" />
          </div>
          <div className={styles.field}>
            <label>Order In Full</label>
            <select value={orderInFull} onChange={(e) => setOrderInFull(e.target.value)}>
              <option value="">-- Select --</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Order In Full Reason</label>
            <textarea value={orderInFullReason} onChange={(e) => setOrderInFullReason(e.target.value)} rows="3" />
          </div>
          <div className={styles.field}>
            <label>Attach File</label>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button type="button" onClick={onClose} className={styles.btnCancel}>
          Cancel
        </button>
        <button type="submit" className={styles.btnSave}>
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default EditOrderForm;
