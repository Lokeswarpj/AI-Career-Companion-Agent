import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Briefcase,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Search,
  Filter,
  Plus,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  ChevronRight,
  FileText,
  Mic,
  Trash2,
  Edit3,
  ExternalLink,
  MapPin,
  Building,
  DollarSign,
  User,
  LayoutGrid,
  List,
  Flame,
  ArrowUpDown,
  Tag,
  Check,
  RefreshCw
} from 'lucide-react';

const STAGE_CONFIG = {
  'Saved': { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' },
  'Planning to Apply': { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)' },
  'Applied': { color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)', border: 'rgba(129, 140, 248, 0.3)' },
  'Under Review': { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.12)', border: 'rgba(192, 132, 252, 0.3)' },
  'Shortlisted': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' },
  'Interview Scheduled': { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.4)' },
  'Interview Completed': { color: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.12)', border: 'rgba(45, 212, 191, 0.3)' },
  'Offer Received': { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' },
  'Rejected': { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.3)' },
  'Withdrawn': { color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', border: 'rgba(100, 116, 139, 0.3)' }
};

const KANBAN_COLUMNS = [
  { id: 'saved_planning', title: 'Saved & Planning', stages: ['Saved', 'Planning to Apply'], icon: BookmarkIcon, accent: '#38bdf8' },
  { id: 'applied_review', title: 'Applied & In Review', stages: ['Applied', 'Under Review'], icon: SendIcon, accent: '#818cf8' },
  { id: 'interviewing', title: 'Interviews & Next Steps', stages: ['Shortlisted', 'Interview Scheduled', 'Interview Completed'], icon: Mic, accent: '#06b6d4' },
  { id: 'decisions', title: 'Offers & Final Decisions', stages: ['Offer Received', 'Rejected', 'Withdrawn'], icon: Award, accent: '#10b981' }
];

function BookmarkIcon(props) {
  return <Briefcase {...props} />;
}
function SendIcon(props) {
  return <ArrowRight {...props} />;
}

export default function ApplicationsPage({ setActiveTab, setSelectedInternshipId }) {
  const notify = useNotification();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStage, setFilterStage] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [sortBy, setSortBy] = useState('updated_at');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [curatedList, setCuratedList] = useState([]);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    company_name: '',
    role_title: '',
    internship_id: '',
    job_description: '',
    location: 'Remote',
    stipend: '₹25,000/month',
    status: 'Saved',
    priority: 'Medium',
    application_date: '',
    deadline: '',
    interview_date: '',
    interview_type: 'Virtual',
    interview_status: 'None',
    notes: '',
    applied_url: '',
    contact_person: ''
  });

  useEffect(() => {
    loadData();
    loadCuratedInternships();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [appsRes, statsRes] = await Promise.all([
        api.getApplications({ search: searchTerm, status: filterStage, priority: filterPriority, sortBy }),
        api.getApplicationStats()
      ]);
      setApplications(appsRes.applications || []);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load applications:', err);
      notify.error('Failed to load application tracker data.');
    } finally {
      setLoading(false);
    }
  }

  async function loadCuratedInternships() {
    try {
      const res = await api.getInternships({ limit: 100 });
      setCuratedList(res.internships || []);
    } catch (err) {
      console.warn('Failed to load curated list:', err);
    }
  }

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await api.updateApplicationStatus(appId, newStatus);
      notify.success(`Status updated to "${newStatus}"`);
      loadData();
    } catch (err) {
      notify.error('Failed to update status.');
    }
  };

  const handleDelete = async (appId, company) => {
    if (!window.confirm(`Remove application for ${company} from your tracker?`)) return;
    try {
      await api.deleteTrackerApplication(appId);
      notify.success('Application removed from tracker.');
      if (showDetailModal) setShowDetailModal(false);
      loadData();
    } catch (err) {
      notify.error('Failed to delete application.');
    }
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formData.company_name || !formData.role_title) {
      notify.error('Please enter Company Name and Role Title.');
      return;
    }

    try {
      if (selectedApp) {
        await api.updateApplication(selectedApp.id, formData);
        notify.success('Application updated successfully.');
        setShowDetailModal(false);
      } else {
        await api.createApplication(formData);
        notify.success('Application added to tracker.');
        setShowAddModal(false);
      }
      loadData();
    } catch (err) {
      notify.error(err.message || 'Failed to save application.');
    }
  };

  const openEditModal = (app) => {
    setSelectedApp(app);
    setFormData({
      company_name: app.company_name || '',
      role_title: app.role_title || '',
      internship_id: app.internship_id || '',
      job_description: app.job_description || '',
      location: app.location || 'Remote',
      stipend: app.stipend || 'Competitive',
      status: app.status || 'Saved',
      priority: app.priority || 'Medium',
      application_date: app.application_date || '',
      deadline: app.deadline || '',
      interview_date: app.interview_date || '',
      interview_type: app.interview_type || 'Virtual',
      interview_status: app.interview_status || 'None',
      notes: app.notes || '',
      applied_url: app.applied_url || '',
      contact_person: app.contact_person || ''
    });
    setShowDetailModal(true);
  };

  const openAddModal = () => {
    setSelectedApp(null);
    setFormData({
      company_name: '',
      role_title: '',
      internship_id: '',
      job_description: '',
      location: 'Remote',
      stipend: '₹25,000/month',
      status: 'Saved',
      priority: 'Medium',
      application_date: new Date().toISOString().split('T')[0],
      deadline: '',
      interview_date: '',
      interview_type: 'Virtual',
      interview_status: 'None',
      notes: '',
      applied_url: '',
      contact_person: ''
    });
    setShowAddModal(true);
  };

  const handleCuratedSelect = (internshipId) => {
    const found = curatedList.find(c => c.id === internshipId);
    if (found) {
      setFormData(prev => ({
        ...prev,
        internship_id: found.id,
        company_name: found.company,
        role_title: found.title,
        job_description: found.description,
        location: found.location,
        stipend: found.stipend,
        deadline: found.deadline || '',
        applied_url: found.apply_url || ''
      }));
    }
  };

  // Filtered applications
  const filteredApps = applications.filter(app => {
    const matchSearch = !searchTerm || 
      (app.company_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.role_title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.location?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.notes?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStage = filterStage === 'All' || app.status === filterStage;
    const matchPriority = filterPriority === 'All' || app.priority === filterPriority;

    return matchSearch && matchStage && matchPriority;
  });

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: '1400px' }}>
      
      {/* 1. Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'inline-flex', marginBottom: '0.4rem' }}>
            <span className="badge badge-indigo">
              <Sparkles size={13} style={{ marginRight: '0.35rem' }} />
              Application Lifecycle Manager
            </span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
            Application Tracking & Deadlines
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Monitor internship pipelines, manage stage transitions, schedule mock prep, and keep deadlines on track.
          </p>
        </div>

        {/* View Toggle & Add Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            background: 'var(--bg-secondary)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)'
          }}>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: viewMode === 'kanban' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'kanban' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              <LayoutGrid size={15} />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: viewMode === 'list' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
            >
              <List size={15} />
              <span>List View</span>
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="btn btn-primary"
            style={{ gap: '0.5rem', fontWeight: 700, padding: '0.65rem 1.25rem' }}
          >
            <Plus size={18} />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* 2. Top Stats & Conversion Metric Cards */}
      {stats && (
        <div className="grid-4" style={{ marginBottom: '2rem', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active Applications</span>
              <Briefcase size={18} color="#818cf8" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {stats.activeApplications} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {stats.totalApplications} total</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <TrendingUp size={13} /> {stats.completedApplications} completed / decisioned
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Interviews Scheduled</span>
              <Mic size={18} color="#06b6d4" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#06b6d4' }}>
              {stats.interviewsScheduled}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
              {stats.interviewRate}% interview conversion rate
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Offers Received</span>
              <Award size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#10b981' }}>
              {stats.offersReceived}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
              {stats.offerRate}% application-to-offer rate
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Upcoming Deadlines</span>
              <Clock size={18} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: (stats.deadlineReminders?.length || 0) > 0 ? '#f59e0b' : 'var(--text-primary)' }}>
              {stats.deadlineReminders?.length || 0}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              Within next 14 days
            </div>
          </div>
        </div>
      )}

      {/* 3. Deadline & Interview Reminders Alert Banner */}
      {stats && (stats.deadlineReminders?.length > 0 || stats.interviewReminders?.length > 0) && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#f59e0b', fontSize: '0.92rem' }}>
            <Flame size={18} />
            <span>Time-Sensitive Action Items & Reminders</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
            {stats.interviewReminders?.map((rem, i) => (
              <div key={`int-${i}`} style={{
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.45rem 0.85rem',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Mic size={14} color="#06b6d4" />
                <span><strong>{rem.company_name}</strong> ({rem.role_title}) • <span style={{ color: '#06b6d4', fontWeight: 600 }}>{rem.label}</span></span>
              </div>
            ))}

            {stats.deadlineReminders?.slice(0, 4).map((rem, i) => {
              const isCrit = rem.urgency === 'overdue' || rem.urgency === 'critical_today' || rem.urgency === 'critical_3days';
              return (
                <div key={`dl-${i}`} style={{
                  background: isCrit ? 'rgba(244, 63, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  border: `1px solid ${isCrit ? 'rgba(244, 63, 94, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Clock size={14} color={isCrit ? '#f43f5e' : '#f59e0b'} />
                  <span><strong>{rem.company_name}</strong> • <span style={{ color: isCrit ? '#f43f5e' : '#f59e0b', fontWeight: 700 }}>{rem.label}</span></span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Filter & Search Toolbar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by company, role, location, or notes..."
              className="form-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', fontSize: '0.88rem' }}
            />
          </div>

          {/* Stage Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} color="var(--text-muted)" />
            <select
              className="form-select"
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem' }}
            >
              <option value="All">All Stages ({applications.length})</option>
              {Object.keys(STAGE_CONFIG).map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tag size={15} color="var(--text-muted)" />
            <select
              className="form-select"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem' }}
            >
              <option value="All">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          {/* Sort Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpDown size={15} color="var(--text-muted)" />
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem' }}
            >
              <option value="updated_at">Recently Updated</option>
              <option value="deadline">Deadline</option>
              <option value="application_date">Application Date</option>
              <option value="company_name">Company Name</option>
              <option value="priority">Priority</option>
            </select>
          </div>

          <button
            onClick={loadData}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.45rem 0.75rem' }}
            title="Refresh list"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {loading && applications.length === 0 && (
        <LoadingSpinner message="Loading your application tracker pipeline..." />
      )}

      {/* 5. Main View Area */}
      {!loading && filteredApps.length === 0 && (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', margin: '2rem 0' }}>
          <Briefcase size={54} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto', opacity: 0.7 }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>No Applications Found</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 1.5rem auto', fontSize: '0.92rem' }}>
            {searchTerm || filterStage !== 'All' 
              ? 'No applications match your active search filters. Clear filters to see all entries.'
              : 'Start tracking your dream internships! Add applications directly or import opportunities with 1 click from the Internships directory.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <button onClick={openAddModal} className="btn btn-primary">
              <Plus size={16} />
              <span>Add Your First Application</span>
            </button>
            {setActiveTab && (
              <button onClick={() => setActiveTab('internships')} className="btn btn-secondary">
                <Search size={16} />
                <span>Explore 180 Curated Internships</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5A. Kanban Board View */}
      {viewMode === 'kanban' && filteredApps.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '1.25rem',
          alignItems: 'start'
        }}>
          {KANBAN_COLUMNS.map(col => {
            const colApps = filteredApps.filter(a => col.stages.includes(a.status));
            const ColIcon = col.icon;

            return (
              <div
                key={col.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  minHeight: '480px'
                }}
              >
                {/* Column Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: `${col.accent}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ColIcon size={16} color={col.accent} />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                      {col.title}
                    </span>
                  </div>
                  <span style={{
                    background: 'var(--bg-secondary)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)'
                  }}>
                    {colApps.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {colApps.length === 0 ? (
                    <div style={{
                      padding: '2rem 1rem',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem',
                      border: '1px dashed rgba(255, 255, 255, 0.1)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      No applications in this phase
                    </div>
                  ) : (
                    colApps.map(app => (
                      <KanbanCard
                        key={app.id}
                        app={app}
                        onEdit={() => openEditModal(app)}
                        onDelete={() => handleDelete(app.id, app.company_name)}
                        onStatusChange={handleStatusChange}
                        setActiveTab={setActiveTab}
                        setSelectedInternshipId={setSelectedInternshipId}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5B. Table / List View */}
      {viewMode === 'list' && filteredApps.length > 0 && (
        <div className="glass-panel" style={{ overflowX: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ padding: '1rem' }}>Company & Role</th>
                <th style={{ padding: '1rem' }}>Current Stage</th>
                <th style={{ padding: '1rem' }}>Priority</th>
                <th style={{ padding: '1rem' }}>Deadline & Urgency</th>
                <th style={{ padding: '1rem' }}>Interview Status</th>
                <th style={{ padding: '1rem' }}>Materials</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map(app => {
                const stageCfg = STAGE_CONFIG[app.status] || STAGE_CONFIG['Saved'];
                return (
                  <tr
                    key={app.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.2s'
                    }}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{app.role_title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <span>{app.company_name}</span>
                        <span>•</span>
                        <span>{app.location}</span>
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        style={{
                          background: stageCfg.bg,
                          color: stageCfg.color,
                          border: `1px solid ${stageCfg.border}`,
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.3rem 0.6rem',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        {Object.keys(STAGE_CONFIG).map(st => (
                          <option key={st} value={st} style={{ background: '#0f172a', color: '#fff' }}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${app.priority === 'High' ? 'badge-rose' : app.priority === 'Medium' ? 'badge-amber' : 'badge-indigo'}`} style={{ fontSize: '0.75rem' }}>
                        {app.priority}
                      </span>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      {app.deadline ? (
                        <div>
                          <div>{app.deadline}</div>
                          {app.deadlineInfo?.label && (
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: app.deadlineInfo.urgency === 'overdue' || app.deadlineInfo.urgency.startsWith('critical') ? '#f43f5e' : '#f59e0b'
                            }}>
                              {app.deadlineInfo.label}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Not specified</span>
                      )}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      {app.interview_date ? (
                        <div style={{ color: '#06b6d4', fontSize: '0.82rem', fontWeight: 600 }}>
                          {new Date(app.interview_date).toLocaleDateString()} ({app.interview_type})
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None scheduled</span>
                      )}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      {app.hasTailoredMaterials ? (
                        <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                          <Check size={12} /> Tailored {app.atsScore ? `(${app.atsScore}% ATS)` : ''}
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (setSelectedInternshipId && app.internship_id) setSelectedInternshipId(app.internship_id);
                            if (setActiveTab) setActiveTab('customizer');
                          }}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                        >
                          Tailor Materials
                        </button>
                      )}
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          onClick={() => openEditModal(app)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.6rem' }}
                          title="View & Edit Application"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(app.id, app.company_name)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.6rem', color: '#f43f5e' }}
                          title="Delete Application"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. Add / Edit Application Modal */}
      {(showAddModal || showDetailModal) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1.5rem'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                {selectedApp ? 'Edit Application Details' : 'Track New Internship Application'}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setShowDetailModal(false); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
              >
                <XCircle size={22} />
              </button>
            </div>

            {/* Quick Populate from Curated Internships (on create only) */}
            {!selectedApp && curatedList.length > 0 && (
              <div style={{ marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)' }}>
                  <Sparkles size={15} />
                  <span>Quick-Fill from Curated Postings (Optional):</span>
                </label>
                <select
                  className="form-select"
                  value={formData.internship_id}
                  onChange={(e) => handleCuratedSelect(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="">-- Choose an Internship to Auto-Fill Details --</option>
                  {curatedList.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.title} at {item.company} ({item.location})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={handleSaveForm} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Role Title *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Full-Stack Web Developer Intern"
                    value={formData.role_title}
                    onChange={(e) => setFormData({ ...formData, role_title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Infosys, Swiggy, Google"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Application Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {Object.keys(STAGE_CONFIG).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority Level</label>
                  <select
                    className="form-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Application Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.application_date}
                    onChange={(e) => setFormData({ ...formData, application_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Application Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Location / Work Mode</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Bengaluru / Hybrid"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Stipend / Compensation</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ₹25,000/month"
                    value={formData.stipend}
                    onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
                  />
                </div>
              </div>

              {/* Interview Scheduling Section */}
              <div style={{ background: 'rgba(6, 182, 212, 0.06)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#06b6d4', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Mic size={16} />
                  <span>Interview Schedule & Coordination (Optional)</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Interview Date & Time</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={formData.interview_date}
                      onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Interview Format</label>
                    <select
                      className="form-select"
                      value={formData.interview_type}
                      onChange={(e) => setFormData({ ...formData, interview_type: e.target.value })}
                    >
                      <option value="Virtual">Virtual / Video Call</option>
                      <option value="In-Person">In-Person Campus/Office</option>
                      <option value="Technical Phone Screen">Technical Phone Screen</option>
                      <option value="Take-Home Assessment">Take-Home Assessment</option>
                      <option value="HR Discussion">HR / Behavioral Round</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Application URL / Link</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://company.com/careers/job/123"
                  value={formData.applied_url}
                  onChange={(e) => setFormData({ ...formData, applied_url: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Private Notes, Interview Feedback & Follow-ups</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Followed up on LinkedIn with hiring manager on Tuesday. Highlighted AWS & React project in Round 1."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                {selectedApp ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedApp.id, selectedApp.company_name)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#f43f5e' }}
                  >
                    <Trash2 size={15} />
                    <span>Delete</span>
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); setShowDetailModal(false); }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ fontWeight: 700 }}>
                    {selectedApp ? 'Save Changes' : 'Create Application'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// 7. Kanban Card Component
function KanbanCard({ app, onEdit, onDelete, onStatusChange, setActiveTab, setSelectedInternshipId }) {
  const stageCfg = STAGE_CONFIG[app.status] || STAGE_CONFIG['Saved'];
  const allStages = Object.keys(STAGE_CONFIG);
  const currentIdx = allStages.indexOf(app.status);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.15rem',
        borderLeft: `4px solid ${stageCfg.color}`,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onClick={onEdit}
    >
      {/* Top Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span className={`badge ${app.priority === 'High' ? 'badge-rose' : app.priority === 'Medium' ? 'badge-amber' : 'badge-indigo'}`} style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>
            {app.priority}
          </span>
          {app.location && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {app.location}
            </span>
          )}
        </div>

        {/* Deadline Urgency Badge */}
        {app.deadlineInfo?.urgency && app.deadlineInfo.urgency !== 'none' && (
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '0.15rem 0.45rem',
            borderRadius: '4px',
            background: app.deadlineInfo.urgency === 'overdue' || app.deadlineInfo.urgency.startsWith('critical') ? 'rgba(244, 63, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: app.deadlineInfo.urgency === 'overdue' || app.deadlineInfo.urgency.startsWith('critical') ? '#f43f5e' : '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <Clock size={11} />
            {app.deadlineInfo.label}
          </span>
        )}
      </div>

      {/* Role & Company */}
      <div>
        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
          {app.role_title}
        </h4>
        <div style={{ color: 'var(--accent-primary)', fontSize: '0.88rem', fontWeight: 600, marginTop: '0.25rem' }}>
          {app.company_name}
        </div>
      </div>

      {/* Interview alert if present */}
      {app.interview_date && (
        <div style={{
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.4rem 0.6rem',
          fontSize: '0.75rem',
          color: '#06b6d4',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}>
          <Mic size={13} />
          <span>Interview: {new Date(app.interview_date).toLocaleDateString()} ({app.interview_type})</span>
        </div>
      )}

      {/* Notes snippet if present */}
      {app.notes && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          "{app.notes}"
        </div>
      )}

      {/* Quick Status Shift & Multi-Agent Prep Buttons */}
      <div 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.65rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Quick Launch Mock Prep for this Role */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {setActiveTab && (
            <button
              onClick={() => {
                if (setSelectedInternshipId && app.internship_id) setSelectedInternshipId(app.internship_id);
                setActiveTab('mock-interview');
              }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', gap: '0.3rem' }}
              title="Practice Mock Interview for this role"
            >
              <Mic size={12} color="#06b6d4" />
              <span>Prep</span>
            </button>
          )}

          {setActiveTab && (
            <button
              onClick={() => {
                if (setSelectedInternshipId && app.internship_id) setSelectedInternshipId(app.internship_id);
                setActiveTab('customizer');
              }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', gap: '0.3rem' }}
              title="Tailor Resume & Cover Letter"
            >
              <FileText size={12} color="#10b981" />
              <span>Tailor</span>
            </button>
          )}
        </div>

        {/* Status Stepper Dropdown */}
        <select
          value={app.status}
          onChange={(e) => onStatusChange(app.id, e.target.value)}
          style={{
            background: stageCfg.bg,
            color: stageCfg.color,
            border: `1px solid ${stageCfg.border}`,
            borderRadius: 'var(--radius-sm)',
            padding: '0.25rem 0.5rem',
            fontWeight: 700,
            fontSize: '0.74rem',
            cursor: 'pointer',
            maxWidth: '125px'
          }}
        >
          {allStages.map(s => (
            <option key={s} value={s} style={{ background: '#0f172a', color: '#fff' }}>
              {s}
            </option>
          ))}
        </select>
      </div>

    </div>
  );
}
