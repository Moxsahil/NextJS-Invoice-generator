import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, twoFactorEnabled: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { error: "Two-factor authentication is already enabled" },
        { status: 400 }
      );
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${user.name} (${user.email})`,
      issuer: "Invoice App",
      length: 32,
    });

    // Generate QR code
    const otpauthUrl = secret.otpauth_url!;
    const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);

    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 8; i++) {
      backupCodes.push(
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );
    }

    // Temporarily store the secret and backup codes (not yet enabled)
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
        twoFactorBackupCodes: JSON.stringify(backupCodes),
      },
    });

    return NextResponse.json({
      secret: secret.base32,
      qrCode: qrCodeDataURL,
      backupCodes,
      manualEntryKey: secret.base32,
    });
  } catch (error) {
    console.error("Error setting up 2FA:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}