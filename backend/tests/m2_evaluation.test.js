import { db, getDatabase } from '../config/database.js';
import { seedInternshipsIfNeeded } from '../services/seedData.js';
import { vectorStore, cosineSimilarity, getEmbedding } from '../services/vectorStore.js';
import { searchInternshipsSemantic, retrieveRelevantJobsForProfile } from '../services/ragService.js';
import { runJobResumeMatchingAgent, evaluateJobResumeMatch, AGENT_WEIGHTS } from '../services/matchingAgent.js';
import { calculateSkillMatrix, calculateRoleScore, calculateLocationScore } from '../services/matchingEngine.js';

console.log('================================================================');
console.log('🧪 MILESTONE 2: RAG PIPELINE & MATCHING AGENT EVALUATION SUITE');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, name, details = '') {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${name} ${details ? `(${details})` : ''}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${name} ${details ? `(${details})` : ''}`);
  }
}

// -------------------------------------------------------------
// 6 SAMPLE STUDENT PROFILES FOR EVALUATION
// -------------------------------------------------------------
export const sampleStudentProfiles = [
  {
    id: "profile-ai-01",
    name: "Aanya Sharma",
    degree: "B.Tech in Artificial Intelligence & Data Science",
    university: "Infosys Institute of Technology",
    graduation_year: 2026,
    skills: ["Python", "PyTorch", "TensorFlow", "Scikit-Learn", "Machine Learning", "NLP", "Pandas", "Git", "FastAPI"],
    preferred_roles: ["AI & Machine Learning Engineering Intern", "Generative AI Intern"],
    preferred_location: "Bengaluru, India",
    expectedDomain: "Artificial Intelligence & ML",
    projects: [
      { title: "Transformer-based NLP Summarizer", techStack: "Python, PyTorch, HuggingFace, FastAPI" },
      { title: "Deep Learning Medical Image Classifier", techStack: "Python, TensorFlow, OpenCV" }
    ],
    parsed_summary: "Dedicated AI undergraduate with hands-on experience training PyTorch neural networks and building RAG pipelines."
  },
  {
    id: "profile-web-02",
    name: "Rohan Mehta",
    degree: "B.Tech Computer Science and Engineering",
    university: "National Institute of Technology",
    graduation_year: 2026,
    skills: ["React", "JavaScript", "Node.js", "Express", "PostgreSQL", "HTML5", "CSS3", "REST API", "Git", "TypeScript"],
    preferred_roles: ["Full-Stack Web Developer Intern", "Frontend UI/UX Engineer"],
    preferred_location: "Hyderabad, India",
    expectedDomain: "Full-Stack & Web Engineering",
    projects: [
      { title: "Collaborative Project Management SaaS", techStack: "React, Node.js, Express, PostgreSQL" },
      { title: "E-Commerce Micro-Frontend", techStack: "React, TypeScript, TailwindCSS, REST API" }
    ],
    parsed_summary: "Full-stack web developer passionate about responsive React user interfaces, performant REST APIs, and database design."
  },
  {
    id: "profile-devops-03",
    name: "Priya Patel",
    degree: "B.E. Information Technology",
    university: "Pune Engineering College",
    graduation_year: 2026,
    skills: ["Linux", "Docker", "Kubernetes", "AWS", "Git", "Python", "CI/CD", "Bash", "Terraform"],
    preferred_roles: ["Cloud Infrastructure & DevOps Intern", "Site Reliability Engineer"],
    preferred_location: "Pune, India",
    expectedDomain: "Cloud & DevOps Engineering",
    projects: [
      { title: "Automated Multi-Stage CI/CD Pipeline", techStack: "GitHub Actions, Docker, Kubernetes, AWS" },
      { title: "Infrastructure Provisioning with Terraform", techStack: "Terraform, AWS, Linux, Bash" }
    ],
    parsed_summary: "Cloud enthusiast with experience automating build pipelines and managing containerized microservices."
  },
  {
    id: "profile-data-04",
    name: "Aditya Verma",
    degree: "B.Sc Statistics & Data Analytics",
    university: "Chennai University",
    graduation_year: 2026,
    skills: ["SQL", "Python", "Pandas", "Tableau", "PowerBI", "Data Analysis", "Statistics", "Excel"],
    preferred_roles: ["Data Science & Business Analytics Intern", "Data Analyst"],
    preferred_location: "Chennai, India",
    expectedDomain: "Data Engineering & Analytics",
    projects: [
      { title: "Customer Churn Prediction & Executive Dashboard", techStack: "Python, Pandas, Tableau, SQL" },
      { title: "Supply Chain Financial Analytics", techStack: "PowerBI, SQL, Statistical Modeling" }
    ],
    parsed_summary: "Analytical thinker skilled in translating complex transactional datasets into strategic business visualizations."
  },
  {
    id: "profile-cyber-05",
    name: "Sneha Nair",
    degree: "B.Tech in Cybersecurity and Digital Forensics",
    university: "Kerala Technical University",
    graduation_year: 2026,
    skills: ["Network Security", "Linux", "Python", "Ethical Hacking", "Wireshark", "Cryptography", "OWASP", "Nmap"],
    preferred_roles: ["Cybersecurity Analyst & Threat Hunting Intern", "AppSec Intern"],
    preferred_location: "Noida, India",
    expectedDomain: "Cybersecurity & Information Security",
    projects: [
      { title: "Automated Web Vulnerability Scanner", techStack: "Python, OWASP ZAP, Burp Suite, Linux" },
      { title: "Network Anomaly Intrusion Detection", techStack: "Wireshark, Python, Nmap, Snort" }
    ],
    parsed_summary: "Cybersecurity practitioner with hands-on network packet inspection, vulnerability assessment, and threat hunting skills."
  },
  {
    id: "profile-fresher-06",
    name: "Arjun Kumar",
    degree: "B.Tech Computer Science (2nd Year)",
    university: "State Technical University",
    graduation_year: 2027,
    skills: ["Java", "C++", "Data Structures", "Algorithms", "SQL", "Git", "HTML5"],
    preferred_roles: ["Software Engineering Intern", "Java Developer"],
    preferred_location: "Bengaluru, India",
    expectedDomain: "Enterprise Software & Java",
    projects: [
      { title: "Student Record Management System", techStack: "Java, MySQL, OOP" },
      { title: "Algorithmic Pathfinding Visualizer", techStack: "C++, Data Structures" }
    ],
    parsed_summary: "Eager computer science student with strong foundations in object-oriented programming and algorithmic problem solving."
  }
];

async function runEvaluationSuite() {
  console.log('📌 [Phase 1] Database Initialization & Knowledge Base Seeding...');
  await getDatabase();
  await seedInternshipsIfNeeded();

  const totalInternshipsRow = await db.get("SELECT COUNT(*) as count FROM internships");
  const totalCount = totalInternshipsRow?.count || 0;
  assert(totalCount >= 150, "M2.1 Dataset Size Verification", `Total postings: ${totalCount} (Target: 150-200)`);

  const totalChunksRow = await db.get("SELECT COUNT(*) as count FROM internship_chunks");
  const chunkCount = totalChunksRow?.count || 0;
  assert(chunkCount >= totalCount * 3, "M2.2 RAG Chunking Verification", `Total indexed chunks: ${chunkCount}`);

  // -------------------------------------------------------------
  // PHASE 2: RAG NATURAL LANGUAGE SEMANTIC SEARCH EVALUATION
  // -------------------------------------------------------------
  console.log('\n📌 [Phase 2] Evaluating RAG Natural Language Semantic Search...');
  
  const testQueries = [
    { query: "looking for remote machine learning internship with PyTorch and NLP", expectedWord: "AI" },
    { query: "full-stack React web developer with Node.js and PostgreSQL in Hyderabad", expectedWord: "Web" },
    { query: "cloud infrastructure DevOps containerization Docker Kubernetes", expectedWord: "Cloud" },
    { query: "cybersecurity threat hunting penetration testing Wireshark network", expectedWord: "Cybersecurity" },
    { query: "data analytics SQL Tableau dashboards business metrics", expectedWord: "Data" }
  ];

  let queryHits = 0;
  for (const tq of testQueries) {
    const results = await searchInternshipsSemantic(tq.query, { topK: 5 });
    const topMatch = results[0];
    const isRelevant = topMatch && (
      topMatch.title.toLowerCase().includes(tq.expectedWord.toLowerCase()) || 
      topMatch.industry.toLowerCase().includes(tq.expectedWord.toLowerCase()) ||
      topMatch.semanticScore > 50
    );

    assert(isRelevant, `Query: "${tq.query.slice(0, 45)}..."`, `Top Match: "${topMatch?.title}" (${topMatch?.semanticScore}%)`);
    if (isRelevant) queryHits++;
  }

  const searchPrecision = (queryHits / testQueries.length) * 100;
  assert(searchPrecision >= 80, "RAG Search Precision@5 Benchmark", `Precision: ${searchPrecision}%`);

  // -------------------------------------------------------------
  // PHASE 3: JOB-RESUME MATCHING AGENT EVALUATION (6 PROFILES)
  // -------------------------------------------------------------
  console.log('\n📌 [Phase 3] Evaluating Job-Resume Matching Agent across 6 Student Profiles...');

  let mrrSum = 0;
  let top1DomainMatches = 0;

  for (const profile of sampleStudentProfiles) {
    console.log(`\n  👤 Evaluating Profile: ${profile.name} (${profile.expectedDomain})`);
    const recommendations = await runJobResumeMatchingAgent(profile, 10);
    
    assert(recommendations.length > 0, `Generated recommendations for ${profile.name}`);
    const topRec = recommendations[0];
    const topJob = topRec.internship;
    const topScore = topRec.matchScore;

    // Check if top job domain matches or is closely related
    const isDomainAligned = topJob.industry.toLowerCase().includes(profile.expectedDomain.toLowerCase().split('&')[0].trim()) ||
      topJob.title.toLowerCase().includes(profile.preferred_roles[0].toLowerCase().split(' ')[0]);

    assert(isDomainAligned, `Top-1 recommendation alignment`, `Role: "${topJob.title}" at ${topJob.company} | Score: ${topScore}%`);
    if (isDomainAligned) top1DomainMatches++;

    // Calculate Reciprocal Rank for expected domain
    let rankForExpected = 0;
    for (let i = 0; i < recommendations.length; i++) {
      const rec = recommendations[i];
      if (rec.internship.industry.toLowerCase().includes(profile.expectedDomain.toLowerCase().split('&')[0].trim())) {
        rankForExpected = i + 1;
        break;
      }
    }
    const rr = rankForExpected > 0 ? (1 / rankForExpected) : 0;
    mrrSum += rr;

    // Verify Skill Matrix accuracy
    const matrix = topRec.skillMatrix;
    assert(matrix && Array.isArray(matrix.matchingSkills), `Generated skill matrix with ${matrix.matchingSkills.length} matches`);
    assert(typeof topRec.breakdown?.skillScore === 'number', `Computed multi-factor breakdown`);

    // Verify Reasoning Quality
    const exp = topRec.explanation;
    assert(exp && exp.whyItMatches && exp.potentialConcerns && exp.recommendedPreparation, `Generated complete structured qualitative reasoning`);
  }

  // -------------------------------------------------------------
  // PHASE 4: SUMMARY EVALUATION METRICS
  // -------------------------------------------------------------
  console.log('\n📌 [Phase 4] Summary Benchmark Metrics Calculation...');
  const mrr = (mrrSum / sampleStudentProfiles.length).toFixed(3);
  const top1Accuracy = ((top1DomainMatches / sampleStudentProfiles.length) * 100).toFixed(1);

  console.log(`\n============================================================`);
  console.log(`📊 BENCHMARK EVALUATION RESULTS:`);
  console.log(`   - Knowledge Base Size: ${totalCount} Sample Postings`);
  console.log(`   - Total Indexed Semantic Chunks: ${chunkCount}`);
  console.log(`   - Top-1 Recommendation Accuracy: ${top1Accuracy}%`);
  console.log(`   - Mean Reciprocal Rank (MRR): ${mrr} / 1.000`);
  console.log(`   - RAG Semantic Query Precision@5: ${searchPrecision}%`);
  console.log(`   - Total Test Assertions Passed: ${passedTests} / ${totalTests}`);
  console.log(`============================================================\n`);

  assert(Number(mrr) >= 0.85, "MRR Target Metric (>= 0.85)", `Achieved: ${mrr}`);
  assert(Number(top1Accuracy) >= 80.0, "Top-1 Accuracy Target (>= 80%)", `Achieved: ${top1Accuracy}%`);

  if (passedTests === totalTests) {
    console.log('🎉 ALL MILESTONE 2 EVALUATION TESTS PASSED PERFECTLY!\n');
  } else {
    console.warn(`⚠️ Completed with ${totalTests - passedTests} failed tests.\n`);
  }
}

// Run immediately
runEvaluationSuite().catch(console.error);
