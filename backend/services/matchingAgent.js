import { calculateSkillMatrix, calculateRoleScore, calculateLocationScore } from './matchingEngine.js';
import { generateMatchExplanation } from './geminiService.js';
import { cosineSimilarity, getEmbedding } from './vectorStore.js';
import { retrieveRelevantJobsForProfile } from './ragService.js';
import { db } from '../config/database.js';

export const AGENT_WEIGHTS = {
  skills: 0.40,
  experienceAndProjects: 0.25,
  roleFit: 0.15,
  educationFit: 0.10,
  locationFit: 0.10
};

/**
 * Normalizes skill string for comparison
 */
function normalize(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9+#]/g, '').trim();
}

/**
 * Calculates Project & Experience alignment score (0 - 100)
 */
export function calculateExperienceAndProjectScore(candidateProfile, job) {
  const candidateProjects = Array.isArray(candidateProfile.projects) 
    ? candidateProfile.projects 
    : (typeof candidateProfile.projects_json === 'string' ? JSON.parse(candidateProfile.projects_json || '[]') : []);

  const candidateExperience = Array.isArray(candidateProfile.experience)
    ? candidateProfile.experience
    : (typeof candidateProfile.experience_json === 'string' ? JSON.parse(candidateProfile.experience_json || '[]') : []);

  const allCandidateText = [
    candidateProfile.parsed_summary || '',
    ...candidateProjects.map(p => typeof p === 'string' ? p : `${p.title || ''} ${p.description || ''} ${p.techStack || ''}`),
    ...candidateExperience.map(e => typeof e === 'string' ? e : `${e.role || ''} ${e.company || ''} ${e.description || ''}`)
  ].join(' ').toLowerCase();

  if (!allCandidateText.trim()) {
    // If no projects/experience listed yet, base lightly on skill count
    return 65;
  }

  const jobReqs = (job.required_skills_json ? (typeof job.required_skills_json === 'string' ? JSON.parse(job.required_skills_json) : job.required_skills_json) : []).map(normalize);
  const jobTitleTokens = (job.title || '').toLowerCase().split(/\s+/).filter(t => t.length > 3);

  let projectMatches = 0;
  for (const req of jobReqs) {
    if (allCandidateText.includes(req)) {
      projectMatches++;
    }
  }

  for (const token of jobTitleTokens) {
    if (allCandidateText.includes(token)) {
      projectMatches += 0.5;
    }
  }

  const totalPoints = jobReqs.length || 1;
  const projectCoverageRatio = Math.min(1.0, (projectMatches / totalPoints));
  
  return Math.min(100, Math.round(50 + (projectCoverageRatio * 50)));
}

/**
 * Evaluates academic background and graduation fit (0 - 100)
 */
export function calculateEducationScore(candidateProfile, job) {
  const degree = (candidateProfile.degree || '').toLowerCase();
  let score = 80;

  if (degree.includes('computer') || degree.includes('b.tech') || degree.includes('b.e.') || degree.includes('data') || degree.includes('ai') || degree.includes('it')) {
    score = 95;
  } else if (degree.includes('bca') || degree.includes('mca') || degree.includes('science')) {
    score = 88;
  }

  // Check graduation year fit if specified
  const gradYear = Number(candidateProfile.graduation_year) || 2026;
  if (gradYear >= 2025 && gradYear <= 2027) {
    score = Math.min(100, score + 5);
  }

  return score;
}

/**
 * Executes full Job-Resume Matching Agent evaluation on a candidate profile and an internship posting.
 */
