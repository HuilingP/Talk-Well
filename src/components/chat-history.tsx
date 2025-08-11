"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

interface ChatSession {
  id: string;
  timestamp: number;
}

export function ChatHistory() {
  const t = useTranslations("ChatHistory");
  const [history] = useState<ChatSession[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    const savedHistory = localStorage.getItem("chat_history");
    return savedHistory ? JSON.parse(savedHistory) : [];
  });

  if (history.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mt-8">
      <CardHeader>
        <CardTitle className="text-center">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {history
          .sort((a, b) => b.timestamp - a.timestamp)
          .map(session => (
            <Link
              key={session.id}
              href={`/room/${session.id}`}
              className="block p-4 border rounded-lg hover:bg-muted"
            >
              <p>
                {t("room")}
                {" "}
                {session.id}
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(session.timestamp).toLocaleString()}
              </p>
            </Link>
          ))}
      </CardContent>
    </Card>
  );
}
