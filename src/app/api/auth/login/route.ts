import { generateToken, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as speakeasy from "speakeasy";
import {
  sendLoginAlert,
  parseDeviceInfo,
  getClientIP,
} from "@/lib/loginAlerts";
import crypto from "crypto";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password is required"),
  twoFactorCode: z.string().optional(),
});
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, twoFactorCode } = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
        sessionTimeout: true,
        // Temporarily comment out new fields until migration is run
        loginAlerts: true,
        allowMultipleSessions: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }
    

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return NextResponse.json({
          requiresTwoFactor: true,
          message: "Two-factor authentication required",
        });
      }

      let is2FAValid = false;

      // Check if it's a backup code
      if (user.twoFactorBackupCodes) {
        try {
          const backupCodes: string[] = JSON.parse(user.twoFactorBackupCodes);
          const isBackupCode = backupCodes.includes(
            twoFactorCode.toUpperCase()
          );

          if (isBackupCode) {
            // Remove used backup code
            const updatedBackupCodes = backupCodes.filter(
              (code) => code !== twoFactorCode.toUpperCase()
            );

            await prisma.user.update({
              where: { id: user.id },
              data: {
                twoFactorBackupCodes: JSON.stringify(updatedBackupCodes),
              },
            });

            is2FAValid = true;
          }
        } catch (error) {
          console.error("Error parsing backup codes:", error);
        }
      }

      // If not a backup code, verify TOTP
      if (!is2FAValid && user.twoFactorSecret) {
        is2FAValid = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: "base32",
          token: twoFactorCode,
          window: 2,
        });
      }

      if (!is2FAValid) {
        return NextResponse.json(
          { error: "Invalid two-factor authentication code" },
          { status: 401 }
        );
      }
      
    }

    // Get request info for session tracking
    const userAgent = request.headers.get("user-agent") || "";
    const ipAddress = getClientIP(request);
    const deviceInfo = parseDeviceInfo(userAgent);

    // Generate session ID
    const sessionId = crypto.randomUUID();

    // Calculate session expiration based on user preference
    const sessionTimeoutMinutes = user.sessionTimeout || 4320; // Default 72 hours
    const expiresAt = new Date(Date.now() + sessionTimeoutMinutes * 60 * 1000);

    // Handle multiple sessions setting
    if (!user.allowMultipleSessions) {
      // Terminate all existing active sessions
      await prisma.userSession.updateMany({
        where: {
          userId: user.id,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });
    }

    // Create new session record
    await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionId,
        ipAddress,
        userAgent,
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        expiresAt,
      },
    });

    // Send login alert if enabled
    if (user.loginAlerts) {
      try {
        await sendLoginAlert({
          userEmail: user.email,
          userName: user.name,
          ipAddress,
          userAgent,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Failed to send login alert:", error);
        // Don't fail login if email fails
      }
    }

    const token = generateToken(user.id);

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTimeoutMinutes * 60, // Use user's session timeout preference
      path: "/",
    });

    response.cookies.set("session-id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTimeoutMinutes * 60, // Use user's session timeout preference
      path: "/",
    });

    return response;
  } catch (error) {
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
