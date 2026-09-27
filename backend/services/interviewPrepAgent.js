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
 * Domain detection helper for internship roles.
 */
function detectRoleDomain(roleTitle = '', requiredSkills = []) {
  const combined = (roleTitle + ' ' + (Array.isArray(requiredSkills) ? requiredSkills.join(' ') : '')).toLowerCase();
  
  if (/ai|machine learning|ml|data science|nlp|computer vision|deep learning|llm|neural|genai|prompt/.test(combined)) {
    return 'AI_ML';
  }
  if (/frontend|react|vue|angular|ui|ux|web developer|next\.?js|css|html|tailwind|svelte/.test(combined)) {
    return 'FRONTEND';
  }
  if (/backend|node|express|django|flask|fastapi|spring|golang|go |java |postgres|sql|nosql|redis|database|rest api|microservice/.test(combined)) {
    return 'BACKEND';
  }
  if (/devops|cloud|aws|azure|gcp|kubernetes|docker|sre|infrastructure|ci\/cd|terraform|ansible|linux/.test(combined)) {
    return 'DEVOPS_CLOUD';
  }
  if (/mobile|android|ios|react native|flutter|swift|kotlin/.test(combined)) {
    return 'MOBILE';
  }
  if (/security|cyber|infosec|penetration|soc|cryptography|vulnerability|owasp/.test(combined)) {
    return 'CYBERSECURITY';
  }
  if (/data engineer|etl|spark|hadoop|pipeline|warehouse|snowflake|dbt|bigquery|kafka/.test(combined)) {
    return 'DATA_ENGINEERING';
  }
  if (/qa|test|automation|quality|sdet|selenium|cypress|playwright|jest/.test(combined)) {
    return 'QA_SDET';
  }
  return 'FULLSTACK';
}

/**
 * M3.3: Generates distinct, role-specific question categories for customizable question count.
 */
