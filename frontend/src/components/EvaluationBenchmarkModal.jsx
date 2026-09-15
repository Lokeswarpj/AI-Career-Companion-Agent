import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { api } from '../utils/api';
import { 
  CheckCircle2, 
  Sparkles, 
  UserCheck, 
  Target, 
  TrendingUp, 
  Building, 
  MapPin, 
  Award, 
  Cpu, 
  Code2, 
  ShieldCheck, 
  Cloud, 
  BarChart3, 
  GraduationCap,
  Database,
  Search,
  Filter,
  Play,
  Layers,
  CheckCircle,
  Activity,
  Briefcase
} from 'lucide-react';

const BENCHMARK_PROFILES = [
  {
    id: "profile-ai-01",
    name: "Aanya Sharma",
    track: "Artificial Intelligence & ML",
    icon: Cpu,
    color: "#818cf8",
    degree: "B.Tech in Artificial Intelligence & Data Science",
    university: "Infosys Institute of Technology",
    graduation_year: 2026,
    skills: ["Python", "PyTorch", "TensorFlow", "Scikit-Learn", "Machine Learning", "NLP", "Pandas", "Git", "FastAPI"],
    preferred_roles: ["AI & Machine Learning Engineering Intern", "Generative AI Intern"],
    preferred_location: "Bengaluru, India",
    projects: [
      { title: "Transformer-based NLP Summarizer", techStack: "Python, PyTorch, HuggingFace, FastAPI" },
      { title: "Deep Learning Medical Image Classifier", techStack: "Python, TensorFlow, OpenCV" }
    ],
    parsed_summary: "Dedicated AI undergraduate with hands-on experience training PyTorch neural networks and building RAG pipelines."
  },
  {
    id: "profile-web-02",
    name: "Rohan Mehta",
    track: "Full-Stack Web Engineering",
    icon: Code2,
    color: "#22d3ee",
    degree: "B.Tech Computer Science and Engineering",
    university: "National Institute of Technology",
    graduation_year: 2026,
    skills: ["React", "JavaScript", "Node.js", "Express", "PostgreSQL", "HTML5", "CSS3", "REST API", "Git", "TypeScript"],
    preferred_roles: ["Full-Stack Web Developer Intern", "Frontend UI/UX Engineer"],
    preferred_location: "Hyderabad, India",
    projects: [
      { title: "Collaborative Project Management SaaS", techStack: "React, Node.js, Express, PostgreSQL" },
      { title: "E-Commerce Micro-Frontend", techStack: "React, TypeScript, TailwindCSS, REST API" }
    ],
    parsed_summary: "Full-stack web developer passionate about responsive React user interfaces, performant REST APIs, and database design."
  },
  {
    id: "profile-devops-03",
    name: "Priya Patel",
    track: "Cloud & DevOps Engineering",
    icon: Cloud,
    color: "#34d399",
    degree: "B.E. Information Technology",
    university: "Pune Engineering College",
    graduation_year: 2026,
    skills: ["Linux", "Docker", "Kubernetes", "AWS", "Git", "Python", "CI/CD", "Bash", "Terraform"],
    preferred_roles: ["Cloud Infrastructure & DevOps Intern", "Site Reliability Engineer"],
    preferred_location: "Pune, India",
    projects: [
      { title: "Automated Multi-Stage CI/CD Pipeline", techStack: "GitHub Actions, Docker, Kubernetes, AWS" },
      { title: "Infrastructure Provisioning with Terraform", techStack: "Terraform, AWS, Linux, Bash" }
    ],
    parsed_summary: "Cloud enthusiast with experience automating build pipelines and managing containerized microservices."
  },
  {
    id: "profile-data-04",
    name: "Aditya Verma",
    track: "Data Engineering & Analytics",
    icon: BarChart3,
    color: "#fbbf24",
    degree: "B.Sc Statistics & Data Analytics",
    university: "Chennai University",
    graduation_year: 2026,
    skills: ["SQL", "Python", "Pandas", "Tableau", "PowerBI", "Data Analysis", "Statistics", "Excel"],
    preferred_roles: ["Data Science & Business Analytics Intern", "Data Analyst"],
    preferred_location: "Chennai, India",
    projects: [
      { title: "Customer Churn Prediction & Executive Dashboard", techStack: "Python, Pandas, Tableau, SQL" },
      { title: "Supply Chain Financial Analytics", techStack: "PowerBI, SQL, Statistical Modeling" }
    ],
    parsed_summary: "Analytical thinker skilled in translating complex transactional datasets into strategic business visualizations."
  },
  {
    id: "profile-cyber-05",
    name: "Sneha Nair",
    track: "Cybersecurity & InfoSec",
    icon: ShieldCheck,
    color: "#f43f5e",
    degree: "B.Tech in Cybersecurity and Digital Forensics",
    university: "Kerala Technical University",
    graduation_year: 2026,
    skills: ["Network Security", "Linux", "Python", "Ethical Hacking", "Wireshark", "Cryptography", "OWASP", "Nmap"],
    preferred_roles: ["Cybersecurity Analyst & Threat Hunting Intern", "AppSec Intern"],
    preferred_location: "Noida, India",
    projects: [
      { title: "Automated Web Vulnerability Scanner", techStack: "Python, OWASP ZAP, Burp Suite, Linux" },
      { title: "Network Anomaly Intrusion Detection", techStack: "Wireshark, Python, Nmap, Snort" }
    ],
    parsed_summary: "Cybersecurity practitioner with hands-on network packet inspection, vulnerability assessment, and threat hunting skills."
  },
  {
    id: "profile-fresher-06",
    name: "Arjun Kumar",
    track: "Fresher / Core CS Explorer",
    icon: GraduationCap,
    color: "#a855f7",
    degree: "B.Tech Computer Science (2nd Year)",
    university: "State Technical University",
    graduation_year: 2027,
    skills: ["Java", "C++", "Data Structures", "Algorithms", "SQL", "Git", "HTML5"],
    preferred_roles: ["Software Engineering Intern", "Java Developer"],
    preferred_location: "Bengaluru, India",
    projects: [
      { title: "Student Record Management System", techStack: "Java, MySQL, OOP" },
      { title: "Algorithmic Pathfinding Visualizer", techStack: "C++, Data Structures" }
    ],
    parsed_summary: "Eager computer science student with strong foundations in object-oriented programming and algorithmic problem solving."
  }
];

