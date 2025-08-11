// hooks/useCustomers.ts - Enhanced with real-time sync
import { Customer } from "@/types/customer";
import { useEffect, useState, useCallback } from "react";

export const useCustomer = () => {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchCustomers();

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(() => {
      fetchCustomers(true); // Silent refresh
    }, 30000);

    // Listen for page visibility changes to refresh when user returns
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCustomers(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const fetchCustomers = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const response = await fetch("/api/customers", {
        cache: "no-store", // Ensure fresh data
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch customers");

      const data = await response.json();

      // Only update state if data has actually changed
      setCustomers((prevCustomers) => {
        const hasChanged =
          JSON.stringify(prevCustomers) !== JSON.stringify(data);
        if (hasChanged) {
          setLastRefresh(new Date());
          return data;
        }
        return prevCustomers;
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
      if (!silent) {
        setError(
          error instanceof Error ? error.message : "Failed to load customers"
        );
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

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

      // Optimistically update the customers list
      setCustomers((prev) => [
        ...prev,
        { ...newCustomer, totalInvoices: 0, totalAmount: 0, lastInvoice: null },
      ]);

      // Trigger a refresh to get accurate data
      setTimeout(() => fetchCustomers(true), 500);

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

      // Optimistically update the customers list
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

      // Trigger a refresh to get accurate data
      setTimeout(() => fetchCustomers(true), 500);

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

      // Optimistically remove from list
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

  const refreshCustomers = useCallback(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Method to force refresh customer data (called after invoice creation)
  const forceRefresh = useCallback(() => {
    fetchCustomers(false);
  }, [fetchCustomers]);

  // Method to refresh specific customer data
  const refreshCustomer = useCallback(async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (response.ok) {
        const updatedCustomer = await response.json();
        setCustomers((prev) =>
          prev.map((customer) =>
            customer.id === customerId ? updatedCustomer : customer
          )
        );
      }
    } catch (error) {
      console.error("Error refreshing customer:", error);
    }
  }, []);

  return {
    customers,
    loading,
    error,
    lastRefresh,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    getCustomersByStatus,
    searchCustomers,
    refreshCustomers,
    forceRefresh,
    refreshCustomer,
  };
};
