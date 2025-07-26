import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "~/lib/auth/server";
import { db } from "~/lib/db";
import { message } from "~/lib/db/schema";

// Store active SSE connections with simplified structure
const connections = new Map<string, Set<{ writer: any; controller: AbortController }>>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: roomId } = await params;
  const url = new URL(request.url);
  const lastMessageId = url.searchParams.get("lastMessageId");

  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        error: "Authentication required",
        message: "You must be logged in to access this stream",
      },
      { status: 401 },
    );
  }

  // Create a simple streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const abortController = new AbortController();

      // Add connection to the room
      if (!connections.has(roomId)) {
        connections.set(roomId, new Set());
      }

      // Define cleanup function first
      let writer: any;
      const cleanup = () => {
        const roomConnections = connections.get(roomId);
        if (roomConnections) {
          roomConnections.forEach((conn) => {
            if (conn.writer === writer) {
              roomConnections.delete(conn);
            }
          });

          if (roomConnections.size === 0) {
            connections.delete(roomId);
          }
        }
        abortController.abort();
        try {
          controller.close();
        } catch {
          // Controller might already be closed
        }
      };

      writer = {
        write: (data: string) => {
          if (!abortController.signal.aborted) {
            try {
              controller.enqueue(encoder.encode(data));
            } catch (writeError) {
              console.error("SSE write error:", writeError);
              // Connection is closed, clean up
              cleanup();
            }
          }
        },
        close: cleanup,
      };

      connections.get(roomId)!.add({ writer, controller: abortController });

      // Send initial connection message
      writer.write("data: {\"type\": \"connected\"}\n\n");
      // Handle client disconnect
      abortController.signal.addEventListener("abort", cleanup);

      // Send any missed messages if lastMessageId is provided
      if (lastMessageId) {
        sendMissedMessages(roomId, lastMessageId, writer);
      }

      // Cleanup on stream close
      return cleanup;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// Function to send missed messages
async function sendMissedMessages(roomId: string, lastMessageId: string | null, writer: any) {
  try {
    // Get all messages for the room and filter by timestamp/order since nanoid strings can't be compared directly
    const query = db
      .select()
      .from(message)
      .where(eq(message.roomId, roomId))
      .orderBy(message.createdAt);

    const allMessages = await query;
    // If we have a lastMessageId, filter to only return newer messages
    let missedMessages = allMessages;
    if (lastMessageId) {
      const lastMessageIndex = allMessages.findIndex(msg => msg.id === lastMessageId);
      if (lastMessageIndex >= 0) {
        missedMessages = allMessages.slice(lastMessageIndex + 1);
      }
    }

    for (const msg of missedMessages) {
      writer.write(`data: ${JSON.stringify({
        type: "message",
        data: {
          id: msg.id,
          userId: msg.userId,
          username: msg.username,
          content: msg.content,
          createdAt: msg.createdAt,
          roomId: msg.roomId,
        },
      })}\n\n`);
    }
  } catch (error) {
    console.error("Error sending missed messages:", error);
  }
}
