import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  Award, 
  TrendingUp, 
  HelpCircle, 
  Send, 
  Sliders, 
  RotateCcw, 
  History, 
  FileCheck,
  BookOpen,
  Clock,
  Check
} from 'lucide-react';

export default function MockInterviewPage({ selectedInternshipId, setSelectedInternshipId, setActiveTab }) {
  const notify = useNotification();
  const [internshipsList, setInternshipsList] = useState([]);
  const [stage, setStage] = useState('config'); // 'config' | 'question' | 'evaluated' | 'completed'

  // Configuration settings
  const [roleTitle, setRoleTitle] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [interviewType, setInterviewType] = useState('Technical');
  const [loading, setLoading] = useState(false);

  // Pre-Interview Revision Guide state
  const [showPrepGuide, setShowPrepGuide] = useState(false);
  const [prepGuideData, setPrepGuideData] = useState(null);
  const [loadingPrepGuide, setLoadingPrepGuide] = useState(false);

  // Active Session state
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [isFinalQuestion, setIsFinalQuestion] = useState(false);
  const [finalScorecard, setFinalScorecard] = useState(null);
  const [showHint, setShowHint] = useState(false);

  // Speech Recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState(null);

  useEffect(() => {
    loadInternships();
    setupSpeechRecognition();
  }, []);

  async function loadInternships() {
    try {
      const res = await api.getInternships();
      setInternshipsList(res.internships || []);
      if (selectedInternshipId) {
        const found = res.internships.find(i => i.id === selectedInternshipId);
        if (found) setRoleTitle(found.title);
      } else if (res.internships?.length > 0) {
        setSelectedInternshipId(res.internships[0].id);
        setRoleTitle(res.internships[0].title);
      }
    } catch (err) {}
  }

  async function loadPrepGuide(id) {
    if (!id) return;
    try {
      setLoadingPrepGuide(true);
      const res = await api.getPrepGuide(id);
      setPrepGuideData(res);
      setShowPrepGuide(true);
    } catch (err) {
      notify.error('Failed to load pre-interview prep guide.');
    } finally {
      setLoadingPrepGuide(false);
    }
  }

  function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserAnswer(prev => prev ? `${prev} ${transcript}` : transcript);
      };

      rec.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognitionInstance(rec);
    }
  }

  const toggleRecording = () => {
    if (!recognitionInstance) {
      notify.info('Speech recognition is not supported in this browser. Please type your response.');
      return;
    }
    if (isRecording) {
      recognitionInstance.stop();
      setIsRecording(false);
      notify.info('Voice recording paused.');
    } else {
      try {
        recognitionInstance.start();
        setIsRecording(true);
        notify.success('Microphone listening! Speak clearly...');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleStartInterview = async () => {
    setLoading(true);
    try {
      const res = await api.startInterview({
        internshipId: selectedInternshipId,
        roleTitle: roleTitle || 'Full-Stack Software Engineer',
        difficulty,
        interviewType
      });

      setSessionId(res.sessionId);
      setCurrentQuestion(res.firstQuestion);
      setUserAnswer('');
      setCurrentEvaluation(null);
      setIsFinalQuestion(res.totalQuestions <= 1);
      setShowPrepGuide(false);
      setStage('question');
      notify.success('Mock interview initialized with 5 categorized questions!');
    } catch (err) {
      notify.error(err.message || 'Failed to start interview.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      notify.error('Please enter or dictate an answer before submitting.');
      return;
    }

    if (isRecording && recognitionInstance) {
      recognitionInstance.stop();
      setIsRecording(false);
    }

    setLoading(true);
    try {
      const res = await api.submitAnswer({
        sessionId,
        questionNumber: currentQuestion.questionNumber,
        userAnswer: userAnswer.trim()
      });

      setCurrentEvaluation(res.evaluation);
      setIsFinalQuestion(res.isFinished);
      if (res.nextQuestion) {
        setCurrentQuestion(res.nextQuestion);
      }
      setStage('evaluated');
      notify.success('Answer evaluated with 3-dimensional scoring!');
    } catch (err) {
      notify.error(err.message || 'Failed to evaluate answer.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (isFinalQuestion) {
      handleCompleteSession();
    } else {
      setUserAnswer('');
      setCurrentEvaluation(null);
      setShowHint(false);
      setStage('question');
    }
  };

  const handleCompleteSession = async () => {
    setLoading(true);
    try {
      const res = await api.completeInterview(sessionId);
      setFinalScorecard(res.scorecard);
      setStage('completed');

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      notify.success('Mock interview session finished and performance saved!');
    } catch (err) {
      notify.error('Failed to summarize interview session.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAnswer = () => {
    setUserAnswer(
      "In our recent campus project, we structured the application using a React single-page frontend connected to an Express REST API with SQLite database persistence. We applied asynchronous async/await patterns for API calls and implemented JWT token authentication with bcrypt password hashing. For performance optimization, we indexed high-frequency database queries and modularized state management."
    );
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: '1000px' }}>
      
      {/* -------------------------------------------------------------
          STAGE 1: CONFIGURATION SCREEN & REVISION TOPICS
         ------------------------------------------------------------- */}
      {stage === 'config' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
              <span className="badge badge-indigo">M3.3 Interview Preparation Agent</span>
            </div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800 }}>AI Technical Mock Interview</h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0.5rem auto 0 auto', fontSize: '0.95rem' }}>
              Role-specific 5-category interview simulator (Technical, Resume-based, Project-based, Scenario, and Behavioral) with real-time 3D grading.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: showPrepGuide ? '1fr 1fr' : '1fr', gap: '2rem', maxWidth: showPrepGuide ? '1000px' : '650px', margin: '0 auto' }}>
            
            {/* Configuration Form Box */}
            <div className="glass-panel" style={{ padding: '2.5rem' }}>
              
              {/* Internship Selection */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Select Target Internship</label>
                <select
                  className="form-select"
                  value={selectedInternshipId || ''}
                  onChange={(e) => {
                    setSelectedInternshipId(e.target.value);
                    const found = internshipsList.find(i => i.id === e.target.value);
                    if (found) setRoleTitle(found.title);
                  }}
                >
                  {internshipsList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} — {item.company}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Role Title */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Interview Role Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. AI & Machine Learning Engineering Intern"
                />
              </div>

              {/* Difficulty Setting */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Difficulty Level</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      style={{
                        flex: 1,
                        padding: '0.65rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-card)',
                        background: difficulty === lvl ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        color: difficulty === lvl ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Format Notice */}
              <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: '1.5rem', fontSize: '0.82rem' }}>
                <strong style={{ color: 'var(--accent-primary)' }}>5 Categorized Question Types:</strong>
                <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  1. Technical • 2. Resume-Based • 3. Project-Based • 4. Role Scenario • 5. HR/Behavioral
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => loadPrepGuide(selectedInternshipId)}
                  disabled={loadingPrepGuide}
                  type="button"
                  className="btn btn-secondary"
                  style={{ gap: '0.4rem', justifyContent: 'center' }}
                >
                  <BookOpen size={16} />
                  <span>{loadingPrepGuide ? 'Loading Guide...' : showPrepGuide ? 'Refresh Revision Topics' : 'View Pre-Interview Revision Guide'}</span>
                </button>

                <button
                  onClick={handleStartInterview}
                  disabled={loading}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', gap: '0.5rem', justifyContent: 'center' }}
                >
                  <Mic size={20} />
                  <span>{loading ? 'Generating Categorized Questions...' : 'Start 5-Question Mock Interview'}</span>
                </button>
              </div>

            </div>

            {/* Pre-Interview Revision Guide Drawer */}
            {showPrepGuide && prepGuideData && (
              <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', maxHeight: '560px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BookOpen size={18} color="var(--accent-primary)" />
                    <span>Revision Topics Checklist</span>
                  </h3>
                  <button
                    onClick={() => setShowPrepGuide(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    ✕ Close
                  </button>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Prioritized checklist based on identified skill gaps for <strong>{prepGuideData.company}</strong>.
                </div>

                {/* Technical Revision Topics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {prepGuideData.technicalRevisionTopics?.map((topic, i) => (
                    <div key={i} style={{ background: 'var(--bg-secondary)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{topic.topic}</span>
                        <span className={`badge ${topic.priority === 'Urgent' ? 'badge-rose' : 'badge-indigo'}`} style={{ fontSize: '0.7rem' }}>
                          {topic.estimatedHours}
                        </span>
                      </div>
                      <ul style={{ paddingLeft: '1.1rem', margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {topic.keyConceptsToRevise?.map((concept, cIdx) => (
                          <li key={cIdx}>{concept}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Behavioral Strategies */}
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.82rem' }}>
                  <strong style={{ color: '#10b981' }}>🎯 Behavioral STAR Strategy:</strong>
                  <p style={{ marginTop: '0.2rem', color: 'var(--text-secondary)' }}>
                    {prepGuideData.behavioralStrategies?.[0]?.tip || 'Structure your stories: Situation (20%), Task (10%), Action (50%), Result (20%).'}
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          STAGE 2: QUESTION & DICTATION SCREEN
         ------------------------------------------------------------- */}
      {stage === 'question' && currentQuestion && (
        <div>
          {/* Header Progress */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-indigo">
                Question {currentQuestion.questionNumber || 1} of 5
              </span>
              <span className="badge badge-cyan">
                Category: {currentQuestion.category || interviewType}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {roleTitle} ({difficulty})
            </div>
          </div>

          {/* Question Box */}
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', borderLeft: '5px solid var(--accent-primary)' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.5, marginBottom: '1rem' }}>
              "{currentQuestion.questionText}"
            </h2>

            {currentQuestion.commonPitfallsToAvoid && (
              <div style={{ fontSize: '0.84rem', color: 'var(--accent-amber)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <AlertCircle size={14} />
                <span><strong>Pitfall to Avoid:</strong> {currentQuestion.commonPitfallsToAvoid}</span>
              </div>
            )}

            {currentQuestion.hint && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <HelpCircle size={14} />
                  <span>{showHint ? 'Hide Hint' : 'Show Answer Hint'}</span>
                </button>
                {showHint && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                    💡 {currentQuestion.hint}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Answer Input Box */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Your Response (Type or Dictate via Voice):</label>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className="btn btn-secondary btn-sm"
                  style={{
                    gap: '0.4rem',
                    background: isRecording ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-secondary)',
                    color: isRecording ? 'var(--accent-rose)' : 'var(--text-primary)',
                    borderColor: isRecording ? 'var(--accent-rose)' : 'var(--border-card)'
                  }}
                >
                  {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                  <span>{isRecording ? 'Stop Recording' : 'Voice Dictate'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickAnswer}
                  className="btn btn-outline btn-sm"
                  title="Fills a high-quality model student answer for instant demo evaluation"
                >
                  ⚡ Quick Demo Answer
                </button>
              </div>
            </div>

            <textarea
              className="form-textarea"
              rows={6}
              placeholder="Structure your answer with clear technical concepts, practical examples, or the STAR framework..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              style={{ fontSize: '0.95rem', lineHeight: 1.6 }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', gap: '1rem' }}>
              <button
                onClick={handleSubmitAnswer}
                disabled={loading || !userAnswer.trim()}
                className="btn btn-primary btn-lg"
                style={{ gap: '0.5rem' }}
              >
                <Send size={18} />
                <span>{loading ? 'Evaluating 3D Scoring...' : 'Submit Answer for AI Grading'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          STAGE 3: REAL-TIME EVALUATION SCREEN
         ------------------------------------------------------------- */}
      {stage === 'evaluated' && currentEvaluation && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="glass-panel" style={{ padding: '2rem' }}>
            
            {/* Header Score Meter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="badge badge-emerald">Real-Time Evaluation</span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  AI Answer Assessment
                </h2>
              </div>

              {/* 3D Dimension scores */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', padding: '0.5rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {currentEvaluation.score}/100
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Overall</div>
                </div>

                <div style={{ textAlign: 'center', padding: '0.5rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                    {currentEvaluation.technicalScore}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Technical Depth</div>
                </div>

                <div style={{ textAlign: 'center', padding: '0.5rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                    {currentEvaluation.communicationScore}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Communication</div>
                </div>

                <div style={{ textAlign: 'center', padding: '0.5rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                    {currentEvaluation.relevanceScore || 85}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Relevance</div>
                </div>
              </div>
            </div>

            {/* Constructive feedback */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.35rem' }}>
                FEEDBACK
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {currentEvaluation.feedback}
              </p>
            </div>

            {/* Key points mentioned vs missed */}
            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', marginBottom: '0.5rem' }}>
                  ✓ Concepts You Articulated Well:
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', padding: 0 }}>
                  {(currentEvaluation.keyPointsMentioned || []).map((kp, idx) => (
                    <li key={idx}>• {kp}</li>
                  ))}
                </ul>
              </div>

              <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fb7185', marginBottom: '0.5rem' }}>
                  ✕ Missed Concepts to Include Next Time:
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', padding: 0 }}>
                  {(currentEvaluation.missedPoints || []).map((mp, idx) => (
                    <li key={idx}>• {mp}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Model answer summary */}
            {currentEvaluation.idealAnswerSummary && (
              <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.35rem' }}>
                  💡 MODEL ANSWER BLUEPRINT
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {currentEvaluation.idealAnswerSummary}
                </p>
              </div>
            )}

            {/* Next Action Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleNextQuestion}
                disabled={loading}
                className="btn btn-primary btn-lg"
                style={{ gap: '0.5rem' }}
              >
                <span>{isFinalQuestion ? 'Finalize & View Comprehensive Scorecard' : 'Proceed to Next Question'}</span>
                <ArrowRight size={18} />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          STAGE 4: FINAL PERFORMANCE SCORECARD
         ------------------------------------------------------------- */}
      {stage === 'completed' && finalScorecard && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Top Scorecard Hero */}
          <div className="glass-panel" style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.12) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)'
            }}>
              <Award size={32} />
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.4rem' }}>
              Mock Interview Complete!
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Performance summary for <strong>{finalScorecard.roleTitle}</strong>
            </p>

            {/* Score Grid */}
            <div className="grid-4" style={{ marginTop: '2rem', maxWidth: '750px', margin: '2rem auto 0 auto' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#10b981' }}>
                  {finalScorecard.overallScore}/100
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>OVERALL SCORE</div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-primary)' }}>
                  {finalScorecard.technicalScore}%
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TECHNICAL</div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                  {finalScorecard.communicationScore}%
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMMUNICATION</div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-amber)' }}>
                  {finalScorecard.relevanceScore}%
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>RELEVANCE</div>
              </div>
            </div>
          </div>

          {/* Strengths & Improvement Plan */}
          <div className="grid-2">
            
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={20} />
                <span>Observed Key Strengths</span>
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', listStyle: 'none', fontSize: '0.9rem', padding: 0 }}>
                {(finalScorecard.strengths || []).map((s, idx) => (
                  <li key={idx}>• {s}</li>
                ))}
              </ul>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={20} />
                <span>Targeted Action Recommendations</span>
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', listStyle: 'none', fontSize: '0.9rem', padding: 0 }}>
                {(finalScorecard.recommendations || []).map((r, idx) => (
                  <li key={idx}>• {r}</li>
                ))}
              </ul>
            </div>

          </div>

          {/* Bottom Navigation CTAs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setStage('config');
                setFinalScorecard(null);
              }}
              className="btn btn-secondary btn-lg"
              style={{ gap: '0.5rem' }}
            >
              <RotateCcw size={18} />
              <span>Retake / Choose Another Role</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className="btn btn-primary btn-lg"
              style={{ gap: '0.5rem' }}
            >
              <History size={18} />
              <span>View Performance History</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
