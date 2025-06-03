import axios from 'axios';

// Get the base URL from the environment variable or fallback to deployed API
const getBaseUrl = () => {
  // In production, always use the deployed API URL
  if (window.location.hostname !== 'localhost') {
    console.log('Using production API URL');
    return 'https://restaurant-api-923e.onrender.com';
  }
  // In development, use the environment variable or localhost
  console.log('Using development API URL');
  return process.env.REACT_APP_API_URL || 'http://localhost:5019';
};

// Centralized API endpoint configuration
const API_ENDPOINTS = {
  STRIPE: {
    CREATE_CHECKOUT: '/api/Stripe/create-checkout-session',
    PAYMENT_SUCCESS: '/api/Stripe/payment-success',
    PAYMENT_CANCEL: '/api/Stripe/payment-cancel'
  },
  ORDER: {
    CREATE_CASH: '/api/Order/create-cash-order'
  },
  POSTCODE: {
    GET_MINIMUM_ORDER: '/api/PostcodeMinimumOrder/GetMinimumOrderValue'
  }
};

// Helper function to construct full API URLs
const getApiUrl = (endpoint) => {
  const baseUrl = getBaseUrl();
  const fullUrl = `${baseUrl}${endpoint}`;
  console.log('Constructed API URL:', fullUrl);
  return fullUrl;
};

export const createCashOrder = async ({ items, customerInfo, orderMethod }) => {
  try {
    console.log('Creating cash order with:', { items, customerInfo, orderMethod });
    
    // Validate required fields
    if (!items || items.length === 0) {
      throw new Error('No items in the order');
    }

    if (!customerInfo || !customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone) {
      throw new Error('Missing required customer information');
    }

    if (orderMethod === 'delivery' && (!customerInfo.postalCode || !customerInfo.street)) {
      throw new Error('Missing required delivery information');
    }

    // Transform items to match backend expectations
    const orderItems = items.map(item => ({
      Id: parseInt(item.id),
      Name: item.name,
      Price: item.discountedPrice || item.originalPrice,
      Quantity: item.quantity,
      SelectedItems: item.selectedItems?.map(selectedItem => ({
        Id: parseInt(selectedItem.id),
        Name: selectedItem.name,
        Quantity: selectedItem.quantity || 1,
        Price: selectedItem.price || 0
      })) || []
    }));

    // Calculate total amount
    const totalAmount = orderItems.reduce((sum, item) => sum + (item.Price * item.Quantity), 0);

    // Format customer info for API
    const customer = {
      FirstName: customerInfo.firstName,
      LastName: customerInfo.lastName,
      Email: customerInfo.email,
      Phone: customerInfo.phone,
      CreateDate: new Date().toISOString(),
      ...(orderMethod === 'delivery' && {
        PostalCode: customerInfo.postalCode,
        Street: customerInfo.street,
        House: customerInfo.house,
        Stairs: customerInfo.stairs || null,
        Stick: customerInfo.stick || null,
        Door: customerInfo.door || null,
        Bell: customerInfo.bell || null
      })
    };

    // Prepare the request payload
    const requestPayload = {
      items: orderItems,
      customerInfo: customer,
      orderMethod,
      paymentMethod: 'cash',
      status: 'pending',
      specialNotes: customerInfo.specialNotes,
      totalAmount
    };

    console.log('Sending cash order request to:', getApiUrl(API_ENDPOINTS.ORDER.CREATE_CASH));
    console.log('Request payload:', JSON.stringify(requestPayload, null, 2));

    // Send the order data to the create-checkout-session endpoint
    const response = await axios.post(
      getApiUrl(API_ENDPOINTS.ORDER.CREATE_CASH),
      requestPayload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Cash order response:', response.data);

    if (!response.data) {
      throw new Error('No response data received from server');
    }

    // Return the order details in the format expected by the frontend
    return {
      orderId: response.data.orderId,
      total: totalAmount,
      status: 'pending',
      paymentMethod: 'cash',
      orderNumber: response.data.orderNumber,
      orderDetails: {
        id: response.data.orderId,
        orderNumber: response.data.orderNumber,
        total: totalAmount,
        status: 'pending',
        paymentMethod: 'cash',
        orderMethod: orderMethod
      }
    };
  } catch (error) {
    console.error('Error creating cash order:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error status:', error.response.status);
      
      let errorMessage = 'Failed to create cash order';
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error('No response from server. Please check if the server is running.');
    } else {
      throw new Error('Failed to create cash order: ' + error.message);
    }
  }
};

