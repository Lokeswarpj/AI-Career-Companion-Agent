import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EvaluationBenchmarkModal from '../components/EvaluationBenchmarkModal';
import { 
  Sparkles, 
  Target, 
  Briefcase, 
  MapPin, 
  Building, 
  ArrowRight, 
  Mic, 
  CheckCircle2, 
  Layers, 
  Info,
  Sliders,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FlaskConical
} from 'lucide-react';

export default function MatchingPage({ setActiveTab, setSelectedInternshipId }) {
  const notify = useNotification();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [topSkillCount, setTopSkillCount] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  async function loadRecommendations() {
    try {
      setLoading(true);
      const res = await api.getRecommendations();
      setRecommendations(res.recommendations || []);
      setTopSkillCount(res.topSkillOverlap || 0);
      if (res.recommendations && res.recommendations.length > 0) {
        setExpandedId(res.recommendations[0].internship.id);
      }
    } catch (err) {
      notify.error('Failed to calculate internship recommendations.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Job-Resume Matching Agent evaluating candidate profile against 180 knowledge base postings..." />;
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'inline-flex', marginBottom: '0.5rem' }}>
            <span className="badge badge-indigo">Milestone 2 • Job-Resume Matching Agent & RAG</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Job-Resume Matching & Ranking Board</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '750px' }}>
            Our multi-agent system compares your verified skills, projects, and academic background against required competencies, responsibilities, and work modes across the knowledge base.
          </p>
        </div>

        {/* Benchmark Suite Launch Button */}
        <button
          onClick={() => setIsBenchmarkModalOpen(true)}
          className="btn btn-primary"
          style={{ gap: '0.5rem', background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)' }}
        >
          <FlaskConical size={18} />
          <span>Launch Evaluation Benchmark Lab</span>
        </button>
      </div>

      {/* Formula & Multi-Factor Weight Transparency Card */}
      <div className="glass-panel" style={{
        padding: '1.5rem',
        marginBottom: '2.5rem',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.06) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sliders size={18} color="#818cf8" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Multi-Factor Weighted Compatibility Model</h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '1rem',
          fontSize: '0.85rem'
        }}>
          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: '#818cf8', fontWeight: 700 }}>40% Skill Match</span>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Required tech & preferred bonus</div>
          </div>
          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: '#22d3ee', fontWeight: 700 }}>25% Projects & Experience</span>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Responsibilities & project alignment</div>
          </div>
          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: '#34d399', fontWeight: 700 }}>15% Target Role Fit</span>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Domain & title keyword overlap</div>
          </div>
          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>10% Academic Fit</span>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Degree & graduation timeline</div>
          </div>
          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: '#f43f5e', fontWeight: 700 }}>10% Work Mode / Location</span>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Remote/Hybrid preference</div>
          </div>
        </div>
      </div>

      {/* Ranked Listings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {recommendations.map((rec, index) => {
          const item = rec.internship;
          const score = rec.matchScore;
          const matrix = rec.skillMatrix || { matchingSkills: [], moderateSkills: [], missingSkills: [], haveCount: 0, totalRequired: 0 };
          const breakdown = rec.breakdown || {};
          const explanation = rec.explanation || {};
          const isExpanded = expandedId === item.id;
          const scoreColor = score >= 80 ? '#10b981' : score >= 65 ? '#6366f1' : '#f59e0b';

          return (
            <div 
              key={item.id}
              className="glass-panel"
              style={{
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                borderLeft: `6px solid ${scoreColor}`
              }}
            >
              {/* Header with Rank & Score */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: index === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--bg-tertiary)',
                    color: index === 0 ? '#000000' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    #{index + 1}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>{item.source}</span>
                      <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{item.remote_type}</span>
                      {rec.isRagRetrieved && (
                        <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                          ⚡ RAG Vector Retrieved
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {item.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      <span><Building size={14} style={{ display: 'inline', marginRight: '3px' }} />{item.company}</span>
                      <span>•</span>
                      <span><MapPin size={14} style={{ display: 'inline', marginRight: '3px' }} />{item.location}</span>
                    </div>
                  </div>
                </div>

                {/* Match Score Meter */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.75rem 1.25rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-card)'
                }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: scoreColor }}>
                      {score}%
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Compatibility Fit
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills matched vs missing bar */}
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    SKILL COVERAGE ({matrix.haveCount || 0} of {matrix.totalRequired || 0} Requirements Met)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {(matrix.matchingSkills || []).map((m, i) => (
                      <span key={i} className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                        ✓ {m.skill}
                      </span>
                    ))}
                    {(matrix.moderateSkills || []).map((m, i) => (
                      <span key={i} className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                        ~ {m.skill}
                      </span>
                    ))}
                    {(matrix.missingSkills || []).map((m, i) => (
                      <span key={i} className="badge badge-rose" style={{ fontSize: '0.72rem' }}>
                        ✕ {m.skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    {item.stipend || 'Stipend available'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Duration: {item.duration || '3 Months'}
                  </div>
                </div>
              </div>

              {/* Multi-Factor Sub-Scores Progress Breakdown */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.75rem',
                fontSize: '0.75rem',
                padding: '0.75rem 1rem',
                background: 'rgba(99, 102, 241, 0.04)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Skills (40%): <strong>{breakdown.skillScore || 0}%</strong></div>
                  <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${breakdown.skillScore || 0}%`, background: '#818cf8' }} />
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Projects (25%): <strong>{breakdown.experienceAndProjectsScore || 80}%</strong></div>
                  <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${breakdown.experienceAndProjectsScore || 80}%`, background: '#22d3ee' }} />
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Role Fit (15%): <strong>{breakdown.roleScore || 100}%</strong></div>
                  <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${breakdown.roleScore || 100}%`, background: '#34d399' }} />
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Academic (10%): <strong>{breakdown.educationScore || 90}%</strong></div>
                  <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${breakdown.educationScore || 90}%`, background: '#fbbf24' }} />
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Location (10%): <strong>{breakdown.locationScore || 100}%</strong></div>
                  <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${breakdown.locationScore || 100}%`, background: '#f43f5e' }} />
                  </div>
                </div>
              </div>

              {/* AI Reasoning Section (Collapsible) */}
              {isExpanded && explanation && (
                <div style={{
                  padding: '1.25rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                    <Sparkles size={16} />
                    <span>AI Qualitative Fit Assessment & Reasoning</span>
                  </div>

                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>Why It Matches: </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{explanation.whyItMatches}</span>
                  </div>

                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>Potential Gaps / Concerns: </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{explanation.potentialConcerns}</span>
                  </div>

                  <div>
                    <span style={{ fontWeight: 700, color: '#22d3ee' }}>Recommended Action Roadmap: </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{explanation.recommendedPreparation}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="btn btn-outline btn-sm"
                  style={{ gap: '0.3rem', fontSize: '0.78rem' }}
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>{isExpanded ? 'Hide AI Reasoning' : 'View AI Reasoning & Roadmap'}</span>
                </button>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setSelectedInternshipId(item.id);
                      setActiveTab('skill-gap');
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '0.4rem' }}
                  >
                    <Sparkles size={14} color="#818cf8" />
                    <span>Deep Diagnostics</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedInternshipId(item.id);
                      setActiveTab('mock-interview');
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ gap: '0.4rem' }}
                  >
                    <Mic size={14} />
                    <span>Mock Interview</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Benchmark Suite Interactive Modal */}
      <EvaluationBenchmarkModal
        isOpen={isBenchmarkModalOpen}
        onClose={() => setIsBenchmarkModalOpen(false)}
      />

    </div>
  );
}
