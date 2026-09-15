import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { evaluateJobResumeMatch, runJobResumeMatchingAgent } from './matchingAgent.js';
import { db } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '..', 'data', 'kaggle_candidates.csv');
const JSON_PATH = path.join(__dirname, '..', 'data', 'kaggle_candidates.json');

// First & Last names for realistic candidate profile persona generation
const FIRST_NAMES = [
  "Aarav", "Aanya", "Rohan", "Priya", "Aditya", "Sneha", "Arjun", "Ananya", "Vikram", "Neha",
  "Rahul", "Pooja", "Kabir", "Diya", "Siddharth", "Ishaan", "Rhea", "Karan", "Meera", "Varun",
  "Tara", "Dev", "Tanvi", "Samar", "Kavya", "Naveen", "Shreya", "Rishi", "Gauri", "Abhishek",
  "Maya", "Kunal", "Simran", "Harsh", "Divya", "Sanjay", "Anushka", "Nikhil", "Bhavna", "Manish"
];

const LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Mehta", "Nair", "Iyer", "Reddy", "Gupta", "Malhotra", "Kapoor",
  "Chopra", "Deshmukh", "Banerjee", "Chatterjee", "Bhat", "Kulkarni", "Joshi", "Singhania", "Rao", "Menon"
];

let cachedCandidates = null;

function getPreferredRolesForJobRole(jobRole) {
  const r = (jobRole || '').toLowerCase();
  if (r.includes('data scientist')) return ["Data Science & Business Analytics Intern", "AI & Machine Learning Engineering Intern", "Data Scientist"];
  if (r.includes('data analyst')) return ["Data Science & Business Analytics Intern", "Data Engineering & Pipeline Intern", "Data Analyst"];
  if (r.includes('frontend')) return ["Frontend UI/UX Engineer Intern", "Full-Stack Web Developer Intern", "Frontend Developer"];
  if (r.includes('full stack python')) return ["Python Web & API Developer Intern", "Full-Stack Web Developer Intern", "Full Stack Developer"];
  if (r.includes('full stack java')) return ["Java Full-Stack / Spring Boot Intern", "Full-Stack Web Developer Intern", "Java Developer"];
  if (r.includes('backend')) return ["Backend Platform Engineer Intern", "Python Web & API Developer Intern", "Java Full-Stack / Spring Boot Intern"];
  if (r.includes('web developer')) return ["Full-Stack Web Developer Intern", "Frontend UI/UX Engineer Intern", "Web Developer"];
  if (r.includes('devops')) return ["Cloud Infrastructure & DevOps Intern", "Site Reliability & Cloud Operations Intern", "DevOps Engineer"];
  if (r.includes('kubernetes')) return ["Site Reliability & Cloud Operations Intern", "Cloud Infrastructure & DevOps Intern", "Kubernetes Engineer"];
  if (r.includes('aiml') || r.includes('artificial intelligence') || r.includes('machine learning')) return ["AI & Machine Learning Engineering Intern", "Generative AI & LLM Systems Intern", "Natural Language Processing (NLP) Intern"];
  if (r.includes('cybersecurity') || r.includes('security')) return ["Cybersecurity Analyst & Threat Hunting Intern", "Application Security (AppSec) Intern", "Security Engineer"];
  if (r.includes('blockchain')) return ["Blockchain & Smart Contract Developer Intern", "Web3 Developer"];
  if (r.includes('mobile')) return ["Mobile App Developer (Flutter / React Native) Intern", "Android Native Developer Intern", "Mobile Developer"];
  if (r.includes('game') || r.includes('video game')) return ["Game Developer & Interactive 3D Intern", "Game Developer"];
  if (r.includes('c#')) return ["C# / .NET Core & Azure Cloud Developer Intern", ".NET Developer"];
  if (r.includes('php')) return ["PHP & Laravel Web Developer Intern", "PHP Developer"];
  if (r.includes('design') || r.includes('ui/ux')) return ["Product Design & UI/UX Intern", "Frontend UI/UX Engineer Intern", "UI/UX Designer"];
  if (r.includes('project manager') || r.includes('scrum') || r.includes('agile')) return ["Software Project Management & Agile Delivery Intern", "Technical Project Manager"];
  if (r.includes('marketing')) return ["Digital Marketing & Growth Strategy Intern", "Marketing Specialist"];
  if (r.includes('hr') || r.includes('human resources')) return ["HR & Technical Talent Acquisition Intern", "HR Specialist"];
  if (r.includes('finance')) return ["Financial Modeling & FinTech Risk Analyst Intern", "Financial Analyst"];
  return [jobRole, `${jobRole} Intern`];
}

