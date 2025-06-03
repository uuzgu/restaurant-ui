'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { handlePaymentSuccess } from '../controllers/paymentController';

export default function PaymentSuccess() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
          throw new Error('No session ID found');
        }

        const result = await handlePaymentSuccess(sessionId);
        setOrderDetails(result);
      } catch (err: any) {
        console.error('Error fetching order details:', err);
        setError(err.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <h2 className="mt-4 text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <a href="/" className="text-blue-500 hover:text-blue-700">
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <div className="text-green-500 text-4xl mb-4 text-center">✓</div>
        <h2 className="text-2xl font-semibold text-center mb-4">Payment Successful!</h2>
        
        {orderDetails && (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Order Details</h3>
              <p><strong>Order Number:</strong> {orderDetails.orderNumber}</p>
              <p><strong>Total:</strong> €{parseFloat(orderDetails.total).toFixed(2)}</p>
              <p><strong>Status:</strong> {orderDetails.status}</p>
              <p><strong>Payment Method:</strong> Card</p>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-3">
          <a
            href="/order"
            className="block w-full text-center bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          >
            Order More
          </a>
          <a
            href="/"
            className="block w-full text-center bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
          >
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
} 