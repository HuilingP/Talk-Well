"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function JoinRoomDialog() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const t = useTranslations("JoinRoomDialog");

  const handleJoinRoom = () => {
    if (roomCode.trim()) {
      router.push(`/room/${roomCode.trim()}`);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="w-full">
          {t("joinRoomButton")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="room-code" className="text-right">
              {t("roomCodeLabel")}
            </Label>
            <Input
              id="room-code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="col-span-3"
              maxLength={8}
              type="number"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleJoinRoom}>
            {t("submitButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
