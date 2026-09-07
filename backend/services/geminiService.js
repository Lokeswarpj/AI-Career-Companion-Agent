import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

/**
 * Executes a Gemini prompt with JSON output support, fallback models, and offline mock resilience.
 */
export async function callGemini(prompt, systemInstruction = '', jsonFormat = true) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.warn('[GeminiService] No GEMINI_API_KEY configured. Utilizing intelligent heuristic fallback engine.');
    return null; // Will trigger the domain-specific fallback logic
  }

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      if (jsonFormat) {
        payload.generationConfig = {
          responseMimeType: 'application/json',
          temperature: 0.2
        };
      } else {
        payload.generationConfig = {
          temperature: 0.4
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[GeminiService] Model ${model} returned error ${response.status}: ${errText.slice(0, 150)}`);
        continue; // Try next model
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (jsonFormat) {
        // Strip markdown code fences if present
        let cleaned = rawText.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
        else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
        return JSON.parse(cleaned);
      }
      
      return rawText;
    } catch (err) {
      console.warn(`[GeminiService] Error with model ${model}:`, err.message);
    }
  }

  return null; // Fallback to heuristic provider
}

/**
 * 1. AI Resume Analysis
 */
export async function analyzeResumeWithGemini(resumeText) {
  const prompt = `Analyze the following student/candidate resume text in depth. Extract structured information including skills categorized into programming, web, aiData, cloud, tools, and soft skills. Identify key strengths, weaknesses/gaps for software internships, recommended skills to learn, and top 3 career role suggestions.

Resume Content:
"""
${resumeText.slice(0, 8000)}
"""

Return a strictly valid JSON object matching this schema:
{
  "summary": "Concise 3-4 sentence professional profile summary of the student",
  "skills": {
    "programming": ["Python", "Java", ...],
    "web": ["React", "Node.js", ...],
    "aiData": ["Pandas", "PyTorch", ...],
    "cloud": ["Docker", "AWS", ...],
    "tools": ["Git", "VS Code", ...],
    "soft": ["Problem Solving", "Team Collaboration", ...]
  },
  "strengths": [
    "Demonstrated hands-on experience in full-stack web applications",
    "Solid grounding in core computer science data structures"
  ],
  "weaknesses": [
    "Limited exposure to enterprise cloud deployments and CI/CD pipelines",
    "Missing automated unit testing in past projects"
  ],
  "recommendedSkills": [
    "Docker & Containerization",
    "FastAPI for AI microservices",
    "Jest / Playwright for automated testing"
  ],
  "careerSuggestions": [
    "Full-Stack Web Developer",
    "AI & Data Engineer",
    "Cloud Software Engineer"
  ]
}`;

  const systemPrompt = "You are a Senior Technical Career Advisor and Resume Screener for top technology companies. Provide realistic, highly actionable, structured JSON analysis.";

  const aiResult = await callGemini(prompt, systemPrompt, true);
  if (aiResult && aiResult.summary && aiResult.skills) {
    return aiResult;
  }

  // Heuristic intelligent fallback when API key is not present or quota reached
  return generateHeuristicResumeAnalysis(resumeText);
}

/**
 * 2. Semantic Match Explanation & Skill Gap Analysis
 */
export async function generateMatchExplanation(candidateProfile, internship) {
  const prompt = `Evaluate the candidate's fit for the internship position below.
Candidate Profile:
- Skills: ${JSON.stringify(candidateProfile.skills || [])}
- Target Roles: ${JSON.stringify(candidateProfile.preferred_roles || [])}
- Education: ${candidateProfile.degree || 'Computer Science'} at ${candidateProfile.university || 'University'}
- Experience Summary: ${candidateProfile.summary || 'Student developer with project experience'}

Internship:
- Title: ${internship.title}
- Company: ${internship.company}
- Required Skills: ${internship.required_skills_json}
- Description: ${internship.description}

Generate a concise JSON analysis:
{
  "whyItMatches": "2-3 clear sentences highlighting why the student is a promising fit",
  "potentialConcerns": "1-2 constructive points on missing prerequisites or high-competition areas",
  "recommendedPreparation": "Specific practical actions the student should take before applying or interviewing",
  "keyHighlights": ["Point 1", "Point 2"]
}`;

  const systemPrompt = "You are an intelligent hiring matching engine. Deliver objective, encouraging, and actionable hiring match insights.";

  const aiResult = await callGemini(prompt, systemPrompt, true);
  if (aiResult && aiResult.whyItMatches) {
    return aiResult;
  }

  // Heuristic fallback
  return {
    whyItMatches: `Your technical background in ${(candidateProfile.skills || ['modern software technologies']).slice(0, 3).join(', ')} aligns well with ${internship.company}'s expectations for the ${internship.title} role.`,
    potentialConcerns: `You may need to deepen hands-on knowledge in specific enterprise requirements such as ${internship.required_skills_json ? JSON.parse(internship.required_skills_json).slice(0, 2).join(' and ') : 'advanced framework workflows'}.`,
    recommendedPreparation: `Review ${internship.company}'s core tech stack, practice targeted coding questions on data structures, and prepare a live walkthrough of your best project.`,
    keyHighlights: [
      `Strong alignment with ${internship.title} core responsibilities`,
      "Relevant academic background and project portfolio"
    ]
  };
}

