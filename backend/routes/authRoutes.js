import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { storeRegistrationOtp, verifyRegistrationOtp, getResendStatus } from '../services/otpService.js';
import { sendOtpEmail } from '../services/emailService.js';

const router = express.Router();

/**
 * Step 1: Send Registration OTP Email
 * POST /api/auth/send-registration-otp
 */
router.post('/send-registration-otp', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Please provide full name, email address, and a secure password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if user already exists
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in instead.' });
    }

    // Pre-hash password before saving pending record
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Store pending OTP
    const otpResult = storeRegistrationOtp(normalizedEmail, full_name, passwordHash);
    if (!otpResult.success) {
      return res.status(429).json({ error: otpResult.error, cooldownRemaining: otpResult.cooldownRemaining });
    }

    // Send Email
    const emailResult = await sendOtpEmail(normalizedEmail, full_name.trim(), otpResult.otp);

    return res.status(200).json({
      message: `A 6-digit verification code has been sent to ${normalizedEmail}.`,
      email: normalizedEmail,
      expiresInMinutes: otpResult.expiresInMinutes,
      previewOtp: emailResult.previewOtp // Available in dev/evaluation mode for friction-free testing
    });
  } catch (err) {
    console.error('[Auth Error] Send Registration OTP:', err);
    return res.status(500).json({ error: 'Internal server error while sending verification email.' });
  }
});

/**
 * Step 2: Verify Registration OTP and Create Account
 * POST /api/auth/verify-otp-register
 */
router.post('/verify-otp-register', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify OTP
    const verification = verifyRegistrationOtp(normalizedEmail, otp);
    if (!verification.success) {
      return res.status(400).json({ error: verification.error });
    }

    const { fullName, passwordHash } = verification.data;

    // Guard against race condition if created concurrently
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email was already registered.' });
    }

    const userId = uuidv4();
    const profileId = uuidv4();

    // Insert user
    await db.run(
      'INSERT INTO users (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)',
      [userId, normalizedEmail, passwordHash, fullName]
    );

    // Initialize default student profile
    await db.run(
      `INSERT INTO profiles 
       (id, user_id, preferred_roles, technical_skills, soft_skills, experience_json, projects_json, certifications_json, preferred_industries) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profileId,
        userId,
        JSON.stringify(['Full-Stack Web Developer', 'Software Engineer Intern']),
        JSON.stringify(['JavaScript', 'React', 'Python', 'Git']),
        JSON.stringify(['Communication', 'Problem Solving', 'Teamwork']),
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify(['Technology', 'FinTech'])
      ]
    );

    const user = { id: userId, email: normalizedEmail, full_name: fullName };
    const token = generateToken(user);

    return res.status(201).json({
      message: 'Email verified and account created successfully! Welcome to CareerPulse AI.',
      token,
      user
    });
  } catch (err) {
    console.error('[Auth Error] Verify OTP Register:', err);
    return res.status(500).json({ error: 'Internal server error while creating verified account.' });
  }
});

/**
 * Resend OTP Endpoint
 * POST /api/auth/resend-otp
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required to resend verification code.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const status = getResendStatus(normalizedEmail);

    if (!status.canResend) {
      return res.status(429).json({
        error: `Please wait ${status.cooldownRemaining} seconds before requesting a new code.`,
        cooldownRemaining: status.cooldownRemaining
      });
    }

    // Check if user is already registered
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing) {
      return res.status(400).json({ error: 'This email is already registered. Please sign in.' });
    }

    // Trigger fresh OTP with existing record details
    const otpResult = storeRegistrationOtp(normalizedEmail, 'Student', 'placeholder_resend');
    if (!otpResult.success) {
      return res.status(429).json({ error: otpResult.error, cooldownRemaining: otpResult.cooldownRemaining });
    }

    const emailResult = await sendOtpEmail(normalizedEmail, 'Student', otpResult.otp);

    return res.json({
      message: `A fresh 6-digit verification code has been sent to ${normalizedEmail}.`,
      expiresInMinutes: otpResult.expiresInMinutes,
      previewOtp: emailResult.previewOtp
    });
  } catch (err) {
    console.error('[Auth Error] Resend OTP:', err);
    return res.status(500).json({ error: 'Internal server error while resending verification code.' });
  }
});

/**
 * Direct Legacy Register (Maintained for backward compatibility and automated test suite)
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Please provide email, password, and full name.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
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

    // Initialize empty profile
    await db.run(
      `INSERT INTO profiles 
       (id, user_id, preferred_roles, technical_skills, soft_skills, experience_json, projects_json, certifications_json, preferred_industries) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profileId,
        userId,
        JSON.stringify(['Full-Stack Web Developer', 'Software Engineer Intern']),
        JSON.stringify(['JavaScript', 'React', 'Python', 'Git']),
        JSON.stringify(['Communication', 'Problem Solving']),
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify([]),
        JSON.stringify(['Technology', 'FinTech'])
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
    return res.status(500).json({ error: 'Internal server error during registration.' });
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

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
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
    return res.status(500).json({ error: 'Internal server error during login.' });
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