export async function evaluateJobResumeMatch(candidateProfile, job, includeAiExplanation = false) {
  // 1. Parse Required and Preferred Skills
  let requiredSkills = [];
  let preferredSkills = [];
  try {
    requiredSkills = typeof job.required_skills_json === 'string' 
      ? JSON.parse(job.required_skills_json) 
      : (job.required_skills_json || job.required_skills || []);
  } catch {
    requiredSkills = [];
  }

  try {
    preferredSkills = typeof job.preferred_skills_json === 'string'
      ? JSON.parse(job.preferred_skills_json)
      : (job.preferred_skills_json || job.preferred_skills || []);
  } catch {
    preferredSkills = [];
  }

  const candidateSkills = Array.isArray(candidateProfile.skills)
    ? candidateProfile.skills
    : (typeof candidateProfile.technical_skills === 'string' ? JSON.parse(candidateProfile.technical_skills || '[]') : (candidateProfile.technical_skills || []));

  const candidateRoles = Array.isArray(candidateProfile.preferred_roles)
    ? candidateProfile.preferred_roles
    : (typeof candidateProfile.preferred_roles === 'string' ? JSON.parse(candidateProfile.preferred_roles || '[]') : [candidateProfile.preferred_roles || 'Software Engineer Intern']);

  // 2. Multi-Factor Deterministic Sub-Scores
  // A. Skill Matrix & Score
  const skillMatrix = calculateSkillMatrix(candidateSkills, requiredSkills);
  
  // Bonus points for preferred skills
  let prefBonus = 0;
  const normCandidate = candidateSkills.map(normalize);
  for (const pref of preferredSkills) {
    if (normCandidate.includes(normalize(pref))) {
      prefBonus += 3;
    }
  }
  const effectiveSkillScore = Math.min(100, skillMatrix.skillScore + prefBonus);

  // B. Projects & Experience Alignment
  const expAndProjectScore = calculateExperienceAndProjectScore(candidateProfile, job);

  // C. Role & Domain Relevance
  const roleScore = calculateRoleScore(candidateRoles, job.title, job.industry);

  // D. Education Background Fit
  const educationScore = calculateEducationScore(candidateProfile, job);

  // E. Location / Remote Mode Compatibility
  const locationScore = calculateLocationScore(
    candidateProfile.preferred_location || candidateProfile.location,
    job.location,
    job.remote_type
  );

  // 3. Multi-Factor Weighted Overall Score
  const overallMatchScore = Math.min(100, Math.round(
    (effectiveSkillScore * AGENT_WEIGHTS.skills) +
    (expAndProjectScore * AGENT_WEIGHTS.experienceAndProjects) +
    (roleScore * AGENT_WEIGHTS.roleFit) +
    (educationScore * AGENT_WEIGHTS.educationFit) +
    (locationScore * AGENT_WEIGHTS.locationFit)
  ));

  // 4. Generate Qualitative Match Reasoning
  let explanation = null;
  if (includeAiExplanation) {
    explanation = await generateMatchExplanation(
      {
        skills: candidateSkills,
        preferred_roles: candidateRoles,
        degree: candidateProfile.degree,
        university: candidateProfile.university,
        summary: candidateProfile.parsed_summary
      },
      job
    );
  } else {
    // Generate high-quality structured heuristic reasoning
    const matchedNames = skillMatrix.matchingSkills.map(m => m.skill);
    const missingNames = skillMatrix.missingSkills.map(m => m.skill);

    explanation = {
      whyItMatches: matchedNames.length > 0 
        ? `Your validated skills in ${matchedNames.slice(0, 3).join(', ')} directly align with ${job.company}'s core requirements for ${job.title}.`
        : `Your academic background and general software development foundation provide a baseline for this ${job.title} role.`,
      potentialConcerns: missingNames.length > 0
        ? `Noticeable skill gap in ${missingNames.slice(0, 2).join(' and ')}, which are specified in the job posting.`
        : "Highly competitive role; ensure you emphasize hands-on project metrics in your application.",
      recommendedPreparation: missingNames.length > 0
        ? `Build a focused mini-project showcasing ${missingNames[0]} and review core architectural concepts before interviewing.`
        : `Prepare for in-depth system design and behavioral STAR interview scenarios for ${job.company}.`,
      keyHighlights: [
        `Strong match on ${matchedNames.length} essential tech stack components`,
        `${job.remote_type} work mode alignment with candidate profile`,
        `Direct role relevance to ${candidateRoles[0] || 'Software Engineering'}`
      ]
    };
  }

  return {
    internshipId: job.id,
    overallMatchScore,
    breakdown: {
      skillScore: effectiveSkillScore,
      experienceAndProjectsScore: expAndProjectScore,
      roleScore,
      educationScore,
      locationScore,
      weights: AGENT_WEIGHTS
    },
    skillMatrix,
    explanation
  };
}

/**
 * Runs the Job-Resume Matching Agent across the entire knowledge base using RAG retrieval + multi-factor ranking.
 */
export async function runJobResumeMatchingAgent(candidateProfile, limit = 50) {
  // 1. Retrieve candidate-relevant jobs from vector store RAG
  const retrievedChunks = await retrieveRelevantJobsForProfile(candidateProfile, 100);
  const candidateJobIds = new Set(retrievedChunks.map(r => r.internshipId));

  // 2. Fetch all internships from database
  const allJobs = await db.all('SELECT * FROM internships');

  // 3. Evaluate each job
  const ranked = [];
  for (const job of allJobs) {
    const isRagRetrieved = candidateJobIds.has(job.id);
    const matchResult = await evaluateJobResumeMatch(candidateProfile, job, false);

    ranked.push({
      internship: {
        ...job,
        required_skills_json: job.required_skills_json ? (typeof job.required_skills_json === 'string' ? JSON.parse(job.required_skills_json) : job.required_skills_json) : [],
        preferred_skills_json: job.preferred_skills_json ? (typeof job.preferred_skills_json === 'string' ? JSON.parse(job.preferred_skills_json) : job.preferred_skills_json) : [],
        responsibilities_json: job.responsibilities_json ? (typeof job.responsibilities_json === 'string' ? JSON.parse(job.responsibilities_json) : job.responsibilities_json) : []
      },
      matchScore: matchResult.overallMatchScore,
      breakdown: matchResult.breakdown,
      skillMatrix: matchResult.skillMatrix,
      explanation: matchResult.explanation,
      isRagRetrieved
    });
  }

  // 4. Sort descending by matchScore
  ranked.sort((a, b) => b.matchScore - a.matchScore);

  return ranked.slice(0, limit);
}
