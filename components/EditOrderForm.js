import { useState, useEffect } from 'react';
import Select from 'react-select';
import styles from '../styles/EditOrderForm.module.css';
import SetupDataService from '../services/SetupDataService';

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
  const [paymentTerms, setPaymentTerms] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  
  // Products
  const [productList, setProductList] = useState([]);
  
  // Totals
  const [totals, setTotals] = useState({
    mrpTotal: '0',
    qtyTotal: '0',
    discountTotal: '0',
    taxBeforeTotal: '0',
    taxAfterTotal: '0',
    totalAmount: '0'
  });

  // Amounts
  const [beforeAmount, setBeforeAmount] = useState('0');
  const [afterAmount, setAfterAmount] = useState('0');

  // Repeat Order
  const [reoccurance, setReoccurance] = useState('');
  const [nextOrderDate, setNextOrderDate] = useState('');
  const [endOrderDate, setEndOrderDate] = useState('');
  const [priority, setPriority] = useState('');

  // Discounts
  const [discountTier, setDiscountTier] = useState('');
  const [discounts, setDiscounts] = useState([{ category: '', percentage: '' }]);
  const [showDiscounts, setShowDiscounts] = useState(false);

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
  const [productListOptions, setProductListOptions] = useState([]);
  const [discountStructure, setDiscountStructure] = useState([]);
  const [clientNotFound, setClientNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // =====================================================
  // UTILITY FUNCTION: Format product display name
  // =====================================================
  const formatProductDisplay = (combinedName) => {
    if (!combinedName) return '';
    const parts = combinedName.split(' - ');
    if (parts.length >= 4) {
      // parts[0] = Name, parts[2] = Size, parts[3] = Price
      return `${parts[0]} - ${parts[2]} - ${parts[3]}`;
    }
    return combinedName;
  };

  // =====================================================
  // REACT-SELECT CUSTOM STYLES
  // =====================================================
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '36px',
      fontSize: '13px',
      borderColor: state.isFocused ? '#2563eb' : '#e2e8f0',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(37, 99, 235, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#2563eb'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: '13px',
      padding: '8px 12px',
      backgroundColor: state.isSelected 
        ? '#2563eb' 
        : state.isFocused 
          ? '#f1f5f9' 
          : 'white',
      color: state.isSelected ? 'white' : '#1e293b',
      cursor: 'pointer'
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 1000
    }),
    singleValue: (provided) => ({
      ...provided,
      fontSize: '13px'
    }),
    placeholder: (provided) => ({
      ...provided,
      fontSize: '13px',
      color: '#94a3b8'
    }),
    input: (provided) => ({
      ...provided,
      fontSize: '13px'
    })
  };

  // Calculate totals whenever productList changes
  useEffect(() => {
    calculateTotals();
  }, [productList]);

  const calculateTotals = () => {
    let mrpSum = 0;
    let qtySum = 0;
    let discountSum = 0;
    let taxBeforeSum = 0;
    let taxAfterSum = 0;
    let totalSum = 0;

    productList.forEach(product => {
      const productMrpTotal = (parseFloat(product.mrp) || 0) * (parseFloat(product.quantity) || 0);
      mrpSum += productMrpTotal;
      
      qtySum += parseFloat(product.quantity || 0);
      discountSum += parseFloat(product.discountAmt || 0);
      taxBeforeSum += parseFloat(product.beforeTax || 0);
      taxAfterSum += parseFloat(product.afterDiscount || 0);
      totalSum += parseFloat(product.total || 0);
    });

    setTotals({
      mrpTotal: mrpSum.toFixed(2),
      qtyTotal: qtySum.toFixed(2),
      discountTotal: discountSum.toFixed(2),
      taxBeforeTotal: taxBeforeSum.toFixed(2),
      taxAfterTotal: taxAfterSum.toFixed(2),
      totalAmount: totalSum.toFixed(2)
    });

    setBeforeAmount(taxBeforeSum.toFixed(2));
    setAfterAmount(totalSum.toFixed(2));
  };

  // Load order data first
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
      const initialProducts = products.map(p => ({
        productName: p['Product Name'] || '',
        sku: p['SKU Code'] || '',
        mrp: p['MRP'] || '0',
        packingSize: p['Packing Size'] || '',
        quantity: p['Quantity'] || p['QNT'] || '0',
        orderQty: p['Order QTY'] || p['Quantity'] || p['QNT'] || '0',
        discountPer: p['Discount %'] || '0',
        discountAmt: p['Discount Amount'] || '0',
        beforeTax: p['Before Tax'] || '0',
        afterDiscount: p['After Discount'] || '0',
        cgst: p['CGST %'] || '0',
        sgst: p['SGST %'] || '0',
        igst: p['IGST %'] || '0',
        total: p['Total'] || '0',
        splitQty: '0',
        productCategory: p['Product Category'] || ''
      }));
      setProductList(initialProducts);
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
      const data = await SetupDataService.loadAllData();
      setSetupData(data);

      const clientData = processClientList(data.clientList, mobile);
      const employees = processEmployeeList(data.employeeList);
      setEmployeeList(employees);

      const parties = processDeliveryParties(data.distributorList);
      setDeliveryParties(parties);

      const productOpts = processProductList(data.productList);
      setProductListOptions(productOpts);

      const discountCaps = processDiscountCaps(data.discountList);
      setDiscountStructure(discountCaps);

      if (clientData.found) {
        setDiscountTier(clientData.discountTier);
        setTaluk(clientData.taluk);
        setDistrict(clientData.district);
        setState(clientData.state);
        setMrName(clientData.mrName);

        const discountData = processDiscountModule(
          data.discountStructure,
          clientData.discountTier,
          clientType
        );

        if (discountData.length > 0) {
          setDiscounts(discountData);
        }
      } else {
        setClientNotFound(true);
        setErrorMessage('Client mobile number not found or not verified in Client List. This order cannot be edited.');
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

    const client = clientList.rows.find(row => {
      const contactNo = row['Company Contact No'];
      const activeStatus = row['Active/Non Active'];
      
      return (contactNo === mobileNumber || contactNo === String(mobileNumber)) && 
             activeStatus === 'Verified';
    });

    if (client) {
      return {
        found: true,
        discountTier: client['Discount Tier'] || '',
        taluk: client['TALUK'] || '',
        district: client['DISTRICT'] || '',
        state: client['STATE/U.T.'] || '',
        mrName: client['Alloted MR Name'] || ''
      };
    }

    return { found: false };
  };

  const processDiscountModule = (discountStructure, tier, type) => {
    if (!discountStructure || !discountStructure.rows || !tier || !type) {
      return [];
    }

    const matchingDiscounts = discountStructure.rows.filter(row => {
      const rowClientType = row['Client Type'] || '';
      const rowTier = row['Tier'] || '';
      
      return rowClientType === type && rowTier === tier;
    });

    return matchingDiscounts.map(row => ({
      category: row['Category'] || '',
      percentage: row['TD'] || ''
    }));
  };

  const processEmployeeList = (employeeList) => {
    if (!employeeList || !employeeList.rows) {
      return [];
    }

    const users = employeeList.rows
      .map(row => row['ALL USERS'])
      .filter(user => user && user.trim() !== '');

    return [...new Set(users)];
  };

  const processDeliveryParties = (distributorList) => {
    if (!distributorList || !distributorList.rows) {
      return [];
    }

    const partiesMap = new Map();

    distributorList.rows.forEach(row => {
      const partyName = row['Delivery Party Name'];
      const state = row['State'];
      
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

  const processProductList = (productList) => {
    if (!productList || !productList.rows) {
      return [];
    }

    return productList.rows
      .filter(row => row['As Per Factory- Status'] !== 'Discontinue')
      .map(row => ({
        combinedName: row['Combined Name'] || '',
        productSKU: row['SKU'] || '',
        pack: row['Pack'] || '',
        price: row['Price'] || '0',
        productCategory: row['Products Category'] || '',
        taxRate: row['TAX RATE'] || '0'
      }))
      .filter(p => p.combinedName);
  };

  const processDiscountCaps = (discountList) => {
    if (!discountList || !discountList.rows) {
      return [];
    }

    return discountList.rows.map(row => ({
      category: row['Discount Category'] || '',
      maxDiscount: parseFloat(row['Discount %'] || '100')
    })).filter(d => d.category);
  };

  const getPresetDiscount = (productCategory) => {
    const discount = discounts.find(d => d.category === productCategory);
    return discount ? discount.percentage : '0';
  };

  const getMaxDiscount = (productCategory) => {
    const cap = discountStructure.find(d => d.category === productCategory);
    return cap ? cap.maxDiscount : 100;
  };

  const handlePartyNameChange = (selectedPartyName) => {
    setPartyName(selectedPartyName);
    const selectedParty = deliveryParties.find(p => p.name === selectedPartyName);
    if (selectedParty) {
      setPartyState(selectedParty.state);
    }
  };

  // =====================================================
  // ADD PRODUCT FUNCTION - Initial quantity = 1
  // =====================================================
  const addProduct = () => {
    setProductList([...productList, {
      productName: '',
      sku: '',
      mrp: '0',
      packingSize: '',
      quantity: '1',       // Default quantity is 1
      orderQty: '1',       // Default order quantity is 1
      discountPer: '0',
      discountAmt: '0',
      beforeTax: '0',
      afterDiscount: '0',
      cgst: '0',
      sgst: '0',
      igst: '0',
      total: '0',
      splitQty: '0',
      productCategory: ''
    }]);
  };

  // =====================================================
  // UPDATE PRODUCT FUNCTION - Complete calculation logic
  // =====================================================
  const updateProduct = (index, field, value) => {
    const updated = [...productList];
    
    if (field === 'productName') {
      const selectedProduct = productListOptions.find(p => p.combinedName === value);
      
      if (selectedProduct) {
        updated[index].productName = selectedProduct.combinedName;
        updated[index].sku = selectedProduct.productSKU;
        updated[index].mrp = selectedProduct.price;
        updated[index].packingSize = selectedProduct.pack;
        updated[index].productCategory = selectedProduct.productCategory;
        
        const presetDiscount = getPresetDiscount(selectedProduct.productCategory);
        updated[index].discountPer = presetDiscount;
        
        const taxRate = parseFloat(selectedProduct.taxRate || '0');
        if (state && partyState && state === partyState) {
          updated[index].cgst = (taxRate / 2).toString();
          updated[index].sgst = (taxRate / 2).toString();
          updated[index].igst = '0';
        } else {
          updated[index].cgst = '0';
          updated[index].sgst = '0';
          updated[index].igst = taxRate.toString();
        }
      }
    } else if (field === 'discountPer') {
      const maxDiscount = getMaxDiscount(updated[index].productCategory);
      const enteredDiscount = parseFloat(value) || 0;
      
      if (enteredDiscount > maxDiscount) {
        updated[index][field] = maxDiscount.toString();
        alert(`Maximum discount allowed for ${updated[index].productCategory} is ${maxDiscount}%`);
      } else if (enteredDiscount < 0) {
        updated[index][field] = '0';
      } else {
        updated[index][field] = value;
      }
    } else {
      updated[index][field] = value;
    }
    
    // CALCULATION LOGIC - Runs for every field change
    const qty = parseFloat(updated[index].quantity) || 0;
    const mrp = parseFloat(updated[index].mrp) || 0;
    const discPer = parseFloat(updated[index].discountPer) || 0;
    
    // Step 1: Calculate Before Tax
    const beforeTax = qty * mrp;
    updated[index].beforeTax = beforeTax.toFixed(2);
    
    // Step 2: Calculate Discount Amount
    const discAmt = (beforeTax * discPer) / 100;
    updated[index].discountAmt = discAmt.toFixed(2);
    
    // Step 3: Calculate After Discount
    const afterDisc = beforeTax - discAmt;
    updated[index].afterDiscount = afterDisc.toFixed(2);
    
    // Step 4: Get tax rates
    const cgstRate = parseFloat(updated[index].cgst) || 0;
    const sgstRate = parseFloat(updated[index].sgst) || 0;
    const igstRate = parseFloat(updated[index].igst) || 0;
    
    // Step 5: Calculate tax amounts (in background)
    const cgstAmount = (afterDisc * cgstRate) / 100;
    const sgstAmount = (afterDisc * sgstRate) / 100;
    const igstAmount = (afterDisc * igstRate) / 100;
    
    // Step 6: Calculate Total
    const totalAmount = afterDisc + cgstAmount + sgstAmount + igstAmount;
    updated[index].total = totalAmount.toFixed(2);
    
    setProductList(updated);
  };

  // Transform product options for react-select
  const productOptions = productListOptions.map(product => ({
    value: product.combinedName,
    label: formatProductDisplay(product.combinedName),
    product: product
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    
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
      DISOUCNT: productList.map(p => ''),
      DISAMT: productList.map(p => p.discountAmt),
      BEFORE: productList.map(p => p.beforeTax),
      AFTER: productList.map(p => p.afterDiscount),
      CGST: productList.map(p => p.cgst),
      SGST: productList.map(p => p.sgst),
      IGST: productList.map(p => p.igst),
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
      otifyesno: orderInFull,
      otifreason: orderInFullReason,
      
      mrptotal: totals.mrpTotal,
      qnttotal: totals.qtyTotal,
      distotal: totals.discountTotal,
      taxbeforetotal: totals.taxBeforeTotal,
      taxaftertotal: totals.taxAfterTotal,
      totaltotal: totals.totalAmount,
      Beforeamt: beforeAmount,
      Afteramt: afterAmount
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
        <div className={styles.errorMessage}>
          {errorMessage}
        </div>
      )}

      {/* Edit Order Status */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Edit Order Status</h3>
        <div className={styles.grid3}>
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

      {/* Buyer Details */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Buyer Details</h3>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label>Client Name <span className={styles.mandatory}>*</span></label>
            <input type="text" value={clientName} readOnly className={styles.readonly} />
          </div>
          <div className={styles.field}>
            <label>Mobile <span className={styles.mandatory}>*</span></label>
            <input type="tel" value={mobile} readOnly className={styles.readonly} />
          </div>
          <div className={styles.field}>
            <label>Email <span className={styles.mandatory}>*</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>PIN CODE <span className={styles.mandatory}>*</span></label>
            <input type="text" value={billingPincode} onChange={(e) => setBillingPincode(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label>Taluk</label>
            <input type="text" value={taluk} readOnly className={styles.readonly} />
          </div>
          <div className={styles.field}>
            <label>District</label>
            <input type="text" value={district} readOnly className={styles.readonly} />
          </div>
          <div className={styles.field}>
            <label>State</label>
            <input type="text" value={state} readOnly className={styles.readonly} />
          </div>
          <div className={styles.field}>
            <label>GST No. <span className={styles.mandatory}>*</span></label>
            <input type="text" value={gstNo} onChange={(e) => setGstNo(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Client Type <span className={styles.mandatory}>*</span></label>
            <input type="text" value={clientType} readOnly className={styles.readonly} />
          </div>
          <div className={styles.field}>
            <label>Client Category <span className={styles.mandatory}>*</span></label>
            <input type="text" value={clientCategory} readOnly className={styles.readonly} />
          </div>
          <div className={styles.field}>
            <label>Order Type <span className={styles.mandatory}>*</span></label>
            <select value={orderType} onChange={(e) => setOrderType(e.target.value)} required>
              <option value="">-- select --</option>
              <option value="New Order">New Order</option>
              <option value="Sample Order">Sample Order</option>
            </select>
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Billing Address <span className={styles.mandatory}>*</span></label>
            <textarea 
              value={billingAddress} 
              onChange={(e) => setBillingAddress(e.target.value)} 
              required 
              rows="3" 
            />
          </div>
          <div className={styles.field}>
            <label>Shipping Address <span className={styles.mandatory}>*</span></label>
            <div>
              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="sameAsBilling"
                  checked={isShippingSameAsBilling}
                  onChange={() => {
                    setIsShippingSameAsBilling(!isShippingSameAsBilling);
                    if (!isShippingSameAsBilling) {
                      setShippingAddress(billingAddress);
                    }
                  }}
                />
                <label htmlFor="sameAsBilling">Check if billing and shipping is same</label>
              </div>
              <textarea 
                value={shippingAddress} 
                onChange={(e) => setShippingAddress(e.target.value)} 
                required 
                rows="3" 
              />
            </div>
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.field}>
            <label>Order Placed to Party <span className={styles.mandatory}>*</span></label>
            <select 
              value={partyName} 
              onChange={(e) => handlePartyNameChange(e.target.value)}
              required
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
            <label>State (Order Placed to Party) <span className={styles.mandatory}>*</span></label>
            <input type="text" value={partyState} readOnly className={styles.readonly} />
          </div>
        </div>
      </div>

      {/* Discounts */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Discounts</h3>
          <button 
            type="button" 
            className={styles.toggleButton}
            onClick={() => setShowDiscounts(!showDiscounts)}
          >
            {showDiscounts ? '▲ Hide' : '▼ Show'} Discounts
          </button>
        </div>
        
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label>Discount Tier <span className={styles.mandatory}>*</span></label>
            <input 
              type="text" 
              value={discountTier} 
              readOnly 
              className={styles.readonly}
            />
          </div>
        </div>

        {showDiscounts && (
          <div className={styles.discountTable}>
            <table>
              <thead>
                <tr>
                  <th>Discount Category</th>
                  <th>Discount %</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Products - WITH SEARCHABLE DROPDOWN */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Add Product Details</h3>
          <button type="button" onClick={addProduct} className={styles.btnAdd}>+ Add More</button>
        </div>
        
        <div className={styles.productsTable}>
          <table>
            <thead>
              <tr>
                <th>Select Products</th>
                <th>MRP</th>
                <th>Packing Size</th>
                <th>Qty.</th>
                <th>Discount %</th>
                <th>Dis. Amt</th>
                <th>Taxable Before Dis.</th>
                <th>Taxable After Dis.</th>
                <th>CGST %</th>
                <th>SGST %</th>
                <th>IGST %</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {productList.map((product, index) => (
                <tr key={index}>
                 <td style={{ minWidth: '250px', position: 'relative' }}>
  <Select
    value={
      product.productName 
        ? productOptions.find(opt => opt.value === product.productName) || null
        : null
    }
    onChange={(selectedOption) => {
      updateProduct(
        index, 
        'productName', 
        selectedOption ? selectedOption.value : ''
      );
    }}
    options={productOptions}
    placeholder="Type to search..."
    isClearable
    isSearchable
    styles={customSelectStyles}
    filterOption={filterOption}
    noOptionsMessage={({ inputValue }) => 
      inputValue 
        ? `No products found matching "${inputValue}"`
        : "Start typing to search products"
    }
    menuPortalTarget={document.body}  // KEY FIX: Renders menu outside table
    menuPosition="fixed"              // KEY FIX: Fixed positioning
  />
</td>
                  <td><input type="text" value={product.mrp} readOnly className={styles.readonly} /></td>
                  <td><input type="text" value={product.packingSize} readOnly className={styles.readonly} /></td>
                  <td>
                    <input 
                      type="number" 
                      value={product.quantity}
                      onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                      className={styles.numberInput}
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      value={product.discountPer}
                      onChange={(e) => updateProduct(index, 'discountPer', e.target.value)}
                      title={`Max: ${getMaxDiscount(product.productCategory)}%`}
                      className={styles.numberInput}
                    />
                  </td>
                  <td><input type="text" value={product.discountAmt} readOnly className={styles.readonly} /></td>
                  <td><input type="text" value={product.beforeTax} readOnly className={styles.readonly} /></td>
                  <td><input type="text" value={product.afterDiscount} readOnly className={styles.readonly} /></td>
                  <td><input type="text" value={product.cgst} readOnly className={styles.readonly} /></td>
                  <td><input type="text" value={product.sgst} readOnly className={styles.readonly} /></td>
                  <td><input type="text" value={product.igst} readOnly className={styles.readonly} /></td>
                  <td><input type="text" value={product.total} readOnly className={styles.readonly} /></td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className={styles.totalRow}>
                <td className={styles.totalLabel}>Total</td>
                <td><input type="text" value={totals.mrpTotal} readOnly className={styles.readonly} /></td>
                <td></td>
                <td><input type="text" value={totals.qtyTotal} readOnly className={styles.readonly} /></td>
                <td></td>
                <td><input type="text" value={totals.discountTotal} readOnly className={styles.readonly} /></td>
                <td><input type="text" value={totals.taxBeforeTotal} readOnly className={styles.readonly} /></td>
                <td><input type="text" value={totals.taxAfterTotal} readOnly className={styles.readonly} /></td>
                <td colSpan="3"></td>
                <td className={styles.finalTotal}><input type="text" value={totals.totalAmount} readOnly className={styles.readonly} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total Amount Display */}
        <div className={styles.totalAmountSection}>
          <div className={styles.totalAmountRow}>
            <span>Total Amount Before Discount:</span>
            <strong className={styles.beforeAmount}>Rs. {beforeAmount}/-</strong>
          </div>
          <div className={styles.totalAmountRow}>
            <span>Total Amount After Discount:</span>
            <strong className={styles.afterAmount}>Rs. {afterAmount}/-</strong>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Additional Details</h3>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label>Shipping, Packing and Delivery Charges (Amount):</label>
            <input type="number" value={shippingCharges} onChange={(e) => setShippingCharges(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Note (Remarks):</label>
            <input type="text" value={shippingChargesRemark} onChange={(e) => setShippingChargesRemark(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Shipping Tax (%):</label>
            <input type="number" value={shippingTaxPercent} readOnly className={styles.readonly} />
          </div>
          <div className={styles.field}>
            <label>Type of (Remarks):</label>
            <input type="text" value={shippingTaxPercentRemark} onChange={(e) => setShippingTaxPercentRemark(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Total Shipping Charge (Amount):</label>
            <input type="number" value={totalShippingCharge} readOnly className={styles.readonly} />
          </div>
          <div className={styles.field}>
            <label>Type of (Remarks):</label>
            <input type="text" value={totalShippingChargeRemark} onChange={(e) => setTotalShippingChargeRemark(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Payment and Delivery */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Payment and Delivery</h3>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label>Preferred Call Time 1</label>
            <input type="time" value={preferredCallTime1} onChange={(e) => setPreferredCallTime1(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Preferred Call Time 2</label>
            <input type="time" value={preferredCallTime2} onChange={(e) => setPreferredCallTime2(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Delivery Required By - Date</label>
            <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Payment Terms <span className={styles.mandatory}>*</span></label>
            <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} required>
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
            <label>Payment Mode <span className={styles.mandatory}>*</span></label>
            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} required>
              <option value="">-- Select Payment Mode --</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="COD">COD</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Wallet">Wallet</option>
              <option value="Credit">Credit</option>
              <option value="Paytm">Paytm</option>
              <option value="Sample/Barter">Sample/Barter</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Payment collection date 1</label>
            <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Payment Terms and Others */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Payment Terms and Others</h3>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label>Expected Date of Dispatch</label>
            <input type="date" value={dispatchDate} onChange={(e) => setDispatchDate(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Expected Time of Dispatch</label>
            <input type="time" value={dispatchTime} onChange={(e) => setDispatchTime(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Next Order Fixed Date</label>
            <input type="date" value={nextOrderDate} onChange={(e) => setNextOrderDate(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Reoccurrence Interval</label>
            <select value={reoccurance} onChange={(e) => setReoccurance(e.target.value)}>
              <option value="">-- select --</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>End Date</label>
            <input type="date" value={endOrderDate} onChange={(e) => setEndOrderDate(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Rocket Client</label>
            <div className={styles.checkboxGroup}>
              <input 
                type="checkbox" 
                id="priority" 
                checked={priority === 'Yes'}
                onChange={(e) => setPriority(e.target.checked ? 'Yes' : '')}
              />
              <label htmlFor="priority">Yes</label>
            </div>
          </div>
        </div>
      </div>

      {/* Remarks */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Remarks</h3>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label>Remarks - Show to Kairali Team</label>
            <input type="text" value={saleTermRemark} onChange={(e) => setSaleTermRemark(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Remarks - Show in Invoice</label>
            <input type="text" value={invoiceRemark} onChange={(e) => setInvoiceRemark(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Remarks - Show to Dispatch Team</label>
            <input type="text" value={warehouseRemark} onChange={(e) => setWarehouseRemark(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label>Available MR/ASM</label>
            <input type="text" value={mrName} readOnly className={styles.readonly} />
          </div>
        </div>
      </div>

      {/* File Upload and OTIF */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Images/ Invoice Upload & Others</h3>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label>Images/Invoice Upload</label>
            <input type="file" onChange={(e) => {
              const selectedFile = e.target.files[0];
              if (selectedFile) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  setFileData(reader.result.split(',')[1]);
                  setFile(selectedFile);
                };
                reader.readAsDataURL(selectedFile);
              }
            }} />
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
          <div className={styles.field}>
            <label>Is order in Full - Yes/No <span className={styles.mandatory}>*</span></label>
            <select value={orderInFull} onChange={(e) => setOrderInFull(e.target.value)} required>
              <option value="">--Select--</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>Reason (If No)</label>
            <select value={orderInFullReason} onChange={(e) => setOrderInFullReason(e.target.value)}>
              <option value="">--Select--</option>
              <option value="Shortage of Stock">Shortage of Stock</option>
              <option value="Incorrect Discount">Incorrect Discount</option>
              <option value="Payment issue">Payment issue</option>
              <option value="Shippers issue">Shippers issue</option>
              <option value="Employee issue such as leave, absent etc">Employee issue such as leave, absent etc</option>
              <option value="Technical Issues">Technical Issues</option>
              <option value="Short Expiry">Short Expiry</option>
              <option value="Duplicate Order">Duplicate Order</option>
              <option value="Edited and Reorderd">Edited and Reorderd</option>
              <option value="Labelling issue">Labelling issue</option>
              <option value="Botteling issue">Botteling issue</option>
              <option value="Packaging issue">Packaging issue</option>
              <option value="Raw material supply issue">Raw material supply issue</option>
              <option value="Production damage">Production damage</option>
              <option value="Storage damage">Storage damage</option>
              <option value="Others">Others</option>
            </select>
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
        >
          Save Changes
        </button>
      </div>

      {clientNotFound && (
        <div className={styles.errorMessage}>
          ⚠️ This order cannot be edited because the mobile number was not found or not verified in the Client List.
        </div>
      )}
    </form>
  );
}
