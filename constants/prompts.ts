/**
 * Prompt Templates for Resume Analysis
 * 
 * These templates provide structured prompts for consistent AI analysis
 */

/**
 * Resume Analysis Sections
 */
export const RESUME_SECTIONS = [
    'Contact Information',
    'Professional Summary',
    'Work Experience',
    'Education',
    'Skills',
    'Certifications',
    'Projects',
    'Awards',
    'Publications',
    'Volunteer Work',
] as const;

/**
 * ATS Scoring Criteria
 */
export const ATS_CRITERIA = {
    formatting: {
        weight: 20,
        factors: [
            'Clean, simple layout without tables or complex formatting',
            'Standard fonts (Arial, Calibri, Times New Roman)',
            'No headers/footers with critical information',
            'No images or graphics',
            'Standard section headings',
            'Consistent formatting throughout',
        ],
    },
    keywords: {
        weight: 30,
        factors: [
            'Job-relevant keywords present',
            'Industry-specific terminology',
            'Technical skills mentioned',
            'Action verbs in experience',
            'Quantifiable achievements',
        ],
    },
    structure: {
        weight: 25,
        factors: [
            'Clear section organization',
            'Reverse chronological order',
            'Complete contact information',
            'Professional summary included',
            'Relevant sections present',
        ],
    },
    content: {
        weight: 25,
        factors: [
            'Relevant experience highlighted',
            'Measurable achievements',
            'No gaps in employment',
            'Appropriate length (1-2 pages)',
            'No typos or grammatical errors',
        ],
    },
};

/**
 * Comprehensive Resume Analysis Prompt (MBA Resume Tweaker Framework)
 * 
 * Analyzes resume against JD using ISB/IIMA standards with zero hallucination principle
 */
export function buildAnalysisPrompt(
    resumeText: string,
    jobDescription: string
): string {
    return `You are an expert MBA résumé analyst and recruiter specializing in JD-candidate alignment for top-tier business schools (ISB, IIMs, INSEAD, NTU).

Your task is to analyze the candidate's résumé against the provided Job Description (JD) following ISB/IIMA one-page résumé standards, with strict adherence to the zero hallucination principle.

---
**ANALYSIS FRAMEWORK (Total 100 points)**

**1. JD Alignment & Functional Fit (35 points)**
- Assess how well résumé experience aligns with JD's core responsibilities
- Match against functional domains: Consulting, Sales, Operations, Finance, Product Management, Pre-Sales, General Management
- Evaluate seniority alignment and relevant project exposure

**2. Quantification & Measurable Impact (30 points)**
- Verify all claims include metrics: %, ₹/$, #, or time reduction
- Assess quality of quantified achievements (%, revenue, efficiency gains, scale)
- Check for factual grounding and verifiable metrics

**3. Keywords & Terminology Relevance (20 points)**
- Match critical JD keywords present in résumé
- Identify missing mandatory skills/experience from JD
- Assess industry-standard terminology alignment

**4. Structure & Presentation (15 points)**
- One-page format compliance
- Clear section hierarchy: CAREER SUMMARY, EDUCATION, WORK EXPERIENCE, KEY PROJECTS, CORE COMPETENCIES, AWARDS & LEADERSHIP
- Concise bullet points (12–20 words)
- Business-professional tone maintained

---
**JOB DESCRIPTION (JD):**
${jobDescription}

---
**CANDIDATE RESUME:**
${resumeText}

---
**OUTPUT FORMAT (Strict JSON):**
{
  "total_match_score": <number 0-100>,
  "score_breakdown": {
    "jd_alignment": {
      "score": <0-35>,
      "feedback": "<Specific alignment analysis against JD responsibilities and functional domain>"
    },
    "quantification": {
      "score": <0-30>,
      "feedback": "<Assessment of metrics quality, factual grounding, and measurable impact>"
    },
    "keywords_relevance": {
      "score": <0-20>,
      "feedback": "<Keywords present vs. missing, mandatory requirements analysis>"
    },
    "structure_presentation": {
      "score": <0-15>,
      "feedback": "<Format compliance, section hierarchy, tone consistency>"
    }
  },
  "critical_findings": {
    "functional_match": "<Consulting|Sales|Operations|Finance|Product Management|Pre-Sales|General Management>",
    "years_of_relevant_experience": "<Extracted from resume>",
    "quantified_achievements_count": <number>,
    "missing_mandatory_skills": ["<skill1>", "<skill2>", "<skill3>"]
  },
  "optimization_priorities": [
    {
      "priority": "<Critical|High|Medium>",
      "area": "<JD Alignment|Quantification|Keywords|Structure>",
      "actionable_suggestion": "<Specific change to improve score>"
    }
  ],
  "verdict": "<Brief 1-2 sentence assessment of candidate's fit for the JD with zero hallucination principle>"
}

**CRITICAL RULES:**
1. Zero hallucination: Only analyze verifiable content in the résumé
2. Quantification focus: Every achievement must have measurable impact
3. Factual grounding: No invented metrics or assumed experience
4. JD-centric: Measure alignment strictly against provided JD
5. MBA standard: Apply ISB/IIMA one-page résumé quality benchmark

Return ONLY valid JSON. No explanations or markdown formatting outside JSON strings.`;
}


/**
 * Section-Specific Feedback Prompt (MBA Resume Tweaker Framework)
 * 
 * Provides targeted feedback on specific résumé sections with JD alignment focus
 */
