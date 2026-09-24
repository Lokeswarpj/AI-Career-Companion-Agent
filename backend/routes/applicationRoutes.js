import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

export const APPLICATION_STAGES = [
  'Saved',
  'Planning to Apply',
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled',
  'Interview Completed',
  'Offer Received',
  'Rejected',
  'Withdrawn'
];

export const ACTIVE_STAGES = [
  'Saved',
  'Planning to Apply',
  'Applied',
  'Under Review',
  'Shortlisted',
  'Interview Scheduled'
];

// Helper to calculate days remaining until a deadline
function calculateDeadlineUrgency(deadlineStr) {
  if (!deadlineStr) return { daysRemaining: null, urgency: 'none', label: 'No Deadline Set' };
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadline = new Date(deadlineStr);
  deadline.setHours(0, 0, 0, 0);
  
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { daysRemaining: diffDays, urgency: 'overdue', label: `Overdue by ${Math.abs(diffDays)}d` };
  } else if (diffDays === 0) {
    return { daysRemaining: 0, urgency: 'critical_today', label: 'Deadline Today!' };
  } else if (diffDays <= 3) {
    return { daysRemaining: diffDays, urgency: 'critical_3days', label: `Due in ${diffDays}d` };
  } else if (diffDays <= 7) {
    return { daysRemaining: diffDays, urgency: 'upcoming_7days', label: `Due in ${diffDays}d` };
  } else if (diffDays <= 14) {
    return { daysRemaining: diffDays, urgency: 'upcoming_14days', label: `Due in ${diffDays}d` };
  }
  return { daysRemaining: diffDays, urgency: 'normal', label: `Due in ${diffDays}d` };
}

// 1. Get Application Tracking Overview & Stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const applications = await db.all(
      'SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const stageBreakdown = {};
    APPLICATION_STAGES.forEach(s => { stageBreakdown[s] = 0; });

    let activeCount = 0;
    let interviewsScheduled = 0;
    let offersReceived = 0;
    let rejectedCount = 0;
    let withdrawnCount = 0;
    let appliedOrBeyondCount = 0;

    const deadlineReminders = [];
    const interviewReminders = [];

    const now = new Date();

    for (const app of applications) {
      if (stageBreakdown[app.status] !== undefined) {
        stageBreakdown[app.status]++;
      }

      if (ACTIVE_STAGES.includes(app.status)) {
        activeCount++;
      }

      if (app.status === 'Interview Scheduled' || (app.interview_date && new Date(app.interview_date) >= now)) {
        interviewsScheduled++;
      }

      if (app.status === 'Offer Received') {
        offersReceived++;
      }

      if (app.status === 'Rejected') {
        rejectedCount++;
      }

      if (app.status === 'Withdrawn') {
        withdrawnCount++;
      }

      if (!['Saved', 'Planning to Apply', 'Withdrawn'].includes(app.status)) {
        appliedOrBeyondCount++;
      }

      // Check upcoming deadline reminders for non-completed applications
      if (app.deadline && !['Offer Received', 'Rejected', 'Withdrawn'].includes(app.status)) {
        const urgencyInfo = calculateDeadlineUrgency(app.deadline);
        if (['overdue', 'critical_today', 'critical_3days', 'upcoming_7days', 'upcoming_14days'].includes(urgencyInfo.urgency)) {
          deadlineReminders.push({
            id: app.id,
            company_name: app.company_name,
            role_title: app.role_title,
            status: app.status,
            priority: app.priority,
            deadline: app.deadline,
            ...urgencyInfo
          });
        }
      }

      // Check upcoming scheduled interviews
      if (app.interview_date) {
        const interviewTime = new Date(app.interview_date);
        if (interviewTime >= now) {
          const diffHours = Math.round((interviewTime - now) / (1000 * 60 * 60));
          interviewReminders.push({
            id: app.id,
            company_name: app.company_name,
            role_title: app.role_title,
            interview_date: app.interview_date,
            interview_type: app.interview_type || 'Virtual',
            hoursRemaining: diffHours,
            label: diffHours <= 24 ? `Interview in ${diffHours} hours` : `Interview in ${Math.ceil(diffHours / 24)} days`
          });
        }
      }
    }

    // Sort deadline reminders by closest deadline first
    deadlineReminders.sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));
    interviewReminders.sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date));

    const totalApplications = applications.length;
    const interviewRate = appliedOrBeyondCount > 0 ? Math.round((interviewsScheduled / appliedOrBeyondCount) * 100) : 0;
    const offerRate = appliedOrBeyondCount > 0 ? Math.round((offersReceived / appliedOrBeyondCount) * 100) : 0;

    return res.json({
      totalApplications,
      activeApplications: activeCount,
      completedApplications: totalApplications - activeCount,
      interviewsScheduled,
      offersReceived,
      rejectedApplications: rejectedCount,
      withdrawnApplications: withdrawnCount,
      interviewRate,
      offerRate,
      stageBreakdown,
      deadlineReminders,
      interviewReminders
    });
  } catch (err) {
    console.error('Error fetching application stats:', err);
    return res.status(500).json({ error: 'Failed to calculate application statistics.' });
  }
});

