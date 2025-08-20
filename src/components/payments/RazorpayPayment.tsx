"use client";

import { useState } from "react";
import { toast } from "sonner";

interface RazorpayPaymentProps {
  planId: string;
  planName: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayPayment({
  planId,
  planName,
  amount,
  onSuccess,
  onError,
  disabled = false,
  children,
}: RazorpayPaymentProps) {
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (disabled || loading) return;

    setLoading(true);
    
    try {
      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          toast.error("Failed to load payment gateway");
          setLoading(false);
          return;
        }
      }

      // Create order
      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          planId,
          paymentType: "subscription",
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || "Failed to create payment order");
      }

      const orderData = await orderResponse.json();

      // Razorpay payment options
      const options = {
        key: orderData.key,
        amount: orderData.amount * 100, // Convert to paise
        currency: orderData.currency,
        name: "Invoice App",
        description: `Subscription to ${orderData.planDetails.name} plan`,
        order_id: orderData.orderId,
        customer: orderData.customerDetails,
        theme: {
          color: "#3B82F6",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.info("Payment cancelled");
          },
        },
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                transactionId: orderData.transactionId,
              }),
            });

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              toast.success(verifyData.message || "Payment successful!");
              onSuccess();
            } else {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.error || "Payment verification failed");
            }
          } catch (verifyError) {
            onError(verifyError instanceof Error ? verifyError.message : "Payment verification failed");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: orderData.customerDetails.name,
          email: orderData.customerDetails.email,
          contact: orderData.customerDetails.contact,
        },
        notes: {
          plan_id: planId,
          plan_name: planName,
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      
      razorpayInstance.on('payment.failed', (response: any) => {
        setLoading(false);
        onError(
          response.error?.description || 
          response.error?.reason || 
          "Payment failed"
        );
      });

      razorpayInstance.open();

    } catch (error) {
      setLoading(false);
      onError(error instanceof Error ? error.message : "Failed to initialize payment");
    }
  };

  return (
    <div onClick={handlePayment} style={{ cursor: disabled || loading ? 'not-allowed' : 'pointer' }}>
      {children}
    </div>
  );
}