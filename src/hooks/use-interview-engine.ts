import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

// Types for the interview flow
export interface InterviewState {
  emotion?: string;
  trigger?: string;
  expectation?: string;
  value?: string;
  thinking_pattern?: string;
  core_belief?: string;
  sensitivity?: string;
  pain_point?: string;
  relationship_pattern?: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface UseInterviewEngineReturn {
  // State
  currentQuestion: string | null;
  currentQuestionId: string | null;
  collectedFields: InterviewState;
  conversationHistory: ConversationMessage[];
  isLoading: boolean;
  error: string | null;
  isComplete: boolean;
  
  // Actions
  submitAnswer: (answer: string) => Promise<{ agentId: string; complete: boolean } | undefined>;
  reset: () => void;
  getProgress: () => number;
}

const REQUIRED_FIELDS: (keyof InterviewState)[] = [
  "emotion",
  "trigger",
  "expectation",
  "value",
  "thinking_pattern",
  "core_belief",
  "sensitivity",
  "pain_point",
  "relationship_pattern",
];

// Simple client-side mock interview sequence (used when backend is unavailable)
const MOCK_QUESTIONS: { id: string; question: string; field: keyof InterviewState }[] = [
  { id: "mock-q-1", question: "Let's start this journey together. What emotion or feeling has been on your mind lately?", field: "emotion" },
  { id: "mock-q-2", question: "Can you describe a recent trigger — what happened that brought up that feeling?", field: "trigger" },
  { id: "mock-q-3", question: "What expectation did you have in that situation that might have influenced your reaction?", field: "expectation" },
  { id: "mock-q-4", question: "What do you value most in relationships or interactions like that?", field: "value" },
  { id: "mock-q-5", question: "How do you usually think about or interpret events like this?", field: "thinking_pattern" },
  { id: "mock-q-6", question: "Is there a core belief that might underlie that thinking? (e.g. I'm not good enough)", field: "core_belief" },
  { id: "mock-q-7", question: "Are there sensitivities or boundaries that are important for you?", field: "sensitivity" },
  { id: "mock-q-8", question: "What's a pain point or recurring difficulty you notice in these situations?", field: "pain_point" },
  { id: "mock-q-9", question: "How would you describe your typical relationship pattern in these interactions?", field: "relationship_pattern" },
];

export function useInterviewEngine(): UseInterviewEngineReturn {
  // State
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [collectedFields, setCollectedFields] = useState<InterviewState>({});
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Check if interview is complete
  const isComplete = REQUIRED_FIELDS.every(field => collectedFields[field]);

  // Get collected fields progress
  const getProgress = useCallback(() => {
    const collected = REQUIRED_FIELDS.filter(field => collectedFields[field]).length;
    return Math.round((collected / REQUIRED_FIELDS.length) * 100);
  }, [collectedFields]);

  // Initialize interview (get first question)
  const initializeInterview = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectedFields: {} }),
      });

      if (!response.ok) {
        // If API is unavailable or returns non-ok, fall back to mock interview (client-side)
        // This allows frontend work without a running backend.
        console.warn("/api/interview/start returned non-ok, falling back to mock interview", response.status, response.statusText);
        // Initialize mock session
        const mockSessionId = `mock-${Date.now()}`;
        sessionIdRef.current = mockSessionId;
        const firstQuestion = MOCK_QUESTIONS[0].question;
        setCurrentQuestion(firstQuestion);
        setCurrentQuestionId(MOCK_QUESTIONS[0].id);
        setConversationHistory(prev => [
          ...prev,
          { role: "assistant", content: firstQuestion, timestamp: Date.now() },
        ]);
        return;
      }

      const data = await response.json();
      sessionIdRef.current = data.sessionId;
      setCurrentQuestion(data.question);
      setCurrentQuestionId(data.questionId);
      
      // Add question to history
      setConversationHistory(prev => [
        ...prev,
        {
          role: "assistant",
          content: data.question,
          timestamp: Date.now(),
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize on first render (client-side only)
  useEffect(() => {
    if (!currentQuestion && !isLoading && !error && !sessionIdRef.current) {
      initializeInterview();
    }
  }, [currentQuestion, isLoading, error, initializeInterview]); // Dependencies for proper re-execution

  // Submit answer and get next question
  const submitAnswer = useCallback(
    async (answer: string) => {
      if (!answer.trim() || !sessionIdRef.current) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Add user answer to history
        setConversationHistory(prev => [
          ...prev,
          {
            role: "user",
            content: answer,
            timestamp: Date.now(),
          },
        ]);

        // If this is a mock session (no backend), handle parsing and next-question client-side
        if (sessionIdRef.current?.startsWith("mock-")) {
          const curIndex = MOCK_QUESTIONS.findIndex(q => q.id === currentQuestionId);
          const currentMock = MOCK_QUESTIONS[curIndex >= 0 ? curIndex : 0];

          // Naive extraction: store the raw answer (trimmed) into the corresponding field
          const extractedFields: Partial<InterviewState> = {};
          if (currentMock && currentMock.field) {
            extractedFields[currentMock.field] = answer.trim().substring(0, 100);
          }

          if (Object.keys(extractedFields).length > 0) {
            setCollectedFields(prev => ({ ...prev, ...extractedFields }));
          }

          const updatedFields = { ...collectedFields, ...extractedFields };
          const allCollected = REQUIRED_FIELDS.every(field => updatedFields[field]);

          if (allCollected) {
            // Simulate building agent
            const agentId = `mock-agent-${Date.now()}`;
            setCurrentQuestion(null);
            toast.success("Interview complete! Starting chat with your mirror agent...");
            return { agentId, complete: true };
          } else {
            // Move to next mock question
            const nextIndex = Math.max(0, curIndex) + 1;
            const nextQ = MOCK_QUESTIONS[nextIndex] || null;
            if (nextQ) {
              setCurrentQuestion(nextQ.question);
              setCurrentQuestionId(nextQ.id);
              setConversationHistory(prev => [
                ...prev,
                { role: "assistant", content: nextQ.question, timestamp: Date.now() },
              ]);
            }
            return;
          }
        }

        // Parse response and extract fields (real backend)
        const parseResponse = await fetch("/api/interview/parse-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            userResponse: answer,
            currentQuestion,
            collectedFields,
          }),
        });

        if (!parseResponse.ok) {
          throw new Error(`Failed to parse response: ${parseResponse.statusText}`);
        }

        const parsedData = await parseResponse.json();
        
        // Update collected fields
        if (parsedData.extractedFields && Object.keys(parsedData.extractedFields).length > 0) {
          setCollectedFields(prev => ({
            ...prev,
            ...parsedData.extractedFields,
          }));
        }

        // Check if interview is complete
        const updatedFields = { ...collectedFields, ...parsedData.extractedFields };
        const allCollected = REQUIRED_FIELDS.every(field => updatedFields[field]);

        if (allCollected) {
          // All fields collected - build agent
          const buildAgentResponse = await fetch("/api/interview/build-agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: sessionIdRef.current,
              collectedFields: updatedFields,
            }),
          });

          if (!buildAgentResponse.ok) {
            throw new Error(`Failed to build agent: ${buildAgentResponse.statusText}`);
          }

          const agentData = await buildAgentResponse.json();
          
          // Interview complete
          setCurrentQuestion(null);
          toast.success("Interview complete! Starting chat with your mirror agent...");
          
          // Return agent ID so caller can redirect
          return { agentId: agentData.agentId, complete: true };
        } else {
          // Get next question
          const nextQuestionResponse = await fetch("/api/interview/next-question", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: sessionIdRef.current,
              collectedFields: updatedFields,
            }),
          });

          if (!nextQuestionResponse.ok) {
            throw new Error(`Failed to get next question: ${nextQuestionResponse.statusText}`);
          }

          const nextData = await nextQuestionResponse.json();
          setCurrentQuestion(nextData.question);
          setCurrentQuestionId(nextData.questionId);

          // Add next question to history
          setConversationHistory(prev => [
            ...prev,
            {
              role: "assistant",
              content: nextData.question,
              timestamp: Date.now(),
            },
          ]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [collectedFields, currentQuestion]
  );

  // Reset interview
  const reset = useCallback(() => {
    setCurrentQuestion(null);
    setCurrentQuestionId(null);
    setCollectedFields({});
    setConversationHistory([]);
    setError(null);
    sessionIdRef.current = null;
  }, []);

  return {
    currentQuestion,
    currentQuestionId,
    collectedFields,
    conversationHistory,
    isLoading,
    error,
    isComplete,
    submitAnswer,
    reset,
    getProgress,
  };
}
