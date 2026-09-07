import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  User, 
  GraduationCap, 
  Briefcase, 
  Code, 
  Award, 
  MapPin, 
  Plus, 
  X, 
  Save, 
  Sparkles,
  FolderGit2
} from 'lucide-react';

export default function ProfilePage() {
  const notify = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    university: '',
    degree: '',
    graduation_year: '',
    location: '',
    preferred_location: '',
    preferred_roles: [],
    technical_skills: [],
    soft_skills: [],
    experience_json: [],
    projects_json: [],
    certifications_json: [],
    preferred_industries: []
  });

  const [newSkill, setNewSkill] = useState('');
  const [newSoftSkill, setNewSoftSkill] = useState('');
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await api.getProfile();
        if (res.profile) {
          setFormData({
            phone: res.profile.phone || '',
            university: res.profile.university || '',
            degree: res.profile.degree || '',
            graduation_year: res.profile.graduation_year || '',
            location: res.profile.location || '',
            preferred_location: res.profile.preferred_location || '',
            preferred_roles: res.profile.preferred_roles || [],
            technical_skills: res.profile.technical_skills || [],
            soft_skills: res.profile.soft_skills || [],
            experience_json: res.profile.experience_json || [],
            projects_json: res.profile.projects_json || [],
            certifications_json: res.profile.certifications_json || [],
            preferred_industries: res.profile.preferred_industries || []
          });
        }
      } catch (err) {
        notify.error('Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile(formData);
      notify.success('Student career profile updated successfully!');
    } catch (err) {
      notify.error(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const addTag = (field, value, setter) => {
    if (!value.trim()) return;
    const current = formData[field] || [];
    if (!current.includes(value.trim())) {
      setFormData({ ...formData, [field]: [...current, value.trim()] });
    }
    setter('');
  };

  const removeTag = (field, index) => {
    const updated = (formData[field] || []).filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: updated });
  };

  if (loading) {
    return <LoadingSpinner message="Loading career profile..." />;
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem', maxWidth: '1000px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Student Career Profile</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            Maintain your educational background, verified skills, target roles, and project portfolio for optimal AI matching.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
          style={{ gap: '0.5rem' }}
        >
          <Save size={18} />
          <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Section 1: Academic Background */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GraduationCap size={20} color="#818cf8" />
            <span>Academic Background & Location</span>
          </h3>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">College / University</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. National Institute of Technology"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Degree & Major</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. B.Tech in Computer Science & Engineering"
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expected Graduation Year</label>
              <input
                type="number"
                className="form-input"
                placeholder="2026"
                value={formData.graduation_year}
                onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                className="form-input"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Current City</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Bengaluru, India"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Internship Location / Work Mode</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Bengaluru / Remote"
                value={formData.preferred_location}
                onChange={(e) => setFormData({ ...formData, preferred_location: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Target Roles & Technical Skills */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Code size={20} color="#22d3ee" />
            <span>Target Roles & Verified Skills</span>
          </h3>

          {/* Target Roles */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Target Internship Roles</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Type a role (e.g. Full-Stack Developer) and press Add..."
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('preferred_roles', newRole, setNewRole); } }}
              />
              <button
                type="button"
                onClick={() => addTag('preferred_roles', newRole, setNewRole)}
                className="btn btn-secondary"
                style={{ whiteSpace: 'nowrap' }}
              >
                <Plus size={16} /> Add Role
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {formData.preferred_roles.map((role, idx) => (
                <span key={idx} className="badge badge-cyan" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.4rem' }}>
                  {role}
                  <X size={14} style={{ cursor: 'pointer' }} onClick={() => removeTag('preferred_roles', idx)} />
                </span>
              ))}
            </div>
          </div>

          {/* Technical Skills */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Technical Skills & Toolchain</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Type a skill (e.g. React, Python, Docker, PyTorch) and press Add..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('technical_skills', newSkill, setNewSkill); } }}
              />
              <button
                type="button"
                onClick={() => addTag('technical_skills', newSkill, setNewSkill)}
                className="btn btn-secondary"
                style={{ whiteSpace: 'nowrap' }}
              >
                <Plus size={16} /> Add Skill
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {formData.technical_skills.map((skill, idx) => (
                <span key={idx} className="badge badge-indigo" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.4rem' }}>
                  {skill}
                  <X size={14} style={{ cursor: 'pointer' }} onClick={() => removeTag('technical_skills', idx)} />
                </span>
              ))}
            </div>
          </div>

          {/* Soft Skills */}
          <div className="form-group">
            <label className="form-label">Soft Skills & Methodologies</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Agile, Team Leadership, Problem Solving..."
                value={newSoftSkill}
                onChange={(e) => setNewSoftSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('soft_skills', newSoftSkill, setNewSoftSkill); } }}
              />
              <button
                type="button"
                onClick={() => addTag('soft_skills', newSoftSkill, setNewSoftSkill)}
                className="btn btn-secondary"
                style={{ whiteSpace: 'nowrap' }}
              >
                <Plus size={16} /> Add
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {formData.soft_skills.map((skill, idx) => (
                <span key={idx} className="badge badge-emerald" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.4rem' }}>
                  {skill}
                  <X size={14} style={{ cursor: 'pointer' }} onClick={() => removeTag('soft_skills', idx)} />
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Section 3: Student Project Portfolio */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderGit2 size={20} color="#34d399" />
              <span>Key Projects & Experience</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  ...formData,
                  projects_json: [
                    ...formData.projects_json,
                    { title: 'New Project Title', technologies: 'React, Node.js', description: 'Brief overview of architecture and measurable outcomes.' }
                  ]
                });
              }}
              className="btn btn-outline btn-sm"
              style={{ gap: '0.35rem' }}
            >
              <Plus size={14} /> Add Project
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {formData.projects_json.map((proj, idx) => (
              <div key={idx} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Project Title"
                    value={proj.title}
                    onChange={(e) => {
                      const updated = [...formData.projects_json];
                      updated[idx].title = e.target.value;
                      setFormData({ ...formData, projects_json: updated });
                    }}
                    style={{ fontWeight: 600, maxWidth: '60%' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = formData.projects_json.filter((_, i) => i !== idx);
                      setFormData({ ...formData, projects_json: updated });
                    }}
                    className="btn btn-danger btn-sm"
                    style={{ padding: '0.3rem 0.6rem' }}
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Technologies Used (e.g. Python, PyTorch, FastAPI)"
                  value={proj.technologies}
                  onChange={(e) => {
                    const updated = [...formData.projects_json];
                    updated[idx].technologies = e.target.value;
                    setFormData({ ...formData, projects_json: updated });
                  }}
                  style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}
                />
                <textarea
                  className="form-textarea"
                  placeholder="Description of the project, architecture, and impact..."
                  value={proj.description}
                  onChange={(e) => {
                    const updated = [...formData.projects_json];
                    updated[idx].description = e.target.value;
                    setFormData({ ...formData, projects_json: updated });
                  }}
                  style={{ minHeight: '65px', fontSize: '0.85rem' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Submit Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-lg"
            style={{ gap: '0.5rem' }}
          >
            <Save size={18} />
            <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
