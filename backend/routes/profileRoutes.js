import express from 'express';
import { db } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get profile of current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const profile = await db.get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    // Parse JSON fields safely
    const parsed = {
      ...profile,
      preferred_roles: profile.preferred_roles ? JSON.parse(profile.preferred_roles) : [],
      technical_skills: profile.technical_skills ? JSON.parse(profile.technical_skills) : [],
      soft_skills: profile.soft_skills ? JSON.parse(profile.soft_skills) : [],
      experience_json: profile.experience_json ? JSON.parse(profile.experience_json) : [],
      projects_json: profile.projects_json ? JSON.parse(profile.projects_json) : [],
      certifications_json: profile.certifications_json ? JSON.parse(profile.certifications_json) : [],
      preferred_industries: profile.preferred_industries ? JSON.parse(profile.preferred_industries) : []
    };

    return res.json({ profile: parsed });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

// Update profile of current user
router.put('/', authenticateToken, async (req, res) => {
  try {
    const {
      phone,
      university,
      degree,
      graduation_year,
      location,
      preferred_location,
      preferred_roles,
      technical_skills,
      soft_skills,
      experience_json,
      projects_json,
      certifications_json,
      preferred_industries
    } = req.body;

    const existing = await db.get('SELECT id FROM profiles WHERE user_id = ?', [req.user.id]);

    if (!existing) {
      return res.status(404).json({ error: 'Profile not found.' });
    }

    await db.run(
      `UPDATE profiles SET
        phone = ?,
        university = ?,
        degree = ?,
        graduation_year = ?,
        location = ?,
        preferred_location = ?,
        preferred_roles = ?,
        technical_skills = ?,
        soft_skills = ?,
        experience_json = ?,
        projects_json = ?,
        certifications_json = ?,
        preferred_industries = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [
        phone || null,
        university || null,
        degree || null,
        graduation_year ? parseInt(graduation_year) : null,
        location || null,
        preferred_location || null,
        JSON.stringify(Array.isArray(preferred_roles) ? preferred_roles : []),
        JSON.stringify(Array.isArray(technical_skills) ? technical_skills : []),
        JSON.stringify(Array.isArray(soft_skills) ? soft_skills : []),
        JSON.stringify(Array.isArray(experience_json) ? experience_json : []),
        JSON.stringify(Array.isArray(projects_json) ? projects_json : []),
        JSON.stringify(Array.isArray(certifications_json) ? certifications_json : []),
        JSON.stringify(Array.isArray(preferred_industries) ? preferred_industries : []),
        req.user.id
      ]
    );

    return res.json({ message: 'Career profile updated successfully!' });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

export default router;
