"use client";

import { useParams } from "next/navigation";
import { AgentChat } from "~/components/agent-chat";

export default function AgentChatPage() {
  const params = useParams();
  const agentId = params.agentId as string;

  if (!agentId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <p className="text-slate-400">Invalid agent ID</p>
      </div>
    );
  }

  return <AgentChat agentId={agentId} />;
}
