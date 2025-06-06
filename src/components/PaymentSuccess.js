import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { handlePaymentSuccess } from '../controllers/paymentController';
import { useDarkMode } from '../DarkModeContext';
import { useLanguage } from '../LanguageContext';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import './PaymentSuccess.css';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

// Helper function to get base URL
const getBaseUrl = () => {
  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5019';
  }
  // In production, use the current origin
  return window.location.origin;
};

// Helper function to format price
const formatPrice = (price) => {
  if (price === undefined || price === null) return '€0.00';
  try {
    return `€${parseFloat(price).toFixed(2)}`;
  } catch (e) {
    console.error('Error formatting price:', e);
    return '€0.00';
  }
};

// Group options by groupName and use item.groupOrder for display order (copied from Basket.js)
function groupOptionsByGroupNameWithOrder(selectedItems) {
  if (!selectedItems) return {};
  const groupMap = {};
  selectedItems.forEach(option => {
    const groupName = option.groupName || 'Other';
    if (!groupMap[groupName]) {
      groupMap[groupName] = {
        name: groupName,
        displayOrder: option.groupDisplayOrder ?? option.displayOrder ?? 9999,
        options: []
      };
    }
    groupMap[groupName].options.push(option);
  });
  return groupMap;
}

const OrderDetailsPopup = ({ orderDetails, onClose }) => {
  const { isDarkMode } = useDarkMode();
  const { language, translations } = useLanguage();

  // Helper function to calculate item total
  const calculateItemTotal = (item) => {
    if (!item) return 0;
    try {
      const baseTotal = (item.price || 0) * (item.quantity || 1);
      const optionsTotal = item.selectedItems?.reduce((sum, option) => 
        sum + ((option.price || 0) * (option.quantity || 1)), 0) || 0;
      return baseTotal + optionsTotal;
    } catch (e) {
      console.error('Error calculating item total:', e);
      return 0;
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid Date';
    }
  };

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!orderDetails) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full mx-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          <div className="text-center">
            <p className="text-red-500">No order details available</p>
            <button
              onClick={onClose}
              className="mt-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black bg-opacity-50" style={{ paddingTop: '100px' }} onClick={onClose}>
      <div
        className="relative bg-[var(--popup-container-bg)] rounded-2xl shadow-xl max-w-2xl w-full mx-4 p-6 overflow-y-auto border border-[var(--popup-container-border)]"
        style={{ 
          zIndex: 10000,
          maxHeight: 'calc(100vh - 140px)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--popup-text-tertiary)] hover:text-[var(--popup-text)] transition-colors"
          aria-label="Close order details"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[var(--popup-header-text)]">Order Details</h2>
        </div>

        <div className="mt-4 space-y-6">
          {/* Basic Order Info */}
          <div className="border-b border-[var(--popup-content-border)] pb-6">
            <h3 className="text-xl font-semibold mb-4 text-[var(--popup-header-text)]">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="text-[var(--popup-text-tertiary)]">Order Number</div>
                <div className="font-medium text-[var(--popup-text)]">{orderDetails.orderNumber || 'N/A'}</div>
              </div>
              <div className="space-y-2">
                <div className="text-[var(--popup-text-tertiary)]">Status</div>
                <div className="font-medium text-[var(--popup-text)] capitalize">{orderDetails.status || 'N/A'}</div>
              </div>
              <div className="space-y-2">
                <div className="text-[var(--popup-text-tertiary)]">Payment Method</div>
                <div className="font-medium text-[var(--popup-text)] capitalize">{orderDetails.paymentMethod || 'N/A'}</div>
              </div>
              <div className="space-y-2">
                <div className="text-[var(--popup-text-tertiary)]">Total Amount</div>
                <div className="font-medium text-[var(--popup-text)]">{formatPrice(orderDetails.total)}</div>
              </div>
              <div className="space-y-2">
                <div className="text-[var(--popup-text-tertiary)]">Order Method</div>
                <div className="font-medium text-[var(--popup-text)] capitalize">{orderDetails.orderMethod || 'N/A'}</div>
              </div>
              <div className="space-y-2">
                <div className="text-[var(--popup-text-tertiary)]">Created At</div>
                <div className="font-medium text-[var(--popup-text)]">{formatDate(orderDetails.createdAt)}</div>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-b border-[var(--popup-content-border)] pb-6">
            <h3 className="text-xl font-semibold mb-4 text-[var(--popup-header-text)]">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="text-[var(--popup-text-tertiary)]">Name</div>
                <div className="font-medium text-[var(--popup-text)]">
                  {orderDetails.customerInfo?.firstName || 'N/A'} {orderDetails.customerInfo?.lastName || ''}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-[var(--popup-text-tertiary)]">Email</div>
                <div className="font-medium text-[var(--popup-text)]">{orderDetails.customerInfo?.email || 'N/A'}</div>
              </div>
              <div className="space-y-2">
                <div className="text-[var(--popup-text-tertiary)]">Phone</div>
                <div className="font-medium text-[var(--popup-text)]">{orderDetails.customerInfo?.phone || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          {orderDetails.customerInfo?.postalCode && (
            <div className="border-b border-[var(--popup-content-border)] pb-6">
              <h3 className="text-xl font-semibold mb-4 text-[var(--popup-header-text)]">Delivery Address</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="text-[var(--popup-text-tertiary)]">Street</div>
                  <div className="font-medium text-[var(--popup-text)]">{orderDetails.customerInfo.street || 'N/A'}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-[var(--popup-text-tertiary)]">House</div>
                  <div className="font-medium text-[var(--popup-text)]">{orderDetails.customerInfo.house || 'N/A'}</div>
                </div>
                <div className="space-y-2">
                  <div className="text-[var(--popup-text-tertiary)]">Postal Code</div>
                  <div className="font-medium text-[var(--popup-text)]">{orderDetails.customerInfo.postalCode || 'N/A'}</div>
                </div>
                {orderDetails.customerInfo.stairs && (
                  <div className="space-y-2">
                    <div className="text-[var(--popup-text-tertiary)]">Stairs</div>
                    <div className="font-medium text-[var(--popup-text)]">{orderDetails.customerInfo.stairs}</div>
                  </div>
                )}
                {orderDetails.customerInfo.stick && (
                  <div className="space-y-2">
                    <div className="text-[var(--popup-text-tertiary)]">Stick</div>
                    <div className="font-medium text-[var(--popup-text)]">{orderDetails.customerInfo.stick}</div>
                  </div>
                )}
                {orderDetails.customerInfo.door && (
                  <div className="space-y-2">
                    <div className="text-[var(--popup-text-tertiary)]">Door</div>
                    <div className="font-medium text-[var(--popup-text)]">{orderDetails.customerInfo.door}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Special Notes */}
          {orderDetails.customerInfo?.specialNotes && (
            <div className="border-t border-[var(--popup-content-border)] pt-6">
              <h3 className="text-xl font-semibold mb-4 text-[var(--popup-header-text)]">Special Notes</h3>
              <p className="text-sm text-[var(--popup-text-tertiary)]">
                {orderDetails.customerInfo.specialNotes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PaymentSuccess = () => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useDarkMode();
  const { language, translations } = useLanguage();
  const { t } = useTranslation();

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Payment Success Page - Full URL:', window.location.href);
      console.log('Payment Success Page - Search Params:', location.search);
      console.log('Payment Success Page - Location State:', location.state);
      
      // First check if we have order details in the navigation state
      if (location.state?.orderDetails) {
        console.log('Using order details from navigation state:', location.state.orderDetails);
        // Use the order details directly from navigation state
        const mappedOrderDetails = {
          ...location.state.orderDetails,
          // Payment information
          paymentMethod: location.state.paymentMethod || 'cash',
          status: location.state.orderDetails.status || 'pending',
          orderNumber: location.state.orderDetails.orderNumber || location.state.orderDetails.id,
          total: location.state.orderDetails.total,
          
          // Order method and timing
          orderMethod: location.state.orderDetails.orderMethod,
          createdAt: location.state.orderDetails.createdAt || new Date().toISOString(),
          
          // Customer information
          customerInfo: location.state.customerInfo,
          
          // Order items - properly map items and their options
          items: (location.state.orderDetails.items || []).map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            note: item.note,
            selectedItems: (item.selectedItems || []).map(selected => ({
              id: selected.id,
              name: selected.name,
              price: selected.price,
              quantity: selected.quantity || 1,
              groupName: selected.groupName,
              type: selected.type
            })),
            groupOrder: item.groupOrder || []
          }))
        };
        
        console.log('Mapped order details from navigation state:', mappedOrderDetails);
        setOrderDetails(mappedOrderDetails);
        setLoading(false);
        return;
      }
      
      // Get payment method from localStorage
      const paymentMethod = localStorage.getItem('paymentMethod') || 'stripe';
      console.log('Payment Success Page - Payment Method:', paymentMethod);

      // For cash payments, we should have an orderId
      if (paymentMethod === 'cash') {
        const orderId = localStorage.getItem('cashOrderId');
        console.log('Payment Success Page - Cash Order ID:', orderId);
        
        if (!orderId) {
          throw new Error('No order ID found for cash payment');
        }

        const orderDetails = await handlePaymentSuccess(orderId);
        setOrderDetails(orderDetails);
        setLoading(false);
        return;
      }

      // For Stripe payments, continue with session ID logic
      const urlParams = new URLSearchParams(location.search);
      const sessionIdFromParams = urlParams.get('session_id');
      console.log('Payment Success Page - Session ID from params:', sessionIdFromParams);
      
      const storedSessionId = localStorage.getItem('stripeSessionId');
      console.log('Payment Success Page - Stored Session ID:', storedSessionId);
      
      const sessionIdToUse = sessionIdFromParams || storedSessionId;
      console.log('Payment Success Page - Using Session ID:', sessionIdToUse);

      if (!sessionIdToUse) {
        throw new Error('No session ID found');
      }

      const orderDetails = await handlePaymentSuccess(sessionIdToUse);
      setOrderDetails(orderDetails);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching order details:', error);
      console.error('Error stack:', error.stack);
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, []);

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

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="w-full max-w-2xl mx-4 my-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="w-full max-w-2xl mx-4 my-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="w-full max-w-2xl mx-4 my-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-600 dark:text-gray-400">No order details available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-[var(--popup-text-septenary)]' : 'bg-[var(--popup-text-senary)]'}`}>
      <div className="w-full max-w-2xl mx-4 my-8">
        <div className="bg-[var(--popup-container-bg)] rounded-lg shadow-lg p-8 border border-[var(--popup-container-border)]">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-500 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-3 text-[var(--popup-header-text)]">Payment Successful!</h2>
            <p className="text-lg text-[var(--popup-text-tertiary)]">Thank you for your order</p>
          </div>

          <div className="border-t border-[var(--popup-content-border)] pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-[var(--popup-header-text)]">Order Details</h3>
              <button
                onClick={() => setShowDetailsPopup(true)}
                className="text-[var(--popup-text-tertiary)] hover:text-[var(--popup-text)] transition-colors"
                title="View detailed order information"
              >
                <InformationCircleIcon className="h-7 w-7" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-[var(--popup-content-border)]">
                <span className="text-[var(--popup-text-tertiary)]">Order Number:</span>
                <span className="font-medium text-[var(--popup-text)]">{orderDetails.orderNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--popup-content-border)]">
                <span className="text-[var(--popup-text-tertiary)]">Total Amount:</span>
                <span className="font-medium text-[var(--popup-text)]">{formatPrice(orderDetails.total)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[var(--popup-text-tertiary)]">Payment Method:</span>
                <span className="font-medium text-[var(--popup-text)] capitalize">{orderDetails.paymentMethod || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="bg-red-500 text-white px-8 py-3 rounded-lg hover:bg-red-600 transition-colors text-lg font-medium"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>

      {showDetailsPopup && orderDetails && (
        <OrderDetailsPopup
          orderDetails={orderDetails}
          onClose={() => setShowDetailsPopup(false)}
        />
      )}
    </div>
  );
};

export default PaymentSuccess; 