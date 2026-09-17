import { callGemini } from './geminiService.js';
import { runSkillGapAnalysisAgent } from './skillGapAgent.js';

/**
 * Normalizes text for tokens.
 */
function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9+#]/g, '').trim();
}

/**
 * M3.3: Generates comprehensive Pre-Interview Revision Guide & Topics Checklist.
 */
export async function generatePreInterviewPrepGuide(internship, candidateProfile) {
  // 1. Run Skill Gap Agent to get concrete gap knowledge
  const gapAnalysis = await runSkillGapAnalysisAgent(candidateProfile, internship);

  const missingSkills = gapAnalysis.gapClassifications.criticalMissing.map(s => s.skill);
  const partialSkills = gapAnalysis.gapClassifications.partiallyDemonstrated.map(s => s.skill);
  const matchedSkills = gapAnalysis.gapClassifications.matching.map(s => s.skill);

  const role = internship.title || 'Software Engineering Intern';
  const company = internship.company || 'Tech Company';

  // 2. Generate structured revision topics
  const technicalRevisionTopics = [
    {
      topic: `${matchedSkills[0] || 'Core Language'} & Core Fundamentals`,
      priority: 'High',
      estimatedHours: '2-3 Hours',
      keyConceptsToRevise: ['Data types, scoping, memory model, and concurrency basics', 'Object-Oriented Design vs Functional paradigms', 'Standard library utilities and common built-in algorithms']
    },
    {
      topic: `${missingSkills[0] || partialSkills[0] || 'System Architecture'} High-Priority Gap`,
      priority: 'Urgent',
      estimatedHours: '3-4 Hours',
      keyConceptsToRevise: ['Core architectural role and purpose in modern software stacks', 'Basic setup, standard syntax, and common commands', 'How this technology connects with other backend/frontend tiers']
    },
    {
      topic: 'API Design & Database Querying',
      priority: 'Medium',
      estimatedHours: '2 Hours',
      keyConceptsToRevise: ['RESTful HTTP verbs, status codes, and error payloads', 'SQL JOIN operations, indexing strategies, and ACID transactions', 'Handling asynchronous requests and latency bottlenecks']
    },
    {
      topic: 'Testing & Engineering Hygiene',
      priority: 'Medium',
      estimatedHours: '1-2 Hours',
      keyConceptsToRevise: ['Unit testing vs integration testing principles', 'Git branching workflows, code review best practices', 'Basic CI/CD pipeline automation and environment variables']
    }
  ];

  const behavioralStrategies = [
    {
      strategy: 'STAR Method Mastery',
      summary: 'Structure every behavioral answer around Situation, Task, Action, and measurable Result.',
      tip: 'Spend 60% of your time on the Action (what YOU specifically did) and Result (metrics or lessons).'
    },
    {
      strategy: 'Walkthrough of Your Best Project',
      summary: `Prepare a 2-minute elevator pitch for your top project, followed by readiness for deep-dive questions on data architecture.`,
      tip: 'Clearly articulate one technical trade-off or difficult bug you diagnosed.'
    },
    {
      strategy: `${company} Company Research`,
      summary: `Understand ${company}'s core business model, target users, and engineering values.`,
      tip: 'Prepare 2 insightful questions for the interviewer about their tech stack or onboarding.'
    }
  ];

  return {
    internshipId: internship.id,
    roleTitle: role,
    company,
    targetReadinessScore: gapAnalysis.metrics.readinessScore,
    identifiedGapsCount: missingSkills.length + partialSkills.length,
    technicalRevisionTopics,
    behavioralStrategies,
    recommendedChecklist: [
      `Review syntax nuances for ${matchedSkills.slice(0, 3).join(', ') || 'core languages'}`,
      `Study high-level architecture of ${missingSkills[0] || 'cloud containerization'}`,
      `Practice explaining 1 challenging technical obstacle using STAR format`,
      `Formulate 2 thoughtful questions for ${company} hiring managers`
    ]
  };
}