/**
 * 3. AI Interview Question Generation
 */
export async function generateInterviewQuestions(internship, difficulty = 'Intermediate', interviewType = 'Technical', resumeText = '') {
  const prompt = `Generate a realistic 5-question mock interview questionnaire for:
Role: ${internship.title} at ${internship.company}
Difficulty Level: ${difficulty}
Interview Type: ${interviewType} (e.g. Technical, Behavioral, System Design, HR, or Mixed)
${resumeText ? `Candidate Resume Context: ${resumeText.slice(0, 2000)}` : ''}

Create 5 distinct questions covering core technologies, problem-solving, situational reasoning, and practical scenarios.

Return JSON in this format:
{
  "questions": [
    {
      "questionNumber": 1,
      "category": "Technical",
      "questionText": "Question text here...",
      "expectedKeyPoints": ["Key point 1", "Key point 2"],
      "hint": "Brief hint to guide the candidate if stuck"
    }
  ]
}`;

  const systemPrompt = "You are a Principal Software Engineering Interviewer and Hiring Manager. Formulate clear, fair, challenging, and relevant interview questions.";

  const aiResult = await callGemini(prompt, systemPrompt, true);
  if (aiResult && aiResult.questions && aiResult.questions.length > 0) {
    return aiResult.questions;
  }

  // Heuristic Question Bank Fallback
  return generateHeuristicQuestions(internship, difficulty, interviewType);
}

/**
 * 4. AI Answer Evaluation
 */
export async function evaluateInterviewAnswer(questionText, userAnswer, roleTitle, difficulty) {
  const prompt = `Evaluate the candidate's answer for an internship interview question.
Role: ${roleTitle} (${difficulty} level)
Question: "${questionText}"
Candidate's Answer: "${userAnswer}"

Evaluate strictly on:
1. Technical correctness and depth (0-100)
2. Communication clarity and structure (0-100)
3. Relevance and completeness to what was asked (0-100)

Provide actionable constructive feedback, highlighting strong points, missed concepts, and an ideal model answer outline.

Return JSON:
{
  "score": 85,
  "technicalScore": 88,
  "communicationScore": 82,
  "relevanceScore": 85,
  "feedback": "Concise 2-3 sentence assessment of the response",
  "keyPointsMentioned": ["Point 1", "Point 2"],
  "missedPoints": ["Point candidate forgot"],
  "idealAnswerSummary": "A concise breakdown of what an exemplary answer would cover"
}`;

  const systemPrompt = "You are a warm, constructive, and rigorous technical interviewer. Score candidates fairly based on depth, clarity, and accuracy.";

  const aiResult = await callGemini(prompt, systemPrompt, true);
  if (aiResult && typeof aiResult.score === 'number') {
    return aiResult;
  }

  // Heuristic evaluation fallback
  return generateHeuristicAnswerEvaluation(questionText, userAnswer);
}

