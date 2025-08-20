import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";

const paymentMethodSchema = z.object({
  type: z.enum(['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'WALLET', 'CRYPTO']),
  name: z.string().min(1, "Name is required"),
  details: z.object({
    // For UPI
    upiId: z.string().optional(),
    // For cards
    cardNumber: z.string().optional(),
    expiryMonth: z.string().optional(),
    expiryYear: z.string().optional(),
    holderName: z.string().optional(),
    // For net banking
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    // For wallet
    walletId: z.string().optional(),
    walletProvider: z.string().optional(),
    // For crypto
    walletAddress: z.string().optional(),
    cryptoType: z.string().optional(),
  }),
  isDefault: z.boolean().optional().default(false),
});

// Simple encryption for demo purposes (use proper encryption in production)
function encrypt(text: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'demo-key', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedData: string): string {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'demo-key', 'salt', 32);
  const textParts = encryptedData.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = textParts.join(':');
  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { 
        userId,
        isActive: true 
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Return payment methods with masked details for security
    const maskedPaymentMethods = paymentMethods.map(pm => {
      let maskedDetails = { ...pm.details as any };
      
      // Mask sensitive information
      if (maskedDetails.cardNumber) {
        maskedDetails.cardNumber = '****' + maskedDetails.cardNumber.slice(-4);
      }
      if (maskedDetails.accountNumber) {
        maskedDetails.accountNumber = '****' + maskedDetails.accountNumber.slice(-4);
      }
      if (maskedDetails.upiId) {
        const parts = maskedDetails.upiId.split('@');
        if (parts.length === 2) {
          maskedDetails.upiId = '****' + parts[0].slice(-2) + '@' + parts[1];
        }
      }

      return {
        ...pm,
        details: maskedDetails
      };
    });

    return NextResponse.json({ paymentMethods: maskedPaymentMethods });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch payment methods" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = paymentMethodSchema.parse(body);

    // Calculate expiry date for cards
    let expiryDate = null;
    if (validatedData.type === 'CREDIT_CARD' || validatedData.type === 'DEBIT_CARD') {
      if (validatedData.details.expiryMonth && validatedData.details.expiryYear) {
        expiryDate = new Date(
          parseInt(validatedData.details.expiryYear),
          parseInt(validatedData.details.expiryMonth) - 1,
          1
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // If this is set as default, remove default from other methods
      if (validatedData.isDefault) {
        await tx.paymentMethod.updateMany({
          where: { 
            userId,
            isDefault: true 
          },
          data: { isDefault: false }
        });
      }

      // Encrypt sensitive details (simplified for demo)
      const encryptedDetails = {
        ...validatedData.details,
        // In production, encrypt sensitive fields
      };

      const paymentMethod = await tx.paymentMethod.create({
        data: {
          userId,
          type: validatedData.type,
          name: validatedData.name,
          details: encryptedDetails,
          isDefault: validatedData.isDefault,
          expiryDate,
        }
      });

      return paymentMethod;
    });

    return NextResponse.json({
      paymentMethod: {
        ...result,
        details: {} // Don't return sensitive details
      },
      message: "Payment method added successfully"
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add payment method" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const paymentMethodId = url.searchParams.get('id');

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: "Payment method ID is required" },
        { status: 400 }
      );
    }

    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: paymentMethodId,
        userId
      }
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    await prisma.paymentMethod.update({
      where: { id: paymentMethodId },
      data: { isActive: false }
    });

    return NextResponse.json({
      message: "Payment method removed successfully"
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to remove payment method" },
      { status: 500 }
    );
  }
}