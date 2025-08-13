"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Palette, Save, Monitor, Sun, Moon } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { toast } from "sonner";

export default function ThemeSettings() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    theme: "light", // light, dark, system
    colorScheme: "blue",
    fontSize: "medium",
    language: "en",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    currency: "INR",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/settings/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Theme settings updated successfully!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update theme settings");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const themes = [
    {
      id: "light",
      name: "Light",
      icon: Sun,
      description: "Light mode",
    },
    {
      id: "dark",
      name: "Dark",
      icon: Moon,
      description: "Dark mode",
    },
    {
      id: "system",
      name: "System",
      icon: Monitor,
      description: "Follow system preference",
    },
  ];

  const colorSchemes = [
    { id: "blue", name: "Blue", color: "bg-blue-500" },
    { id: "green", name: "Green", color: "bg-green-500" },
    { id: "purple", name: "Purple", color: "bg-purple-500" },
    { id: "pink", name: "Pink", color: "bg-pink-500" },
    { id: "orange", name: "Orange", color: "bg-orange-500" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Theme & Appearance</h2>
        <p className="mt-1 text-gray-600">
          Customize the look and feel of your application
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Theme Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {themes.map((theme) => {
                const Icon = theme.icon;
                return (
                  <label
                    key={theme.id}
                    className={`
                      relative cursor-pointer rounded-lg border p-4 focus:outline-none
                      ${
                        formData.theme === theme.id
                          ? "border-blue-500 ring-2 ring-blue-500"
                          : "border-gray-300 hover:border-gray-400"
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={theme.id}
                      checked={formData.theme === theme.id}
                      onChange={(e) =>
                        setFormData({ ...formData, theme: e.target.value })
                      }
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {theme.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {theme.description}
                        </p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Color Scheme */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Color Scheme
            </h3>
            <div className="flex space-x-4">
              {colorSchemes.map((scheme) => (
                <label key={scheme.id} className="cursor-pointer">
                  <input
                    type="radio"
                    name="colorScheme"
                    value={scheme.id}
                    checked={formData.colorScheme === scheme.id}
                    onChange={(e) =>
                      setFormData({ ...formData, colorScheme: e.target.value })
                    }
                    className="sr-only"
                  />
                  <div
                    className={`
                      w-12 h-12 rounded-lg ${scheme.color} ring-2 ring-offset-2
                      ${
                        formData.colorScheme === scheme.id
                          ? "ring-gray-900"
                          : "ring-transparent hover:ring-gray-300"
                      }
                    `}
                    title={scheme.name}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Display Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Display Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size
                </label>
                <select
                  value={formData.fontSize}
                  onChange={(e) =>
                    setFormData({ ...formData, fontSize: e.target.value })
                  }
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({ ...formData, language: e.target.value })
                  }
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>
          </div>

          {/* Format Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Format Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Format
                </label>
                <select
                  value={formData.dateFormat}
                  onChange={(e) =>
                    setFormData({ ...formData, dateFormat: e.target.value })
                  }
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Format
                </label>
                <select
                  value={formData.timeFormat}
                  onChange={(e) =>
                    setFormData({ ...formData, timeFormat: e.target.value })
                  }
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="12h">12 Hour</option>
                  <option value="24h">24 Hour</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button variant="outline" type="button">
              Reset to Default
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
