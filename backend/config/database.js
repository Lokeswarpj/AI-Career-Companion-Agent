import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL_ENV);
const localDbPath = path.join(__dirname, '..', 'data', 'career_companion.sqlite');
const dbFilePath = isServerless ? path.join('/tmp', 'career_companion.sqlite') : localDbPath;

let dbInstance = null;
let SQL = null;

export async function getDatabase() {
  if (dbInstance) return dbInstance;

  SQL = await initSqlJs();

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

    // Run non-destructive schema migrations (Milestone 2 support)
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
      `);

      // Add columns to internships if missing
      const cols = ['responsibilities_json', 'preferred_skills_json', 'experience_requirements', 'education_requirements'];
      for (const col of cols) {
        try {
          dbInstance.run(`ALTER TABLE internships ADD COLUMN ${col} TEXT;`);
        } catch (alterErr) {
          // Column already exists, ignore
        }
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

// Helper wrapper for clean SQL queries
export const db = {
  async get(sql, params = []) {
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
    const database = await getDatabase();
    database.run(sql, params);
    saveDatabase();
    return { success: true };
  },

  async exec(sql) {
    const database = await getDatabase();
    database.exec(sql);
    saveDatabase();
    return { success: true };
  }
};
