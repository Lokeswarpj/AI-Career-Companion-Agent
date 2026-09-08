import { v4 as uuidv4 } from 'uuid';
import { vectorStore, getEmbedding } from './vectorStore.js';
import { db } from '../config/database.js';

/**
 * Splits a structured internship posting into semantic, high-signal chunks with metadata.
 */
export function chunkJobPosting(job) {
  const chunks = [];
  const reqSkills = Array.isArray(job.required_skills) 
    ? job.required_skills 
    : (typeof job.required_skills_json === 'string' ? JSON.parse(job.required_skills_json || '[]') : []);

  const prefSkills = Array.isArray(job.preferred_skills)
    ? job.preferred_skills
    : (typeof job.preferred_skills_json === 'string' ? JSON.parse(job.preferred_skills_json || '[]') : []);

  const responsibilities = Array.isArray(job.responsibilities)
    ? job.responsibilities
    : (typeof job.responsibilities_json === 'string' ? JSON.parse(job.responsibilities_json || '[]') : []);

  const metadata = {
    internship_id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    remote_type: job.remote_type,
    industry: job.industry || 'Technology',
    stipend: job.stipend || '',
    duration: job.duration || ''
  };

  // Chunk 1: Role Overview & Company Mission
  const overviewText = `Job Title: ${job.title}\nCompany: ${job.company}\nIndustry: ${job.industry || 'Technology'}\nLocation: ${job.location} (${job.remote_type})\nDescription: ${job.description || ''}`;
  chunks.push({
    id: `${job.id}-chunk-overview`,
    internshipId: job.id,
    chunkIndex: 0,
    chunkType: 'overview',
    text: overviewText,
    metadata
  });

  // Chunk 2: Key Responsibilities & Daily Tasks
  if (responsibilities && responsibilities.length > 0) {
    const respText = `Role: ${job.title} at ${job.company}\nCore Responsibilities and Duties:\n` + 
      responsibilities.map(r => `• ${r}`).join('\n');
    chunks.push({
      id: `${job.id}-chunk-responsibilities`,
      internshipId: job.id,
      chunkIndex: 1,
      chunkType: 'responsibilities',
      text: respText,
      metadata
    });
  }

  // Chunk 3: Required & Preferred Technical Skills
  const skillsText = `Role: ${job.title} at ${job.company}\nRequired Technical Skills: ${reqSkills.join(', ')}\nPreferred Skills: ${prefSkills.join(', ')}\nQualifications: ${job.qualifications || job.preferred_qualifications || ''}`;
  chunks.push({
    id: `${job.id}-chunk-skills`,
    internshipId: job.id,
    chunkIndex: 2,
    chunkType: 'requirements_skills',
    text: skillsText,
    metadata
  });

  // Chunk 4: Education & Experience Prerequisites
  const eduText = `Role: ${job.title} at ${job.company}\nEducation Requirements: ${job.education_requirements || 'B.Tech/B.E. in Computer Science or related degree'}\nExperience Requirements: ${job.experience_requirements || 'Relevant project or academic experience'}\nDuration: ${job.duration || '3-6 Months'}\nStipend: ${job.stipend || 'Competitive'}`;
  chunks.push({
    id: `${job.id}-chunk-education`,
    internshipId: job.id,
    chunkIndex: 3,
    chunkType: 'qualifications',
    text: eduText,
    metadata
  });

  return chunks;
}

/**
 * Builds the complete RAG Knowledge Base by chunking and embedding all internships.
 */
export async function buildKnowledgeBase(internships) {
  console.log(`[RAG Service] Generating semantic chunks and embeddings for ${internships.length} internships...`);
  const allChunks = [];

  for (const job of internships) {
    const chunks = chunkJobPosting(job);
    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk.text);
      allChunks.push({
        ...chunk,
        embedding
      });
    }
  }

  await vectorStore.indexChunks(allChunks);
  console.log(`[RAG Service] Knowledge Base successfully built! Total indexed chunks: ${allChunks.length}`);
  return allChunks.length;
}

/**
 * Natural Language Semantic Search over the Internship Knowledge Base.
 */
export async function searchInternshipsSemantic(query, options = {}) {
  const { topK = 15, remoteType = 'All', industry = 'All' } = options;

  const vectorResults = await vectorStore.search(query, topK, { remoteType, industry });
  if (vectorResults.length === 0) return [];

  const matchedJobIds = vectorResults.map(r => r.internshipId);
  const placeholders = matchedJobIds.map(() => '?').join(',');
  const fullJobs = await db.all(`SELECT * FROM internships WHERE id IN (${placeholders})`, matchedJobIds);
  const jobMap = new Map(fullJobs.map(j => [j.id, j]));

  return vectorResults.map(vr => {
    const fullJob = jobMap.get(vr.internshipId) || {};
    return {
      id: vr.internshipId,
      title: fullJob.title || vr.metadata.title,
      company: fullJob.company || vr.metadata.company,
      location: fullJob.location || vr.metadata.location,
      remote_type: fullJob.remote_type || vr.metadata.remote_type,
      industry: fullJob.industry || vr.metadata.industry,
      description: fullJob.description || '',
      required_skills_json: fullJob.required_skills_json ? JSON.parse(fullJob.required_skills_json) : [],
      preferred_skills_json: fullJob.preferred_skills_json ? JSON.parse(fullJob.preferred_skills_json) : [],
      responsibilities_json: fullJob.responsibilities_json ? JSON.parse(fullJob.responsibilities_json) : [],
      duration: fullJob.duration || vr.metadata.duration,
      stipend: fullJob.stipend || vr.metadata.stipend,
      source: fullJob.source || 'Curated',
      apply_url: fullJob.apply_url || '',
      posted_date: fullJob.posted_date || '',
      deadline: fullJob.deadline || '',
      semanticScore: vr.similarityPercent,
      cosineSimilarity: vr.similarity,
      bestMatchedChunk: vr.bestMatchedChunk
    };
  });
}

/**
 * Formulates a rich candidate profile query and retrieves candidate-aligned postings via RAG.
 */
export async function retrieveRelevantJobsForProfile(candidateProfile, topK = 100) {
  const skills = Array.isArray(candidateProfile.skills) 
    ? candidateProfile.skills.join(', ') 
    : (candidateProfile.technical_skills || '');
  
  const roles = Array.isArray(candidateProfile.preferred_roles)
    ? candidateProfile.preferred_roles.join(' ')
    : (candidateProfile.preferred_roles || '');

  const query = `Candidate Skills: ${skills}. Target Roles: ${roles}. Degree: ${candidateProfile.degree || 'Computer Science'}. Summary: ${candidateProfile.parsed_summary || candidateProfile.summary || ''}`;
  
  const results = await vectorStore.search(query, topK);
  return results;
}
