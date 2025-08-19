"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Save,
  Key,
  Eye,
  EyeOff,
  Smartphone,
  AlertTriangle,
  Copy,
  Check,
  Download,
  Monitor,
  X,
  Clock,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { toast } from "sonner";

export default function SecuritySettings() {
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 2FA states
  const [twoFactorSetup, setTwoFactorSetup] = useState({
    isSetup: false,
    qrCode: "",
    secret: "",
    backupCodes: [] as string[],
    verificationCode: "",
    showBackupCodes: false,
  });
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCode, setCopiedBackupCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: 4320, // 72 hours in minutes
    allowMultipleSessions: true,
  });

  // Active sessions state
  const [activeSessions, setActiveSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Load user's current 2FA status and sessions
  useEffect(() => {
    fetchUserData();
    fetchActiveSessions();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user", {
        credentials: "include",
      });
      if (response.ok) {
        const userData = await response.json();
        setFormData((prev) => ({
          ...prev,
          twoFactorEnabled: userData.user.twoFactorEnabled,
          sessionTimeout: userData.user.sessionTimeout || 4320,
          loginAlerts: userData.user.loginAlerts ?? true,
          allowMultipleSessions: userData.user.allowMultipleSessions ?? true,
        }));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const setup2FA = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setTwoFactorSetup({
          isSetup: true,
          qrCode: data.qrCode,
          secret: data.manualEntryKey,
          backupCodes: data.backupCodes,
          verificationCode: "",
          showBackupCodes: false,
        });
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to setup 2FA");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const verify2FASetup = async () => {
    if (!twoFactorSetup.verificationCode) {
      toast.error("Please enter the verification code");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token: twoFactorSetup.verificationCode,
          action: "setup",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setFormData((prev) => ({ ...prev, twoFactorEnabled: true }));
        setTwoFactorSetup((prev) => ({ ...prev, showBackupCodes: true }));
      } else {
        const error = await response.json();
        toast.error(error.message || "Invalid verification code");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!disablePassword) {
      toast.error("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: disablePassword }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setFormData((prev) => ({ ...prev, twoFactorEnabled: false }));
        setTwoFactorSetup({
          isSetup: false,
          qrCode: "",
          secret: "",
          backupCodes: [],
          verificationCode: "",
          showBackupCodes: false,
        });
        setDisablePassword("");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to disable 2FA");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "secret") {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedBackupCode(text);
        setTimeout(() => setCopiedBackupCode(""), 2000);
      }
      toast.success("Copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const downloadBackupCodes = () => {
    const content = twoFactorSetup.backupCodes.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "2fa-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fetchActiveSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await fetch("/api/sessions", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setActiveSessions(data.sessions);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions?sessionId=${sessionId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        toast.success("Session terminated successfully");
        fetchActiveSessions();
      } else {
        toast.error("Failed to terminate session");
      }
    } catch (error) {
      toast.error("Error terminating session");
    }
  };

  const terminateAllSessions = async () => {
    try {
      const response = await fetch("/api/sessions?action=terminateAll", {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        toast.success("All other sessions terminated successfully");
        fetchActiveSessions();
      } else {
        toast.error("Failed to terminate sessions");
      }
    } catch (error) {
      toast.error("Error terminating sessions");
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      formData.newPassword &&
      formData.newPassword !== formData.confirmPassword
    ) {
      toast.error("New passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/settings/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Security settings updated successfully!");
        setFormData({
          ...formData,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update security settings");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
        <p className="mt-1 text-gray-600">
          Manage your account security and privacy settings
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Change Password */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Change Password
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="pl-10 pr-10 w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          newPassword: e.target.value,
                        })
                      }
                      className="pl-10 pr-10 w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="pl-10 pr-10 w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  Password Requirements
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• At least 8 characters long</li>
                  <li>• Include uppercase and lowercase letters</li>
                  <li>• Include at least one number</li>
                  <li>• Include at least one special character</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Two-Factor Authentication
            </h3>

            {!formData.twoFactorEnabled && !twoFactorSetup.isSetup && (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-900">
                        Enhanced Security Recommended
                      </h4>
                      <p className="text-sm text-yellow-800 mt-1">
                        Enable two-factor authentication to add an extra layer
                        of security to your account.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Smartphone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Authenticator App
                      </p>
                      <p className="text-sm text-gray-500">
                        Use an authenticator app to generate verification codes
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={setup2FA}
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? "Setting up..." : "Enable 2FA"}
                  </Button>
                </div>
              </>
            )}

            {/* 2FA Setup Process */}
            {twoFactorSetup.isSetup && !formData.twoFactorEnabled && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Step 1: Scan QR Code
                  </h4>
                  <p className="text-sm text-blue-800 mb-4">
                    Scan this QR code with your authenticator app (Google
                    Authenticator, Authy, etc.)
                  </p>
                  <div className="flex items-start space-x-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <img
                        src={twoFactorSetup.qrCode}
                        alt="2FA QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-blue-800 mb-2">
                        Or enter this code manually:
                      </p>
                      <div className="flex items-center space-x-2">
                        <code className="bg-white text-gray-600 px-3 py-2 rounded border text-sm font-mono">
                          {twoFactorSetup.secret}
                        </code>
                        <button
                          onClick={() =>
                            copyToClipboard(twoFactorSetup.secret, "secret")
                          }
                          className="p-2 text-blue-600 hover:text-blue-800"
                        >
                          {copiedSecret ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-900 mb-2">
                    Step 2: Enter Verification Code
                  </h4>
                  <p className="text-sm text-green-800 mb-4">
                    Enter the 6-digit code from your authenticator app to
                    complete setup
                  </p>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      value={twoFactorSetup.verificationCode}
                      onChange={(e) =>
                        setTwoFactorSetup((prev) => ({
                          ...prev,
                          verificationCode: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                      className="w-32 px-3 text-gray-600 py-2 text-center text-lg font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button
                      onClick={verify2FASetup}
                      disabled={
                        loading || twoFactorSetup.verificationCode.length !== 6
                      }
                    >
                      {loading ? "Verifying..." : "Verify & Enable"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Backup Codes Display */}
            {twoFactorSetup.showBackupCodes && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-red-900">
                    Save Your Backup Codes
                  </h4>
                  <Button
                    onClick={downloadBackupCodes}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
                <p className="text-sm text-red-800 mb-4">
                  Save these backup codes in a safe place. You can use them to
                  access your account if you lose your authenticator device.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {twoFactorSetup.backupCodes.map((code, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <code className="bg-white text-gray-600 px-2 py-1 rounded text-sm font-mono flex-1">
                        {code}
                      </code>
                      <button
                        onClick={() => copyToClipboard(code, "backup")}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        {copiedBackupCode === code ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button
                    onClick={() =>
                      setTwoFactorSetup((prev) => ({
                        ...prev,
                        showBackupCodes: false,
                      }))
                    }
                    variant="outline"
                    size="sm"
                  >
                    I've Saved My Backup Codes
                  </Button>
                </div>
              </div>
            )}

            {/* 2FA Enabled Status */}
            {formData.twoFactorEnabled && !twoFactorSetup.showBackupCodes && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900">
                        Two-Factor Authentication Enabled
                      </p>
                      <p className="text-sm text-green-700">
                        Your account is protected with 2FA
                      </p>
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Disable Two-Factor Authentication
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Enter your password to disable 2FA (not recommended)
                  </p>
                  <div className="flex items-center space-x-3">
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button
                      onClick={disable2FA}
                      disabled={loading || !disablePassword}
                      variant="danger"
                    >
                      {loading ? "Disabling..." : "Disable 2FA"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Session Management */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Session Management
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Login Alerts</p>
                  <p className="text-sm text-gray-500">
                    Get notified when someone signs into your account
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.loginAlerts}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        loginAlerts: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Multiple Sessions</p>
                  <p className="text-sm text-gray-500">
                    Allow logging in from multiple devices simultaneously
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowMultipleSessions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allowMultipleSessions: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout
                </label>
                <select
                  value={formData.sessionTimeout}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sessionTimeout: parseInt(e.target.value),
                    })
                  }
                  className="w-full max-w-xs px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={60}>1 hour</option>
                  <option value={360}>6 hours</option>
                  <option value={720}>12 hours</option>
                  <option value={1440}>24 hours</option>
                  <option value={2880}>48 hours</option>
                  <option value={4320}>72 hours (default)</option>
                  <option value={0}>Never</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Active Sessions
              </h3>
              <Button
                onClick={fetchActiveSessions}
                variant="outline"
                size="sm"
                disabled={loadingSessions}
              >
                {loadingSessions ? "Loading..." : "Refresh"}
              </Button>
            </div>
            
            <div className="space-y-3">
              {activeSessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Monitor className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No active sessions found</p>
                </div>
              ) : (
                <>
                  {activeSessions.map((session: any) => (
                    <div
                      key={session.id}
                      className={`p-4 border rounded-lg ${
                        session.isCurrent
                          ? "border-green-200 bg-green-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${
                            session.isCurrent ? "bg-green-100" : "bg-gray-100"
                          }`}>
                            <Monitor className={`w-5 h-5 ${
                              session.isCurrent ? "text-green-600" : "text-gray-600"
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-gray-900">
                                {session.device || "Unknown Device"}
                              </p>
                              {session.isCurrent && (
                                <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                                  Current Session
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 space-y-1">
                              <p>{session.browser || "Unknown Browser"} • {session.os || "Unknown OS"}</p>
                              <p>{session.ipAddress} • {session.city && session.country ? `${session.city}, ${session.country}` : "Unknown location"}</p>
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Last active: {new Date(session.lastActive).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <Button
                            onClick={() => terminateSession(session.sessionId)}
                            variant="danger"
                            size="sm"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {activeSessions.length > 1 && (
                    <div className="pt-4 border-t border-gray-200">
                      <Button
                        onClick={terminateAllSessions}
                        variant="danger"
                        size="sm"
                      >
                        Terminate All Other Sessions
                      </Button>
                      <p className="text-sm text-gray-500 mt-2">
                        This will sign you out of all other devices and browsers
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button variant="outline" type="button">
              Cancel
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
