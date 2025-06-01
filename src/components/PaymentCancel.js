import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';
import { useDarkMode } from '../DarkModeContext';
import { handlePaymentCancel } from '../controllers/paymentController';

const PaymentCancel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, translations } = useLanguage();
  const { darkMode } = useDarkMode();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storedCheckoutData, setStoredCheckoutData] = useState(null);

  useEffect(() => {
    const processPaymentCancel = async () => {
      try {
        setLoading(true);
        // Get session_id from URL query parameters
        const params = new URLSearchParams(location.search);
        const sessionId = params.get('session_id') || params.get('sessionId');

        if (sessionId) {
          // Handle payment cancellation with backend
          await handlePaymentCancel(sessionId);
        }

        // Get the stored checkout data
        const storedData = localStorage.getItem('checkoutData');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          console.log('Retrieved checkout data:', parsedData); // Debug log
          setStoredCheckoutData(parsedData);
        }
      } catch (err) {
        console.error('Payment cancellation error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    processPaymentCancel();
  }, [location]);

  const handleRetryPayment = () => {
    if (storedCheckoutData && storedCheckoutData.items) {
      // Store the basket in localStorage to ensure it persists
      localStorage.setItem('basket', JSON.stringify(storedCheckoutData.items));
      
      // Redirect back to checkout with the stored data
      navigate('/checkout', { 
        state: {
          basket: storedCheckoutData.items,
          orderMethod: storedCheckoutData.orderMethod || "delivery",
          customerInfo: storedCheckoutData.customerInfo || {}
        }
      });
    } else {
      // If no stored data, just go to checkout
      navigate('/checkout');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {translations[language].processingCancellation || 'Processing cancellation...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`max-w-md w-full p-8 rounded-2xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <span className="text-4xl">❌</span>
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {translations[language].paymentCanceled || 'Payment Canceled'}
          </h1>
          <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {error || translations[language].paymentError || 'Your payment was canceled. Would you like to try again?'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleRetryPayment}
            className="w-full py-3 px-6 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors duration-200"
          >
            {translations[language].retryPayment || 'Retry Payment'}
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 px-6 rounded-xl border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold transition-colors duration-200"
          >
            {translations[language].returnToHome || 'Return to Home'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel; 