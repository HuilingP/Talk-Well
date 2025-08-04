"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ChatHistory } from "~/components/chat-history";
import { JoinRoomDialog } from "~/components/join-room-dialog";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export default function TalkwellPage() {
  const t = useTranslations("HomePage");
  const router = useRouter();

  const handleCreateRoom = () => {
    const roomCode = Math.floor(10000000 + Math.random() * 90000000).toString();
    router.push(`/room/${roomCode}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            好好说话 (TalkWell)
          </CardTitle>
          <CardDescription className="pt-2">
            这是一个关于沟通和理解的游戏。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-4">
          <Button size="lg" onClick={handleCreateRoom}>
            {t("createRoom")}
          </Button>
          <JoinRoomDialog />
          <Link href="/" passHref>
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
      <ChatHistory />
    </div>
  );
}
