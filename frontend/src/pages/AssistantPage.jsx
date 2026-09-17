import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Trash2, 
  User, 
  Bot, 
  RefreshCw, 
  HelpCircle, 
  Lightbulb,
  Compass,
  GitPullRequest,
  CheckCircle,
  FileText,
  Mic,
  TrendingUp
} from 'lucide-react';

export default function AssistantPage() {
  const { user } = useAuth();
  const notify = useNotification();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  const multiAgentSuggestions = [
    { label: "🎯 Recommend top internships for my profile", query: "Recommend suitable internships based on my profile skills and explain why they match." },
    { label: "📊 What are my biggest skill gaps?", query: "What are my critical skill gaps for top roles and how should I close them?" },
    { label: "⚖️ Compare my top internship opportunities", query: "Compare the top matching internships for me side-by-side with decision trade-offs." },
    { label: "📅 5-Day Interview Prep Blueprint", query: "Generate a 5-day technical and behavioral interview preparation blueprint for my target roles." },
    { label: "✍️ Tips to optimize resume STAR bullets", query: "How should I structure my project bullet points using the STAR framework to maximize ATS score?" }
  ];

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function loadChatHistory() {
    try {
      setLoadingHistory(true);
      const res = await api.getChatHistory();
      if (res.history && res.history.length > 0) {
        setMessages(res.history);
      } else {
        setMessages([
          {
            id: 'welcome-1',
            role: 'assistant',
            content: `Hello ${user?.full_name?.split(' ')[0] || 'there'}! 👋 I am your **CareerPulse AI Companion**.\n\nI am connected to our **Multi-Agent Engine** (Job Matching, Skill Gap Diagnosis, Application Customizer, and Interview Coach).\n\nAsk me anything about finding internships, explaining matches, comparing offers, closing skill gaps, or preparing for interviews!`
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || sending) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setSending(true);

    try {
      const res = await api.sendChatMessage(text.trim());
      const botMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.reply
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      notify.error(err.message || 'Failed to receive AI response.');
    } finally {
      setSending(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.clearChatHistory();
      setMessages([
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Chat history cleared. How can I assist your career progression today?'
        }
      ]);
      notify.success('Conversation history reset.');
    } catch (err) {
      notify.error('Failed to clear history.');
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: '1000px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-indigo">M3.4 Conversational Career Assistant</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>AI Career Companion</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Multi-agent guidance orchestrator with real-time knowledge of your profile, live internships, and interview results.
          </p>
        </div>

        <button
          onClick={handleClearHistory}
          className="btn btn-outline btn-sm"
          style={{ gap: '0.4rem' }}
          title="Clear chat history"
        >
          <Trash2 size={16} />
          <span>Reset Chat</span>
        </button>
      </div>

      {/* Main Chat Box Container */}
      <div 
        className="glass-panel"
        style={{
          height: '640px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Messages Scroll Area */}
        <div style={{
          flex: 1,
          padding: '1.75rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }}
            >
              {/* Avatar Icon */}
              <div style={{
                width: '2.2rem',
                height: '2.2rem',
                borderRadius: '50%',
                background: msg.role === 'user' ? 'var(--accent-primary)' : 'linear-gradient(135deg, #6366f1, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0
              }}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              {/* Message Content Bubble */}
              <div style={{
                maxWidth: '82%',
                padding: '1.1rem 1.4rem',
                borderRadius: 'var(--radius-md)',
                background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: msg.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                fontSize: '0.92rem',
                lineHeight: 1.65,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border-card)',
                whiteSpace: 'pre-wrap'
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {sending && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{
                width: '2.2rem',
                height: '2.2rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0
              }}>
                <Bot size={16} />
              </div>
              <div style={{
                padding: '0.75rem 1.25rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <RefreshCw size={14} className="spin-slow" />
                <span>Multi-Agent Engine is synthesizing personalized career advice...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{
          padding: '0.75rem 1.5rem',
          background: 'rgba(99, 102, 241, 0.03)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          {multiAgentSuggestions.map((item, idx) => (
            <button
              key={idx}
              disabled={sending}
              onClick={() => handleSendMessage(item.query)}
              className="btn btn-outline btn-sm"
              style={{
                fontSize: '0.78rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '9999px',
                borderColor: 'var(--border-card)'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-card)'
        }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: 'flex', gap: '0.75rem' }}
          >
            <input
              type="text"
              className="form-input"
              placeholder="Ask about internships, skill gaps, resume bullet enhancements, or interview tips..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={sending}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="btn btn-primary"
              style={{ gap: '0.4rem', padding: '0.65rem 1.4rem' }}
            >
              <Send size={16} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
