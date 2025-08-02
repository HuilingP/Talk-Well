"use client";

import Link from "next/link";

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

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">
              Welcome to Psychological Game
            </CardTitle>
            <CardDescription className="pt-2">
              Explore the world of psychological games.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <Link href="/game/talkwell" passHref>
              <Button size="lg" className="w-full">
                好好说话 (TalkWell)
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
