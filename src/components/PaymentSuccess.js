import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { handlePaymentSuccess } from '../controllers/paymentController';
import { useDarkMode } from '../DarkModeContext';
import { useLanguage } from '../LanguageContext';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import './PaymentSuccess.css';

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
                {orderDetails.customerInfo.bell && (
                  <div className="space-y-2">
                    <div className="text-[var(--popup-text-tertiary)]">Bell</div>
                    <div className="font-medium text-[var(--popup-text)]">{orderDetails.customerInfo.bell}</div>
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

          {/* Order Items */}
          <div className="border-t border-[var(--popup-content-border)] pt-6">
            <h3 className="text-xl font-semibold mb-4 text-[var(--popup-header-text)]">Order Items</h3>
            <div className="space-y-4">
              {orderDetails.items?.map((item, index) => (
                <div key={index} className="border-b border-[var(--popup-content-border)] pb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-[var(--popup-text)]">
                        {item.quantity}x {item.name}
                      </div>
                      {item.note && (
                        <div className="text-sm text-[var(--popup-text-tertiary)] mt-1">
                          Note: {item.note}
                        </div>
                      )}
                    </div>
                    <div className="text-[var(--popup-text)] font-medium">
                      {formatPrice(calculateItemTotal(item))}
                    </div>
                  </div>
                  
                  {/* Item Options */}
                  {item.selectedItems && item.selectedItems.length > 0 && (
                    <div className="ml-4 mt-2 space-y-2">
                      {Object.entries(groupOptionsByGroupNameWithOrder(item.selectedItems))
                        .sort(([, a], [, b]) => a.displayOrder - b.displayOrder)
                        .map(([groupName, group]) => (
                          <div key={groupName} className="text-sm">
                            <div className="text-[var(--popup-text-tertiary)] font-medium mb-1">
                              {group.name}:
                            </div>
                            <div className="space-y-1">
                              {group.options.map((option, optIndex) => (
                                <div key={optIndex} className="flex justify-between">
                                  <span className="text-[var(--popup-text)]">
                                    {option.quantity > 1 ? `${option.quantity}x ` : ''}{option.name}
                                  </span>
                                  <span className="text-[var(--popup-text)]">
                                    {formatPrice(option.price * option.quantity)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, translations } = useLanguage();
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      if (sessionId) {
        const result = await handlePaymentSuccess(sessionId);
        setOrderDetails(result);
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to fetch order details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">
            <i className="fas fa-check-circle"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment Successful</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your order! Your payment has been processed successfully.
          </p>
          {error && (
            <p className="text-red-500 mb-4">{error}</p>
          )}
          <div className="space-y-4">
            <button
              onClick={() => setShowOrderDetails(true)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
            >
              View Order Details
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition duration-200"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
      {showOrderDetails && (
        <OrderDetailsPopup
          orderDetails={orderDetails}
          onClose={() => setShowOrderDetails(false)}
        />
      )}
    </div>
  );
};

export default PaymentSuccess; 