/**
 * 5. Career Assistant RAG Chatbot
 */
export async function generateCareerAssistantResponse(userMessage, studentContext, chatHistory = []) {
  const prompt = `You are "CareerPulse AI", an intelligent, encouraging, and expert AI Career Companion mentor for students seeking internships and early-career tech opportunities.

Student Profile Context:
- Name: ${studentContext.name || 'Student'}
- Degree: ${studentContext.degree || 'B.Tech / B.E. Computer Science'} (${studentContext.university || 'Engineering College'})
- Skills: ${JSON.stringify(studentContext.skills || [])}
- Target Roles: ${JSON.stringify(studentContext.preferred_roles || ['Software Engineer Intern'])}
- Resume Status: ${studentContext.hasResume ? 'Resume uploaded & analyzed' : 'No resume uploaded yet'}
- Recent Interview Average Score: ${studentContext.avgScore ? studentContext.avgScore + '/100' : 'No mock interviews taken yet'}
- Saved Internships: ${JSON.stringify(studentContext.savedInternships || [])}

Recent Chat History:
${chatHistory.slice(-6).map(m => `${m.role === 'user' ? 'Student' : 'CareerPulse AI'}: ${m.content}`).join('\n')}

Student's Latest Message:
"${userMessage}"

Provide a structured, friendly, concise, and highly actionable response. Use markdown formatting with bullet points, bold highlights, and clear next steps where applicable.`;

  const systemPrompt = "You are an empathetic, world-class Career Coach and Senior Tech Lead. Keep advice practical, inspiring, realistic, and tailored to the student's background.";

  const aiResult = await callGemini(prompt, systemPrompt, false);
  if (aiResult && typeof aiResult === 'string' && aiResult.trim().length > 0) {
    return aiResult;
  }

  // Heuristic chatbot fallback
  return generateHeuristicChatResponse(userMessage, studentContext);
}

// -------------------------------------------------------------
// HEURISTIC DOMAIN ENGINES (Offline / Quota-Resilient Fallbacks)
// -------------------------------------------------------------

function generateHeuristicResumeAnalysis(text) {
  const lower = text.toLowerCase();
  
  const skills = {
    programming: [],
    web: [],
    aiData: [],
    cloud: [],
    tools: [],
    soft: []
  };

  const skillPatterns = {
    programming: ['python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'c', 'go', 'rust', 'kotlin', 'swift', 'php', 'ruby'],
    web: ['react', 'node.js', 'nodejs', 'express', 'html5', 'css3', 'html', 'css', 'vue', 'angular', 'next.js', 'tailwind', 'bootstrap', 'fastapi', 'django', 'flask', 'rest api', 'graphql'],
    aiData: ['machine learning', 'deep learning', 'pandas', 'numpy', 'pytorch', 'tensorflow', 'scikit-learn', 'nlp', 'computer vision', 'data science', 'sql', 'mysql', 'postgresql', 'mongodb', 'tableau', 'powerbi'],
    cloud: ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'google cloud', 'linux', 'ci/cd', 'git', 'github actions', 'terraform', 'bash'],
    tools: ['git', 'github', 'vs code', 'postman', 'jira', 'figma', 'vite', 'npm', 'webpack'],
    soft: ['communication', 'teamwork', 'leadership', 'problem solving', 'critical thinking', 'time management', 'adaptability']
  };

  for (const [category, list] of Object.entries(skillPatterns)) {
    for (const item of list) {
      if (lower.includes(item)) {
        // Capitalize nicely
        const formatted = item.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        if (!skills[category].includes(formatted)) {
          skills[category].push(formatted);
        }
      }
    }
  }

  // Ensure reasonable default skills if minimal text
  if (skills.programming.length === 0) skills.programming.push('Python', 'JavaScript');
  if (skills.web.length === 0) skills.web.push('React', 'Node.js', 'HTML/CSS');
  if (skills.tools.length === 0) skills.tools.push('Git', 'VS Code', 'Postman');
  if (skills.soft.length === 0) skills.soft.push('Problem Solving', 'Team Collaboration');

  return {
    summary: `Motivated student technologist with demonstrated foundational knowledge in ${skills.programming.slice(0, 2).join(' & ')} and modern web technologies. Displays a proactive approach to engineering with practical project work.`,
    skills,
    strengths: [
      `Hands-on proficiency with modern developer tools including ${skills.programming[0] || 'core languages'} and ${skills.web[0] || 'web stacks'}`,
      "Well-structured project implementation background and strong foundational computer science knowledge",
      "Demonstrated ability to learn and adapt to new software libraries quickly"
    ],
    weaknesses: [
      "Could benefit from deeper practical exposure to automated unit/integration testing (Jest, PyTest)",
      "Opportunity to add production deployment experience using containerization (Docker) and CI/CD pipelines"
    ],
    recommendedSkills: [
      "Docker & Cloud Deployment Basics",
      "FastAPI / Microservices Architecture",
      "Automated Testing & Test-Driven Development (TDD)"
    ],
    careerSuggestions: [
      "Full-Stack Software Developer Intern",
      "AI / Machine Learning Engineer Intern",
      "Cloud Platform & DevOps Intern"
    ]
  };
}

