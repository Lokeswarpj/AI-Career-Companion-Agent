import { callGemini } from './geminiService.js';
import { db } from '../config/database.js';

/**
 * Normalizes skill strings for robust fuzzy comparison.
 */
function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9+#]/g, '').trim();
}

/**
 * Known skill adjacency taxonomy for detecting partially demonstrated / related skills.
 */
const SKILL_ADJACENCY_MAP = {
  'react': ['javascript', 'typescript', 'html', 'css', 'frontend', 'vue', 'nextjs', 'redux'],
  'react native': ['react', 'javascript', 'typescript', 'mobile', 'flutter'],
  'flutter': ['dart', 'mobile', 'react native', 'android', 'ios'],
  'nodejs': ['javascript', 'typescript', 'express', 'backend', 'rest api', 'nestjs'],
  'node.js': ['javascript', 'typescript', 'express', 'backend', 'rest api', 'nestjs'],
  'fastapi': ['python', 'rest api', 'flask', 'django', 'backend', 'pydantic'],
  'django': ['python', 'backend', 'sql', 'rest api', 'flask'],
  'flask': ['python', 'backend', 'rest api', 'fastapi'],
  'pytorch': ['python', 'machine learning', 'deep learning', 'numpy', 'scikit-learn', 'tensorflow', 'keras'],
  'tensorflow': ['python', 'machine learning', 'deep learning', 'numpy', 'scikit-learn', 'pytorch', 'keras'],
  'docker': ['linux', 'cloud', 'devops', 'kubernetes', 'containers', 'ci/cd', 'bash'],
  'kubernetes': ['docker', 'linux', 'cloud', 'aws', 'devops', 'helm'],
  'aws': ['cloud', 'linux', 'docker', 'devops', 'azure', 'gcp', 'serverless'],
  'postgresql': ['sql', 'database', 'mysql', 'sqlite', 'mongodb', 'prisma', 'backend'],
  'mongodb': ['nosql', 'database', 'sql', 'backend', 'nodejs', 'mongoose'],
  'sql': ['database', 'postgresql', 'mysql', 'sqlite', 'data analysis', 'queries'],
  'typescript': ['javascript', 'react', 'nodejs', 'frontend', 'type safety'],
  'graphql': ['rest api', 'backend', 'nodejs', 'apollo', 'apis'],
  'pandas': ['python', 'data analysis', 'numpy', 'data science', 'analytics'],
  'tableau': ['powerbi', 'data visualization', 'sql', 'business intelligence', 'analytics'],
  'powerbi': ['tableau', 'data visualization', 'sql', 'business intelligence', 'analytics'],
  'figma': ['ui/ux', 'wireframing', 'prototyping', 'design', 'user research', 'css'],
  'cybersecurity': ['network security', 'linux', 'ethical hacking', 'information security', 'soc', 'wireshark'],
  'testing': ['jest', 'pytest', 'cypress', 'playwright', 'selenium', 'unit testing', 'qa'],
  'spring boot': ['java', 'backend', 'microservices', 'hibernate', 'rest api', 'sql']
};

/**
 * Standard learning roadmap resources and project suggestions per technology.
 */
