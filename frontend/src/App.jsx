import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Background3D from './components/Background3D';
import Footer from './components/Footer';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ResumePage from './pages/ResumePage';
import InternshipsPage from './pages/InternshipsPage';
import MatchingPage from './pages/MatchingPage';
import SkillGapPage from './pages/SkillGapPage';
import ApplicationCustomizerPage from './pages/ApplicationCustomizerPage';
import MockInterviewPage from './pages/MockInterviewPage';
import InterviewHistoryPage from './pages/InterviewHistoryPage';
import AssistantPage from './pages/AssistantPage';

export default function App() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('landing');
  const [selectedInternshipId, setSelectedInternshipId] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  
  // Track visited tabs to enable instantaneous 0ms tab switching
  const [visitedTabs, setVisitedTabs] = useState(() => new Set(['landing', 'auth', 'dashboard']));
  
  // Sidebar minimize/expand state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('careerpulse_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('careerpulse_sidebar_collapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  // When user is authenticated, redirect landing/auth to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'landing' || activeTab === 'auth') {
        setActiveTab('dashboard');
      }
    } else {
      // Reset visited tabs on logout
      setVisitedTabs(new Set(['landing', 'auth']));
    }
  }, [isAuthenticated]);

  // Record visited tab
  useEffect(() => {
    if (activeTab) {
      setVisitedTabs(prev => {
        if (prev.has(activeTab)) return prev;
        const next = new Set(prev);
        next.add(activeTab);
        return next;
      });
    }
  }, [activeTab]);

  // Safety fallback for unauthenticated users accessing protected tabs
  const currentTab = !isAuthenticated && !['landing', 'auth'].includes(activeTab) 
    ? 'landing' 
    : activeTab;

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setActiveTab('dashboard');
    } else {
      setAuthMode('register');
      setActiveTab('auth');
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
          setActiveTab={setActiveTab}
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
          setActiveTab={setActiveTab} 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          setAuthMode={setAuthMode}
        />
      </div>

      {/* 3. Main Routed Content Area with Instant 0ms Tab Switching */}
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
            onSuccess={() => setActiveTab('dashboard')} 
            authMode={authMode}
            setAuthMode={setAuthMode}
          />
        )}

        {/* Authenticated Pages - Retained in DOM for 0ms Zero-Lag Tab Switching */}
        {isAuthenticated && (
          <>
            {visitedTabs.has('dashboard') && (
              <div style={{ display: currentTab === 'dashboard' ? 'block' : 'none' }}>
                <DashboardPage setActiveTab={setActiveTab} setSelectedInternshipId={setSelectedInternshipId} />
              </div>
            )}

            {visitedTabs.has('profile') && (
              <div style={{ display: currentTab === 'profile' ? 'block' : 'none' }}>
                <ProfilePage />
              </div>
            )}

            {visitedTabs.has('resume') && (
              <div style={{ display: currentTab === 'resume' ? 'block' : 'none' }}>
                <ResumePage setActiveTab={setActiveTab} setSelectedInternshipId={setSelectedInternshipId} />
              </div>
            )}

            {visitedTabs.has('internships') && (
              <div style={{ display: currentTab === 'internships' ? 'block' : 'none' }}>
                <InternshipsPage setActiveTab={setActiveTab} setSelectedInternshipId={setSelectedInternshipId} />
              </div>
            )}

            {visitedTabs.has('matching') && (
              <div style={{ display: currentTab === 'matching' ? 'block' : 'none' }}>
                <MatchingPage setActiveTab={setActiveTab} setSelectedInternshipId={setSelectedInternshipId} />
              </div>
            )}

            {visitedTabs.has('skill-gap') && (
              <div style={{ display: currentTab === 'skill-gap' ? 'block' : 'none' }}>
                <SkillGapPage
                  selectedInternshipId={selectedInternshipId}
                  setSelectedInternshipId={setSelectedInternshipId}
                  setActiveTab={setActiveTab}
                />
              </div>
            )}

            {visitedTabs.has('customizer') && (
              <div style={{ display: currentTab === 'customizer' ? 'block' : 'none' }}>
                <ApplicationCustomizerPage
                  selectedInternshipId={selectedInternshipId}
                  setSelectedInternshipId={setSelectedInternshipId}
                  setActiveTab={setActiveTab}
                />
              </div>
            )}

            {visitedTabs.has('mock-interview') && (
              <div style={{ display: currentTab === 'mock-interview' ? 'block' : 'none' }}>
                <MockInterviewPage
                  selectedInternshipId={selectedInternshipId}
                  setSelectedInternshipId={setSelectedInternshipId}
                  setActiveTab={setActiveTab}
                />
              </div>
            )}

            {visitedTabs.has('history') && (
              <div style={{ display: currentTab === 'history' ? 'block' : 'none' }}>
                <InterviewHistoryPage setActiveTab={setActiveTab} />
              </div>
            )}

            {visitedTabs.has('assistant') && (
              <div style={{ display: currentTab === 'assistant' ? 'block' : 'none' }}>
                <AssistantPage />
              </div>
            )}
          </>
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
