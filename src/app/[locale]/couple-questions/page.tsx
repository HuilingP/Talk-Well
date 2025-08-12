"use client";

import { coupleQuestions } from '~/lib/couple-questions-data';
import { Checkbox } from '~/components/ui/checkbox';
import { Button } from '~/components/ui/button';
import { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { useTranslations } from 'next-intl';

export default function CoupleQuestionsPage() {
  const t = useTranslations('CoupleQuestionsPage');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCheckboxChange = (question: string) => {
    setSelectedQuestions((prevSelected) =>
      prevSelected.includes(question)
        ? prevSelected.filter((q) => q !== question)
        : [...prevSelected, question]
    );
  };

  const handleGenerateCard = () => {
    if (cardRef.current) {
      toPng(cardRef.current)
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = 'couple-questions-card.png';
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error('oops, something went wrong!', err);
        });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
      <p className="mb-8">{t('description')}</p>
      <div className="space-y-4">
        {coupleQuestions.map((question: string, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <Checkbox
              id={`question-${index}`}
              onCheckedChange={() => handleCheckboxChange(question)}
            />
            <label
              htmlFor={`question-${index}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {question}
            </label>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <Button onClick={handleGenerateCard}>{t('generateCard')}</Button>
      </div>

      {selectedQuestions.length > 0 && (
        <div ref={cardRef} className="mt-8 p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">{t('ourQuestions')}</h2>
          <ul className="list-disc list-inside">
            {selectedQuestions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