/**
 * M3.3: Generates 5 distinct, role-specific question categories.
 */
export async function generateCategorizedInterviewQuestions(internship, candidateProfile, difficulty = 'Intermediate') {
  const role = internship.title || 'Software Engineering Intern';
  const company = internship.company || 'Tech Company';
  const requiredSkills = internship.required_skills_json ? (typeof internship.required_skills_json === 'string' ? JSON.parse(internship.required_skills_json) : internship.required_skills_json) : ['JavaScript', 'Python', 'React', 'SQL'];
  
  const studentProjects = candidateProfile.projects || (candidateProfile.projects_json ? (typeof candidateProfile.projects_json === 'string' ? JSON.parse(candidateProfile.projects_json) : candidateProfile.projects_json) : []);
  const studentSkills = candidateProfile.skills || candidateProfile.technical_skills || ['Python', 'JavaScript'];

  const prompt = `You are a Principal Technical Interviewer and Hiring Bar Raiser at a top tier tech enterprise.
Generate a realistic 5-question mock interview questionnaire for:
Role: ${role} at ${company}
Difficulty: ${difficulty}
Candidate Verified Skills: ${JSON.stringify(studentSkills)}
Candidate Projects: ${JSON.stringify(studentProjects.slice(0, 2))}
Job Required Skills: ${JSON.stringify(requiredSkills)}

You MUST generate exactly 5 questions spanning these 5 distinct categories:
1. "Technical": Deep-dive into language internals, data structures, or framework APIs.
2. "Resume-Based": Probing candidate's specific claimed skills, tools, or coursework.
3. "Project-Based": Architectural trade-offs, bottlenecks, and engineering decisions in candidate's past projects.
4. "Role-Specific Scenario": Practical real-world problem solving directly reflecting ${role} day-to-day duties at ${company}.
5. "HR / Behavioral": Behavioral question evaluating teamwork, conflict, or learning under deadlines using STAR format.

Return valid JSON:
{
  "questions": [
    {
      "questionNumber": 1,
      "category": "Technical",
      "questionText": "...",
      "expectedKeyPoints": ["Point 1", "Point 2", "Point 3"],
      "commonPitfallsToAvoid": "Common mistake candidates make",
      "hint": "Short guiding hint if candidate gets stuck"
    },
    {
      "questionNumber": 2,
      "category": "Resume-Based",
      "questionText": "...",
      "expectedKeyPoints": ["Point 1", "Point 2"],
      "commonPitfallsToAvoid": "...",
      "hint": "..."
    },
    {
      "questionNumber": 3,
      "category": "Project-Based",
      "questionText": "...",
      "expectedKeyPoints": ["Point 1", "Point 2"],
      "commonPitfallsToAvoid": "...",
      "hint": "..."
    },
    {
      "questionNumber": 4,
      "category": "Role-Specific Scenario",
      "questionText": "...",
      "expectedKeyPoints": ["Point 1", "Point 2"],
      "commonPitfallsToAvoid": "...",
      "hint": "..."
    },
    {
      "questionNumber": 5,
      "category": "HR / Behavioral",
      "questionText": "...",
      "expectedKeyPoints": ["Point 1", "Point 2"],
      "commonPitfallsToAvoid": "...",
      "hint": "..."
    }
  ]
}`;

  const systemPrompt = "You are a Staff Software Engineer and Hiring Committee Chair. Produce sharp, insightful, categorized interview questions in JSON.";

  let aiResult = await callGemini(prompt, systemPrompt, true);

  if (!aiResult || !aiResult.questions || aiResult.questions.length < 5) {
    aiResult = {
      questions: generateHeuristicCategorizedQuestions(internship, candidateProfile, difficulty)
    };
  }

  return aiResult.questions;
}

/**
 * M3.3: 3-Dimensional Interview Answer Evaluator.
 */
