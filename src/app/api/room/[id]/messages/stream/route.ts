import type { NextRequest } from "next/server";
import { eq, gte } from "drizzle-orm";
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

      const writer = {
        write: (data: string) => {
          if (!abortController.signal.aborted) {
            try {
              controller.enqueue(encoder.encode(data));
            } catch (error) {
              console.error("SSE write error:", error.message);
              // Connection is closed, clean up
              cleanup();
            }
          }
        },
        close: () => {
          try {
            controller.close();
          } catch (error) {
            // Controller might already be closed
          }
        },
      };

      connections.get(roomId)!.add({ writer, controller: abortController });

      // Send initial connection message
      writer.write("data: {\"type\": \"connected\"}\n\n");

      // Send any missed messages if lastMessageId is provided
      if (lastMessageId) {
        sendMissedMessages(roomId, Number.parseInt(lastMessageId), writer);
      }

      const cleanup = () => {
        writer.close();
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
      };

      // Handle client disconnect
      abortController.signal.addEventListener("abort", cleanup);

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
async function sendMissedMessages(roomId: string, lastMessageId: number, writer: any) {
  try {
    const missedMessages = await db
      .select()
      .from(message)
      .where(
        eq(message.roomId, roomId) && gte(message.id, lastMessageId + 1),
      )
      .orderBy(message.createdAt);

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

// Function to broadcast message to all connections in a room
export function broadcastToRoom(roomId: string, messageData: any) {
  const roomConnections = connections.get(roomId);
  if (!roomConnections) {
    return;
  }

  const dataString = `data: ${JSON.stringify({
    type: "message",
    data: messageData,
  })}\n\n`;

  // Convert to array to safely iterate and remove failed connections
  const connectionsArray = Array.from(roomConnections);

  connectionsArray.forEach(({ writer, controller }) => {
    if (!controller.signal.aborted) {
      try {
        (writer as any).write(dataString);
      } catch (error) {
        console.error("Error broadcasting to connection:", error);
        // Mark as closed and remove failed connection
        (writer as any).close?.();
        roomConnections.delete({ writer, controller });
      }
    } else {
      // Remove aborted connections
      roomConnections.delete({ writer, controller });
    }
  });

  // Clean up empty room connections
  if (roomConnections.size === 0) {
    connections.delete(roomId);
  }
}
