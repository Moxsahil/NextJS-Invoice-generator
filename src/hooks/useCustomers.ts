import { Customer } from "@/types/customer";
import { useEffect, useState } from "react";

export const useCustomer = () => {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("Failed to fetch customers");

      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load customers"
      );
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (
    customerData: Omit<Customer, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create customer");
      }

      const newCustomer = await response.json();
      setCustomers((prev) => [
        ...prev,
        { ...newCustomer, totalInvoices: 0, totalAmount: 0, lastInvoice: null },
      ]);

      return newCustomer;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  };

  const updateCustomer = async (
    customerId: string,
    customerData: Partial<Customer>
  ) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "PUT",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update customer");
      }

      const updatedCustomer = await response.json();
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === customerId
            ? {
                ...updatedCustomer,
                totalInvoices: customer.totalInvoices,
                totalAmount: customer.totalAmount,
                lastInvoice: customer.lastInvoice,
              }
            : customer
        )
      );

      return updatedCustomer;
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  };

  const deleteCustomer = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete customer");
      }
      setCustomers((prev) =>
        prev.filter((customer) => customer.id !== customerId)
      );
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  };

  const getCustomerById = (customerId: string): Customer | undefined => {
    return customers.find((customer) => customer.id === customerId);
  };

  const getCustomersByStatus = (status: "Active" | "Inactive"): Customer[] => {
    return customers.filter((customer) => customer.status === status);
  };

  const searchCustomers = (searchTerm: string): Customer[] => {
    const term = searchTerm.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        (customer.phone && customer.phone.includes(term))
    );
  };

  const refreshCustomers = () => {
    fetchCustomers();
  };
  return {
    customers,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    getCustomersByStatus,
    searchCustomers,
    refreshCustomers,
  };
};
