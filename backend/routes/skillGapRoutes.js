import express from 'express';
import { db } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { runSkillGapAnalysisAgent } from '../services/skillGapAgent.js';

const router = express.Router();

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
      try { studentSkills = JSON.parse(profile.technical_skills); } catch {}
    }
    if (latestResume && latestResume.detected_skills_json) {
      try {
        const resumeSkills = JSON.parse(latestResume.detected_skills_json);
        const combined = [
          ...(resumeSkills.programming || []),
          ...(resumeSkills.web || []),
          ...(resumeSkills.aiData || []),
          ...(resumeSkills.cloud || []),
          ...(resumeSkills.tools || [])
        ];
        studentSkills = Array.from(new Set([...studentSkills, ...combined]));
      } catch {}
    }

    const studentProfile = {
      skills: studentSkills,
      soft_skills: profile?.soft_skills ? (typeof profile.soft_skills === 'string' ? JSON.parse(profile.soft_skills) : profile.soft_skills) : [],
      preferred_roles: profile?.preferred_roles ? (typeof profile.preferred_roles === 'string' ? JSON.parse(profile.preferred_roles) : profile.preferred_roles) : [],
      degree: profile?.degree || 'Computer Science and Engineering',
      university: profile?.university || 'University',
      graduation_year: profile?.graduation_year || 2026,
      projects: profile?.projects_json ? (typeof profile.projects_json === 'string' ? JSON.parse(profile.projects_json) : profile.projects_json) : [],
      experience: profile?.experience_json ? (typeof profile.experience_json === 'string' ? JSON.parse(profile.experience_json) : profile.experience_json) : [],
      certifications: profile?.certifications_json ? (typeof profile.certifications_json === 'string' ? JSON.parse(profile.certifications_json) : profile.certifications_json) : []
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
    const latestResume = await db.get('SELECT * FROM resumes WHERE user_id = ? ORDER BY uploaded_at DESC LIMIT 1', [req.user.id]);

    let studentSkills = [];
    if (profile && profile.technical_skills) {
      try { studentSkills = JSON.parse(profile.technical_skills); } catch {}
    }

    const studentProfile = {
      skills: studentSkills,
      soft_skills: profile?.soft_skills ? (typeof profile.soft_skills === 'string' ? JSON.parse(profile.soft_skills) : profile.soft_skills) : [],
      degree: profile?.degree || 'Computer Science',
      university: profile?.university || 'University',
      projects: profile?.projects_json ? (typeof profile.projects_json === 'string' ? JSON.parse(profile.projects_json) : profile.projects_json) : []
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
