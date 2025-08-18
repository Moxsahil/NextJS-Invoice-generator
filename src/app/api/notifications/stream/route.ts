import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { notificationService } from "@/lib/notification-service";

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let heartbeatInterval: NodeJS.Timeout;
    let unsubscribe: () => void;
    let isStreamClosed = false;

    const stream = new ReadableStream({
      start(controller) {
        unsubscribe = notificationService.subscribe(userId, (data) => {
          if (isStreamClosed) return;
          try {
            const message = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(new TextEncoder().encode(message));
          } catch (error) {
            // Stream is closed, mark as closed
            isStreamClosed = true;
          }
        });

        heartbeatInterval = setInterval(() => {
          if (isStreamClosed) {
            clearInterval(heartbeatInterval);
            return;
          }
          try {
            controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
          } catch (error) {
            // Stream is closed, clean up
            isStreamClosed = true;
            clearInterval(heartbeatInterval);
          }
        }, 30000);
      },
      cancel() {
        isStreamClosed = true;
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
        if (unsubscribe) {
          unsubscribe();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  } catch (error) {
    console.error("Error setting up notification stream:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}