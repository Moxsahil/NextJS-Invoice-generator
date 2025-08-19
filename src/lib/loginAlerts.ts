import * as nodemailer from "nodemailer";
import { UAParser } from "ua-parser-js";

interface LoginAlertData {
  userEmail: string;
  userName: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    city?: string;
    country?: string;
  };
  timestamp: Date;
}

export async function sendLoginAlert(data: LoginAlertData) {
  try {
    // Parse user agent to get device info
    const parser = new UAParser(data.userAgent);
    const result = parser.getResult();
    
    const deviceInfo = {
      browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
      os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
      device: result.device.model || result.device.type || 'Desktop',
    };

    // Create transporter using your existing SMTP config
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const locationString = data.location?.city && data.location?.country 
      ? `${data.location.city}, ${data.location.country}`
      : 'Unknown location';

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin: 0;">New Sign-in to Your Account</h2>
        </div>
        
        <div style="padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
          <p>Hi ${data.userName},</p>
          
          <p>We noticed a new sign-in to your Invoice App account. Here are the details:</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${data.timestamp.toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>IP Address:</strong> ${data.ipAddress}</p>
            <p style="margin: 5px 0;"><strong>Location:</strong> ${locationString}</p>
            <p style="margin: 5px 0;"><strong>Device:</strong> ${deviceInfo.device}</p>
            <p style="margin: 5px 0;"><strong>Browser:</strong> ${deviceInfo.browser}</p>
            <p style="margin: 5px 0;"><strong>Operating System:</strong> ${deviceInfo.os}</p>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ If this wasn't you:</strong> Please secure your account immediately by changing your password and enabling two-factor authentication.
            </p>
          </div>
          
          <p>If you recognize this activity, you can ignore this email.</p>
          
          <p>Best regards,<br>Invoice App Security Team</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6c757d; font-size: 12px;">
          <p>This is an automated security notification. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_USER, // Using your existing SMTP_USER
      to: data.userEmail,
      subject: '🔐 New sign-in to your Invoice App account',
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
  }
}

export function parseDeviceInfo(userAgent: string) {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();
  
  return {
    browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
    os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
    device: result.device.model || result.device.type || 'Desktop',
  };
}

export function getClientIP(request: Request): string {
  // Get IP from various headers (for different proxy setups)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  return realIP || remoteAddr || 'Unknown';
}