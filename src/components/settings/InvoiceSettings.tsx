"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FileText, Save, Hash, Calendar, Percent, Eye, CheckCircle, Clock } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { toast } from "sonner";

export default function InvoiceSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formData, setFormData] = useState({
    // Invoice Numbering
    prefix: "INV",
    suffix: "",
    numberingStart: 1,
    resetNumbering: "never", // never, yearly, monthly

    // Default Settings
    defaultCurrency: "INR",
    defaultDueDays: 30,
    defaultTaxRate: 18,

    // GST Settings
    sgstRate: 2.5,
    cgstRate: 2.5,
    igstRate: 5,

    // Invoice Features
    includeQRCode: true,
    showBankDetails: true,
    showCompanyLogo: true,
    showPaymentTerms: true,

    // Email Settings
    autoSendEmail: false,
    emailTemplate: "professional",

    // Payment Reminders
    enableReminders: true,
    reminderDays: [7, 3, 1], // days before due date
    overdueReminders: [1, 7, 15], // days after due date

    // Default Terms and Conditions
    defaultTerms:
      "Payment is due within 30 days of invoice date. Late payments may be subject to a 1.5% monthly service charge.",
    defaultNotes: "Thank you for your business!",

    // Bank Details
    bankName: "",
    accountNumber: "",
    accountName: "",
    ifscCode: "",

    // UPI Details for QR Code Payments
    upiId: "",
    merchantName: "",
  });

  // Load invoice data on component mount
  useEffect(() => {
    const loadInvoiceData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/settings/invoice", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const result = await response.json();
          setFormData(result.data);
        } else {
          console.error("Failed to load invoice data");
        }
      } catch (error) {
        console.error("Error loading invoice data:", error);
        toast.error("Failed to load invoice settings");
      } finally {
        setLoading(false);
      }
    };

    loadInvoiceData();
  }, []);

  // Auto-save function
  const saveData = useCallback(async (showToast = true) => {
    if (!hasUnsavedChanges) return;
    
    setSaving(true);
    try {
      const response = await fetch("/api/settings/invoice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        
        // Dispatch event to notify other components about settings update
        const settingsUpdateEvent = new CustomEvent('invoiceSettingsUpdated', {
          detail: {
            includeQRCode: formData.includeQRCode,
            showBankDetails: formData.showBankDetails,
            showCompanyLogo: formData.showCompanyLogo,
            showPaymentTerms: formData.showPaymentTerms,
            enableReminders: formData.enableReminders,
            sgstRate: formData.sgstRate,
            cgstRate: formData.cgstRate,
            defaultTerms: formData.defaultTerms,
            defaultNotes: formData.defaultNotes,
            bankName: formData.bankName,
            accountNumber: formData.accountNumber,
            accountName: formData.accountName,
            ifscCode: formData.ifscCode,
            upiId: formData.upiId,
            merchantName: formData.merchantName,
            timestamp: new Date().toISOString(),
          }
        });
        window.dispatchEvent(settingsUpdateEvent);
        
        if (showToast) {
          toast.success("Invoice settings saved!");
        }
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save invoice settings");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setSaving(false);
    }
  }, [formData, hasUnsavedChanges]);

  // Auto-save with debounce
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      saveData(false); // Auto-save without toast
    }, 2000); // Save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [formData, hasUnsavedChanges, saveData]);

  // Handle form field changes
  const handleFieldChange = (field: string, value: any) => {
    console.log(`Field ${field} changed to:`, value); // Debug log
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveData(true); // Manual save with toast
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading invoice settings...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoice Settings</h2>
          <p className="mt-1 text-gray-600">
            Configure default settings for your invoices
          </p>
        </div>
        
        {/* Auto-save Status */}
        <div className="flex items-center space-x-2 text-sm">
          {saving ? (
            <>
              <Clock className="w-4 h-4 text-orange-500 animate-spin" />
              <span className="text-orange-600">Saving...</span>
            </>
          ) : hasUnsavedChanges ? (
            <>
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-orange-600">Unsaved changes</span>
            </>
          ) : lastSaved ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-600">
                Saved at {lastSaved.toLocaleTimeString()}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Invoice Numbering */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Invoice Numbering
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prefix
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.prefix}
                    onChange={(e) => handleFieldChange("prefix", e.target.value)}
                    className="pl-10 w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="INV"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Starting Number
                </label>
                <input
                  type="number"
                  value={formData.numberingStart}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    handleFieldChange("numberingStart", val);
                  }}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reset Numbering
                </label>
                <select
                  value={formData.resetNumbering}
                  onChange={(e) => handleFieldChange("resetNumbering", e.target.value)}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="never">Never</option>
                  <option value="yearly">Yearly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Preview:</strong> {formData.prefix}-
                {String(formData.numberingStart).padStart(4, "0")}
                {formData.suffix}
              </p>
            </div>
          </div>

          {/* Default Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Default Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.defaultCurrency}
                  onChange={(e) => handleFieldChange("defaultCurrency", e.target.value)}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Due Days
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    value={formData.defaultDueDays}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 30;
                      handleFieldChange("defaultDueDays", val);
                    }}
                    className="pl-10 w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="30"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Tax Rate (%)
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    value={formData.defaultTaxRate}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      handleFieldChange("defaultTaxRate", val);
                    }}
                    className="pl-10 w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="18"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* GST Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              GST Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SGST Rate (%)
                </label>
                <input
                  type="number"
                  value={formData.sgstRate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleFieldChange("sgstRate", val);
                  }}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2.5"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CGST Rate (%)
                </label>
                <input
                  type="number"
                  value={formData.cgstRate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleFieldChange("cgstRate", val);
                  }}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2.5"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IGST Rate (%)
                </label>
                <input
                  type="number"
                  value={formData.igstRate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    handleFieldChange("igstRate", val);
                  }}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Invoice Features */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Invoice Features
            </h3>
            <div className="space-y-4">
              {[
                {
                  key: "includeQRCode",
                  label: "Include QR Code",
                  description: "Add QR code for easy payment",
                },
                {
                  key: "showBankDetails",
                  label: "Show Bank Details",
                  description: "Display bank account information",
                },
                {
                  key: "showCompanyLogo",
                  label: "Show Company Logo",
                  description: "Include your company logo on invoices",
                },
                {
                  key: "showPaymentTerms",
                  label: "Show Payment Terms",
                  description: "Display payment terms and conditions",
                },
                {
                  key: "enableReminders",
                  label: "Enable Payment Reminders",
                  description: "Send automatic payment reminder emails",
                },
              ].map((feature) => (
                <div
                  key={feature.key}
                  className="flex items-center justify-between"
                >
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      {feature.label}
                    </label>
                    <p className="text-sm text-gray-500">
                      {feature.description}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        formData[
                          feature.key as keyof typeof formData
                        ] as boolean
                      }
                      onChange={(e) => handleFieldChange(feature.key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Bank Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => handleFieldChange("bankName", e.target.value)}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="State Bank of India"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => handleFieldChange("accountNumber", e.target.value)}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1234567890123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => handleFieldChange("accountName", e.target.value)}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your Company Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={(e) => handleFieldChange("ifscCode", e.target.value)}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="SBIN0001234"
                />
              </div>
            </div>
          </div>

          {/* UPI Payment Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              UPI Payment Details (for QR Code)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UPI ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => handleFieldChange("upiId", e.target.value)}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="yourname@paytm / yourname@googlepay"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your UPI ID for QR code payments
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchant Name
                </label>
                <input
                  type="text"
                  value={formData.merchantName}
                  onChange={(e) => handleFieldChange("merchantName", e.target.value)}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your Business Name"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Name that appears in payment apps
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    <strong>QR Code Payments:</strong> When enabled, customers can scan the QR code on invoices to pay directly to your UPI account. Make sure your UPI ID is correct and active.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Default Terms */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Default Terms & Notes
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terms and Conditions
                </label>
                <textarea
                  value={formData.defaultTerms}
                  onChange={(e) => handleFieldChange("defaultTerms", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter default terms and conditions..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Notes
                </label>
                <textarea
                  value={formData.defaultNotes}
                  onChange={(e) => handleFieldChange("defaultNotes", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter default notes..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button variant="outline" type="button">
              <Eye className="w-4 h-4 mr-2" />
              Preview Invoice
            </Button>
            <Button 
              type="submit" 
              disabled={saving || !hasUnsavedChanges}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Now"}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
