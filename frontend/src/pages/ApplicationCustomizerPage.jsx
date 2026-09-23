import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  downloadAsPdf, 
  downloadAsDocx, 
  downloadAsMarkdown, 
  downloadAsText 
} from '../utils/exportUtils';
import { 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Copy, 
  Download, 
  Save, 
  Trash2, 
  Layers, 
  ShieldCheck, 
  Sliders, 
  Target, 
  Building, 
  RefreshCw, 
  Award, 
  Check, 
  Briefcase, 
  PenTool,
  Printer
} from 'lucide-react';

export default function ApplicationCustomizerPage({ selectedInternshipId, setSelectedInternshipId, setActiveTab }) {
  const notify = useNotification();
  const [internshipsList, setInternshipsList] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('resume'); // 'resume' | 'cover-letter' | 'saved'

  // Resume Customizer state
  const [generatingResume, setGeneratingResume] = useState(false);
  const [tailoredResumeData, setTailoredResumeData] = useState(null);
  const [copiedResume, setCopiedResume] = useState(false);

  // Cover Letter state
  const [generatingLetter, setGeneratingLetter] = useState(false);
  const [selectedTone, setSelectedTone] = useState('Professional & Enthusiastic');
  const [coverLetterData, setCoverLetterData] = useState(null);
  const [coverLetterText, setCoverLetterText] = useState('');
  const [copiedLetter, setCopiedLetter] = useState(false);

  // Saved Applications state
  const [savedApplications, setSavedApplications] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savingApp, setSavingApp] = useState(false);

  useEffect(() => {
    loadInternships();
    loadSavedApplications();
  }, []);

  useEffect(() => {
    if (selectedInternshipId) {
      handleGenerateAll(selectedInternshipId);
    } else if (internshipsList.length > 0) {
      setSelectedInternshipId(internshipsList[0].id);
    }
  }, [selectedInternshipId, internshipsList]);

  async function loadInternships() {
    try {
      const res = await api.getInternships();
      setInternshipsList(res.internships || []);
      if (!selectedInternshipId && res.internships?.length > 0) {
        setSelectedInternshipId(res.internships[0].id);
      }
    } catch (err) {
      console.error('Failed to load internships list:', err);
    }
  }

  async function loadSavedApplications() {
    try {
      setLoadingSaved(true);
      const res = await api.getSavedApplications();
      setSavedApplications(res.applications || []);
    } catch (err) {
      console.error('Failed to load saved applications:', err);
    } finally {
      setLoadingSaved(false);
    }
  }

  async function handleGenerateAll(id) {
    if (!id) return;
    await Promise.all([
      handleGenerateResume(id),
      handleGenerateCoverLetter(id, selectedTone)
    ]);
  }

  async function handleGenerateResume(id) {
    try {
      setGeneratingResume(true);
      const res = await api.tailorResume({ internshipId: id });
      setTailoredResumeData(res);
    } catch (err) {
      notify.error('Failed to tailor resume: ' + (err.message || 'Please ensure you have a profile or uploaded resume.'));
    } finally {
      setGeneratingResume(false);
    }
  }

  async function handleGenerateCoverLetter(id, tone) {
    try {
      setGeneratingLetter(true);
      const res = await api.generateCoverLetter({ internshipId: id, tone });
      setCoverLetterData(res);
      setCoverLetterText(res.fullCoverLetter || '');
    } catch (err) {
      notify.error('Failed to generate cover letter: ' + (err.message || ''));
    } finally {
      setGeneratingLetter(false);
    }
  }

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'resume') {
      setCopiedResume(true);
      setTimeout(() => setCopiedResume(false), 2000);
    } else {
      setCopiedLetter(true);
      setTimeout(() => setCopiedLetter(false), 2000);
    }
    notify.success('Copied to clipboard!');
  };

  const handleDownload = (filename, content) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    notify.success(`Downloaded ${filename}!`);
  };

  const handleSaveCurrentApplication = async () => {
    if (!tailoredResumeData && !coverLetterData) return;
    try {
      setSavingApp(true);
      const currentJob = internshipsList.find(i => i.id === selectedInternshipId);
      await api.saveApplication({
        internshipId: selectedInternshipId,
        roleTitle: tailoredResumeData?.internshipTitle || currentJob?.title || 'Software Engineering Intern',
        company: tailoredResumeData?.company || currentJob?.company || 'Enterprise Company',
        tailoredResumeJson: tailoredResumeData,
        coverLetter: coverLetterText,
        atsScore: tailoredResumeData?.atsScoreAfter || 85
      });
      notify.success('Application materials saved to your portfolio!');
      await loadSavedApplications();
    } catch (err) {
      notify.error(err.message || 'Failed to save application.');
    } finally {
      setSavingApp(false);
    }
  };

  const handleDeleteSavedApp = async (id) => {
    try {
      await api.deleteApplication(id);
      notify.success('Application deleted.');
      await loadSavedApplications();
    } catch (err) {
      notify.error('Failed to delete application.');
    }
  };

  const currentJob = internshipsList.find(i => i.id === selectedInternshipId);

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: '1150px' }}>
      
      {/* Header & Role Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', marginBottom: '0.4rem' }}>
            <span className="badge badge-indigo">M3.2 Application Customizer Agent</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Role-Specific Application Customizer</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Generate grounded, ATS-optimized tailored resumes and targeted cover letters for selected internships.
          </p>
        </div>

        {/* Target Internship Dropdown */}
        <div style={{ minWidth: '280px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
            Target Internship:
          </label>
          <select
            className="form-select"
            value={selectedInternshipId || ''}
            onChange={(e) => {
              setSelectedInternshipId(e.target.value);
              handleGenerateAll(e.target.value);
            }}
          >
            {internshipsList.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.company})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button
          className={`btn ${activeSubTab === 'resume' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('resume')}
          style={{ gap: '0.4rem' }}
        >
          <FileText size={16} />
          <span>Tailored Resume & ATS Optimization</span>
        </button>

        <button
          className={`btn ${activeSubTab === 'cover-letter' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('cover-letter')}
          style={{ gap: '0.4rem' }}
        >
          <PenTool size={16} />
          <span>Targeted Cover Letter</span>
        </button>

        <button
          className={`btn ${activeSubTab === 'saved' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveSubTab('saved')}
          style={{ gap: '0.4rem' }}
        >
          <Save size={16} />
          <span>Saved Application Bundles ({savedApplications.length})</span>
        </button>

        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={handleSaveCurrentApplication}
            disabled={savingApp || (!tailoredResumeData && !coverLetterData)}
            className="btn btn-secondary"
            style={{ gap: '0.4rem', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
          >
            <Save size={16} />
            <span>{savingApp ? 'Saving...' : 'Save to Applications Portfolio'}</span>
          </button>
        </div>
      </div>

      {/* TAB 1: TAILORED RESUME */}
      {activeSubTab === 'resume' && (
        <div>
          {generatingResume ? (
            <LoadingSpinner message="Application Customizer Agent is aligning resume keywords and formulating STAR bullet improvements..." />
          ) : tailoredResumeData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* ATS Score & Anti-Hallucination Guarantee Banner */}
              <div className="glass-panel" style={{ padding: '1.75rem', borderLeft: '6px solid var(--accent-emerald)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span className="badge badge-emerald">ATS Optimization Report</span>
                      <span className="badge badge-indigo">{tailoredResumeData.company}</span>
                    </div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                      Tailored for: {tailoredResumeData.internshipTitle}
                    </h2>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Keywords incorporated naturally across summary, core competencies, and project bullet points.
                    </div>
                  </div>

                  {/* ATS Comparison Widget */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-muted)' }}>{tailoredResumeData.atsScoreBefore}%</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Baseline ATS</div>
                    </div>

                    <ArrowRight size={20} color="var(--accent-primary)" />

                    <div style={{ textAlign: 'center', padding: '0.75rem 1.25rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981' }}>{tailoredResumeData.atsScoreAfter}%</div>
                      <div style={{ fontSize: '0.7rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>Tailored ATS</div>
                    </div>
                  </div>
                </div>

                {/* Anti-Hallucination Guardrail Badge */}
                <div style={{
                  marginTop: '1.25rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(99, 102, 241, 0.05)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.84rem'
                }}>
                  <ShieldCheck size={18} color="#6366f1" />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <strong>Anti-Hallucination Guarantee:</strong> All skills, metrics enhancements, and project scopes are strictly grounded in your verified profile without fabricating unearned credentials.
                  </span>
                </div>
              </div>

              {/* STAR Bullet Point Improvements Diff */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Award size={20} color="#f59e0b" />
                  <span>STAR Bullet Point Improvements (Situation • Task • Action • Result)</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {tailoredResumeData.bulletPointImprovements?.map((b, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid var(--border-card)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.4rem' }}>
                        {b.originalContext}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                        <div style={{ background: 'rgba(244, 63, 94, 0.04)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244, 63, 94, 0.15)' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Before (Basic Draft)</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{b.originalDraft}</div>
                        </div>

                        <div style={{ background: 'rgba(16, 185, 129, 0.04)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: '0.2rem' }}>After (STAR Enhanced)</div>
                          <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>{b.improvedStarBullet}</div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                        💡 Why this helps: {b.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ATS Keyword Alignment & Placement Matrix */}
              {tailoredResumeData.atsTargetKeywordAlignment && tailoredResumeData.atsTargetKeywordAlignment.length > 0 && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Target size={20} color="var(--accent-cyan)" />
                    <span>ATS Target Keyword Alignment & Placement Matrix</span>
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    Real-time verification of required & preferred job keywords strategically integrated across resume sections.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                    {tailoredResumeData.atsTargetKeywordAlignment.map((item, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          background: 'var(--bg-secondary)', 
                          padding: '0.85rem 1rem', 
                          borderRadius: 'var(--radius-sm)', 
                          border: '1px solid var(--border-card)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckCircle2 size={16} color="#10b981" />
                          <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{item.keyword}</strong>
                        </div>
                        <span className="badge badge-emerald" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                          {item.location || 'Skills & Projects'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Markdown Resume & Export Toolbar */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={20} color="var(--accent-primary)" />
                    <span>Complete Tailored Resume (Markdown / ATS Ready)</span>
                  </h3>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleCopy(tailoredResumeData.fullMarkdownResume, 'resume')}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem', gap: '0.35rem' }}
                    >
                      {copiedResume ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      <span>{copiedResume ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => {
                        downloadAsPdf(
                          `${tailoredResumeData.company}_Tailored_Resume`, 
                          tailoredResumeData.fullMarkdownResume, 
                          `${tailoredResumeData.internshipTitle} - ${tailoredResumeData.company}`
                        );
                        notify.success('Downloading tailored PDF resume...');
                      }}
                      className="btn btn-primary"
                      style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem', gap: '0.35rem', background: '#dc2626', borderColor: '#b91c1c' }}
                      title="Export tailored resume as high-resolution PDF"
                    >
                      <Download size={14} />
                      <span>Download PDF</span>
                    </button>

                    <button
                      onClick={() => {
                        downloadAsDocx(
                          `${tailoredResumeData.company}_Tailored_Resume.docx`, 
                          tailoredResumeData.fullMarkdownResume, 
                          `${tailoredResumeData.internshipTitle} - ${tailoredResumeData.company}`
                        );
                        notify.success('Downloaded Microsoft Word document (.docx)!');
                      }}
                      className="btn btn-primary"
                      style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem', gap: '0.35rem', background: '#2563eb', borderColor: '#1d4ed8' }}
                      title="Export tailored resume as editable Word DOCX"
                    >
                      <Download size={14} />
                      <span>Download DOCX</span>
                    </button>

                    <button
                      onClick={() => {
                        downloadAsMarkdown(`${tailoredResumeData.company}_Tailored_Resume.md`, tailoredResumeData.fullMarkdownResume);
                        notify.success('Downloaded Markdown resume (.md)!');
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem', gap: '0.35rem' }}
                      title="Download clean Markdown format"
                    >
                      <Download size={14} />
                      <span>Markdown (.md)</span>
                    </button>
                  </div>
                </div>

                <pre style={{
                  background: 'var(--bg-secondary)',
                  padding: '1.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  maxHeight: '450px',
                  overflowY: 'auto'
                }}>
                  {tailoredResumeData.fullMarkdownResume}
                </pre>
              </div>

            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>Select an internship above to generate a tailored resume.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COVER LETTER GENERATOR */}
      {activeSubTab === 'cover-letter' && (
        <div>
          {/* Tone Selector Toolbar */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Cover Letter Tone Configuration</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Choose the voice that best fits {currentJob?.company || 'the target company'}</div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['Professional & Enthusiastic', 'Technical & Impact-Driven', 'Concise & Direct'].map((tone) => (
                  <button
                    key={tone}
                    onClick={() => {
                      setSelectedTone(tone);
                      handleGenerateCoverLetter(selectedInternshipId, tone);
                    }}
                    className={`btn ${selectedTone === tone ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {generatingLetter ? (
            <LoadingSpinner message="Generating tailored cover letter connecting your projects to company requirements..." />
          ) : coverLetterData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Key Highlights */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} />
                  <span>Cover Letter Strategic Highlights</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {coverLetterData.keyHighlights?.map((hl, i) => (
                    <div key={i} style={{ background: 'var(--bg-secondary)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)', fontSize: '0.84rem' }}>
                      ✓ {hl}
                    </div>
                  ))}
                </div>
              </div>

              {/* Editable Full Cover Letter */}
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    Targeted Cover Letter for {coverLetterData.company}
                  </h3>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleCopy(coverLetterText, 'letter')}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem', gap: '0.35rem' }}
                    >
                      {copiedLetter ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      <span>{copiedLetter ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => {
                        downloadAsPdf(
                          `${coverLetterData.company}_Cover_Letter`, 
                          coverLetterText, 
                          `Cover Letter - ${coverLetterData.company}`
                        );
                        notify.success('Downloading PDF cover letter...');
                      }}
                      className="btn btn-primary"
                      style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem', gap: '0.35rem', background: '#dc2626', borderColor: '#b91c1c' }}
                      title="Export Cover Letter as high-resolution PDF"
                    >
                      <Download size={14} />
                      <span>Download PDF</span>
                    </button>

                    <button
                      onClick={() => {
                        downloadAsDocx(
                          `${coverLetterData.company}_Cover_Letter.docx`, 
                          coverLetterText, 
                          `Cover Letter - ${coverLetterData.company}`
                        );
                        notify.success('Downloaded Microsoft Word document (.docx)!');
                      }}
                      className="btn btn-primary"
                      style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem', gap: '0.35rem', background: '#2563eb', borderColor: '#1d4ed8' }}
                      title="Export Cover Letter as editable Word DOCX"
                    >
                      <Download size={14} />
                      <span>Download DOCX</span>
                    </button>

                    <button
                      onClick={() => {
                        downloadAsText(`${coverLetterData.company}_Cover_Letter.txt`, coverLetterText);
                        notify.success('Downloaded Text (.txt)!');
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem', gap: '0.35rem' }}
                      title="Download clean plain text"
                    >
                      <Download size={14} />
                      <span>Text (.txt)</span>
                    </button>
                  </div>
                </div>

                <textarea
                  className="form-control form-textarea"
                  style={{
                    width: '100%',
                    minHeight: '420px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.96rem',
                    lineHeight: 1.8,
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    background: '#0f172a',
                    color: '#f8fafc',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5)',
                    resize: 'vertical',
                    letterSpacing: '0.01em'
                  }}
                  value={coverLetterText}
                  onChange={(e) => setCoverLetterText(e.target.value)}
                  placeholder="Your generated cover letter will appear here..."
                />
              </div>

            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>Select an internship to generate a tailored cover letter.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAVED APPLICATIONS */}
      {activeSubTab === 'saved' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={20} color="var(--accent-primary)" />
            <span>Saved Role-Specific Application Materials</span>
          </h3>

          {loadingSaved ? (
            <LoadingSpinner message="Loading saved applications..." />
          ) : savedApplications.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <FileText size={36} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
              <p>No customized applications saved yet.</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Customize a resume or cover letter above and click "Save to Applications Portfolio".
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {savedApplications.map((app) => (
                <div key={app.id} style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  border: '1px solid var(--border-card)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span className="badge badge-emerald">ATS: {app.ats_score}%</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{app.role_title}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <strong>{app.company}</strong> • Created: {new Date(app.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {app.tailored_resume_json?.fullMarkdownResume && (
                      <>
                        <button
                          onClick={() => {
                            downloadAsPdf(
                              `${app.company}_Resume`, 
                              app.tailored_resume_json.fullMarkdownResume, 
                              `${app.role_title} - ${app.company}`
                            );
                            notify.success('Downloading PDF resume...');
                          }}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem', gap: '0.25rem', color: '#f87171' }}
                          title="Download Resume as PDF"
                        >
                          <Download size={13} /> Resume PDF
                        </button>
                        <button
                          onClick={() => {
                            downloadAsDocx(
                              `${app.company}_Resume.docx`, 
                              app.tailored_resume_json.fullMarkdownResume, 
                              `${app.role_title} - ${app.company}`
                            );
                            notify.success('Downloaded Word document (.docx)!');
                          }}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem', gap: '0.25rem', color: '#60a5fa' }}
                          title="Download Resume as Word (.docx)"
                        >
                          <Download size={13} /> Resume DOCX
                        </button>
                      </>
                    )}

                    {app.cover_letter && (
                      <button
                        onClick={() => {
                          downloadAsPdf(
                            `${app.company}_Cover_Letter`, 
                            app.cover_letter, 
                            `Cover Letter - ${app.company}`
                          );
                          notify.success('Downloading PDF cover letter...');
                        }}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.6rem', gap: '0.25rem' }}
                        title="Download Cover Letter as PDF"
                      >
                        <Download size={13} /> Letter PDF
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteSavedApp(app.id)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.35rem 0.55rem', color: 'var(--accent-rose)' }}
                      title="Delete Saved Bundle"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
