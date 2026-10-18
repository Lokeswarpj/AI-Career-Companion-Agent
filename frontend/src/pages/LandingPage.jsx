import React from 'react';
import { 
  Sparkles, 
  Briefcase, 
  FileText, 
  Mic, 
  Target, 
  CheckCircle, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  TrendingUp,
  Zap,
  Award,
  Layers
} from 'lucide-react';

export default function LandingPage({ onGetStarted, onDemoLogin }) {
  return (
    <div style={{ paddingBottom: '3rem' }}>
      
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '5rem 0 4rem 0',
        textAlign: 'center',
        overflow: 'hidden'
      }}>
        {/* Background glow orbs */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '350px',
          background: 'radial-gradient(ellipse at center, rgba(255, 225, 124, 0.22) 0%, rgba(183, 198, 194, 0.12) 50%, rgba(255, 255, 255, 0) 80%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          
          {/* Badge with yellow dot indicator */}
          <div style={{ display: 'inline-flex', marginBottom: '1.5rem' }}>
            <div className="badge badge-indigo" style={{ padding: '0.45rem 1.1rem', fontSize: '0.82rem', background: '#ffffff', border: '1px solid rgba(23, 30, 25, 0.15)', color: '#171e19' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffe17c', display: 'inline-block', marginRight: '6px' }} />
              <span>Next-Gen Career Intelligence for Students</span>
            </div>
          </div>

          {/* Main Headline with 15-deg rotated golden yellow highlights */}
          <h1 style={{
            fontSize: 'clamp(2.4rem, 5vw, 4.2rem)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            maxWidth: '960px',
            margin: '0 auto 1.5rem auto',
            color: '#171e19'
          }}>
            Bridge the Gap Between Your <span className="highlight-rotate">Skills</span> and Your Dream <span className="highlight-rotate">Internship</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)',
            color: 'var(--text-secondary)',
            maxWidth: '740px',
            margin: '0 auto 2.5rem auto',
            lineHeight: 1.6
          }}>
            Empowering university students with deep Gemini AI resume screening, deterministic hybrid internship matching, prioritized skill-gap roadmaps, and real-time interactive mock interviews.
          </p>

          {/* Call to Actions */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '3.5rem'
          }}>
            <button 
              onClick={onGetStarted}
              className="btn btn-primary btn-lg"
              style={{ 
                gap: '0.75rem', 
                fontSize: '1.1rem', 
                padding: '0.9rem 2.25rem',
                background: '#ffe17c',
                color: '#171e19',
                fontWeight: 800,
                border: '1px solid rgba(23, 30, 25, 0.15)',
                boxShadow: '0 4px 18px rgba(255, 225, 124, 0.45)'
              }}
            >
              <span>Explore Platform & Get Started</span>
              <ArrowRight size={20} color="#171e19" />
            </button>
          </div>

          {/* Key Metric Highlights */}
          <div className="grid-4" style={{ marginTop: '2rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid rgba(23, 30, 25, 0.12)', background: '#ffffff' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#171e19' }}>100%</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 600 }}>
                Deterministic Scoring Transparency
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid rgba(23, 30, 25, 0.12)', background: '#ffffff' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#171e19' }}>6-Category</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 600 }}>
                AI Resume Skill Extraction
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid rgba(23, 30, 25, 0.12)', background: '#ffffff' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#171e19' }}>3-Tier</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 600 }}>
                Skill Gap Prioritization Matrix
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid rgba(23, 30, 25, 0.12)', background: '#ffffff' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#171e19' }}>Real-Time</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 600 }}>
                AI Mock Interview Evaluator
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section style={{ padding: '4rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              A Complete End-to-End Career Acceleration Engine
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              Everything a student needs to transition seamlessly from campus coursework to competitive industry internships.
            </p>
          </div>

          <div className="grid-3">
            
            {/* Card 1 */}
            <div className="glass-panel" style={{ padding: '2rem', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', border: '1px solid rgba(23, 30, 25, 0.12)', background: '#ffffff' }}>
              <div style={{
                width: '3.2rem',
                height: '3.2rem',
                borderRadius: '12px',
                background: '#171e19',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffe17c',
                marginBottom: '1.25rem',
                boxShadow: '0 4px 12px rgba(23, 30, 25, 0.15)'
              }}>
                <FileText size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#171e19', fontWeight: 800 }}>AI Resume Intelligence</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, flexGrow: 1 }}>
                Upload PDF or DOCX resumes. Gemini AI extracts structured competencies across 6 core categories, evaluates strengths and gaps, and delivers an instant SWOT analysis.
              </p>
              <div style={{ marginTop: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span className="badge badge-indigo">PDF / DOCX Parsing</span>
                <span className="badge badge-yellow">SWOT Analysis</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="glass-panel" style={{ padding: '2rem', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', border: '1px solid rgba(23, 30, 25, 0.12)', background: '#ffffff' }}>
              <div style={{
                width: '3.2rem',
                height: '3.2rem',
                borderRadius: '12px',
                background: '#ffe17c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#171e19',
                marginBottom: '1.25rem',
                boxShadow: '0 4px 12px rgba(255, 225, 124, 0.35)'
              }}>
                <Target size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#171e19', fontWeight: 800 }}>Hybrid Internship Matching</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, flexGrow: 1 }}>
                Combines deterministic mathematical algorithms (Skill overlap 45%, Role 25%, Location 15%, Background 15%) with Gemini AI qualitative explanations for unbiased transparency.
              </p>
              <div style={{ marginTop: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span className="badge badge-indigo">Formula Driven</span>
                <span className="badge badge-emerald">Ranked Fits</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="glass-panel" style={{ padding: '2rem', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', border: '1px solid rgba(23, 30, 25, 0.12)', background: '#ffffff' }}>
              <div style={{
                width: '3.2rem',
                height: '3.2rem',
                borderRadius: '12px',
                background: '#171e19',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffe17c',
                marginBottom: '1.25rem',
                boxShadow: '0 4px 12px rgba(23, 30, 25, 0.15)'
              }}>
                <TrendingUp size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#171e19', fontWeight: 800 }}>Actionable Skill-Gap Matrix</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, flexGrow: 1 }}>
                Instantly cross-references your student profile against any internship requirement. Visualizes Strong vs. Moderate vs. Missing skills with priority ratings and learning roadmaps.
              </p>
              <div style={{ marginTop: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span className="badge badge-yellow">Priority Matrix</span>
                <span className="badge badge-indigo">Learning Action</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="glass-panel" style={{ padding: '2rem', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', border: '1px solid rgba(23, 30, 25, 0.12)', background: '#ffffff' }}>
              <div style={{
                width: '3.2rem',
                height: '3.2rem',
                borderRadius: '12px',
                background: '#ffe17c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#171e19',
                marginBottom: '1.25rem',
                boxShadow: '0 4px 12px rgba(255, 225, 124, 0.35)'
              }}>
                <Mic size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#171e19', fontWeight: 800 }}>Interactive AI Mock Interview</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, flexGrow: 1 }}>
                Select difficulty (Beginner/Intermediate/Advanced) and practice 5 tailored technical or behavioral questions. Receive immediate AI grading across correctness, clarity, and relevance.
              </p>
              <div style={{ marginTop: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span className="badge badge-indigo">Voice / Text Input</span>
                <span className="badge badge-yellow">Model Answers</span>
              </div>
            </div>

            {/* Card 5 */}
            <div className="glass-panel" style={{ padding: '2rem', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', border: '1px solid rgba(23, 30, 25, 0.12)', background: '#ffffff' }}>
              <div style={{
                width: '3.2rem',
                height: '3.2rem',
                borderRadius: '12px',
                background: '#171e19',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffe17c',
                marginBottom: '1.25rem',
                boxShadow: '0 4px 12px rgba(23, 30, 25, 0.15)'
              }}>
                <Award size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#171e19', fontWeight: 800 }}>Interview Performance Analytics</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, flexGrow: 1 }}>
                Track session scores over time, review complete transcripts of previous answers, and identify recurring strengths and improvement areas to build confidence.
              </p>
              <div style={{ marginTop: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span className="badge badge-yellow">Score Trends</span>
                <span className="badge badge-emerald">Historical Logs</span>
              </div>
            </div>

            {/* Card 6 */}
            <div className="glass-panel" style={{ padding: '2rem', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', border: '1px solid rgba(23, 30, 25, 0.12)', background: '#ffffff' }}>
              <div style={{
                width: '3.2rem',
                height: '3.2rem',
                borderRadius: '12px',
                background: '#ffe17c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#171e19',
                marginBottom: '1.25rem',
                boxShadow: '0 4px 12px rgba(255, 225, 124, 0.35)'
              }}>
                <Sparkles size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', color: '#171e19', fontWeight: 800 }}>Context-Aware AI Companion</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, flexGrow: 1 }}>
                A personal 24/7 career mentor that understands your specific college degree, extracted resume skills, saved target internships, and mock interview test scores.
              </p>
              <div style={{ marginTop: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span className="badge badge-indigo">Student Memory</span>
                <span className="badge badge-yellow">Targeted Advice</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* User Journey Walkthrough */}
      <section style={{ padding: '4rem 0', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.75rem', color: '#171e19' }}>
              The 5-Step Path to Placement Success
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              How CareerPulse AI takes a student from blank resume to interview-ready.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                background: '#171e19',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>1</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: '#171e19', fontWeight: 700 }}>Build Profile & Resume</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Upload your resume and customize career aspirations.</p>
            </div>

            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                background: '#ffe17c',
                color: '#171e19',
                fontWeight: 800,
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>2</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: '#171e19', fontWeight: 700 }}>AI Resume Analysis</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Extract technical strengths and categorized competencies.</p>
            </div>

            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                background: '#171e19',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>3</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: '#171e19', fontWeight: 700 }}>Discover & Match</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Explore curated internship listings with transparent match scores.</p>
            </div>

            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                background: '#ffe17c',
                color: '#171e19',
                fontWeight: 800,
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>4</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: '#171e19', fontWeight: 700 }}>Analyze Skill Gaps</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Identify high-priority missing skills and study roadmaps.</p>
            </div>

            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                background: '#171e19',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>5</div>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: '#171e19', fontWeight: 700 }}>Live Mock Interview</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Practice role-specific questions and refine answers with AI feedback.</p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Bottom Banner (High-Impact Golden Yellow #ffe17c from Spec) */}
      <section style={{ padding: '4.5rem 0' }}>
        <div className="container">
          <div className="glass-panel" style={{
            padding: '3.5rem 2rem',
            textAlign: 'center',
            background: '#ffe17c',
            borderColor: 'rgba(23, 30, 25, 0.15)',
            boxShadow: '0 8px 32px rgba(255, 225, 124, 0.35)'
          }}>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '1rem', color: '#171e19' }}>
              Ready to Accelerate Your Career Preparation?
            </h2>
            <p style={{ color: '#272727', fontSize: '1.1rem', maxWidth: '640px', margin: '0 auto 2rem auto', fontWeight: 500 }}>
              Join thousands of university students landing premier technical internships with personalized AI guidance.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                onClick={onGetStarted}
                className="btn btn-dark btn-lg"
                style={{ padding: '0.9rem 2.5rem', fontWeight: 800, fontSize: '1.05rem', boxShadow: '0 4px 18px rgba(23, 30, 25, 0.3)' }}
              >
                Create Free Student Account
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
