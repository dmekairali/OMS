import { useState, useEffect } from 'react';
import styles from '../styles/EditOrderForm.module.css';
import SetupDataService from '../services/SetupDataService';
import EditOrderAPI from '../services/editOrderAPI';

export default function EditOrderForm({ order, products, onSave, onCancel, editMode }) {
  // Toggle state for showing additional fields
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

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
  const [deliveryParty, setDeliveryParty] = useState('');
  const [mrName, setMrName] = useState('');
  
  // Delivery & Payment
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [orderBy, setOrderBy] = useState('');
  
  // Additional fields that will be hidden by default
  const [shippingPackingCharges, setShippingPackingCharges] = useState('');
  const [noteRemarks, setNoteRemarks] = useState('');
  const [typeOfRemarks1, setTypeOfRemarks1] = useState('');
  const [totalShippingCharge, setTotalShippingCharge] = useState('');
  const [typeOfRemarks2, setTypeOfRemarks2] = useState('');
  const [preferredCallTime2, setPreferredCallTime2] = useState('');
  const [expectedDispatchTime, setExpectedDispatchTime] = useState('');
  const [nextOrderFixedDate, setNextOrderFixedDate] = useState('');
  const [reoccurrenceInterval, setReoccurrenceInterval] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rocketClient, setRocketClient] = useState('');
  const [remarks, setRemarks] = useState('');
  const [remarksKairaliTeam, setRemarksKairaliTeam] = useState('');
  const [remarksInvoice, setRemarksInvoice] = useState('');
  const [remarksDispatchTeam, setRemarksDispatchTeam] = useState('');
  const [availableMRASM, setAvailableMRASM] = useState('');
  const [imagesInvoiceUpload, setImagesInvoiceUpload] = useState('');
  
  // Recurring fields
  const [reoccurance, setReoccurance] = useState('');
  const [nextOrderDate, setNextOrderDate] = useState('');
  const [endOrderDate, setEndOrderDate] = useState('');
  const [priority, setPriority] = useState('');
  
  // Discount & Charges
  const [discountTier, setDiscountTier] = useState('');
  const [shippingCharges, setShippingCharges] = useState('');
  const [packingCharges, setPackingCharges] = useState('');
  const [deliveryCharges, setDeliveryCharges] = useState('');
  
  // Product Items
  const [orderItems, setOrderItems] = useState([]);
  
  // Setup data from SetupDataService
  const [clientTypes, setClientTypes] = useState([]);
  const [clientCategories, setClientCategories] = useState([]);
  const [orderTypes, setOrderTypes] = useState([]);
  const [partyNames, setPartyNames] = useState([]);
  const [states, setStates] = useState([]);
  const [mrNames, setMrNames] = useState([]);
  const [paymentTermsList, setPaymentTermsList] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [discountTiers, setDiscountTiers] = useState([]);
  const [priorities, setPriorities] = useState([]);
  
  // Edit Order Status
  const [editOrderStatus, setEditOrderStatus] = useState('Edit Order');
  
  // Set Edit Order Status based on editMode
  useEffect(() => {
    const status = editMode === 'split' ? 'Edit and Split' : 'Edit Order';
    setEditOrderStatus(status);
  }, [editMode]);

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
      setPackingCharges(order['Packing Charges'] || '');
      setDeliveryCharges(order['Delivery Charges'] || '');
      
      // Load additional hidden fields
      setShippingPackingCharges(order['Shipping, Packing and Delivery Charges'] || '');
      setNoteRemarks(order['Note (Remarks)'] || '');
      setTypeOfRemarks1(order['Type of (Remarks)'] || '');
      setTotalShippingCharge(order['Total Shipping Charge'] || '');
      setTypeOfRemarks2(order['Type of (Remarks) 2'] || '');
      setPreferredCallTime2(order['Preferred Call Time 2'] || '');
      setExpectedDispatchTime(order['Expected Time of Dispatch'] || '');
      setNextOrderFixedDate(order['Next Order Fixed Date'] || '');
      setReoccurrenceInterval(order['Reoccurrence Interval'] || '');
      setEndDate(order['End Date'] || '');
      setRocketClient(order['Rocket Client'] || '');
      setRemarks(order['Remarks'] || '');
      setRemarksKairaliTeam(order['Remarks - Show to Kairali Team'] || '');
      setRemarksInvoice(order['Remarks - Show in Invoice'] || '');
      setRemarksDispatchTeam(order['Remarks - Show to Dispatch Team'] || '');
      setAvailableMRASM(order['Available MR/ASM'] || '');
      setImagesInvoiceUpload(order['Images/Invoice Upload'] || '');
      
      setOrderType(order['Order Type'] || 'New Order');
      setPartyName(order['Party Name'] || '');
      setPartyState(order['State (Order Placed to Party)'] || '');
      setDeliveryParty(order['Delivery Party From'] || '');
      
      // Parse and set order items
      if (order['Order Items']) {
        try {
          const items = JSON.parse(order['Order Items']);
          setOrderItems(items);
        } catch (e) {
          console.error('Error parsing order items:', e);
          setOrderItems([]);
        }
      }
    }
  }, [order]);

  // Load setup data after order is loaded
  useEffect(() => {
    const loadSetupData = async () => {
      try {
        const data = await SetupDataService.getSetupData();
        
        setClientTypes(data.clientTypes || []);
        setClientCategories(data.clientCategories || []);
        setOrderTypes(data.orderTypes || []);
        setPartyNames(data.partyNames || []);
        setStates(data.states || []);
        setMrNames(data.mrNames || []);
        setPaymentTermsList(data.paymentTerms || []);
        setPaymentModes(data.paymentModes || []);
        setDiscountTiers(data.discountTiers || []);
        setPriorities(data.priorities || []);
      } catch (error) {
        console.error('Error loading setup data:', error);
      }
    };
    
    loadSetupData();
  }, []);

  // Handle shipping address same as billing
  useEffect(() => {
    if (isShippingSameAsBilling) {
      setShippingAddress(billingAddress);
      setShippingPincode(billingPincode);
    }
  }, [isShippingSameAsBilling, billingAddress, billingPincode]);

  // Handle product selection
  const handleProductChange = (index, field, value) => {
    const newItems = [...orderItems];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    
    // Recalculate total for this item
    if (field === 'quantity' || field === 'rate') {
      newItems[index].total = (newItems[index].quantity || 0) * (newItems[index].rate || 0);
    }
    
    setOrderItems(newItems);
  };

  const addProductLine = () => {
    setOrderItems([...orderItems, {
      productName: '',
      hsn: '',
      quantity: 0,
      rate: 0,
      total: 0
    }]);
  };

  const removeProductLine = (index) => {
    const newItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare order data with all fields including hidden ones
    const orderData = {
      'Name of Client': clientName,
      'Mobile': mobile,
      'Email': email,
      'Client Type': clientType,
      'Client Category': clientCategory,
      'GST No': gstNo,
      'Billing Address': billingAddress,
      'Shipping Address': shippingAddress,
      'Pin code': shippingPincode,
      'Taluk': taluk,
      'District': district,
      'State': state,
      'Order Type': orderType,
      'Party Name': partyName,
      'State (Order Placed to Party)': partyState,
      'Delivery Party From': deliveryParty,
      'MR Name': mrName,
      'Delivery Required Date': deliveryDate && deliveryTime ? `${deliveryDate} ${deliveryTime}` : deliveryDate,
      'Payment Terms': paymentTerms,
      'Payment Mode': paymentMode,
      'Payment Date (to be paid)': paymentDate,
      'Order Taken By': orderBy,
      'Reoccurance': reoccurance,
      'Next Order Date': nextOrderDate,
      'End Order Date': endOrderDate,
      'Priority': priority,
      'Discount Tier': discountTier,
      'Shipping Charges': shippingCharges,
      'Packing Charges': packingCharges,
      'Delivery Charges': deliveryCharges,
      'Order Items': JSON.stringify(orderItems),
      'Edit Order Status': editOrderStatus,
      
      // Include all hidden fields with their values
      'Shipping, Packing and Delivery Charges': shippingPackingCharges,
      'Note (Remarks)': noteRemarks,
      'Type of (Remarks)': typeOfRemarks1,
      'Total Shipping Charge': totalShippingCharge,
      'Type of (Remarks) 2': typeOfRemarks2,
      'Preferred Call Time 2': preferredCallTime2,
      'Expected Time of Dispatch': expectedDispatchTime,
      'Next Order Fixed Date': nextOrderFixedDate,
      'Reoccurrence Interval': reoccurrenceInterval,
      'End Date': endDate,
      'Rocket Client': rocketClient,
      'Remarks': remarks,
      'Remarks - Show to Kairali Team': remarksKairaliTeam,
      'Remarks - Show in Invoice': remarksInvoice,
      'Remarks - Show to Dispatch Team': remarksDispatchTeam,
      'Available MR/ASM': availableMRASM,
      'Images/Invoice Upload': imagesInvoiceUpload,
    };
    
    try {
      await onSave(orderData);
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Failed to save order. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.editForm}>
      <div className={styles.formHeader}>
        <h2>{editMode === 'split' ? 'Edit and Split Order' : 'Edit Order'}</h2>
        
        {/* Checkbox to show/hide additional fields */}
        <div className={styles.toggleFieldsContainer}>
          <label className={styles.toggleFieldsLabel}>
            <input
              type="checkbox"
              checked={showAdditionalFields}
              onChange={(e) => setShowAdditionalFields(e.target.checked)}
              className={styles.toggleCheckbox}
            />
            <span>Show Additional Fields</span>
          </label>
        </div>
      </div>

      {/* Client Information Section - Always visible but individual fields can be hidden */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Client Information</h3>
        <div className={styles.formGrid}>
          {/* These fields are hidden by default */}
          {showAdditionalFields && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.required}>Client Name *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.required}>Mobile *</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.required}>Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Taluk</label>
                <input
                  type="text"
                  value={taluk}
                  onChange={(e) => setTaluk(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className={styles.select}
                >
                  <option value="">Select State</option>
                  {states.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.required}>GST No. *</label>
                <input
                  type="text"
                  value={gstNo}
                  onChange={(e) => setGstNo(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.required}>Client Type *</label>
                <select
                  value={clientType}
                  onChange={(e) => setClientType(e.target.value)}
                  required
                  className={styles.select}
                >
                  <option value="">Select Client Type</option>
                  {clientTypes.map((type, idx) => (
                    <option key={idx} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.required}>Client Category *</label>
                <select
                  value={clientCategory}
                  onChange={(e) => setClientCategory(e.target.value)}
                  required
                  className={styles.select}
                >
                  <option value="">Select Client Category</option>
                  {clientCategories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Address Section */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Address Information</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.required}>Billing Address *</label>
            <textarea
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              required
              rows={3}
              className={styles.textarea}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.required}>Billing Pincode *</label>
            <input
              type="text"
              value={billingPincode}
              onChange={(e) => setBillingPincode(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isShippingSameAsBilling}
                onChange={(e) => setIsShippingSameAsBilling(e.target.checked)}
              />
              Shipping address same as billing address
            </label>
          </div>

          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label className={styles.required}>Shipping Address *</label>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              required
              disabled={isShippingSameAsBilling}
              rows={3}
              className={styles.textarea}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.required}>Shipping Pincode *</label>
            <input
              type="text"
              value={shippingPincode}
              onChange={(e) => setShippingPincode(e.target.value)}
              required
              disabled={isShippingSameAsBilling}
              className={styles.input}
            />
          </div>
        </div>
      </div>

      {/* Order Details Section */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Order Details</h3>
        <div className={styles.formGrid}>
          {showAdditionalFields && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.required}>Order Type *</label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  required
                  className={styles.select}
                >
                  <option value="">Select Order Type</option>
                  {orderTypes.map((type, idx) => (
                    <option key={idx} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.required}>State (Order Placed to Party) *</label>
                <select
                  value={partyState}
                  onChange={(e) => setPartyState(e.target.value)}
                  required
                  className={styles.select}
                >
                  <option value="">Select State</option>
                  {states.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className={styles.formGroup}>
            <label>Party Name</label>
            <select
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              className={styles.select}
            >
              <option value="">Select Party</option>
              {partyNames.map((name, idx) => (
                <option key={idx} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Delivery Party</label>
            <input
              type="text"
              value={deliveryParty}
              onChange={(e) => setDeliveryParty(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>MR Name</label>
            <select
              value={mrName}
              onChange={(e) => setMrName(e.target.value)}
              className={styles.select}
            >
              <option value="">Select MR</option>
              {mrNames.map((name, idx) => (
                <option key={idx} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Delivery & Payment Section */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Delivery & Payment</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Delivery Date</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Delivery Time</label>
            <input
              type="time"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Payment Terms</label>
            <select
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className={styles.select}
            >
              <option value="">Select Payment Terms</option>
              {paymentTermsList.map((term, idx) => (
                <option key={idx} value={term}>{term}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Payment Mode</label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className={styles.select}
            >
              <option value="">Select Payment Mode</option>
              {paymentModes.map((mode, idx) => (
                <option key={idx} value={mode}>{mode}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Payment Date</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Order Taken By</label>
            <input
              type="text"
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
              className={styles.input}
            />
          </div>
        </div>
      </div>

      {/* Recurring Orders Section */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Recurring Orders</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Reoccurrence</label>
            <input
              type="text"
              value={reoccurance}
              onChange={(e) => setReoccurance(e.target.value)}
              className={styles.input}
              placeholder="e.g., Monthly, Weekly"
            />
          </div>

          {showAdditionalFields && (
            <>
              <div className={styles.formGroup}>
                <label>Next Order Fixed Date</label>
                <input
                  type="date"
                  value={nextOrderFixedDate}
                  onChange={(e) => setNextOrderFixedDate(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Reoccurrence Interval</label>
                <input
                  type="text"
                  value={reoccurrenceInterval}
                  onChange={(e) => setReoccurrenceInterval(e.target.value)}
                  className={styles.input}
                  placeholder="e.g., 30 days"
                />
              </div>

              <div className={styles.formGroup}>
                <label>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={styles.input}
                />
              </div>
            </>
          )}

          <div className={styles.formGroup}>
            <label>Next Order Date</label>
            <input
              type="date"
              value={nextOrderDate}
              onChange={(e) => setNextOrderDate(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>End Order Date</label>
            <input
              type="date"
              value={endOrderDate}
              onChange={(e) => setEndOrderDate(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={styles.select}
            >
              <option value="">Select Priority</option>
              {priorities.map((p, idx) => (
                <option key={idx} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {showAdditionalFields && (
            <div className={styles.formGroup}>
              <label>Rocket Client</label>
              <input
                type="text"
                value={rocketClient}
                onChange={(e) => setRocketClient(e.target.value)}
                className={styles.input}
              />
            </div>
          )}
        </div>
      </div>

      {/* Charges Section */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Charges & Discounts</h3>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Discount Tier</label>
            <select
              value={discountTier}
              onChange={(e) => setDiscountTier(e.target.value)}
              className={styles.select}
            >
              <option value="">Select Discount Tier</option>
              {discountTiers.map((tier, idx) => (
                <option key={idx} value={tier}>{tier}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Shipping Charges</label>
            <input
              type="number"
              step="0.01"
              value={shippingCharges}
              onChange={(e) => setShippingCharges(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Packing Charges</label>
            <input
              type="number"
              step="0.01"
              value={packingCharges}
              onChange={(e) => setPackingCharges(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Delivery Charges</label>
            <input
              type="number"
              step="0.01"
              value={deliveryCharges}
              onChange={(e) => setDeliveryCharges(e.target.value)}
              className={styles.input}
            />
          </div>

          {showAdditionalFields && (
            <>
              <div className={styles.formGroup}>
                <label>Shipping, Packing and Delivery Charges (Amount):</label>
                <input
                  type="number"
                  step="0.01"
                  value={shippingPackingCharges}
                  onChange={(e) => setShippingPackingCharges(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Total Shipping Charge (Amount):</label>
                <input
                  type="number"
                  step="0.01"
                  value={totalShippingCharge}
                  onChange={(e) => setTotalShippingCharge(e.target.value)}
                  className={styles.input}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Additional Hidden Fields Section */}
      {showAdditionalFields && (
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Additional Information</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Note (Remarks):</label>
              <textarea
                value={noteRemarks}
                onChange={(e) => setNoteRemarks(e.target.value)}
                rows={3}
                className={styles.textarea}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Type of (Remarks):</label>
              <input
                type="text"
                value={typeOfRemarks1}
                onChange={(e) => setTypeOfRemarks1(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Type of (Remarks):</label>
              <input
                type="text"
                value={typeOfRemarks2}
                onChange={(e) => setTypeOfRemarks2(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Preferred Call Time 2</label>
              <input
                type="time"
                value={preferredCallTime2}
                onChange={(e) => setPreferredCallTime2(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Expected Time of Dispatch</label>
              <input
                type="datetime-local"
                value={expectedDispatchTime}
                onChange={(e) => setExpectedDispatchTime(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Remarks</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className={styles.textarea}
              />
            </div>

            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Remarks - Show to Kairali Team</label>
              <textarea
                value={remarksKairaliTeam}
                onChange={(e) => setRemarksKairaliTeam(e.target.value)}
                rows={3}
                className={styles.textarea}
              />
            </div>

            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Remarks - Show in Invoice</label>
              <textarea
                value={remarksInvoice}
                onChange={(e) => setRemarksInvoice(e.target.value)}
                rows={3}
                className={styles.textarea}
              />
            </div>

            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Remarks - Show to Dispatch Team</label>
              <textarea
                value={remarksDispatchTeam}
                onChange={(e) => setRemarksDispatchTeam(e.target.value)}
                rows={3}
                className={styles.textarea}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Available MR/ASM</label>
              <input
                type="text"
                value={availableMRASM}
                onChange={(e) => setAvailableMRASM(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Images/Invoice Upload</label>
              <input
                type="text"
                value={imagesInvoiceUpload}
                onChange={(e) => setImagesInvoiceUpload(e.target.value)}
                className={styles.input}
                placeholder="URL or file path"
              />
            </div>
          </div>
        </div>
      )}

      {/* Order Items Section */}
      <div className={styles.formSection}>
        <h3 className={styles.sectionTitle}>Order Items</h3>
        
        {orderItems.map((item, index) => (
          <div key={index} className={styles.productLine}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Product Name</label>
                <select
                  value={item.productName}
                  onChange={(e) => {
                    const selectedProduct = products.find(p => p.name === e.target.value);
                    handleProductChange(index, 'productName', e.target.value);
                    if (selectedProduct) {
                      handleProductChange(index, 'hsn', selectedProduct.hsn);
                      handleProductChange(index, 'rate', selectedProduct.rate);
                    }
                  }}
                  className={styles.select}
                >
                  <option value="">Select Product</option>
                  {products.map((product, idx) => (
                    <option key={idx} value={product.name}>{product.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>HSN Code</label>
                <input
                  type="text"
                  value={item.hsn}
                  onChange={(e) => handleProductChange(index, 'hsn', e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Quantity</label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleProductChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Rate</label>
                <input
                  type="number"
                  step="0.01"
                  value={item.rate}
                  onChange={(e) => handleProductChange(index, 'rate', parseFloat(e.target.value) || 0)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Total</label>
                <input
                  type="number"
                  value={item.total}
                  readOnly
                  className={styles.input}
                  style={{ background: '#f8fafc' }}
                />
              </div>

              <div className={styles.formGroup}>
                <button
                  type="button"
                  onClick={() => removeProductLine(index)}
                  className={styles.removeButton}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addProductLine}
          className={styles.addButton}
        >
          + Add Product Line
        </button>
      </div>

      {/* Form Actions */}
      <div className={styles.formActions}>
        <button
          type="button"
          onClick={onCancel}
          className={styles.cancelButton}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.saveButton}
        >
          {editMode === 'split' ? 'Save and Split' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
