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
  currentUsername?: string;
}

export function Scoreboard({
  player1Score,
  player2Score,
  currentUserId,
  roomCreatedById,
  player1Name,
  player2Name,
  currentUsername,
}: ScoreboardProps) {
  const t = useTranslations("Scoreboard");

  // Determine if current user is player1 (room creator) or player2
  const isCurrentUserPlayer1 = currentUserId === roomCreatedById;

  // Get opponent's name - if current user is player1, opponent is player2 and vice versa
  let opponentName = "对方";
  if (isCurrentUserPlayer1) {
    // Current user is player1, so opponent is player2
    opponentName = player2Name || "对方";
  } else {
    // Current user is player2, so opponent is player1
    opponentName = player1Name || "对方";
  }

  // Current user's name - prefer showing username if available
  const currentUserDisplayName = currentUsername || "我";

  // Determine display names and positions - left is opponent, right is current user
  const leftPlayerName = opponentName;
  const rightPlayerName = currentUserDisplayName;
  const leftPlayerScore = isCurrentUserPlayer1 ? player2Score : player1Score;
  const rightPlayerScore = isCurrentUserPlayer1 ? player1Score : player2Score;
  const totalScore = player1Score + player2Score;

  const getBadges = (score: number) => {
    const badgeCount = Math.max(0, Math.floor(score / 10));
    return Array.from({ length: badgeCount }, (_, index) => `badge-${score}-${index}`);
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
          {getBadges(totalScore).map(badgeKey => (
            <Medal key={badgeKey} className="h-6 w-6 text-yellow-500" />
          ))}
        </div>
      </div>
    </div>
  );
}
