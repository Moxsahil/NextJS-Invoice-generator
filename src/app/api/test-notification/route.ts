import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { notificationService } from "@/lib/notification-service";
import { NotificationType, NotificationCategory } from "@/types/notification";

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await request.json();

    const testNotifications = {
      invoice: {
        title: "Test Invoice Created",
        message: "A test invoice INV-001 has been created for Test Customer",
        type: NotificationType.SUCCESS,
        category: NotificationCategory.INVOICE_CREATED,
        metadata: { invoiceNumber: "INV-001", customerName: "Test Customer", amount: 1000 },
      },
      payment: {
        title: "Test Payment Received",
        message: "Payment of ₹1,000 received for invoice INV-001",
        type: NotificationType.SUCCESS,
        category: NotificationCategory.PAYMENT_RECEIVED,
        metadata: { invoiceNumber: "INV-001", amount: 1000 },
      },
      customer: {
        title: "Test Customer Added",
        message: "New customer 'Test Customer' has been added",
        type: NotificationType.INFO,
        category: NotificationCategory.NEW_CUSTOMER,
        metadata: { customerName: "Test Customer", email: "test@example.com" },
      },
      overdue: {
        title: "Test Invoice Overdue",
        message: "Invoice INV-001 is now overdue",
        type: NotificationType.WARNING,
        category: NotificationCategory.INVOICE_OVERDUE,
        metadata: { invoiceNumber: "INV-001", daysOverdue: 5 },
      },
      error: {
        title: "Test System Error",
        message: "This is a test error notification",
        type: NotificationType.ERROR,
        category: NotificationCategory.SYSTEM_UPDATE,
        metadata: { error: "Test error" },
      },
    };

    const notification = testNotifications[type as keyof typeof testNotifications] || testNotifications.invoice;

    const result = await notificationService.createNotification({
      ...notification,
      userId,
    });

    return NextResponse.json({ 
      success: true,
      notification: result,
      message: `Test notification of type '${type}' created successfully` 
    });
  } catch (error) {
    console.error("Error creating test notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}