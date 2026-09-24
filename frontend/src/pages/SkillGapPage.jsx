import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  BookOpen, 
  Mic, 
  Briefcase, 
  Building, 
  MapPin,
  HelpCircle,
  TrendingUp,
  FileCheck,
  Target,
  Layers,
  Clock,
  ExternalLink,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

export default function SkillGapPage({ selectedInternshipId, setSelectedInternshipId, setActiveTab }) {
  const notify = useNotification();
  const [loading, setLoading] = useState(true);
  const [internshipsList, setInternshipsList] = useState([]);
  const [gapData, setGapData] = useState(null);
  const [error, setError] = useState(null);
  const [activeGapCategory, setActiveGapCategory] = useState('critical'); // 'critical' | 'partial' | 'matching' | 'preferred' | 'experience'

  useEffect(() => {
    let isMounted = true;
    async function initPage() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getInternships();
        if (!isMounted) return;
        const list = res?.internships || [];
        setInternshipsList(list);

        const targetId = selectedInternshipId || list[0]?.id;
        if (targetId) {
          if (!selectedInternshipId && setSelectedInternshipId) {
            setSelectedInternshipId(targetId);
          }
          const analysis = await api.analyzeSkillGap(targetId);
          if (isMounted) {
            setGapData(analysis);
            setError(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Skill gap init error:', err);
          setError(err.message || 'Failed to load skill gap diagnostic.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initPage();
    return () => { isMounted = false; };
  }, []);

  async function loadGapAnalysis(id) {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.analyzeSkillGap(id);
      setGapData(res);
      setError(null);
    } catch (err) {
      console.error('Skill gap analysis error:', err);
      setError(err.message || 'Failed to analyze skill gaps for this internship.');
      notify.error('Failed to analyze skill gaps for this internship.');
    } finally {
      setLoading(false);
    }
  }

  const handleSelectInternship = (id) => {
    if (setSelectedInternshipId) setSelectedInternshipId(id);
    loadGapAnalysis(id);
  };

  const internship = gapData?.internship;
  const metrics = gapData?.metrics;
  const gaps = gapData?.gapClassifications;
  const roadmap = gapData?.actionableRoadmap || [];
  const aiInsights = gapData?.aiInsights;

  const readinessScore = metrics?.readinessScore || metrics?.matchPercentage || 0;
  const scoreColor = readinessScore >= 80 ? '#10b981' : readinessScore >= 60 ? '#6366f1' : '#f59e0b';

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: '1150px' }}>
      
      {/* Header & Target Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', marginBottom: '0.4rem' }}>
            <span className="badge badge-indigo">M3.1 Skill Gap Analysis Agent</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Skill-Gap Diagnostic & Learning Roadmap</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Multi-dimensional evaluation comparing candidate profile against technical and qualification prerequisites.
          </p>
        </div>

        {/* Dropdown to switch internship */}
        <div style={{ minWidth: '280px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
            Select Target Internship:
          </label>
          <select
            className="form-select"
            value={selectedInternshipId || (internshipsList[0]?.id || '')}
            onChange={(e) => handleSelectInternship(e.target.value)}
          >
            {internshipsList.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.company})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && !gapData && (
        <LoadingSpinner message="Skill Gap Analysis Agent is cross-referencing candidate profile against multi-dimensional role requirements..." />
      )}

      {error && !gapData && !loading && (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', margin: '2rem 0' }}>
          <AlertTriangle size={48} color="#f59e0b" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Unable to Complete Diagnostic</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
            {error || 'An unexpected error occurred while analyzing role requirements.'}
          </p>
          <button
            onClick={() => loadGapAnalysis(selectedInternshipId || internshipsList[0]?.id)}
            className="btn btn-primary"
            style={{ margin: '0 auto' }}
          >
            <Sparkles size={16} />
            <span>Retry Skill Gap Analysis</span>
          </button>
        </div>
      )}

      {loading && gapData && (
        <LoadingSpinner message="Re-evaluating position requirements..." />
      )}

      {gapData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Empty Profile / No Resume Uploaded Alert Banner */}
          {gapData.hasProfileSkills === false && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(234, 88, 12, 0.08) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.25rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <AlertTriangle size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.98rem' }}>
                    Fresh Account: No Resume or Profile Skills Detected Yet
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.15rem' }}>
                    You have not uploaded a resume or added skills to your profile yet. We are displaying baseline role prerequisites below. Upload your resume or add your skills to unlock personalized gap diagnostic and custom learning roadmaps!
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                {setActiveTab && (
                  <>
                    <button
                      onClick={() => setActiveTab('resume')}
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1.1rem', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Sparkles size={14} />
                      <span>Upload Resume</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="btn btn-outline"
                      style={{ padding: '0.5rem 1.1rem', fontSize: '0.86rem' }}
                    >
                      Edit Profile
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Target Role & Readiness Score Banner */}
          <div className="glass-panel" style={{ padding: '2rem', borderLeft: `6px solid ${scoreColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span className="badge badge-indigo">{internship?.source || 'Verified Partner'}</span>
                  <span className="badge badge-cyan">{internship?.remote_type || 'Hybrid'}</span>
                  <span className="badge badge-emerald">{internship?.stipend || 'Competitive'}</span>
                </div>
                <h2 style={{ fontSize: '1.7rem', fontWeight: 800 }}>{internship?.title}</h2>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                  <strong>{internship?.company}</strong> • {internship?.location}
                </div>
              </div>

              {/* Match Gauge */}
              <div style={{
                textAlign: 'center',
                padding: '1.1rem 1.6rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-card)',
                minWidth: '150px'
              }}>
                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: scoreColor, lineHeight: 1.1 }}>
                  {readinessScore}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginTop: '0.2rem' }}>
                  Readiness Score
                </div>
              </div>
            </div>

            {/* AI Insights & Assessment */}
            {aiInsights && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} />
                  <span>Agent Diagnostic Assessment</span>
                </div>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                  {aiInsights.summaryAssessment}
                </p>

                {aiInsights.top3ActionPriorities && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                    {aiInsights.top3ActionPriorities.map((item, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(99, 102, 241, 0.06)',
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.75rem 1rem',
                        fontSize: '0.85rem'
                      }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent-primary)', marginRight: '0.4rem' }}>#{idx + 1} Priority:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5-Category Gap Classification Tabs */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={20} color="var(--accent-primary)" />
                <span>5-Category Competency Breakdown</span>
              </h3>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  className={`btn ${activeGapCategory === 'critical' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
                  onClick={() => setActiveGapCategory('critical')}
                >
                  <XCircle size={14} style={{ marginRight: '0.3rem' }} />
                  Critical Missing ({metrics?.criticalMissingCount || 0})
                </button>
                <button
                  className={`btn ${activeGapCategory === 'partial' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
                  onClick={() => setActiveGapCategory('partial')}
                >
                  <AlertTriangle size={14} style={{ marginRight: '0.3rem' }} />
                  Partially Demonstrated ({metrics?.partiallyDemonstratedCount || 0})
                </button>
                <button
                  className={`btn ${activeGapCategory === 'matching' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
                  onClick={() => setActiveGapCategory('matching')}
                >
                  <CheckCircle2 size={14} style={{ marginRight: '0.3rem' }} />
                  Verified Matches ({metrics?.matchingCount || 0})
                </button>
                <button
                  className={`btn ${activeGapCategory === 'preferred' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
                  onClick={() => setActiveGapCategory('preferred')}
                >
                  <Sparkles size={14} style={{ marginRight: '0.3rem' }} />
                  Preferred Gaps ({metrics?.preferredGapsCount || 0})
                </button>
                <button
                  className={`btn ${activeGapCategory === 'experience' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
                  onClick={() => setActiveGapCategory('experience')}
                >
                  <Briefcase size={14} style={{ marginRight: '0.3rem' }} />
                  Experience & Qualifications ({metrics?.experienceGapsCount + metrics?.qualificationGapsCount || 0})
                </button>
              </div>
            </div>

            {/* Category View: Critical Missing */}
            {activeGapCategory === 'critical' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {gaps?.criticalMissing?.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <CheckCircle2 size={32} color="#10b981" style={{ marginBottom: '0.5rem' }} />
                    <p>No critical skill gaps! You satisfy all mandatory technical requirements for this role.</p>
                  </div>
                ) : (
                  gaps?.criticalMissing?.map((s, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(244, 63, 94, 0.05)',
                      border: '1px solid rgba(244, 63, 94, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge badge-rose">High Priority Gap</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.skill}</span>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={14} /> Est. {s.roadmap?.timeEstimate || '1-2 Weeks'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        {s.gapReason}
                      </p>
                      <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--accent-amber)', marginBottom: '0.3rem' }}>💡 Why {internship.company} Requires This:</div>
                        <div style={{ color: 'var(--text-secondary)' }}>{s.importance}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Category View: Partially Demonstrated */}
            {activeGapCategory === 'partial' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {gaps?.partiallyDemonstrated?.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>No adjacent skills in this bucket.</p>
                  </div>
                ) : (
                  gaps?.partiallyDemonstrated?.map((s, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(245, 158, 11, 0.05)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge badge-amber">Medium Priority</span>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{s.skill}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(Related skill found: {s.relatedSkillFound})</span>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={14} /> Est. {s.roadmap?.timeEstimate || '1-2 Weeks'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                        {s.gapReason}
                      </p>
                      <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '0.3rem' }}>🎯 Recommended Bridge Project:</div>
                        <div style={{ color: 'var(--text-secondary)' }}>{s.roadmap?.projectIdea}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Category View: Verified Matches */}
            {activeGapCategory === 'matching' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {gaps?.matching?.map((s, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.skill}</span>
                      <span className="badge badge-emerald">✓ Verified ({s.confidence}%)</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                      {s.evidence}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <strong>Role Context:</strong> {s.importance}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Category View: Preferred Gaps */}
            {activeGapCategory === 'preferred' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {gaps?.preferredGaps?.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>You satisfy all preferred / bonus skills for this posting.</p>
                  </div>
                ) : (
                  gaps?.preferredGaps?.map((s, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(99, 102, 241, 0.05)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge badge-indigo">Bonus Advantage</span>
                          <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>{s.skill}</span>
                        </div>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Est. {s.roadmap?.timeEstimate}</span>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{s.advantage}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Category View: Experience & Qualification Gaps */}
            {activeGapCategory === 'experience' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Briefcase size={16} /> Practical Experience Analysis
                </h4>
                {gaps?.experienceGaps?.length === 0 ? (
                  <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-sm)', color: '#10b981', fontSize: '0.9rem' }}>
                    ✓ Candidate project portfolio satisfies practical requirements for {internship.title}.
                  </div>
                ) : (
                  gaps?.experienceGaps?.map((eg, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.25rem' }}>{eg.area}: {eg.gap}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Action:</strong> {eg.recommendation}</div>
                    </div>
                  ))
                )}

                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <GraduationCap size={16} /> Academic & Degree Prerequisites
                </h4>
                {gaps?.qualificationGaps?.length === 0 ? (
                  <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-sm)', color: '#10b981', fontSize: '0.9rem' }}>
                    ✓ Candidate degree and academic timeline align with {internship.company}'s requirements.
                  </div>
                ) : (
                  gaps?.qualificationGaps?.map((qg, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.25rem' }}>Requirement: {qg.requirement}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><strong>Mitigation Strategy:</strong> {qg.mitigation}</div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>

          {/* Actionable Learning Roadmap Cards */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="#34d399" />
              <span>Personalized Actionable Learning Roadmap</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {roadmap.map((item, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  border: '1px solid var(--border-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span className={`badge ${item.priority === 'High' ? 'badge-rose' : item.priority === 'Medium' ? 'badge-amber' : 'badge-indigo'}`}>
                        {item.priority} Priority
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⏱ {item.timeEstimate}</span>
                    </div>

                    <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                      {item.skill}
                    </h4>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      <strong>Key Core Topics:</strong>
                      <ul style={{ paddingLeft: '1.2rem', marginTop: '0.3rem' }}>
                        {item.topics?.map((t, i) => (
                          <li key={i} style={{ marginBottom: '0.2rem' }}>{t}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.15)', fontSize: '0.82rem' }}>
                      <strong style={{ color: 'var(--accent-primary)' }}>🚀 Portfolio Project Idea:</strong>
                      <p style={{ marginTop: '0.2rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.projectIdea}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTAs Footer */}
          <div className="glass-panel" style={{
            padding: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%)'
          }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>Ready to close gaps and apply for {internship?.title}?</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Use our specialized M3.2 Customization Agent or launch a 5-category mock interview now.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setActiveTab('customizer');
                }}
                className="btn btn-primary"
                style={{ gap: '0.5rem' }}
              >
                <FileCheck size={18} />
                <span>Tailor Application Materials</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('mock-interview');
                }}
                className="btn btn-secondary"
                style={{ gap: '0.5rem' }}
              >
                <Mic size={18} />
                <span>Launch Mock Interview</span>
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
