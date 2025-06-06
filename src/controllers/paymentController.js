import axios from 'axios';

// Helper function to construct full API URLs
const getBaseUrl = () => {
  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5019';
  }
  // In production, use the API URL
  return 'https://restaurant-api-923e.onrender.com';
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
    console.log('=== Creating Cash Order ===');
    console.log('Order Method:', orderMethod);
    console.log('Items:', JSON.stringify(items, null, 2));
    console.log('Customer Info:', JSON.stringify(customerInfo, null, 2));
    
    // Validate required fields
    if (!items || items.length === 0) {
      throw new Error('No items in the order');
    }

    if (!customerInfo || !customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone) {
      throw new Error('Missing required customer information');
    }

    // Transform items to match backend expectations
    const transformedItems = items.map(item => ({
      Id: item.id,
      Name: item.name,
      Price: item.discountedPrice || item.originalPrice || item.price || 0,
      Quantity: item.quantity || 1,
      Notes: item.note || '',
      SelectedItems: item.selectedItems?.map(selected => ({
        Id: selected.id,
        Name: selected.name,
        Price: selected.price || 0,
        Quantity: selected.quantity || 1,
        GroupName: selected.groupName || '',
        Type: selected.type || ''
      })) || [],
      GroupOrder: item.groupOrder || [],
      Image: item.image || ''
    }));

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      const itemPrice = item.discountedPrice || item.originalPrice || item.price || 0;
      const itemTotal = itemPrice * (item.quantity || 1);
      const selectedItemsTotal = (item.selectedItems || []).reduce((selectedSum, selected) => {
        return selectedSum + ((selected.price || 0) * (selected.quantity || 1));
      }, 0);
      return sum + itemTotal + selectedItemsTotal;
    }, 0);

    // Prepare the request payload
    const requestPayload = {
      items: transformedItems,
      customerInfo: {
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone,
        postalCode: customerInfo.postalCode,
        street: customerInfo.street,
        house: customerInfo.house,
        stairs: customerInfo.stairs,
        stick: customerInfo.stick,
        door: customerInfo.door,
        bell: customerInfo.bell,
        specialNotes: customerInfo.specialNotes
      },
      orderMethod,
      paymentMethod: 'cash',
      status: 'pending',
      specialNotes: customerInfo.specialNotes,
      totalAmount: parseFloat(totalAmount.toFixed(2))
    };

    console.log('Sending request to API:', JSON.stringify(requestPayload, null, 2));
    console.log('API Endpoint:', getApiUrl(API_ENDPOINTS.ORDER.CREATE_CASH));

    // Send the order data
    const response = await axios.post(
      getApiUrl(API_ENDPOINTS.ORDER.CREATE_CASH),
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

    // Store the order ID in localStorage for the success page
    if (response.data.orderId) {
      localStorage.setItem('cashOrderId', response.data.orderId);
      localStorage.setItem('paymentMethod', 'cash');
    }

    return {
      orderId: response.data.orderId,
      orderNumber: response.data.orderNumber,
      total: totalAmount,
      status: 'pending',
      paymentMethod: 'cash',
      orderMethod
    };
  } catch (error) {
    console.error('=== Cash Order Error ===');
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

// Store checkout data for potential retry
export const storeCheckoutData = (data) => {
  const checkoutData = {
    items: data.items.map(item => ({
      ...item,
      originalPrice: item.originalPrice || item.price,
      price: item.discountedPrice !== undefined ? item.discountedPrice : item.price,
      selectedItems: (item.selectedItems || []).map(opt => ({
        ...opt,
        price: opt.price || 0
      }))
    })),
    customerInfo: data.customerInfo,
    orderMethod: data.orderMethod,
    paymentMethod: data.paymentMethod,
    totalAmount: data.totalAmount || data.items.reduce((sum, item) => {
      const price = item.discountedPrice !== undefined ? item.discountedPrice : item.originalPrice;
      return sum + (price * item.quantity);
    }, 0)
  };
  localStorage.setItem('checkoutData', JSON.stringify(checkoutData));
};

// Retrieve stored checkout data
export const getStoredCheckoutData = () => {
  const data = localStorage.getItem('checkoutData');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Error parsing stored checkout data:', e);
      return null;
    }
  }
  return null;
};

// Clear stored checkout data
export const clearStoredCheckoutData = () => {
  localStorage.removeItem('checkoutData');
};