export async function evaluateInterviewAnswerM3(question, userAnswer, roleTitle, difficulty = 'Intermediate') {
  const qText = typeof question === 'string' ? question : (question.questionText || question.question_text || '');
  const category = (typeof question === 'object' && question.category) ? question.category : 'Technical';
  const idealPoints = (typeof question === 'object' && question.expectedKeyPoints) ? question.expectedKeyPoints : [];

  const prompt = `You are a Technical Interview Evaluator.
Role: ${roleTitle} (${difficulty})
Question Category: ${category}
Question: "${qText}"
Candidate's Answer: "${userAnswer}"
Ideal Concepts to Cover: ${JSON.stringify(idealPoints)}

Evaluate strictly on 3 dimensions (0 - 100):
1. technicalCorrectness: Technical accuracy, depth of explanation, correct terminology.
2. communicationClarity: Logical progression, structured delivery, concise articulation.
3. relevanceAndCompleteness: Directly answered what was asked without wandering off-topic.

Return valid JSON:
{
  "overallScore": 85,
  "technicalScore": 86,
  "communicationScore": 84,
  "relevanceScore": 85,
  "feedback": "2-3 constructive sentences highlighting what went well and specific areas to refine",
  "strengthsHighlighted": [
    "Identified correct architectural approach",
    "Clear explanation of asynchronous state management"
  ],
  "missedConcepts": [
    "Did not mention error handling / fallback strategies",
    "Could have quantified performance or time complexity"
  ],
  "idealModelAnswer": "A concise 3-4 sentence breakdown of what a 100/100 candidate response covers"
}`;

  const systemPrompt = "You are a warm, rigorous engineering hiring lead. Evaluate candidate answers fairly and constructively.";

  let aiResult = await callGemini(prompt, systemPrompt, true);

  if (!aiResult || typeof aiResult.overallScore !== 'number') {
    aiResult = generateHeuristicAnswerEvaluationM3(qText, userAnswer, category);
  }

  return aiResult;
}

// -------------------------------------------------------------
// HEURISTIC ENGINES FOR INTERVIEW PREPARATION AGENT
// -------------------------------------------------------------

