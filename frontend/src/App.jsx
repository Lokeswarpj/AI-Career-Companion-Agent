import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ResumePage from './pages/ResumePage';
import InternshipsPage from './pages/InternshipsPage';
import MatchingPage from './pages/MatchingPage';
import SkillGapPage from './pages/SkillGapPage';
import MockInterviewPage from './pages/MockInterviewPage';
import InterviewHistoryPage from './pages/InterviewHistoryPage';
import AssistantPage from './pages/AssistantPage';

export default function App() {
  const { isAuthenticated, demoLogin } = useAuth();
  const [activeTab, setActiveTab] = useState('landing');
  const [selectedInternshipId, setSelectedInternshipId] = useState(null);

  // If user is authenticated and starts on landing, redirect to dashboard
  const currentTab = !isAuthenticated && !['landing', 'auth'].includes(activeTab) 
    ? 'landing' 
    : activeTab;

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setActiveTab('dashboard');
    } else {
      setActiveTab('auth');
    }
  };

  const handleDemoLogin = async () => {
    try {
      await demoLogin();
      setActiveTab('dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation */}
      <Navbar activeTab={currentTab} setActiveTab={setActiveTab} />

      {/* Main Routed Content */}
      <main style={{ flex: 1 }}>
        {currentTab === 'landing' && (
          <LandingPage onGetStarted={handleGetStarted} onDemoLogin={handleDemoLogin} />
        )}

        {currentTab === 'auth' && (
          <AuthPage onSuccess={() => setActiveTab('dashboard')} />
        )}

        {currentTab === 'dashboard' && (
          <DashboardPage setActiveTab={setActiveTab} setSelectedInternshipId={setSelectedInternshipId} />
        )}

        {currentTab === 'profile' && (
          <ProfilePage />
        )}

        {currentTab === 'resume' && (
          <ResumePage setActiveTab={setActiveTab} />
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

      {/* Footer */}
      <Footer />
    </div>
  );
}