export function buildFeedbackPrompt(
    resumeText: string,
    section: string,
    specificQuestion?: string
): string {
    return `You are an expert MBA résumé coach specializing in JD-aligned résumé optimization following ISB/IIMA standards.

Your task is to provide rigorous, actionable feedback on the **${section}** section of this candidate's résumé.

---
**ANALYSIS FRAMEWORK**

**1. Functional Alignment (40%)**
- How well does this section align with JD responsibilities?
- Are there missed opportunities to highlight relevant experience?
- Could content be reordered or rephrased for greater impact?

**2. Quantification & Measurable Impact (35%)**
- Does every bullet point demonstrate tangible business impact?
- Are metrics specific: %, ₹/$, #, time reduction, or scale?
- Are claims verifiable and factually grounded?

**3. Language & Presentation (25%)**
- Use of impact-oriented action verbs?
- Concise bullet points (12–20 words)?
- Business-professional tone maintained?
- Clear section hierarchy and formatting?

---
**${section.toUpperCase()} SECTION CONTENT:**
${resumeText}

${specificQuestion ? `**SPECIFIC QUESTION:**\n${specificQuestion}\n\n` : ''}---
**ANALYSIS TASK**

Provide structured feedback in four parts:

**1. STRENGTHS (What's Working)**
- Specific elements demonstrating strong JD alignment
- Well-quantified achievements with verifiable metrics
- Effective use of action verbs and business language
- Clear formatting and section hierarchy
- Cite exact examples from the section

**2. CRITICAL GAPS (What Needs Improvement)**
- Vague or generic descriptions lacking specificity
- Missing quantification or measurable business impact
- Underutilized achievements that could highlight functional domain expertise
- Weak action verbs that don't convey impact
- Missing keywords or terminology from JD

**3. TRANSFORMATION OPPORTUNITIES (Before/After Examples)**
Provide 2–3 specific rewrite examples:

**Before:** [Original bullet from resume]
**Analysis:** [What's missing or weak]
**After:** [Rewritten bullet with JD alignment + quantification]

**4. ACTIONABLE IMPROVEMENTS (Priority Ranking)**
Top 3–5 specific changes ranked by impact:
- Priority: Critical|High|Medium
- Specific rewrite suggestion
- Expected improvement

---
**OUTPUT FORMAT**

Use Markdown with headers and bullet points.
Keep response between 400–600 words.
Maintain professional, objective tone.
Focus on practical, implementable changes.
All suggestions must be zero-hallucination (no invented metrics or experience).

Begin your analysis:`;
}


/**
 * Keyword Analysis Prompt (MBA Resume Tweaker Framework)
 * 
 * Identifies JD-aligned keywords for optimal résumé optimization
 */
export function buildKeywordPrompt(
    resumeText: string,
    jobDescription: string
): string {
    return `You are an expert MBA résumé analyst and keyword optimization specialist.

Your task is to identify high-value keywords and phrases that bridge the candidate's experience with the Job Description (JD) requirements.

---
**JOB DESCRIPTION:**
${jobDescription}

---
**CANDIDATE RESUME:**
${resumeText}

---
**KEYWORD ANALYSIS TASK**

Identify 12–18 high-value keywords/phrases strategically ranked by impact. Focus on:

**1. CRITICAL MISSING KEYWORDS (High Priority)**
- Keywords from JD explicitly stated as mandatory that are absent from résumé
- Industry-standard terminology for the functional domain (Consulting, Sales, Operations, Finance, etc.)
- Specific tools, methodologies, or certifications mentioned in JD

**2. QUANTIFIED IMPACT OPPORTUNITIES**
- Keywords that enable better quantification (e.g., "efficiency improvement," "revenue growth," "cost reduction")
- Functional domain verbs aligned with JD tone (led, scaled, optimized, spearheaded, delivered)
- Metrics and measurement frameworks (ROI, margin improvement, throughput, conversion %)

**3. PRESENT BUT UNDERUTILIZED**
- Keywords already in résumé but buried or under-emphasized
- Skills mentioned casually that deserve stronger positioning
- Achievements that could be reframed with JD-aligned language

**4. STRATEGIC INTEGRATIONS**
- Keywords naturally integrable without fabricating experience
- Terminology that strengthens functional domain alignment
- Language that elevates professional positioning for MBA-level roles

---
**SELECTION CRITERIA**

✓ Directly relevant to candidate's verifiable experience
✓ High JD matching value and recruiter search priority
✓ Industry-standard terminology for functional domain
✓ Not overly generic or marketing-focused
✓ Naturally integrable without hallucination

---
**OUTPUT FORMAT**

Return ONLY a JSON array with this structure:

{
  "critical_missing": [
    {
      "keyword": "<keyword/phrase>",
      "jd_reference": "<Where/how this appears in JD>",
      "suggested_integration": "<Where/how to add to resume>",
      "priority": "Critical"
    }
  ],
  "high_value_present": [
    {
      "keyword": "<keyword/phrase>",
      "current_context": "<How it currently appears in resume>",
      "optimization_opportunity": "<How to strengthen placement>",
      "priority": "High"
    }
  ],
  "functional_domain_verbs": [
    {
      "verb": "<action verb>",
      "functional_domain": "<Consulting|Sales|Operations|Finance|Product Management|Pre-Sales|General Management>",
      "example_usage": "<Suggested bullet with this verb>"
    }
  ]
}

**CRITICAL RULES:**
- Zero hallucination: Suggest only keywords relevant to candidate's actual experience
- Quantification-focused: Prioritize keywords enabling metrics and measurable impact
- JD-aligned: Every keyword must connect to documented JD requirements
- MBA standard: Use ISB/IIMA-grade professional terminology

Return ONLY valid JSON. No explanations or markdown outside JSON.`;
}


