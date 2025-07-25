"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Footer } from "~/components/layout/footer";
import { Header } from "~/components/layout/header";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { JoinRoomDialog } from "~/components/join-room-dialog";
import { ChatHistory } from "~/components/chat-history";

export default function HomePage() {
  const t = useTranslations("HomePage");
  const router = useRouter();

  const handleCreateRoom = () => {
    const roomCode = Math.floor(10000000 + Math.random() * 90000000).toString();
    router.push(`/room/${roomCode}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">
              {t("title")}
            </CardTitle>
            <CardDescription className="pt-2">
              {t("description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <Button size="lg" onClick={handleCreateRoom}>
              {t("createRoom")}
            </Button>
            <JoinRoomDialog />
          </CardContent>
        </Card>
        <ChatHistory />
      </main>
      <Footer />
    </div>
  );
}
