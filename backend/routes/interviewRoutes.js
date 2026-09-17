import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { 
  generateCategorizedInterviewQuestions, 
  generatePreInterviewPrepGuide, 
  evaluateInterviewAnswerM3 
} from '../services/interviewPrepAgent.js';

const router = express.Router();

// Helper to fetch student profile
async function getStudentProfile(userId) {
  const profile = await db.get('SELECT * FROM profiles WHERE user_id = ?', [userId]);
  const latestResume = await db.get('SELECT * FROM resumes WHERE user_id = ? ORDER BY uploaded_at DESC LIMIT 1', [userId]);

  let skills = [];
  if (profile && profile.technical_skills) {
    try { skills = JSON.parse(profile.technical_skills); } catch {}
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
      skills = Array.from(new Set([...skills, ...combined]));
    } catch {}
  }

  return {
    skills,
    technical_skills: skills,
    degree: profile?.degree || 'Computer Science and Engineering',
    university: profile?.university || 'University',
    graduation_year: profile?.graduation_year || 2026,
    projects: profile?.projects_json ? (typeof profile.projects_json === 'string' ? JSON.parse(profile.projects_json) : profile.projects_json) : [],
    experience: profile?.experience_json ? (typeof profile.experience_json === 'string' ? JSON.parse(profile.experience_json) : profile.experience_json) : []
  };
}

// 1. Get Pre-Interview Prep Guide & Revision Topics Checklist
router.get('/prep-guide/:internshipId', authenticateToken, async (req, res) => {
  try {
    const { internshipId } = req.params;
    const internship = await db.get('SELECT * FROM internships WHERE id = ?', [internshipId]);

    if (!internship) {
      return res.status(404).json({ error: 'Internship not found.' });
    }

    const studentProfile = await getStudentProfile(req.user.id);
    const guide = await generatePreInterviewPrepGuide(internship, studentProfile);

    return res.json(guide);
  } catch (err) {
    console.error('Prep guide error:', err);
    return res.status(500).json({ error: 'Failed to generate pre-interview preparation guide.' });
  }
});

// 2. Start a new mock interview session with 5 categorized questions
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { internshipId, roleTitle, difficulty = 'Intermediate', interviewType = 'Technical' } = req.body;

    let internship = null;
    if (internshipId) {
      internship = await db.get('SELECT * FROM internships WHERE id = ?', [internshipId]);
    }

    const effectiveRole = roleTitle || internship?.title || 'Full-Stack Software Engineer';
    const dummyInternship = internship || {
      title: effectiveRole,
      company: 'Premier Tech Enterprise',
      required_skills_json: JSON.stringify(['JavaScript', 'Python', 'React', 'Node.js', 'System Design'])
    };

    const studentProfile = await getStudentProfile(req.user.id);

    // Generate 5 categorized questions (Technical, Resume-based, Project-based, Scenario, HR)
    const generatedQuestions = await generateCategorizedInterviewQuestions(
      dummyInternship,
      studentProfile,
      difficulty
    );

    const sessionId = uuidv4();

    // Insert interview session
    await db.run(
      `INSERT INTO interview_sessions 
       (id, user_id, internship_id, role_title, difficulty, interview_type, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, req.user.id, internshipId || null, effectiveRole, difficulty, interviewType, 'in_progress']
    );

    // Insert question records
    for (const q of generatedQuestions) {
      const exchangeId = uuidv4();
      await db.run(
        `INSERT INTO interview_exchanges 
         (id, session_id, question_number, question_text, category, ideal_answer_points) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          exchangeId,
          sessionId,
          q.questionNumber || 1,
          q.questionText || '',
          q.category || interviewType,
          JSON.stringify(q.expectedKeyPoints || [])
        ]
      );
    }

    return res.status(201).json({
      sessionId,
      roleTitle: effectiveRole,
      difficulty,
      interviewType,
      totalQuestions: generatedQuestions.length,
      firstQuestion: generatedQuestions[0],
      allQuestions: generatedQuestions
    });
  } catch (err) {
    console.error('Start interview error:', err);
    return res.status(500).json({ error: 'Failed to initialize mock interview.' });
  }
});