export const createCheckoutSession = async ({ items, customerInfo, orderMethod, paymentMethod = 'stripe' }) => {
  try {
    console.log('=== Creating Checkout Session ===');
    console.log('Payment Method:', paymentMethod);
    console.log('Order Method:', orderMethod);
    console.log('API URL:', getApiUrl(API_ENDPOINTS.STRIPE.CREATE_CHECKOUT));
    console.log('Items:', JSON.stringify(items, null, 2));
    console.log('Customer Info:', JSON.stringify(customerInfo, null, 2));

    // Store checkout data for potential retry
    storeCheckoutData({ items, customerInfo, orderMethod, paymentMethod });

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
            orderMethod: orderMethod,
            items: items.map(item => ({
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              note: item.note || "",
              selectedItems: (item.selectedItems || []).map(opt => ({
                id: opt.id,
                name: opt.name,
                groupName: opt.groupName,
                type: opt.type,
                price: opt.price,
                quantity: opt.quantity,
              })),
              groupOrder: item.groupOrder || [],
              image: item.image || "",
            }))
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
    const orderItems = items.map(item => {
      const mappedItem = {
        Id: parseInt(item.id),
        Name: item.name,
        Price: item.price,
        Quantity: item.quantity,
        Note: item.note || "",
        SelectedItems: (item.selectedItems || []).map(opt => ({
          Id: opt.id,
          Name: opt.name,
          GroupName: opt.groupName,
          Type: opt.type,
          Price: opt.price,
          Quantity: opt.quantity,
        })),
        GroupOrder: item.groupOrder || [],
        Image: item.image || "",
      };
      console.log('Mapped item:', JSON.stringify(mappedItem, null, 2));
      return mappedItem;
    });

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

export const handlePaymentSuccess = async (id) => {
  try {
    console.log('Handling payment success for ID:', id);
    
    // Get payment method from localStorage
    const paymentMethod = localStorage.getItem('paymentMethod') || 'stripe';
    console.log('Payment method:', paymentMethod);

    if (paymentMethod === 'cash') {
      // For cash payments, fetch order details directly
      const orderDetailsUrl = `${getBaseUrl()}/api/Order/${id}`;
      console.log('Fetching cash order details from:', orderDetailsUrl);
      
      const orderDetailsResponse = await axios.get(orderDetailsUrl);
      console.log('Complete order details:', orderDetailsResponse.data);

      if (!orderDetailsResponse.data) {
        throw new Error('Failed to fetch complete order details');
      }

      // Map the order details to ensure all required fields are present
      const orderDetails = {
        ...orderDetailsResponse.data,
        // Payment information
        paymentMethod: 'cash',
        status: 'pending',
        orderNumber: orderDetailsResponse.data.orderNumber || orderDetailsResponse.data.id,
        total: orderDetailsResponse.data.total,
        
        // Order method and timing
        orderMethod: orderDetailsResponse.data.orderMethod,
        createdAt: orderDetailsResponse.data.createdAt || orderDetailsResponse.data.createDate || new Date().toISOString(),
        
        // Customer information
        customerInfo: {
          firstName: orderDetailsResponse.data.customerInfo?.firstName || orderDetailsResponse.data.customer?.firstName,
          lastName: orderDetailsResponse.data.customerInfo?.lastName || orderDetailsResponse.data.customer?.lastName,
          email: orderDetailsResponse.data.customerInfo?.email || orderDetailsResponse.data.customer?.email,
          phone: orderDetailsResponse.data.customerInfo?.phone || orderDetailsResponse.data.customer?.phone,
          // Delivery information
          postalCode: orderDetailsResponse.data.customerInfo?.postalCode || orderDetailsResponse.data.customer?.postalCode,
          street: orderDetailsResponse.data.customerInfo?.street || orderDetailsResponse.data.customer?.street,
          house: orderDetailsResponse.data.customerInfo?.house || orderDetailsResponse.data.customer?.house,
          stairs: orderDetailsResponse.data.customerInfo?.stairs || orderDetailsResponse.data.customer?.stairs,
          stick: orderDetailsResponse.data.customerInfo?.stick || orderDetailsResponse.data.customer?.stick,
          door: orderDetailsResponse.data.customerInfo?.door || orderDetailsResponse.data.customer?.door,
          bell: orderDetailsResponse.data.customerInfo?.bell || orderDetailsResponse.data.customer?.bell,
          specialNotes: orderDetailsResponse.data.customerInfo?.specialNotes || orderDetailsResponse.data.customer?.specialNotes
        },
        
        // Order items
        items: orderDetailsResponse.data.items?.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          note: item.note,
          selectedItems: item.selectedItems?.map(selected => ({
            id: selected.id,
            name: selected.name,
            price: selected.price,
            quantity: selected.quantity || 1
          })) || []
        })) || []
      };

      console.log('Mapped order details:', orderDetails);
      return orderDetails;
    }

    // For Stripe payments, continue with session ID logic
    const urlParams = new URLSearchParams(window.location.search);
    const sessionIdFromUrl = urlParams.get('session_id');
    
    console.log('Session ID from URL:', sessionIdFromUrl);
    console.log('Session ID from props:', id);
    console.log('Session ID from localStorage:', localStorage.getItem('stripeSessionId'));
    
    // Use the session ID from URL if available, otherwise use the one passed as parameter
    const sessionIdToUse = sessionIdFromUrl || id;
    
    console.log('Using session ID:', sessionIdToUse);
    
    if (!sessionIdToUse) {
      console.error('No session ID available');
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

    // Get the order ID from the response
    const orderId = response.data.orderId;
    if (!orderId) {
      throw new Error('No order ID in response');
    }

    // Fetch complete order details
    const orderDetailsUrl = `${getBaseUrl()}/api/Order/${orderId}`;
    console.log('Fetching complete order details from:', orderDetailsUrl);
    
    const orderDetailsResponse = await axios.get(orderDetailsUrl);
    console.log('Complete order details:', orderDetailsResponse.data);

    if (!orderDetailsResponse.data) {
      throw new Error('Failed to fetch complete order details');
    }

    // Clear the stored session ID
    localStorage.removeItem('stripeSessionId');

    // Clear stored checkout data on successful payment
    clearStoredCheckoutData();

    // Map the order details to ensure all required fields are present
    const orderDetails = {
      ...orderDetailsResponse.data,
      // Payment information
      paymentMethod: 'stripe',
      status: 'completed',
      orderNumber: response.data.orderNumber || orderDetailsResponse.data.orderNumber,
      total: orderDetailsResponse.data.total || response.data.total,
      
      // Order method and timing
      orderMethod: orderDetailsResponse.data.orderMethod || response.data.orderMethod,
      createdAt: orderDetailsResponse.data.createdAt || orderDetailsResponse.data.createDate || new Date().toISOString(),
      
      // Customer information
      customerInfo: {
        firstName: orderDetailsResponse.data.customerInfo?.firstName || orderDetailsResponse.data.customer?.firstName,
        lastName: orderDetailsResponse.data.customerInfo?.lastName || orderDetailsResponse.data.customer?.lastName,
        email: orderDetailsResponse.data.customerInfo?.email || orderDetailsResponse.data.customer?.email,
        phone: orderDetailsResponse.data.customerInfo?.phone || orderDetailsResponse.data.customer?.phone,
        // Delivery information
        postalCode: orderDetailsResponse.data.customerInfo?.postalCode || orderDetailsResponse.data.customer?.postalCode,
        street: orderDetailsResponse.data.customerInfo?.street || orderDetailsResponse.data.customer?.street,
        house: orderDetailsResponse.data.customerInfo?.house || orderDetailsResponse.data.customer?.house,
        stairs: orderDetailsResponse.data.customerInfo?.stairs || orderDetailsResponse.data.customer?.stairs,
        stick: orderDetailsResponse.data.customerInfo?.stick || orderDetailsResponse.data.customer?.stick,
        door: orderDetailsResponse.data.customerInfo?.door || orderDetailsResponse.data.customer?.door,
        bell: orderDetailsResponse.data.customerInfo?.bell || orderDetailsResponse.data.customer?.bell,
        specialNotes: orderDetailsResponse.data.customerInfo?.specialNotes || orderDetailsResponse.data.customer?.specialNotes
      },
      
      // Order items
      items: orderDetailsResponse.data.items?.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        note: item.note,
        selectedItems: item.selectedItems?.map(selected => ({
          id: selected.id,
          name: selected.name,
          price: selected.price,
          quantity: selected.quantity || 1
        })) || []
      })) || []
    };

    console.log('Mapped order details:', orderDetails);
    return orderDetails;
  } catch (error) {
    console.error('=== Payment Success Error ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    }
    
    throw error;
  }
};

export const handlePaymentCancel = async (sessionId) => {
  try {
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

    const apiUrl = getApiUrl(API_ENDPOINTS.STRIPE.PAYMENT_CANCEL);
    const fullUrl = `${apiUrl}?session_id=${encodeURIComponent(sessionIdToUse)}`;
    console.log('Making cancel request to:', fullUrl);
    
    // Make a GET request with the session ID as a query parameter
    const response = await axios.get(fullUrl);
    console.log('Payment cancel response:', response.data);
    
    localStorage.removeItem('stripeSessionId');
    return true;
  } catch (error) {
    console.error('=== Payment Cancel Error ===');
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

// Function to clear all stored data when starting a new order
export const clearAllStoredData = () => {
  localStorage.removeItem('stripeSessionId');
  clearStoredCheckoutData();
  localStorage.removeItem('basket');
}; 