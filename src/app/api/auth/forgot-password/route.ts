import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import crypto from "crypto";
import * as nodemailer from "nodemailer";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save token to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        },
      });

      // Send reset email
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin: 0;">Password Reset Request</h2>
            </div>
            
            <div style="padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
              <p>Hi ${user.name},</p>
              
              <p>We received a request to reset your password for your Invoice App account.</p>
              
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
                <a href="${resetUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Reset Your Password
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                This link will expire in 10 minutes for security reasons.
              </p>
              
              <p style="color: #666; font-size: 14px;">
                If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.
              </p>
              
              <p>Best regards,<br>Invoice App Team</p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6c757d; font-size: 12px;">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>If you can't click the button above, copy and paste this link into your browser:</p>
              <p style="word-break: break-all;">${resetUrl}</p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: user.email,
          subject: 'Reset Your Password - Invoice App',
          html: emailContent,
        });

      } catch (error) {
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      message: "If an account with that email exists, a password reset link has been sent.",
    });

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