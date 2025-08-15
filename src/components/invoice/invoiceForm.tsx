"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export default function InvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedCustomerId = searchParams.get("customerId");

  // Form state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [taxRates, setTaxRates] = useState({
    sgstRate: 2.5, // Default fallback
    cgstRate: 2.5, // Default fallback
  });
  const [formData, setFormData] = useState({
    invoiceNumber: "INV-0001", // Temporary, will be loaded from settings
    companyName: "",
    companyGSTIN: "",
    companyAddress: "",
    companyPhone: "",
    customerId: preSelectedCustomerId || "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, rate: 0, amount: 0 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  // Load customers, company data, and invoice settings on component mount
  useEffect(() => {
    fetchCustomers();
    loadCompanyData();
    loadInvoiceSettings();
  }, []);

  // Listen for invoice settings updates
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      if (event.detail && event.detail.sgstRate !== undefined && event.detail.cgstRate !== undefined) {
        setTaxRates({
          sgstRate: event.detail.sgstRate || 2.5,
          cgstRate: event.detail.cgstRate || 2.5,
        });
      }
    };

    window.addEventListener('invoiceSettingsUpdated', handleSettingsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('invoiceSettingsUpdated', handleSettingsUpdate as EventListener);
    };
  }, []);

  const loadCompanyData = async () => {
    try {
      const response = await fetch("/api/user/company", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        const companyData = result.data;
        
        // Auto-populate company fields
        setFormData(prev => ({
          ...prev,
          companyName: companyData.companyName || "",
          companyGSTIN: companyData.gstin || "",
          companyAddress: companyData.address || "",
          companyPhone: companyData.phone || "",
        }));
      } else {
        console.error("Failed to load company data");
      }
    } catch (error) {
      console.error("Error loading company data:", error);
      // Don't show toast error for company data as it's not critical
    }
  };

  const loadInvoiceSettings = async () => {
    try {
      const response = await fetch("/api/settings/invoice", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        const settings = result.data;
        
        // Check if user has customized invoice settings (not using defaults)
        const hasCustomSettings = settings.prefix !== "INV" || settings.numberingStart !== 1;
        
        let invoiceNumber;
        if (hasCustomSettings) {
          // Use custom settings format
          invoiceNumber = `${settings.prefix}-${String(settings.numberingStart).padStart(4, '0')}${settings.suffix || ''}`;
        } else {
          // Use default Date.now() format
          invoiceNumber = `INV-${Date.now()}`;
        }
        
        // Update due date based on default due days
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + settings.defaultDueDays);
        
        // Update tax rates from settings with fallback to defaults
        setTaxRates({
          sgstRate: settings.sgstRate || 2.5,
          cgstRate: settings.cgstRate || 2.5,
        });
        
        setFormData(prev => ({
          ...prev,
          invoiceNumber: invoiceNumber,
          dueDate: dueDate.toISOString().split('T')[0],
        }));
      } else {
        console.error("Failed to load invoice settings");
        // Fallback to Date.now() if settings fail to load
        setFormData(prev => ({
          ...prev,
          invoiceNumber: `INV-${Date.now()}`,
        }));
      }
    } catch (error) {
      console.error("Error loading invoice settings:", error);
      // Fallback to Date.now() if there's an error
      setFormData(prev => ({
        ...prev,
        invoiceNumber: `INV-${Date.now()}`,
      }));
    }
  };

  // Pre-select customer if customerId is in URL
  useEffect(() => {
    if (preSelectedCustomerId && customers.length > 0) {
      const customer = customers.find((c) => c.id === preSelectedCustomerId);
      if (customer) {
        setSelectedCustomer(customer);
        setFormData((prev) => ({ ...prev, customerId: customer.id }));
      }
    }
  }, [preSelectedCustomerId, customers]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const customersData = await response.json();
        setCustomers(customersData);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Failed to load customers. Please refresh the page.");
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    setSelectedCustomer(customer || null);
    setFormData((prev) => ({ ...prev, customerId }));
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Recalculate amount for this item
    if (field === "quantity" || field === "rate") {
      updatedItems[index].amount =
        updatedItems[index].quantity * updatedItems[index].rate;
    }

    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const sgstAmount = subtotal * (taxRates.sgstRate / 100);
    const cgstAmount = subtotal * (taxRates.cgstRate / 100);
    const totalAmount = subtotal + sgstAmount + cgstAmount;

    return { subtotal, sgstAmount, cgstAmount, totalAmount };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerId) {
      const errorMessage = "Please select a customer";
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    if (!selectedCustomer) {
      const errorMessage = "Selected customer not found";
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    if (
      items.some(
        (item) => !item.description || item.quantity <= 0 || item.rate <= 0
      )
    ) {
      const errorMessage = "Please fill in all item details with valid values";
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    setLoading(true);
    setError("");
    setSubmissionStatus("idle");

    try {
      const invoiceData = {
        ...formData,
        items: items.map(({ description, quantity, rate }) => ({
          description,
          quantity,
          rate,
        })),
      };

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmissionStatus("success");

        // Show success toast notification
        toast.success("Invoice created successfully! Customer data will be updated automatically.");
        
        // Show reminder notification if enabled
        if (data.remindersScheduled) {
          setTimeout(() => {
            toast.info("Payment reminders have been scheduled automatically.");
          }, 1000);
        }

        // **IMPORTANT**: Trigger customer data refresh
        if (data.customerUpdated && window.dispatchEvent) {
          // Dispatch custom event to notify customer components to refresh
          const customEvent = new CustomEvent("customerDataUpdated", {
            detail: {
              customerId: data.customerId,
              timestamp: data.timestamp,
            },
          });
          window.dispatchEvent(customEvent);
        }

        // Navigate to invoice detail page after a short delay
        setTimeout(() => {
          router.push(`/dashboard/invoices/${data.invoice.id}`);
        }, 1500);
      } else {
        setSubmissionStatus("error");
        const errorMessage = data.error || "Failed to create invoice";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      setSubmissionStatus("error");
      const errorMessage = "Network error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, sgstAmount, cgstAmount, totalAmount } = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl text-black shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Create Invoice
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Fill in the details below to create a new invoice
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm sm:text-base">
              {error}
            </div>
          )}


          {/* Invoice Details */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              Invoice Details
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      invoiceNumber: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      invoiceDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
              Company Details
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      companyName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company GSTIN
                </label>
                <input
                  type="text"
                  value={formData.companyGSTIN}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      companyGSTIN: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Address *
                </label>
                <textarea
                  value={formData.companyAddress}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      companyAddress: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Phone
                </label>
                <input
                  type="text"
                  value={formData.companyPhone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      companyPhone: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Customer Details
              </h2>
              <button
                type="button"
                onClick={() => router.push("/dashboard/customers")}
                className="text-sm text-blue-600 hover:text-blue-700 underline self-start sm:self-auto"
              >
                Manage Customers
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Customer *
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose a customer...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Details Preview */}
            {selectedCustomer && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Customer Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="space-y-1">
                    <p>
                      <strong>Name:</strong> {selectedCustomer.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedCustomer.email}
                    </p>
                    {selectedCustomer.phone && (
                      <p>
                        <strong>Phone:</strong> {selectedCustomer.phone}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    {selectedCustomer.gstin && (
                      <p>
                        <strong>GSTIN:</strong> {selectedCustomer.gstin}
                      </p>
                    )}
                    {selectedCustomer.address && (
                      <p>
                        <strong>Address:</strong>{" "}
                        {[
                          selectedCustomer.address,
                          selectedCustomer.city,
                          selectedCustomer.state,
                          selectedCustomer.zipCode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Due Date */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date *
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
              }
              className="w-full sm:w-auto px-3 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Items */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Invoice Items
              </h2>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium w-full sm:w-auto"
              >
                + Add Item
              </button>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="bg-white p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Item {index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, "description", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                        placeholder="Item description"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                          min="0.01"
                          step="0.01"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Rate (₹)
                        </label>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "rate",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                          min="0.01"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 p-2 rounded text-center">
                      <span className="text-sm font-medium text-gray-700">
                        Amount: ₹{item.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 text-sm font-medium text-gray-700 min-w-[200px]">
                      Description
                    </th>
                    <th className="text-left py-3 px-3 text-sm font-medium text-gray-700 min-w-[80px]">
                      Qty
                    </th>
                    <th className="text-left py-3 px-3 text-sm font-medium text-gray-700 min-w-[100px]">
                      Rate (₹)
                    </th>
                    <th className="text-left py-3 px-3 text-sm font-medium text-gray-700 min-w-[120px]">
                      Amount
                    </th>
                    <th className="text-left py-3 px-3 text-sm font-medium text-gray-700 min-w-[80px]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                          placeholder="Item description"
                          required
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                          min="0.01"
                          step="0.01"
                          required
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "rate",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                          min="0.01"
                          step="0.01"
                          required
                        />
                      </td>
                      <td className="py-3 px-3 text-sm font-medium text-gray-900">
                        ₹{item.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
            <div className="max-w-sm ml-auto space-y-3">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="font-medium">Subtotal:</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span className="font-medium">SGST ({taxRates.sgstRate}%):</span>
                <span className="font-semibold">₹{sgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span className="font-medium">CGST ({taxRates.cgstRate}%):</span>
                <span className="font-semibold">₹{cgstAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg sm:text-xl border-t border-gray-300 pt-3">
                <span>Total:</span>
                <span className="text-blue-600">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || submissionStatus === "success"}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
            >
              {loading && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              )}
              <span>
                {loading
                  ? "Creating Invoice..."
                  : submissionStatus === "success"
                  ? "Invoice Created!"
                  : "Create Invoice"}
              </span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
