import express from 'express';
import { db } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { evaluateInternshipMatch } from '../services/matchingEngine.js';

const router = express.Router();

// Get personalized ranked recommendations for current user
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    // 1. Fetch user profile & latest resume
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
      preferred_roles: profile?.preferred_roles ? JSON.parse(profile.preferred_roles) : [],
      location: profile?.location || '',
      preferred_location: profile?.preferred_location || '',
      degree: profile?.degree || '',
      university: profile?.university || '',
      parsed_summary: latestResume?.parsed_summary || ''
    };

    // 2. Fetch all active internships
    const allInternships = await db.all('SELECT * FROM internships');

    // 3. Evaluate each internship deterministically
    const evaluated = [];
    for (const item of allInternships) {
      const matchResult = await evaluateInternshipMatch(candidateProfile, item, false);
      evaluated.push({
        internship: {
          ...item,
          required_skills_json: item.required_skills_json ? JSON.parse(item.required_skills_json) : []
        },
        matchScore: matchResult.overallMatchScore,
        breakdown: matchResult.breakdown,
        skillMatrix: matchResult.skillMatrix
      });
    }

    // 4. Sort descending by match score
    evaluated.sort((a, b) => b.matchScore - a.matchScore);

    return res.json({
      recommendations: evaluated,
      totalEvaluated: evaluated.length,
      topSkillOverlap: evaluated[0]?.skillMatrix?.haveCount || 0
    });
  } catch (err) {
    console.error('Recommendations error:', err);
    return res.status(500).json({ error: 'Failed to generate recommendations.' });
  }
});

// Deep-dive evaluation of a specific internship with AI explanation and full skill-gap breakdown
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
      preferred_roles: profile?.preferred_roles ? JSON.parse(profile.preferred_roles) : [],
      location: profile?.location || '',
      preferred_location: profile?.preferred_location || '',
      degree: profile?.degree || '',
      university: profile?.university || '',
      parsed_summary: latestResume?.parsed_summary || ''
    };

    // Run hybrid evaluation with Gemini explanation
    const result = await evaluateInternshipMatch(candidateProfile, internship, true);

    return res.json({
      internship: {
        ...internship,
        required_skills_json: internship.required_skills_json ? JSON.parse(internship.required_skills_json) : []
      },
      ...result
    });
  } catch (err) {
    console.error('Deep-dive match error:', err);
    return res.status(500).json({ error: 'Failed to evaluate match.' });
  }
});

export default router;
