import React from "react";
import { Accordion, AccordionContent, AccordionHeader, AccordionItem } from "~/components/Accordion";

interface QA {
  question: string;
  whyTheyAsk: string;
  strongAnswer: string;
  followUps?: string[];
}

const MockInterview: React.FC<{ questions: QA[]; jobTitle?: string }> = ({ questions, jobTitle }) => {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="w-full bg-white rounded-2xl shadow-md">
      <div className="px-4 pt-4">
        <h3 className="text-lg font-semibold text-gray-900">Interview Practice {jobTitle ? `for ${jobTitle}` : "(Based on Your Resume)"}</h3>
        <p className="text-sm text-gray-500">Questions are tailored from your resume and the provided job context.</p>
      </div>
      <div className="px-2 py-2">
        <Accordion allowMultiple>
          {questions.map((qa, idx) => (
            <AccordionItem key={String(idx)} id={`qa-${idx}`}>
              <AccordionHeader itemId={`qa-${idx}`} className="bg-white hover:bg-gray-50">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{qa.question}</span>
                  <span className="text-xs text-gray-500">Why they ask: {qa.whyTheyAsk}</span>
                </div>
              </AccordionHeader>
              <AccordionContent itemId={`qa-${idx}`}>
                <div className="space-y-2">
                  <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                    <span className="font-semibold">Strong answer: </span>
                    {qa.strongAnswer}
                  </div>
                  {qa.followUps?.length ? (
                    <div>
                      <div className="text-xs font-semibold text-gray-700 mb-1">Possible follow-ups</div>
                      <ul className="list-disc ml-5 space-y-1 text-xs text-gray-700">
                        {qa.followUps.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default MockInterview;
