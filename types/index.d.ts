interface Job {
    title: string;
    description: string;
    location: string;
    requiredSkills: string[];
}

interface Resume {
    id: string;
    companyName?: string;
    jobTitle?: string;
    imagePath: string;
    resumePath: string;
    feedback: Feedback;
}

interface CategoryProblem {
    snippet: string;
    reason: string;
    suggestion: string;
    severity?: "low" | "med" | "high";
    page?: number;
    line?: number;
    sectionGuess?: string;
    source?: "JD" | "ATS"; // mapping tag for improvement suggestions
}

interface CategoryFeedback {
    score: number;
    tips: { type: "good" | "improve"; tip: string; explanation: string; }[];
    problems?: CategoryProblem[];
}

interface Feedback {
    overallScore: number;
    ATS: {
        score: number;
        tips: { type: "good" | "improve"; tip: string; }[];
    };
    toneAndStyle: CategoryFeedback;
    content: CategoryFeedback;
    structure: CategoryFeedback;
    skills: CategoryFeedback;
    mockInterview?: {
        questions: {
            question: string;
            whyTheyAsk: string;
            strongAnswer: string;
            followUps?: string[];
        }[];
    };
}