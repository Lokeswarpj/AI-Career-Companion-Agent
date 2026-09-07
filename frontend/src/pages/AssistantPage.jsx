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
  Lightbulb
} from 'lucide-react';

export default function AssistantPage() {
  const { user } = useAuth();
  const notify = useNotification();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef(null);

  const promptSuggestions = [
    "How do I crack an Infosys Springboard technical interview?",
    "What core projects should I build for a Full-Stack developer role?",
    "How can I optimize my resume bullet points for high ATS match?",
    "What is the difference between Docker and Kubernetes in simple terms?"
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
        // Initial welcoming message
        setMessages([
          {
            id: 'welcome-1',
            role: 'assistant',
            content: `Hello ${user?.full_name?.split(' ')[0] || 'there'}! 👋 I am your **CareerPulse AI Companion**.\n\nI have your student profile, detected skills, and target internships in memory. Ask me anything about resume improvements, missing skill roadmaps, or interview preparation strategies!`
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
          content: 'Chat history cleared. How can I assist you with your career goals today?'
        }
      ]);
      notify.success('Conversation history reset.');
    } catch (err) {
      notify.error('Failed to clear history.');
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: '950px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>AI Career Companion</h1>
            <span className="badge badge-emerald">Gemini Active</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Context-aware mentor with real-time knowledge of your profile skills, target internships, and mock scores.
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
          height: '620px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Messages Scroll Area */}
        <div style={{
          flex: 1,
          padding: '1.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                {!isUser && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-cyan))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: '#ffffff'
                  }}>
                    <Sparkles size={16} />
                  </div>
                )}

                <div
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: isUser ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color: isUser ? '#ffffff' : 'var(--text-primary)',
                    border: isUser ? 'none' : '1px solid var(--border-card)',
                    fontSize: '0.92rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    boxShadow: isUser ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                  }}
                >
                  {msg.content}
                </div>

                {isUser && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}>
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            );
          })}

          {sending && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', alignSelf: 'flex-start' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <Sparkles size={16} />
              </div>
              <div style={{
                padding: '0.75rem 1rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                <span>CareerPulse AI is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Prompt Chips */}
        <div style={{
          padding: '0.75rem 1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          background: 'rgba(0,0,0,0.1)'
        }}>
          {promptSuggestions.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="btn btn-outline btn-sm"
              style={{
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                padding: '0.35rem 0.75rem',
                gap: '0.35rem'
              }}
            >
              <Lightbulb size={12} color="#f59e0b" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-card)', background: 'var(--bg-secondary)' }}>
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
              placeholder="Ask about resume tips, interview prep, skill gaps, or role requirements..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={sending}
              style={{ padding: '0.75rem 1rem' }}
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.25rem', gap: '0.4rem' }}
            >
              <Send size={18} />
              <span>Send</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
