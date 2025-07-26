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

    // Get current session - required for all room operations
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Authentication required",
          message: "You must be logged in to access rooms",
        },
        { status: 401 },
      );
    }

    // Find the room
    let roomData = await db.select().from(room).where(eq(room.id, id)).limit(1);

    if (roomData.length === 0) {
      // Auto-create the room if it doesn't exist (user is authenticated)
      await db.insert(room).values({
        id,
        createdById: session.user.id, // Set the current user as room creator
        player1Score: 0,
        player2Score: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Fetch the newly created room
      roomData = await db.select().from(room).where(eq(room.id, id)).limit(1);
    }

    // Get room messages with their analyses
    const messagesData = await db
      .select({
        id: message.id,
        roomId: message.roomId,
        userId: message.userId,
        username: message.username,
        userType: message.userType,
        content: message.content,
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
      id: msg.id,
      roomId: msg.roomId,
      userId: msg.userId,
      username: msg.username,
      content: msg.content,
      userType: msg.userType as "You" | "Friend",
      createdAt: msg.createdAt.toISOString(),
      analysis: (msg.analysis && msg.analysis.id)
        ? {
            isCrossNet: msg.analysis.isCrossNet,
            senderState: msg.analysis.senderState,
            receiverImpact: msg.analysis.receiverImpact,
            evidence: msg.analysis.evidence,
            suggestion: msg.analysis.suggestion,
            risk: msg.analysis.risk,
          }
        : undefined,
    }));

    // Return empty messages for new rooms - users will start their own conversation

    return NextResponse.json({
      room: {
        id,
        createdById: roomData[0].createdById,
        player1Score: roomData[0].player1Score,
        player2Score: roomData[0].player2Score,
        createdAt: roomData[0].createdAt.toISOString(),
        updatedAt: roomData[0].updatedAt.toISOString(),
      },
      messages,
      currentUserId: session.user.id, // Add current user ID to response
    });
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 },
    );
  }
}
