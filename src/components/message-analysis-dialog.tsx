"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

interface MessageAnalysisDialogProps {
  children: ReactNode;
  messageId?: string;
}

interface Analysis {
  isCrossNet: string;
  senderState: string;
  receiverImpact: string;
  evidence: string;
  suggestion: string;
  risk: string;
}

export function MessageAnalysisDialog({ children, messageId }: MessageAnalysisDialogProps) {
  const t = useTranslations("MessageAnalysisDialog");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch analysis data when messageId is provided
  useEffect(() => {
    if (!messageId) {
      return;
    }

    const fetchAnalysis = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/message/analyze/${messageId}`);
        if (response.ok) {
          const data = await response.json();
          setAnalysis(data.analysis);
        } else {
          throw new Error("Failed to fetch analysis");
        }
      } catch (err) {
        console.error("Error fetching message analysis:", err);
        setError("Failed to load analysis");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [messageId]);

  // Mock data for messages without analysis or when loading fails
  const mockAnalysis = {
    isCrossNet: t("mock.isCrossNet"),
    senderState: t("mock.senderState"),
    receiverImpact: t("mock.receiverImpact"),
    evidence: t("mock.evidence"),
    suggestion: t("mock.suggestion"),
    risk: t("mock.risk"),
  };

  const displayAnalysis = analysis || mockAnalysis;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isLoading
            ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading analysis...</span>
                </div>
              )
            : error
              ? (
                  <div className="text-center py-8 text-red-500">
                    <p>{error}</p>
                    <p className="text-sm text-gray-500 mt-2">Showing mock data instead</p>
                  </div>
                )
              : (
                  <div className="text-sm text-green-600 mb-2">
                    {analysis ? "✓ Real-time analysis" : "Mock analysis data"}
                  </div>
                )}

          <div>
            <h4 className="font-semibold">{t("crossNetJudgment.title")}</h4>
            <p className={`${displayAnalysis.isCrossNet === "Yes" ? "text-green-600" : "text-red-600"} font-medium`}>
              {displayAnalysis.isCrossNet}
            </p>
          </div>

          <div>
            <h4 className="font-semibold">{t("detailedAnalysis.title")}</h4>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>
                  {t("detailedAnalysis.senderState")}
                  :
                </strong>
                {" "}
                <span className={`${
                  displayAnalysis.senderState.toLowerCase().includes("positive")
                    ? "text-green-600"
                    : displayAnalysis.senderState.toLowerCase().includes("negative")
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
                >
                  {displayAnalysis.senderState}
                </span>
              </li>
              <li>
                <strong>
                  {t("detailedAnalysis.receiverImpact")}
                  :
                </strong>
                {" "}
                <span className={`${
                  displayAnalysis.receiverImpact.toLowerCase().includes("positive")
                    ? "text-green-600"
                    : displayAnalysis.receiverImpact.toLowerCase().includes("negative")
                      ? "text-red-600"
                      : "text-gray-600"
                }`}
                >
                  {displayAnalysis.receiverImpact}
                </span>
              </li>
              <li>
                <strong>
                  {t("detailedAnalysis.evidence")}
                  :
                </strong>
                {" "}
                <span className="text-gray-700">
                  {displayAnalysis.evidence}
                </span>
              </li>
              <li>
                <strong>
                  {t("detailedAnalysis.suggestion")}
                  :
                </strong>
                {" "}
                <span className="text-blue-600">
                  {displayAnalysis.suggestion}
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">{t("riskAssessment.title")}</h4>
            <p>
              <span className={`font-bold ${
                displayAnalysis.risk === "Low"
                  ? "text-green-600"
                  : displayAnalysis.risk === "High"
                    ? "text-red-600"
                    : "text-yellow-600"
              }`}
              >
                {displayAnalysis.risk}
              </span>
              {" "}
              -
              {" "}
              {t("riskAssessment.description")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
