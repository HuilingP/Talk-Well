import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "~/lib/auth/server";
import { db } from "~/lib/db";
import { message, messageAnalysis, room } from "~/lib/db/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Get current session (optional for room access)
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Find the room
    const roomData = await db.select().from(room).where(eq(room.id, id)).limit(1);

    if (roomData.length === 0) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 },
      );
    }

    // Get room messages with their analyses
    const messagesData = await db
      .select({
        id: message.id,
        userType: message.userType,
        text: message.text,
        createdAt: message.createdAt,
        analysis: {
          id: messageAnalysis.id,
          isCrossNet: messageAnalysis.isCrossNet,
          senderState: messageAnalysis.senderState,
          receiverImpact: messageAnalysis.receiverImpact,
          evidence: messageAnalysis.evidence,
          suggestion: messageAnalysis.suggestion,
          risk: messageAnalysis.risk,
        },
      })
      .from(message)
      .leftJoin(messageAnalysis, eq(message.analysisId, messageAnalysis.id))
      .where(eq(message.roomId, id))
      .orderBy(message.createdAt);

    // Transform messages to match expected format
    const messages = messagesData.map(msg => ({
      user: msg.userType as "You" | "Friend",
      text: msg.text,
    }));

    // If room is empty, add default messages like frontend does
    if (messages.length === 0) {
      const defaultMessages = [
        { user: "Friend" as const, text: "Hey, how are you?" },
        { user: "You" as const, text: "I'm good, thanks! How about you?" },
        { user: "Friend" as const, text: "Doing great! Just enjoying the day." },
      ];

      // Insert default messages into database
      for (const msg of defaultMessages) {
        await db.insert(message).values({
          id: `default_${Date.now()}_${Math.random()}`,
          roomId: id,
          userId: msg.user === "You" ? session?.user?.id || null : null,
          userType: msg.user,
          text: msg.text,
        });
      }

      return NextResponse.json({
        id,
        messages: defaultMessages,
        player1Score: roomData[0].player1Score,
        player2Score: roomData[0].player2Score,
        timestamp: Math.floor(roomData[0].createdAt.getTime() / 1000),
      });
    }

    return NextResponse.json({
      id,
      messages,
      player1Score: roomData[0].player1Score,
      player2Score: roomData[0].player2Score,
      timestamp: Math.floor(roomData[0].updatedAt.getTime() / 1000),
    });
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 },
    );
  }
}
