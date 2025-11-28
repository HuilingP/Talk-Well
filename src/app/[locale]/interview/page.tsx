"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImmersiveInterview } from "~/components/immersive-interview";

export default function InterviewPage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleComplete = (agentId: string) => {
    setIsRedirecting(true);
    // Redirect to chat with the agent
    router.push(`/agent-chat/${agentId}`);
  };

  if (isRedirecting) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full" />
          </div>
          <p className="mt-4 text-slate-400">Loading your mirror agent...</p>
        </div>
      </div>
    );
  }

  return <ImmersiveInterview onComplete={handleComplete} />;
}