// 2. Get All Applications (with filtering, search, and sorting)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, priority, search, sortBy = 'updated_at', order = 'desc' } = req.query;

    let query = `
      SELECT a.*, 
             t.tailored_resume_json, 
             t.cover_letter,
             t.ats_score
      FROM applications a
      LEFT JOIN tailored_applications t ON a.tailored_application_id = t.id
      WHERE a.user_id = ?
    `;
    const params = [userId];

    if (status && status !== 'All') {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (priority && priority !== 'All') {
      query += ' AND a.priority = ?';
      params.push(priority);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ' AND (a.company_name LIKE ? OR a.role_title LIKE ? OR a.location LIKE ? OR a.notes LIKE ?)';
      params.push(term, term, term, term);
    }

    // Sanitize sort column
    const validSortCols = {
      'deadline': 'a.deadline',
      'application_date': 'a.application_date',
      'created_at': 'a.created_at',
      'updated_at': 'a.updated_at',
      'company_name': 'a.company_name',
      'priority': 'a.priority',
      'status': 'a.status'
    };
    const sortCol = validSortCols[sortBy] || 'a.updated_at';
    const sortOrder = (order || '').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortCol} ${sortOrder}`;

    const applications = await db.all(query, params);

    // Enrich each application with deadline urgency metadata
    const enriched = applications.map(app => {
      const deadlineInfo = calculateDeadlineUrgency(app.deadline);
      return {
        ...app,
        hasTailoredMaterials: !!(app.tailored_resume_json || app.cover_letter),
        atsScore: app.ats_score || null,
        deadlineInfo
      };
    });

    return res.json({ applications: enriched, count: enriched.length });
  } catch (err) {
    console.error('Error fetching applications:', err);
    return res.status(500).json({ error: 'Failed to retrieve applications.' });
  }
});

// 3. Get Single Application Detail
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const application = await db.get(
      `SELECT a.*, 
              t.tailored_resume_json, 
              t.cover_letter,
              t.ats_score,
              i.description as internship_full_desc,
              i.responsibilities_json,
              i.required_skills_json,
              i.stipend as internship_stipend
       FROM applications a
       LEFT JOIN tailored_applications t ON a.tailored_application_id = t.id
       LEFT JOIN internships i ON a.internship_id = i.id
       WHERE a.id = ? AND a.user_id = ?`,
      [id, req.user.id]
    );

    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const deadlineInfo = calculateDeadlineUrgency(application.deadline);

    return res.json({
      application: {
        ...application,
        deadlineInfo
      }
    });
  } catch (err) {
    console.error('Error retrieving application:', err);
    return res.status(500).json({ error: 'Failed to fetch application details.' });
  }
});

// 4. Create a New Application
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      company_name,
      role_title,
      internship_id,
      job_description,
      location,
      stipend,
      status = 'Saved',
      application_date,
      deadline,
      interview_date,
      interview_status = 'None',
      interview_type = 'Virtual',
      priority = 'Medium',
      notes,
      tailored_application_id,
      applied_url,
      contact_person
    } = req.body;

    if (!company_name || !role_title) {
      return res.status(400).json({ error: 'Company name and role title are required.' });
    }

    const id = `app_${Date.now()}_${uuidv4().slice(0, 8)}`;
    const appDate = application_date || (status === 'Applied' ? new Date().toISOString().split('T')[0] : null);

    await db.run(
      `INSERT INTO applications (
        id, user_id, internship_id, company_name, role_title, job_description,
        location, stipend, status, application_date, deadline, interview_date,
        interview_status, interview_type, priority, notes, tailored_application_id,
        applied_url, contact_person
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, userId, internship_id || null, company_name, role_title, job_description || '',
        location || 'Remote / Hybrid', stipend || 'Competitive', status, appDate, deadline || null,
        interview_date || null, interview_status, interview_type, priority, notes || '',
        tailored_application_id || null, applied_url || '', contact_person || ''
      ]
    );

    const created = await db.get('SELECT * FROM applications WHERE id = ?', [id]);
    return res.status(201).json({
      message: 'Application created successfully.',
      application: {
        ...created,
        deadlineInfo: calculateDeadlineUrgency(created.deadline)
      }
    });
  } catch (err) {
    console.error('Error creating application:', err);
    return res.status(500).json({ error: 'Failed to create application.' });
  }
});