/**
 * Professional Summary Generation Prompt (MBA Resume Tweaker Framework)
 * 
 * Crafts compelling 2–3 line career summaries aligned to JD and MBA standards
 */
export function buildSummaryPrompt(
    resumeText: string,
    targetRole?: string
): string {
    return `You are an expert MBA résumé writer specializing in compelling professional summaries for top business school standards.

Your task is to craft a powerful CAREER SUMMARY (2–3 lines, 40–70 words) that establishes professional identity and value proposition aligned to the target role.

---
**CANDIDATE RESUME:**
${resumeText}

${targetRole ? `**TARGET ROLE/JD FOCUS:**\n${targetRole}\n\n` : ''}---
**CAREER SUMMARY REQUIREMENTS**

The summary must:

**1. PROFESSIONAL IDENTITY (First Line)**
- Years of total experience and primary expertise domains
- Functional specialization (Consulting, Sales, Operations, Finance, Product Management, Pre-Sales, General Management)
- Geographic/industry context if differentiating

**2. VALUE PROPOSITION (Second Line)**
- 2–3 key achievements with concrete metrics (%, ₹/$, #, time)
- Demonstrate measurable business impact
- Highlight unique strengths or domain expertise

**3. FORWARD-LOOKING IMPACT (Optional Third Line)**
${targetRole ? '- Strategic fit with target role/JD' : '- Intended career trajectory or specialization'}
- Key competencies or certifications
- Aspirational positioning for MBA/advancement

---
**WRITING RULES**

✓ Zero hallucination: Only verifiable experience from résumé
✓ Quantified: Every achievement includes metrics or specific scale
✓ Action-oriented: Use strong professional language
✓ Concise: 12–20 words per line
✓ Business-professional: No casual or marketing language
✓ Third person or first person (matching résumé tone)

---
**STRUCTURAL TEMPLATE**

[X years | Years + Domain Expert] in [Primary Functional Domain], delivering [quantified achievement] through [key methodology/approach]. Specialized in [domain expertise], with proven track record scaling [specific business metric] and leading [team scale/scope]. [Optional: Passionate about | Seeking | Focused on] [forward-looking positioning].

---
**OUTPUT FORMAT**

Return ONLY the career summary text (2–3 lines, plain text).
No headers, no explanations, no markdown formatting.
Ready to paste directly into résumé.

Career Summary:`;
}


/**
 * Achievement Quantification Prompt (MBA Resume Tweaker Framework)
 * 
 * Transforms vague achievements into quantified, impact-driven bullet points
 */
export function buildQuantificationPrompt(achievement: string): string {
    return `You are an expert MBA résumé optimizer specializing in transforming generic achievements into quantified, impact-driven statements.

Your task is to rewrite this achievement using ISB/IIMA standards: specific metrics (%, ₹/$, #, time), measurable business impact, and functional domain alignment.

---
**CURRENT ACHIEVEMENT:**
"${achievement}"

---
**QUANTIFICATION FRAMEWORK (Challenge-Action-Result)**

**Challenge:** What was the business problem, situation, or opportunity?
**Action:** What specific approach, methodology, or initiative did you lead?
**Result:** What was the measurable, quantifiable outcome?

---
**QUANTIFICATION METRICS TO PRIORITIZE**

**Financial Impact:** ₹/$ amount, margin improvement, ROI, cost savings
**Efficiency Gains:** % improvement, time reduction, throughput increase
**Scale & Growth:** # of users/clients/projects, revenue multiplier, team expansion
**Execution Speed:** Time-to-market improvement, delivery acceleration, project timeline

---
**FUNCTIONAL DOMAIN LANGUAGE**

**Consulting/Strategy:** market analysis, client impact, transformation outcomes, problem-solving
**Sales/Pre-Sales:** pipeline growth, conversion %, revenue generation, client acquisition
**Operations/Supply Chain:** efficiency %, process optimization, cost reduction, throughput
**Finance:** ROI improvement, margin expansion, portfolio value, forecasting accuracy
**Product Management:** feature adoption %, delivery time, roadmap execution, user engagement
**Pre-Sales/Account Management:** deal size, contract value, customer expansion, retention %
**General Management:** P&L ownership, org-wide initiatives, cross-functional leadership, talent scaling

---
**WRITING RULES**

✓ Only verifiable metrics from original achievement or reasonable inference
✓ Specific numbers: ranges are acceptable (20–25%) when exact data unavailable
✓ Impact-oriented verbs: led, delivered, optimized, spearheaded, implemented, scaled, negotiated
✓ Concise: 12–20 words per line
✓ Business-professional tone

---
**EXAMPLE TRANSFORMATIONS**

**Original:** "Managed multiple client projects"
**Quantified:** "Managed 5 enterprise client transformation projects, delivering 18–22% operational efficiency gains and ₹2.3 Cr cost savings"

**Original:** "Improved sales performance"
**Quantified:** "Scaled quarterly sales pipeline by 40% ($1.2M → $1.7M) through targeted B2B client acquisition and account management"

**Original:** "Led cross-functional team"
**Quantified:** "Led 12-member cross-functional team across product, engineering, and go-to-market functions, delivering 3 major product launches ahead of schedule"

---
**OUTPUT FORMAT**

Return 3 alternative quantified versions, ranked by impact:

**Version 1 (Most Conservative - Verifiable from Resume):**
[Rewritten achievement with documented metrics only]

**Version 2 (Moderate - Reasonable Inference):**
[Rewritten achievement with reasonable metric ranges]

**Version 3 (Aspirational - Full Impact Scenario):**
[Rewritten achievement emphasizing full business impact]

Each version should be a complete, ready-to-use bullet point.
No explanations between versions. Plain text output only.

Quantified Versions:`;
}


