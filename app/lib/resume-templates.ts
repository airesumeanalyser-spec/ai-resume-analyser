/**
 * Resume Templates
 * Pre-built markdown templates for different resume styles
 */

export interface ResumeTemplate {
    id: string;
    name: string;
    description: string;
    category: 'professional' | 'creative' | 'academic' | 'technical';
    markdown: string;
}

export const resumeTemplates: ResumeTemplate[] = [
    {
        id: 'professional',
        name: 'Professional',
        description: 'Clean and professional template suitable for corporate roles',
        category: 'professional',
        markdown: `---
name: Your Name
header:
  - text: your.email@example.com
    link: mailto:your.email@example.com
  - text: (555) 123-4567
  - text: linkedin.com/in/yourprofile
    link: https://linkedin.com/in/yourprofile
  - text: City, State
themeColor: '#2563eb'
---

## Professional Summary

Results-driven professional with X+ years of experience in [your field]. Proven track record of [key achievement] and [key achievement]. Strong expertise in [skill], [skill], and [skill].

## Experience

**Job Title** | Company Name | *Month Year - Present*

- Achieved [quantifiable result] by [action taken]
- Led [project/initiative] resulting in [measurable impact]
- Collaborated with [teams/stakeholders] to [accomplish goal]
- Implemented [solution] that improved [metric] by X%

**Job Title** | Company Name | *Month Year - Month Year*

- Spearheaded [initiative] generating [$X/X%] in [revenue/savings/growth]
- Managed [team size/resource] across [scope]
- Developed and executed [strategy] improving [KPI] by X%

## Education

**Degree Name** | University Name | *Year*

- GPA: X.X/4.0 (if impressive)
- Relevant Coursework: Course 1, Course 2, Course 3
- Honors/Awards: List relevant achievements

## Skills

**Technical:** Skill 1, Skill 2, Skill 3, Skill 4
**Languages:** Language 1, Language 2
**Tools:** Tool 1, Tool 2, Tool 3
**Soft Skills:** Leadership, Communication, Problem-Solving`,
    },
    {
        id: 'technical',
        name: 'Technical/Software Engineer',
        description: 'Optimized for software engineering and technical roles',
        category: 'technical',
        markdown: `---
name: Your Name
header:
  - text: your.email@example.com
    link: mailto:your.email@example.com
  - text: github.com/yourusername
    link: https://github.com/yourusername
  - text: portfolio.com
    link: https://yourportfolio.com
  - text: linkedin.com/in/yourprofile
    link: https://linkedin.com/in/yourprofile
themeColor: '#059669'
---

## Summary

Software Engineer with X+ years building scalable applications. Expertise in [tech stack] with focus on [specialization]. Open source contributor with X+ GitHub stars.

## Technical Skills

**Languages:** JavaScript, TypeScript, Python, Java, Go
**Frontend:** React, Vue.js, Next.js, TailwindCSS
**Backend:** Node.js, Express, Django, Spring Boot
**Database:** PostgreSQL, MongoDB, Redis, DynamoDB
**Cloud/DevOps:** AWS, Docker, Kubernetes, CI/CD, Terraform
**Tools:** Git, VS Code, Postman, Jira, Figma

## Experience

**Senior Software Engineer** | Tech Company | *Month Year - Present*

- Architected and deployed microservices handling 1M+ daily requests with 99.9% uptime
- Reduced API response time by 60% through caching and query optimization
- Led migration from monolith to microservices saving $X in infrastructure costs
- Mentored 5 junior developers and established code review best practices
- **Tech:** React, Node.js, PostgreSQL, AWS, Docker

**Software Engineer** | Startup | *Month Year - Month Year*

- Built real-time features using WebSocket serving 100K+ concurrent users
- Implemented CI/CD pipeline reducing deployment time from 2hrs to 15min
- Contributed to open source projects (X+ PRs merged, Y+ stars)
- **Tech:** Vue.js, Python, MongoDB, Redis, GCP

## Projects

**Project Name** | [github.com/user/repo](https://github.com/user/repo) | *Tech Stack*

- Description of what the project does and its impact
- Key technical challenges solved
- Metrics: X downloads, Y stars, Z active users

**Project Name** | [Live Demo](https://demo.com) | *Tech Stack*

- Built [feature] using [technology]
- Achieved [metric/outcome]

## Education

**Bachelor/Master of Science in Computer Science** | University | *Year*

- GPA: X.X/4.0 | Dean's List
- Relevant Coursework: Algorithms, Distributed Systems, Machine Learning

## Certifications

- AWS Certified Solutions Architect
- Google Cloud Professional Developer
- MongoDB Certified Developer`,
    },
    {
        id: 'creative',
        name: 'Creative/Design',
        description: 'Eye-catching template for creative professionals and designers',
        category: 'creative',
        markdown: `---
name: Your Name
header:
  - text: your.email@example.com
    link: mailto:your.email@example.com
  - text: portfolio.com
    link: https://yourportfolio.com
  - text: behance.net/yourprofile
    link: https://behance.net/yourprofile
  - text: dribbble.com/yourprofile
    link: https://dribbble.com/yourprofile
themeColor: '#dc2626'
---

## About Me

Creative [designer/artist] with X+ years crafting compelling visual experiences. Passionate about [design philosophy] with expertise in [specialization]. Winner of [award] and featured in [publication].

## Experience

**Senior Designer** | Agency/Company | *Month Year - Present*

- Designed brand identity for X+ clients resulting in X% increase in engagement
- Led design team of X delivering X+ projects on time and within budget
- Created design system adopted across X products serving X users
- Tools: Figma, Adobe Creative Suite, Sketch, Principle

**Designer** | Company | *Month Year - Month Year*

- Redesigned [product] improving user satisfaction from X% to Y%
- Collaborated with engineers to implement pixel-perfect designs
- Conducted user research with X+ participants informing design decisions
- Won [award] for [project]

## Featured Work

**Project Name** | [View Project](https://link.com)

- Brief description of the project and your role
- Challenge, solution, and impact
- Recognition: Featured in [publication/award]

**Project Name** | [View Project](https://link.com)

- Description highlighting creative process
- Key achievements and metrics

## Skills

**Design:** UI/UX, Branding, Typography, Illustration, Motion Design
**Tools:** Figma, Adobe CC, Sketch, After Effects, Blender
**Other:** User Research, Prototyping, Design Systems, HTML/CSS

## Education

**Bachelor of Fine Arts in Graphic Design** | Art School | *Year*

- Graduated with Honors
- Focus: Digital Media, Interactive Design

## Recognition

- Award Name - Year
- Publication Feature - Year
- Competition Winner - Year`,
    },
    {
        id: 'academic',
        name: 'Academic/Research',
        description: 'Comprehensive template for academic positions and research roles',
        category: 'academic',
        markdown: `---
name: Dr. Your Name
header:
  - text: your.email@university.edu
    link: mailto:your.email@university.edu
  - text: scholar.google.com/yourprofile
    link: https://scholar.google.com/citations?user=ID
  - text: orcid.org/0000-0000-0000-0000
    link: https://orcid.org/0000-0000-0000-0000
  - text: researchgate.net/profile
    link: https://researchgate.net/profile/Your-Name
themeColor: '#7c3aed'
---

## Research Interests

Machine Learning, Natural Language Processing, Computer Vision, Artificial Intelligence

## Education

**Ph.D. in Computer Science** | University Name | *Year - Year*

- Dissertation: "Title of Your Dissertation"
- Advisor: Prof. Name
- GPA: 4.0/4.0

**M.S. in Computer Science** | University Name | *Year*

**B.S. in Computer Science** | University Name | *Year*

## Academic Appointments

**Assistant Professor** | Department, University | *Year - Present*

- Teaching courses: Course 1, Course 2, Course 3
- Advising X graduate students and Y undergraduate students
- Secured $X in research funding from NSF, NIH, industry

**Postdoctoral Researcher** | Institution | *Year - Year*

- PI: Prof. Name
- Research focus: Brief description

## Publications

### Journal Articles

1. **Your Name**, Co-author. "Paper Title." *Journal Name*, vol. X, no. Y, Year, pp. 1-10. [DOI](https://doi.org/...)

2. Co-author, **Your Name**. "Paper Title." *Journal Name*, Year. (IF: X.X)

### Conference Papers

1. **Your Name** et al. "Paper Title." *Conference Name (Venue)*, Year. **Best Paper Award**

2. Co-authors, **Your Name**. "Paper Title." *Major Conference*, Year. (Acceptance rate: X%)

### Preprints

1. **Your Name** et al. "Paper Title." *arXiv preprint*, Year. [Link](https://arxiv.org/...)

## Research Experience

**Principal Investigator** | Grant Title, Funding Agency | *Year - Present*

- Grant amount: $XXX,XXX
- Project description and objectives

**Research Scientist** | Lab/Institution | *Year - Year*

- Key research contributions
- Collaborations and outcomes

## Teaching Experience

- **Course Name** (Undergraduate/Graduate) - Terms taught
- **Course Name** - Terms taught
- Guest lectures and workshops

## Grants & Funding

- NSF Grant #XXXXX - $XXX,XXX - Year-Year
- NIH R01 Grant - $XXX,XXX - Year-Year
- Industry Partnership - $XX,XXX - Year

## Honors & Awards

- Award Name, Institution, Year
- Fellowship Name, Organization, Year
- Recognition for teaching/research

## Service

**Reviewer:** Journal 1, Journal 2, Conference 1, Conference 2
**Committee Member:** Committee name, Organization
**Session Chair:** Conference Name, Year

## Technical Skills

**Programming:** Python, R, MATLAB, C++, Java
**ML/AI:** TensorFlow, PyTorch, Scikit-learn, Keras
**Tools:** Git, LaTeX, Jupyter, Docker

## Selected Talks

- "Talk Title," Conference/Institution, Location, Date
- "Talk Title," Invited Seminar, Institution, Date`,
    },
    {
        id: 'minimal',
        name: 'Minimal',
        description: 'Clean and minimalist template focusing on content',
        category: 'professional',
        markdown: `---
name: Your Name
header:
  - text: email@example.com
    link: mailto:email@example.com
  - text: (555) 123-4567
  - text: linkedin.com/in/profile
    link: https://linkedin.com/in/profile
themeColor: '#000000'
---

## Experience

**Job Title**, Company Name, *Year - Present*

Brief description of role and responsibilities. Focus on achievements and impact.

**Job Title**, Company Name, *Year - Year*

Key accomplishments and contributions in bullet points.

## Education

**Degree**, University Name, *Year*

## Skills

Category: Skill, Skill, Skill
Category: Skill, Skill, Skill`,
    },
];

/**
 * Get template by ID
 */
export function getTemplate(id: string): ResumeTemplate | undefined {
    return resumeTemplates.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: ResumeTemplate['category']): ResumeTemplate[] {
    return resumeTemplates.filter(t => t.category === category);
}
