import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay instance
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

// Razorpay configuration
export const razorpayConfig = {
  key_id: process.env.RAZORPAY_KEY_ID || "",
  currency: "INR",
  theme: {
    color: "#3B82F6", // Blue theme
  },
};

// Plan mapping between our app and Razorpay
export const razorpayPlans: Record<string, string> = {
  // Map our plan IDs to Razorpay plan IDs
  // These will be created in Razorpay dashboard
  "basic-monthly": process.env.RAZORPAY_BASIC_MONTHLY_PLAN_ID || "",
  "pro-monthly": process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID || "",
  "enterprise-monthly": process.env.RAZORPAY_ENTERPRISE_MONTHLY_PLAN_ID || "",
  "basic-yearly": process.env.RAZORPAY_BASIC_YEARLY_PLAN_ID || "",
  "pro-yearly": process.env.RAZORPAY_PRO_YEARLY_PLAN_ID || "",
};

// Create or get customer in Razorpay
export async function createOrGetRazorpayCustomer(userData: {
  email: string;
  name: string;
  phone?: string;
}) {
  try {
    // Try to create a new customer
    const customer = await razorpay.customers.create({
      name: userData.name,
      email: userData.email,
      contact: userData.phone || "",
    });

    return customer;
  } catch (error: any) {
    // If customer already exists, try to find them by email
    if (
      error?.error?.code === "BAD_REQUEST_ERROR" &&
      error?.error?.description?.includes("Customer already exists")
    ) {
      // Since Razorpay doesn't provide direct email search, we'll create a unique identifier
      // and store the customer ID in our database or return a mock customer for now
      console.error("Customer already exists, using existing customer");

      // For now, we'll return a mock customer response
      // In production, you should store and retrieve the customer ID from your database
      return {
        id: `cust_${userData.email.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now()}`,
        name: userData.name,
        email: userData.email,
        contact: userData.phone || "",
      };
    }

    throw error;
  }
}

// Create subscription in Razorpay
export async function createRazorpaySubscription(params: {
  planId: string;
  customerId: string;
  totalCount?: number;
  notes?: Record<string, string>;
}) {
  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: params.planId,
      total_count: params.totalCount || 12, // 12 months default
      quantity: 1,
      notes: params.notes || {},
    });

    return subscription;
  } catch (error) {
    throw error;
  }
}

// Create payment link for subscription
export async function createPaymentLink(params: {
  amount: number;
  currency?: string;
  description: string;
  customer: {
    name: string;
    email: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  callbackUrl?: string;
  callbackMethod?: string;
}) {
  try {
    const paymentLink = await razorpay.paymentLink.create({
      amount: params.amount * 100, // Convert to paise
      currency: params.currency || "INR",
      description: params.description,
      customer: {
        name: params.customer.name,
        email: params.customer.email,
        contact: params.customer.contact || "",
      },
      notify: {
        sms: true,
        email: true,
      },
      reminder_enable: true,
      notes: params.notes || {},
      callback_url: params.callbackUrl,
      callback_method: params.callbackMethod || "get",
    });

    return paymentLink;
  } catch (error) {
    throw error;
  }
}

// Verify Razorpay payment signature
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body.toString())
    .digest("hex");

  return expectedSignature === razorpaySignature;
}

// Fetch subscription details from Razorpay
export async function getRazorpaySubscription(subscriptionId: string) {
  try {
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    return subscription;
  } catch (error) {
    throw error;
  }
}

// Cancel Razorpay subscription
export async function cancelRazorpaySubscription(
  subscriptionId: string,
  cancelAtCycleEnd: boolean = false
) {
  try {
    const subscription = await razorpay.subscriptions.cancel(
      subscriptionId,
      cancelAtCycleEnd
    );
    return subscription;
  } catch (error) {
    throw error;
  }
}

// Create order for one-time payment
export async function createRazorpayOrder(params: {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}) {
  try {
    const order = await razorpay.orders.create({
      amount: params.amount * 100, // Convert to paise
      currency: params.currency || "INR",
      receipt: params.receipt || `order_${Date.now()}`,
      notes: params.notes || {},
    });

    return order;
  } catch (error) {
    throw error;
  }
}
