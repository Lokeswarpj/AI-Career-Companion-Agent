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
  TrendingUp
} from 'lucide-react';

export default function SkillGapPage({ selectedInternshipId, setSelectedInternshipId, setActiveTab }) {
  const notify = useNotification();
  const [loading, setLoading] = useState(true);
  const [internshipsList, setInternshipsList] = useState([]);
  const [evaluation, setEvaluation] = useState(null);

  useEffect(() => {
    loadAllInternships();
  }, []);

  useEffect(() => {
    if (selectedInternshipId) {
      loadEvaluation(selectedInternshipId);
    } else if (internshipsList.length > 0) {
      setSelectedInternshipId(internshipsList[0].id);
    }
  }, [selectedInternshipId, internshipsList]);

  async function loadAllInternships() {
    try {
      const res = await api.getInternships();
      setInternshipsList(res.internships || []);
      if (!selectedInternshipId && res.internships?.length > 0) {
        setSelectedInternshipId(res.internships[0].id);
      }
    } catch (err) {
      console.error('Failed to load list:', err);
    }
  }

  async function loadEvaluation(id) {
    try {
      setLoading(true);
      const res = await api.evaluateMatch(id);
      setEvaluation(res);
    } catch (err) {
      notify.error('Failed to evaluate skill gaps for this internship.');
    } finally {
      setLoading(false);
    }
  }

  if (loading && !evaluation) {
    return <LoadingSpinner message="Gemini AI is cross-referencing candidate profile against position requirements..." />;
  }

  const internship = evaluation?.internship;
  const matrix = evaluation?.skillMatrix;
  const explanation = evaluation?.explanation;
  const score = evaluation?.overallMatchScore || 0;
  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#6366f1' : '#f59e0b';

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: '1100px' }}>
      
      {/* Header & Target Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', marginBottom: '0.4rem' }}>
            <span className="badge badge-indigo">Skill Matrix & Gap Diagnostic</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Skill-Gap Analysis & Roadmap</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Direct comparison between your profile competencies and the selected internship's technical requirements.
          </p>
        </div>

        {/* Dropdown to switch internship */}
        <div style={{ minWidth: '260px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
            Select Target Internship:
          </label>
          <select
            className="form-select"
            value={selectedInternshipId || ''}
            onChange={(e) => setSelectedInternshipId(e.target.value)}
          >
            {internshipsList.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.company})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <LoadingSpinner message="Re-evaluating position requirements with Gemini AI..." />}

      {evaluation && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Target Role & Match Summary Banner */}
          <div className="glass-panel" style={{ padding: '2rem', borderLeft: `6px solid ${scoreColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span className="badge badge-indigo">{internship?.source}</span>
                  <span className="badge badge-cyan">{internship?.remote_type}</span>
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{internship?.title}</h2>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                  {internship?.company} • {internship?.location} • {internship?.stipend}
                </div>
              </div>

              {/* Match Gauge */}
              <div style={{
                textAlign: 'center',
                padding: '1rem 1.5rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-card)'
              }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: scoreColor }}>
                  {score}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Compatibility Score
                </div>
              </div>
            </div>

            {/* AI Match Qualitative Rationale */}
            {explanation && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} />
                  <span>Gemini AI Fit Analysis</span>
                </div>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                  {explanation.whyItMatches}
                </p>
                {explanation.potentialConcerns && (
                  <p style={{ color: 'var(--accent-amber)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                    <strong>Note:</strong> {explanation.potentialConcerns}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Skill Gap Comparison Table */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={20} color="#34d399" />
              <span>Skill Gap Breakdown Matrix</span>
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-card)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Required Competency</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Candidate Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Actionable Learning Pathway</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Matching / Strong */}
                  {(matrix?.matchingSkills || []).map((s, idx) => (
                    <tr key={`match-${idx}`} style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(16, 185, 129, 0.04)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {s.skill}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className="badge badge-emerald">✓ Strong Match</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className="badge badge-indigo">Low</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Verified in profile. Prepare 1-2 practical project anecdotes during technical rounds.
                      </td>
                    </tr>
                  ))}

                  {/* Moderate */}
                  {(matrix?.moderateSkills || []).map((s, idx) => (
                    <tr key={`mod-${idx}`} style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(245, 158, 11, 0.04)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {s.skill}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className="badge badge-amber">~ Familiar ({s.matchedWith})</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className="badge badge-amber">Medium</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Brush up on syntax nuances and standard API idioms before interviewing.
                      </td>
                    </tr>
                  ))}

                  {/* Missing */}
                  {(matrix?.missingSkills || []).map((s, idx) => (
                    <tr key={`miss-${idx}`} style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(244, 63, 94, 0.04)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {s.skill}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className="badge badge-rose">✕ Missing</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className="badge badge-rose">{s.priority} Priority</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#fb7185', fontSize: '0.85rem' }}>
                        {s.learningTrack}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="glass-panel" style={{
            padding: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)'
          }}>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Ready to test your readiness for this position?</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Practice 5 tailored technical & behavioral interview questions specifically configured for {internship?.title}.
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab('mock-interview');
              }}
              className="btn btn-primary"
              style={{ gap: '0.5rem' }}
            >
              <Mic size={18} />
              <span>Launch AI Mock Interview</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
