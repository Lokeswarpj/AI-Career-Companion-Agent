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
  ArrowRight,
  Target,
  Building,
  MapPin,
  Mic,
  CheckCircle2,
  Sliders,
  ExternalLink
} from 'lucide-react';

export default function ResumePage({ setActiveTab, setSelectedInternshipId }) {
  const notify = useNotification();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [matchedInternships, setMatchedInternships] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadLatestResume();
  }, []);

  async function loadLatestResume() {
    try {
      setLoading(true);
      const res = await api.getLatestResume();
      setResumeData(res.resume);
      if (res.resume) {
        loadMatchedInternships();
      } else {
        setMatchedInternships([]);
      }
    } catch (err) {
      console.error('Failed to load resume:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMatchedInternships() {
    try {
      setLoadingMatches(true);
      const recRes = await api.getRecommendations();
      setMatchedInternships(recRes.recommendations || []);
    } catch (err) {
      console.error('Failed to load matched internships:', err);
    } finally {
      setLoadingMatches(false);
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

          {/* AI-Suggested Internships Matched to Resume */}
          <div className="glass-panel" style={{ padding: '2rem', marginTop: '1rem', borderTop: '4px solid var(--accent-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
              <div>
                <div style={{ display: 'inline-flex', marginBottom: '0.4rem' }}>
                  <span className="badge badge-indigo">
                    <Target size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    5-Factor Deterministic Compatibility Engine
                  </span>
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🎯 Top Matched Internships for Your Resume</span>
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.25rem', maxWidth: '680px' }}>
                  Evaluated in real-time against 180 curated knowledge base postings. Below are the highest-compatibility roles aligned with your extracted skills, projects, and academic background.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('matching')}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.4rem' }}
              >
                <span>View Full Matching Board</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {loadingMatches ? (
              <LoadingSpinner message="Calculating multi-factor compatibility scores across 180 internship postings..." />
            ) : matchedInternships.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Target size={36} style={{ margin: '0 auto 0.75rem auto', color: 'var(--text-muted)' }} />
                <p>No matched internships found yet. Please make sure your profile has skills and roles listed.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {matchedInternships.slice(0, 4).map((rec, idx) => {
                  const item = rec.internship;
                  const score = rec.matchScore;
                  const matrix = rec.skillMatrix || { matchingSkills: [], missingSkills: [] };
                  const breakdown = rec.breakdown || {};
                  const scoreColor = score >= 80 ? '#10b981' : score >= 65 ? '#6366f1' : '#f59e0b';
                  const scoreLabel = score >= 85 ? 'Exceptional Fit' : score >= 75 ? 'Strong Match' : score >= 60 ? 'Moderate Match' : 'Potential Fit';

                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '1.5rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--border-card)',
                        borderLeft: `5px solid ${scoreColor}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                    >
                      {/* Top Row: Info & Match Percentage */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ flex: '1 1 300px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                            <span style={{
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              background: idx === 0 ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-tertiary)',
                              color: idx === 0 ? '#fbbf24' : 'var(--text-secondary)'
                            }}>
                              #{idx + 1} Best Match
                            </span>
                            <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>{item.source}</span>
                            <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{item.remote_type}</span>
                            {rec.isRagRetrieved && (
                              <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>⚡ RAG Vector Match</span>
                            )}
                          </div>

                          <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {item.title}
                          </h4>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Building size={14} /> {item.company}
                            </span>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <MapPin size={14} /> {item.location}
                            </span>
                            <span>•</span>
                            <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>
                              {item.stipend || 'Stipend available'}
                            </span>
                          </div>
                        </div>

                        {/* Match Percentage Display Card */}
                        <div style={{
                          padding: '0.75rem 1.25rem',
                          background: 'var(--bg-card)',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${scoreColor}40`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          minWidth: '180px',
                          justifyContent: 'center',
                          boxShadow: `0 4px 12px ${scoreColor}15`
                        }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
                              {score}%
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                              {scoreLabel}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                              Resume Compatibility
                            </div>
                          </div>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: `conic-gradient(${scoreColor} ${score * 3.6}deg, var(--bg-tertiary) 0deg)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '3px'
                          }}>
                            <div style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              background: 'var(--bg-card)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              color: scoreColor
                            }}>
                              <Target size={18} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Multi-Factor Score Breakdown Progress Bars */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '0.6rem',
                        padding: '0.75rem 1rem',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem'
                      }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                            <span>Skills (40%)</span>
                            <strong style={{ color: '#818cf8' }}>{breakdown.skillScore || 0}%</strong>
                          </div>
                          <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${breakdown.skillScore || 0}%`, height: '100%', background: '#818cf8' }} />
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                            <span>Projects (25%)</span>
                            <strong style={{ color: '#22d3ee' }}>{breakdown.experienceAndProjectsScore || 0}%</strong>
                          </div>
                          <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${breakdown.experienceAndProjectsScore || 0}%`, height: '100%', background: '#22d3ee' }} />
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                            <span>Role Fit (15%)</span>
                            <strong style={{ color: '#34d399' }}>{breakdown.roleScore || 0}%</strong>
                          </div>
                          <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${breakdown.roleScore || 0}%`, height: '100%', background: '#34d399' }} />
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                            <span>Academic (10%)</span>
                            <strong style={{ color: '#fbbf24' }}>{breakdown.educationScore || 0}%</strong>
                          </div>
                          <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${breakdown.educationScore || 0}%`, height: '100%', background: '#fbbf24' }} />
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                            <span>Work Mode (10%)</span>
                            <strong style={{ color: '#f43f5e' }}>{breakdown.locationScore || 0}%</strong>
                          </div>
                          <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${breakdown.locationScore || 0}%`, height: '100%', background: '#f43f5e' }} />
                          </div>
                        </div>
                      </div>

                      {/* Matched vs Missing Skill Tags */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', minWidth: '95px' }}>
                            ✓ MATCHED ({matrix.matchingSkills.length}):
                          </span>
                          {matrix.matchingSkills.map((m, i) => (
                            <span key={i} className="badge badge-emerald" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>
                              ✓ {m.skill}
                            </span>
                          ))}
                          {matrix.matchingSkills.length === 0 && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Foundational alignment</span>
                          )}
                        </div>

                        {matrix.missingSkills && matrix.missingSkills.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24', minWidth: '95px' }}>
                              + TO LEARN ({matrix.missingSkills.length}):
                            </span>
                            {matrix.missingSkills.slice(0, 4).map((m, i) => (
                              <span key={i} className="badge badge-amber" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>
                                + {m.skill}
                              </span>
                            ))}
                            {matrix.missingSkills.length > 4 && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                +{matrix.missingSkills.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* AI Reasoning Quote */}
                      {rec.explanation?.whyItMatches && (
                        <div style={{
                          padding: '0.6rem 0.85rem',
                          background: 'rgba(99, 102, 241, 0.08)',
                          borderRadius: 'var(--radius-sm)',
                          borderLeft: '3px solid #818cf8',
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <Sparkles size={14} color="#818cf8" style={{ flexShrink: 0 }} />
                          <span><strong>AI Insight:</strong> {rec.explanation.whyItMatches}</span>
                        </div>
                      )}

                      {/* Action CTAs */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '0.6rem',
                        paddingTop: '0.6rem',
                        borderTop: '1px solid var(--border-subtle)',
                        flexWrap: 'wrap'
                      }}>
                        <button
                          onClick={() => {
                            if (setSelectedInternshipId) setSelectedInternshipId(item.id);
                            setActiveTab('skill-gap');
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ gap: '0.35rem' }}
                        >
                          <Sliders size={14} color="#818cf8" />
                          <span>Skill Gap Matrix</span>
                        </button>

                        <button
                          onClick={() => {
                            if (setSelectedInternshipId) setSelectedInternshipId(item.id);
                            setActiveTab('mock-interview');
                          }}
                          className="btn btn-primary btn-sm"
                          style={{ gap: '0.35rem' }}
                        >
                          <Mic size={14} />
                          <span>Practice Interview</span>
                        </button>

                        <button
                          onClick={() => {
                            if (setSelectedInternshipId) setSelectedInternshipId(item.id);
                            setActiveTab('matching');
                          }}
                          className="btn btn-outline btn-sm"
                          style={{ gap: '0.35rem' }}
                        >
                          <span>Full Evaluation</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>

                    </div>
                  );
                })}

                {/* Bottom CTA Card to explore all 180+ postings */}
                <div style={{
                  padding: '1.25rem 1.5rem',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.08) 100%)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed rgba(99, 102, 241, 0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Explore All 180+ Ranked Internship Opportunities
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Access complete multi-factor breakdowns, academic filters, and the Evaluation Benchmark Lab.
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('matching')}
                    className="btn btn-primary btn-sm"
                    style={{ gap: '0.4rem' }}
                  >
                    <span>Open Matching Board</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
