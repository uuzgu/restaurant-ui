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

        // Log all available information for debugging
        console.log('Payment Success Page - Full URL:', window.location.href);
        console.log('Payment Success Page - Search Params:', location.search);
        console.log('Payment Success Page - Session ID from params:', sessionId);
        console.log('Payment Success Page - Payment Method:', paymentMethod);

        // Try to get session ID from localStorage if not in URL
        const storedSessionId = localStorage.getItem('stripeSessionId');
        console.log('Payment Success Page - Stored Session ID:', storedSessionId);

        // Use the first available session ID
        const sessionIdToUse = sessionId || storedSessionId;
        console.log('Payment Success Page - Using Session ID:', sessionIdToUse);

        if (!sessionIdToUse) {
          console.error('No session ID found in URL or localStorage');
          throw new Error('No session ID found');
        }

        // For Stripe payments, fetch the order details
        console.log('Fetching Stripe order details for session:', sessionIdToUse);
        const result = await handlePaymentSuccess(sessionIdToUse);
        console.log('Received Stripe order details:', result);
        setOrderDetails(result);

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