import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { handlePaymentSuccess } from '../controllers/paymentController';
import { useDarkMode } from '../DarkModeContext';
import { useLanguage } from '../LanguageContext';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useDarkMode();
  const { language, translations } = useLanguage();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get session ID from URL or localStorage
        const params = new URLSearchParams(location.search);
        let sessionId = params.get('session_id') || params.get('sessionId');
        const paymentMethod = params.get('payment_method') || 'stripe';

        // Fallback: Try to extract session ID from the raw URL if not found in params
        if (!sessionId) {
          const match = window.location.href.match(/[?&]session_id=([^&]+)/);
          if (match) {
            sessionId = decodeURIComponent(match[1]);
            console.log('Extracted session ID from URL:', sessionId);
          }
        }

        console.log('Payment Success Page - Full URL:', window.location.href);
        console.log('Payment Success Page - Search Params:', location.search);
        console.log('Payment Success Page - Raw Search String:', window.location.search);
        console.log('Payment Success Page - Decoded Search String:', decodeURIComponent(window.location.search));
        console.log('Payment Success Page - Session ID:', sessionId);
        console.log('Payment Success Page - Payment Method:', paymentMethod);
        console.log('Payment Success Page - Location State:', location.state);

        // Check if we have order details in location state
        if (location.state?.orderDetails) {
          console.log('Using order details from location state:', location.state.orderDetails);
          const orderDetails = location.state.orderDetails;
          setOrderDetails({
            orderId: orderDetails.orderId,
            total: orderDetails.total,
            status: orderDetails.status || 'pending',
            paymentMethod: orderDetails.paymentMethod || 'cash',
            orderNumber: orderDetails.orderNumber || orderDetails.orderId
          });
          setLoading(false);
          return;
        }

        if (paymentMethod === 'cash') {
          // For cash payments, we already have the order details
          const orderId = params.get('order_id');
          if (orderId) {
            console.log('Using order ID from URL:', orderId);
            setOrderDetails({
              orderId: orderId,
              status: 'pending',
              paymentMethod: 'cash',
              orderNumber: orderId,
              total: params.get('total') || '0.00'
            });
          } else {
            throw new Error('No order ID found for cash payment');
          }
        } else {
          // For Stripe payments, fetch the order details
          if (!sessionId) {
            console.error('No session ID found in URL. Full URL:', window.location.href);
            throw new Error('No session ID found in URL');
          }

          // Try to get session ID from localStorage if not in URL
          const storedSessionId = localStorage.getItem('stripeSessionId');
          const sessionIdToUse = sessionId || storedSessionId;
          
          if (!sessionIdToUse) {
            console.error('No session ID found in URL or localStorage');
            throw new Error('No session ID found');
          }

          console.log('Fetching Stripe order details for session:', sessionIdToUse);
          const result = await handlePaymentSuccess(sessionIdToUse);
          console.log('Received Stripe order details:', result);
          setOrderDetails(result);
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        console.error('Error stack:', err.stack);
        if (err.response) {
          console.error('Error response data:', err.response.data);
          console.error('Error status:', err.response.status);
          console.error('Error headers:', err.response.headers);
        }
        setError(err.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [location]);

  const getStatusText = (status, paymentMethod) => {
    if (paymentMethod === 'cash') {
      return translations[language].paymentSuccess?.cashPending || 'Order Pending - Pay at Pickup';
    }
    switch (status?.toLowerCase()) {
      case 'completed':
        return translations[language].paymentSuccess?.completed || 'Payment Completed';
      case 'processing':
        return translations[language].paymentSuccess?.processing || 'Payment Processing';
      case 'pending':
        return translations[language].paymentSuccess?.pending || 'Payment Pending';
      default:
        return translations[language].paymentSuccess?.unknown || 'Unknown Status';
    }
  };

  const formatTotal = (total) => {
    if (total === null || total === undefined) return '0.00';
    const numTotal = parseFloat(total);
    return isNaN(numTotal) ? '0.00' : numTotal.toFixed(2);
  };

  if (loading) {
    return (
      <div className={`payment-success-container ${isDarkMode ? 'dark' : ''}`}>
        <div className="payment-success-content">
          <div className="loading-spinner"></div>
          <h2>{translations[language].paymentSuccess?.loading || 'Loading...'}</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`payment-success-container ${isDarkMode ? 'dark' : ''}`}>
        <div className="payment-success-content">
          <div className="error-icon">⚠️</div>
          <h2>{translations[language].paymentSuccess?.error || 'Error'}</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="home-button">
            {translations[language].paymentSuccess?.returnHome || 'Return to Home'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`payment-success-container ${isDarkMode ? 'dark' : ''}`}>
      <div className="payment-success-content">
        <div className="success-icon">✓</div>
        <h2>{translations[language].paymentSuccess?.title || 'Payment Successful!'}</h2>
        <p>{getStatusText(orderDetails?.status, orderDetails?.paymentMethod)}</p>
        
        {orderDetails && (
          <div className="order-details">
            <h3>{translations[language].paymentSuccess?.orderDetails || 'Order Details'}</h3>
            <p><strong>{translations[language].paymentSuccess?.orderNumber || 'Order Number'}:</strong> {orderDetails.orderNumber}</p>
            <p><strong>{translations[language].paymentSuccess?.total || 'Total'}:</strong> €{formatTotal(orderDetails.total)}</p>
            <p><strong>{translations[language].paymentSuccess?.paymentMethod || 'Payment Method'}:</strong> {orderDetails.paymentMethod === 'stripe' ? 'Card' : 'Cash'}</p>
          </div>
        )}

        <div className="action-buttons">
          <button onClick={() => navigate('/order')} className="order-more-button">
            {translations[language].paymentSuccess?.orderMore || 'Order More'}
          </button>
          <button onClick={() => navigate('/')} className="home-button">
            {translations[language].paymentSuccess?.returnHome || 'Return to Home'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess; 