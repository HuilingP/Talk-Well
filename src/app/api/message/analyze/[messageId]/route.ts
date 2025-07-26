import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

import { db } from "~/lib/db";
import { message, messageAnalysis } from "~/lib/db/schema";
import { analyzeMessageWithLLM } from "~/lib/llm/client";

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
      // No existing analysis, call LLM to analyze the message
      try {
        console.warn(`[Analysis API] No existing analysis for message ${messageId}, calling LLM...`);
        // Get conversation history for context
        const roomId = await db
          .select({ roomId: message.roomId })
          .from(message)
          .where(eq(message.id, messageId))
          .limit(1);

        if (roomId.length === 0) {
          throw new Error("Could not find room for message");
        }

        // Get conversation history
        const conversationHistory = await db
          .select({
            username: message.username,
            content: message.content,
            createdAt: message.createdAt,
          })
          .from(message)
          .where(eq(message.roomId, roomId[0].roomId))
          .orderBy(message.createdAt)
          .limit(10);

        const history = conversationHistory.map(msg => ({
          sender: msg.username,
          message: msg.content,
          timestamp: msg.createdAt.toISOString(),
        }));

        // Call LLM for analysis
        const analysis = await analyzeMessageWithLLM({
          conversationHistory: history,
          latestMessage: {
            sender: messageData.message.userType,
            receiver: "对方", // Generic receiver
            content: messageData.message.content,
          },
          relationshipContext: "聊天室对话",
        });

        // Save the analysis to database for future use
        const analysisId = nanoid();
        await db.insert(messageAnalysis).values({
          id: analysisId,
          messageId,
          isCrossNet: analysis.isCrossNet,
          senderState: analysis.senderState,
          receiverImpact: analysis.receiverImpact,
          evidence: analysis.evidence,
          suggestion: analysis.suggestion,
          risk: analysis.risk,
        });

        // Update message with analysis ID
        await db.update(message)
          .set({ analysisId })
          .where(eq(message.id, messageId));

        console.warn(`[Analysis API] LLM analysis completed and saved for message ${messageId}`);

        return NextResponse.json({
          analysis: {
            isCrossNet: analysis.isCrossNet,
            senderState: analysis.senderState,
            receiverImpact: analysis.receiverImpact,
            evidence: analysis.evidence,
            suggestion: analysis.suggestion,
            risk: analysis.risk,
          },
        });
      } catch (analysisError) {
        console.error(`[Analysis API] LLM analysis failed for message ${messageId}:`, analysisError);
        // Return fallback analysis if LLM fails
        return NextResponse.json({
          analysis: {
            isCrossNet: "否",
            senderState: "分析暂时不可用，请稍后再试",
            receiverImpact: "分析暂时不可用，请稍后再试",
            evidence: "由于技术原因，暂时无法提供详细分析。",
            suggestion: "建议继续自然对话，保持相互尊重。",
            risk: "低",
          },
        });
      }
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
