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
  const [orderType, setOrderType] = useState('New Order');
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
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productDetailsMap, setProductDetailsMap] = useState({});
  
  // Repeat Order
  const [reoccurance, setReoccurance] = useState('');
  const [nextOrderDate, setNextOrderDate] = useState('');
  const [endOrderDate, setEndOrderDate] = useState('');
  const [priority, setPriority] = useState('');

  // Discounts
  const [discountTier, setDiscountTier] = useState('');
  const [discounts, setDiscounts] = useState([{ category: '', percentage: '' }]);
  const [discountCapsMap, setDiscountCapsMap] = useState({});

  // Shipping Charges
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

  // File Upload and OTIF
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [orderBy, setOrderBy] = useState('');
  const [orderInFull, setOrderInFull] = useState('');
  const [orderInFullReason, setOrderInFullReason] = useState('');

  // Edit Order Status
  const [editOrderStatus, setEditOrderStatus] = useState('');

  // API data and validation
  const [setupData, setSetupData] = useState(null);
  const [deliveryParties, setDeliveryParties] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [clientNotFound, setClientNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // ============================================
  // FUNCTION: Process Product List from setup data
  // ============================================
  const processProductList = (productListData) => {
    if (!productListData || productListData.length === 0) {
      return { products: [], detailsMap: {} };
    }

    const headers = productListData[0];
    const rows = productListData.slice(1);
    
    // Find column indices
    const combinedNameIdx = headers.indexOf('Combined Name');
    const skuIdx = headers.indexOf('ProductSKU');
    const packIdx = headers.indexOf('Pack');
    const priceIdx = headers.indexOf('Price');
    const statusIdx = headers.indexOf('As Per Factory- Status');
    const categoryIdx = headers.indexOf('Products Category');
    const taxRateIdx = headers.indexOf('TAX RATE');

    if (combinedNameIdx === -1) {
      console.error('Combined Name column not found in Product List');
      return { products: [], detailsMap: {} };
    }

    const products = [];
    const detailsMap = {};

    rows.forEach(row => {
      const combinedName = row[combinedNameIdx];
      const status = row[statusIdx];
      
      // Only include active products
      if (combinedName && combinedName.trim() !== '' && status !== 'Inactive') {
        products.push(combinedName);
        
        // Store product details in map
        detailsMap[combinedName] = {
          combinedName: combinedName,
          sku: row[skuIdx] || '',
          pack: row[packIdx] || '',
          price: parseFloat(row[priceIdx]) || 0,
          category: row[categoryIdx] || '',
          taxRate: parseFloat(row[taxRateIdx]) || 0
        };
      }
    });

    console.log(`Loaded ${products.length} active products from Product List`);
    return { products, detailsMap };
  };

  // ============================================
  // FUNCTION: Process Discount Structure
  // ============================================
  const processDiscountStructure = (discountData) => {
    if (!discountData || discountData.length === 0) {
      return {};
    }

    const capsMap = {};
    
    discountData.forEach(discount => {
      const category = discount.category || discount['Discount Category'];
      const percentage = parseFloat(discount.percentage || discount['Discount %']) || 0;
      
      if (category && category.trim() !== '') {
        // Store max discount % for each category
        capsMap[category.trim()] = percentage;
      }
    });

    console.log('Discount caps by category:', capsMap);
    return capsMap;
  };

  // ============================================
  // FUNCTION: Process Client List
  // ============================================
  const processClientList = (clientListData, mobileNumber) => {
    if (!clientListData || clientListData.length === 0) {
      return { found: false };
    }

    const headers = clientListData[0];
    const rows = clientListData.slice(1);

    const mobileIdx = headers.indexOf('Mobile');
    const statusIdx = headers.indexOf('Active/Non Active');
    const discountTierIdx = headers.indexOf('Discount Tier');
    const talukIdx = headers.indexOf('Taluk');
    const districtIdx = headers.indexOf('District');
    const stateIdx = headers.indexOf('State');
    const mrNameIdx = headers.indexOf('MR Name');

    const clientRow = rows.find(row => {
      return row[mobileIdx] === mobileNumber && row[statusIdx] === 'Verified';
    });

    if (!clientRow) {
      return { found: false };
    }

    return {
      found: true,
      discountTier: clientRow[discountTierIdx] || '',
      taluk: clientRow[talukIdx] || '',
      district: clientRow[districtIdx] || '',
      state: clientRow[stateIdx] || '',
      mrName: clientRow[mrNameIdx] || ''
    };
  };

  // ============================================
  // FUNCTION: Process Employee List
  // ============================================
  const processEmployeeList = (employeeListData) => {
    if (!employeeListData || employeeListData.length === 0) {
      return [];
    }

    const headers = employeeListData[0];
    const rows = employeeListData.slice(1);
    
    const nameIdx = headers.indexOf('Employee Name') !== -1 ? 
      headers.indexOf('Employee Name') : headers.indexOf('Name');

    if (nameIdx === -1) {
      return [];
    }

    return rows
      .filter(row => row[nameIdx] && row[nameIdx].trim() !== '')
      .map(row => row[nameIdx]);
  };

  // ============================================
  // FUNCTION: Process Delivery Parties
  // ============================================
  const processDeliveryParties = (distributorListData) => {
    if (!distributorListData || distributorListData.length === 0) {
      return [];
    }

    const headers = distributorListData[0];
    const rows = distributorListData.slice(1);

    const partyNameIdx = headers.indexOf('Delivery Party Name');
    const stateIdx = headers.indexOf('State');

    if (partyNameIdx === -1) {
      return [];
    }

    const partiesMap = new Map();

    rows.forEach(row => {
      const partyName = row[partyNameIdx];
      const state = row[stateIdx];
      
      if (partyName && partyName.trim() !== '') {
        if (!partiesMap.has(partyName)) {
          partiesMap.set(partyName, state || '');
        }
      }
    });

    return Array.from(partiesMap.entries()).map(([name, state]) => ({
      name,
      state
    }));
  };

  // ============================================
  // FUNCTION: Process Discount Module
  // ============================================
  const processDiscountModule = (discountStructureData, tier, clientTypeValue) => {
    if (!discountStructureData || discountStructureData.length === 0) {
      return [];
    }

    const headers = discountStructureData[0];
    const rows = discountStructureData.slice(1);

    const clientTypeIdx = headers.indexOf('Client Type');
    const tierIdx = headers.indexOf('Tier');
    const categoryIdx = headers.indexOf('Discount Category');
    const percentageIdx = headers.indexOf('Discount %');

    if (clientTypeIdx === -1 || tierIdx === -1) {
      return [];
    }

    const matchingRows = rows.filter(row => {
      return row[clientTypeIdx] === clientTypeValue && row[tierIdx] === tier;
    });

    return matchingRows.map(row => ({
      category: row[categoryIdx] || '',
      percentage: row[percentageIdx] || '0'
    }));
  };

  // ============================================
  // Load order data and products
  // ============================================
  useEffect(() => {
    if (order) {
      setEditOrderStatus(order['Order Status'] || order['Status'] || '');
      setClientName(order['Name of Client'] || '');
      setMobile(order['Mobile'] || '');
      setEmail(order['Email'] || '');
      setClientType(order['Client Type'] || '');
      setClientCategory(order['Client Category'] || '');
      setGstNo(order['GST No'] || '');
      
      setBillingAddress(order['Billing Address'] || '');
      setShippingAddress(order['Shipping Address'] || '');
      setBillingPincode(order['Pin code'] || '');
      setShippingPincode(order['Pin code'] || '');
      setTaluk(order['Taluk'] || '');
      setDistrict(order['District'] || '');
      setState(order['State'] || '');
      
      setOrderType(order['Order Type'] || 'New Order');
      setPartyName(order['Delivery Party From'] || '');
      setPartyState(order['Delivery Party State'] || '');
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
    }
    
    if (products && products.length > 0) {
      setProductList(products.map(p => {
        const productCategory = p['Products Category'] || '';
        const originalDiscount = parseFloat(p['Discount %']) || 0;
        
        // Apply discount cap based on product category
        const maxDiscount = discountCapsMap[productCategory] || originalDiscount || 100;
        const cappedDiscount = Math.min(originalDiscount, maxDiscount);
        
        console.log(`Product: ${p['Product Name']}, Category: ${productCategory}, Original: ${originalDiscount}%, Max: ${maxDiscount}%, Capped: ${cappedDiscount}%`);
        
        return {
          productName: p['Product Name'] || '',
          sku: p['SKU Code'] || '',
          mrp: p['MRP'] || '0',
          packingSize: p['Packing Size'] || '',
          quantity: p['Quantity'] || p['QNT'] || '0',
          orderQty: p['Order QTY'] || p['Quantity'] || p['QNT'] || '0',
          discountPer: cappedDiscount,
          maxDiscountPer: maxDiscount,
          productCategory: productCategory,
          discountAmt: p['Discount Amount'] || '0',
          beforeTax: p['Before Tax'] || '0',
          afterDiscount: p['After Discount'] || '0',
          cgst: p['CGST %'] || '0',
          sgst: p['SGST %'] || '0',
          igst: p['IGST %'] || '0',
          cgstAmt: p['CGST Amount'] || '0',
          sgstAmt: p['SGST Amount'] || '0',
          igstAmt: p['IGST Amount'] || '0',
          total: p['Total'] || '0',
          splitQty: '0'
        };
      }));
    }
  }, [order, products, discountCapsMap]);

  // ============================================
  // Fetch setup data after order is loaded
  // ============================================
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

        // Process Product List table
        if (data.data.productList) {
          const { products, detailsMap } = processProductList(data.data.productList);
          setAvailableProducts(products);
          setProductDetailsMap(detailsMap);
          console.log('Loaded products:', products.length);
        }

        // Process Client List data - FILTER BY "Active/Non Active" = "Verified"
        const clientData = processClientList(data.data.clientList, mobile);
        
        // Process Employee List
        const employees = processEmployeeList(data.data.employeeList);
        setEmployeeList(employees);

        // Process Delivery Parties from Distributor List
        const parties = processDeliveryParties(data.data.distributorList);
        setDeliveryParties(parties);

        if (clientData.found) {
          // Set discount tier
          setDiscountTier(clientData.discountTier);
          
          // Set location data from Client List
          setTaluk(clientData.taluk);
          setDistrict(clientData.district);
          setState(clientData.state);
          setMrName(clientData.mrName);

          // Fetch and set discounts from Discount Module
          const discountData = processDiscountModule(
            data.data.discountStructure,
            clientData.discountTier,
            clientType
          );
          
          if (discountData.length > 0) {
            setDiscounts(discountData);
            
            // Create discount caps map
            const capsMap = processDiscountStructure(discountData);
            setDiscountCapsMap(capsMap);
          }
        } else {
          // Client not found or not verified
          setClientNotFound(true);
          setErrorMessage('Client mobile number not found or not verified in Client List. This order cannot be edited.');
        }
      }
    } catch (error) {
      console.error('Error fetching setup data:', error);
      setErrorMessage('Failed to load required data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Handle party name change
  // ============================================
  const handlePartyNameChange = (selectedPartyName) => {
    setPartyName(selectedPartyName);

    // Auto-fill party state from Distributor List
    const selectedParty = deliveryParties.find(p => p.name === selectedPartyName);
    if (selectedParty) {
      setPartyState(selectedParty.state);
    }
  };

  // ============================================
  // NEW: Handle product selection from dropdown
  // ============================================
  const handleProductSelection = (index, selectedProductName) => {
    if (!selectedProductName || !productDetailsMap[selectedProductName]) {
      return;
    }

    const updated = [...productList];
    const productDetails = productDetailsMap[selectedProductName];
    
    // Get preset discount based on product category
    const productCategory = productDetails.category;
    const presetDiscount = discountCapsMap[productCategory] || 0;
    
    // Calculate tax rate split
    const taxRate = productDetails.taxRate;
    let cgstPercent = 0;
    let sgstPercent = 0;
    let igstPercent = taxRate;
    
    // If same state, split tax rate for CGST/SGST
    const clientState = state.trim().toLowerCase();
    const partyStateValue = partyState.trim().toLowerCase();
    
    if (clientState && partyStateValue && clientState === partyStateValue) {
      cgstPercent = taxRate / 2;
      sgstPercent = taxRate / 2;
      igstPercent = 0;
    }
    
    // Update product with details from Product List table
    updated[index] = {
      ...updated[index],
      productName: selectedProductName,
      sku: productDetails.sku,
      mrp: productDetails.price.toFixed(2),
      packingSize: productDetails.pack,
      productCategory: productCategory,
      discountPer: presetDiscount,
      maxDiscountPer: presetDiscount,
      cgst: cgstPercent.toFixed(2),
      sgst: sgstPercent.toFixed(2),
      igst: igstPercent.toFixed(2)
    };
    
    // Recalculate amounts
    updateProductCalculations(updated, index);
    
    setProductList(updated);
    
    console.log('Product selected:', {
      name: selectedProductName,
      category: productCategory,
      presetDiscount: presetDiscount,
      taxRate: taxRate
    });
  };

  // ============================================
  // NEW: Centralized calculation function
  // ============================================
  const updateProductCalculations = (productArray, index) => {
    const product = productArray[index];
    
    const qty = parseFloat(product.quantity) || 0;
    const mrp = parseFloat(product.mrp) || 0;
    const discPer = parseFloat(product.discountPer) || 0;
    
    // Calculate before tax
    const beforeTax = qty * mrp;
    
    // Calculate discount amount
    const discAmt = (beforeTax * discPer) / 100;
    
    // Calculate after discount
    const afterDisc = beforeTax - discAmt;
    
    product.beforeTax = beforeTax.toFixed(2);
    product.discountAmt = discAmt.toFixed(2);
    product.afterDiscount = afterDisc.toFixed(2);
    
    // Get tax percentages
    const cgstPercent = parseFloat(product.cgst) || 0;
    const sgstPercent = parseFloat(product.sgst) || 0;
    const igstPercent = parseFloat(product.igst) || 0;
    
    // STATE-BASED TAX LOGIC
    const clientState = state.trim().toLowerCase();
    const partyStateValue = partyState.trim().toLowerCase();
    
    let cgstAmt = 0;
    let sgstAmt = 0;
    let igstAmt = 0;
    
    if (clientState && partyStateValue) {
      if (clientState === partyStateValue) {
        // SAME STATE: CGST + SGST
        cgstAmt = (afterDisc * cgstPercent) / 100;
        sgstAmt = (afterDisc * sgstPercent) / 100;
        igstAmt = 0;
      } else {
        // DIFFERENT STATE: IGST only
        cgstAmt = 0;
        sgstAmt = 0;
        igstAmt = (afterDisc * igstPercent) / 100;
      }
    }
    
    product.cgstAmt = cgstAmt.toFixed(2);
    product.sgstAmt = sgstAmt.toFixed(2);
    product.igstAmt = igstAmt.toFixed(2);
    
    // Calculate total
    const total = afterDisc + cgstAmt + sgstAmt + igstAmt;
    product.total = total.toFixed(2);
  };

  // ============================================
  // Add product
  // ============================================
  const addProduct = () => {
    setProductList([...productList, {
      productName: '',
      sku: '',
      mrp: '0',
      packingSize: '',
      quantity: '0',
      orderQty: '0',
      discountPer: '0',
      maxDiscountPer: 100,
      productCategory: '',
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

  // ============================================
  // Remove product
  // ============================================
  const removeProduct = (index) => {
    setProductList(productList.filter((_, i) => i !== index));
  };

  // ============================================
  // UPDATED: Product update with discount validation
  // ============================================
  const updateProduct = (index, field, value) => {
    const updated = [...productList];
    
    // Validate discount % against cap
    if (field === 'discountPer') {
      const maxDiscount = updated[index].maxDiscountPer || 100;
      const numValue = parseFloat(value) || 0;
      
      if (numValue > maxDiscount) {
        alert(`Discount cannot exceed ${maxDiscount}% for this product category (${updated[index].productCategory})`);
        value = maxDiscount;
      }
      
      if (numValue < 0) {
        value = 0;
      }
    }
    
    updated[index][field] = value;
    
    // Recalculate if quantity, MRP, or discount changes
    if (field === 'quantity' || field === 'mrp' || field === 'discountPer') {
      updateProductCalculations(updated, index);
    }
    
    setProductList(updated);
  };

  // ============================================
  // Recalculate all products when state changes
  // ============================================
  useEffect(() => {
    if (productList.length > 0 && state && partyState) {
      const updatedProducts = [...productList];
      
      updatedProducts.forEach((product, index) => {
        // Recalculate tax split based on states
        const taxRate = parseFloat(product.cgst || 0) + parseFloat(product.sgst || 0) + parseFloat(product.igst || 0);
        
        const clientState = state.trim().toLowerCase();
        const partyStateValue = partyState.trim().toLowerCase();
        
        if (clientState === partyStateValue) {
          // Same state: split tax for CGST/SGST
          product.cgst = (taxRate / 2).toFixed(2);
          product.sgst = (taxRate / 2).toFixed(2);
          product.igst = '0';
        } else {
          // Different state: use IGST
          product.cgst = '0';
          product.sgst = '0';
          product.igst = taxRate.toFixed(2);
        }
        
        // Recalculate amounts
        updateProductCalculations(updatedProducts, index);
      });
      
      setProductList(updatedProducts);
    }
  }, [state, partyState]);

  // ============================================
  // Handle form submission
  // ============================================
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (clientNotFound) {
      alert('Cannot save order. Client mobile number not found or not verified in Client List.');
      return;
    }

    const formData = {
      editstatus: editOrderStatus,
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
      
      calltime1: preferredCallTime1,
      calltime2: preferredCallTime2,
      
      productname: productList.map(p => p.productName),
      MRP: productList.map(p => p.mrp),
      PACKINGSIZE: productList.map(p => p.packingSize),
      QNT: productList.map(p => p.quantity),
      OrderQTY: productList.map(p => p.orderQty),
      DISPER: productList.map(p => p.discountPer),
      DISOUCNT: productList.map(p => '%'),
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
      
      dispatchdate: dispatchDate,
      dispatchtime: dispatchTime,
      
      data: fileData,
      filename: file ? file.name : null,
      mimetype: file ? file.type : null,
      
      orderby: orderBy,
      ordinfull: orderInFull,
      ordinfullreson: orderInFullReason
    };

    onSave(formData);
  };

  // ============================================
  // JSX Return
  // ============================================
  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}>Loading...</div>
        </div>
      )}

      {errorMessage && (
        <div className={styles.errorMessage}>
          {errorMessage}
        </div>
      )}

      {/* Edit Order Status */}
      <div className={styles.section}>
        <h3>Edit Order Status</h3>
        <div className={styles.field}>
          <label>Status</label>
          <input 
            type="text" 
            value={editOrderStatus} 
            readOnly 
            className={styles.readonly}
          />
        </div>
      </div>

      {/* Client Information */}
      <div className={styles.section}>
        <h3>Client Information</h3>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label>Client Name *</label>
            <input 
              type="text" 
              value={clientName} 
              readOnly 
              className={styles.readonly}
            />
          </div>
          <div className={styles.field}>
            <label>Mobile *</label>
            <input 
              type="text" 
              value={mobile} 
              readOnly 
              className={styles.readonly}
            />
          </div>
          <div className={styles.field}>
            <label>Email *</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Client Type</label>
            <input 
              type="text" 
              value={clientType} 
              readOnly 
              className={styles.readonly}
            />
          </div>
          <div className={styles.field}>
            <label>Client Category</label>
            <input 
              type="text" 
              value={clientCategory} 
              readOnly 
              className={styles.readonly}
            />
          </div>
          <div className={styles.field}>
            <label>GST No</label>
            <input 
              type="text" 
              value={gstNo} 
              onChange={(e) => setGstNo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className={styles.section}>
        <h3>Addresses</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Billing Address *</label>
            <textarea 
              value={billingAddress} 
              onChange={(e) => setBillingAddress(e.target.value)}
              rows="3"
            />
          </div>
          <div className={styles.field}>
            <label>Shipping Address *</label>
            <textarea 
              value={shippingAddress} 
              onChange={(e) => setShippingAddress(e.target.value)}
              rows="3"
            />
          </div>
          <div className={styles.field}>
            <label>Billing Pincode *</label>
            <input 
              type="text" 
              value={billingPincode} 
              onChange={(e) => setBillingPincode(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Taluk</label>
            <input 
              type="text" 
              value={taluk} 
              readOnly 
              className={styles.readonly}
            />
          </div>
          <div className={styles.field}>
            <label>District</label>
            <input 
              type="text" 
              value={district} 
              readOnly 
              className={styles.readonly}
            />
          </div>
          <div className={styles.field}>
            <label>State</label>
            <input 
              type="text" 
              value={state} 
              readOnly 
              className={styles.readonly}
            />
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className={styles.section}>
        <h3>Order Details</h3>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label>Order Type</label>
            <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
              <option value="">-- Select --</option>
              <option value="New Order">New Order</option>
              <option value="Sample Order">Sample Order</option>
            </select>
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
            <input 
              type="text" 
              value={partyState} 
              readOnly 
              className={styles.readonly}
            />
          </div>
          <div className={styles.field}>
            <label>MR Name</label>
            <input 
              type="text" 
              value={mrName} 
              readOnly 
              className={styles.readonly}
            />
          </div>
        </div>
      </div>

      {/* Delivery & Payment */}
      <div className={styles.section}>
        <h3>Delivery & Payment</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Delivery Date</label>
            <input 
              type="date" 
              value={deliveryDate} 
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Delivery Time</label>
            <input 
              type="time" 
              value={deliveryTime} 
              onChange={(e) => setDeliveryTime(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Payment Terms</label>
            <select 
              value={paymentTerms} 
              onChange={(e) => setPaymentTerms(e.target.value)}
            >
              <option value="">-- Select Payment Terms --</option>
              <option value="Credit">Credit</option>
              <option value="Post Dated Cheque - Credit">Post Dated Cheque - Credit</option>
              <option value="Advance">Advance</option>
              <option value="Fully Paid">Fully Paid</option>
              <option value="Sample">Sample</option>
              <option value="Barter">Barter</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Payment Mode</label>
            <select 
              value={paymentMode} 
              onChange={(e) => setPaymentMode(e.target.value)}
            >
              <option value="">-- Select Payment Mode --</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Online Transfer">Online Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Payment Date</label>
            <input 
              type="date" 
              value={paymentDate} 
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Order Taken By</label>
            <select 
              value={orderBy} 
              onChange={(e) => setOrderBy(e.target.value)}
            >
              <option value="">-- Select --</option>
              {employeeList.map((emp, idx) => (
                <option key={idx} value={emp}>
                  {emp}
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
          <button 
            type="button" 
            onClick={addProduct} 
            className={styles.btnAdd}
          >
            + Add Product
          </button>
        </div>
        
        <div className={styles.productsTable}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>SKU</th>
                <th>MRP</th>
                <th>Pack</th>
                <th>Qty</th>
                <th>Disc %</th>
                <th>Max %</th>
                <th>Category</th>
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
                  
                  {/* EDITABLE: Product dropdown */}
                  <td>
                    <select 
                      value={product.productName}
                      onChange={(e) => handleProductSelection(index, e.target.value)}
                      className={styles.productDropdown}
                    >
                      <option value="">Select Product</option>
                      {availableProducts.map((productName, idx) => (
                        <option key={idx} value={productName}>
                          {productName}
                        </option>
                      ))}
                    </select>
                  </td>
                  
                  {/* READONLY: SKU */}
                  <td>
                    <input 
                      type="text" 
                      value={product.sku} 
                      readOnly 
                      className={styles.readonly}
                    />
                  </td>
                  
                  {/* READONLY: MRP */}
                  <td>
                    <input 
                      type="number" 
                      value={product.mrp} 
                      readOnly 
                      className={styles.readonly}
                    />
                  </td>
                  
                  {/* READONLY: Pack */}
                  <td>
                    <input 
                      type="text" 
                      value={product.packingSize} 
                      readOnly 
                      className={styles.readonly}
                    />
                  </td>
                  
                  {/* EDITABLE: Quantity */}
                  <td>
                    <input 
                      type="number" 
                      value={product.quantity}
                      onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                      className={styles.editableInput}
                      min="0"
                      step="1"
                    />
                  </td>
                  
                  {/* EDITABLE: Discount % (with cap) */}
                  <td>
                    <input 
                      type="number" 
                      value={product.discountPer}
                      onChange={(e) => updateProduct(index, 'discountPer', e.target.value)}
                      className={styles.editableInput}
                      min="0"
                      max={product.maxDiscountPer}
                      step="0.1"
                      title={`Max discount: ${product.maxDiscountPer}%`}
                    />
                  </td>
                  
                  {/* READONLY: Max Discount % */}
                  <td>
                    <input 
                      type="number" 
                      value={product.maxDiscountPer} 
                      readOnly 
                      className={styles.readonly}
                      style={{ background: '#fff3cd', fontWeight: 'bold' }}
                      title="Maximum allowed discount for this category"
                    />
                  </td>
                  
                  {/* READONLY: Product Category */}
                  <td>
                    <input 
                      type="text" 
                      value={product.productCategory} 
                      readOnly 
                      className={styles.readonly}
                      style={{ fontSize: '12px' }}
                    />
                  </td>
                  
                  {/* READONLY: Discount Amount */}
                  <td>
                    <input 
                      type="number" 
                      value={product.discountAmt} 
                      readOnly 
                      className={styles.readonly}
                    />
                  </td>
                  
                  {/* READONLY: Before Tax */}
                  <td>
                    <input 
                      type="number" 
                      value={product.beforeTax} 
                      readOnly 
                      className={styles.readonly}
                    />
                  </td>
                  
                  {/* READONLY: After Discount */}
                  <td>
                    <input 
                      type="number" 
                      value={product.afterDiscount} 
                      readOnly 
                      className={styles.readonly}
                    />
                  </td>
                  
                  {/* READONLY: CGST % */}
                  <td>
                    <input 
                      type="number" 
                      value={product.cgst} 
                      readOnly 
                      className={styles.readonly}
                    />
                  </td>
                  
                  {/* READONLY: CGST Amount */}
                  <td>
                    <input 
                      type="number" 
                      value={product.cgstAmt} 
                      readOnly 
                      className={styles.readonly}
                      style={{ 
                        background: state && partyState && state.toLowerCase() === partyState.toLowerCase() ? '#e8f5e9' : '#f5f5f5' 
                      }}
                    />
                  </td>
                  
                  {/* READONLY: SGST % */}
                  <td>
                    <input 
                      type="number" 
                      value={product.sgst} 
                      readOnly 
                      className={styles.readonly}
                    />
                  </td>
                  
                  {/* READONLY: SGST Amount */}
                  <td>
                    <input 
                      type="number" 
                      value={product.sgstAmt} 
                      readOnly 
                      className={styles.readonly}
                      style={{ 
                        background: state && partyState && state.toLowerCase() === partyState.toLowerCase() ? '#e8f5e9' : '#f5f5f5' 
                      }}
                    />
                  </td>
                  
                  {/* READONLY: IGST % */}
                  <td>
                    <input 
                      type="number" 
                      value={product.igst} 
                      readOnly 
                      className={styles.readonly}
                    />
                  </td>
                  
                  {/* READONLY: IGST Amount */}
                  <td>
                    <input 
                      type="number" 
                      value={product.igstAmt} 
                      readOnly 
                      className={styles.readonly}
                      style={{ 
                        background: state && partyState && state.toLowerCase() !== partyState.toLowerCase() ? '#fff3e0' : '#f5f5f5' 
                      }}
                    />
                  </td>
                  
                  {/* READONLY: Total */}
                  <td>
                    <input 
                      type="number" 
                      value={product.total} 
                      readOnly 
                      className={styles.readonly}
                      style={{ fontWeight: 'bold' }}
                    />
                  </td>
                  
                  {/* READONLY: Order QTY */}
                  <td>
                    <input 
                      type="number" 
                      value={product.orderQty} 
                      readOnly 
                      className={styles.readonly}
                    />
                  </td>
                  
                  {/* READONLY: Split Qty */}
                  <td>
                    <input 
                      type="number" 
                      value={product.splitQty} 
                      readOnly 
                      className={styles.readonly}
                    />
                  </td>
                  
                  {/* Remove button */}
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

      {/* Discounts */}
      <div className={styles.section}>
        <h3>Discount Structure</h3>
        <div className={styles.field}>
          <label>Discount Tier</label>
          <input 
            type="text" 
            value={discountTier} 
            readOnly 
            className={styles.readonly}
          />
        </div>
        <table className={styles.discountTable}>
          <thead>
            <tr>
              <th>Discount Category</th>
              <th>Discount %</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((discount, index) => (
              <tr key={index}>
                <td>
                  <input 
                    type="text" 
                    value={discount.category} 
                    readOnly 
                    className={styles.readonly}
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={discount.percentage} 
                    readOnly 
                    className={styles.readonly}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shipping Charges */}
      <div className={styles.section}>
        <h3>Shipping Charges</h3>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label>Shipping Charges</label>
            <input 
              type="number" 
              value={shippingCharges} 
              onChange={(e) => setShippingCharges(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Shipping Tax %</label>
            <input 
              type="number" 
              value={shippingTaxPercent} 
              onChange={(e) => setShippingTaxPercent(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Total Shipping Charge</label>
            <input 
              type="number" 
              value={totalShippingCharge} 
              onChange={(e) => setTotalShippingCharge(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Remarks */}
      <div className={styles.section}>
        <h3>Remarks</h3>
        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Sale Term Remark</label>
            <textarea 
              value={saleTermRemark} 
              onChange={(e) => setSaleTermRemark(e.target.value)}
              rows="3"
            />
          </div>
          <div className={styles.field}>
            <label>Invoice Remark</label>
            <textarea 
              value={invoiceRemark} 
              onChange={(e) => setInvoiceRemark(e.target.value)}
              rows="3"
            />
          </div>
          <div className={styles.field}>
            <label>Warehouse Remark</label>
            <textarea 
              value={warehouseRemark} 
              onChange={(e) => setWarehouseRemark(e.target.value)}
              rows="3"
            />
          </div>
        </div>
      </div>

      {/* Repeat Order */}
      <div className={styles.section}>
        <h3>Repeat Order Details</h3>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label>Reoccurance</label>
            <select 
              value={reoccurance} 
              onChange={(e) => setReoccurance(e.target.value)}
            >
              <option value="">-- Select --</option>
              <option value="Weekly">Weekly</option>
              <option value="Bi-Weekly">Bi-Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Next Order Date</label>
            <input 
              type="date" 
              value={nextOrderDate} 
              onChange={(e) => setNextOrderDate(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>End Order Date</label>
            <input 
              type="date" 
              value={endOrderDate} 
              onChange={(e) => setEndOrderDate(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label>Priority</label>
            <select 
              value={priority} 
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="">-- Select --</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className={styles.formActions}>
        <button 
          type="button" 
          onClick={onCancel} 
          className={styles.btnCancel}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className={styles.btnSubmit}
          disabled={loading || clientNotFound}
        >
          Save Order
        </button>
      </div>
    </form>
  );
}
