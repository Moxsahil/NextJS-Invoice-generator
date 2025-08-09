import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics | InvoiceGen",
  description: "Manage your analytics and reports.",
};

export default function AnalyticsLayout({
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
