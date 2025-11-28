"use client";

import {
  ArrowRight,
  BookHeart,
  Gamepad2,
  Globe,
  HeartHandshake,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Footer } from "~/components/layout/footer";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

const features = [
  {
    icon: <HeartHandshake className="h-10 w-10" />,
    title: "Resolve Conflict & Rebuild Intimacy",
    description:
      "Our \"Talk Well\" app uses proven psychology to help you communicate more effectively, turning arguments into opportunities for deeper understanding.",
  },
  {
    icon: <Sparkles className="h-10 w-10" />,
    title: "Learn Gentle Expression",
    description:
      "Our bad word translator helps you convert negative emotions into constructive expressions, making every conversation a bridge to better understanding.",
  },
  {
    icon: <Gamepad2 className="h-10 w-10" />,
    title: "Gamified Psychology Learning",
    description:
      "Through interactive exercises, we make learning communication skills fun. Master empathy and emotional intelligence in an enjoyable atmosphere.",
  },
  {
    icon: <Globe className="h-10 w-10" />,
    title: "For Long-Distance Couples",
    description:
      "Our relationship games help you maintain deep connection even across thousands of miles, resolving misunderstandings caused by physical separation.",
  },
  {
    icon: <BookHeart className="h-10 w-10" />,
    title: "Deep Conversation Guide",
    description:
      "We've curated 122 relationship-boosting questions to guide couples into deeper conversations, enhancing mutual understanding and emotional bonds.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 bg-white dark:bg-gray-900">
          <div className="container mx-auto text-center px-4">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-gray-900 dark:text-gray-50">
              Master the Art of Communication
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300">
              Transform your relationships with psychology-based games. Deepen
              your connections and turn conflicts into growth opportunities.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/game/talkwell" passHref>
                <Button size="lg" className="group">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-50">
                Why Choose TalkWell?
              </h2>
              <p className="mt-3 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
                We combine psychological theory with practical techniques to
                create a personalized growth plan for every couple.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map(feature => (
                <Card
                  key={feature.title}
                  className="transform transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl bg-white dark:bg-gray-900"
                >
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl font-bold">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 md:py-28 bg-white dark:bg-gray-900">
          <div className="container mx-auto space-y-6">
            {/* Primary CTA */}
            <Card className="bg-primary text-primary-foreground shadow-lg">
              <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-12">
                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-bold">
                    Start Your Communication Growth Journey Today
                  </h2>
                  <p className="mt-2 text-lg text-primary-foreground/80">
                    Experience our free communication assessment now to discover
                    your relationship's strengths and opportunities.
                  </p>
                </div>
                <div className="mt-6 md:mt-0 md:ml-6">
                  <Link href="/game/talkwell" passHref>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="group w-full"
                    >
                      Play Now for Free
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* Mirror Agent CTA */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 border border-slate-700 shadow-lg">
              <div className="flex flex-col md:flex-row items-center justify-between p-8 md:p-12">
                <div className="text-center md:text-left">
                  <h2 className="text-3xl font-bold">
                    Meet Your Mirror Self
                  </h2>
                  <p className="mt-2 text-lg text-slate-300">
                    Have a deep, personalized conversation with your mirror agent created through an immersive interview experience.
                  </p>
                </div>
                <div className="mt-6 md:mt-0 md:ml-6">
                  <Link href="/interview" passHref>
                    <Button
                      size="lg"
                      className="group w-full bg-gradient-to-r from-cyan-500 to-primary hover:from-cyan-500/90 hover:to-primary/90"
                    >
                      Start Interview
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
