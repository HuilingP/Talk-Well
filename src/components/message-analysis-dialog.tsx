"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { ReactNode } from "react";

interface MessageAnalysisDialogProps {
  children: ReactNode;
}

export function MessageAnalysisDialog({ children }: MessageAnalysisDialogProps) {
  const t = useTranslations("MessageAnalysisDialog");

  // Mock data for the analysis
  const mockAnalysis = {
    isCrossNet: t("mock.isCrossNet"),
    senderState: t("mock.senderState"),
    receiverImpact: t("mock.receiverImpact"),
    evidence: t("mock.evidence"),
    suggestion: t("mock.suggestion"),
    risk: t("mock.risk"),
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <h4 className="font-semibold">{t("crossNetJudgment.title")}</h4>
            <p>{mockAnalysis.isCrossNet}</p>
          </div>
          <div>
            <h4 className="font-semibold">{t("detailedAnalysis.title")}</h4>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>
                <strong>{t("detailedAnalysis.senderState")}:</strong> {mockAnalysis.senderState}
              </li>
              <li>
                <strong>{t("detailedAnalysis.receiverImpact")}:</strong> {mockAnalysis.receiverImpact}
              </li>
              <li>
                <strong>{t("detailedAnalysis.evidence")}:</strong> {mockAnalysis.evidence}
              </li>
              <li>
                <strong>{t("detailedAnalysis.suggestion")}:</strong> {mockAnalysis.suggestion}
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">{t("riskAssessment.title")}</h4>
            <p>
              <span className="font-bold">{mockAnalysis.risk}</span> - {t("riskAssessment.description")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
