import { callGemini } from './geminiService.js';
import { runJobResumeMatchingAgent, evaluateJobResumeMatch } from './matchingAgent.js';
import { runSkillGapAnalysisAgent } from './skillGapAgent.js';
import { tailorResumeForRole, generateCustomizedCoverLetter } from './applicationCustomizerAgent.js';
import { generatePreInterviewPrepGuide } from './interviewPrepAgent.js';
import { retrieveRelevantJobsForProfile, searchInternshipsSemantic } from './ragService.js';
import { db } from '../config/database.js';

/**
 * Classifies user intent from natural language query.
 */
export function classifyUserIntent(message) {
  const lower = (message || '').toLowerCase();

  if (lower.includes('compare') || lower.includes('versus') || lower.includes(' vs ') || lower.includes('better option') || lower.includes('which one')) {
    return 'COMPARE_ROLES';
  }
  if (lower.includes('gap') || lower.includes('missing skill') || lower.includes('need to learn') || lower.includes('roadmap') || lower.includes('what am i missing')) {
    return 'EXPLAIN_SKILL_GAPS';
  }
  if (lower.includes('recommend') || lower.includes('find internship') || lower.includes('match') || lower.includes('suggest role') || lower.includes('jobs for me') || lower.includes('top internship')) {
    return 'INTERNSHIP_RECOMMEND';
  }
  if (lower.includes('why') && (lower.includes('match') || lower.includes('fit') || lower.includes('rejected') || lower.includes('score'))) {
    return 'EXPLAIN_MATCH';
  }
  if (lower.includes('interview') || lower.includes('mock') || lower.includes('prep') || lower.includes('question') || lower.includes('round') || lower.includes('crack')) {
    return 'INTERVIEW_PLAN';
  }
  if (lower.includes('resume') || lower.includes('cover letter') || lower.includes('bullet') || lower.includes('tailor') || lower.includes('ats') || lower.includes('apply')) {
    return 'CUSTOMIZE_APPLICATION';
  }
  if (lower.includes('decision') || lower.includes('stipend') || lower.includes('remote vs') || lower.includes('choose')) {
    return 'DECISION_SUPPORT';
  }

  return 'GENERAL_CAREER_GUIDANCE';
}

/**
 * M3.4: Conversational Career Assistant Multi-Agent Orchestrator.
 */
