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
  
  // Sidebar minimize/expand state with localStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('careerpulse_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('careerpulse_sidebar_collapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  // If user is authenticated and starts on landing, redirect to dashboard
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

      {/* 3. Main Routed Content Area */}
      <main 
        style={{ 
          flex: 1,
          marginLeft: leftOffset,
          transition: 'margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          paddingBottom: '2.5rem'
        }}
      >
        {currentTab === 'landing' && (
          <LandingPage onGetStarted={handleGetStarted} />
        )}

        {currentTab === 'auth' && (
          <AuthPage 
            onSuccess={() => setActiveTab('dashboard')} 
            authMode={authMode}
            setAuthMode={setAuthMode}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardPage setActiveTab={setActiveTab} setSelectedInternshipId={setSelectedInternshipId} />
        )}

        {currentTab === 'profile' && (
          <ProfilePage />
        )}

        {currentTab === 'resume' && (
          <ResumePage setActiveTab={setActiveTab} setSelectedInternshipId={setSelectedInternshipId} />
        )}

        {currentTab === 'internships' && (
          <InternshipsPage setActiveTab={setActiveTab} setSelectedInternshipId={setSelectedInternshipId} />
        )}

        {currentTab === 'matching' && (
          <MatchingPage setActiveTab={setActiveTab} setSelectedInternshipId={setSelectedInternshipId} />
        )}

        {currentTab === 'skill-gap' && (
          <SkillGapPage
            selectedInternshipId={selectedInternshipId}
            setSelectedInternshipId={setSelectedInternshipId}
            setActiveTab={setActiveTab}
          />
        )}

        {currentTab === 'customizer' && (
          <ApplicationCustomizerPage
            selectedInternshipId={selectedInternshipId}
            setSelectedInternshipId={setSelectedInternshipId}
            setActiveTab={setActiveTab}
          />
        )}

        {currentTab === 'mock-interview' && (
          <MockInterviewPage
            selectedInternshipId={selectedInternshipId}
            setSelectedInternshipId={setSelectedInternshipId}
            setActiveTab={setActiveTab}
          />
        )}

        {currentTab === 'history' && (
          <InterviewHistoryPage setActiveTab={setActiveTab} />
        )}

        {currentTab === 'assistant' && (
          <AssistantPage />
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
