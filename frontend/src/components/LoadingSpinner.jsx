import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export default function LoadingSpinner({ message = 'Analyzing with Gemini AI...', fullScreen = false }) {
  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      textAlign: 'center'
    }}>
      <div style={{ position: 'relative', width: '60px', height: '60px', marginBottom: '1.25rem' }}>
        <Loader2 
          size={60} 
          style={{ 
            color: 'var(--accent-primary)',
            animation: 'spin 1s linear infinite' 
          }} 
        />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'var(--accent-cyan)'
        }}>
          <Sparkles size={22} className="animate-pulse-glow" />
        </div>
      </div>
      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
        {message}
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '340px' }}>
        Processing parameters, evaluating semantic context, and assembling insights.
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999
      }}>
        {content}
      </div>
    );
  }

  return content;
}
