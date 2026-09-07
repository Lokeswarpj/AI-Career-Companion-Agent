import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Award, 
  Trash2, 
  RefreshCw,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function ResumePage({ setActiveTab }) {
  const notify = useNotification();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadLatestResume();
  }, []);

  async function loadLatestResume() {
    try {
      setLoading(true);
      const res = await api.getLatestResume();
      setResumeData(res.resume);
    } catch (err) {
      console.error('Failed to load resume:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);

    setAnalyzing(true);
    try {
      const res = await api.uploadResume(formData);
      notify.success('Resume analyzed successfully with Gemini AI!');
      await loadLatestResume();
    } catch (err) {
      notify.error(err.message || 'Failed to upload and analyze resume.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSampleResume = async () => {
    // Generate a sample student resume text file on the fly
    const sampleContent = `
Aarav Sharma - Student Software Developer & AI Enthusiast
Email: aarav.sharma@nit.edu | Bengaluru, India | GitHub: github.com/aarav-dev

EDUCATION
B.Tech in Computer Science and Engineering (2022 - 2026)
National Institute of Technology | CGPA: 8.8/10

TECHNICAL SKILLS
- Programming Languages: Python, JavaScript, TypeScript, Java, SQL, C++
- Web Development: React, Node.js, Express, HTML5, CSS3, TailwindCSS, FastAPI, REST APIs
- AI & Data Science: Machine Learning, PyTorch, Pandas, NumPy, Scikit-learn, NLP
- Cloud & Tools: Git, GitHub Actions, Docker, Linux, VS Code, Postman
- Soft Skills: Problem Solving, Team Leadership, Agile Collaboration, Technical Writing

PROJECTS
1. AI Smart Document Classifier (Python, PyTorch, FastAPI, React)
- Built a multi-class document classification pipeline processing PDF and DOCX files.
- Achieved 92% classification accuracy across 5 document categories using fine-tuned embeddings.
- Deployed a containerized REST API with FastAPI and Docker.

2. Campus Marketplace Hub (React, Node.js, SQLite, TailwindCSS)
- Developed a peer-to-peer student marketplace with JWT authentication and live search.
- Optimized database indexing to achieve sub-40ms response times for 1,000+ active listings.

EXPERIENCE & LEADERSHIP
- Web Lead, University Coding Society: Mentored 40+ junior developers in React and Git workflows.
- Finalist, Smart India Hackathon 2025 (AI for Education track).
`;

    const blob = new Blob([sampleContent], { type: 'text/plain' });
    const file = new File([blob], 'Aarav_Sharma_Resume.txt', { type: 'text/plain' });
    await handleFileUpload(file);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteResume(id);
      notify.success('Resume deleted.');
      setResumeData(null);
    } catch (err) {
      notify.error('Failed to delete resume.');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Checking resume status..." />;
  }

  const skills = resumeData?.detected_skills_json || {};

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: '1100px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Resume Intelligence Center</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Upload your resume for deep Gemini AI screening, automated skill taxonomy extraction, and actionable SWOT diagnostics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleSampleResume}
            disabled={analyzing}
            className="btn btn-secondary"
            style={{ gap: '0.5rem', border: '1px solid rgba(99, 102, 241, 0.4)' }}
          >
            <Sparkles size={16} color="#818cf8" />
            <span>📄 Test with Sample Tech Resume</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Box */}
      <div
        className="glass-panel"
        style={{
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          border: `2px dashed ${dragActive ? 'var(--accent-primary)' : 'var(--border-card)'}`,
          background: dragActive ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2.5rem',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
        }}
        onClick={() => document.getElementById('resumeFileInput').click()}
      >
        <input
          id="resumeFileInput"
          type="file"
          accept=".pdf,.docx,.doc,.txt,.md"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
          }}
        />

        <div style={{
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem auto',
          color: '#818cf8'
        }}>
          {analyzing ? <RefreshCw size={28} style={{ animation: 'spin 1.5s linear infinite' }} /> : <Upload size={28} />}
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.4rem' }}>
          {analyzing ? 'Gemini AI is Screening Your Resume...' : 'Click to Upload or Drag & Drop Resume'}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '480px', margin: '0 auto' }}>
          Supports PDF, DOCX, or Plain Text. Max file size: 10MB.
        </p>
      </div>

      {analyzing && <LoadingSpinner message="Gemini AI is parsing syntax, detecting technical stack, and calculating SWOT..." />}

      {/* Analyzed Resume Dashboard */}
      {resumeData && !analyzing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Top Summary Card */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} color="#818cf8" />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{resumeData.filename}</h3>
                  <span className="badge badge-emerald">Screened by Gemini AI</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Uploaded on: {new Date(resumeData.uploaded_at).toLocaleDateString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setActiveTab('matching')}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '0.4rem' }}
                >
                  <span>Match with Internships</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => handleDelete(resumeData.id)}
                  className="btn btn-danger btn-sm"
                  title="Delete resume"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.6, background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
              {resumeData.parsed_summary}
            </p>
          </div>

          {/* Categorized Skills Breakdown */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={20} color="#22d3ee" />
              <span>Extracted Competency Taxonomy</span>
            </h3>

            <div className="grid-3">
              {/* Programming */}
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#818cf8', marginBottom: '0.6rem' }}>
                  CORE PROGRAMMING
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {(skills.programming || []).map((s, i) => (
                    <span key={i} className="badge badge-indigo">{s}</span>
                  ))}
                  {(!skills.programming || skills.programming.length === 0) && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None detected</span>}
                </div>
              </div>

              {/* Web Development */}
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22d3ee', marginBottom: '0.6rem' }}>
                  WEB & APIS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {(skills.web || []).map((s, i) => (
                    <span key={i} className="badge badge-cyan">{s}</span>
                  ))}
                  {(!skills.web || skills.web.length === 0) && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None detected</span>}
                </div>
              </div>

              {/* AI & Data */}
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', marginBottom: '0.6rem' }}>
                  DATA & AI
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {(skills.aiData || []).map((s, i) => (
                    <span key={i} className="badge badge-emerald">{s}</span>
                  ))}
                  {(!skills.aiData || skills.aiData.length === 0) && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None detected</span>}
                </div>
              </div>

              {/* Cloud & DevOps */}
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', marginBottom: '0.6rem' }}>
                  CLOUD & DEVOPS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {(skills.cloud || []).map((s, i) => (
                    <span key={i} className="badge badge-amber">{s}</span>
                  ))}
                  {(!skills.cloud || skills.cloud.length === 0) && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None detected</span>}
                </div>
              </div>

              {/* Developer Tools */}
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c084fc', marginBottom: '0.6rem' }}>
                  TOOLS & PLATFORMS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {(skills.tools || []).map((s, i) => (
                    <span key={i} className="badge badge-indigo">{s}</span>
                  ))}
                  {(!skills.tools || skills.tools.length === 0) && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None detected</span>}
                </div>
              </div>

              {/* Soft Skills */}
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fb7185', marginBottom: '0.6rem' }}>
                  SOFT COMPETENCIES
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {(skills.soft || []).map((s, i) => (
                    <span key={i} className="badge badge-rose">{s}</span>
                  ))}
                  {(!skills.soft || skills.soft.length === 0) && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None detected</span>}
                </div>
              </div>
            </div>
          </div>

          {/* SWOT Strengths vs. Weaknesses */}
          <div className="grid-2">
            
            {/* Strengths */}
            <div className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid #10b981' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399' }}>
                <CheckCircle size={20} />
                <span>Identified Strengths</span>
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', listStyle: 'none' }}>
                {(resumeData.strengths_json || []).map((str, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.9rem' }}>
                    <span style={{ color: '#10b981', fontWeight: 800 }}>•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div className="glass-panel" style={{ padding: '2rem', borderTop: '4px solid #f59e0b' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24' }}>
                <AlertTriangle size={20} />
                <span>Potential Gaps & Weaknesses</span>
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', listStyle: 'none' }}>
                {(resumeData.weaknesses_json || []).map((w, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.9rem' }}>
                    <span style={{ color: '#f59e0b', fontWeight: 800 }}>•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Recommended Skills & Career Path Suggestions */}
          <div className="grid-2">
            
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <TrendingUp size={18} color="#818cf8" />
                <span>Recommended Skills to Master</span>
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {(resumeData.recommended_skills_json || []).map((rec, i) => (
                  <span key={i} className="badge badge-indigo" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                    {rec}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Award size={18} color="#22d3ee" />
                <span>Top Role Trajectories</span>
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {(resumeData.career_suggestions_json || []).map((role, i) => (
                  <span key={i} className="badge badge-cyan" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                    {role}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
