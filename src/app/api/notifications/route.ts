import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { notificationService } from "@/lib/notification-service";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const result = await notificationService.getUserNotifications(userId, limit, offset);
    
    return NextResponse.json({
      notifications: result.notifications,
      unreadCount: result.unreadCount,
      hasMore: result.notifications.length === limit,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

    const { title, message, type, category, metadata } = await request.json();

    const notification = await notificationService.createNotification({
      title,
      message,
      type,
      category,
      userId,
      metadata,
    });

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}