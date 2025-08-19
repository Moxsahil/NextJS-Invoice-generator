import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as speakeasy from "speakeasy";
import { z } from "zod";

const verifySchema = z.object({
  token: z.string().length(6, "Token must be 6 digits"),
  action: z.enum(["setup", "login"]).optional().default("setup"),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { token, action } = verifySchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { error: "Two-factor authentication is not set up" },
        { status: 400 }
      );
    }

    // Check if it's a backup code
    let isBackupCode = false;
    let backupCodes: string[] = [];
    
    if (user.twoFactorBackupCodes) {
      try {
        backupCodes = JSON.parse(user.twoFactorBackupCodes);
        isBackupCode = backupCodes.includes(token.toUpperCase());
      } catch (error) {
        console.error("Error parsing backup codes:", error);
      }
    }

    let isValid = false;

    if (isBackupCode) {
      // Remove used backup code
      const updatedBackupCodes = backupCodes.filter(
        (code) => code !== token.toUpperCase()
      );
      
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorBackupCodes: JSON.stringify(updatedBackupCodes),
        },
      });
      
      isValid = true;
    } else {
      // Verify TOTP token
      isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token,
        window: 2, // Allow 2 steps of time window (30s before/after)
      });
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // If this is setup verification, enable 2FA
    if (action === "setup" && !user.twoFactorEnabled) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: action === "setup" 
        ? "Two-factor authentication has been enabled successfully" 
        : "Code verified successfully",
      backupCodesRemaining: isBackupCode ? backupCodes.length - 1 : undefined,
    });
  } catch (error) {
    console.error("Error verifying 2FA:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}