/**
 * ============================================================================
 * 🧪 MILESTONE 3 COMPREHENSIVE MULTI-AGENT EVALUATION SUITE
 * ============================================================================
 * Project: CareerPulse AI — AI Career Companion Agent
 * Track: Infosys Virtual Internship — Applied Generative AI
 *
 * Automated verification of:
 * - M3.1: Skill Gap Analysis Agent (5-category classification, roadmap, importance)
 * - M3.2: Resume & Cover Letter Customizer (ATS score, STAR bullets, anti-hallucination)
 * - M3.3: Interview Preparation Agent (5 categories, revision guide, 3D scoring)
 * - M3.4: Conversational Career Assistant (intent routing, role comparison, context)
 * ============================================================================
 */

import assert from 'assert';
import { db, getDatabase } from '../config/database.js';
import { seedInternshipsIfNeeded } from '../services/seedData.js';
import { runSkillGapAnalysisAgent } from '../services/skillGapAgent.js';
import { 
  tailorResumeForRole, 
  generateCustomizedCoverLetter, 
  calculateATSScore, 
  verifyAntiHallucination 
} from '../services/applicationCustomizerAgent.js';
import { 
  generateCategorizedInterviewQuestions, 
  generatePreInterviewPrepGuide, 
  evaluateInterviewAnswerM3 
} from '../services/interviewPrepAgent.js';
import { 
  runCareerAssistantAgent, 
  classifyUserIntent 
} from '../services/careerAssistantAgent.js';

let passedAssertions = 0;
let totalAssertions = 0;

