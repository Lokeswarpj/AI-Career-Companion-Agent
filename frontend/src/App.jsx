import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Background3D from './components/Background3D';
import Footer from './components/Footer';

// Core entry pages (bundled for instant first-paint)
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';

// Lazy-loaded secondary pages (code-split for ultra-fast initial page download)
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ResumePage = lazy(() => import('./pages/ResumePage'));
const InternshipsPage = lazy(() => import('./pages/InternshipsPage'));
const MatchingPage = lazy(() => import('./pages/MatchingPage'));
const SkillGapPage = lazy(() => import('./pages/SkillGapPage'));
const ApplicationCustomizerPage = lazy(() => import('./pages/ApplicationCustomizerPage'));
const MockInterviewPage = lazy(() => import('./pages/MockInterviewPage'));
const InterviewHistoryPage = lazy(() => import('./pages/InterviewHistoryPage'));
const AssistantPage = lazy(() => import('./pages/AssistantPage'));

// Fallback loader during initial lazy chunk fetch
function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{
        width: '36px',
        height: '36px',
        border: '3px solid rgba(99, 102, 241, 0.2)',
        borderTopColor: '#6366f1',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite'
      }} />
    </div>
  );
}

const VALID_AUTH_TABS = [
  'dashboard',
  'profile',
  'resume',
  'internships',
  'matching',
  'skill-gap',
  'customizer',
  'mock-interview',
  'history',
  'assistant'
];

// Preload secondary chunks in the background during idle time so switching tabs is instant (0ms)
function prefetchSecondaryPages() {
  const prefetchList = [
    () => import('./pages/ProfilePage'),
    () => import('./pages/ResumePage'),
    () => import('./pages/InternshipsPage'),
    () => import('./pages/MatchingPage'),
    () => import('./pages/SkillGapPage'),
    () => import('./pages/ApplicationCustomizerPage'),
    () => import('./pages/MockInterviewPage'),
    () => import('./pages/InterviewHistoryPage'),
    () => import('./pages/AssistantPage')
  ];

  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        prefetchList.forEach(fn => fn());
      });
    } else {
      setTimeout(() => {
        prefetchList.forEach(fn => fn());
      }, 300);
    }
  }
}

function getInitialTab() {
  if (typeof window === 'undefined') return 'landing';
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  const stored = localStorage.getItem('careerpulse_active_tab');
  const token = localStorage.getItem('careerpulse_token');

  if (token) {
    if (hash && VALID_AUTH_TABS.includes(hash)) return hash;
    if (stored && VALID_AUTH_TABS.includes(stored)) return stored;
    return 'dashboard';
  } else {
    if (hash === 'auth') return 'auth';
    return 'landing';
  }
}

