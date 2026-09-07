import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { 
  History, 
  Award, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  FileText, 
  Mic, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function InterviewHistoryPage({ setActiveTab }) {
  const notify = useNotification();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionTranscript, setSelectedSessionTranscript] = useState(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      setLoading(true);
      const res = await api.getInterviewSessions();
      setSessions(res.sessions || []);
    } catch (err) {
      notify.error('Failed to load interview history.');
    } finally {
      setLoading(false);
    }
  }

  const handleViewTranscript = async (sessionId) => {
    setLoadingTranscript(true);
    try {
      const res = await api.getSessionTranscript(sessionId);
      setSelectedSessionTranscript(res);
    } catch (err) {
      notify.error('Failed to load session transcript.');
    } finally {
      setLoadingTranscript(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Retrieving historical interview telemetry..." />;
  }

  const completed = sessions.filter(s => s.status === 'completed');
  const avgOverall = completed.length > 0 
    ? Math.round(completed.reduce((a, b) => a + (b.overall_score || 0), 0) / completed.length) 
    : 0;
  const avgTech = completed.length > 0 
    ? Math.round(completed.reduce((a, b) => a + (b.technical_score || 0), 0) / completed.length) 
    : 0;
  const avgComm = completed.length > 0 
    ? Math.round(completed.reduce((a, b) => a + (b.communication_score || 0), 0) / completed.length) 
    : 0;

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: '1050px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Interview Performance Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Historical record of your mock interview attempts, scoring progressions, and AI feedback diagnostics.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('mock-interview')}
          className="btn btn-primary"
          style={{ gap: '0.5rem' }}
        >
          <Mic size={18} />
          <span>New Mock Session</span>
        </button>
      </div>

      {/* Aggregate Metrics Bar */}
      <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            TOTAL SESSIONS
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-primary)', marginTop: '0.25rem' }}>
            {completed.length}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            AVG OVERALL SCORE
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#10b981', marginTop: '0.25rem' }}>
            {avgOverall > 0 ? `${avgOverall}/100` : '—'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            TECHNICAL MASTERY
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-cyan)', marginTop: '0.25rem' }}>
            {avgTech > 0 ? `${avgTech}%` : '—'}
          </div>
        </div>
      </div>

      {/* Session History List */}
      {sessions.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <History size={48} style={{ margin: '0 auto 1rem auto', color: 'var(--text-muted)' }} />
          <h3>No mock interview sessions recorded yet</h3>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', maxWidth: '480px', margin: '0.5rem auto 1.5rem auto' }}>
            Take your first 5-question AI mock interview to receive real-time technical scoring and model answer blueprints.
          </p>
          <button
            onClick={() => setActiveTab('mock-interview')}
            className="btn btn-primary"
            style={{ gap: '0.5rem' }}
          >
            <Mic size={18} />
            <span>Launch First Mock Session</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {sessions.map((sess) => {
            const scoreColor = sess.overall_score >= 80 ? '#10b981' : sess.overall_score >= 60 ? '#6366f1' : '#f59e0b';
            return (
              <div
                key={sess.id}
                className="glass-panel"
                style={{
                  padding: '1.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  borderLeft: `5px solid ${scoreColor}`
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>{sess.interview_type}</span>
                    <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{sess.difficulty}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={12} /> {new Date(sess.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{sess.role_title}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {sess.company ? `${sess.company} • ` : ''}Status: <span style={{ color: sess.status === 'completed' ? '#10b981' : '#f59e0b', textTransform: 'capitalize' }}>{sess.status}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  {sess.status === 'completed' && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: scoreColor }}>
                        {sess.overall_score}/100
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Score</div>
                    </div>
                  )}

                  <button
                    onClick={() => handleViewTranscript(sess.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '0.4rem' }}
                  >
                    <FileText size={16} />
                    <span>View Transcript</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transcript Detail Modal */}
      <Modal
        isOpen={!!selectedSessionTranscript}
        onClose={() => setSelectedSessionTranscript(null)}
        title={`Session Transcript: ${selectedSessionTranscript?.session?.role_title || 'Mock Interview'}`}
        maxWidth="800px"
      >
        {selectedSessionTranscript && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Summary Stats */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  Overall Score: {selectedSessionTranscript.session.overall_score}/100
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Technical: {selectedSessionTranscript.session.technical_score}% | Communication: {selectedSessionTranscript.session.communication_score}%
                </div>
              </div>
              <span className="badge badge-emerald">Verified</span>
            </div>

            {/* Questions Transcript */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(selectedSessionTranscript.exchanges || []).map((ex) => (
                <div key={ex.id} style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-primary)' }}>
                      Q{ex.question_number}: {ex.question_text}
                    </div>
                    <span className="badge badge-emerald">{ex.score}/100</span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                    Candidate: "{ex.user_answer || 'No response recorded'}"
                  </div>

                  <div style={{ fontSize: '0.85rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.05)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                    AI Feedback: {ex.feedback}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
}
