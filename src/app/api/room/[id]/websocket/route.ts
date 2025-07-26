import type { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "~/lib/auth/server";
import { db } from "~/lib/db";
import { message } from "~/lib/db/schema";

// 使用Map存储活跃的连接
const roomConnections = new Map<string, Set<{
  controller: ReadableStreamDefaultController;
  userId: string;
  cleanup: () => void;
}>>();

// 广播消息到房间
export function broadcastToWebSocketRoom(roomId: string, data: any) {
  const connections = roomConnections.get(roomId);
  if (!connections) {
    return;
  }

  const message = `data: ${JSON.stringify(data)}\n\n`;
  console.warn(`Broadcasting to room ${roomId}:`, data);

  // 将连接转换为数组以安全地迭代
  const connectionsArray = Array.from(connections);

  connectionsArray.forEach((conn) => {
    try {
      conn.controller.enqueue(new TextEncoder().encode(message));
    } catch (error) {
      console.error("Error broadcasting to connection:", error);
      // 移除失效的连接
      conn.cleanup();
      connections.delete(conn);
    }
  });

  // 清理空房间
  if (connections.size === 0) {
    roomConnections.delete(roomId);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: roomId } = await params;

  // 验证用户认证
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const userId = session.user.id;
  console.warn(`WebSocket-style connection: User ${userId} joining room ${roomId}`);

  // 创建流式响应
  const stream = new ReadableStream({
    start(controller) {
      // 初始化连接
      if (!roomConnections.has(roomId)) {
        roomConnections.set(roomId, new Set());
      }

      const cleanup = () => {
        const connections = roomConnections.get(roomId);
        if (connections) {
          connections.forEach((conn) => {
            if (conn.userId === userId) {
              connections.delete(conn);
            }
          });

          if (connections.size === 0) {
            roomConnections.delete(roomId);
          }
        }

        try {
          controller.close();
        } catch {
          // Controller might already be closed
        }
      };

      // 添加连接到房间
      const connection = {
        controller,
        userId,
        cleanup,
      };

      roomConnections.get(roomId)!.add(connection);

      // 发送初始连接消息
      const welcomeMessage = `data: ${JSON.stringify({
        type: "connected",
        roomId,
        userId,
        timestamp: Date.now(),
      })}\n\n`;

      controller.enqueue(new TextEncoder().encode(welcomeMessage));

      // 发送最近的消息历史
      sendRecentMessages(roomId, controller);

      // 定期发送心跳
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `data: ${JSON.stringify({
            type: "heartbeat",
            timestamp: Date.now(),
          })}\n\n`;
          controller.enqueue(new TextEncoder().encode(heartbeat));
        } catch {
          console.warn("Heartbeat failed, cleaning up connection");
          clearInterval(heartbeatInterval);
          cleanup();
        }
      }, 30000);

      // 清理函数更新
      const originalCleanup = cleanup;
      const enhancedCleanup = () => {
        clearInterval(heartbeatInterval);
        originalCleanup();
      };

      connection.cleanup = enhancedCleanup;

      // 返回清理函数
      return enhancedCleanup;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no", // 防止nginx缓冲
    },
  });
}

// 发送最近的消息
async function sendRecentMessages(roomId: string, controller: ReadableStreamDefaultController) {
  try {
    const recentMessages = await db
      .select()
      .from(message)
      .where(eq(message.roomId, roomId))
      .orderBy(desc(message.createdAt))
      .limit(50);

    // 按时间正序发送
    recentMessages.reverse().forEach((msg) => {
      const messageData = `data: ${JSON.stringify({
        type: "message",
        data: {
          id: msg.id,
          roomId: msg.roomId,
          userId: msg.userId,
          username: msg.username,
          content: msg.content,
          userType: msg.userType,
          createdAt: msg.createdAt,
          analysis: msg.analysis,
          scoreChange: msg.scoreChange,
        },
      })}\n\n`;

      try {
        controller.enqueue(new TextEncoder().encode(messageData));
      } catch (error) {
        console.error("Error sending recent message:", error);
      }
    });
  } catch (error) {
    console.error("Error fetching recent messages:", error);
  }
}