// 5. Quick 1-Click Import from Internship Posting
router.post('/import-internship/:internshipId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { internshipId } = req.params;
    const { status = 'Saved', priority = 'Medium' } = req.body || {};

    const internship = await db.get('SELECT * FROM internships WHERE id = ?', [internshipId]);
    if (!internship) {
      return res.status(404).json({ error: 'Internship not found.' });
    }

    // Check if user already tracked this internship
    const existing = await db.get(
      'SELECT * FROM applications WHERE user_id = ? AND internship_id = ?',
      [userId, internshipId]
    );

    if (existing) {
      return res.json({
        message: 'This internship is already in your application tracker.',
        application: {
          ...existing,
          deadlineInfo: calculateDeadlineUrgency(existing.deadline)
        },
        alreadyTracked: true
      });
    }

    const id = `app_${Date.now()}_${uuidv4().slice(0, 8)}`;
    const appDate = status === 'Applied' ? new Date().toISOString().split('T')[0] : null;

    await db.run(
      `INSERT INTO applications (
        id, user_id, internship_id, company_name, role_title, job_description,
        location, stipend, status, application_date, deadline, priority, applied_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, userId, internship.id, internship.company, internship.title, internship.description || '',
        internship.location || 'Remote', internship.stipend || 'Competitive', status, appDate,
        internship.deadline || null, priority, internship.apply_url || ''
      ]
    );

    const created = await db.get('SELECT * FROM applications WHERE id = ?', [id]);
    return res.status(201).json({
      message: `Added ${internship.title} at ${internship.company} to application tracker.`,
      application: {
        ...created,
        deadlineInfo: calculateDeadlineUrgency(created.deadline)
      },
      alreadyTracked: false
    });
  } catch (err) {
    console.error('Error importing internship to tracker:', err);
    return res.status(500).json({ error: 'Failed to import internship into application tracker.' });
  }
});

// 6. Quick Status Transition (e.g., Kanban drag/drop or 1-click status stepper)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !APPLICATION_STAGES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status stage. Allowed stages: ${APPLICATION_STAGES.join(', ')}`
      });
    }

    const current = await db.get(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!current) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    // If changing to 'Applied' and no application date set, auto-stamp today
    let appDate = current.application_date;
    if (status === 'Applied' && !appDate) {
      appDate = new Date().toISOString().split('T')[0];
    }

    await db.run(
      `UPDATE applications 
       SET status = ?, application_date = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND user_id = ?`,
      [status, appDate, id, req.user.id]
    );

    const updated = await db.get('SELECT * FROM applications WHERE id = ?', [id]);
    return res.json({
      message: `Status updated to ${status}.`,
      application: {
        ...updated,
        deadlineInfo: calculateDeadlineUrgency(updated.deadline)
      }
    });
  } catch (err) {
    console.error('Error updating application status:', err);
    return res.status(500).json({ error: 'Failed to update application status.' });
  }
});

// 7. Full Application Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      company_name,
      role_title,
      job_description,
      location,
      stipend,
      status,
      application_date,
      deadline,
      interview_date,
      interview_status,
      interview_type,
      priority,
      notes,
      tailored_application_id,
      applied_url,
      contact_person
    } = req.body;

    const current = await db.get(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!current) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    await db.run(
      `UPDATE applications SET
        company_name = ?,
        role_title = ?,
        job_description = ?,
        location = ?,
        stipend = ?,
        status = ?,
        application_date = ?,
        deadline = ?,
        interview_date = ?,
        interview_status = ?,
        interview_type = ?,
        priority = ?,
        notes = ?,
        tailored_application_id = ?,
        applied_url = ?,
        contact_person = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        company_name || current.company_name,
        role_title || current.role_title,
        job_description !== undefined ? job_description : current.job_description,
        location !== undefined ? location : current.location,
        stipend !== undefined ? stipend : current.stipend,
        status || current.status,
        application_date !== undefined ? application_date : current.application_date,
        deadline !== undefined ? deadline : current.deadline,
        interview_date !== undefined ? interview_date : current.interview_date,
        interview_status !== undefined ? interview_status : current.interview_status,
        interview_type !== undefined ? interview_type : current.interview_type,
        priority || current.priority,
        notes !== undefined ? notes : current.notes,
        tailored_application_id !== undefined ? tailored_application_id : current.tailored_application_id,
        applied_url !== undefined ? applied_url : current.applied_url,
        contact_person !== undefined ? contact_person : current.contact_person,
        id,
        req.user.id
      ]
    );

    const updated = await db.get('SELECT * FROM applications WHERE id = ?', [id]);
    return res.json({
      message: 'Application updated successfully.',
      application: {
        ...updated,
        deadlineInfo: calculateDeadlineUrgency(updated.deadline)
      }
    });
  } catch (err) {
    console.error('Error updating application:', err);
    return res.status(500).json({ error: 'Failed to update application.' });
  }
});

// 8. Delete Application
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const current = await db.get(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!current) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    await db.run('DELETE FROM applications WHERE id = ? AND user_id = ?', [id, req.user.id]);
    return res.json({ message: 'Application deleted from tracker successfully.' });
  } catch (err) {
    console.error('Error deleting application:', err);
    return res.status(500).json({ error: 'Failed to delete application.' });
  }
});

export default router;
