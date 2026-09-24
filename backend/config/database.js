import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL_ENV);
const localDbPath = path.join(__dirname, '..', 'data', 'career_companion.sqlite');
const dbFilePath = isServerless ? path.join('/tmp', 'career_companion.sqlite') : localDbPath;

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || process.env.POSTGRES_URL;

let pgPool = null;
let dbInstance = null;
let SQL = null;

if (databaseUrl) {
  try {
    const isLocal = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
    pgPool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: isLocal ? false : { rejectUnauthorized: false }
    });
    console.log('[Database] 🌐 Initialized Supabase / PostgreSQL Cloud Client');
  } catch (pgErr) {
    console.warn('[Database] Failed to initialize PostgreSQL pool, falling back to SQLite:', pgErr.message);
    pgPool = null;
  }
}

async function loadSqlEngine() {
  if (SQL) return SQL;

  // Primary: sql-asm (Pure JS engine, 100% serverless/cloud safe without WASM file path dependencies)
  try {
    const initSqlAsm = (await import('sql.js/dist/sql-asm.js')).default;
    SQL = await initSqlAsm();
    return SQL;
  } catch (asmErr) {
    console.warn('[Database] sql-asm fallback notice:', asmErr.message);
  }

  // Fallback: Standard initSqlJs
  try {
    const initSqlJs = (await import('sql.js')).default;
    SQL = await initSqlJs({
      locateFile: (file) => {
        const potentialPaths = [
          path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
          path.join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', file)
        ];
        for (const p of potentialPaths) {
          if (fs.existsSync(p)) return p;
        }
        return file;
      }
    });
    return SQL;
  } catch (wasmErr) {
    console.error('[Database] Failed to initialize SQL engine:', wasmErr.message);
    throw wasmErr;
  }
}