/**
 * ATS Compatibility Check Prompt (MBA Resume Tweaker Framework)
 * 
 * Ensures résumé meets ISB/IIMA one-page format and parsing standards
 */
export function buildATSCheckPrompt(resumeText: string): string {
    return `You are an expert MBA résumé format consultant specializing in ISB/IIMA one-page résumé standards.

Your task is to evaluate this résumé for format compliance, parsing clarity, and professional presentation aligned to top business school standards.

---
**RESUME TO EVALUATE:**
${resumeText}

---
**COMPLIANCE CHECKLIST (ISB/IIMA ONE-PAGE STANDARD)**

**1. LENGTH & PAGE LIMIT**
- One-page maximum for candidate with <5 years experience
- Two-page maximum for candidate with 5+ years experience
- Optimal word count: 400–500 words for one-page format

**2. STRUCTURE & SECTION HIERARCHY**
- Clear section headers: CAREER SUMMARY | EDUCATION | WORK EXPERIENCE | KEY PROJECTS/ACHIEVEMENTS | CORE COMPETENCIES | AWARDS & LEADERSHIP | EXTRA-CURRICULARS (optional)
- Reverse chronological order for experience/education
- Consistent formatting and spacing
- No excessive white space or poor layout

**3. PROFESSIONAL FORMATTING**
- Standard fonts only: Arial, Calibri, Times New Roman (11–12 pt)
- No tables, text boxes, columns, or complex layouts
- No headers/footers with critical information
- No images, graphics, icons, or special characters (except standard bullets: •, -, *)
- Consistent bullet point style throughout

**4. CONTENT CLARITY**
- Every bullet point is concise (12–20 words)
- Action verbs starting each bullet
- Quantified achievements with metrics (%, ₹/$, #, time)
- No vague or generic language
- No typos, grammatical errors, or formatting inconsistencies

**5. FUNCTIONAL DOMAIN ALIGNMENT**
- Language reflects functional domain (Consulting, Sales, Operations, Finance, Product Management, Pre-Sales, General Management)
- Achievements demonstrate business impact, not just duties
- Professional and confident tone throughout

---
**FORMAT EVALUATION TASK**

Assess the résumé against ISB/IIMA standards and provide:

1. **Overall Compliance Score (0–100)**
2. **Format Issues (by severity: Critical | High | Medium | Low)**
3. **Quick Fixes (Top 5 immediate formatting improvements)**
4. **Professional Verdict (Overall assessment and recommendation)**

---
**OUTPUT FORMAT (JSON)**

{
  "compliance_score": <0-100>,
  "page_count_assessment": {
    "current_length": "<word count or page estimate>",
    "recommendation": "<Trim|Acceptable|Could expand>"
  },
  "format_issues": [
    {
      "severity": "<Critical|High|Medium|Low>",
      "category": "<Structure|Formatting|Content|Language>",
      "issue": "<Specific problem identified>",
      "location": "<Section or line reference>",
      "fix": "<How to resolve>",
      "example": "<Before/after if applicable>"
    }
  ],
  "structure_assessment": {
    "sections_present": ["<section1>", "<section2>", ...],
    "sections_missing": ["<optional sections that could strengthen>"],
    "order_feedback": "<Assessment of section sequencing>"
  },
  "quick_wins": [
    "<Priority 1 immediate fix with biggest impact>",
    "<Priority 2>",
    "<Priority 3>",
    "<Priority 4>",
    "<Priority 5>"
  ],
  "professional_verdict": "<1-2 sentence assessment of format compliance and MBA-readiness>",
  "iima_isb_ready": <true|false>
}

**CRITICAL STANDARDS:**
✓ ISB/IIMA one-page format (ISB format preferred)
✓ Clean, parseable structure with clear hierarchy
✓ Professional business presentation
✓ No graphics or complex formatting
✓ Optimal readability and visual flow

Return ONLY valid JSON. No explanations or markdown outside JSON.`;
}


/**
 * Cover Letter Personalization Prompt (MBA Resume Tweaker Framework)
 * 
 * Crafts compelling, JD-aligned cover letters for MBA-level positions
 */
