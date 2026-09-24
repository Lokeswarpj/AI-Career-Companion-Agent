import express from 'express';
import { db } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { runJobResumeMatchingAgent, evaluateJobResumeMatch } from '../services/matchingAgent.js';

const router = express.Router();

// 1. Get personalized ranked recommendations for current user using Job-Resume Matching Agent
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
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

    const projects = profile?.projects_json ? (typeof profile.projects_json === 'string' ? JSON.parse(profile.projects_json) : profile.projects_json) : [];
    const experience = profile?.experience_json ? (typeof profile.experience_json === 'string' ? JSON.parse(profile.experience_json) : profile.experience_json) : [];
    const hasProfileSkills = studentSkills.length > 0 || projects.length > 0 || experience.length > 0 || !!latestResume?.parsed_summary;

    const isPreview = req.query.preview === 'true';

    if (!hasProfileSkills && !isPreview) {
      return res.json({
        hasProfileSkills: false,
        recommendations: [],
        totalEvaluated: 0,
        topMatchScore: 0,
        topSkillOverlap: 0
      });
    }

    const candidateProfile = {
      skills: studentSkills,
      preferred_roles: profile?.preferred_roles ? (typeof profile.preferred_roles === 'string' ? JSON.parse(profile.preferred_roles) : profile.preferred_roles) : (isPreview ? ['Software Engineering Intern'] : []),
      location: profile?.location || '',
      preferred_location: profile?.preferred_location || '',
      degree: profile?.degree || (isPreview ? 'Computer Science and Engineering' : ''),
      university: profile?.university || (isPreview ? 'University' : ''),
      graduation_year: profile?.graduation_year || 2026,
      projects,
      experience,
      parsed_summary: latestResume?.parsed_summary || ''
    };

    const evaluated = await runJobResumeMatchingAgent(candidateProfile, 50);

    return res.json({
      hasProfileSkills,
      recommendations: evaluated,
      totalEvaluated: evaluated.length,
      topMatchScore: evaluated[0]?.matchScore || 0,
      topSkillOverlap: evaluated[0]?.skillMatrix?.haveCount || 0
    });
  } catch (err) {
    console.error('Recommendations error:', err);
    return res.status(500).json({ error: 'Failed to generate recommendations.' });
  }
});

// 2. Deep-dive evaluation of a specific internship with full multi-agent breakdown and AI explanation
router.get('/evaluate/:internshipId', authenticateToken, async (req, res) => {
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

    const candidateProfile = {
      skills: studentSkills,
      preferred_roles: profile?.preferred_roles ? (typeof profile.preferred_roles === 'string' ? JSON.parse(profile.preferred_roles) : profile.preferred_roles) : [],
      location: profile?.location || '',
      preferred_location: profile?.preferred_location || '',
      degree: profile?.degree || '',
      university: profile?.university || '',
      graduation_year: profile?.graduation_year || 2026,
      projects: profile?.projects_json ? (typeof profile.projects_json === 'string' ? JSON.parse(profile.projects_json) : profile.projects_json) : [],
      experience: profile?.experience_json ? (typeof profile.experience_json === 'string' ? JSON.parse(profile.experience_json) : profile.experience_json) : [],
      parsed_summary: latestResume?.parsed_summary || ''
    };

    const result = await evaluateJobResumeMatch(candidateProfile, internship, true);

    return res.json({
      internship: {
        ...internship,
        required_skills_json: internship.required_skills_json ? JSON.parse(internship.required_skills_json) : [],
        preferred_skills_json: internship.preferred_skills_json ? JSON.parse(internship.preferred_skills_json) : [],
        responsibilities_json: internship.responsibilities_json ? JSON.parse(internship.responsibilities_json) : []
      },
      matchScore: result.overallMatchScore,
      ...result
    });
  } catch (err) {
    console.error('Deep-dive match error:', err);
    return res.status(500).json({ error: 'Failed to evaluate match.' });
  }
});

// 3. Ad-hoc evaluate profile payload (useful for benchmarks and live simulation)
router.post('/evaluate-profile', async (req, res) => {
  try {
    const { profile, limit = 20 } = req.body;
    if (!profile) {
      return res.status(400).json({ error: 'Profile object is required.' });
    }

    const recommendations = await runJobResumeMatchingAgent(profile, limit);
    return res.json({ recommendations });
  } catch (err) {
    console.error('Evaluate profile error:', err);
    return res.status(500).json({ error: 'Failed to evaluate profile.' });
  }
});

export default router;