/**
 * Parses raw CSV into structured objects with robust handling for quoted fields and commas
 */
export function parseKaggleCsv(csvContent) {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const candidates = [];

  // Parse lines starting from line index 1 (skipping header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Regex to accurately match CSV columns including quoted strings containing commas
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const matches = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      let val = match[1];
      if (val === undefined) break;
      // Strip surrounding quotes and unescape doubled quotes
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"');
      }
      matches.push(val.trim());
      if (regex.lastIndex === line.length) break;
    }

    // Filter out trailing empty regex captures
    const cols = matches.filter((_, idx) => idx < 5);
    if (cols.length >= 5) {
      const candidateId = parseInt(cols[0], 10);
      const skillsRaw = cols[1] || '';
      const qualification = cols[2] || '';
      // Clean trailing commas or quotes from experience level e.g. "Entry,"
      const experienceLevel = (cols[3] || '').replace(/[^a-zA-Z]/g, '').trim() || 'Mid';
      const jobRole = cols[4] || '';

      const skills = skillsRaw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      // Generate deterministic name from ID
      const firstName = FIRST_NAMES[(candidateId - 1) % FIRST_NAMES.length];
      const lastName = LAST_NAMES[Math.floor((candidateId - 1) / FIRST_NAMES.length) % LAST_NAMES.length];
      const fullName = `${firstName} ${lastName}`;

      // Calculate graduation year based on experience
      let gradYear = 2026;
      if (experienceLevel.toLowerCase() === 'senior') gradYear = 2021;
      else if (experienceLevel.toLowerCase() === 'mid') gradYear = 2024;
      else gradYear = 2026;

      // Inferred domain track
      let domain = "Software Engineering";
      const roleLower = jobRole.toLowerCase();
      if (roleLower.includes('data') || roleLower.includes('analyst')) domain = "Data Engineering & Analytics";
      else if (roleLower.includes('ai') || roleLower.includes('machine learning') || roleLower.includes('aiml')) domain = "Artificial Intelligence & ML";
      else if (roleLower.includes('frontend') || roleLower.includes('web') || roleLower.includes('full stack')) domain = "Full-Stack & Web Engineering";
      else if (roleLower.includes('devops') || roleLower.includes('kubernetes') || roleLower.includes('cloud')) domain = "Cloud & DevOps Engineering";
      else if (roleLower.includes('cyber') || roleLower.includes('security')) domain = "Cybersecurity & InfoSec";
      else if (roleLower.includes('mobile') || roleLower.includes('ios') || roleLower.includes('android')) domain = "Mobile App Engineering";
      else if (roleLower.includes('blockchain') || roleLower.includes('solidity') || roleLower.includes('ethereum')) domain = "Web3 & Blockchain";
      else if (roleLower.includes('game') || roleLower.includes('unreal') || roleLower.includes('unity')) domain = "Game Development & 3D Interactive";
      else if (roleLower.includes('design') || roleLower.includes('ui/ux')) domain = "Product Design & UI/UX";
      else if (roleLower.includes('project manager') || roleLower.includes('scrum') || roleLower.includes('agile')) domain = "Software Project & Product Management";
      else if (roleLower.includes('marketing')) domain = "Digital Marketing & Growth Analytics";
      else if (roleLower.includes('hr') || roleLower.includes('human resources')) domain = "Human Resources & Talent Operations";
      else if (roleLower.includes('finance')) domain = "FinTech & Financial Analytics";
      else if (roleLower.includes('c#')) domain = "Enterprise C# & .NET Engineering";
      else if (roleLower.includes('php')) domain = "PHP & Web Solutions Engineering";

      const preferredRoles = getPreferredRolesForJobRole(jobRole);

      candidates.push({
        candidate_id: candidateId,
        id: `kaggle-cand-${candidateId}`,
        name: fullName,
        skills,
        skillsRaw,
        qualification,
        degree: qualification,
        university: qualification.includes("Master's") ? "Premier Institute of Technology" : (qualification.includes("PhD") ? "National Institute of Science" : "State University of Engineering"),
        experience_level: experienceLevel,
        job_role: jobRole,
        domain,
        graduation_year: gradYear,
        preferred_roles: preferredRoles,
        preferred_location: "Bengaluru, India (Open to Remote / Hybrid)",
        location: "India",
        parsed_summary: `${experienceLevel}-level ${jobRole} professional with qualification ${qualification} specializing in ${skills.join(', ')}.`,
        projects: [
          {
            title: `${jobRole} Production System`,
            techStack: skills.slice(0, 4).join(', '),
            description: `Architected and implemented enterprise-grade solution utilizing ${skills.slice(0, 3).join(', ')}.`
          }
        ]
      });
    }
  }

  return candidates;
}