export function buildCoverLetterPrompt(
    resumeText: string,
    jobDescription: string,
    companyName: string
): string {
    return `You are an expert MBA recruiter specializing in compelling cover letters for top business school graduates and experienced professionals.

Your task is to write a powerful, JD-aligned cover letter (3 paragraphs, 250–300 words) that positions the candidate as an ideal fit for the role.

---
**CANDIDATE RESUME:**
${resumeText}

---
**JOB DESCRIPTION:**
${jobDescription}

---
**COMPANY NAME:**
${companyName}

---
**COVER LETTER STRUCTURE**

**PARAGRAPH 1: COMPELLING OPENING (3–4 sentences)**
- Express genuine enthusiasm for the role and company
- Reference specific company achievement, initiative, or mission alignment
- Briefly position your professional identity and interest
- Hook the recruiter with compelling reason for applying

**PARAGRAPH 2: FUNCTIONAL DOMAIN ALIGNMENT (5–6 sentences)**
- Highlight 2–3 specific résumé achievements directly aligned to JD requirements
- Quantify impact with concrete metrics (%, ₹/$, #, time)
- Demonstrate functional domain expertise (Consulting, Sales, Operations, Finance, Product, Pre-Sales, General Management)
- Show understanding of company/industry context
- Demonstrate why you're uniquely qualified for this specific role

**PARAGRAPH 3: FORWARD-LOOKING & CALL TO ACTION (3–4 sentences)**
- Express enthusiasm for contributing to company/team goals
- Highlight long-term value you'd bring to the organization
- Include strong call-to-action (request interview/meeting)
- Professional, confident sign-off

---
**WRITING STANDARDS**

✓ Zero hallucination: All claims grounded in résumé content
✓ Quantified impact: Every achievement includes measurable outcomes
✓ Company research: Specific, factual references to organization/industry
✓ Tone: Professional, confident, authentic (not overly formal or casual)
✓ Functional alignment: Language reflects JD's functional domain focus
✓ Conciseness: No fluff, every sentence adds value
✓ Error-free: Pristine grammar, spelling, punctuation

---
**FUNCTIONAL DOMAIN TONE GUIDANCE**

**Consulting/Strategy:** Strategic thinking, analytical rigor, problem-solving, transformation impact
**Sales/Pre-Sales:** Pipeline development, client relationship building, revenue generation, solution selling
**Operations/Supply Chain:** Process excellence, efficiency gains, operational scale, cost optimization
**Finance:** Financial acumen, ROI thinking, risk management, portfolio perspective
**Product Management:** Customer obsession, product strategy, cross-functional leadership, execution excellence
**Pre-Sales/Account Management:** Customer value creation, complex deal management, relationship building
**General Management:** P&L stewardship, organizational leadership, cross-functional excellence

---
**OUTPUT FORMAT**

Return ONLY the cover letter body text (3 paragraphs).
No headers, no signature line, no date, no address block.
Plain text format, ready to paste into email or document.
Use paragraph breaks (blank line between paragraphs).

Cover Letter:`;
}


/**
 * Interview Prep Questions Prompt (MBA Resume Tweaker Framework)
 * 
 * Generates targeted interview questions aligned to résumé and JD
 */
export function buildInterviewPrepPrompt(
    resumeText: string,
    jobDescription: string
): string {
    return `You are an expert MBA interview coach specializing in preparing candidates for roles at top companies and consulting firms.

Your task is to generate targeted interview questions the candidate should prepare for, based on their résumé and the specific Job Description.

---
**CANDIDATE RESUME:**
${resumeText}

---
**JOB DESCRIPTION:**
${jobDescription}

---
**INTERVIEW PREPARATION FRAMEWORK**

Generate 12–15 interview questions across four categories:

**1. EXPERIENCE-BASED QUESTIONS (3–4 questions)**
- Deep dives into specific résumé achievements
- Questions about quantified impact and metrics
- Career progression and trajectory reasoning
- Functional domain expertise demonstration
- Real-world project/client examples

**2. FUNCTIONAL DOMAIN QUESTIONS (3–4 questions)**
- Consulting/Strategy: Problem-solving approaches, client impact, analytical frameworks
- Sales/Pre-Sales: Sales methodology, pipeline building, deal closing, customer success
- Operations/Supply Chain: Process optimization, efficiency mindset, scale challenges
- Finance: Financial decision-making, ROI analysis, risk management
- Product Management: Product vision, stakeholder management, execution excellence
- General Management: P&L stewardship, team leadership, organizational impact

**3. BEHAVIORAL/LEADERSHIP QUESTIONS (3–4 questions)**
- STAR method scenarios (Situation-Task-Action-Result)
- Conflict resolution and team dynamics
- Cross-functional collaboration
- Change management and adaptability
- Leadership philosophy and team development

**4. COMPANY/ROLE-SPECIFIC QUESTIONS (2–3 questions)**
- Why this company/role? (Specific, authentic answers required)
- Understanding of company's market position, strategy, challenges
- Long-term career goals and alignment
- How résumé experience prepares for this specific role

---
**QUESTION DESIGN STANDARDS**

✓ Questions directly tied to résumé content or JD requirements
✓ Open-ended to allow detailed, strategic responses
✓ Designed to assess functional domain competency
✓ Behavioral questions use STAR framework
✓ Company questions require genuine research/understanding
✓ Difficulty levels: Easy (warm-up) | Medium (core assessment) | Hard (strategic challenges)

---
**OUTPUT FORMAT (JSON)**

{
  "total_questions": <12-15>,
  "by_category": {
    "experience_based": [
      {
        "id": "EXP_1",
        "question": "<The interview question>",
        "focus": "<Specific résumé achievement or experience>",
        "difficulty": "<Easy|Medium|Hard>",
        "assessment": "<What interviewer is evaluating>",
        "preparation_tip": "<How to answer effectively using STAR or quantified examples>"
      }
    ],
    "functional_domain": [
      {
        "id": "FD_1",
        "question": "<The interview question>",
        "functional_domain": "<Consulting|Sales|Operations|Finance|Product|General Management>",
        "difficulty": "<Easy|Medium|Hard>",
        "core_competency": "<What this assesses>",
        "preparation_tip": "<Framework or methodology to reference>"
      }
    ],
    "behavioral_leadership": [
      {
        "id": "BL_1",
        "question": "<The interview question>",
        "scenario_focus": "<Leadership|Collaboration|Conflict Resolution|Adaptability>",
        "difficulty": "<Easy|Medium|Hard>",
        "star_elements": "<Situation|Task|Action|Result emphasis>",
        "preparation_tip": "<Example structure or key points to emphasize>"
      }
    ],
    "company_role_specific": [
      {
        "id": "CR_1",
        "question": "<The interview question>",
        "company_context": "<What you should know before answering>",
        "difficulty": "<Easy|Medium|Hard>",
        "authenticity_check": "<Is this a genuine fit question?>",
        "preparation_tip": "<Research or reflection required>"
      }
    ]
  },
  "general_preparation_tips": [
    "<Tip 1: How to communicate quantified achievements>",
    "<Tip 2: How to demonstrate functional domain expertise>",
    "<Tip 3: How to show authentic company/role fit>",
    "<Tip 4: How to prepare strong STAR examples>"
  ]
}

**CRITICAL STANDARDS:**
✓ All questions grounded in résumé content and JD requirements
✓ Functional domain language appropriate to role
✓ Questions designed to assess MBA-level competencies
✓ Behavioral questions follow STAR method framework
✓ Company questions require genuine understanding

Return ONLY valid JSON. No explanations or markdown outside JSON.`;
}


