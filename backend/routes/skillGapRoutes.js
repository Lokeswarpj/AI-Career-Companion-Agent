import express from 'express';
import { db } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { runSkillGapAnalysisAgent } from '../services/skillGapAgent.js';

const router = express.Router();

function safeArray(val, fallback = []) {
  if (!val) return fallback;
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return Object.values(val);
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return val.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return fallback;
}

// 1. Analyze skill gap for a specific internship
router.get('/analyze/:internshipId', authenticateToken, async (req, res) => {
  try {
    const { internshipId } = req.params;

    const internship = await db.get('SELECT * FROM internships WHERE id = ?', [internshipId]);
    if (!internship) {
      return res.status(404).json({ error: 'Internship not found.' });
    }

    const profile = await db.get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    const latestResume = await db.get('SELECT * FROM resumes WHERE user_id = ? ORDER BY uploaded_at DESC LIMIT 1', [req.user.id]);

    let studentSkills = [];
    if (profile && profile.technical_skills) {
      studentSkills = safeArray(profile.technical_skills);
    }
    if (latestResume && latestResume.detected_skills_json) {
      try {
        const resumeSkills = typeof latestResume.detected_skills_json === 'string'
          ? JSON.parse(latestResume.detected_skills_json)
          : latestResume.detected_skills_json;
        if (resumeSkills && typeof resumeSkills === 'object') {
          const combined = [
            ...(resumeSkills.programming || []),
            ...(resumeSkills.web || []),
            ...(resumeSkills.aiData || []),
            ...(resumeSkills.cloud || []),
            ...(resumeSkills.tools || [])
          ];
          studentSkills = Array.from(new Set([...studentSkills, ...combined]));
        }
      } catch {}
    }

    const studentProfile = {
      skills: studentSkills,
      technical_skills: studentSkills,
      soft_skills: safeArray(profile?.soft_skills),
      preferred_roles: safeArray(profile?.preferred_roles),
      degree: profile?.degree || 'Computer Science and Engineering',
      university: profile?.university || 'University',
      graduation_year: profile?.graduation_year || 2026,
      projects: safeArray(profile?.projects_json),
      experience: safeArray(profile?.experience_json),
      certifications: safeArray(profile?.certifications_json)
    };

    const analysis = await runSkillGapAnalysisAgent(studentProfile, internship);
    return res.json(analysis);
  } catch (err) {
    console.error('Skill gap analysis error:', err);
    return res.status(500).json({ error: 'Failed to execute skill gap analysis.' });
  }
});

// 2. Custom skill gap analysis against ad-hoc job payload
router.post('/custom-analyze', authenticateToken, async (req, res) => {
  try {
    const { jobTitle, company, requiredSkills, preferredSkills, description } = req.body;

    const profile = await db.get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);

    let studentSkills = [];
    if (profile && profile.technical_skills) {
      studentSkills = safeArray(profile.technical_skills);
    }

    const studentProfile = {
      skills: studentSkills,
      technical_skills: studentSkills,
      soft_skills: safeArray(profile?.soft_skills),
      degree: profile?.degree || 'Computer Science',
      university: profile?.university || 'University',
      projects: safeArray(profile?.projects_json)
    };

    const customInternship = {
      id: 'custom-job',
      title: jobTitle || 'Software Engineer Intern',
      company: company || 'Target Company',
      required_skills_json: JSON.stringify(requiredSkills || ['Python', 'JavaScript']),
      preferred_skills_json: JSON.stringify(preferredSkills || []),
      description: description || ''
    };

    const analysis = await runSkillGapAnalysisAgent(studentProfile, customInternship);
    return res.json(analysis);
  } catch (err) {
    console.error('Custom skill gap error:', err);
    return res.status(500).json({ error: 'Failed to analyze custom job requirements.' });
  }
});

export default router;
