"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Trash2, Save } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
}

interface InvoiceFormData {
  invoiceNumber: string;
  companyName: string;
  companyGSTIN: string;
  companyAddress: string;
  companyPhone: string;
  customerName: string;
  customerGSTIN: string;
  customerAddress: string;
  invoiceDate: string;
  dueDate: string;
  items: InvoiceItem[];
}

export default function InvoiceForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: `INV-${Date.now()}`,
    companyName: "",
    companyGSTIN: "",
    companyAddress: "",
    companyPhone: "",
    customerName: "",
    customerGSTIN: "",
    customerAddress: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    items: [{ description: "", quantity: 1, rate: 0 }],
  });

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, rate: 0 }],
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
    const updatedItems = formData.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setFormData({ ...formData, items: updatedItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0
    );
    const sgstAmount = subtotal * 0.025;
    const cgstAmount = subtotal * 0.025;
    const totalAmount = subtotal + sgstAmount + cgstAmount;

    return { subtotal, sgstAmount, cgstAmount, totalAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/dashboard/invoices/${data.invoice.id}`);
      } else {
        setError(data.error || "Failed to create invoice");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, sgstAmount, cgstAmount, totalAmount } = calculateTotals();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

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
              Address
            </label>
            <textarea
              required
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.companyAddress}
              onChange={(e) =>
                setFormData({ ...formData, companyAddress: e.target.value })
              }
            />
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
              Customer Address
            </label>
            <textarea
              required
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.customerAddress}
              onChange={(e) =>
                setFormData({ ...formData, customerAddress: e.target.value })
              }
            />
          </div>
        </div>
      </Card>

      {/* Invoice Details */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Invoice Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Invoice Number"
            required
            value={formData.invoiceNumber}
            onChange={(e) =>
              setFormData({ ...formData, invoiceNumber: e.target.value })
            }
          />
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
          <Button type="button" onClick={addItem} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="space-y-4">
          {formData.items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <div className="md:col-span-2">
                <Input
                  label="Description"
                  required
                  value={item.description}
                  onChange={(e) =>
                    updateItem(index, "description", e.target.value)
                  }
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
              />
              <div className="flex items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-900 font-medium">
                    ₹{(item.quantity * item.rate).toFixed(2)}
                  </div>
                </div>
                {formData.items.length > 1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Totals */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Invoice Summary
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold text-gray-600">
              ₹{subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">SGST (2.5%):</span>
            <span className="font-semibold text-gray-600">
              ₹{sgstAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">CGST (2.5%):</span>
            <span className="font-semibold text-gray-600">
              ₹{cgstAmount.toFixed(2)}
            </span>
          </div>
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">
              Total Amount:
            </span>
            <span className="text-lg font-bold text-blue-600">
              ₹{totalAmount.toFixed(2)}
            </span>
          </div>
        </div>{" "}
        text-gray-600
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" loading={loading} size="lg">
          <Save className="w-5 h-5 mr-2" />
          Create Invoice
        </Button>
      </div>
    </form>
  );
}