export default function App() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [selectedInternshipId, setSelectedInternshipId] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  
  // Track visited tabs to enable instantaneous 0ms tab switching
  const [visitedTabs, setVisitedTabs] = useState(() => {
    const initial = getInitialTab();
    return new Set(['landing', 'auth', 'dashboard', initial]);
  });
  
  // Sidebar minimize/expand state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('careerpulse_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('careerpulse_sidebar_collapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  // Navigate helper to keep state, localStorage, and URL hash in 100% sync
  const handleNavigate = (tab) => {
    if (!tab) return;
    setActiveTab(tab);
    setVisitedTabs(prev => {
      const next = new Set(prev);
      next.add(tab);
      return next;
    });

    if (tab !== 'landing' && tab !== 'auth') {
      localStorage.setItem('careerpulse_active_tab', tab);
      window.location.hash = `#${tab}`;
    } else {
      window.location.hash = `#${tab}`;
    }
  };

  // Synchronize browser back/forward buttons (hashchange event)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (isAuthenticated) {
        if (VALID_AUTH_TABS.includes(hash)) {
          setActiveTab(hash);
          localStorage.setItem('careerpulse_active_tab', hash);
          setVisitedTabs(prev => new Set(prev).add(hash));
        }
      } else {
        if (hash === 'auth' || hash === 'landing') {
          setActiveTab(hash);
          setVisitedTabs(prev => new Set(prev).add(hash));
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAuthenticated]);

  // When auth state changes (login, logout, session restoration)
  useEffect(() => {
    if (isAuthenticated) {
      // Trigger background prefetching so all tab switches are instant (0ms)
      prefetchSecondaryPages();

      // If on landing or auth or invalid tab, navigate to dashboard or persisted tab
      if (activeTab === 'landing' || activeTab === 'auth' || !VALID_AUTH_TABS.includes(activeTab)) {
        const hash = window.location.hash.replace(/^#\/?/, '').trim();
        const stored = localStorage.getItem('careerpulse_active_tab');
        const target = (hash && VALID_AUTH_TABS.includes(hash)) 
          ? hash 
          : ((stored && VALID_AUTH_TABS.includes(stored)) ? stored : 'dashboard');
        
        handleNavigate(target);
      } else {
        window.location.hash = `#${activeTab}`;
        localStorage.setItem('careerpulse_active_tab', activeTab);
      }
    } else {
      // Reset unauthenticated state
      localStorage.removeItem('careerpulse_active_tab');
      if (activeTab !== 'landing' && activeTab !== 'auth') {
        setActiveTab('landing');
        window.location.hash = '#landing';
      }
      setVisitedTabs(new Set(['landing', 'auth']));
    }
  }, [isAuthenticated]);

  // Safety fallback for unauthenticated users accessing protected tabs
  const currentTab = !isAuthenticated && !['landing', 'auth'].includes(activeTab) 
    ? 'landing' 
    : activeTab;

  const handleGetStarted = () => {
    if (isAuthenticated) {
      handleNavigate('dashboard');
    } else {
      setAuthMode('register');
      handleNavigate('auth');
    }
  };

  const showAuthenticatedNav = isAuthenticated && !['landing', 'auth'].includes(currentTab);
  const leftOffset = showAuthenticatedNav ? (isSidebarCollapsed ? '4.5rem' : '16rem') : '0px';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* 3D Interactive Spatial Background */}
      <Background3D />

      {/* 1. Left Sidebar: Navigation Options + Bottom-Aligned Account */}
      {showAuthenticatedNav && (
        <Sidebar
          activeTab={currentTab}
          setActiveTab={handleNavigate}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />
      )}

      {/* 2. Top Header Bar */}
      <div 
        style={{ 
          marginLeft: leftOffset,
          transition: 'margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Navbar 
          activeTab={currentTab} 
          setActiveTab={handleNavigate} 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          setAuthMode={setAuthMode}
        />
      </div>

      {/* 3. Main Routed Content Area with Instant 0ms Tab Switching & Lazy Code Splitting */}
      <main 
        style={{ 
          flex: 1,
          marginLeft: leftOffset,
          transition: 'margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          paddingBottom: '2.5rem'
        }}
      >
        {/* Unauthenticated Pages */}
        {!isAuthenticated && currentTab === 'landing' && (
          <LandingPage onGetStarted={handleGetStarted} />
        )}

        {!isAuthenticated && currentTab === 'auth' && (
          <AuthPage 
            onSuccess={() => handleNavigate('dashboard')} 
            authMode={authMode}
            setAuthMode={setAuthMode}
          />
        )}

        {/* Authenticated Pages */}
        {isAuthenticated && (
          <Suspense fallback={<PageLoader />}>
            {visitedTabs.has('dashboard') && (
              <div style={{ display: currentTab === 'dashboard' ? 'block' : 'none' }}>
                <DashboardPage setActiveTab={handleNavigate} setSelectedInternshipId={setSelectedInternshipId} />
              </div>
            )}

            {visitedTabs.has('profile') && (
              <div style={{ display: currentTab === 'profile' ? 'block' : 'none' }}>
                <ProfilePage />
              </div>
            )}

            {visitedTabs.has('resume') && (
              <div style={{ display: currentTab === 'resume' ? 'block' : 'none' }}>
                <ResumePage setActiveTab={handleNavigate} setSelectedInternshipId={setSelectedInternshipId} />
              </div>
            )}

            {visitedTabs.has('internships') && (
              <div style={{ display: currentTab === 'internships' ? 'block' : 'none' }}>
                <InternshipsPage setActiveTab={handleNavigate} setSelectedInternshipId={setSelectedInternshipId} />
              </div>
            )}

            {visitedTabs.has('matching') && (
              <div style={{ display: currentTab === 'matching' ? 'block' : 'none' }}>
                <MatchingPage setActiveTab={handleNavigate} setSelectedInternshipId={setSelectedInternshipId} />
              </div>
            )}

            {visitedTabs.has('skill-gap') && (
              <div style={{ display: currentTab === 'skill-gap' ? 'block' : 'none' }}>
                <SkillGapPage
                  selectedInternshipId={selectedInternshipId}
                  setSelectedInternshipId={setSelectedInternshipId}
                  setActiveTab={handleNavigate}
                />
              </div>
            )}

            {visitedTabs.has('customizer') && (
              <div style={{ display: currentTab === 'customizer' ? 'block' : 'none' }}>
                <ApplicationCustomizerPage
                  selectedInternshipId={selectedInternshipId}
                  setSelectedInternshipId={setSelectedInternshipId}
                  setActiveTab={handleNavigate}
                />
              </div>
            )}

            {visitedTabs.has('mock-interview') && (
              <div style={{ display: currentTab === 'mock-interview' ? 'block' : 'none' }}>
                <MockInterviewPage
                  selectedInternshipId={selectedInternshipId}
                  setSelectedInternshipId={setSelectedInternshipId}
                  setActiveTab={handleNavigate}
                />
              </div>
            )}

            {visitedTabs.has('history') && (
              <div style={{ display: currentTab === 'history' ? 'block' : 'none' }}>
                <InterviewHistoryPage setActiveTab={handleNavigate} />
              </div>
            )}

            {visitedTabs.has('assistant') && (
              <div style={{ display: currentTab === 'assistant' ? 'block' : 'none' }}>
                <AssistantPage />
              </div>
            )}
          </Suspense>
        )}
      </main>

      {/* 4. Footer */}
      <div 
        style={{ 
          marginLeft: leftOffset,
          transition: 'margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Footer />
      </div>
    </div>
  );
}