/**
 * Inline Suggestions Prompt (MBA Resume Tweaker Framework)
 * 
 * Real-time, line-by-line optimization suggestions for active editing
 */
export function buildInlineSuggestionsPrompt(
    resumeText: string,
    jobDescription?: string
): string {
    return `You are an expert MBA résumé editor providing real-time, line-by-line optimization suggestions aligned to ISB/IIMA standards.

Your task is to analyze the résumé and provide specific, actionable inline suggestions prioritizing JD alignment, quantification, and professional polish.

---
${jobDescription ? `**TARGET JOB DESCRIPTION:**\n${jobDescription}\n\n` : ''}**RESUME CONTENT:**
${resumeText}

---
**SUGGESTION CATEGORIES**

**1. QUANTIFICATION (Priority: Critical)**
- Missing metrics in bullet points
- Generic language that should include %, ₹/$, #, or time
- Weak achievement statements requiring quantified rewrite

**2. JD ALIGNMENT (Priority: High)**
${jobDescription ? '- Resume content not emphasizing JD-critical keywords or requirements' : '- Generic language that could be more specific'}
- Functional domain mismatch in tone or language
- Underutilized achievements that match JD focus

**3. LANGUAGE & ACTION VERBS (Priority: High)**
- Weak or generic verbs (e.g., "responsible for," "worked on")
- Missing impact-oriented verbs (led, delivered, optimized, spearheaded, scaled, negotiated)
- Passive voice that should be active

**4. FORMAT & STRUCTURE (Priority: Medium)**
- Non-standard formatting or inconsistent bullets
- Excessive wordiness (bullets >20 words)
- Poor section hierarchy or visual flow

**5. PROFESSIONAL POLISH (Priority: Medium)**
- Typos, grammatical errors, punctuation issues
- Inconsistent date formats or capitalization
- Non-standard section headings

---
**SUGGESTION OUTPUT FORMAT (JSON Array)**

[
  {
    "id": "<unique-id>",
    "line_reference": "<Resume excerpt or context>",
    "location_context": "<Section name and bullet position>",
    "severity": "<Critical|High|Medium|Low>",
    "category": "<Quantification|JD Alignment|Language|Format|Polish>",
    "current_text": "<The exact text from resume>",
    "issue": "<Clear, specific explanation of the problem>",
    "suggestion": "<Specific replacement text, ready to paste>",
    "rationale": "<Why this change improves the resume>",
    "impact": "<What recruiter/ATS will notice>"
  }
]

---
**QUALITY GUIDELINES**

✓ Provide 8–15 suggestions (prioritize quality and impact)
✓ Order by severity: Critical first, then High, Medium, Low
✓ All suggestions are actionable (replacement text ready to use)
✓ Quantification suggestions include specific metrics or reasonable ranges
✓ JD alignment suggestions reference specific JD requirements
✓ All suggestions preserve factual accuracy (zero hallucination)
✓ Language suggestions use impact-oriented verbs
✓ Format suggestions maintain ISB/IIMA one-page standard

---
**CRITICAL RULES**

✓ Zero hallucination: Suggestions only modify verifiable resume content
✓ Quantification-focused: Every suggestion should move toward quantified impact
✓ JD-centric: All suggestions align to provided JD (if available)
✓ MBA standard: Maintain professional, strategic tone
✓ Actionable: Every suggestion includes specific replacement text

---
**IMPORTANT TECHNICAL NOTES**

- Return ONLY a valid JSON array
- No markdown formatting, code blocks, or explanatory text outside JSON
- All strings properly escaped
- No limit on suggestion depth or detail within JSON

Return ONLY valid JSON array:`;
}


