import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Sparkles, 
  Briefcase, 
  FileText, 
  Mic, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Bookmark, 
  Award,
  Zap,
  Target,
  ExternalLink
} from 'lucide-react';

export default function DashboardPage({ setActiveTab, setSelectedInternshipId }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [resume, setResume] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [profileRes, resumeRes, recRes, savedRes, sessRes] = await Promise.all([
          api.getProfile().catch(() => ({ profile: null })),
          api.getLatestResume().catch(() => ({ resume: null })),
          api.getRecommendations().catch(() => ({ recommendations: [] })),
          api.getSavedInternships().catch(() => ({ saved: [] })),
          api.getInterviewSessions().catch(() => ({ sessions: [] }))
        ]);

        setProfile(profileRes.profile);
        setResume(resumeRes.resume);
        setRecommendations(recRes.recommendations || []);
        setSavedJobs(savedRes.saved || []);
        setSessions(sessRes.sessions || []);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Assembling your personalized career telemetry..." />;
  }

  // Calculate profile completeness score
  const completenessChecks = [
    { label: 'Basic Education & Degree', done: !!profile?.degree },
    { label: 'Target Job Roles Specified', done: (profile?.preferred_roles?.length || 0) > 0 },
    { label: 'Technical Skills Tagged', done: (profile?.technical_skills?.length || 0) > 0 },
    { label: 'Resume Uploaded & Screened', done: !!resume },
    { label: 'Completed Mock Interview', done: sessions.length > 0 }
  ];
  const completedCount = completenessChecks.filter(c => c.done).length;
  const readinessPercent = Math.round((completedCount / completenessChecks.length) * 100);

  // Average interview score
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const avgScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((acc, s) => acc + (s.overall_score || 0), 0) / completedSessions.length)
    : null;

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      
      {/* Welcome Banner */}
      <div className="glass-panel" style={{
        padding: '2.5rem',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Student Command Center
              </span>
              <span className="badge badge-emerald">Active Session</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Welcome back, <span className="gradient-text">{user?.full_name || 'Student'}</span> 👋
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '620px', fontSize: '0.95rem' }}>
              {profile?.degree 
                ? `${profile.degree} • ${profile.university || 'Student'}`
                : 'Complete your profile and upload your resume to unlock high-precision AI internship matching.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setActiveTab('mock-interview')}
              className="btn btn-primary"
              style={{ gap: '0.5rem' }}
            >
              <Mic size={18} />
              <span>Start AI Mock Interview</span>
            </button>
            <button 
              onClick={() => setActiveTab('matching')}
              className="btn btn-secondary"
              style={{ gap: '0.5rem' }}
            >
              <Sparkles size={18} color="#818cf8" />
              <span>View Ranked Matches</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
        
        {/* Metric 1: Readiness Score */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CAREER READINESS</span>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: readinessPercent >= 80 ? '#10b981' : '#818cf8' }}>
            {readinessPercent}%
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', marginTop: '0.75rem', overflow: 'hidden' }}>
            <div style={{ width: `${readinessPercent}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)', borderRadius: '3px' }} />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            {completedCount} of {completenessChecks.length} milestones completed
          </div>
        </div>

        {/* Metric 2: Matched Internships */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOP MATCHES</span>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>
              <Target size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
            {recommendations.length}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Highest match: <strong style={{ color: '#ffffff' }}>{recommendations[0]?.matchScore || 0}%</strong>
          </div>
          <div 
            onClick={() => setActiveTab('matching')}
            style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', marginTop: '0.4rem', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <span>Explore all matches</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Metric 3: Resume Skills Extracted */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>RESUME INTELLIGENCE</span>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <FileText size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            {resume ? (profile?.technical_skills?.length || 0) : '0'}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {resume ? 'Status: Screened by Gemini' : 'No resume uploaded yet'}
          </div>
          <div 
            onClick={() => setActiveTab('resume')}
            style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', marginTop: '0.4rem', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <span>{resume ? 'View SWOT breakdown' : 'Upload resume'}</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Metric 4: Mock Interview Avg */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>MOCK INTERVIEW AVG</span>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              <Award size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>
            {avgScore !== null ? `${avgScore}/100` : '—'}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {completedSessions.length} sessions completed
          </div>
          <div 
            onClick={() => setActiveTab('history')}
            style={{ fontSize: '0.78rem', color: 'var(--accent-secondary)', marginTop: '0.4rem', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <span>View performance logs</span>
            <ArrowRight size={14} />
          </div>
        </div>

      </div>

      {/* Main Two-Column Layout */}
      <div className="grid-2" style={{ alignItems: 'start', gap: '2rem' }}>
        
        {/* Left Column: Top Recommended Internships */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} color="#818cf8" />
              <span>Top Recommended for You</span>
            </h3>
            <button 
              onClick={() => setActiveTab('matching')}
              className="btn btn-outline btn-sm"
            >
              See All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recommendations.slice(0, 3).map((rec) => (
              <div 
                key={rec.internship.id}
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  borderLeft: `4px solid ${rec.matchScore >= 80 ? '#10b981' : rec.matchScore >= 60 ? '#6366f1' : '#f59e0b'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {rec.internship.title}
                    </h4>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {rec.internship.company} • {rec.internship.location} ({rec.internship.remote_type})
                    </div>
                  </div>
                  
                  {/* Score badge */}
                  <div style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: rec.matchScore >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                    border: `1px solid ${rec.matchScore >= 80 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                    color: rec.matchScore >= 80 ? '#34d399' : '#818cf8',
                    fontWeight: 800,
                    fontSize: '0.95rem'
                  }}>
                    {rec.matchScore}% Match
                  </div>
                </div>

                {/* Skills tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {rec.internship.required_skills_json.slice(0, 4).map((skill, i) => (
                    <span key={i} className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>
                      {skill}
                    </span>
                  ))}
                  {rec.internship.required_skills_json.length > 4 && (
                    <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>
                      +{rec.internship.required_skills_json.length - 4} more
                    </span>
                  )}
                </div>

                {/* Action CTA */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                    {rec.internship.stipend || 'Stipend available'}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setSelectedInternshipId(rec.internship.id);
                        setActiveTab('skill-gap');
                      }}
                      className="btn btn-outline btn-sm"
                    >
                      Skill Gap Matrix
                    </button>
                    <button
                      onClick={() => {
                        setSelectedInternshipId(rec.internship.id);
                        setActiveTab('mock-interview');
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      Mock Prep
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Readiness Checklist & Application Tracker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* Readiness Checklist */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={20} color="#10b981" />
              <span>Placement Preparation Checklist</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {completenessChecks.map((item, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: item.done ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-secondary)',
                    border: `1px solid ${item.done ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-card)'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: item.done ? '#10b981' : 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '0.7rem'
                    }}>
                      {item.done ? '✓' : ''}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: item.done ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: item.done ? 600 : 400 }}>
                      {item.label}
                    </span>
                  </div>

                  {!item.done && (
                    <button
                      onClick={() => {
                        if (index === 0 || index === 1 || index === 2) setActiveTab('profile');
                        else if (index === 3) setActiveTab('resume');
                        else setActiveTab('mock-interview');
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                    >
                      Complete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Saved Applications Quick Status */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bookmark size={20} color="#f59e0b" />
                <span>Application Tracker ({savedJobs.length})</span>
              </h3>
              <button onClick={() => setActiveTab('internships')} className="btn btn-outline btn-sm">
                Browse More
              </button>
            </div>

            {savedJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No saved internships yet. Browse the internship catalog to bookmark opportunities.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {savedJobs.slice(0, 3).map((item) => (
                  <div 
                    key={item.savedId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-card)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.internship.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.internship.company}</div>
                    </div>
                    <span className="badge badge-amber" style={{ textTransform: 'capitalize' }}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
