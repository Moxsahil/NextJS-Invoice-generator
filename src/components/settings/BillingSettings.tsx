"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Download,
  Calendar,
  CheckCircle,
  Crown,
  Zap,
  Users,
  BarChart,
  Shield,
  Star,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { toast } from "sonner";

export default function BillingSettings() {
  const [loading, setLoading] = useState(false);
  const [currentPlan] = useState("pro"); // free, basic, pro, enterprise

  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      interval: "month",
      description: "Perfect for getting started",
      features: [
        "Up to 5 invoices per month",
        "1 user account",
        "Basic templates",
        "Email support",
        "PDF export",
      ],
      icon: Star,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      id: "basic",
      name: "Basic",
      price: 299,
      interval: "month",
      description: "For small businesses",
      features: [
        "Up to 50 invoices per month",
        "3 user accounts",
        "Custom templates",
        "Priority email support",
        "Payment tracking",
        "Basic analytics",
      ],
      icon: CheckCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      id: "pro",
      name: "Pro",
      price: 599,
      interval: "month",
      description: "For growing businesses",
      features: [
        "Unlimited invoices",
        "10 user accounts",
        "Advanced templates",
        "Live chat support",
        "Payment processing",
        "Advanced analytics",
        "API access",
        "White-label options",
      ],
      icon: Crown,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 1499,
      interval: "month",
      description: "For large organizations",
      features: [
        "Everything in Pro",
        "Unlimited users",
        "Custom integrations",
        "Dedicated support",
        "SLA guarantee",
        "Custom branding",
        "Multi-company support",
        "Advanced security",
      ],
      icon: Shield,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  const billingHistory = [
    {
      id: "1",
      date: "2024-01-01",
      amount: 599,
      status: "paid",
      plan: "Pro Plan",
      invoice: "INV-2024-001",
    },
    {
      id: "2",
      date: "2023-12-01",
      amount: 599,
      status: "paid",
      plan: "Pro Plan",
      invoice: "INV-2023-012",
    },
    {
      id: "3",
      date: "2023-11-01",
      amount: 599,
      status: "paid",
      plan: "Pro Plan",
      invoice: "INV-2023-011",
    },
  ];

  const handlePlanChange = async (planId: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/billing/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId }),
      });

      if (response.ok) {
        toast.success("Plan updated successfully!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update plan");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = (invoiceId: string) => {
    toast.success(`Downloading invoice ${invoiceId}...`);
  };

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
            <Crown className="w-5 h-5 text-purple-600" />
            <span className="text-purple-600 font-medium">Pro Plan</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Next Billing Date</p>
            <p className="font-semibold text-gray-900">February 1, 2024</p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CreditCard className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Monthly Cost</p>
            <p className="font-semibold text-gray-900">₹599</p>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <BarChart className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Usage This Month</p>
            <p className="font-semibold text-gray-900">47 / Unlimited</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="outline">Cancel Subscription</Button>
          <Button>Upgrade Plan</Button>
        </div>
      </Card>

      {/* Available Plans */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Available Plans
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`
                  relative rounded-xl border-2 p-6 transition-all duration-200
                  ${
                    isCurrentPlan
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }
                  ${plan.popular ? "ring-2 ring-purple-200" : ""}
                `}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <div
                    className={`${plan.bgColor} p-3 rounded-lg inline-flex mb-4`}
                  >
                    <Icon className={`w-6 h-6 ${plan.color}`} />
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
                    <span className="text-gray-600">/{plan.interval}</span>
                  </div>

                  <ul className="text-sm space-y-2 mb-6 text-left">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handlePlanChange(plan.id)}
                      disabled={loading}
                      className="w-full"
                      variant={plan.popular ? "primary" : "outline"}
                    >
                      {plan.price === 0 ? "Downgrade" : "Upgrade"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Payment Method */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Payment Method
        </h3>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
              <p className="text-sm text-gray-500">Expires 12/25</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              Edit
            </Button>
            <Button variant="outline" size="sm">
              Remove
            </Button>
          </div>
        </div>

        <Button variant="outline">
          <CreditCard className="w-4 h-4 mr-2" />
          Add Payment Method
        </Button>
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
              {billingHistory.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 text-gray-900">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-gray-900">{item.plan}</td>
                  <td className="py-3 px-4 text-gray-900">₹{item.amount}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{item.invoice}</td>
                  <td className="py-3 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadInvoice(item.invoice)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
}
