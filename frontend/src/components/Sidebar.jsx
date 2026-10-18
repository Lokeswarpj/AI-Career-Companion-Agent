import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard,
  Upload,
  Briefcase, 
  Sparkles, 
  Compass, 
  FileText, 
  Mic, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  User,
  LogOut,
  History,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ClipboardList
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) {
  const { user, logout } = useAuth();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'resume', label: 'Resume AI', icon: Upload, badge: 'Smart' },
    { id: 'internships', label: 'Internships', icon: Briefcase, badge: '180' },
    { id: 'matching', label: 'AI Matching', icon: Sparkles, badge: 'RAG' },
    { id: 'skill-gap', label: 'Skill Gap', icon: Compass, badge: null },
    { id: 'customizer', label: 'Customizer', icon: FileText, badge: 'ATS' },
    { id: 'mock-interview', label: 'Mock Interview', icon: Mic, badge: '3D' },
    { id: 'applications', label: 'Application Tracker', icon: ClipboardList, badge: null },
    { id: 'assistant', label: 'Career Assistant', icon: MessageSquare, badge: 'AI' },
  ];

  const initials = (user?.full_name || 'Student')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside
      className="glass-sidebar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: isCollapsed ? '4.5rem' : '16rem',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-card)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden',
        boxShadow: '4px 0 25px rgba(15, 23, 42, 0.05)'
      }}
    >
      {/* 1. TOP HEADER: Logo & Collapse Toggle */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '1.15rem 0' : '1.15rem 1rem',
            borderBottom: '1px solid var(--border-subtle)',
            height: '4.25rem'
          }}
        >
          {/* Logo when expanded */}
          {!isCollapsed ? (
            <div 
              onClick={() => setActiveTab('dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
            >
              <img 
                src="/careerpulse_logo.png" 
                alt="CareerPulse AI Logo" 
                style={{
                  width: '2.4rem',
                  height: '2.4rem',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  boxShadow: '0 2px 8px rgba(23, 30, 25, 0.12)',
                  border: '1px solid var(--border-subtle)'
                }}
              />
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span>CareerPulse</span>
                  <span className="gradient-text">AI</span>
                </div>
              </div>
            </div>
          ) : (
            /* Icon Logo when collapsed */
            <div 
              onClick={() => setActiveTab('dashboard')}
              style={{ cursor: 'pointer' }}
              title="CareerPulse AI Dashboard"
            >
              <img 
                src="/careerpulse_logo.png" 
                alt="CareerPulse AI Logo" 
                style={{
                  width: '2.4rem',
                  height: '2.4rem',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  boxShadow: '0 2px 8px rgba(23, 30, 25, 0.12)',
                  border: '1px solid var(--border-subtle)'
                }}
              />
            </div>
          )}

          {/* Minimize / Expand Toggle Button */}
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(true)}
              className="btn btn-secondary btn-sm"
              style={{
                padding: '0.4rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
              title="Minimize Sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {/* Expand button on top when collapsed */}
        {isCollapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem 0' }}>
            <button
              onClick={() => setIsCollapsed(false)}
              className="btn btn-secondary btn-sm"
              style={{
                padding: '0.35rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
                border: '1px solid var(--border-card)',
                background: 'var(--bg-tertiary)'
              }}
              title="Expand Sidebar"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* 2. MIDDLE: Navigation Items */}
        <nav style={{ padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isHovered = hoveredItem === item.id;

            return (
              <div key={item.id} style={{ position: 'relative' }}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: '0.75rem',
                    padding: isCollapsed ? '0.75rem 0' : '0.7rem 0.9rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background: isActive 
                      ? '#ffe17c' 
                      : (isHovered ? 'rgba(23, 30, 25, 0.05)' : 'transparent'),
                    color: isActive ? '#171e19' : (isHovered ? 'var(--text-primary)' : 'var(--text-secondary)'),
                    fontWeight: isActive ? 800 : 500,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    position: 'relative',
                    boxShadow: isActive ? 'inset 0 0 0 1px rgba(23, 30, 25, 0.15), 0 2px 8px rgba(255, 225, 124, 0.35)' : 'none'
                  }}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      left: '2px',
                      top: '20%',
                      bottom: '20%',
                      width: '3.5px',
                      borderRadius: '4px',
                      background: '#171e19'
                    }} />
                  )}

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isActive ? '#171e19' : (isHovered ? 'var(--text-primary)' : 'var(--text-secondary)')
                  }}>
                    <Icon size={19} />
                  </div>

                  {!isCollapsed && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flex: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden'
                    }}>
                      <span>{item.label}</span>
                      {item.badge && (
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.45rem',
                          borderRadius: '6px',
                          background: isActive ? '#171e19' : 'rgba(23, 30, 25, 0.08)',
                          color: isActive ? '#ffe17c' : '#171e19'
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>

                {/* Floating Tooltip when Minimized */}
                {isCollapsed && isHovered && (
                  <div style={{
                    position: 'absolute',
                    left: 'calc(100% + 12px)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#1e293b',
                    color: '#ffffff',
                    padding: '0.45rem 0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    pointerEvents: 'none',
                    zIndex: 1100,
                    animation: 'fadeIn 0.15s ease'
                  }}>
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* 3. BOTTOM: Account Section Aligned in Left Sidebar */}
      <div style={{
        padding: isCollapsed ? '0.75rem 0.5rem' : '0.85rem',
        borderTop: '1px solid var(--border-subtle)',
        position: 'relative'
      }}>
        {/* Account Dropup Menu */}
        {accountMenuOpen && (
          <div
            className="glass-panel animate-fade-in"
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              left: isCollapsed ? 'calc(100% + 10px)' : '0.85rem',
              right: isCollapsed ? 'auto' : '0.85rem',
              width: isCollapsed ? '220px' : 'auto',
              padding: '0.6rem',
              background: 'var(--bg-secondary)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 12px 35px rgba(15, 23, 42, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              zIndex: 1200
            }}
          >
            <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Logged In
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', wordBreak: 'break-all' }}>
                {user?.email || user?.full_name}
              </div>
            </div>

            <button
              onClick={() => {
                setActiveTab('profile');
                setAccountMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <User size={16} color="var(--accent-primary)" />
              <span>Profile & Skills</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('history');
                setAccountMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '0.84rem',
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <History size={16} color="var(--accent-cyan)" />
              <span>Interview History</span>
            </button>

            <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.2rem 0' }} />

            <button
              onClick={() => {
                logout();
                setAccountMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: '#fff1f2',
                color: 'var(--accent-rose)',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#ffe4e6'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#fff1f2'}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Account Row Trigger */}
        <div
          onClick={() => setAccountMenuOpen(!accountMenuOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: '0.75rem',
            padding: isCollapsed ? '0.5rem 0' : '0.55rem 0.75rem',
            background: accountMenuOpen ? 'rgba(79, 70, 229, 0.08)' : 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${accountMenuOpen ? 'rgba(79, 70, 229, 0.35)' : 'var(--border-subtle)'}`,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            userSelect: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.35)';
            e.currentTarget.style.background = 'rgba(79, 70, 229, 0.08)';
          }}
          onMouseLeave={(e) => {
            if (!accountMenuOpen) {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.background = 'var(--bg-tertiary)';
            }
          }}
          title={isCollapsed ? `${user?.full_name || 'My Account'} (Click for Options)` : 'Account Settings & Profile'}
        >
          {/* Avatar with Green Dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
                }}
              >
                {initials}
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: '-1px',
                  right: '-1px',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: '#10b981',
                  border: '2px solid #ffffff',
                  boxShadow: '0 0 5px #10b981'
                }}
              />
            </div>

            {!isCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  maxWidth: '105px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {user?.full_name || 'My Account'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Student
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div style={{ color: 'var(--text-muted)' }}>
              {accountMenuOpen ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
