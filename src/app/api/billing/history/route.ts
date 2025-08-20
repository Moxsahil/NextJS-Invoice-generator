import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId };
    
    if (status) {
      where.status = status;
    }
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [billingHistory, total] = await Promise.all([
      prisma.billingHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.billingHistory.count({ where })
    ]);

    // Calculate summary stats
    const stats = await prisma.billingHistory.aggregate({
      where: { userId },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    const paidAmount = await prisma.billingHistory.aggregate({
      where: { 
        userId,
        status: 'PAID'
      },
      _sum: {
        amount: true
      }
    });

    const pendingAmount = await prisma.billingHistory.aggregate({
      where: { 
        userId,
        status: 'PENDING'
      },
      _sum: {
        amount: true
      }
    });

    return NextResponse.json({
      billingHistory,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalTransactions: stats._count.id,
        totalAmount: stats._sum.amount || 0,
        paidAmount: paidAmount._sum.amount || 0,
        pendingAmount: pendingAmount._sum.amount || 0
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch billing history" },
      { status: 500 }
    );
  }
}

// Generate invoice for a billing record
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { billingId, action } = await request.json();

    if (action === 'generate_invoice') {
      const billingRecord = await prisma.billingHistory.findFirst({
        where: {
          id: billingId,
          userId
        }
      });

      if (!billingRecord) {
        return NextResponse.json(
          { error: "Billing record not found" },
          { status: 404 }
        );
      }

      // Generate invoice PDF or return invoice URL
      const invoiceUrl = `/api/billing/invoice/${billingId}`;
      
      return NextResponse.json({
        invoiceUrl,
        message: "Invoice generated successfully"
      });
    }

    if (action === 'download_invoice') {
      const billingRecord = await prisma.billingHistory.findFirst({
        where: {
          id: billingId,
          userId
        }
      });

      if (!billingRecord) {
        return NextResponse.json(
          { error: "Billing record not found" },
          { status: 404 }
        );
      }

      // Return download URL
      const downloadUrl = `/api/billing/invoice/${billingId}/download`;
      
      return NextResponse.json({
        downloadUrl,
        message: "Invoice download ready"
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}