// 3. Submit answer for a question in real-time with 3-dimensional evaluation
router.post('/submit-answer', authenticateToken, async (req, res) => {
  try {
    const { sessionId, questionNumber, userAnswer } = req.body;

    if (!sessionId || questionNumber === undefined || !userAnswer) {
      return res.status(400).json({ error: 'Session ID, question number, and answer text are required.' });
    }

    const session = await db.get('SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?', [sessionId, req.user.id]);
    if (!session) {
      return res.status(404).json({ error: 'Interview session not found.' });
    }

    const exchange = await db.get(
      'SELECT * FROM interview_exchanges WHERE session_id = ? AND question_number = ?',
      [sessionId, questionNumber]
    );

    if (!exchange) {
      return res.status(404).json({ error: 'Question not found in this session.' });
    }

    let expectedPoints = [];
    try {
      expectedPoints = JSON.parse(exchange.ideal_answer_points || '[]');
    } catch {}

    // Evaluate answer with 3-dimensional scoring
    const evaluation = await evaluateInterviewAnswerM3(
      {
        questionText: exchange.question_text,
        category: exchange.category,
        expectedKeyPoints: expectedPoints
      },
      userAnswer,
      session.role_title,
      session.difficulty
    );

    // Update exchange row
    await db.run(
      `UPDATE interview_exchanges SET 
        user_answer = ?,
        score = ?,
        technical_score = ?,
        communication_score = ?,
        relevance_score = ?,
        feedback = ?,
        key_points = ?,
        missed_points = ?
       WHERE id = ?`,
      [
        userAnswer,
        evaluation.overallScore,
        evaluation.technicalScore,
        evaluation.communicationScore,
        evaluation.relevanceScore,
        evaluation.feedback,
        JSON.stringify(evaluation.strengthsHighlighted || []),
        JSON.stringify(evaluation.missedConcepts || []),
        exchange.id
      ]
    );

    // Fetch next question if available
    const nextQuestion = await db.get(
      'SELECT * FROM interview_exchanges WHERE session_id = ? AND question_number = ?',
      [sessionId, questionNumber + 1]
    );

    return res.json({
      evaluation: {
        score: evaluation.overallScore,
        technicalScore: evaluation.technicalScore,
        communicationScore: evaluation.communicationScore,
        relevanceScore: evaluation.relevanceScore,
        feedback: evaluation.feedback,
        keyPointsMentioned: evaluation.strengthsHighlighted,
        missedPoints: evaluation.missedConcepts,
        idealAnswerSummary: evaluation.idealModelAnswer
      },
      isFinished: !nextQuestion,
      nextQuestion: nextQuestion ? {
        questionNumber: nextQuestion.question_number,
        category: nextQuestion.category,
        questionText: nextQuestion.question_text
      } : null
    });
  } catch (err) {
    console.error('Submit answer error:', err);
    return res.status(500).json({ error: 'Failed to evaluate answer.' });
  }
});

