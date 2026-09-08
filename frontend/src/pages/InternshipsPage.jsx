import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { 
  Briefcase, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Bookmark, 
  ExternalLink, 
  Sparkles, 
  Mic, 
  Layers,
  Building,
  Check,
  Cpu,
  Database,
  ArrowRight,
  Sliders
} from 'lucide-react';

export default function InternshipsPage({ setActiveTab, setSelectedInternshipId }) {
  const notify = useNotification();
  const [loading, setLoading] = useState(true);
  const [searchMode, setSearchMode] = useState('semantic'); // 'semantic' | 'filter'
  const [internships, setInternships] = useState([]);
  const [savedMap, setSavedMap] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [stats, setStats] = useState(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [semanticQuery, setSemanticQuery] = useState('remote AI machine learning internship with PyTorch');
  const [remoteFilter, setRemoteFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');

  const sampleQueries = [
    { label: "⚡ Remote AI & LLMs", query: "remote generative AI machine learning with PyTorch and LLMs" },
    { label: "🌐 Full-Stack React & Node", query: "full-stack React web developer with Node.js and PostgreSQL" },
    { label: "☁️ Cloud & DevOps", query: "cloud infrastructure DevOps containerization Docker Kubernetes" },
    { label: "🛡️ Cybersecurity SOC", query: "cybersecurity analyst threat hunting penetration testing Wireshark" },
    { label: "📊 Data Analytics & BI", query: "data analytics SQL Tableau dashboards business metrics" }
  ];

  useEffect(() => {
    loadStats();
    loadSavedStatus();
    if (searchMode === 'semantic') {
      handleSemanticSearch(semanticQuery);
    } else {
      loadInternships();
    }
  }, [searchMode, remoteFilter, industryFilter, sourceFilter]);

  async function loadStats() {
    try {
      const res = await api.getInternshipStats();
      setStats(res);
    } catch (err) {}
  }

  async function loadInternships() {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (remoteFilter !== 'All') params.remote = remoteFilter;
      if (industryFilter !== 'All') params.industry = industryFilter;
      if (sourceFilter !== 'All') params.source = sourceFilter;

      const res = await api.getInternships(params);
      setInternships(res.internships || []);
    } catch (err) {
      notify.error('Failed to load internships.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSemanticSearch(queryToRun) {
    const q = queryToRun || semanticQuery;
    if (!q.trim()) return;
    try {
      setLoading(true);
      const params = {};
      if (remoteFilter !== 'All') params.remote = remoteFilter;
      if (industryFilter !== 'All') params.industry = industryFilter;

      const res = await api.searchInternshipsRag(q, params);
      setInternships(res.results || []);
    } catch (err) {
      notify.error('Semantic RAG search failed.');
    } finally {
      setLoading(false);
    }
  }

  async function loadSavedStatus() {
    try {
      const res = await api.getSavedInternships();
      const map = {};
      (res.saved || []).forEach(s => {
        map[s.internship.id] = s.status;
      });
      setSavedMap(map);
    } catch (err) {}
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchMode === 'semantic') {
      handleSemanticSearch(semanticQuery);
    } else {
      loadInternships();
    }
  };

  const handleToggleSave = async (id) => {
    try {
      if (savedMap[id]) {
        await api.removeSavedInternship(id);
        const copy = { ...savedMap };
        delete copy[id];
        setSavedMap(copy);
        notify.info('Internship removed from saved list.');
      } else {
        await api.saveInternship(id, { status: 'saved' });
        setSavedMap({ ...savedMap, [id]: 'saved' });
        notify.success('Internship bookmarked to application tracker!');
      }
    } catch (err) {
      notify.error('Failed to update bookmark.');
    }
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', marginBottom: '0.5rem' }}>
          <span className="badge badge-indigo">Milestone 2 • 180 Curated Postings & Vector Store</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Internship Knowledge Base & RAG Engine</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '750px' }}>
          Query over 180 curated, standardized industry internship postings indexed into 720 semantic vector chunks with dual-mode dense embeddings and cosine similarity retrieval.
        </p>
      </div>

      {/* Dataset Statistics Metric Bar */}
      {stats && (
        <div className="glass-panel" style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Knowledge Base</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-primary)' }}>{stats.totalInternships} Postings</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Vector Index</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#22d3ee' }}>{stats.totalIndexedChunks} Chunks</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tech Tracks</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-emerald)' }}>15+ Domains</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Embedding Engine</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fbbf24', marginTop: '0.35rem' }}>Dual Gemini / High-Dim Vector</div>
          </div>
        </div>
      )}

      {/* Mode Switcher Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setSearchMode('semantic')}
          className={`btn ${searchMode === 'semantic' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ gap: '0.4rem' }}
        >
          <Sparkles size={16} />
          <span>Natural Language RAG Search</span>
        </button>
        <button
          onClick={() => setSearchMode('filter')}
          className={`btn ${searchMode === 'filter' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          style={{ gap: '0.4rem' }}
        >
          <Sliders size={16} />
          <span>Keyword & Multi-Filter Catalog</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 320px' }}>
            {searchMode === 'semantic' ? (
              <input
                type="text"
                className="form-input"
                placeholder="Describe your target role in plain English (e.g. remote machine learning with PyTorch and NLP)..."
                value={semanticQuery}
                onChange={(e) => setSemanticQuery(e.target.value)}
                style={{ paddingLeft: '2.6rem' }}
              />
            ) : (
              <input
                type="text"
                className="form-input"
                placeholder="Search by role title, company, or skills (e.g. Python, React)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.6rem' }}
              />
            )}
            <Search size={18} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ gap: '0.4rem' }}>
            <Search size={16} /> {searchMode === 'semantic' ? 'Semantic Retrieve' : 'Filter Search'}
          </button>
        </form>

        {/* Quick query chips in semantic mode */}
        {searchMode === 'semantic' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Sample Prompts:</span>
            {sampleQueries.map((sq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSemanticQuery(sq.query);
                  handleSemanticSearch(sq.query);
                }}
                className="badge badge-cyan"
                style={{ cursor: 'pointer', border: 'none', padding: '0.35rem 0.65rem' }}
              >
                {sq.label}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <Filter size={16} />
            <span>Predicates:</span>
          </div>

          {/* Work Mode */}
          <select
            className="form-select"
            value={remoteFilter}
            onChange={(e) => setRemoteFilter(e.target.value)}
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          >
            <option value="All">Work Mode: All</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>

          {/* Industry */}
          <select
            className="form-select"
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
          >
            <option value="All">Industry: All</option>
            <option value="Artificial Intelligence & ML">AI & Machine Learning</option>
            <option value="Full-Stack & Web Engineering">Full-Stack & Web</option>
            <option value="Cloud & DevOps Engineering">Cloud & DevOps</option>
            <option value="Data Engineering & Analytics">Data & Analytics</option>
            <option value="Cybersecurity & Information Security">Cybersecurity</option>
            <option value="Mobile Application Development">Mobile Development</option>
            <option value="Enterprise Software & Java">Enterprise Java</option>
          </select>

          {/* Source Filter (Only in keyword mode) */}
          {searchMode === 'filter' && (
            <select
              className="form-select"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            >
              <option value="All">Source: All</option>
              <option value="Infosys Springboard">Infosys Springboard</option>
              <option value="Campus Portal">Campus Portal</option>
              <option value="RemoteOK">RemoteOK</option>
              <option value="Adzuna">Adzuna</option>
            </select>
          )}

          <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {internships.length} opportunities
          </span>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message={searchMode === 'semantic' ? "Executing dense vector cosine similarity search across 720 chunks..." : "Querying internship knowledge base..."} />
      ) : internships.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Briefcase size={40} style={{ margin: '0 auto 1rem auto', color: 'var(--text-muted)' }} />
          <h3>No internships found matching your criteria</h3>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Try clearing filters or searching for broader keywords like Python or Web.</p>
        </div>
      ) : (
        <div className="grid-2" style={{ gap: '1.5rem' }}>
          {internships.map((item) => {
            const isSaved = !!savedMap[item.id];
            const semScore = item.semanticScore;
            return (
              <div 
                key={item.id}
                className="glass-panel"
                style={{
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative',
                  borderLeft: semScore ? `4px solid ${semScore >= 60 ? '#10b981' : '#6366f1'}` : '1px solid var(--border-card)'
                }}
              >
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>{item.source}</span>
                      <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{item.remote_type}</span>
                      {semScore && (
                        <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                          ⚡ {semScore}% Semantic Alignment
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Building size={14} /> {item.company}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={14} /> {item.location}
                      </span>
                    </div>
                  </div>

                  {/* Bookmark button */}
                  <button
                    onClick={() => handleToggleSave(item.id)}
                    className="btn btn-outline btn-sm"
                    style={{
                      padding: '0.5rem',
                      borderRadius: '50%',
                      background: isSaved ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                      borderColor: isSaved ? 'var(--accent-amber)' : 'var(--border-card)',
                      color: isSaved ? 'var(--accent-amber)' : 'var(--text-muted)'
                    }}
                    title={isSaved ? 'Bookmarked in Tracker' : 'Bookmark this opportunity'}
                  >
                    <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Description snippet */}
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.description}
                </p>

                {/* Matched Chunk Highlight (If Semantic Search) */}
                {item.bestMatchedChunk && (
                  <div style={{
                    padding: '0.6rem 0.85rem',
                    background: 'rgba(99, 102, 241, 0.08)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: '3px solid var(--accent-primary)',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>Matched Chunk ({item.bestMatchedChunk.type}): </span>
                    <span>{item.bestMatchedChunk.text.slice(0, 140)}...</span>
                  </div>
                )}

                {/* Skills tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {(item.required_skills_json || []).slice(0, 5).map((skill, idx) => (
                    <span key={idx} className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>
                      {skill}
                    </span>
                  ))}
                  {(item.required_skills_json || []).length > 5 && (
                    <span className="badge" style={{ fontSize: '0.72rem', background: 'var(--bg-tertiary)' }}>
                      +{(item.required_skills_json || []).length - 5} more
                    </span>
                  )}
                </div>

                {/* Card footer with stipend and action buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-subtle)',
                  marginTop: 'auto',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                      {item.stipend || 'Stipend available'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Duration: {item.duration || '3 Months'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="btn btn-secondary btn-sm"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => {
                        setSelectedInternshipId(item.id);
                        setActiveTab('skill-gap');
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ gap: '0.3rem' }}
                    >
                      <Sparkles size={14} color="#818cf8" />
                      <span>Skill Gap</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedInternshipId(item.id);
                        setActiveTab('mock-interview');
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ gap: '0.3rem' }}
                    >
                      <Mic size={14} />
                      <span>Interview</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Internship Details Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.title || 'Internship Details'}
      >
        {selectedItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{selectedItem.company}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedItem.location} ({selectedItem.remote_type})</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>{selectedItem.stipend}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Duration: {selectedItem.duration}</div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>Role Description</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedItem.description}</p>
            </div>

            {selectedItem.responsibilities_json && selectedItem.responsibilities_json.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>Core Responsibilities</h4>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {selectedItem.responsibilities_json.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Required Skills</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {(selectedItem.required_skills_json || []).map((s, idx) => (
                  <span key={idx} className="badge badge-indigo">{s}</span>
                ))}
              </div>
            </div>

            {selectedItem.preferred_skills_json && selectedItem.preferred_skills_json.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Preferred / Nice-to-Have Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {selectedItem.preferred_skills_json.map((s, idx) => (
                    <span key={idx} className="badge badge-cyan">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedItem.education_requirements && (
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>Education & Background Fit</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{selectedItem.education_requirements}</p>
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
              marginTop: '0.5rem'
            }}>
              <a
                href={selectedItem.apply_url || '#'}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
                style={{ gap: '0.4rem' }}
              >
                <span>Direct Application Link</span>
                <ExternalLink size={14} />
              </a>

              <button
                onClick={() => {
                  setSelectedInternshipId(selectedItem.id);
                  setSelectedItem(null);
                  setActiveTab('skill-gap');
                }}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.4rem' }}
              >
                <Sparkles size={14} color="#818cf8" />
                <span>Evaluate Skill Gaps</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
