import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { searchInternshipsSemantic } from '../services/ragService.js';
import { vectorStore } from '../services/vectorStore.js';

const router = express.Router();

// Helper to safely parse JSON field
function safeParseJson(val, fallback = []) {
  if (!val) return fallback;
  if (Array.isArray(val)) return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

// 1. Natural Language RAG Semantic Search
router.get('/rag/search', async (req, res) => {
  try {
    const { query, limit = 15, remote = 'All', industry = 'All' } = req.query;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'Search query string is required for semantic RAG search.' });
    }

    const results = await searchInternshipsSemantic(query.trim(), {
      topK: parseInt(limit, 10) || 15,
      remoteType: remote,
      industry: industry
    });

    return res.json({
      query,
      count: results.length,
      totalKnowledgeBaseChunks: vectorStore.getChunkCount(),
      results
    });
  } catch (err) {
    console.error('RAG semantic search error:', err);
    return res.status(500).json({ error: 'Failed to perform semantic RAG search.' });
  }
});

// 2. Knowledge Base Dataset Statistics
router.get('/stats', async (req, res) => {
  try {
    const totalRow = await db.get('SELECT COUNT(*) as total FROM internships');
    const remoteRows = await db.all('SELECT remote_type, COUNT(*) as count FROM internships GROUP BY remote_type');
    const industryRows = await db.all('SELECT industry, COUNT(*) as count FROM internships GROUP BY industry ORDER BY count DESC');
    const sourceRows = await db.all('SELECT source, COUNT(*) as count FROM internships GROUP BY source');

    const chunkCount = vectorStore.getChunkCount();

    return res.json({
      totalInternships: totalRow?.total || 0,
      totalIndexedChunks: chunkCount,
      remoteDistribution: remoteRows,
      industryDistribution: industryRows,
      sourceDistribution: sourceRows
    });
  } catch (err) {
    console.error('Internship stats error:', err);
    return res.status(500).json({ error: 'Failed to retrieve dataset statistics.' });
  }
});

// 3. List internships with search and multi-filtering
router.get('/', async (req, res) => {
  try {
    const { search, remote, industry, source, limit = 60, page = 1 } = req.query;

    let query = 'SELECT * FROM internships WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (title LIKE ? OR company LIKE ? OR description LIKE ? OR required_skills_json LIKE ? OR preferred_skills_json LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    if (remote && remote !== 'All') {
      query += ' AND remote_type = ?';
      params.push(remote);
    }

    if (industry && industry !== 'All') {
      query += ' AND industry = ?';
      params.push(industry);
    }

    if (source && source !== 'All') {
      query += ' AND source = ?';
      params.push(source);
    }

    query += ' ORDER BY posted_date DESC, title ASC';

    const allRows = await db.all(query, params);
    
    // Parse JSON fields
    const internships = allRows.map(row => ({
      ...row,
      required_skills_json: safeParseJson(row.required_skills_json),
      preferred_skills_json: safeParseJson(row.preferred_skills_json),
      responsibilities_json: safeParseJson(row.responsibilities_json)
    }));

    return res.json({
      count: internships.length,
      internships
    });
  } catch (err) {
    console.error('List internships error:', err);
    return res.status(500).json({ error: 'Failed to retrieve internships.' });
  }
});

// 4. Get user saved / tracked internships
router.get('/saved/all', authenticateToken, async (req, res) => {
  try {
    const rows = await db.all(
      `SELECT s.id as saved_id, s.status, s.notes, s.updated_at, i.* 
       FROM saved_internships s
       JOIN internships i ON s.internship_id = i.id
       WHERE s.user_id = ?
       ORDER BY s.updated_at DESC`,
      [req.user.id]
    );

    const saved = rows.map(r => ({
      savedId: r.saved_id,
      status: r.status,
      notes: r.notes,
      updatedAt: r.updated_at,
      internship: {
        id: r.id,
        title: r.title,
        company: r.company,
        location: r.location,
        remote_type: r.remote_type,
        description: r.description,
        required_skills_json: safeParseJson(r.required_skills_json),
        preferred_skills_json: safeParseJson(r.preferred_skills_json),
        responsibilities_json: safeParseJson(r.responsibilities_json),
        preferred_qualifications: r.preferred_qualifications,
        experience_requirements: r.experience_requirements,
        education_requirements: r.education_requirements,
        duration: r.duration,
        stipend: r.stipend,
        apply_url: r.apply_url,
        source: r.source,
        deadline: r.deadline,
        industry: r.industry
      }
    }));

    return res.json({ saved });
  } catch (err) {
    console.error('Get saved internships error:', err);
    return res.status(500).json({ error: 'Failed to retrieve saved internships.' });
  }
});

// 5. Save / Bookmark or update status of an internship
router.post('/saved/:id', authenticateToken, async (req, res) => {
  try {
    const internshipId = req.params.id;
    const { status = 'saved', notes = '' } = req.body;

    const existing = await db.get(
      'SELECT id FROM saved_internships WHERE user_id = ? AND internship_id = ?',
      [req.user.id, internshipId]
    );

    if (existing) {
      await db.run(
        'UPDATE saved_internships SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, notes, existing.id]
      );
      return res.json({ message: 'Application status updated!', status });
    } else {
      const savedId = uuidv4();
      await db.run(
        'INSERT INTO saved_internships (id, user_id, internship_id, status, notes) VALUES (?, ?, ?, ?, ?)',
        [savedId, req.user.id, internshipId, status, notes]
      );
      return res.status(201).json({ message: 'Internship saved to your tracker!', status });
    }
  } catch (err) {
    console.error('Save internship error:', err);
    return res.status(500).json({ error: 'Failed to save internship.' });
  }
});

// 6. Delete saved internship
router.delete('/saved/:id', authenticateToken, async (req, res) => {
  try {
    await db.run(
      'DELETE FROM saved_internships WHERE user_id = ? AND (internship_id = ? OR id = ?)',
      [req.user.id, req.params.id, req.params.id]
    );
    return res.json({ message: 'Removed from saved internships.' });
  } catch (err) {
    console.error('Delete saved internship error:', err);
    return res.status(500).json({ error: 'Failed to remove saved internship.' });
  }
});

// 7. Get single internship by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await db.get('SELECT * FROM internships WHERE id = ?', [req.params.id]);
    if (!item) {
      return res.status(404).json({ error: 'Internship not found.' });
    }

    return res.json({
      internship: {
        ...item,
        required_skills_json: safeParseJson(item.required_skills_json),
        preferred_skills_json: safeParseJson(item.preferred_skills_json),
        responsibilities_json: safeParseJson(item.responsibilities_json)
      }
    });
  } catch (err) {
    console.error('Get internship error:', err);
    return res.status(500).json({ error: 'Failed to retrieve internship.' });
  }
});

export default router;