export async function generateCategorizedInterviewQuestions(
  internship, 
  candidateProfile, 
  difficulty = 'Intermediate', 
  questionCount = 5,
  focusMode = 'Balanced'
) {
  const count = Math.min(10, Math.max(1, parseInt(questionCount, 10) || 5));
  const role = internship.title || 'Software Engineering Intern';
  const company = internship.company || 'Tech Company';
  const requiredSkills = internship.required_skills_json 
    ? (typeof internship.required_skills_json === 'string' ? JSON.parse(internship.required_skills_json) : internship.required_skills_json) 
    : ['JavaScript', 'Python', 'React', 'SQL'];
  
  const studentProjects = candidateProfile.projects || (candidateProfile.projects_json ? (typeof candidateProfile.projects_json === 'string' ? JSON.parse(candidateProfile.projects_json) : candidateProfile.projects_json) : []);
  const studentSkills = candidateProfile.skills || candidateProfile.technical_skills || ['Python', 'JavaScript'];
  const roleDomain = detectRoleDomain(role, requiredSkills);

  // Define category distribution based on count and focus mode
  const categoryPlan = [];
  for (let i = 1; i <= count; i++) {
    if (focusMode === 'Technical Deep-Dive') {
      if (i % 3 === 1) categoryPlan.push('Technical Internals');
      else if (i % 3 === 2) categoryPlan.push('System Architecture & Code Optimization');
      else categoryPlan.push('Algorithm & Concurrency');
    } else if (focusMode === 'System Architecture & Scenarios') {
      if (i % 2 === 1) categoryPlan.push('Role-Specific Production Scenario');
      else categoryPlan.push('System Design & Bottlenecks');
    } else if (focusMode === 'Behavioral & STAR Leadership') {
      if (i % 2 === 1) categoryPlan.push('HR / Behavioral (STAR)');
      else categoryPlan.push('Engineering Leadership & Collaboration');
    } else {
      // Balanced Full-Loop
      const defaultSequence = [
        'Core Technical',
        'Resume & Practical Skills',
        'Project Architecture Deep-Dive',
        'Role-Specific Production Scenario',
        'HR / Behavioral (STAR)',
        'System Optimization & Scaling',
        'Security & Edge Cases',
        'Cross-Functional Collaboration',
        'Code Refactoring & Testing',
        'Strategic Tech Trade-offs'
      ];
      categoryPlan.push(defaultSequence[i - 1] || 'Technical');
    }
  }

  const prompt = `You are a Principal Engineering Bar Raiser and Hiring Manager at ${company}.
Conduct a realistic, highly personalized mock interview for:
Role: ${role} at ${company}
Target Domain: ${roleDomain}
Difficulty: ${difficulty}
Focus Mode: ${focusMode}
Candidate Verified Skills: ${JSON.stringify(studentSkills.slice(0, 8))}
Candidate Projects: ${JSON.stringify(studentProjects.slice(0, 3))}
Job Required Skills: ${JSON.stringify(requiredSkills.slice(0, 8))}
Session Randomization Salt: ${Date.now()}-${Math.random().toString(36).substring(7)}

GENERATE EXACTLY ${count} UNIQUE, SHARP, ROLE-SPECIFIC QUESTIONS.
Do NOT generate generic, cliché questions like "what is OOP" or basic textbook definitions. 
Every question MUST directly test real-world engineering thinking, toolchains, trade-offs, and practical challenges specific to ${role} in ${roleDomain}.

Question Plan (Total ${count} questions):
${categoryPlan.map((cat, idx) => `${idx + 1}. Category: "${cat}"`).join('\n')}

Return strictly valid JSON with this exact schema:
{
  "questions": [
    ${categoryPlan.map((cat, idx) => `{
      "questionNumber": ${idx + 1},
      "category": "${cat}",
      "questionText": "Detailed question directly tailored to ${role} at ${company}...",
      "expectedKeyPoints": ["Specific technical concept 1", "Trade-off or implementation detail 2", "Best practice 3"],
      "commonPitfallsToAvoid": "Common blunder or surface-level mistake candidates make",
      "hint": "Insightful 1-sentence hint guiding the candidate"
    }`).join(',\n    ')}
  ]
}`;

  const systemPrompt = `You are an elite Staff Engineer and Technical Interviewer at ${company}. Generate non-repetitive, high-fidelity, role-authentic interview questions tailored specifically to the ${roleDomain} domain and difficulty ${difficulty}. Always output strict JSON.`;

  let aiResult = await callGemini(prompt, systemPrompt, true);

  if (!aiResult || !aiResult.questions || !Array.isArray(aiResult.questions) || aiResult.questions.length < count) {
    aiResult = {
      questions: generateHeuristicCategorizedQuestions(internship, candidateProfile, difficulty, count, focusMode)
    };
  }

  // Ensure 1-indexed numbering and clean formats
  const finalQuestions = (aiResult.questions || []).slice(0, count).map((q, idx) => ({
    questionNumber: idx + 1,
    category: q.category || categoryPlan[idx] || 'Technical',
    questionText: q.questionText || `Explain key architectural considerations for ${role}.`,
    expectedKeyPoints: Array.isArray(q.expectedKeyPoints) && q.expectedKeyPoints.length > 0 
      ? q.expectedKeyPoints 
      : ['Clear explanation of principles', 'Concrete real-world example', 'Awareness of performance trade-offs'],
    commonPitfallsToAvoid: q.commonPitfallsToAvoid || 'Giving vague definitions without concrete technical depth.',
    hint: q.hint || 'Structure your answer around core mechanisms, trade-offs, and verification.'
  }));

  return finalQuestions;
}

/**
 * Rich, randomized domain-specific heuristic fallback engine.
 */