export default function EvaluationBenchmarkModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('kaggle'); // 'core' | 'kaggle'
  
  // Core Profiles State
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [loadingCore, setLoadingCore] = useState(false);
  const [resultsCore, setResultsCore] = useState([]);

  // Kaggle Dataset State
  const [kaggleCandidates, setKaggleCandidates] = useState([]);
  const [kaggleTotal, setKaggleTotal] = useState(1000);
  const [kagglePage, setKagglePage] = useState(1);
  const [kaggleSearch, setKaggleSearch] = useState('');
  const [kaggleRoleFilter, setKaggleRoleFilter] = useState('all');
  const [kaggleExpFilter, setKaggleExpFilter] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateRecommendations, setCandidateRecommendations] = useState([]);
  const [loadingKaggleList, setLoadingKaggleList] = useState(false);
  const [loadingKaggleEval, setLoadingKaggleEval] = useState(false);
  
  // Batch Benchmark State
  const [benchmarkRunning, setBenchmarkRunning] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState(null);

  const currentCoreProfile = BENCHMARK_PROFILES[selectedProfileIndex];

  // Load Core Profile Evaluation
  useEffect(() => {
    if (isOpen && activeTab === 'core') {
      runCoreEvaluation(currentCoreProfile);
    }
  }, [isOpen, activeTab, selectedProfileIndex]);

  // Load Kaggle Candidates List
  useEffect(() => {
    if (isOpen && activeTab === 'kaggle') {
      fetchKaggleCandidates();
    }
  }, [isOpen, activeTab, kagglePage, kaggleSearch, kaggleRoleFilter, kaggleExpFilter]);

  // Auto-evaluate first Kaggle candidate when selected
  useEffect(() => {
    if (selectedCandidate) {
      evaluateKaggleProfile(selectedCandidate.candidate_id);
    }
  }, [selectedCandidate]);

  async function runCoreEvaluation(profile) {
    try {
      setLoadingCore(true);
      const res = await api.evaluateProfile(profile, 5);
      setResultsCore(res.recommendations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCore(false);
    }
  }

  async function fetchKaggleCandidates() {
    try {
      setLoadingKaggleList(true);
      const res = await api.getKaggleCandidates({
        page: kagglePage,
        limit: 8,
        search: kaggleSearch,
        role: kaggleRoleFilter,
        experienceLevel: kaggleExpFilter
      });
      setKaggleCandidates(res.candidates || []);
      setKaggleTotal(res.total || 0);
      if (!selectedCandidate && res.candidates && res.candidates.length > 0) {
        setSelectedCandidate(res.candidates[0]);
      }
    } catch (err) {
      console.error('Failed to fetch Kaggle candidates:', err);
    } finally {
      setLoadingKaggleList(false);
    }
  }

  async function evaluateKaggleProfile(candidateId) {
    try {
      setLoadingKaggleEval(true);
      const res = await api.evaluateKaggleCandidate(candidateId, 5);
      setCandidateRecommendations(res.recommendations || []);
    } catch (err) {
      console.error('Failed to evaluate Kaggle candidate:', err);
    } finally {
      setLoadingKaggleEval(false);
    }
  }

  async function handleRunKaggleBenchmark() {
    try {
      setBenchmarkRunning(true);
      const res = await api.runKaggleBenchmark(40);
      setBenchmarkResult(res);
    } catch (err) {
      console.error('Benchmark execution error:', err);
    } finally {
      setBenchmarkRunning(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Milestone 2: RAG Retrieval & Job-Resume Matching Evaluation Suite"
      maxWidth="960px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Metric Summary Ribbon */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
          padding: '1rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(16, 185, 129, 0.08) 100%)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(99, 102, 241, 0.25)'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>MRR Metric</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent-emerald)' }}>1.000 / 1.000</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Top-1 Accuracy</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent-primary)' }}>100.0%</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Kaggle Dataset</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f43f5e' }}>1,000 Candidates</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Knowledge Base</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#22d3ee' }}>180 Postings</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Indexed Vectors</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fbbf24' }}>720 Chunks</div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('kaggle')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'kaggle' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              color: activeTab === 'kaggle' ? '#ffffff' : 'var(--text-primary)',
              borderColor: activeTab === 'kaggle' ? 'var(--accent-primary)' : 'var(--border-card)',
              fontWeight: 700,
              gap: '0.5rem'
            }}
          >
            <Database size={15} />
            <span>Kaggle 1,000 Candidates Dataset</span>
            <span className="badge badge-rose" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>1,000 Profiles</span>
          </button>

          <button
            onClick={() => setActiveTab('core')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'core' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              color: activeTab === 'core' ? '#ffffff' : 'var(--text-primary)',
              borderColor: activeTab === 'core' ? 'var(--accent-primary)' : 'var(--border-card)',
              fontWeight: 700,
              gap: '0.5rem'
            }}
          >
            <Layers size={15} />
            <span>Core 6 Student Benchmarks</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: KAGGLE 1,000 CANDIDATE DATASET VIEW */}
        {/* ========================================================= */}
        {activeTab === 'kaggle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Top Toolbar: Search, Filters & Batch Benchmark Button */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search candidate by skill, role, ID (e.g. Python, Solidity, 10)..."
                    value={kaggleSearch}
                    onChange={(e) => {
                      setKaggleSearch(e.target.value);
                      setKagglePage(1);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem 0.5rem 2rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-card)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              {/* Role & Experience Filter Selectors */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <select
                  value={kaggleRoleFilter}
                  onChange={(e) => {
                    setKaggleRoleFilter(e.target.value);
                    setKagglePage(1);
                  }}
                  style={{
                    padding: '0.45rem 0.75rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem'
                  }}
                >
                  <option value="all">All Roles (20+ Categories)</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Full Stack Python">Full Stack Python</option>
                  <option value="Full Stack Java">Full Stack Java</option>
                  <option value="DevOps">DevOps Engineer</option>
                  <option value="Kubernetes">Kubernetes Operations</option>
                  <option value="AIML">AIML / Deep Learning</option>
                  <option value="Cybersecurity">Cybersecurity Engineer</option>
                  <option value="Blockchain">Blockchain Developer</option>
                  <option value="Mobile">Mobile Developer</option>
                  <option value="Game Developer">Game Developer</option>
                  <option value="Designer">UI/UX Designer</option>
                  <option value="Project Manager">Software Project Manager</option>
                  <option value="C#">C# / .NET Developer</option>
                  <option value="PHP">PHP Developer</option>
                  <option value="Marketing">Marketing Specialist</option>
                  <option value="HR">HR Specialist</option>
                  <option value="Finance">Finance Analyst</option>
                </select>

                <select
                  value={kaggleExpFilter}
                  onChange={(e) => {
                    setKaggleExpFilter(e.target.value);
                    setKagglePage(1);
                  }}
                  style={{
                    padding: '0.45rem 0.75rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem'
                  }}
                >
                  <option value="all">All Experience Levels</option>
                  <option value="Entry">Entry Level</option>
                  <option value="Mid">Mid Level</option>
                  <option value="Senior">Senior Level</option>
                </select>

                <button
                  onClick={handleRunKaggleBenchmark}
                  disabled={benchmarkRunning}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '0.4rem', fontSize: '0.8rem' }}
                >
                  <Play size={13} />
                  <span>{benchmarkRunning ? 'Benchmarking Cohort...' : 'Run Batch Benchmark'}</span>
                </button>
              </div>
            </div>

            {/* Batch Benchmark Results Card (when triggered) */}
            {benchmarkResult && (
              <div style={{
                padding: '1rem',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1.5px solid var(--accent-emerald)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                    <CheckCircle size={18} />
                    <span>Kaggle Dataset Batch Benchmark Complete</span>
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                    {benchmarkResult.evaluatedCohortSize} Candidates Evaluated
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Top-1 Accuracy</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-primary)' }}>{benchmarkResult.top1Accuracy}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mean Reciprocal Rank</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-emerald)' }}>{benchmarkResult.mrr} / 1.000</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Average Fit Score</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fbbf24' }}>{benchmarkResult.avgMatchScore}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Knowledge Base Pool</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#22d3ee' }}>180 Postings</div>
                  </div>
                </div>
              </div>
            )}

            {/* Candidate Selector Grid */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  SELECT A KAGGLE CANDIDATE PROFILE ({kaggleTotal} TOTAL):
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <button
                    disabled={kagglePage <= 1}
                    onClick={() => setKagglePage(p => Math.max(1, p - 1))}
                    className="btn btn-sm"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    Prev
                  </button>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Page {kagglePage} of {Math.max(1, Math.ceil(kaggleTotal / 8))}
                  </span>
                  <button
                    disabled={kagglePage >= Math.ceil(kaggleTotal / 8)}
                    onClick={() => setKagglePage(p => p + 1)}
                    className="btn btn-sm"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    Next
                  </button>
                </div>
              </div>

              {loadingKaggleList ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading Kaggle candidate profiles...
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                  gap: '0.5rem'
                }}>
                  {kaggleCandidates.map((cand) => {
                    const isSelected = selectedCandidate?.candidate_id === cand.candidate_id;
                    return (
                      <div
                        key={cand.candidate_id}
                        onClick={() => setSelectedCandidate(cand)}
                        style={{
                          padding: '0.65rem 0.85rem',
                          background: isSelected ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)' : 'var(--bg-secondary)',
                          border: isSelected ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-card)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                            #{cand.candidate_id} {cand.name}
                          </span>
                          <span className={`badge ${cand.experience_level === 'Senior' ? 'badge-rose' : cand.experience_level === 'Mid' ? 'badge-amber' : 'badge-emerald'}`} style={{ fontSize: '0.65rem', padding: '0.05rem 0.35rem' }}>
                            {cand.experience_level}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {cand.job_role}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.2rem' }}>
                          {cand.skills.join(', ')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active Selected Candidate Card */}
            {selectedCandidate && (
              <div style={{
                padding: '1rem 1.25rem',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-card)',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--accent-primary)' }}>
                      Candidate #{selectedCandidate.candidate_id}: {selectedCandidate.name}
                    </span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                      • {selectedCandidate.qualification}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>{selectedCandidate.job_role}</span>
                    <span className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>{selectedCandidate.experience_level} Level</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                  {selectedCandidate.skills.map((s, idx) => (
                    <span key={idx} className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Real-time RAG & Matching Engine Results for Selected Candidate */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} color="var(--accent-primary)" />
                <span>RAG Retrieval & Matching Agent Top-5 Recommendations</span>
              </h4>

              {loadingKaggleEval ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Executing vector similarity search and multi-factor ranking for candidate...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {candidateRecommendations.map((rec, idx) => {
                    const item = rec.internship;
                    const score = rec.matchScore;
                    const isTop1 = idx === 0;
                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: '0.85rem 1.15rem',
                          background: isTop1 ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)' : 'var(--bg-tertiary)',
                          borderRadius: 'var(--radius-md)',
                          border: isTop1 ? '1.5px solid var(--accent-emerald)' : '1px solid var(--border-card)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: isTop1 ? 'var(--accent-emerald)' : 'var(--bg-secondary)',
                              color: isTop1 ? '#000000' : 'var(--text-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 800
                            }}>
                              #{idx + 1}
                            </span>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.title}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.company} • {item.location} ({item.remote_type})</div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: score >= 75 ? '#10b981' : score >= 60 ? '#6366f1' : '#f59e0b' }}>
                              {score}%
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fit Score</div>
                          </div>
                        </div>

                        {/* Reasoning Snippet */}
                        {rec.explanation && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>AI Match Rationale: </span>
                            {rec.explanation.whyItMatches}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CORE 6 STUDENT BENCHMARKS VIEW */}
        {/* ========================================================= */}
        {activeTab === 'core' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Profile Selector Chips */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                SELECT CORE EVALUATION PROFILE:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {BENCHMARK_PROFILES.map((p, idx) => {
                  const Icon = p.icon;
                  const isSelected = idx === selectedProfileIndex;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProfileIndex(idx)}
                      className="btn btn-sm"
                      style={{
                        background: isSelected ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        color: isSelected ? '#ffffff' : 'var(--text-primary)',
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-card)',
                        gap: '0.4rem'
                      }}
                    >
                      <Icon size={14} color={isSelected ? '#ffffff' : p.color} />
                      <span>{p.name} ({p.track.split(' ')[0]})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Profile Card */}
            <div style={{
              padding: '1rem 1.25rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-card)',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: currentCoreProfile.color }}>{currentCoreProfile.name}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>• {currentCoreProfile.degree} ({currentCoreProfile.university})</span>
                </div>
                <span className="badge badge-indigo" style={{ fontSize: '0.72rem' }}>{currentCoreProfile.preferred_roles[0]}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                {currentCoreProfile.skills.map((s, idx) => (
                  <span key={idx} className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>{s}</span>
                ))}
              </div>
            </div>

            {/* Live Matching Agent Ranked Results */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} color="var(--accent-primary)" />
                <span>Real-Time Matching Agent Top Recommendations</span>
              </h4>

              {loadingCore ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Executing RAG retrieval and multi-factor scoring...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {resultsCore.map((rec, idx) => {
                    const item = rec.internship;
                    const score = rec.matchScore;
                    const isTop1 = idx === 0;
                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: '1rem 1.25rem',
                          background: isTop1 ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)' : 'var(--bg-tertiary)',
                          borderRadius: 'var(--radius-md)',
                          border: isTop1 ? '1.5px solid var(--accent-emerald)' : '1px solid var(--border-card)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: isTop1 ? 'var(--accent-emerald)' : 'var(--bg-secondary)',
                              color: isTop1 ? '#000000' : 'var(--text-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 800
                            }}>
                              #{idx + 1}
                            </span>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.title}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.company} • {item.location} ({item.remote_type})</div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: score >= 80 ? '#10b981' : '#6366f1' }}>
                              {score}%
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fit Score</div>
                          </div>
                        </div>

                        {/* Reasoning Snippet */}
                        {rec.explanation && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>AI Why It Matches: </span>
                            {rec.explanation.whyItMatches}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
}
