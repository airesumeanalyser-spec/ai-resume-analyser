export const resumes: Resume[] = [
    {
        id: "1",
        companyName: "Google",
        jobTitle: "Frontend Developer",
        imagePath: "public/images/resume_01.png",
        resumePath: "/resumes/resume-1.pdf",
        feedback: {
            overallScore: 85,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "2",
        companyName: "Microsoft",
        jobTitle: "Cloud Engineer",
        imagePath: "public/images/resume_02.png",
        resumePath: "/resumes/resume-2.pdf",
        feedback: {
            overallScore: 55,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "3",
        companyName: "Apple",
        jobTitle: "iOS Developer",
        imagePath: "public/images/resume_03.png",
        resumePath: "/resumes/resume-3.pdf",
        feedback: {
            overallScore: 75,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
];

export const AIResponseFormat = `
  interface Feedback {
    overallScore: number; //max 100
    ATS: {
      score: number;
      tips: { type: "good" | "improve"; tip: string; }[]; // 2-3 items
    };

    toneAndStyle: CategoryFeedback;
    content: CategoryFeedback;
    structure: CategoryFeedback;
    skills: CategoryFeedback;

    mockInterview: {
      questions: {
        question: string;
        whyTheyAsk: string;
        strongAnswer: string;
        followUps?: string[]; // optional, 1-2 max
      }[]; // 8-10 items (reduced from 10-12)
    };
  }

  interface CategoryFeedback {
    score: number; //max 100
    tips: {
      type: "good" | "improve";
      tip: string; // short title (max 50 chars)
      explanation: string; // concise (max 150 chars)
    }[]; // 2-3 tips (reduced from 3-4)

    problems: {
      snippet: string;          // exact text from resume (max 100 chars)
      reason: string;           // why problematic (max 100 chars)
      suggestion: string;       // fix suggestion (max 150 chars)
      severity?: "low" | "med" | "high";
      page?: number;
      line?: number;
      sectionGuess?: string;    // e.g., "Experience", "Summary"
      source?: "JD" | "ATS";
    }[]; // 3-5 per category (reduced from 3-8)
  }`;

export const prepareInstructions = ({
                                        jobTitle,
                                        jobDescription,
                                    }: {
    jobTitle: string;
    jobDescription: string;
}) =>
    `You are an expert in ATS (Applicant Tracking System) and resume analysis.
  Analyze this resume and provide detailed feedback. Be thorough and honest with ratings.
  
  Job Title: ${jobTitle}
  Job Description: ${jobDescription}
  
  IMPORTANT: Return ONLY valid JSON (no markdown code fences, no extra text).
  Format: ${AIResponseFormat}
  
  Requirements:
  - Provide 2-3 tips per category (concise but specific)
  - Provide 3-5 problems per category with actionable suggestions
  - Include 8-10 mock interview questions (not 10-12, to save tokens)
  - Tag each problem with source: "JD" or "ATS"
  - Keep explanations under 2 sentences each
  - Use exact text snippets from resume where possible
  
  Return JSON only:`;
