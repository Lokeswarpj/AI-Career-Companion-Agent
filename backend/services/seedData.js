import { db } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildKnowledgeBase } from './ragService.js';
import { vectorStore } from './vectorStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ensures permanent default user accounts are always seeded on server startup / rebuilds.
 */
export async function seedDefaultAccountsIfNeeded() {
  try {
    const defaultAccounts = [
      {
        email: 'student.demo@infosys.com',
        password: 'DemoPass@123',
        full_name: 'Aanya Sharma',
        degree: 'B.Tech in Artificial Intelligence & Data Science',
        university: 'National Institute of Technology',
        graduation_year: 2026,
        gpa: '9.2 / 10.0',
        preferred_roles: ['AI & Machine Learning Engineering Intern', 'NLP Research Intern'],
        technical_skills: ['Python', 'PyTorch', 'TensorFlow', 'NLP', 'BERT', 'Transformers', 'FastAPI', 'Docker', 'Git'],
        soft_skills: ['Communication', 'Research', 'Analytical Problem Solving'],
        experience: [],
        projects: [],
        certifications: ['Deep Learning Specialization - Coursera'],
        preferred_industries: ['Artificial Intelligence & ML']
      }
    ];

    for (const acc of defaultAccounts) {
      const existing = await db.get("SELECT id FROM users WHERE email = ?", [acc.email.toLowerCase()]);
      if (!existing) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(acc.password, salt);
        const userId = uuidv4();
        const profileId = uuidv4();

        await db.run(
          "INSERT INTO users (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)",
          [userId, acc.email.toLowerCase(), password_hash, acc.full_name]
        );

        await db.run(
          `INSERT INTO profiles 
           (id, user_id, degree, university, graduation_year, preferred_roles, technical_skills, soft_skills, experience_json, projects_json, certifications_json, preferred_industries) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            profileId,
            userId,
            acc.degree || 'B.Tech in Computer Science',
            acc.university || 'University',
            acc.graduation_year || 2026,
            JSON.stringify(acc.preferred_roles || []),
            JSON.stringify(acc.technical_skills || []),
            JSON.stringify(acc.soft_skills || []),
            JSON.stringify(acc.experience || []),
            JSON.stringify(acc.projects || []),
            JSON.stringify(acc.certifications || []),
            JSON.stringify(acc.preferred_industries || [])
          ]
        );
        console.log(`[SeedData] ✅ Auto-seeded demo student account: ${acc.email}`);
      }
    }

    // 🧹 Auto-clean any previously hardcoded mock profile data from real user accounts (e.g. lokeswarpj4@gmail.com or newly registered users)
    // if they have not yet uploaded an authentic resume.
    const nonDemoUsers = await db.all("SELECT id, email FROM users WHERE email != 'student.demo@infosys.com'");
    if (Array.isArray(nonDemoUsers)) {
      for (const u of nonDemoUsers) {
        const resumeRow = await db.get("SELECT COUNT(*) as count FROM resumes WHERE user_id = ?", [u.id]);
        const resumeCount = resumeRow ? parseInt(resumeRow.count, 10) || 0 : 0;
        if (resumeCount === 0) {
          const prof = await db.get("SELECT * FROM profiles WHERE user_id = ?", [u.id]);
          if (prof) {
            await db.run(
              `UPDATE profiles SET
                technical_skills = '[]',
                soft_skills = '[]',
                projects_json = '[]',
                experience_json = '[]',
                updated_at = CURRENT_TIMESTAMP
               WHERE user_id = ?`,
              [u.id]
            );
            console.log(`[SeedData] 🧹 Cleared orphaned profile skills for user without resume: ${u.email}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('[SeedData] Error seeding default accounts:', err);
  }
}

export async function seedInternshipsIfNeeded(force = false) {
  try {
    // 1. Ensure permanent user accounts exist
    await seedDefaultAccountsIfNeeded();

    // 2. Ensure curated knowledge base exists
    const datasetPath = path.join(__dirname, '..', 'data', 'curated_internships.json');
    let curatedList = [];

    if (fs.existsSync(datasetPath)) {
      const fileData = fs.readFileSync(datasetPath, 'utf-8');
      curatedList = JSON.parse(fileData);
    }

    const countRow = await db.get("SELECT COUNT(*) as count FROM internships");
    const count = countRow ? parseInt(countRow.count, 10) || 0 : 0;

    const isForcedOrNeeded = force || (process.env.AUTO_SEED === 'true' && count < 150) || count < 50;

    // If forced or database needs initial population, seed the full curated knowledge base
    if (isForcedOrNeeded && curatedList.length > 0) {
      console.log(`[SeedData] Seeding comprehensive internship knowledge base (${curatedList.length} curated postings)...`);
      
      // Clear legacy items and chunks
      await db.run("DELETE FROM internships");
      await db.run("DELETE FROM internship_chunks");

      for (const item of curatedList) {
        await db.run(
          `INSERT INTO internships 
           (id, title, company, location, remote_type, description, responsibilities_json, required_skills_json, preferred_skills_json, preferred_qualifications, experience_requirements, education_requirements, duration, stipend, apply_url, source, posted_date, deadline, industry, is_demo) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            item.title,
            item.company,
            item.location,
            item.remote_type,
            item.description,
            JSON.stringify(item.responsibilities || []),
            JSON.stringify(item.required_skills || []),
            JSON.stringify(item.preferred_skills || []),
            item.qualifications || '',
            item.experience_requirements || '',
            item.education_requirements || '',
            item.duration || '3 Months',
            item.stipend || '₹25,000/month',
            item.apply_url || '',
            item.source || 'Curated',
            item.posted_date || '2026-08-01',
            item.deadline || '2026-10-01',
            item.industry || 'Technology',
            item.is_demo || 0
          ]
        );
      }
      console.log(`[SeedData] Inserted ${curatedList.length} internships into SQLite.`);

      // Build RAG knowledge base & vector index
      const allJobs = await db.all("SELECT * FROM internships");
      await buildKnowledgeBase(allJobs);
    } else {
      // Initialize vector store in-memory index from existing SQLite database chunks
      const chunkCountRow = await db.get("SELECT COUNT(*) as count FROM internship_chunks");
      const chunkCount = chunkCountRow ? parseInt(chunkCountRow.count, 10) || 0 : 0;
      if (chunkCount === 0) {
        console.log('[SeedData] Building vector chunks for existing internship database...');
        const allJobs = await db.all("SELECT * FROM internships");
        await buildKnowledgeBase(allJobs);
      } else {
        await vectorStore.initialize();
      }
    }
  } catch (err) {
    console.error('[SeedData] Error during internship knowledge base seeding:', err);
  }
}
