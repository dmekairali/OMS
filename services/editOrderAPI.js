// services/editOrderAPI.js

import API_CONFIG from '../config/api';

class EditOrderAPI {
  /**
   * Submit edited order to Google Apps Script
   * @param {Object} orderData - The order data from edit form
   * @returns {Promise<Object>} API response
   */
  static async submitEditOrder(orderData) {
    try {
      // Create FormData (mimics form submission)
      const formData = new FormData();
      
      // Add system identifier - CRITICAL for API routing
      formData.append('system', API_CONFIG.SYSTEM_ID);
      
      // Add order identification
      formData.append('BuyId', orderData.buyerId);
      formData.append('OrderNumber', orderData.orderNumber);
      formData.append('editstatus', orderData.editStatus); // "Edit Order" or "Edit and Split"
      
      // Client Details
      formData.append('clientname', orderData.clientName);
      formData.append('mobile', orderData.mobile);
      formData.append('email', orderData.email);
      formData.append('clienttypename', orderData.clientType);
      formData.append('clientcategory1', orderData.clientCategory || '');
      formData.append('BPINCODE', orderData.billingPincode);
      formData.append('GSTNO', orderData.gstNumber);
      formData.append('Baddress', orderData.billingAddress);
      formData.append('saddress', orderData.shippingAddress);
      formData.append('ordertype', orderData.orderType);
      
      // Location details
      formData.append('talukname', orderData.taluk || '');
      formData.append('districtname', orderData.district || '');
      formData.append('state', orderData.state || '');
      
      // Delivery Party
      formData.append('partyname', orderData.deliveryParty);
      formData.append('partystatename', orderData.partyState || '');
      
      // Products - Handle multiple products
      orderData.products.forEach((product, index) => {
        formData.append('productname', product.name);
        formData.append('MRP', product.mrp);
        formData.append('PACKINGSIZE', product.packingSize);
        formData.append('QNT', product.quantity);
        formData.append('DISPER', product.discountPercent || '0');
        formData.append('DISOUCNT', product.discountType || ''); // '%' or 'Rs'
        formData.append('DISAMT', product.discountAmount);
        formData.append('BEFORE', product.beforeTax);
        formData.append('AFTER', product.afterDiscount);
        formData.append('CGSTAMT', product.cgstAmount || '0');
        formData.append('CGST', product.cgstPercent || '0');
        formData.append('SGSTAMT', product.sgstAmount || '0');
        formData.append('SGST', product.sgstPercent || '0');
        formData.append('IGSTAMT', product.igstAmount || '0');
        formData.append('IGST', product.igstPercent || '0');
        formData.append('TOTAL', product.total);
        
        // Split quantity (for Edit and Split)
        formData.append('SplitQTY', product.splitQuantity || '0');
      });
      
      // Totals
      formData.append('mrptotal', orderData.totals.mrpTotal);
      formData.append('qnttotal', orderData.totals.quantityTotal);
      formData.append('distotal', orderData.totals.discountTotal);
      formData.append('taxbeforetotal', orderData.totals.taxBeforeTotal);
      formData.append('taxaftertotal', orderData.totals.taxAfterTotal);
      formData.append('totaltotal', orderData.totals.totalAmount);
      
      // Shipping/Additional Charges
      formData.append('scharge', orderData.shippingCharge || '0');
      formData.append('sremark', orderData.shippingRemark || '');
      formData.append('Stax', orderData.shippingTax || '0');
      formData.append('Staxremark', orderData.shippingTaxRemark || '');
      formData.append('staxper', orderData.shippingTaxPercent || '0');
      formData.append('staxperrem', orderData.shippingTaxPercentRemark || '');
      
      // Final Amounts
      formData.append('Beforeamt', orderData.beforeAmount);
      formData.append('Afteramt', orderData.afterAmount);
      
      // Payment Details
      formData.append('paymentterm', orderData.paymentTerm);
      formData.append('paymentmodename', orderData.paymentMode);
      
      // Payment dates (up to 5 dates)
      for (let i = 0; i < 5; i++) {
        formData.append('paymentdate', orderData.paymentDates[i] || '');
      }
      
      // Delivery Details
      formData.append('Deliverydate', orderData.deliveryDate);
      formData.append('Deliverytime', orderData.deliveryTime);
      formData.append('deliverydatebyname', orderData.deliveryDateBy || '');
      
      // Remarks
      formData.append('saletermremark', orderData.saleTermRemark || '');
      formData.append('invoiceremark', orderData.invoiceRemark || '');
      formData.append('warehouseremark', orderData.warehouseRemark || '');
      
      // Order Metadata
      formData.append('orderby', orderData.orderBy);
      formData.append('mrname_name', orderData.mrName || 'NO MR');
      
      // Call Time
      formData.append('calltime1', orderData.callTime1 || '');
      formData.append('calltime2', orderData.callTime2 || '');
      
      // OTIF (On Time In Full)
      formData.append('otifyesno', orderData.orderInFull || '');
      formData.append('otifreason', orderData.orderInFullReason || '');
      
      // Repeat/Recurring Orders
      formData.append('NextOrderDate', orderData.nextOrderDate || '');
      formData.append('reoccurance', orderData.recurrence || ''); // Weekly/Monthly/Yearly
      formData.append('EndOrderDate', orderData.endOrderDate || '');
      formData.append('Priority', orderData.priority || '');
      
      // File Upload (if any)
      if (orderData.file) {
        const base64Data = await this.fileToBase64(orderData.file);
        formData.append('data', base64Data);
        formData.append('mimetype', orderData.file.type);
        formData.append('filename', orderData.file.name);
      }
      
      // Make API call with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(API_CONFIG.EDIT_ORDER_ENDPOINT, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          orderId: result.orderId,
          buyerId: result.buyerId,
          splitOrderId: result.splitOrderId,
          message: result.message,
          editStatus: result.editStatus
        };
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
      
    } catch (error) {
      console.error('Error submitting edit order:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      
      throw error;
    }
  }
  
  /**
   * Convert file to base64
   * @param {File} file 
   * @returns {Promise<string>}
   */
  static fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove data:*/*;base64, prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }
}

export default EditOrderAPI;
