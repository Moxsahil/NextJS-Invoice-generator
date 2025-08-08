import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Customers | InvoiceGen",
  description: "Manage your customers and their information.",
};
export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </div>
    </div>
  );
}