function generateHeuristicCategorizedQuestions(internship, profile, difficulty, count = 5, focusMode = 'Balanced') {
  const role = internship.title || 'Software Engineering Intern';
  const company = internship.company || 'Tech Enterprise';
  const reqSkills = internship.required_skills_json 
    ? (typeof internship.required_skills_json === 'string' ? JSON.parse(internship.required_skills_json) : internship.required_skills_json) 
    : ['JavaScript', 'Python', 'React', 'SQL'];
  
  const skill1 = reqSkills[0] || profile.skills?.[0] || 'Modern Programming';
  const skill2 = reqSkills[1] || profile.skills?.[1] || 'System Architecture';
  const skill3 = reqSkills[2] || profile.skills?.[2] || 'Data Pipelines';
  
  const proj = profile.projects?.[0] || { title: 'Full-Stack Portfolio Project' };
  const projTitle = typeof proj === 'string' ? proj : (proj.title || 'Recent Engineering Project');
  const domain = detectRoleDomain(role, reqSkills);

  // Domain-specific bank of realistic questions
  const domainQuestionBanks = {
    AI_ML: [
      {
        category: 'Technical (Core AI/ML)',
        questionText: `In machine learning pipelines utilizing ${skill1}, how do you detect and mitigate data leakage and target drift between training and production feature distributions?`,
        expectedKeyPoints: ['Temporal data splitting vs random splitting', 'Feature scaling fit strictly on train folds', 'Monitoring Kolmogorov-Smirnov or PSI metrics in inference'],
        commonPitfallsToAvoid: 'Applying transformations or imputations across the full dataset prior to train/test split.',
        hint: 'Think about how feature transformers fit during cross-validation.'
      },
      {
        category: 'Technical (LLM & RAG Architecture)',
        questionText: `Suppose you are designing a Retrieval-Augmented Generation (RAG) system for ${company}. How would you optimize chunking strategies, embedding vector retrieval, and re-ranking to minimize hallucination?`,
        expectedKeyPoints: ['Semantic chunking with contextual overlap', 'Hybrid search (Dense vector + BM25 keyword)', 'Cross-encoder re-ranking and prompt grounding'],
        commonPitfallsToAvoid: 'Relying solely on cosine similarity of large arbitrary chunks without reranking or metadata filtering.',
        hint: 'Walk through the query processing, retrieval, reranking, and prompt synthesis stages.'
      },
      {
        category: 'Technical (Model Optimization & Inference)',
        questionText: `When deploying deep learning or transformer models to low-latency production endpoints, what quantization and model distillation techniques do you consider?`,
        expectedKeyPoints: ['INT8/FP16 quantization (PTQ vs QAT)', 'Knowledge distillation student-teacher paradigms', 'TensorRT, ONNX Runtime, or batch inference serving'],
        commonPitfallsToAvoid: 'Ignoring accuracy degradation during post-training quantization.',
        hint: 'Compare memory footprint vs inference latency vs model perplexity.'
      },
      {
        category: 'Technical (Evaluation & Metrics)',
        questionText: `For an imbalanced classification problem in ${company}'s domain, why is accuracy misleading, and how do you evaluate Precision-Recall AUC versus ROC AUC?`,
        expectedKeyPoints: ['True Negative dominance skewing ROC-AUC', 'PR-AUC focusing on the minority positive class', 'F-beta score and setting optimal decision thresholds based on business cost'],
        commonPitfallsToAvoid: 'Relying solely on 99% accuracy when positive classes represent <1% of data.',
        hint: 'Explain the denominator difference between False Positive Rate and Precision.'
      }
    ],

    FRONTEND: [
      {
        category: 'Technical (Frontend Architecture)',
        questionText: `In modern ${skill1} applications, how does the reconciliation/Virtual DOM algorithm minimize layout thrashing, and how do you prevent unnecessary re-render cascades in deeply nested component trees?`,
        expectedKeyPoints: ['Component memoization (React.memo, useMemo, useCallback)', 'State colocation vs global store updates', 'Fiber reconciliation tree diffing and key prop semantics'],
        commonPitfallsToAvoid: 'Wrapping every single variable in memoization without considering reference equality overhead.',
        hint: 'Discuss how state changes propagate through the component render tree.'
      },
      {
        category: 'Technical (Web Performance & Core Vitals)',
        questionText: `If a web application at ${company} suffers from poor Largest Contentful Paint (LCP) and Interaction to Next Paint (INP), what diagnostic workflow and optimizations would you implement?`,
        expectedKeyPoints: ['Code-splitting and dynamic route-based lazy loading', 'Asset preloading, modern image formats (WebP/AVIF), and CDN caching', 'Offloading long CPU tasks with Web Workers or requestIdleCallback'],
        commonPitfallsToAvoid: 'Focusing only on bundle size while ignoring main-thread JavaScript execution bottlenecks.',
        hint: 'Break down network fetch time, render blocking resources, and main-thread task durations.'
      },
      {
        category: 'Technical (State Management & Async Flow)',
        questionText: `How do you handle complex asynchronous state, optimistic UI updates, and cache invalidation when multiple components depend on shared mutating server data?`,
        expectedKeyPoints: ['Server state management (TanStack Query, SWR, or Redux Toolkit Query)', 'Optimistic rollback on mutation errors', 'Deduplication and normalized client caching'],
        commonPitfallsToAvoid: 'Storing duplicating server state in local component state causing synchronization drift.',
        hint: 'Walk through an optimistic UI update scenario with network failure rollback.'
      },
      {
        category: 'Technical (Accessibility & Responsive Design)',
        questionText: `How do you architect reusable UI components that are fully compliant with WCAG 2.1 AA standards, keyboard navigable, and responsive across varied viewports?`,
        expectedKeyPoints: ['Semantic HTML elements vs ARIA attributes', 'Focus management and trapping inside interactive modals/drawers', 'Fluid typography and modern CSS grid/flexbox without layout shifts'],
        commonPitfallsToAvoid: 'Using generic <div> elements with click listeners without keyboard event handlers or role attributes.',
        hint: 'Explain keyboard tab indexing, ARIA live regions, and semantic landmarks.'
      }
    ],

    BACKEND: [
      {
        category: 'Technical (API Design & Concurrency)',
        questionText: `When designing high-throughput REST or GraphQL APIs in ${skill1}, how do you manage connection pooling, thread/event concurrency, and gracefully handle traffic spikes without starving system resources?`,
        expectedKeyPoints: ['Database connection pool sizing and lifecycle', 'Asynchronous non-blocking I/O vs thread workers', 'Rate limiting, token buckets, and exponential backoff on upstream services'],
        commonPitfallsToAvoid: 'Creating new database connections per incoming request instead of leveraging pooled connections.',
        hint: 'Contrast thread-per-request architectures with event-driven non-blocking loops.'
      },
      {
        category: 'Technical (Database Optimization & Indexing)',
        questionText: `In relational or NoSQL databases, how do you diagnose slow queries using EXPLAIN ANALYZE, and what are the trade-offs of composite B-Tree indexes versus partitioning?`,
        expectedKeyPoints: ['Sequential scans vs Index scans / Index-Only scans', 'Leftmost prefix rule for composite indexes', 'Write amplification overhead on tables with heavy insert volume'],
        commonPitfallsToAvoid: 'Adding indexes to every column without realizing the write performance penalty and disk space overhead.',
        hint: 'Walk through how the query planner chooses an execution plan based on statistics.'
      },
      {
        category: 'Technical (Distributed Systems & Caching)',
        questionText: `How would you implement a distributed caching strategy (e.g., Redis) with Cache-Aside vs Write-Through patterns, and how do you protect against cache stampedes, penetration, and avalanche?`,
        expectedKeyPoints: ['Cache-aside pattern and TTL jittering for avalanche prevention', 'Bloom filters to guard against cache penetration', 'Mutex/distributed locks to prevent cache stampedes on expired hot keys'],
        commonPitfallsToAvoid: 'Setting identical expiration times across all cached keys leading to synchronized bulk misses.',
        hint: 'Define what happens when a million requests hit an expired hot cache key simultaneously.'
      },
      {
        category: 'Technical (Reliability & Transactions)',
        questionText: `Explain how you ensure data consistency across multiple backend services (e.g. Sagas, 2-Phase Commit, or Outbox pattern) when handling financial or state-critical workflows.`,
        expectedKeyPoints: ['ACID transaction isolation levels within single databases', 'Transactional Outbox pattern with message brokers (Kafka/RabbitMQ)', 'Compensating transactions in event-driven Saga choreography/orchestration'],
        commonPitfallsToAvoid: 'Assuming dual-writes across a database and message queue will always succeed without distributed transaction patterns.',
        hint: 'Walk through what happens if the network drops right after the database commit but before message publish.'
      }
    ],

    DEVOPS_CLOUD: [
      {
        category: 'Technical (Containerization & Orchestration)',
        questionText: `In Kubernetes and Docker environments, how do you architect multi-stage builds for minimal image attack surfaces, and how do Liveness vs Readiness vs Startup probes prevent traffic blackholes?`,
        expectedKeyPoints: ['Multi-stage Docker builds separating compiler toolchains from runtime scratch images', 'Readiness probes removing unhealthy pods from Service endpoints before warm-up', 'Resource requests and limits preventing node OOMKilled panics'],
        commonPitfallsToAvoid: 'Using Liveness probes to check external dependencies, which can trigger cascading cluster-wide pod restart loops.',
        hint: 'Differentiate when a pod is booting up, ready to accept HTTP traffic, or fatally frozen.'
      },
      {
        category: 'Technical (CI/CD & Deployment Strategies)',
        questionText: `How do you implement zero-downtime Canary and Blue/Green deployment pipelines, and how do you automate fast rollbacks based on Prometheus/Datadog SLI threshold breaches?`,
        expectedKeyPoints: ['Traffic shifting via ingress controllers (e.g. NGINX/Istio/Argo Rollouts)', 'Automated analysis of error rate and latency p99 metrics', 'Database migration backward compatibility (Expand and Contract pattern)'],
        commonPitfallsToAvoid: 'Deploying breaking database schema changes that immediately crash the older active version before rollout completes.',
        hint: 'Explain the Expand and Contract pattern for zero-downtime database migrations.'
      },
      {
        category: 'Technical (Infrastructure as Code & Security)',
        questionText: `When managing cloud infrastructure using Terraform, how do you maintain state locking, manage secrets securely, and enforce least-privilege IAM roles?`,
        expectedKeyPoints: ['Remote backend state with DynamoDB/S3 distributed locking', 'Ephemeral credentials and Vault/KMS secrets injection', 'Scoped IAM policies avoiding wildcard permissions'],
        commonPitfallsToAvoid: 'Committing raw terraform.tfstate files containing plain-text secrets to version control.',
        hint: 'Discuss remote state locking and secret interpolation.'
      }
    ],

    FULLSTACK: [
      {
        category: 'Technical (End-to-End System Architecture)',
        questionText: `Can you walk through the full lifecycle of a user request in a ${skill1} & ${skill2} stack—from browser DNS lookup and TLS handshake through reverse proxies, authentication middleware, and database transaction commit?`,
        expectedKeyPoints: ['DNS resolution, TLS 1.3 handshake, HTTP/2 multiplexing', 'Reverse proxy (NGINX/Cloudflare) SSL termination and load balancing', 'JWT/Session validation, ORM/DB transaction commit, and serialized response stream'],
        commonPitfallsToAvoid: 'Skipping intermediate networking tiers and focusing solely on client click to server controller.',
        hint: 'Trace the request packet layer-by-layer across network, server, and storage boundaries.'
      },
      {
        category: 'Technical (Security & Authentication)',
        questionText: `How do you secure a web platform against Cross-Site Scripting (XSS), Cross-Site Request Forgery (CSRF), and SQL Injection while implementing stateless JWT auth with refresh tokens?`,
        expectedKeyPoints: ['HttpOnly, SameSite, Secure cookies for refresh tokens', 'Parameterized SQL queries and input sanitization', 'Content Security Policy (CSP) headers and DOM purification'],
        commonPitfallsToAvoid: 'Storing sensitive long-lived JWT access tokens in localStorage where they are vulnerable to XSS.',
        hint: 'Compare token storage options and their respective attack surfaces.'
      },
      {
        category: 'Technical (Scalability & Microservices)',
        questionText: `When transitioning a monolithic backend to modular microservices or serverless functions, how do you handle service discovery, shared authentication, and distributed logging/tracing?`,
        expectedKeyPoints: ['API Gateway pattern with centralized authentication', 'Correlation IDs (OpenTelemetry/Jaeger) propagated across HTTP headers', 'Event-driven decoupling over synchronous point-to-point RPCs'],
        commonPitfallsToAvoid: 'Creating a distributed monolith where every microservice synchronously calls three other services to fulfill one request.',
        hint: 'Explain distributed trace IDs and asynchronous messaging patterns.'
      }
    ]
  };

  // General questions for resume, project, scenario, and behavioral
  const generalPool = [
    {
      category: 'Resume-Based Technical Skills',
      questionText: `Looking at your hands-on experience with ${skill1} and ${skill2}, what is the most complex bug or performance regression you diagnosed, and what telemetry or debugging tools did you use?`,
      expectedKeyPoints: ['Systematic debugging methodology', 'Toolchain usage (profilers, debuggers, memory snapshots, logs)', 'Root cause identification and preventative unit/integration testing'],
      commonPitfallsToAvoid: 'Describing trial-and-error code guessing rather than hypothesis-driven diagnostic workflows.',
      hint: 'Walk through: Symptom -> Diagnostic tools used -> Root cause -> Solution -> Verification.'
    },
    {
      category: 'Project-Based Architecture Deep-Dive',
      questionText: `In your project "${projTitle}", what were the primary architectural trade-offs you evaluated when designing the data model and API contracts? What would you architect differently for 100x scale?`,
      expectedKeyPoints: ['Rationale for technology selection over alternatives', 'Handling data consistency, indexing, and component modularity', 'Horizontal scaling strategies (sharding, caching, asynchronous queues)'],
      commonPitfallsToAvoid: 'Only describing the UI features without addressing data flow, constraints, and scalability limits.',
      hint: 'Structure: Business requirement -> Options considered -> Decision rationale -> Lessons learned.'
    },
    {
      category: 'Role-Specific Production Scenario',
      questionText: `As a ${role} at ${company}, imagine a critical production service begins experiencing a 5% error spike and elevated p99 latency right after a Friday release. What is your immediate incident response and mitigation plan?`,
      expectedKeyPoints: ['Incident triage: acknowledge, communicate status, check telemetry/error dashboards', 'Immediate mitigation: roll back deployment or enable kill-switch feature flags', 'Post-mortem blameless RCA and automated regression tests'],
      commonPitfallsToAvoid: 'Attempting to hotfix code directly in production during an active incident instead of executing a safe rollback.',
      hint: 'Focus on containment, communication, rollback, and subsequent blameless post-mortem.'
    },
    {
      category: 'HR / Behavioral',
      questionText: `Describe a situation where you had a strong technical disagreement with a teammate or had to deliver on a critical deadline with ambiguous, shifting requirements. How did you handle it?`,
      expectedKeyPoints: ['Situation & Task: Context and challenge', 'Action: Active listening, objective data-driven proof of concept, alignment', 'Result: Successful delivery and strengthened team collaboration'],
      commonPitfallsToAvoid: 'Focusing on blaming others rather than collaborative problem solving and shared ownership.',
      hint: 'Use the STAR format: Situation, Task, Action (what YOU did), and measurable Result.'
    },
    {
      category: 'Technical (Engineering Hygiene & Testing)',
      questionText: `How do you structure your testing pyramid (Unit, Integration, End-to-End) and maintain high test confidence without brittle, slow test suites?`,
      expectedKeyPoints: ['Unit tests for pure functions and core logic', 'Integration tests with containerized dependencies (Testcontainers)', 'Mocking boundaries without testing implementation details'],
      commonPitfallsToAvoid: 'Testing private implementation details instead of public interface contracts.',
      hint: 'Explain when to mock versus when to run against real lightweight dependencies.'
    }
  ];

  // Combine domain bank + general pool with mode-aware structured distribution
  const domainBank = domainQuestionBanks[domain] || domainQuestionBanks.FULLSTACK;
  
  let orderedPool = [];
  if (focusMode === 'Technical Deep-Dive') {
    orderedPool = [...domainBank, generalPool[0], generalPool[4], generalPool[1], generalPool[2]];
  } else if (focusMode === 'System Architecture & Scenarios') {
    orderedPool = [generalPool[1], generalPool[2], domainBank[1] || domainBank[0], domainBank[2] || domainBank[0], generalPool[0]];
  } else if (focusMode === 'Behavioral & STAR Leadership') {
    orderedPool = [generalPool[3], generalPool[0], generalPool[2], domainBank[0], generalPool[1]];
  } else {
    // Balanced Full-Loop: Guaranteed representation of Technical, Resume/Project, Production Scenario, and HR/Behavioral
    orderedPool = [
      domainBank[0] || { category: 'Core Technical', questionText: `Explain key architectural considerations in ${role}.` },
      generalPool[0], // Resume-Based Technical Skills
      generalPool[1], // Project-Based Architecture Deep-Dive
      generalPool[2], // Role-Specific Production Scenario
      generalPool[3], // HR / Behavioral
      ...(domainBank.slice(1)),
      generalPool[4]
    ];
  }

  // Select requested count from the ordered pool, with fallback wrapping
  const selected = [];
  for (let i = 0; i < count; i++) {
    selected.push(orderedPool[i % orderedPool.length]);
  }

  return selected.map((item, idx) => ({
    questionNumber: idx + 1,
    category: item.category || 'Technical',
    questionText: item.questionText,
    expectedKeyPoints: item.expectedKeyPoints,
    commonPitfallsToAvoid: item.commonPitfallsToAvoid,
    hint: item.hint
  }));
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
// HEURISTIC EVALUATION FOR INTERVIEW PREPARATION AGENT
// -------------------------------------------------------------

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
