import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/NewEditOrderForm.module.css';
import proStyles from '../styles/ProfessionalForm.module.css';
import SetupDataService from '../services/SetupDataService';

export default function EditOrderForm({ order, products, onSave, onCancel, selectedStatus }) {
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
  const [deliveryRequiredDate, setDeliveryRequiredDate] = useState('');
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
  const [discountsOpen, setDiscountsOpen] = useState(false);

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

  // Calculated totals
  const [mrpTotal, setMrpTotal] = useState('0.00');
  const [qntTotal, setQntTotal] = useState('0.00');
  const [disTotal, setDisTotal] = useState('0.00');
  const [taxBeforeTotal, setTaxBeforeTotal] = useState('0.00');
  const [taxAfterTotal, setTaxAfterTotal] = useState('0.00');
  const [totalTotal, setTotalTotal] = useState('0.00');


  // Load order data first
  useEffect(() => {
    if (order) {
      setEditOrderStatus(selectedStatus || order['Order Status'] || order['Status'] || '');
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
      
      setPartyName(order['Party Name'] || '');
      setPartyState(order['Party State'] || '');
      setMrName(order['MR Name'] || '');
      
      setDeliveryRequiredDate(order['Delivery Required Date']?.split(' ')[0] || '');
      
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
      setProductList(products.map(p => ({
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

  useEffect(() => {
    const totals = productList.reduce((acc, p) => {
        acc.mrp += parseFloat(p.mrp) || 0;
        acc.qnt += parseFloat(p.quantity) || 0;
        acc.dis += parseFloat(p.discountAmt) || 0;
        acc.taxBefore += parseFloat(p.beforeTax) || 0;
        acc.taxAfter += parseFloat(p.afterDiscount) || 0;
        acc.total += parseFloat(p.total) || 0;
        return acc;
    }, { mrp: 0, qnt: 0, dis: 0, taxBefore: 0, taxAfter: 0, total: 0 });

    setMrpTotal(totals.mrp.toFixed(2));
    setQntTotal(totals.qnt.toFixed(2));
    setDisTotal(totals.dis.toFixed(2));
    setTaxBeforeTotal(totals.taxBefore.toFixed(2));
    setTaxAfterTotal(totals.taxAfter.toFixed(2));
    setTotalTotal(totals.total.toFixed(2));
  }, [productList]);

  const processClientList = (clientList, mobileNumber) => {
    if (!clientList || !clientList.rows) return { found: false };
    const client = clientList.rows.find(row =>
      (row['Company Contact No'] === mobileNumber || String(row['Company Contact No']) === mobileNumber) &&
      row['Active/Non Active'] === 'Verified'
    );
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
    if (!discountStructure || !discountStructure.rows || !tier || !type) return [];
    return discountStructure.rows
      .filter(row => row['Client Type'] === type && row['Tier'] === tier)
      .map(row => ({ category: row['Category'] || '', percentage: row['TD'] || '' }));
  };

  const processEmployeeList = (employeeList) => {
    if (!employeeList || !employeeList.rows) return [];
    const users = employeeList.rows
      .map(row => row['ALL USERS'])
      .filter(user => user && user.trim() !== '');
    return [...new Set(users)];
  };

  const processDeliveryParties = (distributorList) => {
    if (!distributorList || !distributorList.rows) return [];
    const partiesMap = new Map();
    distributorList.rows.forEach(row => {
      const partyName = row['Delivery Party Name'];
      if (partyName && partyName.trim() !== '') {
        if (!partiesMap.has(partyName)) {
          partiesMap.set(partyName, row['State'] || '');
        }
      }
    });
    return Array.from(partiesMap.entries()).map(([name, state]) => ({ name, state }));
  };

  const handlePartyNameChange = (selectedPartyName) => {
    setPartyName(selectedPartyName);
    const selectedParty = deliveryParties.find(p => p.name === selectedPartyName);
    if (selectedParty) {
      setPartyState(selectedParty.state);
    }
  };

  const addProduct = () => {
    setProductList([...productList, {
      productName: '', sku: '', mrp: '0', packingSize: '', quantity: '0', orderQty: '0',
      discountPer: '0', discountAmt: '0', beforeTax: '0', afterDiscount: '0',
      cgst: '0', cgstAmt: '0', sgst: '0', sgstAmt: '0', igst: '0', igstAmt: '0',
      total: '0', splitQty: '0'
    }]);
  };

  const removeProduct = (index) => {
    setProductList(productList.filter((_, i) => i !== index));
  };

  const updateProduct = (index, field, value) => {
    const updated = [...productList];
    updated[index][field] = value;
    
    if (['quantity', 'mrp', 'discountPer', 'cgst', 'sgst', 'igst'].includes(field)) {
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFileData(reader.result.split(',')[1]);
            setFile(selectedFile);
        };
        reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (clientNotFound) {
      alert('Cannot save order. Client mobile number not found or not verified in Client List.');
      return;
    }
    const formData = {
      editstatus: editOrderStatus, clientname: clientName, mobile, email,
      clienttypename: clientType, clientcategory1: clientCategory, GSTNO: gstNo,
      Baddress: billingAddress, saddress: shippingAddress, BPINCODE: billingPincode,
      talukname: taluk, districtname: district, state, ordertype: orderType,
      partyname: partyName, partystatename: partyState, mrname_name: mrName,
      deliverydatebyname: deliveryRequiredDate,
      paymentterm: paymentTerms, paymentmodename: paymentMode,
      paymentdate: [paymentDate, '', '', '', ''],
      calltime1: preferredCallTime1, calltime2: preferredCallTime2,
      productname: productList.map(p => p.productName), MRP: productList.map(p => p.mrp),
      PACKINGSIZE: productList.map(p => p.packingSize), QNT: productList.map(p => p.quantity),
      OrderQTY: productList.map(p => p.orderQty), DISPER: productList.map(p => p.discountPer),
      DISOUCNT: productList.map(p => ''), DISAMT: productList.map(p => p.discountAmt),
      BEFORE: productList.map(p => p.beforeTax), AFTER: productList.map(p => p.afterDiscount),
      CGST: productList.map(p => p.cgst), CGSTAMT: productList.map(p => p.cgstAmt),
      SGST: productList.map(p => p.sgst), SGSTAMT: productList.map(p => p.sgstAmt),
      IGST: productList.map(p => p.igst), IGSTAMT: productList.map(p => p.igstAmt),
      TOTAL: productList.map(p => p.total), SplitQTY: productList.map(p => p.splitQty),
      discounttiername: discountTier, discountcategory: discounts.map(d => d.category),
      discount: discounts.map(d => d.percentage), scharge: shippingCharges,
      sremark: shippingChargesRemark, Stax: totalShippingCharge, Staxremark: totalShippingChargeRemark,
      staxper: shippingTaxPercent, staxperrem: shippingTaxPercentRemark,
      saletermremark: saleTermRemark, invoiceremark: invoiceRemark, warehouseremark: warehouseRemark,
      reoccurance, NextOrderDate: nextOrderDate, EndOrderDate: endOrderDate, Priority: priority,
      Deliverydate: dispatchDate, Deliverytime: dispatchTime, //Mapped to Expected Dispatch Date/Time
      data: fileData, filename: file ? file.name : null, mimetype: file ? file.type : null,
      orderby: orderBy, otifyesno: orderInFull, otifreason: orderInFullReason,
      taxbeforetotal: taxBeforeTotal, distotal: disTotal, Beforeamt: taxBeforeTotal, Afteramt: totalTotal
    };
    onSave(formData);
  };

  return (
    <>
      <Head>
        <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css" />
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" />
      </Head>

      <div>
        <div className="cover">
          <div className="rightpart">
            <form name="aspnetForm" onSubmit={handleSubmit}>
              <div className={`container ${styles.bgwhite} ${styles.formContainer}`}>

                <div className={proStyles.formBody}>
                  {errorMessage && (
                    <div className="alert alert-danger">{errorMessage}</div>
                  )}

                  <div className={`row ${proStyles.section}`}>
                    <div className="col-md-12"><h5>Buyer Details</h5></div>
                  </div>

                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label htmlFor="edit">Edit Order Status</label>
                      <select id="edit" className="form-control" name="editstatus" value={editOrderStatus} readOnly>
                        <option value={editOrderStatus}>{editOrderStatus}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="name">Client Name <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" id="name" name="clientname" value={clientName} readOnly />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="mobile">Client Mobile <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" id="mobile" name="mobile" value={mobile} readOnly />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="Email">Client Email <span className="text-danger">*</span></label>
                      <input type="email" className="form-control" id="Email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-2">
                    <div className="form-group">
                      <label htmlFor="BPINCODE">PIN CODE <span className="text-danger">*</span></label>
                      <input type="text" className="form-control" size={6} id="BPINCODE" name="BPINCODE" value={billingPincode} onChange={e => setBillingPincode(e.target.value)} required />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="form-group">
                      <label htmlFor="talukid">Taluk</label>
                      <input type="text" className="form-control" id="talukid" name="talukname" value={taluk} readOnly />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="form-group">
                      <label htmlFor="districtid">District</label>
                      <input type="text" className="form-control" id="districtid" name="districtname" value={district} readOnly />
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="form-group">
                      <label htmlFor="state">State</label>
                      <select id="state" className="form-control" name="state" value={state} readOnly>
                        <option value={state}>{state}</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="gstnumber">GST No.</label>
                      <input type="text" className="form-control" id="gstnumber" name="GSTNO" value={gstNo} onChange={e => setGstNo(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="clienttype">Client Type <span className="text-danger">*</span></label>
                      <select id="clienttype" className="form-control" name="clienttypename" value={clientType} readOnly>
                        <option value={clientType}>{clientType}</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="ClientCategory">Client Category <span className="text-danger">*</span></label>
                      <select id="ClientCategory" className="form-control" name="clientcategory1" value={clientCategory} readOnly>
                        <option value={clientCategory}>{clientCategory}</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="ordertype">Order Type <span className="text-danger">*</span></label>
                      <select className="form-control" id="ordertype" name="ordertype" value={orderType} onChange={e => setOrderType(e.target.value)} required>
                        <option value="New Order">New Order</option>
                        <option value="Sample Order">Sample Order</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="exampleFormControlTextarea1">Billing Address <span className="text-danger">*</span></label>
                      <textarea className="form-control" id="exampleFormControlTextarea1" rows="3" name="Baddress" value={billingAddress} onChange={e => setBillingAddress(e.target.value)} required></textarea>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="exampleFormControlTextarea2">Shipping Address <span className="text-danger">*</span></label>
                      <input type="checkbox" id="checkboxshipping" name="checkboxshipping" checked={isShippingSameAsBilling} onChange={() => {
                          setIsShippingSameAsBilling(!isShippingSameAsBilling);
                          if (!isShippingSameAsBilling) setShippingAddress(billingAddress);
                      }} />
                      <label htmlFor="checkboxshipping" className="ml-2">Check if billing and shipping is same</label>
                      <textarea className="form-control" id="exampleFormControlTextarea2" rows="3" name="saddress" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} required></textarea>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="partyid">Order Placed to Party <span className="text-danger">*</span></label>
                      <select id="partyid" className="form-control" name="partyname" value={partyName} onChange={(e) => handlePartyNameChange(e.target.value)} required>
                        <option value="">-- Select Party --</option>
                        {deliveryParties.map((party, idx) => (
                          <option key={idx} value={party.name}>{party.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="partystateid">State (Order Placed to Party) <span className="text-danger">*</span></label>
                      <select id="partystateid" className="form-control" name="partystatename" value={partyState} readOnly>
                        <option value={partyState}>{partyState}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Discounts */}
                <div className={`row ${proStyles.section}`}>
                  <div className="col-md-12">
                    <h5 className="d-flex justify-content-between align-items-center">
                      Discounts
                      <button type="button" className={`btn ${proStyles.btnLink}`} onClick={() => setDiscountsOpen(!discountsOpen)}>
                        {discountsOpen ? 'Collapse' : 'Expand'}
                      </button>
                    </h5>
                  </div>
                </div>
                {discountsOpen && (
                  <>
                    <div className="row">
                      <div className="col-md-3"></div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="discounttier">Discount Tier <span className="text-danger">*</span></label>
                          <select id="discounttier" className="form-control" name="discounttiername" value={discountTier} readOnly required>
                            <option value={discountTier}>{discountTier}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-12">
                        <table className="mx-auto" style={{width: '49%'}}>
                          <thead>
                            <tr style={{color:"#8e9e34", backgroundColor:"#f0f0f0"}}>
                              <th>Discount Category</th>
                              <th>Discount %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {discounts.map((d, i) => (
                              <tr key={i}>
                                <td><input type="text" className="form-control" value={d.category} readOnly /></td>
                                <td><input type="number" className="form-control" value={d.percentage} readOnly /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
                <br />

                {/* Add Product Details */}
                <div className={`row ${proStyles.section}`}><div className="col-md-12"><h5>Add Product Details</h5></div></div>
                <div className="row">
                  <div className="col-md-12">
                    <div className="table-responsive">
                      <table className={styles.tblborderAddproduct}>
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
                              <td><input type="text" value={product.productName} onChange={(e) => updateProduct(index, 'productName', e.target.value)} /></td>
                              <td><input type="text" value={product.sku} onChange={(e) => updateProduct(index, 'sku', e.target.value)} /></td>
                              <td><input type="number" value={product.mrp} onChange={(e) => updateProduct(index, 'mrp', e.target.value)} /></td>
                              <td><input type="text" value={product.packingSize} onChange={(e) => updateProduct(index, 'packingSize', e.target.value)} /></td>
                              <td><input type="number" value={product.quantity} onChange={(e) => updateProduct(index, 'quantity', e.target.value)} /></td>
                              <td><input type="number" value={product.discountPer} onChange={(e) => updateProduct(index, 'discountPer', e.target.value)} /></td>
                              <td><input type="text" value={product.discountAmt} readOnly /></td>
                              <td><input type="text" value={product.beforeTax} readOnly /></td>
                              <td><input type="text" value={product.afterDiscount} readOnly /></td>
                              <td><input type="number" value={product.cgst} onChange={(e) => updateProduct(index, 'cgst', e.target.value)} /></td>
                              <td><input type="text" value={product.cgstAmt} readOnly /></td>
                              <td><input type="number" value={product.sgst} onChange={(e) => updateProduct(index, 'sgst', e.target.value)} /></td>
                              <td><input type="text" value={product.sgstAmt} readOnly /></td>
                              <td><input type="number" value={product.igst} onChange={(e) => updateProduct(index, 'igst', e.target.value)} /></td>
                              <td><input type="text" value={product.igstAmt} readOnly /></td>
                              <td><input type="text" value={product.total} readOnly /></td>
                              <td><input type="text" value={product.orderQty} readOnly /></td>
                              <td><input type="number" value={product.splitQty} onChange={(e) => updateProduct(index, 'splitQty', e.target.value)} /></td>
                              <td><button type="button" onClick={() => removeProduct(index)} className="btn btn-danger btn-sm">Remove</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="col-md-12"><div className="text-right"><input type="button" value="+ Add More" className="btn btn-success btn-sm" onClick={addProduct} /></div></div>
                </div>

                {/* Additional Details */}
                <div className={`row ${proStyles.section}`}><div className="col-md-12"><h5>Additional Details</h5></div></div>
                <div className="form-group row">
                  <div className="col-sm-4"><label>Shipping, Packing and Delivery Charges (Amount):</label></div>
                  <div className="col-sm-2"><input type="text" className="form-control" value={shippingCharges} onChange={e => setShippingCharges(e.target.value)} /></div>
                  <div className="col-sm-4"><input type="text" className="form-control" placeholder="Note (Remarks)" value={shippingChargesRemark} onChange={e => setShippingChargesRemark(e.target.value)} /></div>
                </div>
                <div className="form-group row">
                  <div className="col-sm-4"><label>Shipping Tax (%):</label></div>
                  <div className="col-sm-2"><input type="text" className="form-control" value={shippingTaxPercent} readOnly /></div>
                  <div className="col-sm-4"><input type="text" className="form-control" placeholder="Type of (Remarks)" value={shippingTaxPercentRemark} onChange={e => setShippingTaxPercentRemark(e.target.value)} /></div>
                </div>
                <div className="form-group row">
                  <div className="col-sm-4"><label>Total Shipping Charge (Amount):</label></div>
                  <div className="col-sm-2"><input type="text" className="form-control" value={totalShippingCharge} readOnly /></div>
                  <div className="col-sm-4"><input type="text" className="form-control" placeholder="Type of (Remarks)" value={totalShippingChargeRemark} onChange={e => setTotalShippingChargeRemark(e.target.value)} /></div>
                </div>
                <div className="row">
                  <div className="col-md-12 text-right">
                    Total Amount Before Discount: <strong><span className="text-danger">Rs. {taxBeforeTotal}/-</span></strong><br />
                    Total Amount After Discount: <strong><span className="text-success">Rs. {totalTotal}/-</span></strong>
                  </div>
                </div>

                {/* Payment & Delivery */}
                <div className="row">
                  <div className="col-md-6">
                    <div className={proStyles.section}><h5>Payment and Delivery</h5></div>
                    <label>Prefered Call Time</label>
                    <div className="row">
                      <div className="col-md-6"><input type="time" className="form-control" value={preferredCallTime1} onChange={e => setPreferredCallTime1(e.target.value)} /></div>
                      <div className="col-md-6"><input type="time" className="form-control" value={preferredCallTime2} onChange={e => setPreferredCallTime2(e.target.value)} /></div>
                    </div>
                    <div className="form-group">
                      <label>Delivery Required By - Date</label>
                      <input type="date" className="form-control" value={deliveryRequiredDate} onChange={e => setDeliveryRequiredDate(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Payment Terms <span className="text-danger">*</span></label>
                      <select className="form-control" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} required>
                          <option value="">-- Select --</option><option value="Credit">Credit</option><option value="Post Dated Cheque - Credit">Post Dated Cheque - Credit</option>
                          <option value="Advance">Advance</option><option value="Fully Paid">Fully Paid</option><option value="Sample">Sample</option>
                          <option value="Barter">Barter</option><option value="Others">Others</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Payment Mode <span className="text-danger">*</span></label>
                      <select className="form-control" value={paymentMode} onChange={e => setPaymentMode(e.target.value)} required>
                        <option value="">-- Select --</option><option value="Cash">Cash</option><option value="Cheque">Cheque</option><option value="COD">COD</option>
                        <option value="UPI">UPI</option><option value="Bank Transfer">Bank Transfer</option><option value="Wallet">Wallet</option>
                        <option value="Credit">Credit</option><option value="Paytm">Paytm</option><option value="Sample/Barter">Sample/Barter</option>
                        <option value="Credit Card">Credit Card</option><option value="Others">Others</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h5>Payment Date</h5><hr />
                    <div className="form-group">
                      <label>Payment collection date 1</label>
                      <input type="date" className="form-control" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Other Details */}
                <div className="row">
                  <div className="col-md-6">
                    <h5>Payment Terms and Others</h5><hr />
                    <label>Expected Date and time of the Dispatch</label>
                    <div className="row">
                      <div className="col-md-6"><input type="date" className="form-control" value={dispatchDate} onChange={e => setDispatchDate(e.target.value)} /></div>
                      <div className="col-md-6"><input type="time" className="form-control" value={dispatchTime} onChange={e => setDispatchTime(e.target.value)} /></div>
                    </div>
                    <h5>Next Order</h5><hr />
                    <div className="form-group"><label>Next Order Fixed Date</label><input type="date" className="form-control" value={nextOrderDate} onChange={e => setNextOrderDate(e.target.value)} /></div>
                    <div className="form-group">
                      <label>Reoccurrence Interval</label>
                      <select className="form-control" value={reoccurance} onChange={e => setReoccurance(e.target.value)}>
                        <option value="">-- select --</option><option value="Weekly">Weekly</option><option value="Monthly">Monthly</option><option value="Yearly">Yearly</option>
                      </select>
                    </div>
                    <div className="form-group"><label>End Date</label><input type="date" className="form-control" value={endOrderDate} onChange={e => setEndOrderDate(e.target.value)} /></div>
                    <div className="form-group"><input type="checkbox" id="Priority" name="Priority" value="Yes" checked={priority === 'Yes'} onChange={e => setPriority(e.target.checked ? 'Yes' : '')} /> <label htmlFor="Priority">Rocket Client</label></div>
                  </div>
                  <div className="col-md-6">
                    <h5>Remarks</h5><hr />
                    <div className="form-group"><label>Remarks - Show to Kairali Team</label><input type="text" className="form-control" value={saleTermRemark} onChange={e => setSaleTermRemark(e.target.value)} /></div>
                    <div className="form-group"><label>Remarks - Show in Invoice</label><input type="text" className="form-control" value={invoiceRemark} onChange={e => setInvoiceRemark(e.target.value)} /></div>
                    <div className="form-group"><label>Remarks - Show to Dispatch Team</label><input type="text" className="form-control" value={warehouseRemark} onChange={e => setWarehouseRemark(e.target.value)} /></div>
                    <div className="form-group">
                      <label>Available MR/ASM</label>
                      <select className="form-control" value={mrName} readOnly><option value={mrName}>{mrName}</option></select>
                    </div>
                  </div>
                </div>

                {/* Upload & OTIF */}
                <div className="row"><div className="col-md-12"><h5>Images/ Invoice Upload & Others</h5><hr /></div></div>
                <div className="row">
                  <div className="col-md-3"></div>
                  <div className="col-md-6">
                    <div className="form-group">
                        <div className="custom-file"><input type="file" className="custom-file-input" id="uploadfile" onChange={handleFileChange} /><label className="custom-file-label" htmlFor="customFile">Choose file</label></div>
                        {file && <div id="file-upload-filename">{file.name}</div>}
                    </div>
                    <div className="form-group">
                      <label>Order Place by</label>
                      <select className="form-control" value={orderBy} onChange={e => setOrderBy(e.target.value)} required>
                        <option value="">-- Select --</option>
                        {employeeList.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row"><div className="col-md-12"><h5>Otif</h5><hr /></div></div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Is order in Full - Yes/No <span className="text-danger">*</span></label>
                      <select className="form-control" value={orderInFull} onChange={e => setOrderInFull(e.target.value)} required>
                        <option value="">--Select--</option><option value="Yes">Yes</option><option value="No">No</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Reason (If No)</label>
                      <select className="form-control" value={orderInFullReason} onChange={e => setOrderInFullReason(e.target.value)}>
                        <option value="">--Select--</option>
                        <option value="Shortage of Stock">Shortage of Stock</option><option value="Incorrect Discount">Incorrect Discount</option>
                        <option value="Payment issue">Payment issue</option><option value="Shippers issue">Shippers issue</option>
                        <option value="Employee issue such as leave, absent etc">Employee issue such as leave, absent etc</option>
                        <option value="Technical Issues">Technical Issues</option><option value="Short Expiry">Short Expiry</option>
                        <option value="Duplicate Order">Duplicate Order</option><option value="Edited and Reorderd">Edited and Reorderd</option>
                        <option value="Labelling issue">Labelling issue</option><option value="Botteling issue">Botteling issue</option>
                        <option value="Packaging issue">Packaging issue</option><option value="Raw material supply issue">Raw material supply issue</option>
                        <option value="Production damage">Production damage</option><option value="Storage damage">Storage damage</option>
                        <option value="Others">Others</option>
                      </select>
                    </div>
                  </div>
                </div>

                <hr />
                <div className="row">
                  <div className="col-md-12 text-center">
                    <button type="button" onClick={onCancel} className="btn btn-secondary mr-2">Cancel</button>
                    <button type="submit" className={`btn ${proStyles.btnPrimary}`} disabled={clientNotFound || loading}>Save</button><br /><br />
                  </div>
                </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {loading && (
        <div id="loading" style={{ visibility: 'visible', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
      )}
    </>
  );
}
