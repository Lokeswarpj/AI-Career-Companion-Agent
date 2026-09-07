import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { extractResumeText } from '../services/resumeParser.js';
import { analyzeResumeWithGemini, generateCoverLetterWithGemini } from '../services/geminiService.js';

const router = express.Router();

// Upload and analyze resume
router.post('/upload', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded. Please select a PDF or DOCX file.' });
    }

    const { originalname, mimetype, buffer } = req.file;

    // 1. Extract raw text from file buffer
    const rawText = await extractResumeText(buffer, mimetype, originalname);
    
    if (!rawText || rawText.length < 30) {
      return res.status(400).json({ error: 'Could not extract sufficient text from the resume. Please ensure the file contains selectable text.' });
    }

    // 2. Analyze with Gemini AI
    const analysis = await analyzeResumeWithGemini(rawText);

    const resumeId = uuidv4();

    // 3. Save into database
    await db.run(
      `INSERT INTO resumes 
       (id, user_id, filename, file_type, raw_text, parsed_summary, detected_skills_json, strengths_json, weaknesses_json, recommended_skills_json, career_suggestions_json) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resumeId,
        req.user.id,
        originalname,
        mimetype,
        rawText,
        analysis.summary,
        JSON.stringify(analysis.skills),
        JSON.stringify(analysis.strengths),
        JSON.stringify(analysis.weaknesses),
        JSON.stringify(analysis.recommendedSkills),
        JSON.stringify(analysis.careerSuggestions)
      ]
    );

    // 4. Optionally update profile skills with extracted technical skills if student profile is empty or requested
    const allExtractedTechSkills = [
      ...(analysis.skills.programming || []),
      ...(analysis.skills.web || []),
      ...(analysis.skills.aiData || []),
      ...(analysis.skills.cloud || []),
      ...(analysis.skills.tools || [])
    ];

    const profile = await db.get('SELECT technical_skills, soft_skills FROM profiles WHERE user_id = ?', [req.user.id]);
    if (profile) {
      let currentTech = [];
      try { currentTech = JSON.parse(profile.technical_skills || '[]'); } catch { currentTech = []; }
      
      const mergedTech = Array.from(new Set([...currentTech, ...allExtractedTechSkills]));
      const mergedSoft = Array.from(new Set([...(profile.soft_skills ? JSON.parse(profile.soft_skills) : []), ...(analysis.skills.soft || [])]));

      await db.run(
        `UPDATE profiles SET technical_skills = ?, soft_skills = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
        [JSON.stringify(mergedTech), JSON.stringify(mergedSoft), req.user.id]
      );
    }

    return res.status(201).json({
      message: 'Resume analyzed successfully with Gemini AI!',
      resumeId,
      analysis,
      filename: originalname
    });
  } catch (err) {
    console.error('Resume upload error:', err);
    return res.status(500).json({ error: err.message || 'Failed to process and analyze resume.' });
  }
});

// Get latest analyzed resume for current user
router.get('/latest', authenticateToken, async (req, res) => {
  try {
    const resume = await db.get(
      'SELECT * FROM resumes WHERE user_id = ? ORDER BY uploaded_at DESC LIMIT 1',
      [req.user.id]
    );

    if (!resume) {
      return res.json({ resume: null });
    }

    const parsed = {
      ...resume,
      detected_skills_json: resume.detected_skills_json ? JSON.parse(resume.detected_skills_json) : {},
      strengths_json: resume.strengths_json ? JSON.parse(resume.strengths_json) : [],
      weaknesses_json: resume.weaknesses_json ? JSON.parse(resume.weaknesses_json) : [],
      recommended_skills_json: resume.recommended_skills_json ? JSON.parse(resume.recommended_skills_json) : [],
      career_suggestions_json: resume.career_suggestions_json ? JSON.parse(resume.career_suggestions_json) : []
    };

    return res.json({ resume: parsed });
  } catch (err) {
    console.error('Get latest resume error:', err);
    return res.status(500).json({ error: 'Failed to retrieve resume analysis.' });
  }
});

// Generate tailored cover letter (Cover Letter Agent)
router.post('/cover-letter', authenticateToken, async (req, res) => {
  try {
    const { internshipId, internshipData, tone } = req.body;

    // Fetch student profile
    const profile = await db.get('SELECT p.*, u.full_name, u.email FROM profiles p JOIN users u ON p.user_id = u.id WHERE p.user_id = ?', [req.user.id]);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found. Please complete your profile first.' });
    }

    let targetInternship = internshipData;
    if (!targetInternship && internshipId) {
      targetInternship = await db.get('SELECT * FROM internships WHERE id = ?', [internshipId]);
    }

    if (!targetInternship) {
      return res.status(400).json({ error: 'Please specify an internship or provide internship details.' });
    }

    const candidateProfile = {
      ...profile,
      technical_skills: profile.technical_skills ? JSON.parse(profile.technical_skills) : [],
      preferred_roles: profile.preferred_roles ? JSON.parse(profile.preferred_roles) : []
    };

    const result = await generateCoverLetterWithGemini(candidateProfile, targetInternship, tone);
    return res.json(result);
  } catch (err) {
    console.error('Cover letter error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate cover letter.' });
  }
});

// Delete resume
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM resumes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return res.json({ message: 'Resume deleted successfully.' });
  } catch (err) {
    console.error('Delete resume error:', err);
    return res.status(500).json({ error: 'Failed to delete resume.' });
  }
});

export default router;