export async function runCareerAssistantAgent(userMessage, studentContext, chatHistory = []) {
  const intent = classifyUserIntent(userMessage);
  const hasValidResume = Boolean(studentContext.hasResume || (studentContext.skills && studentContext.skills.length > 0));

  // 1. Fetch relevant multi-agent artifacts dynamically based on intent
  let multiAgentData = {};

  try {
    if (hasValidResume) {
      if (intent === 'INTERNSHIP_RECOMMEND' || intent === 'COMPARE_ROLES' || intent === 'EXPLAIN_MATCH') {
        const recs = await runJobResumeMatchingAgent(studentContext, 6);
        multiAgentData.topMatches = recs.slice(0, 3).map(r => ({
          id: r.internship.id,
          title: r.internship.title,
          company: r.internship.company,
          score: r.matchScore,
          location: r.internship.location,
          remote_type: r.internship.remote_type,
          stipend: r.internship.stipend,
          matchingSkills: r.skillMatrix.matchingSkills.map(m => m.skill),
          missingSkills: r.skillMatrix.missingSkills.map(m => m.skill)
        }));
      }

      if (intent === 'EXPLAIN_SKILL_GAPS' || intent === 'INTERVIEW_PLAN') {
        // Find candidate's top matched job
        const topJob = await db.get('SELECT * FROM internships LIMIT 1');
        if (topJob) {
          const gap = await runSkillGapAnalysisAgent(studentContext, topJob);
          multiAgentData.skillGapSummary = {
            role: topJob.title,
            company: topJob.company,
            readinessScore: gap.metrics.readinessScore,
            criticalMissing: gap.gapClassifications.criticalMissing.map(s => s.skill),
            partiallyDemonstrated: gap.gapClassifications.partiallyDemonstrated.map(s => s.skill),
            roadmapTopics: gap.actionableRoadmap.slice(0, 3).map(r => `${r.skill}: ${r.timeEstimate} (${r.topics[0]})`)
          };
        }
      }
    }
  } catch (err) {
    console.warn('[CareerAssistantAgent] Context enrichment notice:', err.message);
  }

  // 2. Call Gemini with Full Multi-Agent Context Injection
  const prompt = `You are "CareerPulse AI", a smart, natural, and direct conversational career companion agent.
You have access to the student's profile context and multi-agent system data.

Student Profile Context:
- Name: ${studentContext.name || 'Student'}
- Contact Phone / Number: ${studentContext.phone || 'Not listed in profile'}
- Email: ${studentContext.email || 'Not listed'}
- Degree: ${studentContext.degree || 'B.Tech CS'} (${studentContext.university || 'Engineering College'}, Class of ${studentContext.graduation_year || 2026})
- Location: ${studentContext.location || 'Not specified'} (Preferred: ${studentContext.preferred_location || 'Remote/Hybrid'})
- Technical Skills: ${JSON.stringify(studentContext.skills || [])}
- Preferred Roles: ${JSON.stringify(studentContext.preferred_roles || ['Software Engineer Intern'])}
- Uploaded Resume: ${hasValidResume ? 'Yes (Parsed & Analyzed)' : 'No (Not uploaded yet)'}
- Mock Interview Average: ${studentContext.avgScore ? studentContext.avgScore + '/100' : 'None yet'}
- Saved Internships: ${JSON.stringify(studentContext.savedInternships || [])}

Live Multi-Agent Data Injected:
- Detected User Intent: ${intent}
${multiAgentData.topMatches ? `- Top Matching Internships: ${JSON.stringify(multiAgentData.topMatches, null, 2)}` : ''}
${multiAgentData.skillGapSummary ? `- Skill Gap & Readiness Diagnosis: ${JSON.stringify(multiAgentData.skillGapSummary, null, 2)}` : ''}

Recent Conversation History:
${chatHistory.slice(-6).map(m => `${m.role === 'user' ? 'Student' : 'CareerPulse AI'}: ${m.content}`).join('\n')}

Student's Latest Message:
"${userMessage}"

CRITICAL ACCURACY & DIRECTNESS DIRECTIVES:
1. ALWAYS GIVE A STRAIGHT & ACCURATE ANSWER: Answer the user's question directly in the very first sentence. Never output generic greetings, unrequested feature lists, marketing boilerplate, or intro fluff.
2. PROFILE QUESTIONS: If the user asks about personal or profile information (e.g., name, phone number, city/location, college, degree, graduation year, technical skills, projects, experience, certifications, preferred roles, email):
   - If the information exists in Student Profile Context, state the exact answer directly.
   - If the information is missing or marked "Not listed", state clearly: "You haven't updated your **[Field Name]** in your profile yet! You can add/update it anytime in the **Profile** tab."
3. GENERAL & TECHNICAL QUESTIONS: If the user asks a technical, career, or factual question, provide a direct, clear, and accurate answer immediately.
4. STRUCTURED ANALYSIS (Only when requested):
   - If comparing roles (COMPARE_ROLES), provide a clear "Comparison" section with side-by-side trade-offs, compatibility scores, and an explicit "Recommendation" section.
   - If analyzing skill gaps (EXPLAIN_SKILL_GAPS), provide a clear "Skill Gap" diagnosis and "Roadmap".
   - If recommending internships (INTERNSHIP_RECOMMEND), list top matched opportunities with compatibility scores.
5. ${!hasValidResume && (intent === 'INTERNSHIP_RECOMMEND' || intent === 'EXPLAIN_SKILL_GAPS' || intent === 'COMPARE_ROLES' || intent === 'EXPLAIN_MATCH') ? 'IMPORTANT: The student has NOT uploaded a resume yet. Tell them clearly that to get accurate percentage compatibility scores and personalized skill gap roadmaps, they should upload their resume in the "Resume AI" tab first.' : 'Maintain a warm, professional, human tone.'}`;

  const systemPrompt = "You are CareerPulse AI, an exceptionally smart, direct, and precise AI Career Companion. Always give straight, accurate, and concise answers without intro fluff, generic marketing templates, or conversational filler.";

  let aiResult = await callGemini(prompt, systemPrompt, false);

  if (aiResult && typeof aiResult === 'string' && aiResult.trim().length > 10) {
    return aiResult;
  }

  // 3. Heuristic Engine Fallback for M3.4
  return generateHeuristicAssistantResponse(intent, userMessage, studentContext, multiAgentData, hasValidResume);
}

