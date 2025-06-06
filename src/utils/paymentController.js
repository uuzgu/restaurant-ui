// Create a cash order
const createCashOrder = async (orderData) => {
  try {
    console.log('Creating cash order with data:', orderData);
    const response = await axios.post(`${API_BASE_URL}/api/orders/cash`, orderData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log('Cash order response:', response.data);
    return response.data;
  } catch (error) {
    console.error('=== Cash Order Error ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error response data:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Error headers:', error.response?.headers);
    throw error;
  }
};

// Create a Stripe order
const createStripeOrder = async (orderData) => {
  try {
    console.log('Creating Stripe order with data:', orderData);
    const response = await axios.post(`${API_BASE_URL}/api/orders/stripe`, orderData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    console.log('Stripe order response:', response.data);
    return response.data;
  } catch (error) {
    console.error('=== Stripe Order Error ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error response data:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Error headers:', error.response?.headers);
    throw error;
  }
};

// Get order details
const getOrderDetails = async (orderId) => {
  try {
    console.log('Fetching order details for orderId:', orderId);
    const response = await axios.get(`${API_BASE_URL}/api/orders/${orderId}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    console.log('Order details response:', response.data);
    return response.data;
  } catch (error) {
    console.error('=== Order Details Error ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error response data:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Error headers:', error.response?.headers);
    throw error;
  }
}; 