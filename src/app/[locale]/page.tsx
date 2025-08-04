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
        <div className="w-full max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome to PsychologicalGame.com
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Master the art of communication and deepen your connections through engaging games.
          </p>
        </div>

        <div className="mt-10 w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">好好说话 (TalkWell)</CardTitle>
              <CardDescription className="pt-2">
                The first step to better conversations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/game/talkwell" passHref>
                <Button size="lg" className="w-full">
                  Play Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 w-full max-w-4xl mx-auto text-left">
          <h2 className="text-3xl font-bold text-center">Why Play Our Games?</h2>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resolve Conflict in Relationships</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Tired of misunderstandings? Our games are designed to help you and your partner learn how to navigate disagreements and resolve
                  {" "}
                  <strong>conflict in relationships</strong>
                  . Turn arguments into opportunities for growth.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Learn to Communicate Effectively</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Effective communication is key. We help you
                  {" "}
                  <strong>communicate</strong>
                  {" "}
                  better by providing tools and scenarios that foster understanding and empathy. Perfect for any
                  {" "}
                  <strong>couple game</strong>
                  {" "}
                  night.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-16 w-full max-w-4xl mx-auto text-left">
          <h2 className="text-3xl font-bold text-center">Mindgames, but the good kind.</h2>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>The Psychology of Games</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Explore the fascinating intersection of
                  {" "}
                  <strong>games and psychology</strong>
                  . Understand the
                  {" "}
                  <strong>mindgames</strong>
                  {" "}
                  people play and learn how to respond constructively. It's a fun
                  {" "}
                  <strong>relationship game</strong>
                  {" "}
                  that builds trust.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Bad Word Translator</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Ever said something you regret? Our unique
                  {" "}
                  <strong>bad word translator</strong>
                  {" "}
                  helps you rephrase hurtful words into constructive feedback. It's a tool to help you speak and be heard without causing pain.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-16 w-full max-w-4xl mx-auto text-left">
          <h2 className="text-3xl font-bold text-center">Perfect for Every Couple</h2>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Long Distance Relationship Game</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Bridge the distance with a game that keeps you connected. Our
                  {" "}
                  <strong>long distance relationship game</strong>
                  {" "}
                  is designed to create shared experiences and meaningful conversations, no matter how many miles apart you are.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Relationship-Boosting Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Inspired by the famous
                  {" "}
                  <strong>122 Relationship-Boosting Questions for Couples</strong>
                  , our game prompts you with questions that spark deep and meaningful conversations, helping you discover more about each other.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