/**
 * Resume Rebuild Prompt (MBA Resume Tweaker Framework)
 * 
 * Complete résumé optimization applying all MBA standards and JD alignment
 */
export function buildResumeRebuildPrompt(
    resumeText: string,
    feedback: any,
    jobDescription?: string
): string {
    return `You are an expert MBA résumé optimizer specializing in complete résumé rebuilds following ISB/IIMA one-page standards.

Your task is to rebuild the candidate's résumé by applying ALL feedback suggestions, JD alignment, and MBA-grade professional polish.

---
**ORIGINAL RESUME:**
${resumeText}

${jobDescription ? `\n**TARGET JOB DESCRIPTION:**\n${jobDescription}\n` : ''}
---
**FEEDBACK & OPTIMIZATION GUIDANCE:**
${typeof feedback === 'string' ? feedback : JSON.stringify(feedback, null, 2)}

---
**REBUILD OBJECTIVES**

Your rebuilt résumé must:

**1. APPLY ALL FEEDBACK (100%)**
- Incorporate every quantification suggestion
- Implement all JD alignment improvements
- Fix all formatting and language issues
- Enhance professional polish throughout

**2. JD ALIGNMENT**
${jobDescription ? '- Emphasize achievements matching JD requirements\n- Use functional domain language (Consulting, Sales, Operations, Finance, Product, Pre-Sales, General Management)\n- Highlight critical skills and experience' : '- Maintain professional, strategic positioning'}

**3. QUANTIFICATION (Every Bullet)**
- Every achievement includes specific metrics: %, ₹/$, #, time
- No generic language or vague descriptions
- Measurable business impact demonstrated throughout

**4. STRUCTURE & PROFESSIONAL POLISH**
- ISB/IIMA one-page format (or justified two-page if 5+ years experience)
- Section hierarchy: CAREER SUMMARY | EDUCATION | WORK EXPERIENCE | KEY PROJECTS/ACHIEVEMENTS | CORE COMPETENCIES | AWARDS & LEADERSHIP | EXTRA-CURRICULARS (optional)
- Concise bullets (12–20 words each)
- Consistent formatting throughout
- Zero typos, grammatical errors, or inconsistencies

**5. IMPACT-ORIENTED LANGUAGE**
- Strong action verbs: led, delivered, optimized, spearheaded, conceptualized, implemented, improved, collaborated, scaled, negotiated
- Active voice throughout
- Business-professional tone maintained

---
**STRUCTURE TEMPLATE (ISB/IIMA STANDARD)**

[FULL NAME]
[Phone] | [Email] | [City, Country] | [LinkedIn URL] | [GitHub/Portfolio URL if relevant]

**CAREER SUMMARY**
[2–3 lines, 40–70 words]
Professional identity, years of experience, core domains, top skills, and functional specialization relevant to target role. Quantified key achievement. Forward-looking positioning or strategic focus.

**EDUCATION**
[Degree] in [Field] | [University Name] | [City, Country] | [Graduation Year]
• [Key achievement, honors, or relevant coursework if MBA/specialized degree]

[Second degree if applicable, with same structure]

**WORK EXPERIENCE**
[Job Title] | [Company Name] | [City, Country] | [Start Month/Year – End Month/Year]
• [Quantified achievement with %, ₹/$, #, or time impact | Strong action verb | Specific responsibility | Business outcome]
• [Additional achievements from this role, all quantified, action verb-driven]
• [Optional: Key technical skills or tools used in context]

[Repeat for each position, in reverse chronological order]

**KEY PROJECTS / ACHIEVEMENTS**
[Optional section if strategic, cross-functional, or data-driven projects strengthen positioning]
[Project Name] | [Impact/Outcome] | [Date]
• [Brief description with quantified business impact]

**CORE COMPETENCIES**
• [Competency Category 1]: [List relevant skills, tools, methodologies]
• [Competency Category 2]: [List relevant skills, tools, methodologies]
• [Competency Category 3]: [List relevant skills, tools, methodologies]

**AWARDS & LEADERSHIP**
• [Award/Recognition Name] – [Organization] – [Year] | [Specific achievement or criteria]
• [Leadership role or designation] – [Organization] | [Impact or responsibility]

**EXTRA-CURRICULARS** [Optional]
• [Significant volunteer work, publications, or external roles with business impact]

---
**OPTIMIZATION RULES**

✓ **Zero hallucination**: Rebuild only modifies/optimizes existing resume content
✓ **Quantified throughout**: Every bullet includes measurable impact
✓ **JD-aligned**: Language and emphasis reflect target role requirements
✓ **MBA-grade**: Professional, strategic, high-impact positioning
✓ **One-page standard**: ISB/IIMA format compliance
✓ **Action-verb driven**: Every achievement uses impact-oriented language
✓ **Business-professional**: Confident, credible, polished tone
✓ **Error-free**: Zero typos, grammatical issues, or inconsistencies

---
**OUTPUT FORMAT**

Return ONLY the rebuilt resume text in plain text format.
No markdown code blocks, no explanations, no meta-commentary.
Use simple formatting:
- Section headers in BOLD (or **CAPS**)
- Bullets as "•"
- One blank line between sections
- Ready to paste directly into document or ATS system

Begin your rebuild:`;
}

/**
 * MBA Resume Tweaker Prompt - JD-Aligned, Quantified, Zero Hallucination
 * 
 * Expert MBA résumé writer and admissions consultant for top global business schools
 * Rewrites and aligns candidate résumé to Job Description following ISB/IIMA standards
 */
