"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from "lucide-react";
import Button from "./Button";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: "confirm" | "alert" | "info" | "warning";
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
}

export default function Dialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "confirm",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
}: DialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  const getIcon = () => {
    switch (type) {
      case "alert":
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case "warning":
        return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      case "info":
        return <Info className="w-6 h-6 text-blue-600" />;
      default:
        return <CheckCircle className="w-6 h-6 text-blue-600" />;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500";
      default:
        return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-100/20 bg-opacity-50 z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  {getIcon()}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-600 whitespace-pre-line">{message}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <Button variant="outline" onClick={onClose}>
                  {cancelText}
                </Button>
                {onConfirm && (
                  <Button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={`text-white ${getVariantStyles()}`}
                  >
                    {confirmText}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook for easier usage
export function useDialog() {
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: "confirm" | "alert" | "info" | "warning";
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "primary" | "warning";
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const showDialog = (options: Omit<typeof dialog, "isOpen">) => {
    setDialog({ ...options, isOpen: true });
  };

  const hideDialog = () => {
    setDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const confirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      variant?: "danger" | "primary" | "warning";
    }
  ) => {
    return new Promise<boolean>((resolve) => {
      showDialog({
        title,
        message,
        type: "confirm",
        onConfirm: () => {
          onConfirm();
          resolve(true);
        },
        ...options,
      });
    });
  };

  const DialogComponent = (
    <Dialog
      isOpen={dialog.isOpen}
      onClose={hideDialog}
      onConfirm={dialog.onConfirm}
      title={dialog.title}
      message={dialog.message}
      type={dialog.type}
      confirmText={dialog.confirmText}
      cancelText={dialog.cancelText}
      variant={dialog.variant}
    />
  );

  return {
    showDialog,
    hideDialog,
    confirmDialog,
    DialogComponent,
  };
}
