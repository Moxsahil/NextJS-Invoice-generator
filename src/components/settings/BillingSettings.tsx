"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Download,
  Calendar,
  CheckCircle,
  Crown,
  BarChart,
  Shield,
  Star,
  Wallet,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { toast } from "sonner";
import RazorpayPayment from "@/components/payments/RazorpayPayment";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  limits: any;
  isActive: boolean;
  isPopular: boolean;
  color: string;
}


interface BillingRecord {
  id: string;
  amount: number;
  status: string;
  planName: string;
  createdAt: string;
  invoiceNumber?: string;
  paymentMethod?: string;
}

interface UserSubscription {
  subscription: any;
  userStatus: {
    subscriptionStatus: string;
    planId: string;
    trialEndsAt?: string;
    nextBillingDate?: string;
    invoiceUsage: number;
    walletBalance: number;
  };
}

export default function BillingSettings() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [processing, setProcessing] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      // Initialize billing if needed
      await fetch("/api/billing/initialize", {
        method: "POST",
        credentials: "include"
      });
      
      // Load all billing data in parallel
      const [plansRes, subscriptionRes, billingHistoryRes] = await Promise.all([
        fetch("/api/billing/plans", { credentials: "include" }),
        fetch("/api/billing/subscription", { credentials: "include" }),
        fetch("/api/billing/history", { credentials: "include" })
      ]);

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.plans || []);
      }

      if (subscriptionRes.ok) {
        const subscriptionData = await subscriptionRes.json();
        setUserSubscription(subscriptionData);
      }

      if (billingHistoryRes.ok) {
        const billingData = await billingHistoryRes.json();
        setBillingHistory(billingData.billingHistory || []);
      }

    } catch (error) {
      toast.error("Failed to load billing data");
    } finally {
      setLoading(false);
    }
  };

  const handleFreePlanChange = async (planId: string) => {
    const targetPlan = plans.find(p => p.id === planId);
    if (!targetPlan) {
      toast.error("Plan not found");
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to change to the ${targetPlan.name} plan?\n\nThis is a free plan with limited features.`
    );

    if (!confirmed) return;

    setProcessing(true);
    try {
      const response = await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || "Plan updated successfully!");
        await loadBillingData(); // Reload data
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update plan");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    toast.success("Payment successful! Your subscription has been activated.");
    await loadBillingData(); // Reload data to show updated subscription
  };

  const handlePaymentError = (error: string) => {
    toast.error(error);
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You'll lose access to premium features.")) {
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/billing/subscription", {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        await loadBillingData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to cancel subscription");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const downloadInvoice = (invoiceNumber: string) => {
    // Create download link for invoice
    const link = document.createElement('a');
    link.href = `/api/billing/invoice/${invoiceNumber}/download`;
    link.download = `invoice-${invoiceNumber}.pdf`;
    link.click();
    toast.success(`Downloading invoice ${invoiceNumber}...`);
  };

  const getIconForPlan = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('free')) return Star;
    if (name.includes('basic')) return CheckCircle;
    if (name.includes('pro')) return Crown;
    if (name.includes('enterprise')) return Shield;
    return CheckCircle;
  };

  const getColorForPlan = (color: string) => {
    const colors: Record<string, string> = {
      gray: "text-gray-600",
      blue: "text-blue-600", 
      purple: "text-purple-600",
      green: "text-green-600"
    };
    return colors[color] || "text-blue-600";
  };

  const getBgColorForPlan = (color: string) => {
    const colors: Record<string, string> = {
      gray: "bg-gray-100",
      blue: "bg-blue-100",
      purple: "bg-purple-100", 
      green: "bg-green-100"
    };
    return colors[color] || "bg-blue-100";
  };

  // Helper function to get plan hierarchy level (higher number = higher tier)
  const getPlanLevel = (planPrice: number | undefined | null) => {
    if (!planPrice || planPrice === 0) return 0; // Free
    if (planPrice <= 299) return 1; // Basic
    if (planPrice <= 599) return 2; // Pro
    return 3; // Enterprise
  };

  // Get current user's plan level
  const getCurrentPlanLevel = () => {
    if (!userSubscription?.subscription?.plan) {
      // Find current plan from plans array if subscription doesn't have it
      const currentPlan = plans.find(p => p.id === userSubscription?.userStatus.planId);
      return currentPlan ? getPlanLevel(currentPlan.price) : 0;
    }
    return getPlanLevel(userSubscription.subscription.plan.price);
  };

  // Check if user can change to a specific plan
  const canChangeToPlan = (targetPlan: Plan) => {
    const currentLevel = getCurrentPlanLevel();
    const targetLevel = getPlanLevel(targetPlan.price);
    const isCurrentPlan = userSubscription?.userStatus.planId === targetPlan.id;
    
    if (isCurrentPlan) return false; // Can't change to current plan
    
    // Always allow upgrade or changing to/from free plan
    if (targetLevel > currentLevel || currentLevel === 0 || targetLevel === 0) {
      return true;
    }
    
    // Prevent downgrades for active paid plans
    if (userSubscription?.userStatus.subscriptionStatus === 'ACTIVE' && currentLevel > 0) {
      return false; // No downgrades for active paid plans
    }
    
    return true; // Allow for trial or inactive plans
  };

  // Get button text based on plan relationship
  const getButtonText = (targetPlan: Plan) => {
    const currentLevel = getCurrentPlanLevel();
    const targetLevel = getPlanLevel(targetPlan.price);
    const isCurrentPlan = userSubscription?.userStatus.planId === targetPlan.id;
    
    if (isCurrentPlan) return "Current Plan";
    
    if (targetLevel > currentLevel) {
      return "Upgrade";
    } else if (targetLevel < currentLevel) {
      if (userSubscription?.userStatus.subscriptionStatus === 'ACTIVE' && currentLevel > 0) {
        return "Downgrade Not Allowed";
      } else {
        return "Downgrade";
      }
    } else {
      return "Switch";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600">Loading billing information...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 text-black"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Billing & Subscription
        </h2>
        <p className="mt-1 text-gray-600">
          Manage your subscription, billing details, and payment history
        </p>
      </div>

      {/* Current Plan */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-gray-600" />
            <span className="text-gray-600 font-medium">
              {userSubscription?.subscription?.plan?.name || 'Free Plan'}
            </span>
            {userSubscription && (
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                userSubscription.userStatus.subscriptionStatus === 'TRIAL' 
                  ? 'bg-orange-100 text-orange-800'
                  : userSubscription.userStatus.subscriptionStatus === 'ACTIVE'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {userSubscription.userStatus.subscriptionStatus}
              </span>
            )}
          </div>
        </div>

        {userSubscription ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {userSubscription.userStatus.nextBillingDate && (
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Next Billing Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(userSubscription.userStatus.nextBillingDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CreditCard className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Plan Cost</p>
                <p className="font-semibold text-gray-900">
                  ₹{userSubscription.subscription?.plan?.price || 0}
                  {userSubscription.subscription?.plan?.interval && (
                    <span className="text-sm text-gray-600">
                      /{userSubscription.subscription.plan.interval.toLowerCase()}
                    </span>
                  )}
                </p>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <BarChart className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Usage This Month</p>
                <p className="font-semibold text-gray-900">
                  {userSubscription.userStatus.invoiceUsage} / 
                  {userSubscription.subscription?.plan?.limits?.maxInvoicesPerMonth === -1 
                    ? ' Unlimited' 
                    : ` ${userSubscription.subscription?.plan?.limits?.maxInvoicesPerMonth || 0}`}
                </p>
              </div>

              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Wallet className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Wallet Balance</p>
                <p className="font-semibold text-gray-900">
                  ₹{(userSubscription.userStatus.walletBalance || 0).toFixed(2)}
                </p>
              </div>

              {userSubscription.userStatus.trialEndsAt && (
                <div className="col-span-full">
                  <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-600">
                      Trial ends on {new Date(userSubscription.userStatus.trialEndsAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={handleCancelSubscription}
                disabled={processing}
              >
                Cancel Subscription
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Free Plan</h4>
            <p className="text-gray-600 mb-4">You're currently on the free plan</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="text-center p-3 bg-white rounded-lg border">
                <p className="text-sm text-gray-600">Monthly Cost</p>
                <p className="font-semibold text-gray-900">₹0</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <p className="text-sm text-gray-600">Invoices Limit</p>
                <p className="font-semibold text-gray-900">5/month</p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <p className="text-sm text-gray-600">Users</p>
                <p className="font-semibold text-gray-900">1</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Available Plans */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Available Plans
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const Icon = getIconForPlan(plan.name);
            const isCurrentPlan = userSubscription?.userStatus.planId === plan.id;
            const canChange = canChangeToPlan(plan);
            const buttonText = getButtonText(plan);
            const currentLevel = getCurrentPlanLevel();
            const targetLevel = getPlanLevel(plan.price);
            const isUpgrade = targetLevel > currentLevel;

            return (
              <div
                key={plan.id}
                className={`
                  relative rounded-xl border-2 p-6 transition-all duration-200
                  ${
                    isCurrentPlan
                      ? "border-purple-500 bg-purple-50"
                      : canChange 
                      ? "border-gray-200 hover:border-gray-300"
                      : "border-gray-200 bg-gray-50 opacity-75"
                  }
                  ${plan.isPopular ? "ring-2 ring-purple-200" : ""}
                `}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Upgrade Badge */}
                {!isCurrentPlan && isUpgrade && (
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
                      <Crown className="w-3 h-3 mr-1" />
                      Upgrade
                    </div>
                  </div>
                )}

                {/* Downgrade Not Allowed Badge */}
                {!canChange && !isCurrentPlan && targetLevel < currentLevel && (
                  <div className="absolute -top-2 -right-2">
                    <div className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
                      <Shield className="w-3 h-3 mr-1" />
                      Blocked
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <div
                    className={`${getBgColorForPlan(plan.color)} p-3 rounded-lg inline-flex mb-4`}
                  >
                    <Icon className={`w-6 h-6 ${getColorForPlan(plan.color)}`} />
                  </div>

                  <h4 className="text-lg font-semibold text-gray-900 mb-1">
                    {plan.name}
                  </h4>

                  <p className="text-sm text-gray-600 mb-4">
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    <span className="text-3xl font-bold text-gray-900">
                      ₹{plan.price}
                    </span>
                    <span className="text-gray-600">/{plan.interval.toLowerCase()}</span>
                  </div>

                  <ul className="text-sm space-y-2 mb-6 text-left">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.price === 0 ? (
                    // Free plan - direct change
                    <Button
                      onClick={() => canChange ? handleFreePlanChange(plan.id) : null}
                      disabled={!canChange || processing || loading}
                      className="w-full"
                      variant={
                        isCurrentPlan 
                          ? "outline" 
                          : !canChange 
                          ? "outline"
                          : "outline"
                      }
                    >
                      {buttonText}
                    </Button>
                  ) : (
                    // Paid plan - Razorpay payment
                    canChange && !isCurrentPlan ? (
                      <RazorpayPayment
                        planId={plan.id}
                        planName={plan.name}
                        amount={plan.price}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                        disabled={processing || loading}
                      >
                        <Button
                          disabled={processing || loading}
                          className="w-full"
                          variant={isUpgrade ? "primary" : "outline"}
                        >
                          {buttonText}
                        </Button>
                      </RazorpayPayment>
                    ) : (
                      <Button
                        disabled={true}
                        className="w-full"
                        variant="outline"
                      >
                        {buttonText}
                      </Button>
                    )
                  )}

                  {/* Explanation text for blocked downgrades */}
                  {!canChange && !isCurrentPlan && targetLevel < currentLevel && (
                    <p className="text-xs text-red-600 mt-2">
                      Active plans cannot be downgraded
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Payment Methods */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Payment Processing
          </h3>
        </div>

        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Secure Payments with Razorpay</h4>
          <p className="text-gray-600 mb-4">
            All payments are processed securely through Razorpay. <br />
            No need to store payment methods - pay directly when upgrading plans.
          </p>
          <div className="flex justify-center items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              Bank Grade Security
            </div>
            <div className="flex items-center">
              <CreditCard className="w-4 h-4 mr-1" />
              All Cards Accepted
            </div>
            <div className="flex items-center">
              <Wallet className="w-4 h-4 mr-1" />
              UPI Supported
            </div>
          </div>
        </div>

      </Card>

      {/* Billing History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Billing History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">
                  Date
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">
                  Plan
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">
                  Amount
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">
                  Invoice
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No billing history yet
                  </td>
                </tr>
              ) : (
                billingHistory.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-900">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-gray-900">{item.planName}</td>
                    <td className="py-3 px-4 text-gray-900">₹{item.amount}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'PAID' 
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : item.status === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {item.invoiceNumber || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      {item.invoiceNumber && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadInvoice(item.invoiceNumber!)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
