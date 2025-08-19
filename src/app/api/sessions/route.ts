import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active sessions for the user
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        lastActive: 'desc',
      },
    });

    // Get current session ID from cookie
    const currentSessionId = request.cookies.get('session-id')?.value;

    const formattedSessions = sessions.map(session => ({
      id: session.id,
      sessionId: session.sessionId,
      ipAddress: session.ipAddress,
      city: session.city,
      country: session.country,
      device: session.device,
      browser: session.browser,
      os: session.os,
      lastActive: session.lastActive,
      createdAt: session.createdAt,
      isCurrent: session.sessionId === currentSessionId,
    }));

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const action = searchParams.get('action'); // 'terminate' or 'terminateAll'

    if (action === 'terminateAll') {
      // Terminate all sessions except current
      const currentSessionId = request.cookies.get('session-id')?.value;
      
      await prisma.userSession.updateMany({
        where: {
          userId,
          isActive: true,
          sessionId: {
            not: currentSessionId,
          },
        },
        data: {
          isActive: false,
        },
      });

      return NextResponse.json({ 
        message: "All other sessions terminated successfully" 
      });
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Check if user owns this session
    const session = await prisma.userSession.findFirst({
      where: {
        sessionId,
        userId,
        isActive: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Terminate the session
    await prisma.userSession.update({
      where: {
        id: session.id,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({ 
      message: "Session terminated successfully" 
    });
  } catch (error) {
    console.error("Error terminating session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}