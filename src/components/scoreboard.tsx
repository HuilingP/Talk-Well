"use client";

import { Medal } from "lucide-react";
import { useTranslations } from "next-intl";

interface ScoreboardProps {
  player1Score: number;
  player2Score: number;
  currentUserId?: string | null;
  roomCreatedById?: string | null;
  player1Name?: string;
  player2Name?: string;
}

export function Scoreboard({
  player1Score,
  player2Score,
  currentUserId,
  roomCreatedById,
  player1Name,
  player2Name,
}: ScoreboardProps) {
  const t = useTranslations("Scoreboard");

  // Determine if current user is player1 (room creator) or player2
  const isCurrentUserPlayer1 = currentUserId === roomCreatedById;

  // Determine display names and positions
  const leftPlayerName = isCurrentUserPlayer1 ? (player2Name || "对方") : (player1Name || "对方");
  const rightPlayerName = "我";
  const leftPlayerScore = isCurrentUserPlayer1 ? player2Score : player1Score;
  const rightPlayerScore = isCurrentUserPlayer1 ? player1Score : player2Score;
  const totalScore = player1Score + player2Score;

  const getBadges = (score: number) => {
    const badgeCount = Math.max(0, Math.floor(score / 10));
    return Array.from({ length: badgeCount }, () => null);
  };

  return (
    <div className="p-4 bg-muted rounded-lg">
      <div className="flex justify-around items-start">
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {leftPlayerName}
          </h3>
          <p className="text-3xl font-bold">{leftPlayerScore}</p>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {rightPlayerName}
          </h3>
          <p className="text-3xl font-bold">{rightPlayerScore}</p>
        </div>
      </div>
      <div className="text-center mt-4 pt-4 border-t">
        <h3 className="text-lg font-semibold">{t("totalScore")}</h3>
        <p className="text-3xl font-bold">{totalScore}</p>
        <div className="flex justify-center mt-2">
          {getBadges(totalScore).map((_, i) => (
            <Medal key={`badge-${i}`} className="h-6 w-6 text-yellow-500" />
          ))}
        </div>
      </div>
    </div>
  );
}
