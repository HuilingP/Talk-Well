import type { IncomingMessage } from "node:http";
import { URL } from "node:url";
import WebSocket from "ws";
import { auth } from "~/lib/auth/server";

// WebSocket连接管理
interface RoomConnection {
  ws: WebSocket;
  userId: string;
  roomId: string;
}

const roomConnections = new Map<string, Set<RoomConnection>>();

// 广播消息到房间内的所有连接
export function broadcastToRoom(roomId: string, message: any) {
  const connections = roomConnections.get(roomId);
  if (!connections) {
    return;
  }

  const messageStr = JSON.stringify(message);
  console.warn(`Broadcasting to room ${roomId}:`, message);

  connections.forEach((conn) => {
    if (conn.ws.readyState === WebSocket.OPEN) {
      try {
        conn.ws.send(messageStr);
      } catch (error) {
        console.error("Error broadcasting message:", error);
        // 移除失效的连接
        connections.delete(conn);
      }
    } else {
      // 移除已关闭的连接
      connections.delete(conn);
    }
  });

  // 清理空房间
  if (connections.size === 0) {
    roomConnections.delete(roomId);
  }
}

// 处理WebSocket连接
export async function handleWebSocketConnection(ws: WebSocket, request: IncomingMessage) {
  let roomId: string | undefined;
  try {
    const url = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
    roomId = url.searchParams.get("roomId") || undefined;
  } catch {
    roomId = undefined;
  }

  if (!roomId) {
    ws.close(1000, "Room ID required");
    return;
  }

  try {
    // 验证用户认证
    const session = await auth.api.getSession({
      headers: request.headers as any,
    });

    if (!session?.user?.id) {
      ws.close(1000, "Authentication required");
      return;
    }

    const userId = session.user.id;
    console.warn(`WebSocket connected: User ${userId} joined room ${roomId}`);

    // 创建连接对象
    const connection: RoomConnection = {
      ws,
      userId,
      roomId,
    };

    // 添加到房间连接管理
    if (!roomConnections.has(roomId)) {
      roomConnections.set(roomId, new Set());
    }
    roomConnections.get(roomId)!.add(connection);

    // 发送连接成功消息
    ws.send(JSON.stringify({
      type: "connected",
      roomId,
      userId,
      timestamp: Date.now(),
    }));

    // 设置心跳
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000);

    // 处理消息
    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.warn("WebSocket message received:", message);

        // 这里可以处理不同类型的消息
        switch (message.type) {
          case "ping":
            ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
            break;
          case "join_room":
            // 房间加入逻辑（如果需要的话）
            break;
          default:
            console.warn("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    });

    // 处理连接关闭
    ws.on("close", (code, reason) => {
      console.warn(`WebSocket disconnected: User ${userId} left room ${roomId}, code: ${code}, reason: ${reason}`);

      // 清理心跳
      clearInterval(heartbeatInterval);

      // 从房间连接中移除
      const connections = roomConnections.get(roomId);
      if (connections) {
        connections.delete(connection);
        if (connections.size === 0) {
          roomConnections.delete(roomId);
        }
      }
    });

    // 处理错误
    ws.on("error", (error) => {
      console.error(`WebSocket error for user ${userId} in room ${roomId}:`, error);
    });
  } catch (error) {
    console.error("Error handling WebSocket connection:", error);
    ws.close(1000, "Server error");
  }
}

// 获取房间连接统计
export function getRoomStats() {
  const stats: Record<string, number> = {};
  roomConnections.forEach((connections, roomId) => {
    stats[roomId] = connections.size;
  });
  return stats;
}
