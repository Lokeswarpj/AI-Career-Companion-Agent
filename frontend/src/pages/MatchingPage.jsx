import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
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
  Sliders
} from 'lucide-react';

export default function MatchingPage({ setActiveTab, setSelectedInternshipId }) {
  const notify = useNotification();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [topSkillCount, setTopSkillCount] = useState(0);

  useEffect(() => {
    loadRecommendations();
  }, []);

  async function loadRecommendations() {
    try {
      setLoading(true);
      const res = await api.getRecommendations();
      setRecommendations(res.recommendations || []);
      setTopSkillCount(res.topSkillOverlap || 0);
    } catch (err) {
      notify.error('Failed to calculate internship recommendations.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Calculating deterministic hybrid match scores across all active listings..." />;
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', marginBottom: '0.5rem' }}>
          <span className="badge badge-indigo">Deterministic & Semantic Intelligence</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>AI Hybrid Match & Ranking Board</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '750px' }}>
          Our hybrid algorithm evaluates your profile skills against required internship competencies, target role alignment, location preferences, and academic readiness.
        </p>
      </div>

      {/* Formula & Weight Transparency Card */}
      <div className="glass-panel" style={{
        padding: '1.5rem',
        marginBottom: '2.5rem',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.06) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sliders size={18} color="#818cf8" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Weighted Deterministic Scoring Formula</h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          fontSize: '0.85rem'
        }}>
          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: '#818cf8', fontWeight: 700 }}>45% Skill Overlap</span>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Exact & partial technology match</div>
          </div>
          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: '#22d3ee', fontWeight: 700 }}>25% Target Role Fit</span>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Title keyword & domain relevance</div>
          </div>
          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: '#34d399', fontWeight: 700 }}>15% Work Mode / Location</span>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Remote/Hybrid preference match</div>
          </div>
          <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>15% Academic Background</span>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Degree, year & coursework alignment</div>
          </div>
        </div>
      </div>

      {/* Ranked Listings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {recommendations.map((rec, index) => {
          const item = rec.internship;
          const score = rec.matchScore;
          const matrix = rec.skillMatrix;
          const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#6366f1' : '#f59e0b';

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
                    width: '36px',
                    height: '36px',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>{item.source}</span>
                      <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{item.remote_type}</span>
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
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: scoreColor }}>
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
                    SKILL COVERAGE ({matrix.haveCount} of {matrix.totalRequired} Requirements Met)
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {matrix.matchingSkills.map((m, i) => (
                      <span key={i} className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                        ✓ {m.skill}
                      </span>
                    ))}
                    {matrix.moderateSkills.map((m, i) => (
                      <span key={i} className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                        ~ {m.skill}
                      </span>
                    ))}
                    {matrix.missingSkills.map((m, i) => (
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

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <button
                  onClick={() => {
                    setSelectedInternshipId(item.id);
                    setActiveTab('skill-gap');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '0.4rem' }}
                >
                  <Sparkles size={14} color="#818cf8" />
                  <span>Deep Skill-Gap Diagnostics</span>
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
                  <span>Start Mock Interview</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
