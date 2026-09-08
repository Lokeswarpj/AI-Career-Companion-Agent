import { calculateSkillMatrix, calculateRoleScore, calculateLocationScore, MATCH_WEIGHTS } from '../services/matchingEngine.js';
import { generateToken } from '../middleware/auth.js';

console.log('🧪 Starting Automated Backend & Algorithm Unit Tests...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
  }
}

// 1. Test Deterministic Skill Matrix
console.log('--- Testing Matching Engine Skill Matrix ---');
const userSkills = ['React', 'Node.js', 'Python', 'SQL', 'Git'];
const requiredSkills = ['React', 'Node.js', 'PostgreSQL', 'Docker', 'System Design'];

const matrix = calculateSkillMatrix(userSkills, requiredSkills);
assert(matrix.matchingSkills.length >= 2, 'Detects exact matches (React, Node.js)');
assert(matrix.missingSkills.some(m => m.skill === 'Docker'), 'Identifies missing Docker requirement with priority');
assert(matrix.skillScore > 0 && matrix.skillScore <= 100, `Computes valid skill score: ${matrix.skillScore}%`);

// 2. Test Role Alignment Scoring
console.log('\n--- Testing Role Alignment Scoring ---');
const userRoles = ['Full-Stack Web Developer', 'Frontend Engineer'];
const score1 = calculateRoleScore(userRoles, 'Full-Stack Web Developer Intern', 'Software Engineering');
const score2 = calculateRoleScore(userRoles, 'Frontend Engineer Intern', 'Technology');
const score3 = calculateRoleScore(userRoles, 'Cybersecurity Analyst', 'Information Security');

assert(score1 === 100, 'Direct title match scores 100');
assert(score2 === 100, 'Exact title match scores 100');
assert(score3 < 80, 'Unrelated role scores lower compatibility');

// 3. Test Location / Work Mode Compatibility
console.log('\n--- Testing Location & Work Mode Compatibility ---');
assert(calculateLocationScore('Bengaluru', 'Bengaluru, India', 'Hybrid') === 100, 'Matching location scores 100');
assert(calculateLocationScore('Pune', 'Hyderabad', 'Remote') === 100, 'Remote roles score 100 regardless of location');
assert(calculateLocationScore('Delhi', 'Chennai', 'On-site') === 60, 'Mismatched on-site location is discounted');

// 4. Test Match Weights Consistency
console.log('\n--- Testing Mathematical Match Weight Invariant ---');
const totalWeight = MATCH_WEIGHTS.skills + MATCH_WEIGHTS.role + MATCH_WEIGHTS.location + MATCH_WEIGHTS.education;
assert(Math.abs(totalWeight - 1.0) < 0.0001, `Weights sum to exactly 1.0 (Sum: ${totalWeight})`);

// 5. Test JWT Token Generation
console.log('\n--- Testing Authentication Security ---');
const dummyUser = { id: 'test-user-123', email: 'test@example.com', full_name: 'Test Student' };
const token = generateToken(dummyUser);
assert(typeof token === 'string' && token.split('.').length === 3, 'Issues valid 3-part JWT header.payload.signature structure');

// 6. Test Milestone 1.4: Resume Parsing & Structured Extraction
console.log('\n--- Testing M1.4 Resume Parsing & Structured Skill Extraction ---');
import { analyzeResumeWithGemini, generateCoverLetterWithGemini, evaluateInterviewAnswer, generateCareerAssistantResponse } from '../services/geminiService.js';
import { extractResumeText } from '../services/resumeParser.js';

const sampleResumeText = `
Lokesh Reddy
Email: lokesh@example.com | Phone: +91 9876543210
Education: B.Tech Computer Science and Engineering, 2026

Technical Skills:
Programming: Python, JavaScript, Java, C++
Web Development: React, Node.js, Express, HTML5, CSS3, REST APIs
Databases: PostgreSQL, MongoDB, SQLite
DevOps & Cloud: Docker, AWS, Git, GitHub Actions

Projects:
1. AI Career Companion Agent: Built with React, Express, Gemini API, SQLite. Implemented deterministic matching algorithm and mock interview speech recognition.
2. Cloud Microservices Dashboard: Containerized with Docker, deployed on AWS ECS with CI/CD GitHub Actions.

Experience:
Web Developer Intern at TechCorp (May 2025 - July 2025): Developed responsive frontend components in React and optimized backend SQL queries.
`;

const resumeAnalysis = await analyzeResumeWithGemini(sampleResumeText);
assert(typeof resumeAnalysis.summary === 'string' && resumeAnalysis.summary.length > 20, 'Generates professional summary');
assert(Array.isArray(resumeAnalysis.skills?.programming) && resumeAnalysis.skills.programming.length > 0, 'Extracts programming skills');
assert(Array.isArray(resumeAnalysis.skills?.web) && resumeAnalysis.skills.web.length > 0, 'Extracts web skills');
assert(Array.isArray(resumeAnalysis.strengths) && resumeAnalysis.strengths.length > 0, 'Identifies candidate strengths');
assert(Array.isArray(resumeAnalysis.weaknesses) && resumeAnalysis.weaknesses.length > 0, 'Identifies candidate weaknesses/gaps');
assert(Array.isArray(resumeAnalysis.recommendedSkills) && resumeAnalysis.recommendedSkills.length > 0, 'Provides recommended skills roadmap');