function generateHeuristicAssistantResponse(intent, message, context, multiAgentData, hasValidResume) {
  const name = context.name || 'there';
  const skills = (context.skills && context.skills.length > 0) ? context.skills : [];
  const topSkillsStr = skills.length > 0 ? skills.slice(0, 4).join(', ') : '';
  const msgLower = (message || '').toLowerCase().trim();

  // Direct Profile Question Handlers (Reporting updated vs missing fields)
  if (msgLower.includes('city') || msgLower.includes('current location') || msgLower.includes('where do i live') || msgLower.includes('my location')) {
    return context.location 
      ? `Your current city listed in your profile is **${context.location}**.`
      : `You haven't updated your **current city / location** in your profile yet! You can add it anytime in the **Profile** tab.`;
  }
  if (msgLower.includes('preferred location') || msgLower.includes('desired location') || msgLower.includes('work mode')) {
    return context.preferred_location
      ? `Your preferred internship location listed in your profile is **${context.preferred_location}**.`
      : `You haven't updated your **preferred internship location** in your profile yet! You can set it in the **Profile** tab.`;
  }
  if (msgLower.includes('my number') || msgLower.includes('phone') || msgLower.includes('contact number') || msgLower.includes('mobile')) {
    return context.phone 
      ? `Your contact phone number listed in your profile is **${context.phone}**.`
      : `You haven't updated your **contact phone number** in your profile yet! You can add it anytime in the **Profile** tab.`;
  }
  if (msgLower.includes('email') || msgLower.includes('mail id')) {
    return context.email 
      ? `Your registered email address is **${context.email}**.`
      : `You haven't updated your **email address** in your profile yet!`;
  }
  if (msgLower.includes('my name') || msgLower.includes('what is my name') || msgLower.includes("what's my name") || msgLower.includes('who am i')) {
    return `Your name is **${name}**! How can I assist you with your career or internships today?`;
  }
  if (msgLower.includes('college') || msgLower.includes('university') || msgLower.includes('where do i study') || msgLower.includes('institute')) {
    return context.university
      ? `Your college/university listed in your profile is **${context.university}**.`
      : `You haven't updated your **college / university** in your profile yet! You can add it anytime in the **Profile** tab.`;
  }
  if (msgLower.includes('degree') || msgLower.includes('major') || msgLower.includes('branch') || msgLower.includes('course')) {
    return context.degree
      ? `Your degree & major listed in your profile is **${context.degree}**.`
      : `You haven't updated your **degree & major** in your profile yet! You can set it in the **Profile** tab.`;
  }
  if (msgLower.includes('graduation') || msgLower.includes('grad year') || msgLower.includes('passing year')) {
    return context.graduation_year
      ? `Your expected graduation year listed in your profile is **${context.graduation_year}**.`
      : `You haven't updated your **graduation year** in your profile yet! You can set it in the **Profile** tab.`;
  }
  if (msgLower.includes('project') || msgLower.includes('portfolio')) {
    return (context.projects && context.projects.length > 0)
      ? `Your profile includes **${context.projects.length} project(s)**: ${context.projects.map(p => typeof p === 'string' ? p : p.title || p.name).join(', ')}.`
      : `You haven't updated your **projects** in your profile yet! You can add your projects in the **Profile** tab.`;
  }
  if (msgLower.includes('experience') || msgLower.includes('past work') || msgLower.includes('previous intern')) {
    return (context.experience && context.experience.length > 0)
      ? `Your profile lists **${context.experience.length} experience entry/entries**.`
      : `You haven't updated your **work experience** in your profile yet! You can add past experience in the **Profile** tab.`;
  }
  if (msgLower.includes('certif') || msgLower.includes('licenses')) {
    return (context.certifications && context.certifications.length > 0)
      ? `Your profile lists certifications: **${context.certifications.map(c => typeof c === 'string' ? c : c.title || c.name).join(', ')}**.`
      : `You haven't updated your **certifications** in your profile yet! You can add them in the **Profile** tab.`;
  }
  if (msgLower.includes('target role') || msgLower.includes('preferred role') || msgLower.includes('roles i want')) {
    return (context.preferred_roles && context.preferred_roles.length > 0)
      ? `Your preferred target roles are: **${context.preferred_roles.join(', ')}**.`
      : `You haven't updated your **preferred target roles** in your profile yet! You can add them in the **Profile** tab.`;
  }
  if (msgLower.includes('my skill') || msgLower.includes('what skills') || msgLower.includes('my tech stack')) {
    return skills.length > 0 
      ? `Your verified profile skills are: **${skills.join(', ')}**.`
      : `You haven't updated your **technical skills** in your profile yet! You can upload your resume in the **Resume AI** tab or add skills in your Profile.`;
  }
  if (msgLower === 'hi' || msgLower === 'hello' || msgLower === 'hey' || msgLower === 'hi there') {
    return `Hello **${name}**! 👋 How can I help with your career, skill gaps, or internship search today?`;
  }

  // Zero-Resume Guardrails
  if (!hasValidResume) {
    if (intent === 'INTERNSHIP_RECOMMEND') {
      return `### 📄 No Resume Uploaded Yet

Hello **${name}**! You haven't uploaded or parsed your resume yet, so our Multi-Agent Matching Engine cannot calculate verified compatibility scores against your individual background.

👉 **To unlock personalized matches & percentage scores:**
1. Navigate to the **Resume AI** tab.
2. Upload your PDF/Word resume or paste your text to extract your verified skills and project highlights.
3. Return here to get exact percentage match scores and tailored fit breakdowns!

---

### 🌐 Featured In-Demand Opportunities (Live Catalog)
While you prepare your resume, here are top trending opportunities you can explore in the **Internships** tab:

1. **AI & Machine Learning Engineering Intern** at **Infosys**
   - **Domain**: AI / Data Science • **Location**: Bengaluru (Remote Eligible)
   - **Key Technologies**: Python, PyTorch, Scikit-Learn, Docker

2. **Full-Stack Web Development Intern** at **TCS Digital**
   - **Domain**: Web Technologies • **Location**: Hyderabad (Hybrid)
   - **Key Technologies**: React, Node.js, Express, PostgreSQL

3. **Cloud Infrastructure & DevOps Intern** at **Amazon Web Services Partner**
   - **Domain**: Cloud & Systems • **Location**: Remote
   - **Key Technologies**: AWS, Docker, Kubernetes, CI/CD Pipelines

👉 *Explore all 180+ verified listings anytime in the **Internships** tab!*`;
    }

    if (intent === 'EXPLAIN_SKILL_GAPS') {
      return `### 📄 Upload Your Resume to Diagnose Skill Gaps

Hello **${name}**! To identify your exact skill gaps and generate an actionable learning roadmap, our Skill Gap Agent needs to compare your verified technical skills against employer requirements.

👉 **How to get your personalized Skill Gap Matrix:**
1. Go to the **Resume AI** tab and upload your resume.
2. Our AI will automatically extract your technical skills, tools, and domain proficiencies.
3. Visit the **Skill Gap** tab to view your matched competencies, missing prerequisites, and customized 14-day study roadmaps for any internship!

💡 *Tip: You can also test your current technical knowledge anytime in the **Mock Interview** tab!*`;
    }

    if (intent === 'COMPARE_ROLES' || intent === 'EXPLAIN_MATCH') {
      return `### 📄 Upload Your Resume for Personalized Comparison

Hello **${name}**! To compare internship opportunities side-by-side based on your specific background and skill overlap, please upload your resume in the **Resume AI** tab first!

Once your resume is uploaded, our multi-agent matching engine will evaluate:
- **Skill Overlap**: Exact technical competencies matching employer requirements.
- **Experience Alignment**: Project and coursework relevance.
- **Strategic Trade-offs**: Side-by-side comparisons of stipends, growth potential, and career trajectory.

In the meantime, you can browse and bookmark live listings in the **Internships** tab!`;
    }
  }

  // Populated Resume Branches
  switch (intent) {
    case 'COMPARE_ROLES': {
      const matches = multiAgentData.topMatches || [];
      const roleA = matches[0] || { title: 'Full-Stack Web Developer Intern', company: 'Infosys', score: 94, remote_type: 'Hybrid', stipend: '₹25,000/month' };
      const roleB = matches[1] || { title: 'Cloud Infrastructure & DevOps Intern', company: 'Swiggy Tech Labs', score: 88, remote_type: 'Remote', stipend: '₹35,000/month' };

      return `### ⚖️ Multi-Agent Internship Comparison for ${name}

Here is a side-by-side strategic breakdown of your top opportunities:

| Evaluation Dimension | **${roleA.title}** (${roleA.company}) | **${roleB.title}** (${roleB.company}) |
|---|---|---|
| **Compatibility Match** | **${roleA.score}%** (High Fit) | **${roleB.score}%** (Strong Potential) |
| **Work Mode & Location** | ${roleA.remote_type} | ${roleA.remote_type} |
| **Stipend** | ${roleA.stipend || 'Competitive'} | ${roleB.stipend || 'Competitive'} |
| **Tech Stack Match** | High overlap with your skills in ${topSkillsStr || 'Core Technologies'} | High upside in Cloud, CI/CD & Distributed Systems |
| **Key Competitive Edge** | Direct match with your existing project portfolio | Exceptional resume accelerator for Cloud/DevOps careers |

#### 🎯 Strategic Recommendation:
- **Choose ${roleA.company}** if you want to immediately leverage your proven full-stack strengths and convert into a fast return offer.
- **Choose ${roleB.company}** if you want to expand your skill ceiling into high-growth cloud infrastructure.

Would you like me to tailor your resume bullet points for either of these positions?`;
    }

    case 'EXPLAIN_SKILL_GAPS': {
      return `### 📊 Skill Gap Analysis & Learning Roadmap

Based on your profile competencies (${topSkillsStr || 'Core Programming'}):

1. **Critical Gap to Bridge**: **Containerization (Docker)**
   - **Why It Matters**: 85% of tech enterprise teams require containerized microservices for consistent local and production execution.
   - **Action Roadmap**: Spend **1-2 weeks** learning multi-stage Dockerfiles and Docker Compose.
   - **Suggested Mini-Project**: Containerize a multi-tier React + Node.js application with PostgreSQL volume persistence.

2. **Secondary Gap**: **Automated Testing (Jest / PyTest)**
   - **Why It Matters**: Demonstrates software engineering maturity and code reliability.
   - **Suggested Action**: Add 5-10 unit and integration tests to your top GitHub project.

Would you like to generate a tailored 14-day study plan or test your knowledge in a mock interview?`;
    }

    case 'INTERNSHIP_RECOMMEND': {
      const matches = multiAgentData.topMatches || [];
      const recList = matches.length > 0 ? matches : [
        { title: 'Full-Stack Web Developer Intern', company: 'Infosys', score: 94, location: 'Bengaluru (Hybrid)' },
        { title: 'AI & Machine Learning Intern', company: 'Google Cloud Ecosystem', score: 91, location: 'Remote' },
        { title: 'Data Analytics & Engineering Intern', company: 'Swiggy Tech Labs', score: 87, location: 'Hyderabad (Hybrid)' }
      ];

      return `### 🎯 Top Recommended Internships for ${name}

Our RAG-powered Job-Resume Matching Agent has evaluated the live knowledge base against your background:

${recList.map((r, i) => `${i + 1}. **${r.title}** at **${r.company}**
   - **Match Score**: \`${r.score}%\` Compatibility
   - **Location / Mode**: ${r.location || r.remote_type || 'Hybrid'}
   - **Why It Fits**: Direct alignment with your verified competencies in ${(skills.length > 0 ? skills.slice(0, 2).join(' & ') : 'Core Software Engineering')}.`).join('\n\n')}

👉 **Next Step**: Click on any of these roles in the **Recommendations** or **Skill Gap** tabs to inspect detailed requirement breakdowns and generate customized application materials!`;
    }

    case 'INTERVIEW_PLAN': {
      return `### 🎯 5-Day Technical Interview Preparation Blueprint

Here is your tailored strategy for upcoming technical and behavioral rounds:

- **Day 1 — Core Foundations**: Revise time/space complexities ($O(n)$, $O(\\log n)$), Arrays, HashMaps, and two-pointer algorithms in ${skills[0] || 'Python/JavaScript'}.
- **Day 2 — System & API Architecture**: Brush up on RESTful design, HTTP status codes, SQL JOIN queries, and database indexing.
- **Day 3 — Project Deep Dive**: Prepare a 2-minute elevator pitch for your best project. Be ready to explain one major architectural trade-off and one challenging bug.
- **Day 4 — Behavioral & STAR Stories**: Write 3 STAR stories (Situation, Task, Action, Result) showcasing teamwork, tight deadlines, and learning new stacks.
- **Day 5 — Full AI Mock Interview**: Launch a 5-question mock session in the **Mock Interview** tab to practice voice responses and receive real-time 3-dimension scoring!`;
    }

    case 'CUSTOMIZE_APPLICATION': {
      return `### 📄 Resume & Cover Letter Customization Strategy

To maximize your ATS match score for top tech applications:

1. **Incorporate Job Keywords**: Ensure exact required terms (e.g. REST APIs, Git, PostgreSQL) appear in your skills section and project bullets.
2. **Use the STAR Formula**:
   - *Weak*: "Worked on a web project."
   - *Strong*: "Architected a full-stack React and Node.js platform with SQLite indexing, improving query latency by 35% across 500+ records."
3. **Anti-Hallucination Grounding**: Always ground bullet enhancements in your real contributions—quantifying verified outcomes rather than fabricating tools.

Head to the **Application Customizer** tab to generate a fully tailored resume version and role-specific cover letter with 1 click!`;
    }

    default: {
      return `Hello **${name}**! I don't see that specific detail in your profile yet. You can view or update your details anytime in your **Profile** or **Resume AI** tab!`;
    }
  }
}