export const createCheckoutSession = async ({ items, customerInfo, orderMethod, paymentMethod = 'stripe' }) => {
  try {
    console.log('=== Creating Checkout Session ===');
    console.log('Payment Method:', paymentMethod);
    console.log('Order Method:', orderMethod);
    console.log('API URL:', getApiUrl(API_ENDPOINTS.STRIPE.CREATE_CHECKOUT));
    console.log('Items:', JSON.stringify(items, null, 2));
    console.log('Customer Info:', JSON.stringify(customerInfo, null, 2));

    // For cash payments, use the createCashOrder function
    if (paymentMethod === 'cash') {
      console.log('Processing cash payment...');
      try {
        const cashOrderResult = await createCashOrder({ items, customerInfo, orderMethod });
        console.log('Cash order result:', cashOrderResult);
        
        return {
          url: null,
          sessionId: cashOrderResult.orderId,
          orderDetails: {
            id: cashOrderResult.orderId,
            orderNumber: cashOrderResult.orderNumber,
            total: cashOrderResult.total,
            status: 'pending',
            paymentMethod: 'cash',
            orderMethod: orderMethod
          }
        };
      } catch (error) {
        console.error('Error in createCashOrder:', error);
        throw error;
      }
    }

    // Validate required fields
    if (!items || items.length === 0) {
      throw new Error('No items in the order');
    }

    if (!customerInfo || !customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone) {
      throw new Error('Missing required customer information');
    }

    // Transform items to match backend expectations
    const orderItems = items.map(item => ({
      Id: parseInt(item.id),
      Name: item.name,
      Price: item.discountedPrice || item.originalPrice,
      Quantity: item.quantity,
      SelectedItems: item.selectedItems?.map(selectedItem => ({
        Id: parseInt(selectedItem.id),
        Name: selectedItem.name,
        Quantity: selectedItem.quantity || 1,
        Price: selectedItem.price || 0
      })) || []
    }));

    // Calculate total amount
    const totalAmount = orderItems.reduce((sum, item) => {
      const itemTotal = item.Price * item.Quantity;
      const selectedItemsTotal = item.SelectedItems.reduce((itemSum, selectedItem) => 
        itemSum + (selectedItem.Price * selectedItem.Quantity), 0);
      return sum + itemTotal + selectedItemsTotal;
    }, 0);

    // Format customer info for API
    const customer = {
      FirstName: customerInfo.firstName,
      LastName: customerInfo.lastName,
      Email: customerInfo.email,
      Phone: customerInfo.phone,
      CreateDate: new Date().toISOString(),
      ...(orderMethod === 'delivery' && {
        PostalCode: customerInfo.postalCode,
        Street: customerInfo.street,
        House: customerInfo.house,
        Stairs: customerInfo.stairs || null,
        Stick: customerInfo.stick || null,
        Door: customerInfo.door || null,
        Bell: customerInfo.bell || null
      })
    };

    // Prepare the request payload
    const requestPayload = {
      items: orderItems,
      customerInfo: customer,
      orderMethod,
      paymentMethod,
      status: 'processing',
      specialNotes: customerInfo.specialNotes || null,
      totalAmount
    };

    console.log('Sending request to API:', JSON.stringify(requestPayload, null, 2));
    console.log('API Endpoint:', getApiUrl(API_ENDPOINTS.STRIPE.CREATE_CHECKOUT));

    // Send the order data
    const response = await axios.post(
      getApiUrl(API_ENDPOINTS.STRIPE.CREATE_CHECKOUT),
      requestPayload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Server response:', JSON.stringify(response.data, null, 2));

    if (!response.data) {
      throw new Error('No response data received from server');
    }

    // For Stripe payments, we expect a URL to redirect to
    if (paymentMethod === 'stripe' && !response.data.url) {
      throw new Error('No Stripe checkout URL received');
    }

    // Store the session ID in localStorage before redirecting
    if (paymentMethod === 'stripe' && response.data.sessionId) {
      localStorage.setItem('stripeSessionId', response.data.sessionId);
      // Also store checkout data for potential retry
      localStorage.setItem('checkoutData', JSON.stringify({
        items,
        customerInfo,
        orderMethod,
        paymentMethod
      }));
    }

    // Return the session URL and order details
    return {
      url: response.data.url,
      sessionId: response.data.sessionId,
      orderDetails: {
        id: response.data.orderId,
        orderNumber: response.data.orderNumber,
        total: totalAmount,
        status: 'processing',
        paymentMethod,
        orderMethod
      }
    };
  } catch (error) {
    console.error('=== Payment Controller Error ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received. Request details:', error.request);
    }
    
    throw error;
  }
};

export const handlePaymentSuccess = async (sessionId) => {
  try {
    console.log('Handling payment success for session:', sessionId);
    
    // Try to get session ID from URL parameters first, then localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdFromUrl = urlParams.get('session_id') || urlParams.get('sessionId');
    const sessionIdToUse = sessionIdFromUrl || sessionId || localStorage.getItem('stripeSessionId');
    
    console.log('Session ID from URL:', sessionIdFromUrl);
    console.log('Session ID from props:', sessionId);
    console.log('Session ID from localStorage:', localStorage.getItem('stripeSessionId'));
    console.log('Using session ID:', sessionIdToUse);
    
    if (!sessionIdToUse) {
      console.error('No session ID available from any source');
      throw new Error('No session ID available');
    }

    const apiUrl = getApiUrl(API_ENDPOINTS.STRIPE.PAYMENT_SUCCESS);
    const fullUrl = `${apiUrl}?session_id=${encodeURIComponent(sessionIdToUse)}`;
    console.log('Making request to:', fullUrl);

    // Call the backend to verify the payment
    const response = await axios.get(fullUrl);
    console.log('Payment success response:', response.data);

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    // Clear the stored session ID
    localStorage.removeItem('stripeSessionId');

    return {
      orderId: response.data.orderId || response.data.id,
      total: response.data.total,
      status: response.data.status || 'completed',
      paymentMethod: 'stripe',
      orderNumber: response.data.orderNumber
    };
  } catch (error) {
    console.error('Error handling payment success:', error);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
      console.error('Error response headers:', error.response.headers);
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to process payment success');
  }
};

export const handlePaymentCancel = async (sessionId) => {
  try {
    if (sessionId) {
      const apiUrl = getApiUrl(API_ENDPOINTS.STRIPE.PAYMENT_CANCEL);
      console.log('Making cancel request to:', apiUrl);
      
      await axios.post(
        apiUrl,
        { sessionId },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    localStorage.removeItem('stripeSessionId');
    return true;
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
      console.error('Error response headers:', error.response.headers);
    }
    throw new Error('Failed to process payment cancellation');
  }
};

export const getMinimumOrderValue = async (postcode) => {
  try {
    const response = await axios.get(
      `${getApiUrl(API_ENDPOINTS.POSTCODE.GET_MINIMUM_ORDER)}/${postcode}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching minimum order value:', error);
    return 0;
  }
}; 