// 7. Test M1.2 Cover Letter Agent
console.log('\n--- Testing M1.2 Cover Letter Agent ---');
const sampleProfile = {
  full_name: 'Lokesh Reddy',
  degree: 'B.Tech Computer Science',
  university: 'Infosys Institute of Technology',
  graduation_year: 2026,
  technical_skills: ['React', 'Node.js', 'Python', 'Docker'],
  preferred_roles: ['Full-Stack Developer Intern']
};

const sampleInternship = {
  title: 'Full Stack Engineering Intern',
  company: 'Infosys Springboard',
  location: 'Bengaluru, India',
  work_mode: 'Hybrid',
  required_skills_json: JSON.stringify(['React', 'Node.js', 'SQL', 'Docker']),
  description: 'Looking for an enthusiastic full-stack engineering intern to build AI-driven applications.'
};

const coverLetterResult = await generateCoverLetterWithGemini(sampleProfile, sampleInternship);
assert(typeof coverLetterResult.coverLetter === 'string' && coverLetterResult.coverLetter.includes('Infosys Springboard'), 'Generates tailored cover letter mentioning company');
assert(Array.isArray(coverLetterResult.keyHighlights) && coverLetterResult.keyHighlights.length > 0, 'Includes key application highlights');

// 8. Test M1.2 AI Mock Interview Agent
console.log('\n--- Testing M1.2 Interview Evaluation Agent ---');
const evalResult = await evaluateInterviewAnswer(
  'What is the difference between SQL and NoSQL databases?',
  'SQL databases are relational, structured, and use schemas with ACID guarantees like PostgreSQL. NoSQL databases are non-relational, schema-less, and scale horizontally like MongoDB.',
  'Backend Engineer Intern',
  'Intermediate'
);
assert(typeof evalResult.score === 'number' && evalResult.score >= 0 && evalResult.score <= 100, 'Evaluates response with numeric score');
assert(typeof evalResult.feedback === 'string' && evalResult.feedback.length > 10, 'Provides constructive feedback');

// 9. Test M1.2 Career Assistant Agent (RAG)
console.log('\n--- Testing M1.2 Career Assistant Agent ---');
const assistantReply = await generateCareerAssistantResponse(
  'How can I improve my resume for cloud roles?',
  sampleProfile
);
// 10. Test Email OTP Verification Engine
console.log('\n--- Testing Email OTP Verification Engine ---');
import { generateNumericOTP, storeRegistrationOtp, verifyRegistrationOtp, getResendStatus, clearAllOtpsForTesting } from '../services/otpService.js';
import { sendOtpEmail } from '../services/emailService.js';

clearAllOtpsForTesting();

// Test OTP format
const testOtp = generateNumericOTP(6);
assert(/^\d{6}$/.test(testOtp), 'Generates valid 6-digit numeric OTP format');

// Test OTP store & retrieval
const testEmail = 'student.verify@example.com';
const storeRes = storeRegistrationOtp(testEmail, 'Student Tester', 'hashed_pass_123', '654321');
assert(storeRes.success === true, 'Successfully registers pending OTP in store');

// Test Resend cooldown protection
const cooldownRes = storeRegistrationOtp(testEmail, 'Student Tester', 'hashed_pass_123');
assert(cooldownRes.success === false && cooldownRes.cooldownRemaining > 0, 'Enforces 60-second rate-limiting cooldown on repeat requests');

// Test Invalid OTP rejection
const invalidVerify = verifyRegistrationOtp(testEmail, '000000');
assert(invalidVerify.success === false && invalidVerify.error.includes('Invalid verification code'), 'Rejects incorrect OTP code with remaining attempt warning');

// Test Valid OTP verification
const validVerify = verifyRegistrationOtp(testEmail, '654321');
assert(validVerify.success === true && validVerify.data.fullName === 'Student Tester', 'Successfully validates correct OTP and returns user data');

// Test Re-use prevention (OTP consumed)
const reuseVerify = verifyRegistrationOtp(testEmail, '654321');
assert(reuseVerify.success === false, 'Prevents single-use OTP replay / reuse attack');

// Test Email Service dispatch (with fallback logger)
const emailSendRes = await sendOtpEmail('student.verify@example.com', 'Student Tester', '123456');
assert(emailSendRes.success === true, 'Email service safely dispatches verification message with fallback');

console.log(`\n==============================================`);
console.log(`Test Results: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log(`==============================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
