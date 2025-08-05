"use client";

import { motion } from "framer-motion";
import {
  Calculator,
  FileText,
  Globe,
  Shield,
  Smartphone,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Calculator,
    title: "Automatic GST Calculations",
    description:
      "We handle GST calculations for you, so you can focus on your core business.",
    color: "bg-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    icon: FileText,
    title: "Professional Templates",
    description:
      "Beautiful, print-ready invoice templates that look professional every time.",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Create invoices in seconds with our intuitive interface and smart defaults.",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Your data is encrypted and secure. We never share your information.",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    icon: Globe,
    title: "Cloud Sync",
    description:
      "Access your invoices from anywhere with automatic cloud synchronization.",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
  },
  {
    icon: Smartphone,
    title: "Mobile Ready",
    description:
      "Create and manage invoices on the go with our mobile-optimized interface.",
    color: "text-pink-600",
    bgColor: "bg-pink-100",
  },
];
export default function Features() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Everything you need to create
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}
              professional invoices
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-xl max-w-3xl mx-auto text-gray-600"
          >
            Our comprehensive invoice generator includes all the features you
            need to streamline your billing process
          </motion.p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                key={feature.title}
                className="relative group"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 h-full">
                  <div
                    className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
