"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Mail,
  Save,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { toast } from "sonner";

export default function NotificationSettings() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Email Notifications
    invoiceCreated: true,
    invoiceSent: true,
    invoicePaid: true,
    invoiceOverdue: true,
    paymentReceived: true,
    paymentFailed: false,

    // Customer Activity
    newCustomer: true,
    customerUpdated: false,

    // Reports
    dailyReport: false,
    weeklyReport: true,
    monthlyReport: true,

    // System Notifications
    systemUpdates: true,
    securityAlerts: true,
    maintenanceNotices: true,

    // Push Notifications (Browser)
    browserNotifications: true,
    desktopAlerts: false,

    // Notification Timing
    businessHoursOnly: false,
    timezone: "Asia/Kolkata",
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00",
    },

    // Email Settings
    digestFrequency: "daily", // immediate, daily, weekly
    emailFormat: "html", // html, text
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Notification settings updated successfully!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update notification settings");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const notificationCategories = [
    {
      title: "Invoice Notifications",
      icon: Bell,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      notifications: [
        {
          key: "invoiceCreated",
          label: "Invoice Created",
          description: "When a new invoice is created",
          icon: CheckCircle,
        },
        {
          key: "invoiceSent",
          label: "Invoice Sent",
          description: "When an invoice is sent to a customer",
          icon: Mail,
        },
        {
          key: "invoicePaid",
          label: "Invoice Paid",
          description: "When an invoice payment is received",
          icon: CheckCircle,
        },
        {
          key: "invoiceOverdue",
          label: "Invoice Overdue",
          description: "When an invoice becomes overdue",
          icon: AlertTriangle,
        },
      ],
    },
    {
      title: "Payment Notifications",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      notifications: [
        {
          key: "paymentReceived",
          label: "Payment Received",
          description: "When a payment is successfully received",
          icon: CheckCircle,
        },
        {
          key: "paymentFailed",
          label: "Payment Failed",
          description: "When a payment attempt fails",
          icon: AlertTriangle,
        },
      ],
    },
    {
      title: "Customer Activity",
      icon: Bell,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      notifications: [
        {
          key: "newCustomer",
          label: "New Customer",
          description: "When a new customer is added",
          icon: CheckCircle,
        },
        {
          key: "customerUpdated",
          label: "Customer Updated",
          description: "When customer information is modified",
          icon: Bell,
        },
      ],
    },
    {
      title: "Reports & Analytics",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      notifications: [
        {
          key: "dailyReport",
          label: "Daily Report",
          description: "Daily business summary",
          icon: Mail,
        },
        {
          key: "weeklyReport",
          label: "Weekly Report",
          description: "Weekly business analytics",
          icon: Mail,
        },
        {
          key: "monthlyReport",
          label: "Monthly Report",
          description: "Monthly business insights",
          icon: Mail,
        },
      ],
    },
    {
      title: "System Notifications",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      notifications: [
        {
          key: "systemUpdates",
          label: "System Updates",
          description: "Important system updates and features",
          icon: Bell,
        },
        {
          key: "securityAlerts",
          label: "Security Alerts",
          description: "Security-related notifications",
          icon: AlertTriangle,
        },
        {
          key: "maintenanceNotices",
          label: "Maintenance Notices",
          description: "Scheduled maintenance notifications",
          icon: Clock,
        },
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Notification Settings
        </h2>
        <p className="mt-1 text-gray-600">
          Manage your email and push notification preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Notification Categories */}
        {notificationCategories.map((category) => {
          const CategoryIcon = category.icon;

          return (
            <Card key={category.title} className="p-6">
              <div className="flex items-center mb-6">
                <div className={`${category.bgColor} p-2 rounded-lg mr-3`}>
                  <CategoryIcon className={`w-5 h-5 ${category.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {category.title}
                </h3>
              </div>

              <div className="space-y-4">
                {category.notifications.map((notification) => {
                  const NotificationIcon = notification.icon;

                  return (
                    <div
                      key={notification.key}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start space-x-3">
                        <NotificationIcon className="w-4 h-4 text-gray-400 mt-1" />
                        <div>
                          <label className="text-sm font-medium text-gray-900">
                            {notification.label}
                          </label>
                          <p className="text-sm text-gray-500">
                            {notification.description}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            formData[
                              notification.key as keyof typeof formData
                            ] as boolean
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [notification.key]: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}

        {/* Notification Preferences */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Notification Preferences
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Digest Frequency
              </label>
              <select
                value={formData.digestFrequency}
                onChange={(e) =>
                  setFormData({ ...formData, digestFrequency: e.target.value })
                }
                className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="immediate">Immediate</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Digest</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Format
              </label>
              <select
                value={formData.emailFormat}
                onChange={(e) =>
                  setFormData({ ...formData, emailFormat: e.target.value })
                }
                className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="html">HTML (Rich formatting)</option>
                <option value="text">Plain Text</option>
              </select>
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="text-sm font-medium text-gray-900">
                  Quiet Hours
                </label>
                <p className="text-sm text-gray-500">
                  Disable notifications during specific hours
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.quietHours.enabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      quietHours: {
                        ...formData.quietHours,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {formData.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4 pl-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From
                  </label>
                  <input
                    type="time"
                    value={formData.quietHours.start}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quietHours: {
                          ...formData.quietHours,
                          start: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To
                  </label>
                  <input
                    type="time"
                    value={formData.quietHours.end}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quietHours: {
                          ...formData.quietHours,
                          end: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <Card className="p-6">
          <div className="flex justify-end space-x-3">
            <Button variant="outline" type="button">
              Reset to Defaults
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Card>
      </form>
    </motion.div>
  );
}
