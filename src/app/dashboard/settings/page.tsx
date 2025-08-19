"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Building,
  FileText,
  Bell,
  Palette,
  Shield,
  CreditCard,
  Mail,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SettingsLayout from "@/components/settings/SettingsLayout";
import ProfileSettings from "@/components/settings/ProfileSettings";
import CompanySettings from "@/components/settings/CompanySettings";
import InvoiceSettings from "@/components/settings/InvoiceSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import ThemeSettings from "@/components/settings/ThemeSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import BillingSettings from "@/components/settings/BillingSettings";

const settingsTabs = [
  {
    id: "profile",
    label: "Profile",
    icon: User,
    description: "Manage your personal information",
  },
  {
    id: "company",
    label: "Company",
    icon: Building,
    description: "Company details and branding",
  },
  {
    id: "invoice",
    label: "Invoice",
    icon: FileText,
    description: "Invoice defaults and templates",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Email and app notifications",
  },
  // {
  //   id: "theme",
  //   label: "Appearance",
  //   icon: Palette,
  //   description: "Theme and display preferences",
  // },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    description: "Password and security settings",
  },
  {
    id: "billing",
    label: "Billing",
    icon: CreditCard,
    description: "Subscription and billing",
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { user } = useAuth();

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSettings />;
      case "company":
        return <CompanySettings />;
      case "invoice":
        return <InvoiceSettings />;
      case "notifications":
        return <NotificationSettings />;
      case "theme":
        return <ThemeSettings />;
      case "security":
        return <SecuritySettings />;
      case "billing":
        return <BillingSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="p-6 text-black dark:text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </motion.div>

        <SettingsLayout
          tabs={settingsTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {renderTabContent()}
        </SettingsLayout>
      </div>
    </div>
  );
}
