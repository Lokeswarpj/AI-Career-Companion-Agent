import { generateMatchExplanation } from './geminiService.js';

/**
 * Weights for the deterministic hybrid compatibility calculation
 */
export const MATCH_WEIGHTS = {
  skills: 0.45,
  role: 0.25,
  location: 0.15,
  education: 0.15
};

/**
 * Normalizes skill strings for accurate comparison
 */
function normalizeSkill(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9+#]/g, '').trim();
}

/**
 * Computes deterministic skill overlap and categorizes skills into Strong, Moderate, and Missing
 */
export function calculateSkillMatrix(userSkills = [], requiredSkills = []) {
  const normUserSkills = userSkills.map(s => ({ raw: s, norm: normalizeSkill(s) }));
  
  const matchingSkills = [];
  const missingSkills = [];
  const moderateSkills = [];

  for (const req of requiredSkills) {
    const normReq = normalizeSkill(req);
    const exactMatch = normUserSkills.find(u => u.norm === normReq);
    const partialMatch = !exactMatch && normUserSkills.find(u => u.norm.includes(normReq) || normReq.includes(u.norm));

    if (exactMatch) {
      matchingSkills.push({
        skill: req,
        status: 'Strong',
        level: 'Proficient',
        priority: 'Low',
        badgeColor: 'emerald'
      });
    } else if (partialMatch) {
      moderateSkills.push({
        skill: req,
        matchedWith: partialMatch.raw,
        status: 'Moderate',
        level: 'Familiar',
        priority: 'Medium',
        badgeColor: 'amber'
      });
    } else {
      // Determine priority: Core CS / high demand languages are high priority
      const isHighPriority = ['python', 'react', 'javascript', 'sql', 'docker', 'java', 'pytorch', 'machine learning'].some(core => normReq.includes(normalizeSkill(core)));
      missingSkills.push({
        skill: req,
        status: 'Missing',
        level: 'Not Detected',
        priority: isHighPriority ? 'High' : 'Medium',
        badgeColor: 'rose',
        learningTrack: `Recommended: Practice 2-3 focused mini-projects with ${req} or complete quick official documentation walkthroughs.`
      });
    }
  }

  const totalReq = requiredSkills.length || 1;
  const matchPoints = (matchingSkills.length * 1.0) + (moderateSkills.length * 0.5);
  const skillScore = Math.min(100, Math.round((matchPoints / totalReq) * 100));

  return {
    skillScore,
    matchingSkills,
    moderateSkills,
    missingSkills,
    haveCount: matchingSkills.length + moderateSkills.length,
    totalRequired: requiredSkills.length
  };
}

/**
 * Calculates role relevance score between student target roles and internship title/industry
 */
export function calculateRoleScore(userRoles = [], jobTitle = '', industry = '') {
  if (!userRoles || userRoles.length === 0) return 75; // Neutral default if not specified

  const normTitle = jobTitle.toLowerCase();
  const normIndustry = (industry || '').toLowerCase();

  let highestScore = 40;

  for (const role of userRoles) {
    const normRole = role.toLowerCase();
    
    // Direct or major keyword overlap
    if (normTitle.includes(normRole) || normRole.includes(normTitle)) {
      highestScore = 100;
      break;
    }

    // Keyword tokens overlap
    const roleTokens = normRole.split(/\s+/).filter(t => t.length > 2);
    const matchCount = roleTokens.filter(t => normTitle.includes(t) || normIndustry.includes(t)).length;

    if (matchCount >= 2) highestScore = Math.max(highestScore, 90);
    else if (matchCount === 1) highestScore = Math.max(highestScore, 75);
    else if (normIndustry.includes(normRole)) highestScore = Math.max(highestScore, 70);
  }

  return highestScore;
}

/**
 * Calculates location & work mode compatibility score
 */
export function calculateLocationScore(userPrefLocation = '', jobLocation = '', remoteType = '') {
  if (remoteType === 'Remote') return 100;
  if (!userPrefLocation) return 80;

  const pref = userPrefLocation.toLowerCase();
  const jobLoc = jobLocation.toLowerCase();

  if (jobLoc.includes(pref) || pref.includes(jobLoc)) return 100;
  if (remoteType === 'Hybrid') return 85;

  return 60;
}

/**
 * Calculates overall deterministic match score and returns comprehensive breakdown
 */
export async function evaluateInternshipMatch(candidateProfile, internship, includeAiExplanation = false) {
  // Parse required skills
  let requiredSkills = [];
  try {
    requiredSkills = typeof internship.required_skills_json === 'string' 
      ? JSON.parse(internship.required_skills_json) 
      : (internship.required_skills_json || []);
  } catch {
    requiredSkills = [];
  }

  // Extract student skills from profile and/or latest resume
  const candidateSkills = Array.isArray(candidateProfile.skills) 
    ? candidateProfile.skills 
    : (candidateProfile.technical_skills ? (typeof candidateProfile.technical_skills === 'string' ? JSON.parse(candidateProfile.technical_skills) : candidateProfile.technical_skills) : []);

  const candidateRoles = Array.isArray(candidateProfile.preferred_roles) 
    ? candidateProfile.preferred_roles 
    : (candidateProfile.preferred_roles ? (typeof candidateProfile.preferred_roles === 'string' ? JSON.parse(candidateProfile.preferred_roles) : [candidateProfile.preferred_roles]) : []);

  // 1. Skill Score & Skill Matrix
  const skillMatrix = calculateSkillMatrix(candidateSkills, requiredSkills);

  // 2. Role Score
  const roleScore = calculateRoleScore(candidateRoles, internship.title, internship.industry);

  // 3. Location Score
  const locationScore = calculateLocationScore(
    candidateProfile.preferred_location || candidateProfile.location,
    internship.location,
    internship.remote_type
  );

  // 4. Education / Background Fit
  const educationScore = candidateProfile.degree ? 90 : 80;

  // Weighted overall compatibility score
  const overallMatchScore = Math.round(
    (skillMatrix.skillScore * MATCH_WEIGHTS.skills) +
    (roleScore * MATCH_WEIGHTS.role) +
    (locationScore * MATCH_WEIGHTS.location) +
    (educationScore * MATCH_WEIGHTS.education)
  );

  // AI Qualitative Rationale (if requested)
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
      internship
    );
  }

  return {
    internshipId: internship.id,
    overallMatchScore,
    breakdown: {
      skillScore: skillMatrix.skillScore,
      roleScore,
      locationScore,
      educationScore,
      weights: MATCH_WEIGHTS
    },
    skillMatrix,
    explanation
  };
}
