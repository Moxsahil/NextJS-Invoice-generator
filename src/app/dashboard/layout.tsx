"use client";

import Header from "@/components/layout/Header";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebaropen, setSidebaropen] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={() => setSidebaropen(!sidebaropen)} />
      <div className="flex">
        <main className="flex-1 p-6 lg:ml-64">{children}</main>
      </div>
    </div>
  );
}