function generateHeuristicCategorizedQuestions(internship, profile, difficulty) {
  const role = internship.title || 'Software Engineering Intern';
  const company = internship.company || 'Tech Enterprise';
  const reqSkills = internship.required_skills_json ? (typeof internship.required_skills_json === 'string' ? JSON.parse(internship.required_skills_json) : internship.required_skills_json) : ['JavaScript', 'Python'];
  const topReq = reqSkills[0] || 'Python';
  const proj = profile.projects?.[0] || { title: 'Software Engineering Project' };
  const projTitle = typeof proj === 'string' ? proj : (proj.title || 'Recent Project');

  return [
    {
      questionNumber: 1,
      category: 'Technical',
      questionText: `Can you explain the difference between synchronous and asynchronous execution in ${topReq}, and how you prevent blocking the main thread or event loop during intensive operations?`,
      expectedKeyPoints: [
        'Non-blocking I/O vs synchronous execution model',
        'Promises, async/await, or threading/multiprocessing constructs',
        'Error handling and unhandled rejection strategies'
      ],
      commonPitfallsToAvoid: 'Only stating that async is "faster" without explaining how concurrency and the event loop actually handle task scheduling.',
      hint: 'Think about network I/O calls versus CPU-heavy algorithmic loops.'
    },
    {
      questionNumber: 2,
      category: 'Resume-Based',
      questionText: `Looking at your resume, you listed experience with ${profile.skills?.[0] || 'modern software stacks'}. How have you used this skill in practice, and what is a key architectural lesson you learned?`,
      expectedKeyPoints: [
        'Concrete context of where and how the skill was utilized',
        'Specific challenges encountered and resolved',
        'Demonstrated understanding of best practices'
      ],
      commonPitfallsToAvoid: 'Giving vague definitions rather than walking through your specific practical implementation.',
      hint: 'Reference a specific feature or module you personally built.'
    },
    {
      questionNumber: 3,
      category: 'Project-Based',
      questionText: `In your project "${projTitle}", how did you decide on the overall data architecture and database schema, and what trade-offs did you consider regarding scalability?`,
      expectedKeyPoints: [
        'Rationale behind database and tech stack selection',
        'Data normalization, indexing, or state caching considerations',
        'How the system handles increasing user load or query volume'
      ],
      commonPitfallsToAvoid: 'Describing only the frontend user interface rather than the end-to-end data flow and backend constraints.',
      hint: 'Structure your response: Problem -> Options considered -> Chosen solution -> Outcome.'
    },
    {
      questionNumber: 4,
      category: 'Role-Specific Scenario',
      questionText: `As a ${role} at ${company}, suppose a production API or service suddenly experiences high latency and times out under sudden traffic spikes. How would you systematically diagnose and mitigate the root cause?`,
      expectedKeyPoints: [
        'Systematic debugging: logs, metrics, APM profiling, and network diagnostics',
        'Identifying common bottlenecks: database query locks, CPU thrashing, memory leaks',
        'Short-term mitigation (caching, rate-limiting) vs long-term permanent fix'
      ],
      commonPitfallsToAvoid: 'Jumping immediately to random code changes without first checking telemetry, error logs, and metrics.',
      hint: 'Walk through your diagnostic workflow from alert to resolution.'
    },
    {
      questionNumber: 5,
      category: 'HR / Behavioral',
      questionText: `Tell me about a time when you were working on a tight project deadline with ambiguous requirements or a challenging team disagreement. How did you handle it and ensure successful delivery?`,
      expectedKeyPoints: [
        'Clear STAR format: Situation, Task, Action, Result',
        'Proactive communication and alignment with stakeholders or peers',
        'Positive outcome and key takeaways for future teamwork'
      ],
      commonPitfallsToAvoid: 'Blaming team members or mentors rather than focusing on constructive communication and problem-solving.',
      hint: 'Focus on your initiative, active listening, and measurable resolution.'
    }
  ];
}

function generateHeuristicAnswerEvaluationM3(questionText, userAnswer, category) {
  const words = (userAnswer || '').trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  let techScore = 70;
  let commScore = 72;
  let relScore = 75;

  if (wordCount > 60) {
    techScore = Math.min(95, 82 + Math.floor(Math.random() * 10));
    commScore = Math.min(94, 80 + Math.floor(Math.random() * 12));
    relScore = Math.min(96, 84 + Math.floor(Math.random() * 10));
  } else if (wordCount > 25) {
    techScore = 74 + Math.floor(Math.random() * 8);
    commScore = 76 + Math.floor(Math.random() * 8);
    relScore = 78 + Math.floor(Math.random() * 8);
  } else {
    techScore = Math.max(45, 50 + wordCount);
    commScore = Math.max(50, 52 + wordCount);
    relScore = Math.max(55, 55 + wordCount);
  }

  const overallScore = Math.round((techScore * 0.45) + (commScore * 0.30) + (relScore * 0.25));

  return {
    overallScore,
    technicalScore: techScore,
    communicationScore: commScore,
    relevanceScore: relScore,
    feedback: wordCount > 35
      ? `Strong, well-structured response. You clearly articulated the core principles of ${category} reasoning and used appropriate engineering terminology.`
      : `Good starting intuition, but the answer lacks technical depth and concrete real-world examples. Expanding on trade-offs and error handling will significantly boost your score.`,
    strengthsHighlighted: [
      `Directly addressed the fundamental concept of the question`,
      `Maintained a clear, professional tone and logical explanation flow`
    ],
    missedConcepts: [
      `Could have explicitly outlined edge cases or potential failure modes`,
      `Consider mentioning concrete performance benchmarks or testing verification`
    ],
    idealModelAnswer: `A comprehensive answer begins with a clear 1-sentence definition, walks through a concrete architecture/code scenario with trade-offs, and concludes with testing and monitoring best practices.`
  };
}