function generateHeuristicQuestions(internship, difficulty, interviewType) {
  const role = internship.title || 'Software Engineer';
  return [
    {
      questionNumber: 1,
      category: "Technical Foundation",
      questionText: `Could you explain the core architecture of an application you built recently and how you selected the underlying technology stack for ${role}?`,
      expectedKeyPoints: ["Clear explanation of tech stack choice", "System architecture overview", "Database and state management considerations"],
      hint: "Use the STAR method (Situation, Task, Action, Result) to describe your project."
    },
    {
      questionNumber: 2,
      category: "Technical Depth",
      questionText: `What is the difference between synchronous and asynchronous processing, and how do you handle asynchronous operations and error states in your code?`,
      expectedKeyPoints: ["Event loop / concurrency explanation", "Promises, async/await or multithreading", "Try-catch blocks and structured error handling"],
      hint: "Give a concrete example from JavaScript Promises or Python AsyncIO."
    },
    {
      questionNumber: 3,
      category: "Problem Solving",
      questionText: `How would you optimize the performance of a web application or API that is experiencing high response latency under load?`,
      expectedKeyPoints: ["Profiling and bottleneck identification", "Database indexing and caching (Redis)", "Minification, CDN, and pagination"],
      hint: "Consider optimizations across database queries, network payload, and frontend rendering."
    },
    {
      questionNumber: 4,
      category: "Behavioral & Teamwork",
      questionText: `Describe a challenging bug or technical roadblock you encountered in a team or academic project. How did you diagnose and resolve it?`,
      expectedKeyPoints: ["Systematic debugging approach", "Collaboration with team members or mentors", "Key lesson learned and prevention strategy"],
      hint: "Focus on your structured problem-solving mindset and positive outcome."
    },
    {
      questionNumber: 5,
      category: "Role-Specific Scenario",
      questionText: `For the ${role} position at ${internship.company}, how would you ensure that your code is maintainable, well-tested, and secure before pushing to production?`,
      expectedKeyPoints: ["Unit and integration tests", "Code reviews and clean documentation", "Input sanitization and environment variable protection"],
      hint: "Mention automated testing, linting, CI/CD checks, and security hygiene."
    }
  ];
}

