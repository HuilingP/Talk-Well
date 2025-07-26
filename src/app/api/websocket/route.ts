import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  // 检查是否是WebSocket升级请求
  const upgrade = request.headers.get("upgrade");

  if (upgrade !== "websocket") {
    return new Response("Expected WebSocket upgrade", { status: 426 });
  }

  // Next.js在生产环境中不直接支持WebSocket升级
  // 这个端点主要是为了提供API路径，实际的WebSocket处理需要自定义服务器
  return new Response("WebSocket endpoint - requires custom server", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