// 4. Finalize and summarize interview session
router.post('/complete/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await db.get('SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?', [sessionId, req.user.id]);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const exchanges = await db.all(
      'SELECT * FROM interview_exchanges WHERE session_id = ? ORDER BY question_number ASC',
      [sessionId]
    );

    const answeredExchanges = exchanges.filter(e => typeof e.score === 'number' && e.score > 0);
    const count = answeredExchanges.length || 1;

    const avgOverall = Math.round(answeredExchanges.reduce((acc, e) => acc + (e.score || 0), 0) / count);
    const avgTech = Math.round(answeredExchanges.reduce((acc, e) => acc + (e.technical_score || 0), 0) / count);
    const avgComm = Math.round(answeredExchanges.reduce((acc, e) => acc + (e.communication_score || 0), 0) / count);
    const avgRel = Math.round(answeredExchanges.reduce((acc, e) => acc + (e.relevance_score || 0), 0) / count);

    const strengths = [
      avgTech >= 75 ? 'Solid understanding of core software paradigms and syntax' : 'Good foundational awareness of basic problem types',
      avgComm >= 75 ? 'Structured and articulate communication style' : 'Clear and concise responses',
      'Demonstrated structured thinking across technical and behavioral questions'
    ];

    const improvements = [
      avgTech < 80 ? 'Deepen practical knowledge with concrete implementation examples' : 'Explore advanced edge cases and time-complexity trade-offs',
      avgComm < 80 ? 'Structure technical answers with the STAR framework' : 'Practice explaining architectural decisions succinctly'
    ];

    const recommendations = [
      `Review key architectural patterns for ${session.role_title}`,
      'Practice dynamic coding and algorithmic complexity proofs',
      'Prepare 2-3 project deep-dives with metrics and architecture diagrams'
    ];

    const summary = `Overall interview performance score: ${avgOverall}/100. Demonstrated solid ${session.interview_type.toLowerCase()} competency with key strengths in ${avgTech >= avgComm ? 'technical fundamentals' : 'articulate reasoning'}.`;

    await db.run(
      `UPDATE interview_sessions SET
        overall_score = ?,
        technical_score = ?,
        communication_score = ?,
        relevance_score = ?,
        feedback_summary = ?,
        strengths_json = ?,
        improvements_json = ?,
        recommendations_json = ?,
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        avgOverall,
        avgTech,
        avgComm,
        avgRel,
        summary,
        JSON.stringify(strengths),
        JSON.stringify(improvements),
        JSON.stringify(recommendations),
        sessionId
      ]
    );

    return res.json({
      scorecard: {
        sessionId,
        roleTitle: session.role_title,
        overallScore: avgOverall,
        technicalScore: avgTech,
        communicationScore: avgComm,
        relevanceScore: avgRel,
        summary,
        strengths,
        improvements,
        recommendations,
        totalQuestionsAnswered: answeredExchanges.length
      }
    });
  } catch (err) {
    console.error('Complete interview error:', err);
    return res.status(500).json({ error: 'Failed to summarize interview session.' });
  }
});

// 5. Get user's interview history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const sessions = await db.all(
      'SELECT * FROM interview_sessions WHERE user_id = ? AND status = "completed" ORDER BY created_at DESC',
      [req.user.id]
    );

    const parsed = sessions.map(s => ({
      ...s,
      strengths_json: s.strengths_json ? JSON.parse(s.strengths_json) : [],
      improvements_json: s.improvements_json ? JSON.parse(s.improvements_json) : [],
      recommendations_json: s.recommendations_json ? JSON.parse(s.recommendations_json) : []
    }));

    return res.json({ sessions: parsed });
  } catch (err) {
    console.error('Get history error:', err);
    return res.status(500).json({ error: 'Failed to retrieve interview history.' });
  }
});

// 6. Get deep detail for a specific completed session
router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await db.get('SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?', [sessionId, req.user.id]);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const exchanges = await db.all(
      'SELECT * FROM interview_exchanges WHERE session_id = ? ORDER BY question_number ASC',
      [sessionId]
    );

    return res.json({
      session: {
        ...session,
        strengths_json: session.strengths_json ? JSON.parse(session.strengths_json) : [],
        improvements_json: session.improvements_json ? JSON.parse(session.improvements_json) : [],
        recommendations_json: session.recommendations_json ? JSON.parse(session.recommendations_json) : []
      },
      exchanges: exchanges.map(e => ({
        ...e,
        key_points: e.key_points ? JSON.parse(e.key_points) : [],
        missed_points: e.missed_points ? JSON.parse(e.missed_points) : [],
        ideal_answer_points: e.ideal_answer_points ? JSON.parse(e.ideal_answer_points) : []
      }))
    });
  } catch (err) {
    console.error('Get session detail error:', err);
    return res.status(500).json({ error: 'Failed to retrieve session details.' });
  }
});

export default router;
