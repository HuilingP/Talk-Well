"use client";

import { Medal } from "lucide-react";
import { useTranslations } from "next-intl";

interface ScoreboardProps {
  player1Score: number;
  player2Score: number;
}

export function Scoreboard({ player1Score, player2Score }: ScoreboardProps) {
  const t = useTranslations("Scoreboard");
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
            {t("player1")}
            {" "}
            (You)
          </h3>
          <p className="text-3xl font-bold">{player1Score}</p>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {t("player2")}
            {" "}
            (Friend)
          </h3>
          <p className="text-3xl font-bold">{player2Score}</p>
        </div>
      </div>
      <div className="text-center mt-4 pt-4 border-t">
        <h3 className="text-lg font-semibold">{t("totalScore")}</h3>
        <p className="text-3xl font-bold">{totalScore}</p>
        <div className="flex justify-center mt-2">
          {getBadges(totalScore).map((_, i) => (
            <Medal key={i} className="h-6 w-6 text-yellow-500" />
          ))}
        </div>
      </div>
    </div>
  );
}
