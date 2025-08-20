import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";

const paymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  paymentMethodId: z.string().min(1, "Payment method is required"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(['SUBSCRIPTION_PAYMENT', 'WALLET_TOPUP']),
  subscriptionId: z.string().optional(),
});

// Simulate payment processing (in real world, you'd integrate with payment gateways)
function simulatePaymentProcessing(paymentMethod: any, amount: number): {
  success: boolean;
  transactionId?: string;
  failureReason?: string;
} {
  // Simulate different scenarios based on payment method
  const random = Math.random();
  
  // 90% success rate for UPI
  if (paymentMethod.type === 'UPI') {
    if (random > 0.1) {
      return {
        success: true,
        transactionId: `UPI${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      };
    } else {
      return {
        success: false,
        failureReason: 'UPI transaction declined by bank'
      };
    }
  }

  // 85% success rate for cards
  if (paymentMethod.type === 'CREDIT_CARD' || paymentMethod.type === 'DEBIT_CARD') {
    if (random > 0.15) {
      return {
        success: true,
        transactionId: `CARD${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      };
    } else {
      return {
        success: false,
        failureReason: 'Insufficient funds or card declined'
      };
    }
  }

  // 95% success rate for wallet
  if (paymentMethod.type === 'WALLET') {
    if (random > 0.05) {
      return {
        success: true,
        transactionId: `WALLET${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      };
    } else {
      return {
        success: false,
        failureReason: 'Wallet payment failed'
      };
    }
  }

  // Default success for other methods
  return {
    success: true,
    transactionId: `TXN${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  };
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = paymentSchema.parse(body);

    // Get payment method
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: validatedData.paymentMethodId,
        userId,
        isActive: true
      }
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    // Generate transaction reference
    const reference = `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const result = await prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: validatedData.type,
          amount: validatedData.amount,
          status: 'PROCESSING',
          reference,
          description: validatedData.description,
          paymentMethod: paymentMethod.type,
          metadata: {
            paymentMethodId: paymentMethod.id,
            paymentMethodName: paymentMethod.name,
            subscriptionId: validatedData.subscriptionId
          }
        }
      });

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing delay

      const paymentResult = simulatePaymentProcessing(paymentMethod, validatedData.amount);

      // Update transaction status
      const updatedTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: paymentResult.success ? 'SUCCESS' : 'FAILED',
          processedAt: new Date(),
          failureReason: paymentResult.failureReason,
          metadata: {
            ...transaction.metadata as any,
            externalTransactionId: paymentResult.transactionId
          }
        }
      });

      // If payment successful, update user wallet or subscription
      if (paymentResult.success) {
        if (validatedData.type === 'WALLET_TOPUP') {
          // Add to user wallet
          await tx.user.update({
            where: { id: userId },
            data: {
              walletBalance: {
                increment: validatedData.amount
              }
            }
          });
        } else if (validatedData.type === 'SUBSCRIPTION_PAYMENT' && validatedData.subscriptionId) {
          // Handle subscription payment
          const subscription = await tx.subscription.findUnique({
            where: { id: validatedData.subscriptionId },
            include: { plan: true }
          });

          if (subscription) {
            // Update subscription status
            await tx.subscription.update({
              where: { id: validatedData.subscriptionId },
              data: {
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(
                  Date.now() + 
                  (subscription.plan.interval === 'YEAR' ? 365 : 30) * 
                  24 * 60 * 60 * 1000 * subscription.plan.intervalCount
                )
              }
            });

            // Update user subscription status
            await tx.user.update({
              where: { id: userId },
              data: {
                subscriptionStatus: 'ACTIVE',
                nextBillingDate: new Date(
                  Date.now() + 
                  (subscription.plan.interval === 'YEAR' ? 365 : 30) * 
                  24 * 60 * 60 * 1000 * subscription.plan.intervalCount
                )
              }
            });

            // Create billing history record
            await tx.billingHistory.create({
              data: {
                userId,
                subscriptionId: subscription.id,
                transactionId: updatedTransaction.id,
                amount: validatedData.amount,
                status: 'PAID',
                planName: subscription.plan.name,
                billingReason: 'subscription_payment',
                description: validatedData.description,
                periodStart: new Date(),
                periodEnd: new Date(
                  Date.now() + 
                  (subscription.plan.interval === 'YEAR' ? 365 : 30) * 
                  24 * 60 * 60 * 1000 * subscription.plan.intervalCount
                ),
                paidAt: new Date(),
                invoiceNumber: `PAY-${Date.now()}-${userId.slice(-4)}`,
                paymentMethod: paymentMethod.type
              }
            });
          }
        }

        // Update payment method last used
        await tx.paymentMethod.update({
          where: { id: paymentMethod.id },
          data: { lastUsed: new Date() }
        });
      }

      return updatedTransaction;
    });

    return NextResponse.json({
      transaction: result,
      success: result.status === 'SUCCESS',
      message: result.status === 'SUCCESS' 
        ? 'Payment processed successfully'
        : `Payment failed: ${result.failureReason}`
    }, { 
      status: result.status === 'SUCCESS' ? 200 : 400 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 }
    );
  }
}

// Get payment status
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const transactionId = url.searchParams.get('transactionId');
    const reference = url.searchParams.get('reference');

    if (!transactionId && !reference) {
      return NextResponse.json(
        { error: "Transaction ID or reference is required" },
        { status: 400 }
      );
    }

    const where: any = { userId };
    if (transactionId) {
      where.id = transactionId;
    } else if (reference) {
      where.reference = reference;
    }

    const transaction = await prisma.transaction.findFirst({
      where
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ transaction });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get payment status" },
      { status: 500 }
    );
  }
}