async function initPgTables() {
  if (!pgPool) return;
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS profiles (
          id TEXT PRIMARY KEY,
          user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          phone TEXT,
          university TEXT,
          degree TEXT,
          graduation_year INTEGER,
          location TEXT,
          preferred_location TEXT,
          preferred_roles TEXT,
          technical_skills TEXT,
          soft_skills TEXT,
          experience_json TEXT,
          projects_json TEXT,
          certifications_json TEXT,
          preferred_industries TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS resumes (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          filename TEXT NOT NULL,
          file_type TEXT NOT NULL,
          raw_text TEXT NOT NULL,
          parsed_summary TEXT,
          detected_skills_json TEXT,
          strengths_json TEXT,
          weaknesses_json TEXT,
          recommended_skills_json TEXT,
          career_suggestions_json TEXT,
          uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS internships (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          company TEXT NOT NULL,
          location TEXT NOT NULL,
          remote_type TEXT NOT NULL,
          description TEXT NOT NULL,
          responsibilities_json TEXT,
          required_skills_json TEXT NOT NULL,
          preferred_skills_json TEXT,
          preferred_qualifications TEXT,
          experience_requirements TEXT,
          education_requirements TEXT,
          duration TEXT DEFAULT '3 Months',
          stipend TEXT DEFAULT '₹25,000/month',
          apply_url TEXT,
          source TEXT DEFAULT 'Curated',
          posted_date TEXT DEFAULT '2026-08-01',
          deadline TEXT DEFAULT '2026-10-01',
          industry TEXT DEFAULT 'Technology',
          is_demo INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS saved_internships (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          internship_id TEXT NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS interview_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          internship_id TEXT REFERENCES internships(id) ON DELETE SET NULL,
          role_title TEXT NOT NULL,
          company TEXT,
          overall_score REAL DEFAULT 0,
          status TEXT DEFAULT 'in_progress',
          feedback_json TEXT,
          started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          completed_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS interview_messages (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
          sender TEXT NOT NULL,
          content TEXT NOT NULL,
          score REAL,
          feedback TEXT,
          model_answer TEXT,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS assistant_chats (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          sender TEXT NOT NULL,
          content TEXT NOT NULL,
          metadata_json TEXT,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS internship_chunks (
          id TEXT PRIMARY KEY,
          internship_id TEXT NOT NULL REFERENCES internships(id) ON DELETE CASCADE,
          chunk_index INTEGER NOT NULL,
          chunk_type TEXT NOT NULL,
          chunk_text TEXT NOT NULL,
          metadata_json TEXT,
          embedding_json TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tailored_applications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          internship_id TEXT,
          role_title TEXT NOT NULL,
          company TEXT NOT NULL,
          tailored_resume_json TEXT,
          cover_letter TEXT,
          ats_score REAL DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[Database] ✅ Supabase PostgreSQL schema initialized and verified.');
  } catch (err) {
    console.error('[Database] PostgreSQL schema initialization error:', err.message);
  }
}

export async function getDatabase() {
  if (pgPool) {
    await initPgTables();
    return pgPool;
  }

  if (dbInstance) return dbInstance;

  SQL = await loadSqlEngine();

  try {
    if (fs.existsSync(dbFilePath)) {
      const fileBuffer = fs.readFileSync(dbFilePath);
      dbInstance = new SQL.Database(fileBuffer);
    } else if (isServerless && fs.existsSync(localDbPath)) {
      const fileBuffer = fs.readFileSync(localDbPath);
      dbInstance = new SQL.Database(fileBuffer);
      saveDatabase();
    } else {
      dbInstance = new SQL.Database();
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
        dbInstance.run(schemaSql);
      }
      saveDatabase();
    }

    // Run non-destructive schema migrations (Milestone 2 & 3 support)
    try {
      dbInstance.run(`
        CREATE TABLE IF NOT EXISTS internship_chunks (
          id TEXT PRIMARY KEY,
          internship_id TEXT NOT NULL,
          chunk_index INTEGER NOT NULL,
          chunk_type TEXT NOT NULL,
          chunk_text TEXT NOT NULL,
          metadata_json TEXT,
          embedding_json TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(internship_id) REFERENCES internships(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_chunks_internship_id ON internship_chunks(internship_id);
        CREATE INDEX IF NOT EXISTS idx_chunks_type ON internship_chunks(chunk_type);

        CREATE TABLE IF NOT EXISTS tailored_applications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          internship_id TEXT,
          role_title TEXT NOT NULL,
          company TEXT NOT NULL,
          tailored_resume_json TEXT,
          cover_letter TEXT,
          ats_score REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_tailored_applications_user_id ON tailored_applications(user_id);
      `);

      const cols = ['responsibilities_json', 'preferred_skills_json', 'experience_requirements', 'education_requirements'];
      for (const col of cols) {
        try {
          dbInstance.run(`ALTER TABLE internships ADD COLUMN ${col} TEXT;`);
        } catch (alterErr) {}
      }
    } catch (migErr) {
      console.warn('[Database] Schema migration notice:', migErr.message);
    }
  } catch (err) {
    console.warn('[Database] Error loading database file, initializing in-memory fallback:', err.message);
    dbInstance = new SQL.Database();
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
        dbInstance.run(schemaSql);
      }
    } catch (schemaErr) {
      console.error('[Database] Failed to initialize schema:', schemaErr.message);
    }
  }

  return dbInstance;
}

export function saveDatabase() {
  if (pgPool) return; // Supabase Postgres commits transactions immediately
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    const dir = path.dirname(dbFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbFilePath, buffer);
  } catch (err) {
    console.warn('[Database] Notice: disk write skipped/failed:', err.message);
  }
}

function convertSqliteToPg(sql) {
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

// Universal Helper wrapper for clean SQL queries across SQLite and Supabase PostgreSQL
export const db = {
  async get(sql, params = []) {
    if (pgPool) {
      const pgSql = convertSqliteToPg(sql);
      const res = await pgPool.query(pgSql, params);
      return res.rows[0] || null;
    }
    const database = await getDatabase();
    const stmt = database.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  },

  async all(sql, params = []) {
    if (pgPool) {
      const pgSql = convertSqliteToPg(sql);
      const res = await pgPool.query(pgSql, params);
      return res.rows;
    }
    const database = await getDatabase();
    const stmt = database.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  async run(sql, params = []) {
    if (pgPool) {
      const pgSql = convertSqliteToPg(sql);
      await pgPool.query(pgSql, params);
      return { success: true };
    }
    const database = await getDatabase();
    database.run(sql, params);
    saveDatabase();
    return { success: true };
  },

  async exec(sql) {
    if (pgPool) {
      await pgPool.query(sql);
      return { success: true };
    }
    const database = await getDatabase();
    database.exec(sql);
    saveDatabase();
    return { success: true };
  }
};
