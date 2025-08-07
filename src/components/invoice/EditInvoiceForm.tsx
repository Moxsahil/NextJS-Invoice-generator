"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Save, Calculator, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  companyName: string;
  companyGSTIN?: string;
  companyAddress: string;
  companyPhone?: string;
  customerName: string;
  customerGSTIN?: string;
  customerAddress: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  sgstAmount: number;
  cgstAmount: number;
  totalAmount: number;
  status: string;
  items: InvoiceItem[];
}

interface EditInvoiceFormProps {
  invoice: Invoice;
  onSave: (invoice: any) => void;
  onCancel: () => void;
  saving?: boolean;
}

export default function EditInvoiceForm({
  invoice,
  onSave,
  onCancel,
  saving = false,
}: EditInvoiceFormProps) {
  const [formData, setFormData] = useState({
    invoiceNumber: invoice.invoiceNumber || "",
    companyName: invoice.companyName || "",
    companyGSTIN: invoice.companyGSTIN || "",
    companyAddress: invoice.companyAddress || "",
    companyPhone: invoice.companyPhone || "",
    customerName: invoice.customerName || "",
    customerGSTIN: invoice.customerGSTIN || "",
    customerAddress: invoice.customerAddress || "",
    invoiceDate: new Date(invoice.invoiceDate).toISOString().split("T")[0],
    dueDate: new Date(invoice.dueDate).toISOString().split("T")[0],
    status: invoice.status || "DRAFT",
    items: invoice.items || [
      { description: "", quantity: 1, rate: 0, amount: 0 },
    ],
  });

  const [totals, setTotals] = useState({
    subtotal: 0,
    sgstAmount: 0,
    cgstAmount: 0,
    totalAmount: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    calculateTotals();
    checkForChanges();
  }, [formData, invoice]);

  const calculateTotals = () => {
    const subtotal = formData.items.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0
    );
    const sgstAmount = subtotal * 0.025; // 2.5% SGST
    const cgstAmount = subtotal * 0.025; // 2.5% CGST
    const totalAmount = subtotal + sgstAmount + cgstAmount;

    setTotals({
      subtotal,
      sgstAmount,
      cgstAmount,
      totalAmount,
    });
  };

  const checkForChanges = () => {
    // Simple change detection
    const originalData = {
      invoiceNumber: invoice.invoiceNumber,
      companyName: invoice.companyName,
      customerName: invoice.customerName,
      status: invoice.status,
      items: invoice.items,
    };

    const currentData = {
      invoiceNumber: formData.invoiceNumber,
      companyName: formData.companyName,
      customerName: formData.customerName,
      status: formData.status,
      items: formData.items,
    };

    setHasChanges(JSON.stringify(originalData) !== JSON.stringify(currentData));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = "Invoice number is required";
    }
    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }
    if (!formData.customerName.trim()) {
      newErrors.customerName = "Customer name is required";
    }
    if (!formData.companyAddress.trim()) {
      newErrors.companyAddress = "Company address is required";
    }
    if (!formData.customerAddress.trim()) {
      newErrors.customerAddress = "Customer address is required";
    }

    // Validate items
    formData.items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item_${index}_description`] = "Description is required";
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = "Quantity must be greater than 0";
      }
      if (item.rate <= 0) {
        newErrors[`item_${index}_rate`] = "Rate must be greater than 0";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { description: "", quantity: 1, rate: 0, amount: 0 },
      ],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      });
    }
  };

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const updatedItems = formData.items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value };
        // Recalculate amount when quantity or rate changes
        if (field === "quantity" || field === "rate") {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    });
    setFormData({ ...formData, items: updatedItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Please fix the errors in the form before saving.");
      return;
    }

    const invoiceData = {
      ...formData,
      subtotal: totals.subtotal,
      sgstAmount: totals.sgstAmount,
      cgstAmount: totals.cgstAmount,
      totalAmount: totals.totalAmount,
    };

    await onSave(invoiceData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Changes Indicator */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-blue-600 mr-3" />
            <div>
              <h4 className="text-blue-800 font-medium">Unsaved Changes</h4>
              <p className="text-blue-700 text-sm">
                You have unsaved changes. Make sure to save before leaving this
                page.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Status and Invoice Number */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Invoice Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              label="Invoice Number"
              required
              value={formData.invoiceNumber}
              onChange={(e) =>
                setFormData({ ...formData, invoiceNumber: e.target.value })
              }
              error={errors.invoiceNumber}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Status
              </label>
              <div
                className={`px-3 py-2 rounded-lg text-sm font-medium text-center ${
                  formData.status === "PAID"
                    ? "bg-green-100 text-green-800"
                    : formData.status === "SENT"
                    ? "bg-blue-100 text-blue-800"
                    : formData.status === "OVERDUE"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {formData.status}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Company Information */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Company Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Company Name"
            required
            value={formData.companyName}
            onChange={(e) =>
              setFormData({ ...formData, companyName: e.target.value })
            }
            error={errors.companyName}
          />
          <Input
            label="GSTIN"
            value={formData.companyGSTIN}
            onChange={(e) =>
              setFormData({ ...formData, companyGSTIN: e.target.value })
            }
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <textarea
              required
              rows={3}
              className={`block w-full rounded-lg border px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.companyAddress ? "border-red-500" : "border-gray-300"
              }`}
              value={formData.companyAddress}
              onChange={(e) =>
                setFormData({ ...formData, companyAddress: e.target.value })
              }
            />
            {errors.companyAddress && (
              <p className="mt-1 text-sm text-red-600">
                {errors.companyAddress}
              </p>
            )}
          </div>
          <Input
            label="Phone Number"
            type="tel"
            value={formData.companyPhone}
            onChange={(e) =>
              setFormData({ ...formData, companyPhone: e.target.value })
            }
          />
        </div>
      </Card>

      {/* Customer Information */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Customer Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Customer Name"
            required
            value={formData.customerName}
            onChange={(e) =>
              setFormData({ ...formData, customerName: e.target.value })
            }
            error={errors.customerName}
          />
          <Input
            label="Customer GSTIN"
            value={formData.customerGSTIN}
            onChange={(e) =>
              setFormData({ ...formData, customerGSTIN: e.target.value })
            }
          />
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Address *
            </label>
            <textarea
              required
              rows={3}
              className={`block w-full rounded-lg border px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.customerAddress ? "border-red-500" : "border-gray-300"
              }`}
              value={formData.customerAddress}
              onChange={(e) =>
                setFormData({ ...formData, customerAddress: e.target.value })
              }
            />
            {errors.customerAddress && (
              <p className="mt-1 text-sm text-red-600">
                {errors.customerAddress}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Dates */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Invoice Dates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Invoice Date"
            type="date"
            required
            value={formData.invoiceDate}
            onChange={(e) =>
              setFormData({ ...formData, invoiceDate: e.target.value })
            }
          />
          <Input
            label="Due Date"
            type="date"
            required
            value={formData.dueDate}
            onChange={(e) =>
              setFormData({ ...formData, dueDate: e.target.value })
            }
          />
        </div>
      </Card>

      {/* Items */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Invoice Items</h3>
          <Button
            type="button"
            onClick={addItem}
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Item
          </Button>
        </div>

        <div className="space-y-4">
          {formData.items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <div className="md:col-span-2">
                <Input
                  label="Description"
                  required
                  value={item.description}
                  onChange={(e) =>
                    updateItem(index, "description", e.target.value)
                  }
                  error={errors[`item_${index}_description`]}
                />
              </div>
              <Input
                label="Quantity"
                type="number"
                min="1"
                step="1"
                required
                value={item.quantity}
                onChange={(e) =>
                  updateItem(index, "quantity", parseInt(e.target.value) || 1)
                }
                error={errors[`item_${index}_quantity`]}
              />
              <Input
                label="Rate (₹)"
                type="number"
                min="0"
                step="0.01"
                required
                value={item.rate}
                onChange={(e) =>
                  updateItem(index, "rate", parseFloat(e.target.value) || 0)
                }
                error={errors[`item_${index}_rate`]}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900 font-medium">
                  ₹
                  {item.amount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="flex items-end">
                {formData.items.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeItem(index)}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Totals Display */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Invoice Summary
          </h3>
          <div className="flex items-center text-sm text-gray-500">
            <Calculator className="w-4 h-4 mr-1" />
            Auto-calculated
          </div>
        </div>
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">
                ₹
                {totals.subtotal.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">SGST (2.5%):</span>
              <span className="font-semibold">
                ₹
                {totals.sgstAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">CGST (2.5%):</span>
              <span className="font-semibold">
                ₹
                {totals.cgstAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="border-t-2 border-blue-600 pt-3 flex justify-between items-center">
              <span className="text-xl font-bold text-gray-900">
                Total Amount:
              </span>
              <span className="text-xl font-bold text-blue-600">
                ₹
                {totals.totalAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel Changes
        </Button>
        <Button
          type="submit"
          loading={saving}
          size="lg"
          leftIcon={<Save className="w-5 h-5" />}
          disabled={!hasChanges}
        >
          {saving ? "Saving Changes..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
