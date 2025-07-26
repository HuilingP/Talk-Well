import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "~/lib/db";
import { message, messageAnalysis } from "~/lib/db/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  try {
    const { messageId } = await params;

    // Find the message and its analysis
    const result = await db
      .select({
        message: {
          id: message.id,
          content: message.content,
          userType: message.userType,
          createdAt: message.createdAt,
        },
        analysis: {
          id: messageAnalysis.id,
          isCrossNet: messageAnalysis.isCrossNet,
          senderState: messageAnalysis.senderState,
          receiverImpact: messageAnalysis.receiverImpact,
          evidence: messageAnalysis.evidence,
          suggestion: messageAnalysis.suggestion,
          risk: messageAnalysis.risk,
          createdAt: messageAnalysis.createdAt,
        },
      })
      .from(message)
      .leftJoin(messageAnalysis, eq(message.analysisId, messageAnalysis.id))
      .where(eq(message.id, messageId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 },
      );
    }

    const messageData = result[0];

    if (!messageData.analysis || !messageData.analysis.id) {
      // Return default analysis for messages without analysis (like default messages)
      return NextResponse.json({
        analysis: {
          isCrossNet: "No",
          senderState: "Neutral",
          receiverImpact: "Neutral",
          evidence: "This message doesn't have detailed analysis available.",
          suggestion: "Continue the conversation naturally.",
          risk: "Low",
        },
      });
    }

    return NextResponse.json({
      analysis: {
        isCrossNet: messageData.analysis.isCrossNet,
        senderState: messageData.analysis.senderState,
        receiverImpact: messageData.analysis.receiverImpact,
        evidence: messageData.analysis.evidence,
        suggestion: messageData.analysis.suggestion,
        risk: messageData.analysis.risk,
      },
    });
  } catch (error) {
    console.error("Error fetching message analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch analysis" },
      { status: 500 },
    );
  }
}