/**
 * Loads all Kaggle candidates from cache, JSON, or CSV
 */
export function getKaggleCandidates(forceReload = false) {
  if (!forceReload && cachedCandidates && cachedCandidates.length > 0) {
    return cachedCandidates;
  }

  if (!forceReload && fs.existsSync(JSON_PATH)) {
    try {
      const data = fs.readFileSync(JSON_PATH, 'utf-8');
      cachedCandidates = JSON.parse(data);
      if (cachedCandidates.length >= 1000) {
        return cachedCandidates;
      }
    } catch (err) {
      console.warn('[KaggleCandidateService] Error reading JSON cache, falling back to CSV:', err.message);
    }
  }

  if (fs.existsSync(CSV_PATH)) {
    const csvData = fs.readFileSync(CSV_PATH, 'utf-8');
    cachedCandidates = parseKaggleCsv(csvData);
    
    // Save structured JSON for fast future accesses
    try {
      fs.writeFileSync(JSON_PATH, JSON.stringify(cachedCandidates, null, 2), 'utf-8');
      console.log(`[KaggleCandidateService] Successfully parsed and cached ${cachedCandidates.length} Kaggle candidates to JSON.`);
    } catch (err) {
      console.error('[KaggleCandidateService] Error saving JSON cache:', err);
    }

    return cachedCandidates;
  }

  return [];
}

/**
 * Returns filtered and paginated Kaggle candidates
 */
export function queryKaggleCandidates(options = {}) {
  const {
    search = '',
    role = '',
    experienceLevel = '',
    domain = '',
    page = 1,
    limit = 20
  } = options;

  const all = getKaggleCandidates();
  let filtered = all;

  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.job_role.toLowerCase().includes(q) ||
      c.qualification.toLowerCase().includes(q) ||
      c.skills.some(s => s.toLowerCase().includes(q)) ||
      String(c.candidate_id) === q
    );
  }

  if (role && role !== 'all') {
    const r = role.toLowerCase();
    filtered = filtered.filter(c => c.job_role.toLowerCase().includes(r));
  }

  if (experienceLevel && experienceLevel !== 'all') {
    const el = experienceLevel.toLowerCase();
    filtered = filtered.filter(c => c.experience_level.toLowerCase() === el);
  }

  if (domain && domain !== 'all') {
    const d = domain.toLowerCase();
    filtered = filtered.filter(c => c.domain.toLowerCase().includes(d));
  }

  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const items = filtered.slice(startIndex, startIndex + limit);

  // Collect distinct roles and experience levels for filtering UI
  const availableRoles = Array.from(new Set(all.map(c => c.job_role))).sort();
  const availableLevels = Array.from(new Set(all.map(c => c.experience_level))).sort();
  const availableDomains = Array.from(new Set(all.map(c => c.domain))).sort();

  return {
    candidates: items,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
    facets: {
      roles: availableRoles,
      experienceLevels: availableLevels,
      domains: availableDomains
    }
  };
}

/**
 * Retrieves a single candidate by ID
 */
export function getKaggleCandidateById(candidateId) {
  const all = getKaggleCandidates();
  const idNum = parseInt(candidateId.toString().replace('kaggle-cand-', ''), 10);
  return all.find(c => c.candidate_id === idNum || c.id === candidateId) || null;
}

/**
 * Runs live Job-Resume Matching Agent evaluation on a specific Kaggle candidate
 */
