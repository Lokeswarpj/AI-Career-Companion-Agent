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
  Check
} from 'lucide-react';

export default function InternshipsPage({ setActiveTab, setSelectedInternshipId }) {
  const notify = useNotification();
  const [loading, setLoading] = useState(true);
  const [internships, setInternships] = useState([]);
  const [savedMap, setSavedMap] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [remoteFilter, setRemoteFilter] = useState('All');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');

  useEffect(() => {
    loadInternships();
    loadSavedStatus();
  }, [remoteFilter, industryFilter, sourceFilter]);

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
    loadInternships();
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
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Internship Discovery Engine</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Explore curated campus opportunities, Infosys Springboard programs, and live remote technology internships.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by role title, company, or skills (e.g. Python, React)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.6rem' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <button type="submit" className="btn btn-primary" style={{ gap: '0.4rem' }}>
            <Search size={16} /> Search
          </button>
        </form>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <Filter size={16} />
            <span>Filters:</span>
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
            <option value="Artificial Intelligence">Artificial Intelligence</option>
            <option value="Software Engineering">Software Engineering</option>
            <option value="Cloud & DevOps">Cloud & DevOps</option>
            <option value="Data Science">Data Science</option>
            <option value="Cybersecurity">Cybersecurity</option>
            <option value="FinTech">FinTech</option>
          </select>

          {/* Source */}
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

          <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {internships.length} opportunities
          </span>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Querying live internship directory..." />
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
            return (
              <div 
                key={item.id}
                className="glass-panel"
                style={{
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  position: 'relative'
                }}
              >
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>{item.source}</span>
                      <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{item.remote_type}</span>
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

                {/* Skills tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {(item.required_skills_json || []).map((skill, idx) => (
                    <span key={idx} className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>
                      {skill}
                    </span>
                  ))}
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

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Required Skills</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {(selectedItem.required_skills_json || []).map((s, idx) => (
                  <span key={idx} className="badge badge-indigo">{s}</span>
                ))}
              </div>
            </div>

            {selectedItem.preferred_qualifications && (
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>Preferred Qualifications</h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{selectedItem.preferred_qualifications}</p>
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
