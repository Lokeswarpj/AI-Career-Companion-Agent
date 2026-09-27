import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Palette, Check, ChevronDown } from 'lucide-react';

export default function ThemeSelector() {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeThemeObj = themes.find(t => t.id === theme) || themes[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="btn btn-secondary btn-sm"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.38rem 0.75rem',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          color: 'var(--text-primary)',
          fontSize: '0.82rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all var(--transition-fast)'
        }}
        title={`Current Theme: ${activeThemeObj.name}. Click to change theme.`}
      >
        <span style={{ fontSize: '0.95rem' }}>{activeThemeObj.icon}</span>
        <span style={{ display: 'inline-block' }}>{activeThemeObj.name}</span>
        <ChevronDown 
          size={13} 
          style={{ 
            opacity: 0.7, 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="glass-panel animate-fade-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '240px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: '0.5rem',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3rem'
          }}
        >
          <div style={{ 
            padding: '0.35rem 0.65rem 0.45rem 0.65rem', 
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <Palette size={13} />
            <span>Select UI Aesthetic</span>
          </div>

          {themes.map((t) => {
            const isSelected = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTheme(t.id);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '1px solid var(--border-focus)' : '1px solid transparent',
                  background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>{t.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 600 }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                      {t.hint}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {/* Color dots preview */}
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {t.colors.slice(1).map((c, i) => (
                      <span
                        key={i}
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: c,
                          display: 'inline-block'
                        }}
                      />
                    ))}
                  </div>

                  {isSelected && <Check size={14} style={{ color: 'var(--accent-primary)', marginLeft: '0.25rem' }} />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