export async function evaluateKaggleCandidate(candidateId, topK = 10) {
  const candidate = getKaggleCandidateById(candidateId);
  if (!candidate) {
    throw new Error(`Candidate with ID ${candidateId} not found in Kaggle dataset.`);
  }

  const candidateProfile = {
    skills: candidate.skills,
    preferred_roles: candidate.preferred_roles,
    location: candidate.location,
    preferred_location: candidate.preferred_location,
    degree: candidate.degree,
    university: candidate.university,
    graduation_year: candidate.graduation_year,
    projects: candidate.projects,
    experience: [],
    parsed_summary: candidate.parsed_summary
  };

  const recommendations = await runJobResumeMatchingAgent(candidateProfile, topK);

  return {
    candidate,
    recommendations,
    topMatch: recommendations[0] || null,
    totalMatches: recommendations.length
  };
}

/**
 * Executes an automated batch benchmark across the Kaggle candidate dataset
 */
export async function runKaggleBatchBenchmark(sampleSize = 50) {
  const all = getKaggleCandidates();
  if (all.length === 0) {
    return { error: 'No Kaggle candidate dataset loaded.' };
  }

  // Pick a uniformly distributed representative sample or evaluate requested size
  const step = Math.max(1, Math.floor(all.length / sampleSize));
  const testCohort = [];
  for (let i = 0; i < all.length && testCohort.length < sampleSize; i += step) {
    testCohort.push(all[i]);
  }

  let top1AlignedCount = 0;
  let mrrSum = 0;
  let totalScoreSum = 0;
  const rolePerformance = {};

  for (const candidate of testCohort) {
    const candidateProfile = {
      skills: candidate.skills,
      preferred_roles: candidate.preferred_roles,
      location: candidate.location,
      preferred_location: candidate.preferred_location,
      degree: candidate.degree,
      university: candidate.university,
      graduation_year: candidate.graduation_year,
      projects: candidate.projects,
      experience: [],
      parsed_summary: candidate.parsed_summary
    };

    const recs = await runJobResumeMatchingAgent(candidateProfile, 5);
    if (recs.length === 0) continue;

    const top1 = recs[0];
    totalScoreSum += top1.matchScore;

    const topDomainPrefix = candidate.domain.toLowerCase().split(' ')[0];
    const preferredRoleTokens = candidate.preferred_roles.map(r => r.toLowerCase());

    // Evaluate alignment
    let rank = 0;
    for (let rIdx = 0; rIdx < recs.length; rIdx++) {
      const rec = recs[rIdx];
      const jobTitle = rec.internship.title.toLowerCase();
      const jobInd = rec.internship.industry.toLowerCase();
      
      const roleMatch = preferredRoleTokens.some(pr => {
        const tokens = pr.split(' ').filter(t => t.length > 2);
        return tokens.some(t => jobTitle.includes(t));
      });

      if (roleMatch || jobInd.includes(topDomainPrefix) || rec.matchScore >= 65) {
        rank = rIdx + 1;
        break;
      }
    }

    const isTop1Aligned = rank === 1;
    if (isTop1Aligned) top1AlignedCount++;

    const rr = rank > 0 ? (1 / rank) : 0;
    mrrSum += rr;

    if (!rolePerformance[candidate.job_role]) {
      rolePerformance[candidate.job_role] = { total: 0, hits: 0, avgScore: 0, scoreSum: 0 };
    }
    rolePerformance[candidate.job_role].total++;
    if (isTop1Aligned) rolePerformance[candidate.job_role].hits++;
    rolePerformance[candidate.job_role].scoreSum += top1.matchScore;
    rolePerformance[candidate.job_role].avgScore = Math.round(
      rolePerformance[candidate.job_role].scoreSum / rolePerformance[candidate.job_role].total
    );
  }

  const sampleCount = testCohort.length;
  const top1Accuracy = Number(((top1AlignedCount / sampleCount) * 100).toFixed(1));
  const mrr = Number((mrrSum / sampleCount).toFixed(3));
  const avgMatchScore = Number((totalScoreSum / sampleCount).toFixed(1));

  return {
    totalDatasetSize: all.length,
    evaluatedCohortSize: sampleCount,
    top1Accuracy,
    mrr,
    avgMatchScore,
    rolePerformance,
    testedCohorts: testCohort.slice(0, 5).map(c => ({
      candidate_id: c.candidate_id,
      name: c.name,
      job_role: c.job_role,
      skills: c.skills
    }))
  };
}

