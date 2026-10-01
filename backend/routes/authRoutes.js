import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Robust standard email format validation (RFC 5322 compliant subset)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
}

// Password Validation Rules: 8+ chars, letters, numbers, special char
export function isStrongPassword(password) {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  return hasLetter && hasNumber && hasSpecial;
}

// 10-digit mobile number validation
export function isValidMobileNumber(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return /^\d{10}$/.test(phone.trim());
}

/**
 * Direct Legacy Register (Maintained for backward compatibility and automated test suite)
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, phone, university, degree, graduation_year, location, technical_skills } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Please provide email, password, and full name.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email ID.' });
    }

    // Validate password strength (min 8 chars, letter, number, special char)
    if (!isStrongPassword(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long and contain letters, numbers, and a special character.' 
      });
    }

    if (phone && !isValidMobileNumber(phone)) {
      return res.status(400).json({ error: 'Mobile number must be exactly 10 digits.' });
    }

    const existing = await db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const userId = uuidv4();
    const profileId = uuidv4();

    // Insert user
    await db.run(
      'INSERT INTO users (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)',
      [userId, normalizedEmail, password_hash, full_name.trim()]
    );

    const parsedSkills = Array.isArray(technical_skills) 
      ? technical_skills 
      : (typeof technical_skills === 'string' && technical_skills.trim() 
          ? technical_skills.split(',').map(s => s.trim()).filter(Boolean) 
          : []);

    // Initialize profile for new student with provided details
    await db.run(
      `INSERT INTO profiles 
       (id, user_id, phone, university, degree, graduation_year, location, preferred_roles, technical_skills, soft_skills, experience_json, projects_json, certifications_json, preferred_industries) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profileId,
        userId,
        phone ? phone.trim() : null,
        university ? university.trim() : null,
        degree ? degree.trim() : null,
        graduation_year ? parseInt(graduation_year) : null,
        location ? location.trim() : null,
        JSON.stringify([]),
        JSON.stringify(parsedSkills),
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify([])
      ]
    );

    const user = { id: userId, email: normalizedEmail, full_name: full_name.trim() };
    const token = generateToken(user);

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error during registration.' });
  }
});

/**
 * Login
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email ID.' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [normalizedEmail]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userData = { id: user.id, email: user.email, full_name: user.full_name };
    const token = generateToken(userData);

    return res.json({
      message: 'Logged in successfully!',
      token,
      user: userData
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error during login.' });
  }
});

/**
 * Google OAuth2 Login & Sign-Up
 * POST /api/auth/google
 */
