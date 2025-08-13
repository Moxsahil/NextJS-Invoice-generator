"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Save, Hash, Calendar, Percent, Eye } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { toast } from "sonner";

export default function InvoiceSettings() {
  const [loading, setLoading] = useState(false);
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
    sgstRate: 9,
    cgstRate: 9,
    igstRate: 18,

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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/settings/invoice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Invoice settings updated successfully!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update invoice settings");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Invoice Settings</h2>
        <p className="mt-1 text-gray-600">
          Configure default settings for your invoices
        </p>
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
                    onChange={(e) =>
                      setFormData({ ...formData, prefix: e.target.value })
                    }
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numberingStart: parseInt(e.target.value),
                    })
                  }
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      resetNumbering: e.target.value,
                    })
                  }
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultCurrency: e.target.value,
                    })
                  }
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultDueDays: parseInt(e.target.value),
                      })
                    }
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultTaxRate: parseFloat(e.target.value),
                      })
                    }
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sgstRate: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="9"
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cgstRate: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="9"
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      igstRate: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="18"
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
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [feature.key]: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
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
                  onChange={(e) =>
                    setFormData({ ...formData, defaultTerms: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, defaultNotes: e.target.value })
                  }
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
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
