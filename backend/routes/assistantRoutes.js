import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { runCareerAssistantAgent } from '../services/careerAssistantAgent.js';

const router = express.Router();

// Chat with AI Career Companion (M3.4 Multi-Agent Orchestration)
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    // 1. Fetch student context
    const user = await db.get('SELECT full_name FROM users WHERE id = ?', [req.user.id]);
    const profile = await db.get('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);
    const latestResume = await db.get('SELECT * FROM resumes WHERE user_id = ? ORDER BY uploaded_at DESC LIMIT 1', [req.user.id]);
    const savedJobs = await db.all(
      `SELECT i.title, i.company FROM saved_internships s JOIN internships i ON s.internship_id = i.id WHERE s.user_id = ?`,
      [req.user.id]
    );
    const avgScoreRow = await db.get(
      "SELECT AVG(overall_score) as avgScore FROM interview_sessions WHERE user_id = ? AND status = 'completed'",
      [req.user.id]
    );

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

    const studentRoles = profile?.preferred_roles ? (typeof profile.preferred_roles === 'string' ? JSON.parse(profile.preferred_roles) : profile.preferred_roles) : [];

    const studentContext = {
      name: user?.full_name || req.user.full_name || 'Student',
      degree: profile?.degree,
      university: profile?.university,
      graduation_year: profile?.graduation_year || 2026,
      skills: studentSkills,
      technical_skills: studentSkills,
      preferred_roles: studentRoles,
      projects: profile?.projects_json ? (typeof profile.projects_json === 'string' ? JSON.parse(profile.projects_json) : profile.projects_json) : [],
      hasResume: !!latestResume,
      avgScore: avgScoreRow?.avgScore ? Math.round(avgScoreRow.avgScore) : null,
      savedInternships: savedJobs.map(j => `${j.title} at ${j.company}`)
    };

    // 2. Fetch recent chat history
    const history = await db.all(
      'SELECT role, content FROM chat_messages WHERE user_id = ? ORDER BY timestamp ASC LIMIT 10',
      [req.user.id]
    );

    // 3. Save user's message
    const userMsgId = uuidv4();
    await db.run(
      'INSERT INTO chat_messages (id, user_id, role, content) VALUES (?, ?, ?, ?)',
      [userMsgId, req.user.id, 'user', message.trim()]
    );

    // 4. Generate AI response with Multi-Agent Orchestrator
    const replyText = await runCareerAssistantAgent(message.trim(), studentContext, history);

    // 5. Save assistant reply
    const botMsgId = uuidv4();
    await db.run(
      'INSERT INTO chat_messages (id, user_id, role, content) VALUES (?, ?, ?, ?)',
      [botMsgId, req.user.id, 'assistant', replyText]
    );

    return res.json({
      reply: replyText,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Assistant chat error:', err);
    return res.status(500).json({ error: 'Failed to process AI chat message.' });
  }
});

// Get conversation history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const history = await db.all(
      'SELECT id, role, content, timestamp FROM chat_messages WHERE user_id = ? ORDER BY timestamp ASC LIMIT 50',
      [req.user.id]
    );
    return res.json({ history });
  } catch (err) {
    console.error('Get chat history error:', err);
    return res.status(500).json({ error: 'Failed to retrieve chat history.' });
  }
});

// Clear conversation history
router.delete('/history', authenticateToken, async (req, res) => {
  try {
    await db.run('DELETE FROM chat_messages WHERE user_id = ?', [req.user.id]);
    return res.json({ message: 'Conversation history reset.' });
  } catch (err) {
    console.error('Clear chat history error:', err);
    return res.status(500).json({ error: 'Failed to clear chat history.' });
  }
});

export default router;
