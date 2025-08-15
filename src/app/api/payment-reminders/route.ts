import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceId, customerEmail, dueDate } = await request.json();

    // Get user's reminder settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        invoiceReminders: true,
        companyName: true,
        companyEmail: true,
      },
    });

    if (!user || !user.invoiceReminders) {
      return NextResponse.json(
        { error: "Payment reminders not enabled" },
        { status: 400 }
      );
    }

    // Schedule reminder emails
    const reminderDays = [7, 3, 1]; // Days before due date
    const overdueReminders = [1, 7, 15]; // Days after due date
    
    const dueDateObj = new Date(dueDate);
    const currentDate = new Date();

    // Calculate reminder dates
    const reminders = [];

    // Before due date reminders
    for (const days of reminderDays) {
      const reminderDate = new Date(dueDateObj);
      reminderDate.setDate(reminderDate.getDate() - days);
      
      if (reminderDate > currentDate) {
        reminders.push({
          type: 'before_due',
          scheduledDate: reminderDate,
          daysDifference: days,
        });
      }
    }

    // Overdue reminders
    for (const days of overdueReminders) {
      const reminderDate = new Date(dueDateObj);
      reminderDate.setDate(reminderDate.getDate() + days);
      
      reminders.push({
        type: 'overdue',
        scheduledDate: reminderDate,
        daysDifference: days,
      });
    }

    // In a real application, you would save these reminders to a queue/database
    // and have a background job process them. For now, we'll just log them.
    console.log("Scheduled payment reminders:", {
      invoiceId,
      customerEmail,
      reminders,
    });

    // Simulate scheduling reminders
    for (const reminder of reminders) {
      // In production, you would use a job queue like Bull, Agenda, or similar
      console.log(`Reminder scheduled for ${reminder.scheduledDate.toISOString()}: ${reminder.type} (${reminder.daysDifference} days)`);
    }

    return NextResponse.json({
      message: "Payment reminders scheduled successfully",
      scheduledReminders: reminders.length,
      reminders: reminders.map(r => ({
        type: r.type,
        date: r.scheduledDate.toISOString(),
        description: r.type === 'before_due' 
          ? `Reminder ${r.daysDifference} days before due date`
          : `Overdue reminder ${r.daysDifference} days after due date`
      }))
    });

  } catch (error) {
    console.error("Error scheduling payment reminders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's reminder settings and stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        invoiceReminders: true,
        companyName: true,
        companyEmail: true,
      },
    });

    return NextResponse.json({
      reminderSettings: {
        enabled: user?.invoiceReminders || false,
        reminderDays: [7, 3, 1],
        overdueReminders: [1, 7, 15],
      },
      message: user?.invoiceReminders 
        ? "Payment reminders are enabled"
        : "Payment reminders are disabled"
    });

  } catch (error) {
    console.error("Error fetching payment reminder settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}