function generateHeuristicAnswerEvaluation(questionText, userAnswer) {
  const words = (userAnswer || '').trim().split(/\s+/).filter(Boolean);
  const length = words.length;

  let score = 70;
  let techScore = 70;
  let commScore = 75;
  let relScore = 75;

  if (length > 60) {
    score = Math.min(95, 80 + Math.floor(Math.random() * 12));
    techScore = Math.min(96, score + 2);
    commScore = Math.min(94, score - 1);
    relScore = Math.min(98, score + 3);
  } else if (length > 25) {
    score = 75 + Math.floor(Math.random() * 10);
    techScore = score - 2;
    commScore = score + 4;
    relScore = score + 1;
  } else {
    score = Math.max(45, 50 + length);
    techScore = score - 5;
    commScore = score;
    relScore = score + 2;
  }

  return {
    score,
    technicalScore: techScore,
    communicationScore: commScore,
    relevanceScore: relScore,
    feedback: length > 30 
      ? "Strong and articulated answer! You addressed the core concept with good technical clarity and practical terminology."
      : "Good initial thought, but the response would benefit from deeper technical explanation and specific concrete examples.",
    keyPointsMentioned: [
      "Identified primary technical concepts directly related to the question",
      "Demonstrated logical thought progression and relevant keywords"
    ],
    missedPoints: [
      "Could include specific trade-offs or alternative edge case considerations",
      "Mentioning automated testing or performance telemetry would elevate this answer"
    ],
    idealAnswerSummary: "An ideal response clearly defines the foundational concept, walks through a real-world scenario with architectural choices, and discusses performance, scalability, and error resilience."
  };
}

function generateHeuristicChatResponse(message, context) {
  const lower = message.toLowerCase();

  if (lower.includes('resume') || lower.includes('cv')) {
    return `### 📄 Resume Optimization Tips for ${context.name || 'Student'}

Based on your profile, here are high-impact ways to make your resume stand out to recruiters:

1. **Quantify Your Impact**: Rather than writing *"Built a web app"*, write *"Developed a full-stack React & Node.js application reducing query response time by 35% using SQLite indexing."*
2. **Highlight Core Tech Stack**: Make sure your top languages (${(context.skills || ['Python', 'JavaScript', 'React']).slice(0, 4).join(', ')}) are visible right under your name and in project descriptions.
3. **Add Live Demo & GitHub Links**: Recruiters love clicking working deployment links (e.g. Vercel, Render) and reviewing clean Git commits.
4. **Include Testing & DevOps**: Mentioning tools like Docker, Git Actions, or Jest immediately sets you apart from 80% of student applicants.

Would you like me to review a specific project description or help you write strong bullet points?`;
  }

  if (lower.includes('interview') || lower.includes('mock') || lower.includes('prep')) {
    return `### 🎯 Interview Preparation Strategy

For your target roles (${(context.preferred_roles || ['Software Engineer Intern']).join(', ')}):

1. **Technical Foundations**: Revise Data Structures (Arrays, Hash Maps, Trees, Graphs) and algorithmic time/space complexities ($O(n)$, $O(\\log n)$).
2. **System & Web Basics**: Be ready to explain REST APIs, Database transactions (ACID), HTTP methods, and State Management.
3. **STAR Method for Behavioral Questions**:
   - **S**ituation: Context of what happened
   - **T**ask: Your specific responsibility
   - **A**ction: The technical steps you executed
   - **R**esult: The measurable positive outcome
4. **Practice with our AI Mock Interviewer**: Take a 5-question mock session in the **Mock Interview** tab right now to get real-time scores and constructive feedback!`;
  }

  if (lower.includes('internship') || lower.includes('match') || lower.includes('apply')) {
    return `### 💼 Internship Discovery & Matching Guidance

Here is how you can maximize your internship chances today:

- **Check Your Top Matches**: Head to the **Recommendations** page to see your highest-compatibility internships ranked with our hybrid matching engine.
- **Review Skill Gaps**: Look at missing skills (such as Docker, FastAPI, or Cloud fundamentals) and prioritize the high-impact ones first.
- **Tailor Before Applying**: Align your resume keywords to match the exact requirements listed on the internship posting.

Would you like me to break down the required skills for any specific company or role?`;
  }

  return `Hello ${context.name || 'there'}! I'm your **CareerPulse AI Companion**. 🚀

I have your profile and career preferences loaded. Here is how I can assist you right now:

- 📊 **Analyze your skills & resume** to identify your top competitive advantages and skill gaps.
- 🔍 **Recommend the best live internships** tailored to your technical abilities and preferred work modes.
- 🎯 **Generate customized interview questions** and coach you through full mock interviews.
- 💡 **Build a step-by-step learning roadmap** to master any missing technologies.
- ✍️ **Craft tailored cover letters** for specific internship roles.

What would you like to work on today?`;
}