const ROADMAP_LIBRARY = {
  'docker': {
    timeEstimate: '1 - 2 Weeks',
    topics: ['Dockerfiles & Multi-stage Builds', 'Docker Compose Multi-Container Setup', 'Volume Persistence & Networking'],
    projectIdea: 'Containerize a full-stack React + Node.js + PostgreSQL app with Docker Compose and health check scripts.',
    importance: 'Modern engineering teams deploy containerized microservices; Docker ensures consistent development and production environments.'
  },
  'kubernetes': {
    timeEstimate: '2 - 3 Weeks',
    topics: ['Pods, Deployments & Services', 'ConfigMaps & Secrets', 'Ingress Controllers & Helm Charts'],
    projectIdea: 'Deploy a multi-service microservice application on local Minikube with automated self-healing and load balancing.',
    importance: 'Essential for scalable cloud orchestration, automated rollouts, and container lifecycle management.'
  },
  'fastapi': {
    timeEstimate: '1 - 2 Weeks',
    topics: ['Pydantic Data Validation & Async Defs', 'Dependency Injection System', 'Interactive OpenAPI (Swagger) Documentation'],
    projectIdea: 'Build a high-throughput async REST API serving a machine learning inference model with background task queues.',
    importance: 'Standard high-performance Python framework for modern AI, microservices, and asynchronous web backends.'
  },
  'pytorch': {
    timeEstimate: '3 - 4 Weeks',
    topics: ['Tensors, Autograd & Custom Modules', 'DataLoader Pipelines & Transfer Learning', 'Model Evaluation, Checkpoints & Export (ONNX)'],
    projectIdea: 'Fine-tune a pre-trained Vision Transformer or BERT model on a custom dataset and benchmark latency.',
    importance: 'Industry-standard research and production framework for Deep Learning, NLP, and Generative AI systems.'
  },
  'react': {
    timeEstimate: '2 - 3 Weeks',
    topics: ['Custom Hooks & Context API', 'Component Lifecycle & Virtual DOM', 'Performance Optimization (useMemo, useCallback)'],
    projectIdea: 'Create an interactive real-time dashboard with state management, client-side routing, and responsive design.',
    importance: 'Dominant frontend library worldwide, powering responsive, scalable user interfaces.'
  },
  'nodejs': {
    timeEstimate: '2 Weeks',
    topics: ['Event Loop & Non-blocking I/O', 'Express / Fastify Middleware Architecture', 'JWT Authentication & REST API Security'],
    projectIdea: 'Develop a secure backend API with token authentication, rate limiting, and relational database indexing.',
    importance: 'Core engine for modern full-stack web architectures and high-concurrency cloud services.'
  },
  'aws': {
    timeEstimate: '2 - 3 Weeks',
    topics: ['S3, EC2 & IAM Security Policies', 'Serverless Functions (AWS Lambda + API Gateway)', 'CloudWatch Monitoring & Cost Optimization'],
    projectIdea: 'Deploy an automated serverless image processing pipeline using AWS Lambda triggered by S3 uploads.',
    importance: 'Leading enterprise cloud infrastructure platform; cloud proficiency is highly valued by hiring managers.'
  },
  'sql': {
    timeEstimate: '1 - 2 Weeks',
    topics: ['Complex JOINs, Subqueries & CTEs', 'Database Indexing & Query Plan Optimization', 'ACID Transactions & Normalization'],
    projectIdea: 'Design a normalized e-commerce database schema with optimized indexing for multi-table analytics queries.',
    importance: 'Universal foundational requirement for storing, querying, and analyzing structured business data.'
  },
  'pandas': {
    timeEstimate: '1 - 2 Weeks',
    topics: ['Data Wrangling & Missing Value Imputation', 'Grouping, Aggregations & Pivot Tables', 'Time Series Analysis & Feature Engineering'],
    projectIdea: 'Perform exploratory data analysis on a real-world dataset, uncovering business insights and statistical trends.',
    importance: 'Core data manipulation tool in Python, essential for data science, data engineering, and analytics roles.'
  },
  'typescript': {
    timeEstimate: '1 - 2 Weeks',
    topics: ['Generics & Utility Types', 'Strict Null Checks & Union Types', 'Interface vs Type Aliases in Large Codebases'],
    projectIdea: 'Refactor an existing JavaScript React or Node project into strict TypeScript with custom type definitions.',
    importance: 'Drastically reduces production bugs and provides enterprise-grade developer tooling and maintainability.'
  },
  'default': {
    timeEstimate: '1 - 2 Weeks',
    topics: ['Core Architecture & Syntax Fundamentals', 'Practical Hands-on Projects', 'Best Practices & Security Considerations'],
    projectIdea: 'Build an end-to-end mini application implementing this technology with clean git commits and documentation.',
    importance: 'Key skill directly specified in the job description to handle core day-to-day engineering responsibilities.'
  }
};

