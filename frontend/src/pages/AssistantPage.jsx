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

// Formats inline markdown tokens like **bold**, *italic*, `code`, and removes raw/stray asterisks
function formatInlineText(text) {
  if (!text) return null;

  // Split by code backticks first, then bold/italic
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return tokens.map((tok, i) => {
    if (!tok) return null;
    if (tok.startsWith('`') && tok.endsWith('`') && tok.length >= 2) {
      return (
        <code key={i} style={{ 
          background: 'rgba(255,255,255,0.08)', 
          padding: '0.15rem 0.35rem', 
          borderRadius: '4px', 
          fontFamily: 'monospace',
          fontSize: '0.88em'
        }}>
          {tok.slice(1, -1)}
        </code>
      );
    }
    if (tok.startsWith('**') && tok.endsWith('**') && tok.length >= 4) {
      return <strong key={i} style={{ fontWeight: 700, color: 'inherit' }}>{tok.slice(2, -2)}</strong>;
    }
    if (tok.startsWith('*') && tok.endsWith('*') && tok.length >= 2 && !tok.startsWith('**')) {
      return <em key={i}>{tok.slice(1, -1)}</em>;
    }
    // Clean any stray asterisks that were not closed
    const cleaned = tok.replace(/\*/g, '');
    return <React.Fragment key={i}>{cleaned}</React.Fragment>;
  });
}

function FormattedChatMessage({ content }) {
  if (!content) return null;

  const blocks = content.split(/\n\n+/);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {blocks.map((block, bIdx) => {
        const lines = block.split(/\n/);
        return (
          <div key={bIdx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return null;

              // Check for headers (e.g. ### Header)
              if (/^#{1,4}\s+/.test(trimmed)) {
                const headerText = trimmed.replace(/^#{1,4}\s+/, '');
                return (
                  <div key={lIdx} style={{ fontWeight: 700, fontSize: '1.02rem', marginTop: '0.25rem', color: 'var(--text-primary)' }}>
                    {formatInlineText(headerText)}
                  </div>
                );
              }

              // Check for bullet lists (*, -, •)
              if (/^\s*([*\-•])\s+/.test(trimmed)) {
                const bulletText = trimmed.replace(/^\s*([*\-•])\s+/, '');
                return (
                  <div key={lIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', paddingLeft: '0.25rem' }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>•</span>
                    <span style={{ flex: 1 }}>{formatInlineText(bulletText)}</span>
                  </div>
                );
              }

              // Check for numbered lists (1., 2., etc.)
              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
              if (numMatch) {
                return (
                  <div key={lIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', paddingLeft: '0.25rem' }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600, minWidth: '1.2rem' }}>{numMatch[1]}.</span>
                    <span style={{ flex: 1 }}>{formatInlineText(numMatch[2])}</span>
                  </div>
                );
              }

              // Normal text line
              return (
                <div key={lIdx} style={{ lineHeight: 1.65 }}>
                  {formatInlineText(line)}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

export default function AssistantPage() {
  const { user } = useAuth();
  const notify = useNotification();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  const chatContainerRef = useRef(null);
  const isFirstLoad = useRef(true);

  const multiAgentSuggestions = [
    { label: "🎯 Recommend top internships for my profile", query: "Recommend suitable internships based on my profile skills and explain why they match." },
    { label: "📊 What are my biggest skill gaps?", query: "What are my critical skill gaps for top roles and how should I close them?" },
    { label: "⚖️ Compare my top internship opportunities", query: "Compare the top matching internships for me side-by-side with decision trade-offs." },
    { label: "📅 5-Day Interview Prep Blueprint", query: "Generate a 5-day technical and behavioral interview preparation blueprint for my target roles." },
    { label: "✍️ Tips to optimize resume STAR bullets", query: "How should I structure my project bullet points using the STAR framework to maximize ATS score?" }
  ];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    loadChatHistory();
  }, []);

  useEffect(() => {
    // Only scroll inner message container smoothly on new message (prevents page-level scroll)
    if (isFirstLoad.current) {
      if (messages.length > 0) {
        isFirstLoad.current = false;
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }
      return;
    }
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, sending]);

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
    <div 
      className="container" 
      style={{ 
        padding: '0.85rem 1.25rem 0.65rem 1.25rem', 
        maxWidth: '1080px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '0.65rem', 
        flexWrap: 'wrap', 
        gap: '0.5rem',
        flexShrink: 0 
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
            <span className="badge badge-indigo" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
              Conversational Career Assistant
            </span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.1rem 0' }}>
            AI Career Companion
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
            Multi-agent guidance orchestrator with real-time knowledge of your profile, live internships, and interview results.
          </p>
        </div>

        <button
          onClick={handleClearHistory}
          className="btn btn-outline btn-sm"
          style={{ gap: '0.4rem', padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
          title="Clear chat history"
        >
          <Trash2 size={14} />
          <span>Reset Chat</span>
        </button>
      </div>

      {/* Main Chat Box Container - Perfectly Sized to Viewport */}
      <div 
        className="glass-panel"
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)'
        }}
      >
        {/* Messages Scroll Area */}
        <div 
          ref={chatContainerRef}
          style={{
            flex: 1,
            minHeight: 0,
            padding: '1rem 1.25rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              style={{
                display: 'flex',
                gap: '0.85rem',
                alignItems: 'flex-start',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }}
            >
              {/* Avatar Icon */}
              <div style={{
                width: '1.85rem',
                height: '1.85rem',
                borderRadius: '50%',
                background: msg.role === 'user' ? 'var(--accent-primary)' : 'linear-gradient(135deg, #6366f1, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0
              }}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>

              {/* Message Content Bubble */}
              <div style={{
                maxWidth: '82%',
                padding: '0.85rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: msg.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                fontSize: '0.88rem',
                lineHeight: 1.55,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border-card)'
              }}>
                <FormattedChatMessage content={msg.content} />
              </div>
            </div>
          ))}

          {sending && (
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <div style={{
                width: '1.85rem',
                height: '1.85rem',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #10b981)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0
              }}>
                <Bot size={14} />
              </div>
              <div style={{
                padding: '0.55rem 1rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1px solid var(--border-card)'
              }}>
                <RefreshCw size={13} className="spin-slow" />
                <span>Multi-Agent Engine is synthesizing personalized career advice...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{
          padding: '0.45rem 1rem',
          background: 'rgba(99, 102, 241, 0.04)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '0.45rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          {multiAgentSuggestions.map((item, idx) => (
            <button
              key={idx}
              disabled={sending}
              onClick={() => handleSendMessage(item.query)}
              className="btn btn-outline btn-sm"
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.65rem',
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
          padding: '0.65rem 1rem',
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-card)',
          flexShrink: 0
        }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: 'flex', gap: '0.5rem' }}
          >
            <input
              type="text"
              className="form-input"
              placeholder="Ask about internships, skill gaps, resume bullet enhancements, or interview tips..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={sending}
              style={{ flex: 1, padding: '0.55rem 0.85rem', fontSize: '0.86rem' }}
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="btn btn-primary"
              style={{ gap: '0.35rem', padding: '0.55rem 1.15rem', fontSize: '0.86rem' }}
            >
              <Send size={15} />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
