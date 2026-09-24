# CareerPulse AI — Autonomous AI Career Companion Agent

> **Infosys Springboard Virtual Internship Capstone Project**  
> *Track: Applied Generative AI & Full-Stack Cloud-Native Engineering*  
> *Live Deployment*: [https://careerpulse-ai-9q9s.onrender.com/](https://careerpulse-ai-9q9s.onrender.com/)

---

## 📌 Executive Summary & Completed Project Milestones

**CareerPulse AI** is an intelligent, full-lifecycle AI Career Companion Agent platform engineered to empower undergraduate students and job seekers across every step of their career discovery journey: from resume parsing and RAG-powered internship discovery to multi-factor job matching, skill gap roadmaps, ATS resume/cover letter customization, voice-enabled mock interviews, and a 10-stage application tracker.

### 🏆 Milestone Verification & Compliance Status (100% Completed)

| Milestone | Key Deliverables & Focus Areas | Test Pass Rate | Compliance Report |
|---|---|---|---|
| **Milestone 1** | System Architecture, Student Profile Management, Multi-Format Resume Parsing (PDF/DOCX), Structured Skill Extraction, and Multi-Agent Design | ✅ **15/15 Passed (100%)** | [MILESTONE_1_COMPLIANCE_REPORT.md](file:///c:/Users/lokes/OneDrive/Desktop/infosys/MILESTONE_1_COMPLIANCE_REPORT.md) |
| **Milestone 2** | Curated Internship Knowledge Base (180 standardized postings across 6 domains), Dense Vector RAG Pipeline (720 semantic chunks), Multi-Factor Job Matching Agent, and Evaluation Suite (MRR: 1.000, 100% Top-1 Accuracy) | ✅ **38/38 Passed (100%)** | [MILESTONE_2_COMPLIANCE_REPORT.md](file:///c:/Users/lokes/OneDrive/Desktop/infosys/MILESTONE_2_COMPLIANCE_REPORT.md) |
| **Milestone 3** | Skill Gap Analysis Agent (5-category taxonomy & 3-week roadmap), Resume & Cover Letter Customizer Agent (STAR bullet points & Anti-Hallucination Guardrail), Interview Preparation Agent (5-category questions & 3D rubric scoring), and Conversational Career Assistant Multi-Agent Orchestrator | ✅ **31/31 Passed (100%)** | [MILESTONE_3_COMPLIANCE_REPORT.md](file:///c:/Users/lokes/OneDrive/Desktop/infosys/MILESTONE_3_COMPLIANCE_REPORT.md) |
| **Milestone 4** | Application Tracking Module (10 lifecycle stages, Kanban & Table views, urgency reminders, conversion KPIs), End-to-End System Testing & Validation (105 total assertions), Sub-300ms Performance Optimization, and Final Project Documentation | ✅ **21/21 Passed (100%)** | [MILESTONE_4_COMPLIANCE_REPORT.md](file:///c:/Users/lokes/OneDrive/Desktop/infosys/MILESTONE_4_COMPLIANCE_REPORT.md) |
| **OVERALL** | **Complete Full-Stack Cloud-Native Multi-Agent System** | ✅ **105/105 Passed (100%)** | [FINAL_PROJECT_REPORT.md](file:///c:/Users/lokes/OneDrive/Desktop/infosys/FINAL_PROJECT_REPORT.md) |

---

## 🏗️ End-to-End System Architecture

```mermaid
graph TD
    subgraph Client ["Frontend (React 18 + Vite + Modern Glassmorphism CSS)"]
        UI_Dashboard["Student Command Dashboard"]
        UI_Profile["Profile & Skill Editor"]
        UI_Resume["Resume AI & Extraction Studio"]
        UI_Internships["180 Internship Explorer (RAG)"]
        UI_Match["AI Matching & Explainable Compatibility"]
        UI_SkillGap["Skill Gap Matrix & Learning Roadmaps"]
        UI_Customizer["ATS Resume & Cover Letter Studio"]
        UI_Mock["Voice-Enabled Mock Interview Coach"]
        UI_Tracker["10-Stage Application Tracker (Kanban)"]
        UI_Chat["Conversational Career Assistant"]
    end

    subgraph Server ["Backend API (Node.js + Express REST API)"]
        AuthRoute["/api/auth (Bcrypt, JWT)"]
        ProfileRoute["/api/profile"]
        ResumeRoute["/api/resume (PDF/DOCX Extraction)"]
        InternshipRoute["/api/internships (RAG Semantic Search)"]
        MatchRoute["/api/matching (Multi-Factor Scoring)"]
        SkillGapRoute["/api/skill-gap (5-Tier Taxonomy)"]
        CustomRoute["/api/customization (ATS & Anti-Hallucination)"]
        InterviewRoute["/api/interview (5 Categories & 3D Rubric)"]
        AppRoute["/api/applications (10-Stage Lifecycle)"]
        ChatRoute["/api/assistant (Multi-Agent Dispatcher)"]
    end

    subgraph AI_Engine ["AI & Multi-Agent Layer"]
        GeminiService["Google Gemini 1.5 Flash API"]
        FallbackEngine["Sub-300ms Heuristic Fallback Engine"]
        VectorStore["In-Memory Cosine Vector Store (720 Chunks)"]
        Guardrail["Anti-Hallucination Verification Engine"]
    end

    subgraph DataLayer ["Persistence Layer"]
        SupabasePG[("Supabase PostgreSQL (Production)")]
        SQLiteLocal[("SQLite sql.js (Local Fallback)")]
    end

    Client <==> Server
    Server <==> AI_Engine
    Server <==> DataLayer
```

---

## 🚀 Key Feature Modules

### 1. 📊 10-Stage Application Tracking Module (Milestone 4)
- **Lifecycle Stages**: `Saved`, `Planning to Apply`, `Applied`, `Under Review`, `Shortlisted`, `Interview Scheduled`, `Interview Completed`, `Offer Received`, `Rejected`, `Withdrawn`.
- **1-Click Import**: Seamlessly import any curated role from the 180 catalog into your personal tracker.
- **Urgency Alert Engine**: Computes days remaining until deadline (🔴 Urgent $\le 3$ days, 🟡 Approaching $\le 7$ days, 🎯 Interview Reminders).
- **Dual Display Modes**: Fluid Kanban drag-and-drop board + sortable and filterable data table.
- **Portfolio Analytics**: Aggregates conversion metrics, active pipelines, upcoming interviews, and received offers.

### 2. 🔍 RAG Knowledge Base & Semantic Search (Milestone 2)
- **180 Curated Postings**: Standardized enterprise roles across AI/ML, Cloud/DevOps, Full-Stack, Data Engineering, Mobile, and Cybersecurity.
- **720 Vector Chunks**: Structured chunking strategy with in-memory normalized cosine similarity indexing.
- **Benchmark Accuracy**: Achieves **1.000 Mean Reciprocal Rank (MRR)** and **100% Top-1 Domain Retrieval Accuracy**.

### 3. 🎯 Deterministic Multi-Factor Compatibility Engine (Milestone 2)
- Transparent mathematical scoring:
  $$\text{Match Score} = (0.40 \times S_{\text{skills}}) + (0.25 \times S_{\text{projects}}) + (0.15 \times S_{\text{domain}}) + (0.10 \times S_{\text{education}}) + (0.10 \times S_{\text{experience}})$$
- Distinguishes required skills (75% weight) from preferred skills (25% weight).

### 4. 🧠 5 Collaborative AI Agents (Milestone 3)
1. **Skill Gap Analysis Agent**: Evaluates candidate competencies into 5 gap classifications and builds actionable 3-week learning roadmaps.
2. **Resume & Cover Letter Customizer Agent**: Generates STAR-formatted bullet points, elevates ATS match scores ($> 90\%$), and enforces anti-hallucination guardrails.
3. **Interview Preparation Agent**: Creates 5-category question plans, pre-interview revision checklists, and evaluates answers via a 3D rubric (Technical, Communication, Relevance).
4. **Conversational Career Assistant**: Natural language multi-agent dispatcher and side-by-side internship comparator.
5. **Job-Resume Matching Agent**: Calculates explainable fit breakdowns and candidate strengths.

---

## 🛠️ Technology Stack

| Layer | Technologies Used | Rationale |
|---|---|---|
| **Frontend** | React 18, Vite 6, Lucide Icons, Canvas Confetti | Fast HMR, zero bundle bloat, responsive micro-interactions |
| **Styling** | Vanilla Modern CSS (Tokens, Glassmorphism, Dark Mode) | Clean bespoke aesthetics without third-party framework overhead |
| **Backend** | Node.js, Express.js REST API | Fast, asynchronous JavaScript backend architecture |
| **Database** | Dual-Mode: Supabase Managed PostgreSQL + SQLite | High-availability cloud persistence with offline local fallback |
| **AI / GenAI** | Google Gemini 1.5 Flash API + Resilient Heuristics | Sub-300ms execution latency, structured JSON outputs, zero crashes |
| **Parsers** | `pdf-parse`, `mammoth` | Server-side binary buffer parsing for PDF and DOCX resumes |
| **Audio** | Web Speech API | Client-side voice dictation and text-to-speech synthesis |

---

## 🧪 Running Automated Tests

CareerPulse AI includes comprehensive automated evaluation test suites:

```bash
# Run all milestone test suites (M1, M2, M3, M4)
npm test

# Run individual milestone test suites
npm run test:m1    # Auth & Profile CRUD (15 tests)
npm run test:m2    # RAG Vector Store & Matching Engine (38 tests)
npm run test:m3    # Multi-Agent Evaluation Suite (31 tests)
npm run test:m4    # Application Tracker & End-to-End Pipeline (21 tests)
```

---

## 💻 Local Development Setup

### 1. Install Dependencies
```bash
# In the root directory:
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment Variables
Create `.env` in `backend/` (or copy `.env.example`):
```env
PORT=5000
JWT_SECRET=careerpulse_secure_jwt_token_secret_key_2026_infosys_project
GEMINI_API_KEY=your_gemini_api_key_here
# Optional Supabase Database (will fallback to SQLite if omitted):
DATABASE_URL=postgresql://postgres:...@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

### 3. Start Development Servers
```bash
# Start backend API (Terminal 1):
npm run dev:backend

# Start frontend client (Terminal 2):
npm run dev:frontend
```
Open **`http://localhost:5173`** in your browser.

---

## 📄 Academic Project Reports & Documentation
- 📘 [FINAL_PROJECT_REPORT.md](file:///c:/Users/lokes/OneDrive/Desktop/infosys/FINAL_PROJECT_REPORT.md): Complete technical report containing problem statement, system architecture, RAG design, agent specifications, and quantitative evaluation.
- 📋 [MILESTONE_4_COMPLIANCE_REPORT.md](file:///c:/Users/lokes/OneDrive/Desktop/infosys/MILESTONE_4_COMPLIANCE_REPORT.md): Detailed compliance matrix for Milestone 4.
- 📋 [MILESTONE_3_COMPLIANCE_REPORT.md](file:///c:/Users/lokes/OneDrive/Desktop/infosys/MILESTONE_3_COMPLIANCE_REPORT.md): Multi-agent architecture and evaluation report.
- 📋 [MILESTONE_2_COMPLIANCE_REPORT.md](file:///c:/Users/lokes/OneDrive/Desktop/infosys/MILESTONE_2_COMPLIANCE_REPORT.md): RAG knowledge base & matching report.
- 📋 [MILESTONE_1_COMPLIANCE_REPORT.md](file:///c:/Users/lokes/OneDrive/Desktop/infosys/MILESTONE_1_COMPLIANCE_REPORT.md): System architecture and parser report.

---

## 📄 License & Attribution
Developed for the **Infosys Springboard Virtual Internship Program**. Built with **Google Antigravity** and **Google Gemini API**. Licensed under the MIT License.
