import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "~/lib/auth/server";
import { db } from "~/lib/db";
import { room } from "~/lib/db/schema";

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Generate a unique room ID (8-digit code)
    let roomId: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      roomId = Math.floor(10000000 + Math.random() * 90000000).toString();

      // Check if room ID already exists
      const existingRoom = await db.select().from(room).where(eq(room.id, roomId)).limit(1);

      if (existingRoom.length === 0) {
        break;
      }

      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: "Failed to generate unique room ID" },
        { status: 500 },
      );
    }

    // Create the room in database
    const newRoom = await db.insert(room).values({
      id: roomId,
      createdById: session?.user?.id || null,
      player1Score: 0,
      player2Score: 0,
    }).returning();

    return NextResponse.json({
      roomId: newRoom[0].id,
    });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 },
    );
  }
}
