-- AI Career Companion SQLite Database Schema

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    phone TEXT,
    university TEXT,
    degree TEXT,
    graduation_year INTEGER,
    location TEXT,
    preferred_location TEXT,
    preferred_roles TEXT, -- JSON array of strings e.g. ["Full Stack Developer", "AI Engineer"]
    technical_skills TEXT, -- JSON array of strings e.g. ["React", "Node.js", "Python"]
    soft_skills TEXT, -- JSON array of strings e.g. ["Teamwork", "Communication"]
    experience_json TEXT, -- JSON array of work/internship items
    projects_json TEXT, -- JSON array of student projects
    certifications_json TEXT, -- JSON array of certifications
    preferred_industries TEXT, -- JSON array of industries
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resumes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    parsed_summary TEXT,
    detected_skills_json TEXT, -- Categorized skills: { programming: [], web: [], aiData: [], cloud: [], tools: [], soft: [] }
    strengths_json TEXT, -- JSON array of identified strengths
    weaknesses_json TEXT, -- JSON array of identified gaps / areas of improvement
    recommended_skills_json TEXT, -- JSON array of skills to learn next
    career_suggestions_json TEXT, -- JSON array of recommended roles
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS internships (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    remote_type TEXT NOT NULL, -- 'Remote' | 'Hybrid' | 'On-site'
    description TEXT NOT NULL,
    required_skills_json TEXT NOT NULL, -- JSON array of strings
    preferred_qualifications TEXT,
    duration TEXT, -- e.g. '3 Months', '6 Months'
    stipend TEXT, -- e.g. '$2,500/month' or '₹25,000/month'
    apply_url TEXT,
    source TEXT NOT NULL, -- 'Infosys Springboard', 'RemoteOK', 'Adzuna', 'Campus Portal'
    posted_date TEXT,
    deadline TEXT,
    industry TEXT DEFAULT 'Technology',
    is_demo INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS saved_internships (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    internship_id TEXT NOT NULL,
    status TEXT DEFAULT 'saved', -- 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected'
    notes TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(internship_id) REFERENCES internships(id) ON DELETE CASCADE,
    UNIQUE(user_id, internship_id)
);

CREATE TABLE IF NOT EXISTS interview_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    internship_id TEXT,
    role_title TEXT NOT NULL,
    difficulty TEXT DEFAULT 'Intermediate', -- 'Beginner' | 'Intermediate' | 'Advanced'
    interview_type TEXT DEFAULT 'Technical', -- 'Technical' | 'Behavioral' | 'HR' | 'Mixed'
    overall_score REAL DEFAULT 0,
    technical_score REAL DEFAULT 0,
    communication_score REAL DEFAULT 0,
    relevance_score REAL DEFAULT 0,
    feedback_summary TEXT,
    strengths_json TEXT,
    improvements_json TEXT,
    recommendations_json TEXT,
    status TEXT DEFAULT 'in_progress', -- 'in_progress' | 'completed'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS interview_exchanges (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    category TEXT, -- 'Technical' | 'Behavioral' | 'Scenario' | 'Resume'
    user_answer TEXT,
    score REAL, -- 0 to 100
    technical_score REAL,
    communication_score REAL,
    relevance_score REAL,
    feedback TEXT,
    key_points TEXT, -- JSON array of what user did well
    missed_points TEXT, -- JSON array of what was missing
    ideal_answer_points TEXT, -- JSON array or text
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES interview_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user' | 'assistant'
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_user_id ON saved_internships(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_exchanges_session ON interview_exchanges(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
