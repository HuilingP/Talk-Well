import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface UseAgentChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  agentName: string | null;
  agentAvatar: string | null;
  
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
}

export function useAgentChat(agentId: string): UseAgentChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [agentAvatar, setAgentAvatar] = useState<string | null>(null);
  const loadedRef = useRef(false);

  // Load agent and initial messages
  useEffect(() => {
    if (loadedRef.current || !agentId) return;
    loadedRef.current = true;

    const loadAgent = async () => {
      try {
        setIsLoading(true);
        // If this is a mock agent (created in frontend), skip network calls
        if (agentId.startsWith("mock-agent-")) {
          setAgentName("Mirror Agent");
          setAgentAvatar(null);
          // Create a friendly initial greeting without calling the server
          const greeting = "Hi — I'm your mirror agent. I'm here to listen. What would you like to explore next?";
          const message: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: "assistant",
            content: greeting,
            timestamp: Date.now(),
          };
          setMessages([message]);
          return;
        }

        const response = await fetch(`/api/agent/${agentId}`);
        if (!response.ok) {
          throw new Error("Failed to load agent");
        }

        const data = await response.json();
        setAgentName(data.agent.name);
        setAgentAvatar(data.agent.avatar);

        // Load message history
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          // Send initial greeting from agent
          const greeting = await generateAgentMessage("", data.agent.systemPrompt, []);
          if (greeting) {
            const message: ChatMessage = {
              id: `msg-${Date.now()}`,
              role: "assistant",
              content: greeting,
              timestamp: Date.now(),
            };
            setMessages([message]);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgent();
  }, [agentId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !agentId) return;

      try {
        setError(null);
        
        // Add user message
        const userMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: "user",
          content,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        // Get agent response
            // If mock agent, generate a simple local response
            if (agentId.startsWith("mock-agent-")) {
              // Simple echo/reflective response for mock
              const reply = `I hear you say: "${content}". Tell me more about why that matters to you.`;
              const assistantMessage: ChatMessage = {
                id: `msg-${Date.now() + 1}`,
                role: "assistant",
                content: reply,
                timestamp: Date.now(),
              };
              setMessages(prev => [...prev, assistantMessage]);
              return;
            }

            const response = await fetch(`/api/agent/${agentId}/chat`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userMessage: content,
                conversationHistory: messages,
              }),
            });

            if (!response.ok) {
              throw new Error("Failed to get response from agent");
            }

            const data = await response.json();
        
            const assistantMessage: ChatMessage = {
              id: `msg-${Date.now() + 1}`,
              role: "assistant",
              content: data.response,
              timestamp: Date.now(),
            };

            setMessages(prev => [...prev, assistantMessage]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [agentId, messages]
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    agentName,
    agentAvatar,
    sendMessage,
    clearHistory,
  };
}

// Helper function to generate agent message (for initial greeting)
async function generateAgentMessage(
  userMessage: string,
  systemPrompt: string,
  conversationHistory: ChatMessage[]
): Promise<string> {
  try {
    const response = await fetch("/api/agent/generate-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userMessage,
        systemPrompt,
        conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate message");
    }

    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error("Error generating agent message:", error);
    return "I'm here to listen and help you understand yourself better. What's on your mind?";
  }
}
