import React, { useState, useEffect, useRef } from 'react';
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
  Check,
  Zap,
  Target,
  Layers,
  Cpu,
  Shield,
  MessageSquare
} from 'lucide-react';

export default function MockInterviewPage({ selectedInternshipId, setSelectedInternshipId, setActiveTab }) {
  const notify = useNotification();
  const [internshipsList, setInternshipsList] = useState([]);
  const [stage, setStage] = useState('config'); // 'config' | 'question' | 'evaluated' | 'completed'

  // Configuration settings
  const [roleTitle, setRoleTitle] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [interviewType, setInterviewType] = useState('Technical');
  const [questionCount, setQuestionCount] = useState(5);
  const [focusMode, setFocusMode] = useState('Balanced');
  const [loading, setLoading] = useState(false);

  // Pre-Interview Revision Guide state
  const [showPrepGuide, setShowPrepGuide] = useState(false);
  const [prepGuideData, setPrepGuideData] = useState(null);
  const [loadingPrepGuide, setLoadingPrepGuide] = useState(false);

  // Active Session state
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [userAnswer, setUserAnswer] = useState('');
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [isFinalQuestion, setIsFinalQuestion] = useState(false);
  const [finalScorecard, setFinalScorecard] = useState(null);
  const [showHint, setShowHint] = useState(false);

  // Speech Recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState(null);
  const baseTextRef = useRef('');
  const userAnswerRef = useRef(userAnswer);

  useEffect(() => {
    userAnswerRef.current = userAnswer;
  }, [userAnswer]);

  useEffect(() => {
    loadInternships();
    setupSpeechRecognition();
  }, []);

  useEffect(() => {
    if (internshipsList.length > 0) {
      if (selectedInternshipId) {
        const found = internshipsList.find(i => i.id === selectedInternshipId);
        if (found && !roleTitle) setRoleTitle(found.title);
      } else {
        setSelectedInternshipId(internshipsList[0].id);
        if (!roleTitle) setRoleTitle(internshipsList[0].title);
      }
    }
  }, [selectedInternshipId, internshipsList]);

  async function loadInternships() {
    try {
      const res = await api.getInternships();
      const list = res.internships || [];
      setInternshipsList(list);
      if (selectedInternshipId) {
        const found = list.find(i => i.id === selectedInternshipId);
        if (found) setRoleTitle(found.title);
      } else if (list.length > 0) {
        setSelectedInternshipId(list[0].id);
        setRoleTitle(list[0].title);
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
        let finalTranscripts = '';
        let interimTranscripts = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscripts += result[0].transcript + ' ';
          } else {
            interimTranscripts += result[0].transcript;
          }
        }

        const fullSpoken = (finalTranscripts + interimTranscripts).trim();
        const base = baseTextRef.current ? baseTextRef.current.trim() : '';
        const combined = base ? `${base} ${fullSpoken}` : fullSpoken;
        setUserAnswer(combined);
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
      baseTextRef.current = userAnswerRef.current;
      notify.info('Voice recording paused.');
    } else {
      try {
        baseTextRef.current = userAnswerRef.current;
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
      const targetInternship = internshipsList.find(i => i.id === selectedInternshipId) || (internshipsList.length > 0 ? internshipsList[0] : null);
      const targetId = targetInternship?.id || selectedInternshipId || null;
      const targetRole = roleTitle || targetInternship?.title || 'Full-Stack Software Engineer';

      const res = await api.startInterview({
        internshipId: targetId,
        roleTitle: targetRole,
        difficulty,
        interviewType,
        questionCount,
        focusMode
      });

      setSessionId(res.sessionId);
      setCurrentQuestion(res.firstQuestion);
      setTotalQuestions(res.totalQuestions || questionCount);
      setUserAnswer('');
      baseTextRef.current = '';
      setCurrentEvaluation(null);
      setIsFinalQuestion((res.totalQuestions || questionCount) <= 1);
      setShowPrepGuide(false);
      setStage('question');
      notify.success(`Mock interview initialized with ${res.totalQuestions || questionCount} role-tailored questions!`);
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
      setIsFinalQuestion(res.isFinished || (currentQuestion.questionNumber >= totalQuestions));
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
      baseTextRef.current = '';
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
    const demo = "In our recent campus project, we structured the application using a modular architecture with asynchronous non-blocking pipelines. We separated concerns between client presentation, business validation services, and persistent storage layers. For reliability and performance, we added database indexing, error boundaries, automated unit tests, and structured logging to monitor unexpected exceptions.";
    setUserAnswer(demo);
    baseTextRef.current = demo;
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: '1020px' }}>
      
      {/* -------------------------------------------------------------
          STAGE 1: CONFIGURATION SCREEN & REVISION TOPICS
         ------------------------------------------------------------- */}
      {stage === 'config' && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
              <span className="badge badge-indigo">
                <Sparkles size={13} style={{ marginRight: '0.35rem' }} />
                Adaptive Multi-Agent Interview Engine
              </span>
            </div>
            <h1 style={{ fontSize: '2.3rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              AI Role-Specific Mock Interview
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '680px', margin: '0.5rem auto 0 auto', fontSize: '0.92rem' }}>
              Simulate realistic, non-repetitive technical and behavioral interview loops tailored to your target role with voice dictation and 3D grading.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: showPrepGuide ? '1.1fr 0.9fr' : '1fr', gap: '2rem', maxWidth: showPrepGuide ? '1020px' : '680px', margin: '0 auto' }}>
            
            {/* Configuration Form Box */}
            <div className="glass-panel" style={{ padding: '2.25rem' }}>
              
              {/* Target Internship Selection */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                  Target Company & Internship
                </label>
                <select
                  className="form-select"
                  value={selectedInternshipId || (internshipsList.length > 0 ? internshipsList[0].id : '')}
                  onChange={(e) => {
                    setSelectedInternshipId(e.target.value);
                    const found = internshipsList.find(i => i.id === e.target.value);
                    if (found) setRoleTitle(found.title);
                  }}
                  style={{ fontSize: '0.9rem' }}
                >
                  {internshipsList.length === 0 ? (
                    <option value="">Loading curated internships...</option>
                  ) : (
                    internshipsList.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} — {item.company} ({item.domain || item.category || 'Tech'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Custom Role Title */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                  Target Role Title (Customizable)
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. AI & Machine Learning Engineering Intern"
                  style={{ fontSize: '0.9rem' }}
                />
              </div>

              {/* NEW: Number of Questions Selector */}
              <div className="form-group" style={{ marginBottom: '1.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem', margin: 0 }}>
                    Number of Interview Questions
                  </label>
                  <span className="badge badge-indigo" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                    {questionCount} Questions Selected
                  </span>
                </div>

                {/* Quick Preset Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.45rem', marginBottom: '0.65rem' }}>
                  {[
                    { count: 3, label: '3 (Quick)', desc: '~10 min' },
                    { count: 5, label: '5 (Standard)', desc: '~18 min' },
                    { count: 7, label: '7 (In-Depth)', desc: '~25 min' },
                    { count: 10, label: '10 (Full Loop)', desc: '~40 min' }
                  ].map((preset) => (
                    <button
                      key={preset.count}
                      type="button"
                      onClick={() => setQuestionCount(preset.count)}
                      style={{
                        padding: '0.55rem 0.35rem',
                        borderRadius: 'var(--radius-md)',
                        border: questionCount === preset.count ? '1px solid var(--accent-primary)' : '1px solid var(--border-card)',
                        background: questionCount === preset.count ? 'rgba(99, 102, 241, 0.22)' : 'var(--bg-secondary)',
                        color: questionCount === preset.count ? '#ffffff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{preset.label}</div>
                      <div style={{ fontSize: '0.68rem', color: questionCount === preset.count ? '#c7d2fe' : 'var(--text-muted)' }}>{preset.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Slider for fine adjustment (1 to 10) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.2rem 0' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>1</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
                    style={{ flex: 1, accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>10</span>
                </div>
              </div>

              {/* NEW: Interview Focus Mode Selector */}
              <div className="form-group" style={{ marginBottom: '1.35rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                  Interview Focus Mode
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { id: 'Balanced', label: '🎯 Balanced Full-Loop', hint: 'Tech, Resume, Architecture & STAR' },
                    { id: 'Technical Deep-Dive', label: '⚡ Technical Deep-Dive', hint: 'Algorithms, Internals & Concurrency' },
                    { id: 'System Architecture & Scenarios', label: '🏗️ Systems & Outages', hint: 'Scale Bottlenecks & Live Incidents' },
                    { id: 'Behavioral & STAR Leadership', label: '🤝 Behavioral & STAR', hint: 'Conflict, Deadlines & Communication' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setFocusMode(mode.id)}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: focusMode === mode.id ? '1px solid var(--accent-cyan)' : '1px solid var(--border-card)',
                        background: focusMode === mode.id ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-secondary)',
                        color: focusMode === mode.id ? '#ffffff' : 'var(--text-secondary)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{mode.label}</div>
                      <div style={{ fontSize: '0.68rem', color: focusMode === mode.id ? '#a5f3fc' : 'var(--text-muted)', marginTop: '0.1rem' }}>{mode.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Setting */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Difficulty Level</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      style={{
                        flex: 1,
                        padding: '0.55rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-card)',
                        background: difficulty === lvl ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        color: difficulty === lvl ? '#ffffff' : 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={() => loadPrepGuide(selectedInternshipId)}
                  disabled={loadingPrepGuide}
                  type="button"
                  className="btn btn-secondary"
                  style={{ gap: '0.4rem', justifyContent: 'center', fontSize: '0.88rem', padding: '0.65rem' }}
                >
                  <BookOpen size={16} />
                  <span>{loadingPrepGuide ? 'Generating Guide...' : showPrepGuide ? 'Refresh Revision Checklist' : 'View Pre-Interview Revision Guide'}</span>
                </button>

                <button
                  onClick={handleStartInterview}
                  disabled={loading}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', gap: '0.5rem', justifyContent: 'center', fontSize: '0.95rem' }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="spin-slow" />
                      <span>Synthesizing {questionCount} Role-Specific Questions...</span>
                    </>
                  ) : (
                    <>
                      <Mic size={19} />
                      <span>Start {questionCount}-Question Mock Interview</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Pre-Interview Revision Guide Drawer */}
            {showPrepGuide && prepGuideData && (
              <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', overflowY: 'auto', maxHeight: '580px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                    <BookOpen size={16} color="var(--accent-primary)" />
                    <span>Revision Checklist ({prepGuideData.company})</span>
                  </h3>
                  <button
                    onClick={() => setShowPrepGuide(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem' }}
                  >
                    ✕ Close
                  </button>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Target readiness: <strong>{prepGuideData.targetReadinessScore || 85}%</strong> • Focus topics:
                </div>

                {/* Technical Revision Topics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {prepGuideData.technicalRevisionTopics?.map((topic, i) => (
                    <div key={i} style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.84rem' }}>{topic.topic}</span>
                        <span className={`badge ${topic.priority === 'Urgent' ? 'badge-rose' : 'badge-indigo'}`} style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}>
                          {topic.estimatedHours}
                        </span>
                      </div>
                      <ul style={{ paddingLeft: '1.1rem', margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {topic.keyConceptsToRevise?.map((concept, cIdx) => (
                          <li key={cIdx}>{concept}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Behavioral Strategies */}
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.8rem' }}>
                  <strong style={{ color: '#10b981' }}>🎯 Behavioral STAR Strategy:</strong>
                  <p style={{ marginTop: '0.2rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
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
          {/* Header Progress Bar & Badges */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-indigo" style={{ fontWeight: 700, fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}>
                  Question {currentQuestion.questionNumber || 1} of {totalQuestions}
                </span>
                <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>
                  {currentQuestion.category || focusMode}
                </span>
                <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                  {difficulty}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {roleTitle}
              </div>
            </div>

            {/* Dynamic Progress Bar */}
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${((currentQuestion.questionNumber || 1) / totalQuestions) * 100}%`,
                background: 'linear-gradient(90deg, #6366f1, #06b6d4, #10b981)',
                borderRadius: '9999px',
                transition: 'width 0.35s ease-in-out'
              }} />
            </div>
          </div>

          {/* Question Box */}
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.75rem', borderLeft: '5px solid var(--accent-primary)' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, lineHeight: 1.55, marginBottom: '0.85rem' }}>
              "{currentQuestion.questionText}"
            </h2>

            {currentQuestion.commonPitfallsToAvoid && (
              <div style={{ fontSize: '0.82rem', color: 'var(--accent-amber)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
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
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: 0
                  }}
                >
                  <HelpCircle size={13} />
                  <span>{showHint ? 'Hide Hint' : 'Show Answer Guidance Hint'}</span>
                </button>
                {showHint && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.84rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-card)' }}>
                    💡 {currentQuestion.hint}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Answer Input Box */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.88rem', margin: 0 }}>
                Your Answer (Type or Dictate via Voice):
              </label>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className="btn btn-secondary btn-sm"
                  style={{
                    gap: '0.4rem',
                    background: isRecording ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-secondary)',
                    color: isRecording ? 'var(--accent-rose)' : 'var(--text-primary)',
                    borderColor: isRecording ? 'var(--accent-rose)' : 'var(--border-card)',
                    fontSize: '0.8rem'
                  }}
                >
                  {isRecording ? <MicOff size={14} className="spin-slow" /> : <Mic size={14} />}
                  <span>{isRecording ? 'Listening... Stop' : 'Voice Dictate'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickAnswer}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.8rem' }}
                  title="Fills a high-quality model student answer for instant demo evaluation"
                >
                  ⚡ Quick Demo Answer
                </button>
              </div>
            </div>

            <textarea
              className="form-textarea"
              rows={5}
              placeholder="Structure your answer with core principles, concrete examples, and trade-offs..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              style={{ fontSize: '0.92rem', lineHeight: 1.6 }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                onClick={handleSubmitAnswer}
                disabled={loading || !userAnswer.trim()}
                className="btn btn-primary btn-lg"
                style={{ gap: '0.5rem', padding: '0.65rem 1.35rem', fontSize: '0.9rem' }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="spin-slow" />
                    <span>Grading 3D Metrics...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Submit Answer ({currentQuestion.questionNumber || 1}/{totalQuestions})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          STAGE 3: REAL-TIME EVALUATION SCREEN
         ------------------------------------------------------------- */}
      {stage === 'evaluated' && currentEvaluation && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          <div className="glass-panel" style={{ padding: '2rem' }}>
            
            {/* Header Score Meter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                  Real-Time 3D Assessment
                </span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.25rem' }}>
                  AI Answer Feedback & Scoring
                </h2>
              </div>

              {/* 3D Dimension scores */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', padding: '0.5rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {currentEvaluation.score}/100
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Overall</div>
                </div>

                <div style={{ textAlign: 'center', padding: '0.5rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                    {currentEvaluation.technicalScore}%
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Technical Depth</div>
                </div>

                <div style={{ textAlign: 'center', padding: '0.5rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                    {currentEvaluation.communicationScore}%
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Communication</div>
                </div>

                <div style={{ textAlign: 'center', padding: '0.5rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                    {currentEvaluation.relevanceScore || 85}%
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Relevance</div>
                </div>
              </div>
            </div>

            {/* Constructive feedback */}
            <div style={{ background: 'var(--bg-secondary)', padding: '1.15rem', borderRadius: 'var(--radius-md)', marginBottom: '1.35rem', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.3rem' }}>
                DETAILED EVALUATION
              </div>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                {currentEvaluation.feedback}
              </p>
            </div>

            {/* Key points mentioned vs missed */}
            <div className="grid-2" style={{ marginBottom: '1.35rem', gap: '1rem' }}>
              <div style={{ padding: '0.95rem', background: 'rgba(16, 185, 129, 0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399', marginBottom: '0.4rem' }}>
                  ✓ Concepts You Articulated Well:
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', padding: 0, margin: 0 }}>
                  {(currentEvaluation.keyPointsMentioned || []).map((kp, idx) => (
                    <li key={idx}>• {kp}</li>
                  ))}
                </ul>
              </div>

              <div style={{ padding: '0.95rem', background: 'rgba(244, 63, 94, 0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fb7185', marginBottom: '0.4rem' }}>
                  ✕ Missed Points to Cover Next Time:
                </div>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.82rem', padding: 0, margin: 0 }}>
                  {(currentEvaluation.missedPoints || []).map((mp, idx) => (
                    <li key={idx}>• {mp}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Model answer summary */}
            {currentEvaluation.idealAnswerSummary && (
              <div style={{ padding: '1.1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)', marginBottom: '1.35rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.3rem' }}>
                  💡 MODEL ANSWER BLUEPRINT
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
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
                style={{ gap: '0.5rem', padding: '0.65rem 1.35rem', fontSize: '0.9rem' }}
              >
                <span>{isFinalQuestion ? 'Finalize & View Performance Scorecard' : 'Proceed to Next Question'}</span>
                <ArrowRight size={17} />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          STAGE 4: FINAL PERFORMANCE SCORECARD
         ------------------------------------------------------------- */}
      {stage === 'completed' && finalScorecard && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          {/* Top Scorecard Hero */}
          <div className="glass-panel" style={{
            padding: '2.5rem 2rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.12) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <div style={{
              width: '3.8rem',
              height: '3.8rem',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.85rem auto',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)'
            }}>
              <Award size={30} />
            </div>

            <h1 style={{ fontSize: '2.1rem', fontWeight: 900, marginBottom: '0.35rem' }}>
              Mock Interview Complete!
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              Performance summary across {totalQuestions} questions for <strong>{finalScorecard.roleTitle}</strong>
            </p>

            {/* Score Grid */}
            <div className="grid-4" style={{ marginTop: '1.75rem', maxWidth: '750px', margin: '1.75rem auto 0 auto', gap: '0.85rem' }}>
              <div style={{ padding: '0.9rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981' }}>
                  {finalScorecard.overallScore}/100
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OVERALL SCORE</div>
              </div>

              <div style={{ padding: '0.9rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-primary)' }}>
                  {finalScorecard.technicalScore}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TECHNICAL</div>
              </div>

              <div style={{ padding: '0.9rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-cyan)' }}>
                  {finalScorecard.communicationScore}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMMUNICATION</div>
              </div>

              <div style={{ padding: '0.9rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-amber)' }}>
                  {finalScorecard.relevanceScore}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>RELEVANCE</div>
              </div>
            </div>
          </div>

          {/* Strengths & Improvement Plan */}
          <div className="grid-2" style={{ gap: '1.25rem' }}>
            
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.85rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} />
                <span>Observed Key Strengths</span>
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none', fontSize: '0.88rem', padding: 0, margin: 0 }}>
                {(finalScorecard.strengths || []).map((s, idx) => (
                  <li key={idx}>• {s}</li>
                ))}
              </ul>
            </div>

            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.85rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} />
                <span>Targeted Action Recommendations</span>
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none', fontSize: '0.88rem', padding: 0, margin: 0 }}>
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
              style={{ gap: '0.5rem', fontSize: '0.9rem' }}
            >
              <RotateCcw size={17} />
              <span>Retake / Choose Another Role</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className="btn btn-primary btn-lg"
              style={{ gap: '0.5rem', fontSize: '0.9rem' }}
            >
              <History size={17} />
              <span>View Performance History</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