/**
 * M3.1: Skill Gap Analysis Agent — Multi-Dimensional Comparison & Classification.
 */
export async function runSkillGapAnalysisAgent(studentProfile, internship) {
  // 1. Gather all student competencies
  const techSkills = Array.isArray(studentProfile.skills) 
    ? studentProfile.skills 
    : (Array.isArray(studentProfile.technical_skills) ? studentProfile.technical_skills : []);
  
  const softSkills = Array.isArray(studentProfile.soft_skills)
    ? studentProfile.soft_skills
    : (typeof studentProfile.soft_skills === 'string' ? JSON.parse(studentProfile.soft_skills || '[]') : []);

  const projects = Array.isArray(studentProfile.projects)
    ? studentProfile.projects
    : (typeof studentProfile.projects_json === 'string' ? JSON.parse(studentProfile.projects_json || '[]') : []);

  const experience = Array.isArray(studentProfile.experience)
    ? studentProfile.experience
    : (typeof studentProfile.experience_json === 'string' ? JSON.parse(studentProfile.experience_json || '[]') : []);

  const certifications = Array.isArray(studentProfile.certifications)
    ? studentProfile.certifications
    : (typeof studentProfile.certifications_json === 'string' ? JSON.parse(studentProfile.certifications_json || '[]') : []);

  const degree = studentProfile.degree || '';
  const university = studentProfile.university || '';
  const gradYear = Number(studentProfile.graduation_year) || 2026;

  // 2. Gather all job requirements
  let requiredSkills = [];
  try {
    requiredSkills = typeof internship.required_skills_json === 'string'
      ? JSON.parse(internship.required_skills_json)
      : (internship.required_skills_json || []);
  } catch {
    requiredSkills = [];
  }

  let preferredSkills = [];
  try {
    preferredSkills = typeof internship.preferred_skills_json === 'string'
      ? JSON.parse(internship.preferred_skills_json)
      : (internship.preferred_skills_json || []);
  } catch {
    preferredSkills = [];
  }

  let responsibilities = [];
  try {
    responsibilities = typeof internship.responsibilities_json === 'string'
      ? JSON.parse(internship.responsibilities_json)
      : (internship.responsibilities_json || []);
  } catch {
    responsibilities = [];
  }

  const expRequirements = internship.experience_requirements || '';
  const eduRequirements = internship.education_requirements || '';
  const preferredQualifications = internship.preferred_qualifications || '';

  // 3. Perform Deterministic Skill Classification & Gap Identification
  const normTechSkills = techSkills.map(s => ({ raw: s, norm: normalize(s) }));
  const normAllCandidateText = [
    ...techSkills,
    ...softSkills,
    ...projects.map(p => typeof p === 'string' ? p : `${p.title || ''} ${p.description || ''} ${p.techStack || ''}`),
    ...experience.map(e => typeof e === 'string' ? e : `${e.role || ''} ${e.company || ''} ${e.description || ''}`),
    ...certifications.map(c => typeof c === 'string' ? c : `${c.name || ''} ${c.issuer || ''}`)
  ].join(' ').toLowerCase();

  const matchingSkills = [];
  const partiallyDemonstratedSkills = [];
  const criticalMissingSkills = [];
  const preferredSkillsGaps = [];

  // Evaluate Required Skills
  for (const req of requiredSkills) {
    const normReq = normalize(req);
    const directMatch = normTechSkills.find(s => s.norm === normReq || normReq.includes(s.norm) || s.norm.includes(normReq));

    if (directMatch) {
      // Check if candidate has rich project demonstration or just listed
      const hasProjectEvidence = normAllCandidateText.includes(normReq);
      matchingSkills.push({
        skill: req,
        status: 'Strong Match',
        confidence: hasProjectEvidence ? 95 : 80,
        matchedWith: directMatch.raw,
        evidence: hasProjectEvidence ? 'Demonstrated in profile and project portfolio' : 'Listed in profile skills',
        importance: getSkillImportance(req, internship.title)
      });
    } else {
      // Check for adjacent / partially demonstrated skills
      const relatedKeywords = SKILL_ADJACENCY_MAP[normReq] || [];
      const matchedAdjacent = normTechSkills.find(s => relatedKeywords.includes(s.norm));

      if (matchedAdjacent) {
        partiallyDemonstratedSkills.push({
          skill: req,
          status: 'Partially Demonstrated',
          relatedSkillFound: matchedAdjacent.raw,
          gapReason: `Candidate has foundational knowledge in ${matchedAdjacent.raw}, which is adjacent to ${req}, but lacks direct hands-on proof for ${req}.`,
          priority: 'Medium',
          roadmap: getRoadmapForSkill(req),
          importance: getSkillImportance(req, internship.title)
        });
      } else {
        // Critical missing skill
        criticalMissingSkills.push({
          skill: req,
          status: 'Critical Missing',
          gapReason: `Mandatory requirement for ${internship.title} with no demonstrated evidence in candidate profile.`,
          priority: 'High',
          roadmap: getRoadmapForSkill(req),
          importance: getSkillImportance(req, internship.title)
        });
      }
    }
  }

  // Evaluate Preferred Skills
  for (const pref of preferredSkills) {
    const normPref = normalize(pref);
    const hasPref = normTechSkills.find(s => s.norm === normPref || normPref.includes(s.norm) || s.norm.includes(normPref));
    if (!hasPref) {
      preferredSkillsGaps.push({
        skill: pref,
        status: 'Preferred Skill Gap',
        advantage: `Adding ${pref} gives a strong competitive edge over other applicants for ${internship.title}.`,
        priority: 'Low',
        roadmap: getRoadmapForSkill(pref),
        importance: getSkillImportance(pref, internship.title)
      });
    } else {
      matchingSkills.push({
        skill: pref,
        status: 'Preferred Bonus Match',
        confidence: 90,
        matchedWith: hasPref.raw,
        evidence: 'Preferred qualification satisfied',
        importance: getSkillImportance(pref, internship.title)
      });
    }
  }

  // 4. Experience Gap Evaluation
  const experienceGaps = [];
  const projectCount = projects.length;
  const experienceCount = experience.length;

  if (projectCount === 0 && experienceCount === 0) {
    experienceGaps.push({
      area: 'Practical Project Portfolio',
      gap: 'No portfolio projects or prior internships listed.',
      impact: 'High',
      recommendation: `Build at least 2 full-stack / end-to-end projects demonstrating ${requiredSkills.slice(0, 3).join(', ')} with public GitHub repositories and live demo links.`
    });
  } else if (projectCount < 2) {
    experienceGaps.push({
      area: 'Project Depth',
      gap: 'Only 1 project listed in profile.',
      impact: 'Medium',
      recommendation: `Add a second substantial project showcasing ${criticalMissingSkills[0]?.skill || 'production deployment / cloud integration'} to demonstrate breadth.`
    });
  }

  // Check domain-specific experience alignment
  const roleKeywords = (internship.title || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const domainProjectMatch = projects.some(p => {
    const pText = (typeof p === 'string' ? p : `${p.title || ''} ${p.description || ''}`).toLowerCase();
    return roleKeywords.some(k => pText.includes(k));
  });

  if (!domainProjectMatch && roleKeywords.length > 0) {
    experienceGaps.push({
      area: 'Domain-Specific Project Alignment',
      gap: `Past projects do not specifically highlight ${internship.title} domain workflows.`,
      impact: 'Medium',
      recommendation: `Create a targeted capstone project specifically tailored to ${internship.title} problem domains.`
    });
  }

  // 5. Qualification Gap Evaluation
  const qualificationGaps = [];
  const degreeLower = degree.toLowerCase();

  if (eduRequirements) {
    const reqLower = eduRequirements.toLowerCase();
    if (reqLower.includes('computer science') && !degreeLower.includes('computer') && !degreeLower.includes('b.tech') && !degreeLower.includes('it')) {
      qualificationGaps.push({
        requirement: eduRequirements,
        candidateStatus: degree || 'Non-CS Degree',
        severity: 'Medium',
        mitigation: 'Compensate for academic degree variance by highlighting verified certifications, algorithmic skills, and open-source contributions.'
      });
    }
  }

  // 6. Gemini AI Deep Analysis (with seamless heuristic fallback)
  let aiInsights = null;
  const prompt = `Conduct a comprehensive, professional Skill Gap Analysis for a student applying to an internship.
Candidate:
- Degree: ${degree} (${university}, Graduating: ${gradYear})
- Skills: ${JSON.stringify(techSkills)}
- Projects Count: ${projects.length}
- Work Experience Count: ${experience.length}

Target Internship:
- Title: ${internship.title} at ${internship.company}
- Required Skills: ${JSON.stringify(requiredSkills)}
- Preferred Skills: ${JSON.stringify(preferredSkills)}
- Responsibilities: ${JSON.stringify(responsibilities)}
- Experience Reqs: ${expRequirements || 'Fresher / Student'}
- Education Reqs: ${eduRequirements || 'Pursuing Bachelor’s degree in CS or related'}

Identified Gaps:
- Critical Missing: ${JSON.stringify(criticalMissingSkills.map(s => s.skill))}
- Partially Demonstrated: ${JSON.stringify(partiallyDemonstratedSkills.map(s => s.skill))}
- Preferred Gaps: ${JSON.stringify(preferredSkillsGaps.map(s => s.skill))}

Provide structured JSON:
{
  "summaryAssessment": "3-4 sentences synthesizing candidate readiness, top advantages, and biggest hurdle",
  "skillReadinessScore": 75,
  "top3ActionPriorities": [
    "Priority 1 actionable item",
    "Priority 2 actionable item",
    "Priority 3 actionable item"
  ],
  "interviewFocusAreas": [
    "Technical concept recruiters will test based on gaps",
    "Architecture question candidate should prepare for"
  ]
}`;

  const systemPrompt = "You are a Principal Engineering Career Mentor and Staff Technical Recruiter. Provide clear, direct, and constructive skill gap diagnoses.";

  aiInsights = await callGemini(prompt, systemPrompt, true);

  if (!aiInsights || !aiInsights.summaryAssessment) {
    // Deterministic fallback insights
    const readinessScore = Math.max(20, Math.min(98, Math.round(
      (matchingSkills.length / Math.max(1, requiredSkills.length)) * 70 +
      (partiallyDemonstratedSkills.length > 0 ? 15 : 0) +
      (projects.length > 0 ? 15 : 5)
    )));

    aiInsights = {
      summaryAssessment: matchingSkills.length >= Math.ceil(requiredSkills.length * 0.6)
        ? `You possess a strong foundational match for ${internship.title} at ${internship.company}, with demonstrated competence in ${matchingSkills.slice(0, 2).map(m => m.skill).join(' and ')}. Focus on closing the remaining ${criticalMissingSkills.length} critical requirement(s) to maximize your interview conversion.`
        : `You have transferable technical fundamentals, but the ${internship.title} role at ${internship.company} requires bridging key gaps in ${criticalMissingSkills.slice(0, 2).map(c => c.skill).join(' and ') || 'specialized toolsets'} before submitting.`,
      skillReadinessScore: readinessScore,
      top3ActionPriorities: [
        criticalMissingSkills[0] ? `Build a dedicated mini-project mastering ${criticalMissingSkills[0].skill}` : 'Refine project descriptions with quantifiable metrics',
        partiallyDemonstratedSkills[0] ? `Deepen knowledge in ${partiallyDemonstratedSkills[0].skill} beyond theoretical basics` : 'Practice mock technical interviews with timed questions',
        'Review core system architecture patterns and prepare STAR behavioral responses'
      ],
      interviewFocusAreas: [
        `Hands-on coding questions verifying syntax and performance in ${(matchingSkills[0] || criticalMissingSkills[0] || { skill: 'core languages' }).skill}`,
        `Architectural trade-offs and edge-case handling for ${internship.title} projects`
      ]
    };
  }

  // Calculate Overall Gap Summary Counts
  const totalCompetencies = requiredSkills.length + preferredSkills.length;
  const matchPercentage = totalCompetencies > 0 
    ? Math.round((matchingSkills.length / totalCompetencies) * 100)
    : 70;

  return {
    internshipId: internship.id,
    internship: {
      id: internship.id,
      title: internship.title,
      company: internship.company,
      location: internship.location,
      remote_type: internship.remote_type,
      stipend: internship.stipend,
      source: internship.source,
      requiredSkills,
      preferredSkills,
      responsibilities,
      experienceRequirements: expRequirements,
      educationRequirements: eduRequirements
    },
    metrics: {
      matchPercentage,
      readinessScore: aiInsights.skillReadinessScore || matchPercentage,
      totalRequired: requiredSkills.length,
      matchingCount: matchingSkills.length,
      criticalMissingCount: criticalMissingSkills.length,
      partiallyDemonstratedCount: partiallyDemonstratedSkills.length,
      preferredGapsCount: preferredSkillsGaps.length,
      experienceGapsCount: experienceGaps.length,
      qualificationGapsCount: qualificationGaps.length
    },
    gapClassifications: {
      criticalMissing: criticalMissingSkills,
      partiallyDemonstrated: partiallyDemonstratedSkills,
      matching: matchingSkills,
      preferredGaps: preferredSkillsGaps,
      experienceGaps,
      qualificationGaps
    },
    aiInsights,
    actionableRoadmap: [
      ...criticalMissingSkills.map(s => ({
        skill: s.skill,
        category: 'Critical Missing',
        priority: 'High',
        timeEstimate: s.roadmap.timeEstimate,
        topics: s.roadmap.topics,
        projectIdea: s.roadmap.projectIdea,
        importance: s.importance
      })),
      ...partiallyDemonstratedSkills.map(s => ({
        skill: s.skill,
        category: 'Partially Demonstrated',
        priority: 'Medium',
        timeEstimate: s.roadmap.timeEstimate,
        topics: s.roadmap.topics,
        projectIdea: s.roadmap.projectIdea,
        importance: s.importance
      })),
      ...preferredSkillsGaps.slice(0, 2).map(s => ({
        skill: s.skill,
        category: 'Preferred Skill Gap',
        priority: 'Low',
        timeEstimate: s.roadmap.timeEstimate,
        topics: s.roadmap.topics,
        projectIdea: s.roadmap.projectIdea,
        importance: s.importance
      }))
    ]
  };
}

function getRoadmapForSkill(skillName) {
  const norm = normalize(skillName);
  for (const [key, value] of Object.entries(ROADMAP_LIBRARY)) {
    if (norm.includes(key) || key.includes(norm)) {
      return value;
    }
  }
  return {
    timeEstimate: '1 - 2 Weeks',
    topics: [`${skillName} Core Syntax & APIs`, 'Industry Design Patterns', 'Testing & Error Handling'],
    projectIdea: `Implement a feature module using ${skillName} within a practical full-stack or standalone application.`,
    importance: `Directly specified in the job posting to ensure smooth day-to-day execution on team projects.`
  };
}

function getSkillImportance(skillName, roleTitle) {
  const norm = normalize(skillName);
  if (ROADMAP_LIBRARY[norm]) {
    return ROADMAP_LIBRARY[norm].importance;
  }
  return `Proficiency in ${skillName} enables the team to maintain high code velocity, reliability, and code quality in the ${roleTitle || 'software engineering'} domain.`;
}
