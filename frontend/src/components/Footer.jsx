import React from 'react';
import { Sparkles, Shield, Cpu, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-secondary)',
      padding: '3rem 0 2rem 0',
      marginTop: '4rem'
    }}>
      <div className="container">
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '2rem',
          marginBottom: '2.5rem'
        }}>
          {/* Brand Info */}
          <div style={{ maxWidth: '380px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '1.8rem',
                height: '1.8rem',
                borderRadius: '6px',
                background: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={14} color="#ffffff" />
              </div>
              <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>CareerPulse AI</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              An AI-powered career companion agent designed for students. Empowering next-generation talent with intelligent resume screening, hybrid internship matching, skill gap discovery, and realistic Gemini mock interview coaching.
            </p>
          </div>

          {/* Quick Pillars */}
          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                CORE CAPABILITIES
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <li>✨ Gemini AI Resume Extraction</li>
                <li>🎯 Deterministic Hybrid Matching</li>
                <li>📊 Interactive Skill-Gap Matrix</li>
                <li>🎙️ Real-time Mock Interviewer</li>
              </ul>
            </div>

            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                INFOSYS DELIVERABLE
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <li>Infosys Springboard AI Track</li>
                <li>Full-Stack Monorepo Architecture</li>
                <li>Offline Heuristic AI Fallback</li>
                <li>Zero-Config SQLite Persistence</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            © 2026 CareerPulse AI. Built with Google Antigravity & Google Gemini API.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#10b981' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
              All AI Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
