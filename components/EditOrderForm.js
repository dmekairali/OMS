import { useState, useEffect } from 'react';
import styles from '../styles/EditOrderForm.module.css';
import SetupDataService from '../services/SetupDataService';
import EditOrderAPI from '../services/editOrderAPI';

export default function EditOrderForm({ order, products, onSave, onCancel, editMode }) {
  // State for showing/hiding advanced fields
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  
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
  
  // Recurring Orders
  const [reoccurance, setReoccurance] = useState('');
  const [nextOrderDate, setNextOrderDate] = useState('');
  const [endOrderDate, setEndOrderDate] = useState('');
  const [priority, setPriority] = useState('');
  
  // Pricing
  const [discountTier, setDiscountTier] = useState('');
  const [shippingCharges, setShippingCharges] = useState('');
  const [packingDeliveryCharges, setPackingDeliveryCharges] = useState('');
  const [totalShippingCharge, setTotalShippingCharge] = useState('');
  
  // Remarks fields
  const [remarks, setRemarks] = useState('');
  const [remarksType, setRemarksType] = useState('');
  const [shippingRemarksType, setShippingRemarksType] = useState('');
  const [preferredCallTime2, setPreferredCallTime2] = useState('');
  const [expectedDispatchTime, setExpectedDispatchTime] = useState('');
  const [rocketClient, setRocketClient] = useState('');
  const [remarksKairali, setRemarksKairali] = useState('');
  const [remarksInvoice, setRemarksInvoice] = useState('');
  const [remarksDispatch, setRemarksDispatch] = useState('');
  const [availableMRASM, setAvailableMRASM] = useState('');
  const [imagesInvoice, setImagesInvoice] = useState('');
  
  // Edit order status
  const [editOrderStatus, setEditOrderStatus] = useState('');
  
  // Product list
  const [productList, setProductList] = useState([]);
  
  // Totals
  const [totals, setTotals] = useState({
    mrpTotal: 0,
    qtyTotal: 0,
    discountTotal: 0,
    taxBeforeTotal: 0,
    taxAfterTotal: 0,
    totalAmount: 0
  });
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Set edit order status based on edit mode
  useEffect(() => {
    const status = editMode === 'split' ? 'Edit and Split' : 'Edit Order';
    setEditOrderStatus(status);
  }, [editMode]);

  // Load order data
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
      setPackingDeliveryCharges(order['Packing Delivery Charges'] || '');
      setTotalShippingCharge(order['Total Shipping Charge'] || '');
      
      setRemarks(order['Remarks'] || '');
      setRemarksType(order['Remarks Type'] || '');
      setShippingRemarksType(order['Shipping Remarks Type'] || '');
      setPreferredCallTime2(order['Preferred Call Time 2'] || '');
      setExpectedDispatchTime(order['Expected Time of Dispatch'] || '');
      setRocketClient(order['Rocket Client'] || '');
      setRemarksKairali(order['Remarks - Show to Kairali Team'] || '');
      setRemarksInvoice(order['Remarks - Show in Invoice'] || '');
      setRemarksDispatch(order['Remarks - Show to Dispatch Team'] || '');
      setAvailableMRASM(order['Available MR/ASM'] || '');
      setImagesInvoice(order['Images/Invoice Upload'] || '');
    }
  }, [order]);

  // Load products
  useEffect(() => {
    if (products && products.length > 0) {
      setProductList(products);
      calculateTotals(products);
    }
  }, [products]);

  const calculateTotals = (products) => {
    const newTotals = products.reduce((acc, product) => {
      return {
        mrpTotal: acc.mrpTotal + parseFloat(product.mrp || 0),
        qtyTotal: acc.qtyTotal + parseFloat(product.quantity || 0),
        discountTotal: acc.discountTotal + parseFloat(product.discountAmt || 0),
        taxBeforeTotal: acc.taxBeforeTotal + parseFloat(product.beforeTax || 0),
        taxAfterTotal: acc.taxAfterTotal + parseFloat(product.afterDiscount || 0),
        totalAmount: acc.totalAmount + parseFloat(product.total || 0)
      };
    }, {
      mrpTotal: 0,
      qtyTotal: 0,
      discountTotal: 0,
      taxBeforeTotal: 0,
      taxAfterTotal: 0,
      totalAmount: 0
    });
    
    setTotals(newTotals);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    
    try {
      // Prepare data for API
      const apiData = {
        // Order identification
        buyerId: order['Buyer ID'],
        orderNumber: order['Oder ID'],
        editStatus: editOrderStatus,
        
        // Client details
        clientName: clientName,
        mobile: mobile,
        email: email,
        clientType: clientType,
        clientCategory: clientCategory,
        billingPincode: billingPincode,
        gstNumber: gstNo,
        billingAddress: billingAddress,
        shippingAddress: shippingAddress,
        orderType: orderType,
        
        // Location
        taluk: taluk,
        district: district,
        state: state,
        
        // Delivery party
        deliveryParty: partyName,
        partyName: partyName,
        partyname: partyName,
        partyState: partyState,
        
        // Products
        products: productList.map(product => ({
          name: product.productName,
          mrp: product.mrp,
          packingSize: product.packingSize,
          quantity: product.quantity,
          discountPercent: product.discountPer,
          discountType: '%',
          discountAmount: product.discountAmt,
          beforeTax: product.beforeTax,
          afterDiscount: product.afterDiscount,
          cgstAmount: '0',
          cgstPercent: product.cgst,
          sgstAmount: '0', 
          sgstPercent: product.sgst,
          igstAmount: '0',
          igstPercent: product.igst,
          total: product.total,
          splitQuantity: product.splitQty || '0'
        })),
        
        // Totals
        totals: {
          mrpTotal: totals.mrpTotal,
          quantityTotal: totals.qtyTotal,
          discountTotal: totals.discountTotal,
          taxBeforeTotal: totals.taxBeforeTotal,
          taxAfterTotal: totals.taxAfterTotal,
          totalAmount: totals.totalAmount
        },
        
        // Shipping and additional details
        shippingCharge: shippingCharges,
        packingDeliveryCharges: packingDeliveryCharges,
        totalShippingCharge: totalShippingCharge,
        remarks: remarks,
        remarksType: remarksType,
        shippingRemarksType: shippingRemarksType,
        preferredCallTime2: preferredCallTime2,
        expectedDispatchTime: expectedDispatchTime,
        nextOrderDate: nextOrderDate,
        reoccurance: reoccurance,
        endOrderDate: endOrderDate,
        rocketClient: rocketClient,
        remarksKairali: remarksKairali,
        remarksInvoice: remarksInvoice,
        remarksDispatch: remarksDispatch,
        availableMRASM: availableMRASM,
        imagesInvoice: imagesInvoice,
        
        // Other fields
        deliveryDate: deliveryDate,
        deliveryTime: deliveryTime,
        paymentTerms: paymentTerms,
        paymentMode: paymentMode,
        paymentDate: paymentDate,
        orderBy: orderBy,
        priority: priority,
        discountTier: discountTier,
        mrName: mrName
      };

      const response = await EditOrderAPI.updateOrder(apiData);
      
      if (response.success) {
        alert('Order updated successfully!');
        if (onSave) onSave(response.data);
      } else {
        throw new Error(response.message || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      setErrorMessage(error.message || 'Failed to update order. Please try again.');
    } finally {
      setLoading(false);
    }
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

      {/* Toggle Advanced Fields Checkbox */}
      <div className={styles.toggleSection}>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={showAdvancedFields}
            onChange={(e) => setShowAdvancedFields(e.target.checked)}
            className={styles.toggleCheckbox}
          />
          <span className={styles.toggleText}>Show Advanced/Hidden Fields</span>
          <span className={styles.toggleHint}>(Buyer Details, Order Type, State, Additional Details, etc.)</span>
        </label>
      </div>

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

      {/* Buyer Details - HIDDEN BY DEFAULT */}
      {showAdvancedFields && (
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
            <div className={styles.field}>
              <label>State (Order Placed to Party) <span className={styles.mandatory}>*</span></label>
              <input type="text" value={partyState} onChange={(e) => setPartyState(e.target.value)} />
            </div>
          </div>

          {/* Billing and Shipping Address */}
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
        </div>
      )}

      {/* Party Details - Always Visible */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Party Details</h3>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label>Party Name <span className={styles.mandatory}>*</span></label>
            <input 
              type="text" 
              value={partyName} 
              onChange={(e) => setPartyName(e.target.value)} 
              required 
            />
          </div>
        </div>
      </div>

      {/* Product Details - Always Visible */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Product Details</h3>
        <div className={styles.productTable}>
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>MRP</th>
                <th>Packing Size</th>
                <th>Quantity</th>
                <th>Discount %</th>
                <th>Discount Amt</th>
                <th>Before Tax</th>
                <th>After Discount</th>
                <th>CGST %</th>
                <th>SGST %</th>
                <th>IGST %</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {productList.map((product, index) => (
                <tr key={index}>
                  <td>{product.productName}</td>
                  <td>{product.mrp}</td>
                  <td>{product.packingSize}</td>
                  <td>{product.quantity}</td>
                  <td>{product.discountPer}</td>
                  <td>{product.discountAmt}</td>
                  <td>{product.beforeTax}</td>
                  <td>{product.afterDiscount}</td>
                  <td>{product.cgst}</td>
                  <td>{product.sgst}</td>
                  <td>{product.igst}</td>
                  <td>{product.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>Totals:</strong></td>
                <td><strong>{totals.mrpTotal.toFixed(2)}</strong></td>
                <td></td>
                <td><strong>{totals.qtyTotal}</strong></td>
                <td></td>
                <td><strong>{totals.discountTotal.toFixed(2)}</strong></td>
                <td><strong>{totals.taxBeforeTotal.toFixed(2)}</strong></td>
                <td><strong>{totals.taxAfterTotal.toFixed(2)}</strong></td>
                <td></td>
                <td></td>
                <td></td>
                <td><strong>{totals.totalAmount.toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Delivery and Payment Details - Always Visible */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Delivery & Payment Details</h3>
        <div className={styles.grid3}>
          <div className={styles.field}>
            <label>Delivery Required Date</label>
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
            <input 
              type="text" 
              value={paymentTerms} 
              onChange={(e) => setPaymentTerms(e.target.value)} 
            />
          </div>
          <div className={styles.field}>
            <label>Payment Mode</label>
            <input 
              type="text" 
              value={paymentMode} 
              onChange={(e) => setPaymentMode(e.target.value)} 
            />
          </div>
          <div className={styles.field}>
            <label>Payment Date</label>
            <input 
              type="date" 
              value={paymentDate} 
              onChange={(e) => setPaymentDate(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* Additional Details - HIDDEN BY DEFAULT */}
      {showAdvancedFields && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Additional Details</h3>
          <div className={styles.grid3}>
            <div className={styles.field}>
              <label>Shipping, Packing and Delivery Charges (Amount):</label>
              <input 
                type="number" 
                step="0.01"
                value={packingDeliveryCharges} 
                onChange={(e) => setPackingDeliveryCharges(e.target.value)} 
              />
            </div>
            <div className={styles.field}>
              <label>Note (Remarks):</label>
              <textarea 
                value={remarks} 
                onChange={(e) => setRemarks(e.target.value)} 
                rows="2"
              />
            </div>
            <div className={styles.field}>
              <label>Type of (Remarks):</label>
              <input 
                type="text" 
                value={remarksType} 
                onChange={(e) => setRemarksType(e.target.value)} 
              />
            </div>
            <div className={styles.field}>
              <label>Total Shipping Charge (Amount):</label>
              <input 
                type="number" 
                step="0.01"
                value={totalShippingCharge} 
                onChange={(e) => setTotalShippingCharge(e.target.value)} 
              />
            </div>
            <div className={styles.field}>
              <label>Type of (Remarks):</label>
              <input 
                type="text" 
                value={shippingRemarksType} 
                onChange={(e) => setShippingRemarksType(e.target.value)} 
              />
            </div>
            <div className={styles.field}>
              <label>Preferred Call Time 2</label>
              <input 
                type="text" 
                value={preferredCallTime2} 
                onChange={(e) => setPreferredCallTime2(e.target.value)} 
              />
            </div>
            <div className={styles.field}>
              <label>Expected Time of Dispatch</label>
              <input 
                type="text" 
                value={expectedDispatchTime} 
                onChange={(e) => setExpectedDispatchTime(e.target.value)} 
              />
            </div>
            <div className={styles.field}>
              <label>Next Order Fixed Date</label>
              <input 
                type="date" 
                value={nextOrderDate} 
                onChange={(e) => setNextOrderDate(e.target.value)} 
              />
            </div>
            <div className={styles.field}>
              <label>Reoccurrence Interval</label>
              <input 
                type="text" 
                value={reoccurance} 
                onChange={(e) => setReoccurance(e.target.value)} 
              />
            </div>
            <div className={styles.field}>
              <label>End Date</label>
              <input 
                type="date" 
                value={endOrderDate} 
                onChange={(e) => setEndOrderDate(e.target.value)} 
              />
            </div>
            <div className={styles.field}>
              <label>Rocket Client</label>
              <input 
                type="text" 
                value={rocketClient} 
                onChange={(e) => setRocketClient(e.target.value)} 
              />
            </div>
            <div className={styles.field}>
              <label>Remarks</label>
              <textarea 
                value={remarks} 
                onChange={(e) => setRemarks(e.target.value)} 
                rows="2"
              />
            </div>
            <div className={styles.field}>
              <label>Remarks - Show to Kairali Team</label>
              <textarea 
                value={remarksKairali} 
                onChange={(e) => setRemarksKairali(e.target.value)} 
                rows="2"
              />
            </div>
            <div className={styles.field}>
              <label>Remarks - Show in Invoice</label>
              <textarea 
                value={remarksInvoice} 
                onChange={(e) => setRemarksInvoice(e.target.value)} 
                rows="2"
              />
            </div>
            <div className={styles.field}>
              <label>Remarks - Show to Dispatch Team</label>
              <textarea 
                value={remarksDispatch} 
                onChange={(e) => setRemarksDispatch(e.target.value)} 
                rows="2"
              />
            </div>
            <div className={styles.field}>
              <label>Available MR/ASM</label>
              <input 
                type="text" 
                value={availableMRASM} 
                onChange={(e) => setAvailableMRASM(e.target.value)} 
              />
            </div>
            <div className={styles.field}>
              <label>Images/Invoice Upload</label>
              <input 
                type="text" 
                value={imagesInvoice} 
                onChange={(e) => setImagesInvoice(e.target.value)} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button 
          type="button" 
          onClick={onCancel} 
          className={styles.cancelButton}
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className={styles.saveButton}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