router.post('/google', async (req, res) => {
  try {
    const { credential, userInfo, phone, university, degree, graduation_year, location, technical_skills } = req.body;

    let email = '';
    let fullName = '';
    let avatarUrl = '';

    // 1. Verify Google ID token credential if provided
    if (credential) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (verifyRes.ok) {
          const payload = await verifyRes.json();
          email = payload.email?.toLowerCase()?.trim();
          fullName = payload.name || payload.given_name || 'Student';
          avatarUrl = payload.picture || '';
        }
      } catch (verifyErr) {
        console.warn('[Google Auth] Google TokenInfo verification notice:', verifyErr.message);
      }
    }

    // 2. Fallback to userInfo if provided
    if (!email && userInfo?.email) {
      email = userInfo.email.toLowerCase().trim();
      fullName = userInfo.name || userInfo.full_name || 'Student';
      avatarUrl = userInfo.picture || userInfo.avatar_url || '';
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'Could not verify a valid Google email address. Please try again.' });
    }

    if (phone && !isValidMobileNumber(phone)) {
      return res.status(400).json({ error: 'Mobile number must be exactly 10 digits.' });
    }

    // 3. Check if user already exists
    let user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      // Auto-register new student via Google Sign-In
      const userId = uuidv4();
      const profileId = uuidv4();
      const randomSecret = uuidv4();
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(`google_oauth_${randomSecret}`, salt);

      await db.run(
        'INSERT INTO users (id, email, password_hash, full_name, avatar_url) VALUES (?, ?, ?, ?, ?)',
        [userId, email, password_hash, fullName, avatarUrl]
      );

      const parsedSkills = Array.isArray(technical_skills) 
        ? technical_skills 
        : (typeof technical_skills === 'string' && technical_skills.trim() 
            ? technical_skills.split(',').map(s => s.trim()).filter(Boolean) 
            : []);

      // Initialize profile for the new student
      await db.run(
        `INSERT INTO profiles 
         (id, user_id, phone, university, degree, graduation_year, location, preferred_roles, technical_skills, soft_skills, experience_json, projects_json, certifications_json, preferred_industries) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          profileId,
          userId,
          phone ? phone.trim() : null,
          university ? university.trim() : null,
          degree ? degree.trim() : null,
          graduation_year ? parseInt(graduation_year) : null,
          location ? location.trim() : null,
          JSON.stringify([]),
          JSON.stringify(parsedSkills),
          JSON.stringify([]),
          JSON.stringify([]),
          JSON.stringify([]),
          JSON.stringify([])
        ]
      );

      user = { id: userId, email, full_name: fullName, avatar_url: avatarUrl };
    } else {
      if (avatarUrl && !user.avatar_url) {
        await db.run('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, user.id]);
      }
    }

    const userData = { id: user.id, email: user.email, full_name: user.full_name, avatar_url: user.avatar_url || avatarUrl };
    const token = generateToken(userData);

    return res.json({
      message: 'Google authentication successful!',
      token,
      user: userData
    });
  } catch (err) {
    console.error('Google login error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error during Google login.' });
  }
});

/**
 * Instant Demo Login (Creates/Resets a rich demo student profile for instant demonstration)
 * POST /api/auth/demo-login
 */
router.post('/demo-login', async (req, res) => {
  try {
    const demoEmail = 'student.demo@infosys.com';
    let user = await db.get('SELECT * FROM users WHERE email = ?', [demoEmail]);

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('DemoPass@123', salt);
      const userId = uuidv4();
      const profileId = uuidv4();

      await db.run(
        'INSERT INTO users (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)',
        [userId, demoEmail, password_hash, 'Aarav Sharma']
      );

      await db.run(
        `INSERT INTO profiles 
         (id, user_id, university, degree, graduation_year, location, preferred_location, preferred_roles, technical_skills, soft_skills, experience_json, projects_json, certifications_json, preferred_industries) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          profileId,
          userId,
          'National Institute of Technology',
          'B.Tech in Computer Science and Engineering',
          2026,
          'Bengaluru, India',
          'Bengaluru / Remote',
          JSON.stringify(['Full-Stack Web Developer', 'AI & Machine Learning Engineer', 'Cloud Software Engineer']),
          JSON.stringify(['React', 'Node.js', 'Python', 'JavaScript', 'SQL', 'FastAPI', 'Git', 'HTML5/CSS3']),
          JSON.stringify(['Problem Solving', 'Team Collaboration', 'Agile Methodology']),
          JSON.stringify([
            {
              role: 'Web Development Lead',
              organization: 'University Coding Club',
              duration: 'Aug 2025 - Present',
              description: 'Led a team of 5 student developers building the campus event management portal with React and Express.'
            }
          ]),
          JSON.stringify([
            {
              title: 'AI Smart Document Classifier',
              technologies: 'Python, PyTorch, FastAPI, React',
              description: 'Trained a multi-class document classifier achieving 92% accuracy with automated REST API serving.'
            },
            {
              title: 'Campus Marketplace Hub',
              technologies: 'React, Node.js, SQLite, TailwindCSS',
              description: 'Peer-to-peer student marketplace for textbooks and lab kits with full auth and real-time listings.'
            }
          ]),
          JSON.stringify([
            {
              name: 'Infosys Springboard AI & Cloud Foundations',
              issuer: 'Infosys Springboard',
              year: '2025'
            }
          ]),
          JSON.stringify(['Technology', 'Artificial Intelligence', 'FinTech'])
        ]
      );

      user = await db.get('SELECT * FROM users WHERE email = ?', [demoEmail]);
    }

    const userData = { id: user.id, email: user.email, full_name: user.full_name };
    const token = generateToken(userData);

    return res.json({
      message: 'Logged in as Demo Student!',
      token,
      user: userData
    });
  } catch (err) {
    console.error('Demo login error:', err);
    return res.status(500).json({ error: 'Internal server error during demo login.' });
  }
});

/**
 * Current user profile check
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.get('SELECT id, email, full_name, avatar_url, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
