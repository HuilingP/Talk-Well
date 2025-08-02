import type { Metadata } from "next";
import { ChevronRight, Github, GraduationCap, Shield, Sparkles } from "lucide-react";
import Image from "next/image";
import { JsonLd } from "~/components/JsonLd";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyLead,
  TypographyP,
  TypographySmall,
} from "~/components/ui/typography";
import { Link } from "~/lib/i18n/navigation";
import { createAlternates } from "~/lib/utils";
import { createOrganizationJsonLd } from "~/lib/utils/jsonld";

import { Container } from "../components/container";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  // 确保params已经被解析
  const { locale } = await params;

  return {
    title: "About Us | tennis-voice-chat",
    // TODO: Update the description
    description: "About tennis-voice-chat - A Next.js boilerplate.",
    alternates: createAlternates("/about-us", locale),
  };
}

export default function AboutUsPage() {
  const organizationJsonLd = createOrganizationJsonLd();
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="flex flex-col min-h-screen py-12">
      <JsonLd data={organizationJsonLd} />

      <Container className="space-y-12 max-w-4xl mx-auto">
        {/* Header */}
        <div className="space-y-6">
          <div className="flex items-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span>About Us</span>
          </div>

          <TypographyH1>About Us</TypographyH1>
          <TypographyLead>
            At PsychologicalGame, we believe that understanding ourselves and others is the key to building stronger, more meaningful relationships.
          </TypographyLead>
          <TypographySmall className="text-muted-foreground">
            Last Updated:
            {" "}
            {lastUpdated}
          </TypographySmall>
        </div>

        {/* Introduction */}
        <section className="space-y-4">
          <TypographyP>
            Our journey began with a simple observation: traditional psychology can feel intimidating or overly academic for many people. We saw an opportunity to bridge this gap by transforming evidence-based psychological principles into interactive, enjoyable experiences that anyone can understand and benefit from.
            Today, we're proud to serve a global community of individuals who are curious about human behavior, eager to improve their relationships, and committed to personal growth through psychological understanding.
          </TypographyP>
        </section>

        {/* Our Mission */}
        <section className="space-y-4">
          <TypographyH2>Our Mission</TypographyH2>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border bg-card">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <TypographyH3 className="text-xl font-medium">Discover Yourself</TypographyH3>
                <TypographyP className="mt-2 text-muted-foreground">
                  Explore your personality traits, communication style, emotional patterns, and cognitive preferences through scientifically-backed assessments presented in an engaging, game-like format.
                </TypographyP>
              </CardContent>
            </Card>

            <Card className="border bg-card">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <TypographyH3 className="text-xl font-medium">Understand Others</TypographyH3>
                <TypographyP className="mt-2 text-muted-foreground">
                  Gain insights into different personality types, learning styles, and behavioral patterns to improve your relationships with family, friends, colleagues, and romantic partners.
                </TypographyP>
              </CardContent>
            </Card>

            <Card className="border bg-card">
              <CardContent className="pt-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <TypographyH3 className="text-xl font-medium">Learn Continuously</TypographyH3>
                <TypographyP className="mt-2 text-muted-foreground">
                  Access a growing library of psychological tools, each designed to address different aspects of human behavior and interpersonal dynamics.
                </TypographyP>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* About Our Platform */}
        <section className="space-y-4">
          <TypographyH2>About Our Platform</TypographyH2>

          <TypographyP>
            Our platform is built with user experience in mind – intuitive navigation, mobile-friendly design, and results that are both insightful and easy to understand, regardless of your background in psychology.
          </TypographyP>

          <TypographyH3 className="mt-4">Our Approach</TypographyH3>
          <TypographyP>
            Peace Language Generator and the Misunderstanding Translator.
          </TypographyP>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Science-Based Foundation</strong>
              {" "}
              - Every game and tool on our platform is grounded in established psychological research and theories. We work with licensed psychologists and researchers to ensure accuracy and validity in our assessments.
            </li>
            <li>
              <strong>Practical Application</strong>
              {" "}
              - Our tools don't just provide insights; they offer actionable strategies. Each result includes personalized recommendations for improving communication, resolving conflicts, and building stronger relationships.
            </li>
            <li>
              <strong>Inclusive Design</strong>
              {" "}
              - We create experiences that are accessible to people of all backgrounds, education levels, and cultural contexts. Our language is clear, our examples are diverse, and our tools are designed to celebrate human differences rather than categorize them rigidly.
            </li>
            <li>
              <strong>Continuous Improvement</strong>
              {" "}
              - We actively listen to our community's feedback, regularly updating our tools and developing new ones based on user needs and emerging psychological research.
            </li>
            <li>
              <strong>Gamification for Engagement</strong>
              {" "}
              - We believe learning about psychology should be enjoyable, not overwhelming. By incorporating game elements – interactive questions, visual results, progress tracking, and shareable outcomes – we make psychological exploration feel natural and fun.
            </li>
          </ul>
        </section>

        {/* Revenue Model */}
        <section className="space-y-4">
          <TypographyH2>Our Revenue Model</TypographyH2>

          <TypographyP>
            PsychologicalGame operates on a donation-based model because we believe that psychological insights should be accessible to everyone, regardless of their financial situation.
          </TypographyP>

          <div className="mt-4 space-y-2">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-medium text-sm">1</span>
                </div>
              </div>
              <div>
                <strong>Community-driven</strong>
                : We are a community-driven project and welcome contributions from everyone.
              </div>
            </div>
          </div>

          <TypographyP className="mt-4">
            Beyond financial support, we deeply value user feedback and suggestions.
          </TypographyP>
        </section>

        {/* About the Developer */}
        <section className="space-y-4">
          <TypographyH2>About the Developer</TypographyH2>

          <div className="flex flex-col md:flex-row gap-8 items-center p-6 border rounded-lg bg-card">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-primary/20">
                <Image
                  src="https://avatars.githubusercontent.com/u/114465654?s=400&u=a56371d278e914146eb1f0c95a0c918cf7629bac&v=4"
                  alt="Huiling"
                  width={112}
                  height={112}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div>
                <TypographyH3 className="text-xl font-medium">Huiling</TypographyH3>
                <p className="text-muted-foreground">Creator & Developer</p>
              </div>
              <TypographyP>
                On the way to being founder of something wonderful
              </TypographyP>
              <div className="pt-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com/huilingp" target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="space-y-4">
          <TypographyH2>Contact Information</TypographyH2>

          <TypographyP>
            If you have any questions, suggestions, or feedback, please contact us at
            {" "}
            {/* TODO: Replace with your own email */}
            <a
              href="mailto:alinpan257@gmail.com"
              className="text-primary hover:underline"
            >
              alinpan257@gmail.com
            </a>
            .
          </TypographyP>

          <TypographyP>
            You can also find the project on GitHub:
            {" "}
            <a
              href="https://github.com/huilingp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center"
            >
              <Github className="mr-1 h-4 w-4" />
              github.com/huilingp
            </a>
          </TypographyP>
        </section>

        {/* Acceptance */}
        <section className="py-4 border-t border-border">
          <TypographyP className="text-center text-muted-foreground">
            By using psychological game, you acknowledge that you have read and understood our Terms of Use and Privacy Policy.
          </TypographyP>
        </section>
      </Container>
    </main>
  );
}