export function buildMBAResumeTweakerPrompt(
    resumeText: string,
    jobDescription: string
): string {
    return `You are an expert MBA résumé writer and admissions consultant for top global business schools (ISB, IIMs, INSEAD, NTU).
Your goal is to rewrite and align a candidate's résumé to a provided Job Description (JD) following ISB/IIMA one-page résumé standards.
The rewritten résumé must be JD-aligned, quantified, and entirely factual — no hallucination, no invented achievements, no fabricated data.

---
**INPUTS**

resume_text: The candidate's existing résumé in plain text.
jd_text: The target job description.

---
**OBJECTIVE**

Rephrase, reorder, and refine résumé content so it strongly aligns with the JD's responsibilities, skills, and tone.

Every bullet point must demonstrate measurable business impact (%, ₹/$ value, # scale, or time).

Preserve all facts, metrics, and organizations from the résumé.

Adapt phrasing to reflect the JD's functional focus — consulting, product management, sales, operations, finance, project management, pre-sales, or general management.

If no résumé is provided, create a clearly labeled "Sample Output" résumé using the JD as context, with illustrative (non-factual) metrics.

---
**STRUCTURE (Follow ISB/IIMA One-Page Format)**

**CAREER SUMMARY (2–3 lines)**
- Summarize professional identity, total years of experience, core domains, and top skills relevant to the JD.
- Derive only from résumé content.

**EDUCATION**
- Preserve institutions, degrees, timelines, and achievements.
- Reorder or reformat for readability — never invent credentials.

**WORK EXPERIENCE**
- Keep company names, roles, and timelines exactly as in the résumé.
- Rewrite bullet points using JD-aligned verbs and ensure quantified impact in each line.
- Tailor language to functional domains:
  - **Consulting / Strategy**: market analysis, problem solving, client impact, transformation outcomes.
  - **Sales / Pre-Sales**: pipeline growth, conversion %, revenue generation, client acquisition.
  - **Operations / Supply Chain**: efficiency, throughput, process optimization, cost reduction.
  - **Finance**: ROI, margin improvement, portfolio value, forecasting accuracy.
  - **Product / Project Management**: roadmap execution, feature adoption, delivery time, stakeholder collaboration.
  - **General Management**: P&L ownership, cross-functional leadership, organization-wide initiatives.

**KEY PROJECTS / ACHIEVEMENTS**
- Retain original results; highlight strategic, cross-functional, or data-driven outcomes with measurable results.

**CORE COMPETENCIES**
- Extract real skills from résumé; reorder to emphasize those relevant to JD keywords.

**AWARDS & LEADERSHIP / CERTIFICATIONS / EXTRA-CURRICULARS**
- Maintain factual accuracy; condense for clarity.

---
**WRITING RULES**

✓ Zero hallucination: only rewrite verifiable résumé content.
✓ Quantify every bullet: express tangible outcomes using %, ₹/$, #, or time reduction.
✓ Use impact-oriented action verbs: led, delivered, optimized, spearheaded, conceptualized, implemented, improved, collaborated, scaled, negotiated.
✓ Keep concise (12–20 words per line).
✓ Maintain business-professional tone.
✓ Final résumé should fit one page (~400–500 words).
✓ Avoid narrative paragraphs — use crisp bullet format.

---
**OUTPUT FORMAT**

Return the optimized résumé using this header sequence:

CAREER SUMMARY
EDUCATION
WORK EXPERIENCE
KEY PROJECTS / ACHIEVEMENTS
CORE COMPETENCIES
AWARDS & LEADERSHIP
SOCIAL IMPACT / EXTRA-CURRICULARS (optional)

---
**EXAMPLE TRANSFORMATION**

**Input bullet:**
Managed multiple client projects to improve operational performance

**JD focus:** consulting, measurable client value

**Rewritten (JD-aligned + quantified):**
Managed 3 client transformation projects delivering 20–25% process efficiency gains and ₹4 Cr cost savings through workflow redesign

✅ JD-aligned (consulting context)
✅ Quantified (efficiency %, cost impact)
✅ Factually grounded

---
**CANDIDATE RESUME:**
${resumeText}

---
**TARGET JOB DESCRIPTION:**
${jobDescription}

---
**FINAL GOAL**

Produce a 1-page, JD-optimized, quantified, and hallucination-free résumé that demonstrates measurable business impact, strong functional alignment, and ISB/IIMA-grade professional polish — suitable for MBA placements or lateral roles in Consulting, Product Management, Sales, Operations, Finance, Project Management, Pre-Sales, or General Management.

---
**OUTPUT:**
Return ONLY the optimized resume in the specified format above. Do not include any explanations, meta-commentary, or markdown code blocks. Plain text format only.

`;
}

/**
 * Export all prompt builders
 */
export const PromptBuilder = {
    analysis: buildAnalysisPrompt,
    feedback: buildFeedbackPrompt,
    keywords: buildKeywordPrompt,
    summary: buildSummaryPrompt,
    quantification: buildQuantificationPrompt,
    atsCheck: buildATSCheckPrompt,
    coverLetter: buildCoverLetterPrompt,
    interviewPrep: buildInterviewPrepPrompt,
    inlineSuggestions: buildInlineSuggestionsPrompt,
    rebuild: buildResumeRebuildPrompt,
    mbaTweaker: buildMBAResumeTweakerPrompt,
};