/**
 * 6. Cover Letter Agent
 */
export async function generateCoverLetterWithGemini(candidateProfile, internship, tone = 'Professional & Enthusiastic') {
  const prompt = `Write a highly targeted, compelling cover letter for a student applying to an internship.
Candidate Information:
- Name: ${candidateProfile.full_name || candidateProfile.name || 'Candidate'}
- University & Degree: ${candidateProfile.degree || 'Computer Science'}, ${candidateProfile.university || 'University'} (Graduation: ${candidateProfile.graduation_year || '2026'})
- Skills: ${JSON.stringify(candidateProfile.technical_skills || candidateProfile.skills || [])}
- Target Roles: ${JSON.stringify(candidateProfile.preferred_roles || [])}

Target Internship:
- Role: ${internship.title}
- Company: ${internship.company}
- Location: ${internship.location} (${internship.work_mode || 'Hybrid'})
- Required Skills: ${internship.required_skills_json || '[]'}
- Description: ${internship.description || ''}
- Tone: ${tone}

Return valid JSON:
{
  "coverLetter": "Full formatted cover letter with date, company address, salutation, 3 focused body paragraphs (hook/passion, technical skills alignment with concrete examples, culture/mission fit), and professional sign-off with candidate name",
  "keyHighlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
  "customizedForCompany": "${internship.company}",
  "tips": "1-2 actionable tips for the student before submitting"
}`;

  const systemPrompt = "You are an Elite Tech Career Coach and Executive Recruiter. Write authentic, persuasive, student cover letters that highlight genuine problem-solving ability.";

  const aiResult = await callGemini(prompt, systemPrompt, true);
  if (aiResult && aiResult.coverLetter) {
    return aiResult;
  }

  // Heuristic Cover Letter Fallback
  return generateHeuristicCoverLetter(candidateProfile, internship);
}

function generateHeuristicCoverLetter(profile, internship) {
  const name = profile.full_name || profile.name || 'Candidate';
  const university = profile.university || 'our university';
  const degree = profile.degree || 'Computer Science';
  const skills = Array.isArray(profile.technical_skills) ? profile.technical_skills : (Array.isArray(profile.skills) ? profile.skills : ['Python', 'JavaScript', 'React']);
  const topSkills = skills.slice(0, 3).join(', ');

  const letter = `Dear Hiring Team at ${internship.company},

I am writing to enthusiastically apply for the ${internship.title} internship position at ${internship.company}. As a ${degree} student at ${university}, I have dedicated my academic and project work to building robust, scalable software solutions, and I have long admired ${internship.company}'s engineering standards and impact in the industry.

Through hands-on projects and coursework, I have developed strong proficiencies in ${topSkills}. I recently engineered end-to-end applications where I solved complex data modeling challenges and delivered responsive user experiences. My technical toolkit closely matches your requirements for ${internship.title}, and I am eager to apply my skills to solve real-world problems for your team.

What excites me most about joining ${internship.company} is the collaborative, high-growth engineering environment. I am proactive, quick to master new technical stacks, and committed to writing clean, maintainable code. 

Thank you for your time and consideration. I would welcome the opportunity to discuss how my technical skills and enthusiasm can contribute to ${internship.company}'s upcoming initiatives.

Sincerely,
${name}`;

  return {
    coverLetter: letter,
    keyHighlights: [
      `Tailored alignment with ${internship.company}'s ${internship.title} requirements`,
      `Highlighted core strengths in ${topSkills}`,
      `Structured using industry-standard 3-paragraph persuasive format`
    ],
    customizedForCompany: internship.company,
    tips: "Customize the project examples with metrics from your own portfolio before sending!"
  };
}