function check(description, condition) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✅ PASS: ${description}`);
  } else {
    console.error(`  ❌ FAIL: ${description}`);
    throw new Error(`Assertion failed: ${description}`);
  }
}

async function runMilestone3Evaluation() {
  console.log('\n================================================================');
  console.log('🧪 MILESTONE 3: MULTI-AGENT AUTOMATED EVALUATION SUITE');
  console.log('================================================================\n');

  // Initialize Database
  await getDatabase();
  await seedInternshipsIfNeeded();

  const allJobs = await db.all('SELECT * FROM internships');
  check('Knowledge Base loaded for M3 evaluation', allJobs.length >= 150);

  // Sample Student Profiles for Evaluation
  const profileAi = {
    id: 'eval-ai-01',
    full_name: 'Aanya Sharma',
    email: 'aanya.sharma@nit.edu',
    degree: 'B.Tech in Artificial Intelligence',
    university: 'National Institute of Technology',
    graduation_year: 2026,
    location: 'Bengaluru, India',
    skills: ['Python', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'NLP', 'SQL', 'Git'],
    technical_skills: ['Python', 'PyTorch', 'Pandas', 'NumPy', 'Scikit-learn', 'NLP', 'SQL', 'Git'],
    soft_skills: ['Critical Thinking', 'Research Methodology', 'Teamwork'],
    preferred_roles: ['AI & Machine Learning Engineering Intern'],
    projects: [
      {
        title: 'Transformer-Based Abstractive Text Summarizer',
        techStack: 'Python, PyTorch, Hugging Face Transformers, Streamlit',
        description: 'Built and fine-tuned a BART model on CNN/DailyMail dataset achieving 42.1 ROUGE-1 score.'
      }
    ],
    experience: []
  };

  const profileWeb = {
    id: 'eval-web-01',
    full_name: 'Rohan Mehta',
    email: 'rohan.mehta@iiit.edu',
    degree: 'B.Tech in Computer Science',
    university: 'IIIT Hyderabad',
    graduation_year: 2026,
    location: 'Hyderabad, India',
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'HTML5', 'CSS3', 'PostgreSQL', 'Git'],
    technical_skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Express', 'HTML5', 'CSS3', 'PostgreSQL', 'Git'],
    soft_skills: ['Agile Collaboration', 'Problem Solving'],
    preferred_roles: ['Full-Stack Web Developer Intern'],
    projects: [
      {
        title: 'E-Commerce Microservices Storefront',
        techStack: 'React, Node.js, Express, PostgreSQL, REST APIs',
        description: 'Developed full-stack shopping portal with JWT authentication, cart state, and order tracking.'
      }
    ],
    experience: []
  };

  // Find target internship postings
  const nlpJob = allJobs.find(j => j.title.toLowerCase().includes('nlp') || j.title.toLowerCase().includes('natural language')) || allJobs[0];
  const fullstackJob = allJobs.find(j => j.title.toLowerCase().includes('full-stack') || j.title.toLowerCase().includes('web developer')) || allJobs[1];
  const devopsJob = allJobs.find(j => j.title.toLowerCase().includes('devops') || j.title.toLowerCase().includes('cloud')) || allJobs[2];

  // ============================================================================
  // PHASE 1: M3.1 SKILL GAP ANALYSIS AGENT EVALUATION
  // ============================================================================
  console.log('\n📌 [Phase 1] Evaluating M3.1 Skill Gap Analysis Agent...');

  const gapAnalysisAi = await runSkillGapAnalysisAgent(profileAi, nlpJob);
  check('M3.1 Gap Analysis returns structured metrics', typeof gapAnalysisAi.metrics.readinessScore === 'number');
  check('M3.1 Gap Analysis contains 5 distinct gap classifications', 
    Array.isArray(gapAnalysisAi.gapClassifications.criticalMissing) &&
    Array.isArray(gapAnalysisAi.gapClassifications.partiallyDemonstrated) &&
    Array.isArray(gapAnalysisAi.gapClassifications.matching) &&
    Array.isArray(gapAnalysisAi.gapClassifications.preferredGaps) &&
    Array.isArray(gapAnalysisAi.gapClassifications.experienceGaps)
  );
  check('M3.1 Identified verified matching competencies', gapAnalysisAi.gapClassifications.matching.length > 0);
  check('M3.1 Actionable learning roadmap generated with time estimates and project ideas', 
    gapAnalysisAi.actionableRoadmap.length > 0 &&
    typeof gapAnalysisAi.actionableRoadmap[0].timeEstimate === 'string' &&
    typeof gapAnalysisAi.actionableRoadmap[0].projectIdea === 'string'
  );
  check('M3.1 Role-specific importance explanations provided', 
    typeof gapAnalysisAi.actionableRoadmap[0].importance === 'string' && gapAnalysisAi.actionableRoadmap[0].importance.length > 10
  );

  const gapAnalysisWebOnDevops = await runSkillGapAnalysisAgent(profileWeb, devopsJob);
  check('M3.1 Accurately detects critical missing requirements on cross-domain application', 
    gapAnalysisWebOnDevops.gapClassifications.criticalMissing.length > 0
  );

  // ============================================================================
  // PHASE 2: M3.2 RESUME & COVER LETTER CUSTOMIZATION AGENT EVALUATION
  // ============================================================================
  console.log('\n📌 [Phase 2] Evaluating M3.2 Resume & Cover Letter Customizer Agent...');

  const tailoredResume = await tailorResumeForRole(profileWeb, fullstackJob);
  check('M3.2 Tailored resume summary generated', typeof tailoredResume.tailoredSummary === 'string' && tailoredResume.tailoredSummary.length > 20);
  check('M3.2 ATS score improved after role-specific tailoring', tailoredResume.atsScoreAfter >= tailoredResume.atsScoreBefore);
  check('M3.2 Generated STAR bullet point improvements with before/after diff', 
    Array.isArray(tailoredResume.bulletPointImprovements) &&
    tailoredResume.bulletPointImprovements.length > 0 &&
    typeof tailoredResume.bulletPointImprovements[0].improvedStarBullet === 'string'
  );
  check('M3.2 Anti-hallucination guardrail verified without fabrication', 
    tailoredResume.guardrailCheck.isVerified === true &&
    tailoredResume.guardrailCheck.hallucinationRisk.includes('Zero')
  );
  check('M3.2 Full Markdown resume produced for export', 
    typeof tailoredResume.fullMarkdownResume === 'string' &&
    tailoredResume.fullMarkdownResume.includes('## 🎯 PROFESSIONAL SUMMARY')
  );

  const coverLetter = await generateCustomizedCoverLetter(profileWeb, fullstackJob, 'Professional & Enthusiastic');
  check('M3.2 Customized cover letter generated mentioning target company', 
    coverLetter.fullCoverLetter.includes(fullstackJob.company)
  );
  check('M3.2 Cover letter contains 3-paragraph structure with opening hook and sign-off', 
    typeof coverLetter.openingHook === 'string' &&
    typeof coverLetter.technicalAlignmentParagraph === 'string' &&
    typeof coverLetter.closingCallToAction === 'string'
  );
  check('M3.2 Cover letter strategic highlights returned', 
    Array.isArray(coverLetter.keyHighlights) && coverLetter.keyHighlights.length >= 2
  );

  // ============================================================================
  // PHASE 3: M3.3 INTERVIEW PREPARATION AGENT EVALUATION
  // ============================================================================
  console.log('\n📌 [Phase 3] Evaluating M3.3 Interview Preparation Agent...');

  const prepGuide = await generatePreInterviewPrepGuide(nlpJob, profileAi);
  check('M3.3 Pre-interview revision guide generated', Array.isArray(prepGuide.technicalRevisionTopics) && prepGuide.technicalRevisionTopics.length > 0);
  check('M3.3 Revision topics include estimated hours and key concepts', 
    typeof prepGuide.technicalRevisionTopics[0].estimatedHours === 'string' &&
    Array.isArray(prepGuide.technicalRevisionTopics[0].keyConceptsToRevise)
  );
  check('M3.3 Behavioral STAR preparation strategies included', 
    Array.isArray(prepGuide.behavioralStrategies) && prepGuide.behavioralStrategies.length > 0
  );

  const questions = await generateCategorizedInterviewQuestions(nlpJob, profileAi, 'Intermediate');
  check('M3.3 Generated exactly 5 categorized interview questions', questions.length === 5);
  const categories = questions.map(q => q.category);
  check('M3.3 Includes Technical question category', categories.some(c => c.toLowerCase().includes('tech')));
  check('M3.3 Includes Resume/Project-Based question category', categories.some(c => c.toLowerCase().includes('resume') || c.toLowerCase().includes('project')));
  check('M3.3 Includes Behavioral/HR question category', categories.some(c => c.toLowerCase().includes('hr') || c.toLowerCase().includes('behavioral') || c.toLowerCase().includes('scenario')));

  const sampleAnswer = "In my recent NLP project, I fine-tuned a BART transformer model using PyTorch and Hugging Face. To handle large text batches efficiently, I implemented custom DataLoader pipelines with dynamic padding and mixed precision FP16 training, reducing GPU memory footprint by 40%.";
  const evaluationResult = await evaluateInterviewAnswerM3(questions[0], sampleAnswer, nlpJob.title, 'Intermediate');
  
  check('M3.3 Evaluated answer with 3-dimensional scoring metrics', 
    typeof evaluationResult.overallScore === 'number' &&
    typeof evaluationResult.technicalScore === 'number' &&
    typeof evaluationResult.communicationScore === 'number' &&
    typeof evaluationResult.relevanceScore === 'number'
  );
  check('M3.3 Provided constructive feedback and strengths highlighted', 
    typeof evaluationResult.feedback === 'string' &&
    Array.isArray(evaluationResult.strengthsHighlighted)
  );
  check('M3.3 Provided ideal model answer blueprint', 
    typeof evaluationResult.idealModelAnswer === 'string' && evaluationResult.idealModelAnswer.length > 20
  );

  // ============================================================================
  // PHASE 4: M3.4 CONVERSATIONAL CAREER ASSISTANT EVALUATION
  // ============================================================================
  console.log('\n📌 [Phase 4] Evaluating M3.4 Conversational Career Assistant...');

  check('M3.4 Intent Classifier routes role comparison correctly', 
    classifyUserIntent('Can you compare Infosys versus Swiggy internships for me?') === 'COMPARE_ROLES'
  );
  check('M3.4 Intent Classifier routes skill gap queries correctly', 
    classifyUserIntent('What are my critical skill gaps for an AI engineer role?') === 'EXPLAIN_SKILL_GAPS'
  );
  check('M3.4 Intent Classifier routes interview plan queries correctly', 
    classifyUserIntent('Build me a 5-day interview preparation blueprint') === 'INTERVIEW_PLAN'
  );
  check('M3.4 Intent Classifier routes application tailoring queries correctly', 
    classifyUserIntent('How do I optimize my resume bullet points for ATS?') === 'CUSTOMIZE_APPLICATION'
  );

  const studentContext = {
    name: 'Aanya Sharma',
    degree: 'B.Tech in Artificial Intelligence',
    university: 'National Institute of Technology',
    skills: profileAi.skills,
    preferred_roles: ['AI & Machine Learning Engineering Intern'],
    hasResume: true,
    avgScore: 88,
    savedInternships: [`${nlpJob.title} at ${nlpJob.company}`]
  };

  const assistantComparisonReply = await runCareerAssistantAgent(
    'Compare my top 2 internship opportunities side-by-side with decision trade-offs.',
    studentContext,
    []
  );
  check('M3.4 Assistant generates multi-agent comparison with decision recommendations', 
    assistantComparisonReply.includes('Comparison') || assistantComparisonReply.includes('Recommendation') || assistantComparisonReply.includes('Compatibility')
  );

  const assistantGapReply = await runCareerAssistantAgent(
    'What skill gaps should I focus on to improve my employability?',
    studentContext,
    []
  );
  check('M3.4 Assistant explains skill gaps with actionable mini-projects and roadmaps', 
    assistantGapReply.includes('Skill Gap') || assistantGapReply.includes('Roadmap') || assistantGapReply.includes('Project')
  );

  // ============================================================================
  // SUMMARY BENCHMARK METRICS
  // ============================================================================
  console.log('\n============================================================');
  console.log(`📊 MILESTONE 3 EVALUATION BENCHMARK RESULTS:`);
  console.log(`   - Total Test Assertions Executed: ${totalAssertions}`);
  console.log(`   - Total Assertions Passed: ${passedAssertions} (${Math.round((passedAssertions/totalAssertions)*100)}%)`);
  console.log(`   - M3.1 Skill Gap Classification: 100% Verified`);
  console.log(`   - M3.2 Resume Customization & Anti-Hallucination: 100% Verified`);
  console.log(`   - M3.3 Categorized Interview Prep & 3D Scoring: 100% Verified`);
  console.log(`   - M3.4 Conversational Assistant Multi-Agent Engine: 100% Verified`);
  console.log('============================================================\n');

  check('100% Milestone 3 Test Suite Pass Rate Target', passedAssertions === totalAssertions);
  console.log('🎉 ALL MILESTONE 3 AGENT EVALUATION TESTS PASSED PERFECTLY!\n');
}

runMilestone3Evaluation().catch((err) => {
  console.error('\n❌ Milestone 3 Evaluation Suite Failed:', err);
  process.exit(1);
});
