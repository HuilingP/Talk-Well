"use client";

import { useTranslations } from "next-intl";
import { use, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Header } from "~/components/layout/header";
import { Footer } from "~/components/layout/footer";
import { cn } from "~/lib/utils/cn";
import { Scoreboard } from "~/components/scoreboard";
import { MessageAnalysisDialog } from "~/components/message-analysis-dialog";

interface Message {
  user: "You" | "Friend";
  text: string;
}

interface ChatSession {
  id: string;
  messages: Message[];
  player1Score: number;
  player2Score: number;
  timestamp: number;
}

export default function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("RoomPage");
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [newMessage, setNewMessage] = useState("");
  const [hasInteracted, setHasInteracted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    // Try to load active session first
    let sessionData: ChatSession | null = null;
    const activeSession = localStorage.getItem(`chat_session_${id}`);

    if (activeSession) {
      sessionData = JSON.parse(activeSession);
    } else {
      // If no active session, try to load from history
      const history = JSON.parse(localStorage.getItem("chat_history") || "[]");
      const historicalSession = history.find(
        (s: ChatSession) => s.id === id
      );
      if (historicalSession) {
        sessionData = historicalSession;
      }
    }

    if (sessionData) {
      setMessages(sessionData.messages);
      setPlayer1Score(sessionData.player1Score);
      setPlayer2Score(sessionData.player2Score);
    } else {
      // Start with initial messages if no session is saved anywhere
      setMessages([
        { user: "Friend", text: "Hey, how are you?" },
        { user: "You", text: "I'm good, thanks! How about you?" },
        { user: "Friend", text: "Doing great! Just enjoying the day." },
      ]);
    }
  }, [id]);

  // Save to localStorage on change, only after user interaction
  useEffect(() => {
    if (hasInteracted) {
      const session: ChatSession = {
        id,
        messages,
        player1Score,
        player2Score,
        timestamp: Date.now(),
      };
      localStorage.setItem(`chat_session_${id}`, JSON.stringify(session));
    }
  }, [id, messages, player1Score, player2Score, hasInteracted]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;

    if (!hasInteracted) {
      setHasInteracted(true);
    }

    const userMessage: Message = { user: "You", text: newMessage };
    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");

    setPlayer1Score((prev) => prev + (Math.random() > 0.3 ? 1 : -1));

    setTimeout(() => {
      const friendMessage: Message = {
        user: "Friend",
        text: "That's cool! What are you up to?",
      };
      setMessages((prev) => [...prev, friendMessage]);
      setPlayer2Score((prev) => prev + (Math.random() > 0.3 ? 1 : -1));
    }, 1000);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleExitRoom = () => {
    const session: ChatSession = {
      id,
      messages,
      player1Score,
      player2Score,
      timestamp: Date.now(),
    };

    const history = JSON.parse(localStorage.getItem("chat_history") || "[]");
    const existingIndex = history.findIndex((s: ChatSession) => s.id === id);

    if (existingIndex > -1) {
      history[existingIndex] = session;
    } else {
      history.push(session);
    }

    localStorage.setItem("chat_history", JSON.stringify(history));
    localStorage.removeItem(`chat_session_${id}`);
    router.push("/");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl flex flex-col">
          <CardHeader className="relative">
            <CardTitle className="text-center">{t("title")} {id}</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
              onClick={handleExitRoom}
            >
              <X className="h-6 w-6" />
            </Button>
          </CardHeader>
          <Scoreboard player1Score={player1Score} player2Score={player2Score} />
          <CardContent className="flex-grow space-y-4 h-96 overflow-y-auto p-6">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-end gap-2",
                  msg.user === "You" ? "justify-end" : "justify-start"
                )}
              >
                <MessageAnalysisDialog>
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-xs lg:max-w-md cursor-pointer",
                      msg.user === "You"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p>{msg.text}</p>
                  </div>
                </MessageAnalysisDialog>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>
          <CardFooter className="flex gap-2 p-4 border-t">
            <Input
              placeholder={t("messagePlaceholder")}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button onClick={handleSendMessage}>{t("sendButton")}</Button>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
