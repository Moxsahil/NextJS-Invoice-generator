"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface SettingsTab {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

interface SettingsLayoutProps {
  tabs: SettingsTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: ReactNode;
}

export default function SettingsLayout({
  tabs,
  activeTab,
  onTabChange,
  children,
}: SettingsLayoutProps) {
  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
      {/* Sidebar Navigation */}
      <aside className="py-6 px-2 sm:px-6 lg:col-span-3 lg:py-0 lg:px-0">
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  w-full group rounded-lg px-3 py-3 flex items-start text-left transition-all duration-200
                  ${
                    isActive
                      ? "bg-blue-50 border-l-4 border-blue-500 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <Icon
                  className={`
                    flex-shrink-0 w-5 h-5 mt-0.5 mr-3 transition-colors
                    ${isActive ? "text-blue-500" : "text-gray-400 group-hover:text-gray-500"}
                  `}
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${isActive ? "text-blue-900" : ""}`}>
                    {tab.label}
                  </p>
                  <p className={`text-xs mt-1 ${isActive ? "text-blue-600" : "text-gray-500"}`}>
                    {tab.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="lg:col-span-9">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}