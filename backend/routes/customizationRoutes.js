import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { tailorResumeForRole, generateCustomizedCoverLetter } from '../services/applicationCustomizerAgent.js';

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

// Helper to construct enriched student profile
async function getEnrichedStudentProfile(userId) {
  const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
  const profile = await db.get('SELECT * FROM profiles WHERE user_id = ?', [userId]);
  const latestResume = await db.get('SELECT * FROM resumes WHERE user_id = ? ORDER BY uploaded_at DESC LIMIT 1', [userId]);

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

  return {
    id: user?.id,
    full_name: user?.full_name || 'Candidate',
    email: user?.email || 'candidate@university.edu',
    phone: profile?.phone || '+91 98765 43210',
    university: profile?.university || 'University',
    degree: profile?.degree || 'B.Tech in Computer Science',
    graduation_year: profile?.graduation_year || 2026,
    location: profile?.location || 'Bengaluru, India',
    skills: studentSkills,
    technical_skills: studentSkills,
    soft_skills: safeArray(profile?.soft_skills),
    preferred_roles: safeArray(profile?.preferred_roles),
    projects: safeArray(profile?.projects_json),
    experience: safeArray(profile?.experience_json),
    certifications: safeArray(profile?.certifications_json)
  };
}

// 1. Tailor resume for an internship
router.post('/tailor-resume', authenticateToken, async (req, res) => {
  try {
    const { internshipId, internshipData } = req.body;

    let targetInternship = internshipData;
    if (!targetInternship && internshipId) {
      targetInternship = await db.get('SELECT * FROM internships WHERE id = ?', [internshipId]);
    }

    if (!targetInternship) {
      return res.status(400).json({ error: 'Please select an internship or provide internship details.' });
    }

    const candidateProfile = await getEnrichedStudentProfile(req.user.id);
    const result = await tailorResumeForRole(candidateProfile, targetInternship);

    return res.json(result);
  } catch (err) {
    console.error('Tailor resume route error:', err);
    return res.status(500).json({ error: 'Failed to generate tailored resume.' });
  }
});

// 2. Generate customized cover letter
router.post('/cover-letter', authenticateToken, async (req, res) => {
  try {
    const { internshipId, internshipData, tone = 'Professional & Enthusiastic' } = req.body;

    let targetInternship = internshipData;
    if (!targetInternship && internshipId) {
      targetInternship = await db.get('SELECT * FROM internships WHERE id = ?', [internshipId]);
    }

    if (!targetInternship) {
      return res.status(400).json({ error: 'Please select an internship or provide internship details.' });
    }

    const candidateProfile = await getEnrichedStudentProfile(req.user.id);
    const result = await generateCustomizedCoverLetter(candidateProfile, targetInternship, tone);

    return res.json(result);
  } catch (err) {
    console.error('Cover letter route error:', err);
    return res.status(500).json({ error: 'Failed to generate customized cover letter.' });
  }
});

// 3. Save tailored application bundle
router.post('/save-application', authenticateToken, async (req, res) => {
  try {
    const { internshipId, roleTitle, company, tailoredResumeJson, coverLetter, atsScore } = req.body;

    if (!roleTitle || !company) {
      return res.status(400).json({ error: 'Role title and company are required.' });
    }

    const id = uuidv4();
    await db.run(
      `INSERT INTO tailored_applications 
       (id, user_id, internship_id, role_title, company, tailored_resume_json, cover_letter, ats_score) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.id,
        internshipId || null,
        roleTitle,
        company,
        typeof tailoredResumeJson === 'string' ? tailoredResumeJson : JSON.stringify(tailoredResumeJson || {}),
        coverLetter || '',
        atsScore || 0
      ]
    );

    return res.status(201).json({
      message: 'Application materials saved successfully!',
      id
    });
  } catch (err) {
    console.error('Save application error:', err);
    return res.status(500).json({ error: 'Failed to save tailored application.' });
  }
});

// 4. Get all saved tailored applications for current user
router.get('/applications', authenticateToken, async (req, res) => {
  try {
    const applications = await db.all(
      'SELECT * FROM tailored_applications WHERE user_id = ? ORDER BY updated_at DESC',
      [req.user.id]
    );

    const parsed = applications.map(app => ({
      ...app,
      tailored_resume_json: app.tailored_resume_json ? (typeof app.tailored_resume_json === 'string' ? JSON.parse(app.tailored_resume_json) : app.tailored_resume_json) : {}
    }));

    return res.json({ applications: parsed });
  } catch (err) {
    console.error('Get applications error:', err);
    return res.status(500).json({ error: 'Failed to retrieve saved applications.' });
  }
});

// 5. Delete a saved tailored application
router.delete('/applications/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM tailored_applications WHERE id = ? AND user_id = ?', [id, req.user.id]);
    return res.json({ message: 'Tailored application removed successfully.' });
  } catch (err) {
    console.error('Delete application error:', err);
    return res.status(500).json({ error: 'Failed to delete application.' });
  }
});

export default router;
