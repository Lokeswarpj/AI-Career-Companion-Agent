import { callGemini } from './geminiService.js';
import { db } from '../config/database.js';
import { COMPREHENSIVE_SKILL_ROADMAPS } from './skillRoadmapLibrary.js';

/**
 * Normalizes skill strings for robust fuzzy comparison.
 */
function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9+#]/g, '').trim();
}

/**
 * Pre-build normalized lookup map for O(1) roadmaps retrieval.
 */
const NORMALIZED_ROADMAPS = {};
for (const [key, value] of Object.entries(COMPREHENSIVE_SKILL_ROADMAPS)) {
  NORMALIZED_ROADMAPS[normalize(key)] = value;
}

/**
 * Known skill adjacency taxonomy for detecting partially demonstrated / related skills.
 */
const SKILL_ADJACENCY_MAP = {
  'react': ['javascript', 'typescript', 'html', 'css', 'frontend', 'vue', 'nextjs', 'redux', 'tailwindcss'],
  'react native': ['react', 'javascript', 'typescript', 'mobile', 'flutter', 'android', 'ios'],
  'flutter': ['dart', 'mobile', 'react native', 'android', 'ios'],
  'nodejs': ['javascript', 'typescript', 'express', 'backend', 'rest api', 'nestjs'],
  'node.js': ['javascript', 'typescript', 'express', 'backend', 'rest api', 'nestjs'],
  'fastapi': ['python', 'rest api', 'flask', 'django', 'backend', 'pydantic'],
  'django': ['python', 'backend', 'sql', 'rest api', 'flask', 'postgresql'],
  'flask': ['python', 'backend', 'rest api', 'fastapi', 'django'],
  'pytorch': ['python', 'machine learning', 'deep learning', 'numpy', 'scikit-learn', 'tensorflow', 'keras'],
  'tensorflow': ['python', 'machine learning', 'deep learning', 'numpy', 'scikit-learn', 'pytorch', 'keras'],
  'docker': ['linux', 'cloud', 'devops', 'kubernetes', 'containers', 'ci/cd', 'bash'],
  'kubernetes': ['docker', 'linux', 'cloud', 'aws', 'devops', 'helm'],
  'aws': ['cloud', 'linux', 'docker', 'devops', 'azure', 'gcp', 'serverless'],
  'azure': ['cloud', 'aws', 'docker', 'devops', 'gcp', 'linux'],
  'postgresql': ['sql', 'database', 'mysql', 'sqlite', 'mongodb', 'prisma', 'backend'],
  'mongodb': ['nosql', 'database', 'sql', 'backend', 'nodejs', 'mongoose'],
  'sql': ['database', 'postgresql', 'mysql', 'sqlite', 'data analysis', 'queries'],
  'typescript': ['javascript', 'react', 'nodejs', 'frontend', 'type safety'],
  'graphql': ['rest api', 'backend', 'nodejs', 'apollo', 'apis'],
  'pandas': ['python', 'data analysis', 'numpy', 'data science', 'analytics'],
  'tableau': ['powerbi', 'data visualization', 'sql', 'business intelligence', 'analytics', 'excel'],
  'powerbi': ['tableau', 'data visualization', 'sql', 'business intelligence', 'analytics', 'excel'],
  'figma': ['ui/ux', 'wireframing', 'prototyping', 'design', 'user research', 'css', 'design systems'],
  'wireframing': ['figma', 'ui/ux design', 'prototyping', 'user research', 'design systems'],
  'prototyping': ['figma', 'wireframing', 'ui/ux design', 'design systems'],
  'ui/ux design': ['figma', 'wireframing', 'prototyping', 'user research', 'usability testing'],
  'cybersecurity': ['network security', 'linux', 'ethical hacking', 'information security', 'soc', 'wireshark', 'owasp'],
  'ethical hacking': ['cybersecurity', 'penetration testing', 'nmap', 'burp suite', 'metasploit', 'linux'],
  'testing': ['jest', 'pytest', 'cypress', 'playwright', 'selenium', 'unit testing', 'qa', 'automation testing'],
  'automation testing': ['testing', 'selenium', 'cypress', 'playwright', 'jest', 'pytest'],
  'spring boot': ['java', 'backend', 'microservices', 'hibernate', 'rest api', 'sql'],
  'agile': ['scrum', 'jira', 'sprint planning', 'confluence', 'project management'],
  'scrum': ['agile', 'jira', 'sprint planning', 'confluence'],
  'jira': ['agile', 'scrum', 'confluence', 'project management']
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

  // 1. Direct O(1) exact normalized match
  if (NORMALIZED_ROADMAPS[norm]) {
    return NORMALIZED_ROADMAPS[norm];
  }

  // 2. Fuzzy substring or key match
  for (const [key, value] of Object.entries(COMPREHENSIVE_SKILL_ROADMAPS)) {
    const normKey = normalize(key);
    if (norm === normKey || norm.includes(normKey) || normKey.includes(norm)) {
      return value;
    }
  }

  // 3. Intelligent Domain Category Heuristics for novel or unlisted skills
  let estimatedTime = '2 - 3 Weeks';
  const lower = (skillName || '').toLowerCase();

  if (/(agile|scrum|jira|confluence|miro|git|sprint|standup|notion|markdown|trello|slack|teams|communication|leadership)/i.test(lower)) {
    estimatedTime = '3 - 5 Days';
  } else if (/(deep learning|pytorch|tensorflow|vision|nlp|transformer|yolo|cuda|rag|huggingface|llm|generative ai)/i.test(lower)) {
    estimatedTime = '4 - 6 Weeks';
  } else if (/(cloud|aws|azure|gcp|kubernetes|docker|terraform|ansible|devops|microservice|kafka|spark|system design)/i.test(lower)) {
    estimatedTime = '3 - 4 Weeks';
  } else if (/(cybersecurity|ethical hacking|penetration|soc|siem|metasploit|wireshark|cryptography|blockchain|solidity)/i.test(lower)) {
    estimatedTime = '3 - 4 Weeks';
  } else if (/(test|jest|pytest|cypress|selenium|playwright|qa|html|css|tailwind|figma|wireframe|prototype|redux|sql|excel)/i.test(lower)) {
    estimatedTime = '1 - 2 Weeks';
  }

  return {
    timeEstimate: estimatedTime,
    topics: [`${skillName} Core Concepts & Architectural Patterns`, 'Production Implementation & Best Practices', 'Error Handling, Testing & Optimization'],
    projectIdea: `Implement a feature module using ${skillName} within a practical full-stack or standalone application.`,
    importance: `Directly required to ensure high code velocity, reliability, and standards compliance on engineering teams.`
  };
}

function getSkillImportance(skillName, roleTitle) {
  const norm = normalize(skillName);
  if (NORMALIZED_ROADMAPS[norm]?.importance) {
    return NORMALIZED_ROADMAPS[norm].importance;
  }
  for (const [key, value] of Object.entries(COMPREHENSIVE_SKILL_ROADMAPS)) {
    const normKey = normalize(key);
    if (norm === normKey || norm.includes(normKey) || normKey.includes(norm)) {
      if (value.importance) return value.importance;
    }
  }
  return `Proficiency in ${skillName} enables the team to maintain high velocity, technical accuracy, and robust system performance in the ${roleTitle || 'software engineering'} domain.`;
}

