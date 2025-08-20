"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, CreditCard, Wallet, Shield, Smartphone } from "lucide-react";
import Button from "@/components/ui/Button";
import { toast } from "sonner";

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPaymentMethodModal({
  isOpen,
  onClose,
  onSuccess,
}: AddPaymentMethodModalProps) {
  const [selectedType, setSelectedType] = useState<string>("UPI");
  const [formData, setFormData] = useState({
    name: "",
    upiId: "",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    holderName: "",
    bankName: "",
    accountNumber: "",
    walletId: "",
    walletProvider: "PhonePe",
    isDefault: false,
  });
  const [loading, setLoading] = useState(false);

  const paymentTypes = [
    { id: "UPI", name: "UPI", icon: Smartphone, description: "Pay using UPI ID" },
    { id: "CREDIT_CARD", name: "Credit Card", icon: CreditCard, description: "Visa, MasterCard, etc." },
    { id: "DEBIT_CARD", name: "Debit Card", icon: CreditCard, description: "Bank debit card" },
    { id: "NET_BANKING", name: "Net Banking", icon: Shield, description: "Direct bank transfer" },
    { id: "WALLET", name: "Digital Wallet", icon: Wallet, description: "PhonePe, Paytm, etc." },
  ];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let details: any = {};
      
      switch (selectedType) {
        case "UPI":
          if (!formData.upiId) {
            toast.error("Please enter UPI ID");
            return;
          }
          details = { upiId: formData.upiId };
          break;
          
        case "CREDIT_CARD":
        case "DEBIT_CARD":
          if (!formData.cardNumber || !formData.expiryMonth || !formData.expiryYear || !formData.holderName) {
            toast.error("Please fill all card details");
            return;
          }
          details = {
            cardNumber: formData.cardNumber,
            expiryMonth: formData.expiryMonth,
            expiryYear: formData.expiryYear,
            holderName: formData.holderName,
          };
          break;
          
        case "NET_BANKING":
          if (!formData.bankName || !formData.accountNumber) {
            toast.error("Please fill bank details");
            return;
          }
          details = {
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
          };
          break;
          
        case "WALLET":
          if (!formData.walletId) {
            toast.error("Please enter wallet ID");
            return;
          }
          details = {
            walletId: formData.walletId,
            walletProvider: formData.walletProvider,
          };
          break;
      }

      const response = await fetch("/api/billing/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: selectedType,
          name: formData.name || `${selectedType} Payment`,
          details,
          isDefault: formData.isDefault,
        }),
      });

      if (response.ok) {
        toast.success("Payment method added successfully!");
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add payment method");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (selectedType) {
      case "UPI":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UPI ID *
              </label>
              <input
                type="text"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                placeholder="yourname@paytm"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case "CREDIT_CARD":
      case "DEBIT_CARD":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Number *
              </label>
              <input
                type="text"
                value={formData.cardNumber}
                onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                placeholder="1234 5678 9012 3456"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Month *
                </label>
                <select
                  value={formData.expiryMonth}
                  onChange={(e) => setFormData({ ...formData, expiryMonth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Month</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                      {String(i + 1).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Year *
                </label>
                <select
                  value={formData.expiryYear}
                  onChange={(e) => setFormData({ ...formData, expiryYear: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Year</option>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cardholder Name *
              </label>
              <input
                type="text"
                value={formData.holderName}
                onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case "NET_BANKING":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name *
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="State Bank of India"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number *
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      case "WALLET":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Provider *
              </label>
              <select
                value={formData.walletProvider}
                onChange={(e) => setFormData({ ...formData, walletProvider: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="PhonePe">PhonePe</option>
                <option value="Paytm">Paytm</option>
                <option value="GooglePay">Google Pay</option>
                <option value="AmazonPay">Amazon Pay</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet ID *
              </label>
              <input
                type="text"
                value={formData.walletId}
                onChange={(e) => setFormData({ ...formData, walletId: e.target.value })}
                placeholder="9876543210"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Add Payment Method
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Payment Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Type
            </label>
            <div className="grid grid-cols-1 gap-2">
              {paymentTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`flex items-center p-3 rounded-lg border transition-colors ${
                      selectedType === type.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3 text-gray-600" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{type.name}</div>
                      <div className="text-sm text-gray-500">{type.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Form */}
          <div className="mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={`My ${selectedType} Payment`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {renderForm()}
            
            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Set as default payment method
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Adding..." : "Add Payment Method"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}